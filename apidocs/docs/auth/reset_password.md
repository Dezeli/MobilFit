# ✅ 임시 비밀번호 전송 API

## 🔽 POST `/auth/reset-password/`

입력한 사용자 정보를 기반으로 임시 비밀번호를 이메일로 전송합니다.

### 🔸 Request
```json
{
  "username": "user123",
  "email": "user@example.com",
  "name": "홍길동"
}
```

### 🔹 Response 200
```json
{
  "success": true,
  "data": null
}
```

### 🔹 Response 404
```json
{
  "success": false,
  "data": {
    "user": "입력하신 정보와 일치하는 사용자가 없습니다."
  }
}
```

### 🔹 Response 400
```json
{
  "success": false,
  "data": {
    "username": "입력값이 유효하지 않습니다."
  }
}
```

### 🔖 설명
- 입력한 사용자 정보가 정확히 일치해야 임시 비밀번호가 발급됩니다.
- 임시 비밀번호는 이메일로 전송되며, 로그인 후 반드시 변경해야 합니다.
- 이름은 닉네임과 동일한 필드로 처리됩니다.
