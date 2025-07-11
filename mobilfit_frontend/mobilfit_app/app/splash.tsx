import { View, Text, ActivityIndicator } from "react-native";

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>앱 로딩 중...</Text>
    </View>
  );
}
