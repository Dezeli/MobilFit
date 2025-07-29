import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_BASE_URL = "https://mobilfit.kr";

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// 토큰 저장 함수
export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

// 토큰 불러오기
export async function getAccessToken() {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// 토큰 삭제
export async function deleteTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// 로그인 요청
export async function login(email: string, password: string) {
  const res = await instance.post("/login/", { email, password });
  return res.data;
}

// 회원가입 요청
export async function signup(email: string, password: string) {
  const res = await instance.post("/signup/", { email, password });
  return res.data;
}

// 내 정보 조회
export async function getMe(token: string) {
  const res = await instance.get("/me/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

// 로그아웃
export async function logout(token: string) {
  const res = await instance.post(
    "/logout/",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}

// 토큰 리프레시
export async function refreshToken(refreshToken: string) {
  const res = await instance.post("/token/refresh/", {
    refresh: refreshToken,
  });
  return res.data;
}
