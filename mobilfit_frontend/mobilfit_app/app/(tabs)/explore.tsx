import React, { useState, useRef } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import axios from "axios";

const Explore: React.FC = () => {
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(null);
  const webViewRef = useRef<any>(null);

  // ORS 경로 요청 함수
  const fetchRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ): Promise<number[][] | null> => {
    try {
      const response = await axios.post(
        "http://192.168.0.5:8080/ors/v2/directions/cycling-regular/geojson",
        {
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat]
          ]
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (data && data.features && data.features[0]) {
        return data.features[0].geometry.coordinates;
      } else {
        console.error("경로 데이터를 찾을 수 없습니다.");
        return null;
      }
    } catch (error) {
      console.error("ORS 요청 실패:", error);
      return null;
    }
  };

  // 지도에서 오는 메시지 처리
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
            const route = await fetchRoute(startPoint, clickedPoint);
            if (route) {
              webViewRef.current?.postMessage(
                JSON.stringify({
                  type: "drawRoute",
                  coordinates: route
                })
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("메시지 처리 오류:", error);
    }
  };

  return (
    <View style={styles.container}>
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
});

export default Explore;
