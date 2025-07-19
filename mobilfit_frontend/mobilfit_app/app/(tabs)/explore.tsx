import React, { useState, useRef } from "react";
import { View, StyleSheet, Alert, Button } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import axios from "axios";

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
    try {
      const response = await axios.post(
        "http://192.168.0.5:8080/ors/v2/directions/cycling-regular/geojson",
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

  const drawRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    selectedPreference: "fastest" | "shortest" | "recommended"
  ) => {
    const routeResult = await fetchRoute(start, end, selectedPreference);
    if (routeResult) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "drawRoute",
          coordinates: routeResult.coordinates,
          waytypes: routeResult.waytypes,
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
