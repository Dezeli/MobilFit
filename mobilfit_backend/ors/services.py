import requests
from decouple import config
from .utils.ors_client import get_route_from_ors, get_elevations_from_ors
from .utils.crossings import get_deduped_crossings
from .utils.elevation import calculate_avg_slope_percent, calculate_elevation_weight
from .utils.fare import calculate_bike_fares

ORS_API_KEY = config("ORS_API_KEY")

def get_full_route_data(start: dict, end: dict) -> dict:
    route_configs = [
        # cycling-regular
        {"profile": "cycling-regular", "preference": "recommended"},
        {"profile": "cycling-regular", "preference": "fastest"}, 
        {"profile": "cycling-regular", "preference": "shortest"},
    ]
    
    raw_routes = {}
    
    for i, config in enumerate(route_configs):
        route = get_route_from_ors(start, end, config["profile"], config["preference"])
        if route:
            route_key = f"{config['profile']}_{config['preference']}_{i}"
            raw_routes[route_key] = route
    
    if not raw_routes:
        return {}
    
    unique_routes = {}
    seen_coordinates = []
    
    for route_key, route in raw_routes.items():
        coordinates = route["coordinates"]
        
        is_duplicate = False
        for seen_coords in seen_coordinates:
            if coordinates == seen_coords:
                is_duplicate = True
                break
        
        if not is_duplicate:
            unique_routes[route_key] = route
            seen_coordinates.append(coordinates)
    
    calculated_routes = {}
    
    for route_key, route in unique_routes.items():
        coordinates = route["coordinates"]
        waytypes = route["waytypes"]
        duration = route["duration"]
        distance = route["distance"]

        elevations = get_elevations_from_ors(coordinates)
        elevation_weight = calculate_elevation_weight(elevations, coordinates)
        avg_slope = calculate_avg_slope_percent(elevations, coordinates)

        crossings = get_deduped_crossings(coordinates)
        crossing_delay = sum(
            1.0 if c["count"] >= 4 else
            0.9 if c["count"] == 3 else
            0.7 if c["count"] == 2 else
            0.4 if c["count"] == 1 else 0
            for c in crossings
        )

        bike_lane_ratio = waytypes.count(6) / len(waytypes) if waytypes else 0
        non_bike_ratio = 1 - bike_lane_ratio
        bike_adjusted_sec = bike_lane_ratio * duration * 0.9 + non_bike_ratio * duration

        adjusted_time_min = (bike_adjusted_sec / 60) * elevation_weight + crossing_delay
        distance_km = distance / 1000
        fare_list = calculate_bike_fares(adjusted_time_min, distance_km)

        calculated_routes[route_key] = {
            "coordinates": coordinates,
            "waytypes": waytypes,
            "crossings": [{"lat": c["lat"], "lng": c["lng"]} for c in crossings],
            "info": {
                "distance": round(distance),
                "adjustedTimeMin": round(adjusted_time_min, 2),
                "avgSlope": round(avg_slope, 2),
                "crossingCount": len(crossings),
                "bikeLaneRatio": round(bike_lane_ratio * 100, 1),
            },
            "fareList": fare_list
        }
    
    if not calculated_routes:
        return {}
    
    by_adjusted_time = min(calculated_routes.items(), 
                          key=lambda x: x[1]["info"]["adjustedTimeMin"])[0]
    
    by_bike_lane = min(calculated_routes.items(), 
                      key=lambda x: (
                          -x[1]["info"]["bikeLaneRatio"],  # 자전거도로 비율 높은 순 (음수로 뒤집기)
                          x[1]["info"]["avgSlope"],        # 경사도 낮은 순
                          x[1]["info"]["crossingCount"]    # 신호등 적은 순
                      ))[0]
    
    by_distance = min(calculated_routes.items(), 
                     key=lambda x: x[1]["info"]["distance"])[0]
    
    result = {}
    used_routes = set()
    
    if by_adjusted_time not in used_routes:
        result["recommended"] = calculated_routes[by_adjusted_time]
        used_routes.add(by_adjusted_time)
    
    if by_bike_lane not in used_routes:
        result["easiest"] = calculated_routes[by_bike_lane]
        used_routes.add(by_bike_lane)
    
    if by_distance not in used_routes:
        result["shortest"] = calculated_routes[by_distance]
        used_routes.add(by_distance)
    

    return result