# ✅ 로그인 API

## 🔽 POST `/auth/login/`

사용자가 아이디와 비밀번호로 로그인합니다.

### 🔸 Request
```json
{
  "username": "new_user123",
  "password": "securepassword"
}
```

### 🔹 Response 200
```json
{
  "success": true,
  "data": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGci...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGci..."
  }
}
```

### 🔹 Response 401
```json
{
  "success": false,
  "data": {
    "non_field_errors": "아이디 또는 비밀번호가 올바르지 않습니다."
  }
}
```

### 🔖 설명
- 로그인에 성공하면 `access`와 `refresh` 토큰이 발급됩니다.
- 발급된 토큰은 이후 인증이 필요한 요청에 사용됩니다.
- 입력값이 올바르지 않거나 사용자 정보가 일치하지 않으면 로그인에 실패합니다.
