# ✅ 토큰 갱신 API

## 🔽 POST `/auth/token/refresh/`

Refresh 토큰을 통해 Access 토큰을 재발급받습니다.

### 🔸 Request
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGci..."
}
```

### 🔹 Response 200
```json
{
  "success": true,
  "data": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGci..."
  }
}
```

### 🔹 Response 401
```json
{
  "success": false,
  "data": {
    "refresh": "Refresh 토큰이 유효하지 않습니다."
  }
}
```

### 🔖 설명
- 클라이언트는 주기적으로 access 토큰을 갱신하기 위해 이 API를 호출합니다.
- 유효한 refresh 토큰이 필요하며, refresh 토큰이 만료되면 재로그인이 필요합니다.
- 응답에는 새로운 access 토큰만 포함됩니다.
