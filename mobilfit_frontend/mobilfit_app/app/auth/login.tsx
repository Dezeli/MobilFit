import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { apiPost, apiGet } from "../../lib/api";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("에러", "이메일과 비밀번호를 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      // 로그인
      const res = await apiPost("/api/v1/auth/login/", {
        username: email,
        password,
      });

      await SecureStore.setItemAsync("accessToken", res.data.result.access);
      await SecureStore.setItemAsync("refreshToken", res.data.result.refresh);

      // 유저 정보
      const userInfo = await apiGet("/api/v1/auth/me/", res.data.result.access);
      setUser(userInfo);

      router.replace("/");
    } catch (error: any) {
      Alert.alert("에러", error.message || "로그인 실패");
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
        backgroundColor: "#fff",
        paddingHorizontal: 20,
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: 20, color: "#000" }}>
        로그인
      </Text>

      <TextInput
        placeholder="아이디"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#999" : "#007bff",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 6,
          width: "100%",
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          {loading ? "로그인 중..." : "로그인"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/auth/signup")}
        style={{ marginBottom: 12 }}
      >
        <Text style={{ color: "#007bff", fontSize: 14 }}>
          아직 계정이 없으신가요? 회원가입
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/auth/find-id")}
        style={{ marginBottom: 6 }}
      >
        <Text style={{ color: "#007bff", fontSize: 14 }}>아이디 찾기</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/reset-password")}>
        <Text style={{ color: "#007bff", fontSize: 14 }}>비밀번호 초기화</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    color: "#000",
  },
};
