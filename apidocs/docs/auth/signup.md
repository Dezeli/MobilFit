# ✅ 회원가입 API

## 🔽 POST `/auth/signup/`

새로운 사용자를 회원가입 시킵니다.

### 🔸 Request
```json
{
  "username": "new_user123",
  "password": "securepassword",
  "nickname": "모빌러",
  "email": "user@example.com"
}
```

### 🔹 Response 200
```json
{
  "success": true,
  "data": {
    "username": "new_user123",
    "nickname": "모빌러"
  }
}
```

### 🔹 Response 400
```json
{
  "success": false,
  "data": {
    "username": "이미 사용 중인 아이디입니다."
  }
}
```

### 🔖 설명
- `username`, `email`은 중복 여부를 검사합니다.
- `password`는 8자 이상이어야 하며, 필수 입력입니다.
- `nickname`은 사용자 표시 이름으로, 별명처럼 사용됩니다.
- 이메일 인증이 완료되어야만 회원가입이 성공합니다.
