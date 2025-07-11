import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

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
      <Text style={{ color: "#000", fontSize: 16, marginBottom: 24 }}>
        {user?.email}님 환영합니다!
      </Text>

      <TouchableOpacity
        onPress={logout}
        style={{
          backgroundColor: "#dc3545",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}
