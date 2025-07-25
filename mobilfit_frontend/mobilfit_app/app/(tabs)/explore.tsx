import React, { useState, useRef } from "react";
import { View, StyleSheet, Alert, Button } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import axios from "axios";
import Constants from "expo-constants";
import { getDistance } from "geolib";

const ORS_API_KEY = Constants.expoConfig?.extra?.orsApiKey;

const Explore: React.FC = () => {
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [preference, setPreference] = useState<"fastest" | "shortest" | "recommended">("fastest");
  const webViewRef = useRef<any>(null);

  const fetchRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    selectedPreference: "fastest" | "shortest" | "recommended"
  ): Promise<{ coordinates: number[][]; waytypes: number[] } | null> => {
    if (!ORS_API_KEY) {
      console.error("❌ ORS API 키가 설정되지 않았습니다.");
      return null;
    }

    try {
      const response = await axios.post(
        "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson",
        {
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
          preference: selectedPreference,
          instructions: true,
          geometry_simplify: false,
          elevation: true,
          extra_info: ["waytype"],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ORS_API_KEY,
          },
        }
      );

      const data = response.data;
      const coordinates = data.features?.[0]?.geometry?.coordinates;
      const waytypeInfo = data.features?.[0]?.properties?.extras?.waytype?.values;

      if (!coordinates || !Array.isArray(waytypeInfo)) {
        console.error("❌ waytype 정보가 없습니다.");
        return null;
      }

      const waytypes = new Array(coordinates.length - 1).fill(0);
      waytypeInfo.forEach(([startIdx, endIdx, type]: [number, number, number]) => {
        for (let i = startIdx; i < endIdx; i++) {
          waytypes[i] = type;
        }
      });

      return { coordinates, waytypes };
    } catch (error) {
      console.error("ORS 요청 실패:", error);
      return null;
    }
  };

  const getBBoxFromCoordinates = (coords: number[][]): [number, number, number, number] => {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    coords.forEach(([lng, lat]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    return [minLat, minLng, maxLat, maxLng]; // south, west, north, east
  };

  const fetchCrossingsInBBox = async (bbox: [number, number, number, number]) => {
    const [south, west, north, east] = bbox;

    const query = `
      [out:json];
      (
        node["highway"="crossing"](${south},${west},${north},${east});
      );
      out body;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    try {
      const response = await axios.post(url, query, {
        headers: { "Content-Type": "text/plain" },
      });

      return response.data?.elements || [];
    } catch (err) {
      console.error("❌ Overpass API 오류:", err);
      return [];
    }
  };

  const filterNearbyCrossings = (
    crossings: { lat: number; lon: number }[],
    routeCoords: number[][],
    threshold = 10
  ): { lat: number; lng: number }[] => {
    return crossings
      .filter((crossing) =>
        routeCoords.some(([lng, lat]) => {
          const dist = getDistance(
            { latitude: crossing.lat, longitude: crossing.lon },
            { latitude: lat, longitude: lng }
          );
          return dist <= threshold;
        })
      )
      .map((c) => ({ lat: c.lat, lng: c.lon }));
  };

  const deduplicateCloseCrossings = (
    crossings: { lat: number; lng: number }[],
    threshold = 5
  ): { lat: number; lng: number }[] => {
    const clusters: { lat: number; lng: number }[] = [];

    crossings.forEach((crossing) => {
      const isMerged = clusters.some((c) => {
        const dist = getDistance(
          { latitude: c.lat, longitude: c.lng },
          { latitude: crossing.lat, longitude: crossing.lng }
        );
        return dist <= threshold;
      });

      if (!isMerged) {
        clusters.push(crossing);
      }
    });

    return clusters;
  };

  const drawRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    selectedPreference: "fastest" | "shortest" | "recommended"
  ) => {
    const routeResult = await fetchRoute(start, end, selectedPreference);
    if (routeResult) {
      const { coordinates, waytypes } = routeResult;

      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "drawRoute",
          coordinates,
          waytypes,
        })
      );

      const bbox = getBBoxFromCoordinates(coordinates);
      const rawCrossings = await fetchCrossingsInBBox(bbox);
      const filtered = filterNearbyCrossings(rawCrossings, coordinates);
      const deduped = deduplicateCloseCrossings(filtered);

      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "drawCrossings",
          crossings: deduped,
        })
      );
    }
  };

  const handlePreferenceChange = (newPreference: "fastest" | "shortest" | "recommended") => {
    setPreference(newPreference);
    if (startPoint && endPoint) {
      drawRoute(startPoint, endPoint, newPreference);
    }
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "mapClick") {
        const clickedPoint = { lat: data.lat, lng: data.lng };

        if (data.clickCount === 1) {
          setStartPoint(clickedPoint);
          setEndPoint(null);
          Alert.alert("출발지 설정", `위도: ${data.lat}\n경도: ${data.lng}`);
        } else if (data.clickCount === 2) {
          setEndPoint(clickedPoint);
          Alert.alert("도착지 설정", `위도: ${data.lat}\n경도: ${data.lng}`);

          if (startPoint) {
            drawRoute(startPoint, clickedPoint, preference);
          }
        }
      }
    } catch (error) {
      console.error("메시지 처리 오류:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="빠른 경로" onPress={() => handlePreferenceChange("fastest")} />
        <Button title="짧은 경로" onPress={() => handlePreferenceChange("shortest")} />
        <Button title="추천 경로" onPress={() => handlePreferenceChange("recommended")} />
      </View>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={require("../../assets/leaflet/leaflet.html")}
        onMessage={handleMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
});

export default Explore;
