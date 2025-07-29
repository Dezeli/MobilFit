# 🔐 Auth API

`/auth/` 하위에서 동작하는 인증 관련 API 목록입니다.

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| [회원가입](signup.md) | POST | `/auth/signup/` |
| [로그인](login.md) | POST | `/auth/login/` |
| [로그아웃](logout.md) | POST | `/auth/logout/` |
| [토큰 갱신](token_refresh.md) | POST | `/auth/token/refresh/` |
| [이메일 인증 코드 전송](email_send.md) | POST | `/auth/email-verify/send/` |
| [이메일 인증 확인](email_confirm.md) | POST | `/auth/email-verify/confirm/` |
| [아이디 찾기](find_id.md) | POST | `/auth/find-id/` |
| [임시 비밀번호 전송](reset_password.md) | POST | `/auth/reset-password/` |
| [비밀번호 변경](change_password.md) | POST | `/auth/change-password/` |
| [토큰 검증](me.md) | GET | `/auth/me/` |
| [마이페이지 정보](user_mypage.md) | GET | `/auth/user/mypage/` |
