# ✅ 토큰 검증 API

## 🔽 GET `/auth/me/`

로그인된 사용자의 기본 정보를 반환합니다.

### 🔸 Request

헤더에 JWT access token을 포함해야 합니다.

```http
Authorization: Bearer <access_token>
```

### 🔹 Response 200
```json
{
  "success": true,
  "data": {
    "username": "user123",
    "email": "user@example.com",
    "nickname": "모빌러"
  }
}
```

### 🔹 Response 401
```json
{
  "success": false,
  "data": {
    "detail": "유효하지 않은 토큰입니다."
  }
}
```

### 🔖 설명
- 클라이언트가 보유한 access token의 유효성을 검증하고 사용자 정보를 반환합니다.
- 이 API는 자동 로그인 또는 세션 유지에 사용됩니다.
- 응답 데이터는 사용자 식별 및 표시용 정보를 포함합니다.
