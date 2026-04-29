import requests

from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from decouple import config
from .serializers import SearchResultSerializer
from .services import get_full_route_data

KAKAO_REST_API_KEY = config("KAKAO_REST_API_KEY")

KAKAO_HEADERS = {
    "Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"
}

class RouteView(APIView):
    def post(self, request):
        try:
            start = request.data.get("start")
            end = request.data.get("end")
            if not start or not end:
                return Response({"success": False, "data": {"error": "Invalid input"}}, status=400)

            result = get_full_route_data(start, end)
            return Response({"success": True, "data": result})
        except Exception as e:
            return Response({"success": False, "data": {"error": str(e)}}, status=500)



@api_view(['GET'])
def combined_search(request):
    query = request.GET.get('query')
    x = request.GET.get('x')
    y = request.GET.get('y')

    if not query or not x or not y:
        return Response({
            "success": False,
            "data": {
                "message": "query, x, y 파라미터가 필요합니다."
            }
        }, status=400)

    address_url = "https://dapi.kakao.com/v2/local/search/address.json"
    keyword_url = "https://dapi.kakao.com/v2/local/search/keyword.json"

    addr_res = requests.get(address_url, headers=KAKAO_HEADERS, params={"query": query}, timeout=10)
    addr_docs = addr_res.json().get("documents", [])

    address_result = None
    if addr_docs:
        for doc in addr_docs:
            road = doc.get("road_address")
            if road:
                address_result = {
                    "type": "address",
                    "name": road.get("building_name") or "(건물명 없음)",
                    "address": road.get("address_name"),
                    "x": road.get("x"),
                    "y": road.get("y")
                }
                break

    keyword_params = {
        "query": query,
        "x": x,
        "y": y,
        "radius": 10000,
        "sort": "accuracy",
        "size": 15
    }
    place_res = requests.get(keyword_url, headers=KAKAO_HEADERS, params=keyword_params, timeout=10)
    place_docs = place_res.json().get("documents", [])

    place_results = []
    for doc in place_docs:
        place_results.append({
            "type": "place",
            "name": doc.get("place_name"),
            "address": doc.get("address_name"),
            "x": doc.get("x"),
            "y": doc.get("y")
        })

    final_results = []
    if address_result:
        final_results.append(address_result)

    final_results.extend(place_results[:(8 - len(final_results))])

    serialized = SearchResultSerializer(final_results, many=True)

    return Response({
        "success": True,
        "data": {
            "results": serialized.data
        }
    })