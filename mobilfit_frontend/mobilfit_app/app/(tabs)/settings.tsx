import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const router = useRouter();

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
      <Text style={{ color: "#000", fontSize: 20, marginBottom: 24 }}>
        설정 화면
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/settings/change-password")}
        style={{
          backgroundColor: "#007bff",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 6,
          width: "100%",
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          비밀번호 변경
        </Text>
      </TouchableOpacity>
    </View>
  );
}
