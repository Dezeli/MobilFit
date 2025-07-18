import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { apiPost } from "../../lib/api";
import * as SecureStore from "expo-secure-store";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      Alert.alert("에러", "모든 항목을 입력하세요.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      Alert.alert("에러", "새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      await apiPost(
        "/api/v1/auth/change-password/",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        accessToken
      );

      Alert.alert(
        "비밀번호 변경 완료",
        "비밀번호가 성공적으로 변경되었습니다.",
        [
          {
            text: "확인",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("에러", error.message || "비밀번호 변경 실패");
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
        비밀번호 변경
      </Text>

      <TextInput
        placeholder="현재 비밀번호"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="새 비밀번호"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="새 비밀번호 확인"
        value={newPasswordConfirm}
        onChangeText={setNewPasswordConfirm}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleChangePassword}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#999" : "#007bff",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 6,
          width: "100%",
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          {loading ? "변경 중..." : "비밀번호 변경"}
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
