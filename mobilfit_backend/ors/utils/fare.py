def calculate_bike_fares(adjusted_time_min: float, distance_km: float) -> list[dict]:
    """
    자전거 브랜드별 요금 계산
    시간 기준 / 거리 기준 요금 구분
    """
    bikes = [
        { "name": "카카오", "base": 500, "perMin": 160, "perKm": 0 },
        { "name": "쏘카", "base": 600, "perMin": 150, "perKm": 0 },
        { "name": "지쿠(시간제)", "base": 600, "perMin": 180, "perKm": 0 },
        { "name": "티맵", "base": 1000, "perMin": 130, "perKm": 0 },
        { "name": "지쿠(거리제)", "base": 0, "perMin": 30, "perKm": 600 },
    ]

    fare_list = []
    for bike in bikes:
        fare = (
            (bike["base"] or 0) +
            (bike.get("perMin", 0) * adjusted_time_min) +
            (bike.get("perKm", 0) * distance_km)
        )
        fare_list.append({
            "name": bike["name"],
            "fare": round(fare)
        })

    # 추천 표시 (최저가)
    if fare_list:
        fare_list.sort(key=lambda x: x["fare"])
        fare_list[0]["isRecommended"] = True

    return fare_list
