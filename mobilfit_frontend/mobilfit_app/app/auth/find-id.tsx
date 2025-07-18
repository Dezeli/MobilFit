import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../../lib/api";

export default function FindIdScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [foundUsername, setFoundUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFindId = async () => {
    if (!email) {
      Alert.alert("에러", "이메일을 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost("/api/v1/auth/find-id/", { email });

      if (res.data?.result?.masked_username) {
        setFoundUsername(res.data.result.masked_username);
      } else {
        Alert.alert("에러", "아이디를 찾을 수 없습니다.");
      }
    } catch (error: any) {
      Alert.alert("에러", error.message || "아이디 찾기 실패");
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
        아이디 찾기
      </Text>

      <TextInput
        placeholder="가입 시 이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleFindId}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#999" : "#007bff",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 6,
          width: "100%",
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          {loading ? "찾는 중..." : "아이디 찾기"}
        </Text>
      </TouchableOpacity>

      {foundUsername && (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: "#000", marginBottom: 8 }}>
            가입하신 아이디:
          </Text>
          <Text style={{ fontSize: 18, color: "#28a745", fontWeight: "bold" }}>
            {foundUsername}
          </Text>

          <TouchableOpacity
            onPress={() => router.replace("/auth/login")}
            style={{
              marginTop: 20,
              paddingVertical: 10,
              paddingHorizontal: 20,
              backgroundColor: "#007bff",
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>
              로그인 화면으로 이동
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
