import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@react-navigation/native";
import { DefaultTheme } from "@react-navigation/native";
import { AuthProvider } from "../contexts/AuthContext";
import Splash from "./splash";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.ttf'),
    'Cafe24': require('../assets/fonts/Cafe24Ssurround.ttf'),
    'Agbalumo-Regular': require('../assets/fonts/Agbalumo-Regular.ttf'),
  });

  if (!fontsLoaded) return <Splash />;

  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* ✅ 진입 분기 index.tsx (자동 로그인, 첫 실행 판단) */}
          <Stack.Screen name="index" />

          {/* ✅ 개별 화면들 */}
          <Stack.Screen name="landing" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="auth/find-id" />
          <Stack.Screen name="auth/reset-password" />

          {/* ✅ 탭 네비게이션 */}
          <Stack.Screen name="(tabs)" />

          {/* ✅ fallback */}
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
