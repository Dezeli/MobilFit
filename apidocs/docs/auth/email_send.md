# ✅ 이메일 인증 코드 전송 API

## 🔽 POST `/auth/email-verify/send/`

회원가입 시 사용자의 이메일로 인증 코드를 전송합니다.

### 🔸 Request
```json
{
  "email": "user@example.com"
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
    "email": "이미 가입된 이메일입니다."
  }
}
```

### 🔖 설명
- 입력된 이메일 주소로 6자리 숫자 인증 코드가 전송됩니다.
- 이미 가입된 이메일일 경우 요청이 거절됩니다.
- 인증 코드는 일정 시간(예: 5분) 동안만 유효하며, 이후 만료됩니다.
