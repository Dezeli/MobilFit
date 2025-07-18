import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../../lib/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!username || !email || !name) {
      Alert.alert("에러", "모든 항목을 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost("/api/v1/auth/reset-password/", {
        username,
        email,
        name,
      });
      Alert.alert(
        "임시 비밀번호 전송",
        res.data?.message || "임시 비밀번호가 이메일로 전송되었습니다.",
        [
          {
            text: "로그인 화면으로 이동",
            onPress: () => router.replace("/auth/login"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("에러", error.message || "비밀번호 초기화 실패");
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
        비밀번호 초기화
      </Text>

      <TextInput
        placeholder="아이디"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="닉네임"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleResetPassword}
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
          {loading ? "전송 중..." : "임시 비밀번호 요청"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: "#007bff", fontSize: 14 }}>
          로그인 화면으로 돌아가기
        </Text>
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
