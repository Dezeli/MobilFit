# 🛂 Mobilfit API 문서

모든 API는 `https://mobilfit.kr/api/v1/` 하위에서 동작합니다.
응답은 아래의 공통 포맷을 따릅니다.

```json
// 성공 시
{
  "success": true,
  "data": {
    "필드명": "설명"
  }
}

// 실패 시
{
  "success": false,
  "data": {
    "필드명": "설명"
  }
}
```

---

## 📚 목차

* [Auth API](auth/index.md)