import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = "https://mobilfit.kr";

// 🔐 토큰 키
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// ✅ SecureStore 기반 토큰 처리
export async function setItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    console.warn("SecureStore set 실패, AsyncStorage로 fallback");
    await AsyncStorage.setItem(key, value);
  }
}

export async function getItem(key: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) return value;
  } catch {
    console.warn("SecureStore get 실패, AsyncStorage로 fallback");
  }
  return await AsyncStorage.getItem(key);
}

export async function deleteTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// ✅ 토큰 저장
export async function saveTokens(accessToken: string, refreshToken: string) {
  await setItem(ACCESS_TOKEN_KEY, accessToken);
  await setItem(REFRESH_TOKEN_KEY, refreshToken);
}

// ✅ 토큰 가져오기
export async function getAccessToken() {
  return await getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return await getItem(REFRESH_TOKEN_KEY);
}

// ✅ 토큰 갱신 (fetch 기반)
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  const json = await res.json();
  console.log("🌟 토큰 갱신 응답:", JSON.stringify(json));

  if (!res.ok || json?.success === false) {
    console.log("❌ 토큰 갱신 실패");
    throw new Error("서버와의 인증에 실패했습니다.");
  }

  const accessToken = json?.data?.result?.access;
  if (!accessToken) throw new Error("서버와의 인증에 실패했습니다.");

  return accessToken;
}

// ✅ POST 요청
export async function apiPost(endpoint: string, data: any, accessToken?: string) {
  console.log("🌟 API 요청 데이터:", JSON.stringify(data));
  console.log("🌟 API", API_BASE_URL, endpoint);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();
  let json: any;

  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error("서버 요청시간을 초과했습니다.");
  }

  console.log("🌟 API 응답 상태:", res.status);
  console.log("🌟 API 응답 내용:", JSON.stringify(json));

  if (!res.ok || json?.success === false) {
    const message =
      json?.data?.message || json?.detail || "서버 오류가 발생했습니다.";
    throw new Error(message);
  }

  return json;
}


export async function apiGet(endpoint: string, accessToken?: string) {
  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    console.log("🔁 accessToken 만료, refresh 시도");
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error("로그인이 필요합니다.");

    try {
      const newAccessToken = await refreshAccessToken(refreshToken);
      await setItem(ACCESS_TOKEN_KEY, newAccessToken);
      console.log("✅ accessToken 갱신 완료, 재요청");

      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
    } catch (e) {
      console.log("❌ 토큰 갱신 실패 → 자동 로그아웃");
      await deleteTokens();
      throw new Error("로그인 세션이 만료되었습니다.");
    }
  }

  if (!res.ok) throw new Error("요청 실패");

  const json = await res.json();
  return json;
}
