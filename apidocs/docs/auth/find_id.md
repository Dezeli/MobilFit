# ✅ 아이디 찾기 API

## 🔽 POST `/auth/find-id/`

가입된 이메일을 기반으로 사용자의 아이디 일부를 마스킹하여 반환합니다.

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
  "data": {
    "masked_username": "use****123"
  }
}
```

### 🔹 Response 404
```json
{
  "success": false,
  "data": {
    "email": "해당 이메일로 가입된 사용자가 없습니다."
  }
}
```

### 🔖 설명
- 마스킹된 아이디를 반환하여 개인정보 노출을 방지합니다.
- 해당 이메일로 가입된 사용자가 없으면 404 에러를 반환합니다.
- 회원가입 시 등록한 이메일 정보와 정확히 일치해야 합니다.
