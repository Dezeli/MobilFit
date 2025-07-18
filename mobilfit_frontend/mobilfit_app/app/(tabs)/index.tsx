import { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "expo-router";
import { apiPost } from "../../lib/api";
import * as SecureStore from "expo-secure-store";

export default function HomeScreen() {
  const { isAuthenticated, isLoading, user, logout: clearAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  const handleLogout = async () => {
    setLoading(true);
    try {
      // 저장된 refresh token 가져오기
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (refreshToken) {
        // 로그아웃 API 호출
        await apiPost("/api/v1/auth/logout/", { refresh: refreshToken });
      }

      // SecureStore 토큰 삭제
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");

      // AuthContext 상태 초기화
      clearAuth();
    } catch (error: any) {
      Alert.alert("에러", error.message || "로그아웃 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
        paddingHorizontal: 20,
      }}
    >
      <Text style={{ color: "#000", fontSize: 20, marginBottom: 12 }}>
        홈 화면
      </Text>

      <TouchableOpacity
        onPress={handleLogout}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#999" : "#dc3545",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>
          {loading ? "로그아웃 중..." : "로그아웃"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
