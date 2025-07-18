import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../../lib/api";

export default function SignupScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  // 인증 코드 전송
  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("에러", "이메일을 입력하세요.");
      return;
    }
    setSending(true);
    try {
      await apiPost("/api/v1/auth/email-verify/send/", { email });
      Alert.alert("성공", "인증 코드가 이메일로 전송되었습니다.");
    } catch (error: any) {
      Alert.alert("에러", error.message || "인증 코드 전송 실패");
    } finally {
      setSending(false);
    }
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!emailCode) {
      Alert.alert("에러", "인증 코드를 입력하세요.");
      return;
    }
    setVerifying(true);
    try {
      await apiPost("/api/v1/auth/email-verify/confirm/", {
        email,
        code: emailCode,
      });
      setEmailVerified(true);
      Alert.alert("성공", "이메일 인증이 완료되었습니다.");
    } catch (error: any) {
      Alert.alert("에러", error.message || "인증 실패");
    } finally {
      setVerifying(false);
    }
  };

  // 회원가입
  const handleSignup = async () => {
    if (!emailVerified) {
      Alert.alert("에러", "이메일 인증을 완료해주세요.");
      return;
    }
    if (!username || !password || !nickname) {
      Alert.alert("에러", "모든 항목을 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/v1/auth/signup/", {
        username,
        password,
        nickname,
        email,
      });
      Alert.alert("성공", "회원가입이 완료되었습니다.");
      router.replace("/auth/login");
    } catch (error: any) {
      Alert.alert("에러", error.message || "회원가입 실패");
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
        editable={!emailVerified}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      {!emailVerified && (
        <>
          <TouchableOpacity
            onPress={handleSendCode}
            disabled={sending}
            style={{
              backgroundColor: sending ? "#999" : "#007bff",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 6,
              width: "100%",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
              {sending ? "전송 중..." : "인증 코드 보내기"}
            </Text>
          </TouchableOpacity>

          <TextInput
            placeholder="인증 코드"
            value={emailCode}
            onChangeText={setEmailCode}
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleVerifyCode}
            disabled={verifying}
            style={{
              backgroundColor: verifying ? "#999" : "#28a745",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 6,
              width: "100%",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
              {verifying ? "확인 중..." : "인증 확인"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TextInput
        placeholder="아이디"
        value={username}
        onChangeText={setUsername}
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

      <TextInput
        placeholder="닉네임"
        value={nickname}
        onChangeText={setNickname}
        style={styles.input}
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
          marginTop: 12,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          {loading ? "가입 중..." : "가입하기"}
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
