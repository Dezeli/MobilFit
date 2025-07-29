# ✅ 로그아웃 API

## 🔽 POST `/auth/logout/`

사용자의 refresh 토큰을 삭제하여 로그아웃 처리합니다.

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
  "data": null
}
```

### 🔹 Response 400
```json
{
  "success": false,
  "data": {
    "refresh": "유효하지 않은 토큰입니다."
  }
}
```

### 🔖 설명
- 서버에 저장된 사용자의 refresh 토큰을 삭제합니다.
- 토큰이 없거나 잘못된 경우 로그아웃이 실패합니다.
- 로그아웃 후 재로그인을 위해서는 다시 로그인 요청을 해야 합니다.
