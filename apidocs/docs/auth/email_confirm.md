# ✅ 이메일 인증 확인 API

## 🔽 POST `/auth/email-verify/confirm/`

사용자가 받은 인증 코드를 입력하여 이메일 인증을 완료합니다.

### 🔸 Request
```json
{
  "email": "user@example.com",
  "code": "123456"
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
    "code": "인증 코드가 일치하지 않거나 만료되었습니다."
  }
}
```

### 🔖 설명
- 인증 코드는 5분이 지나면 만료됩니다.
- 인증이 완료된 이메일은 재인증할 수 없습니다.
- 이메일 인증이 완료되어야만 회원가입이 가능합니다.
