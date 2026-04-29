import requests
from decouple import config
import polyline
from geopy.distance import geodesic

ORS_API_KEY = config("ORS_API_KEY")

def get_route_from_ors(start: dict, end: dict, profile: str, preference: str) -> dict | None:
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "coordinates": [[start["lng"], start["lat"]], [end["lng"], end["lat"]]],
        "preference": preference,
        "instructions": False,
        "geometry_simplify": False,
        "extra_info": ["waytype"]
    }

    try:
        # URL에 profile 적용
        url = f"https://api.openrouteservice.org/v2/directions/{profile}/geojson"
        res = requests.post(url, headers=headers, json=body, timeout=10)
        res.raise_for_status()
        data = res.json()["features"][0]

        coordinates = data["geometry"]["coordinates"]
        extras = data["properties"]["extras"]["waytype"]["values"]
        duration = data["properties"]["summary"]["duration"]
        distance = data["properties"]["summary"]["distance"]

        waytypes = [0] * (len(coordinates) - 1)
        for start_idx, end_idx, waytype in extras:
            for i in range(start_idx, end_idx):
                waytypes[i] = waytype

        return {
            "coordinates": coordinates,
            "waytypes": waytypes,
            "duration": duration,
            "distance": distance
        }

    except Exception as e:
        print(f"[ORS Directions 오류] Profile: {profile}, Preference: {preference}, Error: {e}")
        return None


def dedup_coords(coords: list[list[float]]) -> list[list[float]]:
    deduped = [coords[0]]
    for pt in coords[1:]:
        if pt != deduped[-1]:
            deduped.append(pt)
    return deduped


def get_elevations_from_ors(coords: list[list[float]]) -> list[float]:
    if len(coords) < 2:
        print("[Elevation] 경로 좌표가 부족합니다.")
        return []

    coords = dedup_coords(coords)

    latlng_coords = [[c[1], c[0]] for c in coords]  # 위도,경도 → 경도,위도

    try:
        encoded = polyline.encode(latlng_coords, precision=5)
    except Exception as e:
        print("[Polyline 인코딩 오류]", e)
        return []

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "format_in": "encodedpolyline",
        "format_out": "geojson",
        "geometry": encoded
    }

    try:
        res = requests.post(
            "https://api.openrouteservice.org/elevation/line",
            headers=headers,
            json=body,
            timeout=10
        )
        res.raise_for_status()
        geojson = res.json()["geometry"]["coordinates"]
        return [pt[2] for pt in geojson]

    except requests.exceptions.HTTPError as e:
        print(f"[ORS Elevation 오류] {e}")
        print("[응답 코드]", e.response.status_code)
        try:
            print("[ORS Elevation 응답 본문]", e.response.json())
        except:
            print("[ORS Elevation 응답 본문(raw)]", e.response.text)

    except Exception as e:
        print(f"[Elevation 일반 오류] {e}")

    print(f"[Elevation 요청 바디] {body}")
    return []


def calculate_avg_slope_percent(elevations: list[float], coords: list[list[float]]) -> float:
    if len(elevations) != len(coords):
        print("[Slope] elevation과 coords 개수가 일치하지 않음")
        return 0.0

    total_weighted_slope = 0.0
    total_distance = 0.0

    for i in range(1, len(coords)):
        start = coords[i - 1]
        end = coords[i]
        dist_m = geodesic((start[1], start[0]), (end[1], end[0])).meters
        elev_diff = elevations[i] - elevations[i - 1]

        if elev_diff > 0:
            slope_percent = (elev_diff / dist_m) * 100 if dist_m > 0 else 0
        else:
            slope_percent = 0  # 내리막은 무시

        total_weighted_slope += slope_percent * dist_m
        total_distance += dist_m

    avg_slope = total_weighted_slope / total_distance if total_distance > 0 else 0
    return round(avg_slope, 2)