import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";

export default function SignupScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("에러", "이메일과 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);

    try {
      // 백엔드 연결 전 Mock 가입 처리
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 로딩 시뮬레이션

      Alert.alert(
        "회원가입 완료",
        "이메일 인증 후 로그인해주세요."
      );

      // 로그인 화면으로 이동
      router.replace("/auth/login");
    } catch (error) {
      console.log(error);
      Alert.alert("에러", "회원가입에 실패했습니다.");
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
        회원가입
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
        onPress={handleSignup}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#999" : "#28a745",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 6,
          width: "100%",
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          {loading ? "가입 중..." : "회원가입"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
