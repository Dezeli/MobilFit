import requests
from geopy.distance import geodesic
from typing import List

def get_crossings_from_overpass(bbox: list[float]) -> list[dict]:
    """
    BBox 기반으로 OSM Overpass API에서 crossing 노드 가져오기
    bbox: [min_lat, min_lng, max_lat, max_lng]
    """
    south, west, north, east = bbox
    query = f"""
    [out:json];
    (
      node["highway"="crossing"]({south},{west},{north},{east});
    );
    out body;
    """

    try:
        res = requests.post(
            "https://overpass-api.de/api/interpreter",
            headers={"Content-Type": "text/plain"},
            data=query,
            timeout=10
        )
        res.raise_for_status()
        data = res.json()
        return [{"lat": e["lat"], "lng": e["lon"]} for e in data.get("elements", [])]
    except Exception as e:
        print(f"[Overpass API 오류] {e}")
        return []


def filter_crossings_near_route(crossings: List[dict], coords: List[list], threshold: float = 5) -> List[dict]:
    """
    경로 좌표 기준으로 일정 거리(threshold m) 이내의 crossing만 필터링
    threshold를 10m에서 5m로 변경
    """
    result = []
    for crossing in crossings:
        for lng, lat in coords:
            dist = geodesic((lat, lng), (crossing["lat"], crossing["lng"])).meters
            if dist <= threshold:
                result.append(crossing)
                break
    return result


def find_connected_clusters(crossings: List[dict], threshold: float = 60) -> List[List[int]]:
    """
    연결된 신호등들을 클러스터로 그룹화
    A-B 30m, B-C 30m이면 A,B,C 모두 같은 클러스터로 묶음
    """
    n = len(crossings)
    if n == 0:
        return []
    
    # 인접 리스트 생성
    adjacency = [[] for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            dist = geodesic(
                (crossings[i]["lat"], crossings[i]["lng"]),
                (crossings[j]["lat"], crossings[j]["lng"])
            ).meters
            if dist <= threshold:
                adjacency[i].append(j)
                adjacency[j].append(i)
    
    # DFS로 연결된 컴포넌트 찾기
    visited = [False] * n
    clusters = []
    
    def dfs(node, cluster):
        visited[node] = True
        cluster.append(node)
        for neighbor in adjacency[node]:
            if not visited[neighbor]:
                dfs(neighbor, cluster)
    
    for i in range(n):
        if not visited[i]:
            cluster = []
            dfs(i, cluster)
            clusters.append(cluster)
    
    return clusters


def create_cluster_centers(crossings: List[dict], clusters: List[List[int]]) -> List[dict]:
    """
    각 클러스터의 중심점과 개수 계산
    """
    result = []
    for cluster in clusters:
        if not cluster:
            continue
            
        # 클러스터 내 모든 신호등의 중심점 계산
        total_lat = sum(crossings[i]["lat"] for i in cluster)
        total_lng = sum(crossings[i]["lng"] for i in cluster)
        count = len(cluster)
        
        center_lat = total_lat / count
        center_lng = total_lng / count
        
        result.append({
            "lat": center_lat,
            "lng": center_lng,
            "count": count
        })
    
    return result


def get_deduped_crossings(coords: List[list]) -> List[dict]:
    """
    전체 경로를 기준으로 횡단보도 필터링 + 연결된 클러스터링까지 한 번에 수행
    """
    if not coords:
        return []

    min_lat = min(lat for _, lat in coords)
    max_lat = max(lat for _, lat in coords)
    min_lng = min(lng for lng, _ in coords)
    max_lng = max(lng for lng, _ in coords)

    bbox = [min_lat, min_lng, max_lat, max_lng]
    raw = get_crossings_from_overpass(bbox)
    near = filter_crossings_near_route(raw, coords, threshold=5)  # 5m로 변경
    
    if not near:
        return []
    
    # 연결된 클러스터 찾기
    clusters = find_connected_clusters(near, threshold=60)
    
    # 클러스터 중심점과 개수 계산
    result = create_cluster_centers(near, clusters)
    
    return result