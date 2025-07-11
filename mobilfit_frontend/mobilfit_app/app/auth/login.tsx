import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";

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
      // 백엔드 연결 전 Mock 로그인 처리
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 로딩 시뮬레이션

      // 상태 저장
      setUser({
        id: 1,
        email: email,
        nickname: "테스트유저",
      });

      Alert.alert("로그인 성공", `환영합니다, ${email}!`);
    } catch (error) {
      console.log(error);
      Alert.alert("에러", "로그인에 실패했습니다.");
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
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          width: "100%",
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 6,
          padding: 12,
          marginBottom: 12,
          color: "#000",
        }}
      />

      <TextInput
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          width: "100%",
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 6,
          padding: 12,
          marginBottom: 20,
          color: "#000",
        }}
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

      <TouchableOpacity onPress={() => router.push("/auth/signup")}>
        <Text style={{ color: "#007bff", fontSize: 14 }}>
          아직 계정이 없으신가요? 회원가입
        </Text>
      </TouchableOpacity>
    </View>
  );
}
