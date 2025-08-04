from geopy.distance import geodesic

def calculate_avg_slope_percent(elevations: list[float], coords: list[list[float]]) -> float:
    """
    평균 경사도 (%)
    = 오르막 고도 변화량 / 전체 거리 × 100
    """
    if len(elevations) < 2 or len(coords) < 2:
        return 0.0

    uphill = 0.0
    for i in range(1, len(elevations)):
        diff = elevations[i] - elevations[i - 1]
        if diff > 0:
            uphill += diff

    total_distance = 0.0
    for i in range(1, len(coords)):
        prev = (coords[i - 1][1], coords[i - 1][0])  # (lat, lng)
        curr = (coords[i][1], coords[i][0])
        total_distance += geodesic(prev, curr).meters

    if total_distance == 0:
        return 0.0

    return round((uphill / total_distance) * 100, 2)


def calculate_elevation_weight(elevations: list[float], coords: list[list[float]]) -> float:
    """
    경사 보정 가중치 = 평균경사도 / 20 + 1
    """
    avg_slope = calculate_avg_slope_percent(elevations, coords)
    return round(avg_slope / 20 + 1, 2)
