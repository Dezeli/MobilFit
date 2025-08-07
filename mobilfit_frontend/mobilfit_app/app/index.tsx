import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getItem, setItem, apiPost } from "../lib/api";
import Splash from "./splash";

export default function Index() {
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const isFirstLaunch = await AsyncStorage.getItem("isFirstLaunch");
        if (!isFirstLaunch) {
          await AsyncStorage.setItem("isFirstLaunch", "false");
          router.replace("/landing");
          return;
        }
        router.replace("/landing");
        return;

        const refreshToken = await getItem("refreshToken");
        if (refreshToken) {
          try {
            const res = await apiPost("/api/v1/auth/token/refresh/", { refresh: refreshToken });
            const accessToken = res?.data?.result?.access;
            if (!accessToken) throw new Error();
            await setItem("accessToken", accessToken);
            router.replace("/(tabs)");
          } catch {
            await AsyncStorage.multiRemove(["refreshToken", "accessToken"]);
            router.replace("/auth/login");
          }
        } else {
          router.replace("/auth/login");
        }
      } catch {
        router.replace("/auth/login");
      } finally {
        setInitialized(true);
      }
    };

    init();
  }, []);

  return <Splash />;
}
