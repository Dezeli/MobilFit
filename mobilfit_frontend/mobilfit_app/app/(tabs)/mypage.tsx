import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiGet } from "../../lib/api";

export default function MyPageScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken) throw new Error("로그인이 필요합니다.");

        const res = await apiGet("/api/v1/auth/user/mypage/", accessToken);
        setData(res.data.result);
      } catch (error: any) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>데이터를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>마이페이지</Text>

      <Text style={styles.item}>닉네임: {data.nickname}</Text>
      <Text style={styles.item}>주행 점수: {data.ride_score} 점</Text>
      <Text style={styles.item}>앱 사용 횟수: {data.app_usage_count} 회</Text>
      <Text style={styles.item}>총 절약 금액: {data.total_saved_money} 원</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: "#000",
  },
  item: {
    fontSize: 18,
    color: "#000",
    marginBottom: 12,
  },
  text: {
    color: "#000",
  },
});
