export const API_BASE_URL = "https://mobilfit.kr";

export async function apiPost(endpoint: string, data: any, accessToken?: string) {
  console.log("🌟 API 요청 데이터:", JSON.stringify(data));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();
  console.log("🌟 API 응답 상태:", res.status);
  console.log("🌟 API 응답 내용:", text);

  if (!res.ok) {
    let errorDetail = "API 요청 실패";
    try {
      const errorData = JSON.parse(text);
      if (errorData.detail) {
        errorDetail = errorData.detail;
      } else if (errorData.data?.message) {
        errorDetail = errorData.data.message;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorDetail);
  }

  return JSON.parse(text);
}




export async function apiGet(endpoint: string, accessToken: string) {
  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // 만료되었으면 401 반환
  if (res.status === 401) {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    if (!refreshToken) {
      throw new Error("로그인이 필요합니다.");
    }

    // ✅ 토큰 갱신 시도
    const newAccessToken = await refreshAccessToken(refreshToken);

    // 새 accessToken 저장
    await SecureStore.setItemAsync("accessToken", newAccessToken);

    // 다시 요청
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
  }

  if (!res.ok) {
    throw new Error("요청 실패");
  }

  return res.json();
}



export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    throw new Error("토큰 갱신 실패");
  }

  const data = await res.json();
  return data.access;
}
