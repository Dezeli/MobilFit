# ✅ 비밀번호 변경 API

## 🔽 POST `/auth/change-password/`

로그인된 사용자가 현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.

### 🔸 Request
```json
{
  "current_password": "oldpassword123",
  "new_password": "newsecurepassword456"
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
    "current_password": "현재 비밀번호가 올바르지 않습니다."
  }
}
```

### 🔖 설명
- 사용자는 반드시 로그인 상태여야 합니다 (JWT access token 필요).
- `current_password`가 정확히 일치해야 비밀번호 변경이 가능합니다.
- `new_password`는 최소 8자 이상이어야 하며, 변경 시 즉시 반영됩니다.
