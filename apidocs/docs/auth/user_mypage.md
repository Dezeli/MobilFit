# ✅ 마이페이지 정보 API

## 🔽 GET `/auth/user/mypage/`

로그인된 사용자의 마이페이지 정보를 조회합니다.

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
    "nickname": "모빌러",
    "ride_score": 1240,
    "app_usage_count": 32,
    "total_saved_money": 7850
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
- 마이페이지 정보에는 닉네임, 누적 점수, 앱 사용 횟수, 절약 금액 등이 포함됩니다.
- 해당 데이터는 사용자 활동 기반으로 자동 누적됩니다.
- 로그인한 사용자 본인의 정보만 조회할 수 있습니다.
