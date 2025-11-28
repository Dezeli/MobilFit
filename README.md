# MobilFit


---

# 1. 레포지토리 구조

```
/
├── mobilfit_backend/            # Django REST API 백엔드
├── mobilfit_frontend/
│   └── mobilfit_app/           # React Native(Expo) 앱
├── apidocs/                     # MkDocs 기반 API 문서
├── nginx/                       # Nginx 리버스 프록시 설정
├── requirements.txt             # Django 백엔드 의존성
├── Dockerfile                   # 컨테이너 빌드 설정
├── docker-compose.yml           # 개발용 Compose 스택
├── docker-compose.prod.yml      # 배포용 Compose 스택
├── entrypoint.sh                # 백엔드 컨테이너 엔트리 스크립트
└── README.md
```

프론트엔드 · 백엔드 · 인프라를 하나의 워크스페이스에서 관리합니다.

---

# 2. Django 백엔드

## 2.1. 기술 스택
- **Django**
- **Django REST Framework**
- **Python 3**
- **JWT 인증**
- **이메일 인증**
- **requests**(Kakao, ORS API 호출)
- **python-decouple**(.env 관리)

## 2.2. Settings 구조
환경 변수에 따라 설정이 자동 선택됩니다.

### 개발 환경 (dev)
- DB: SQLite3
- Debug 활성화

### 운영 환경 (prod)
- DB: AWS RDS(PostgreSQL)
- Debug 비활성화
- Nginx 리버스 프록시 사용
- HTTPS 적용

---

# 3. 환경 변수 (.env)

모든 민감한 값은 `.env`에서 관리합니다. (prod 기준 env)

📌 Django 기본 설정
| Key | 설명 |
|-----|------|
| DJANGO_SETTINGS_MODULE | Django 설정 파일(dev / prod) 선택 |
| SECRET_KEY | Django SECRET_KEY |

📌 ORS / Kakao 외부 API
| Key | 설명 |
|-----|------|
| ORS_API_KEY | OpenRouteService 경로/고도 API Key |
| KAKAO_REST_API_KEY | Kakao Local Search / Keyword API Key |

📌 PostgreSQL (Production)
| Key | 설명 |
|-----|------|
| POSTGRES_DB | PostgreSQL 데이터베이스 이름 |
| POSTGRES_USER | DB 사용자명 |
| POSTGRES_PASSWORD | DB 비밀번호 |
| POSTGRES_HOST | DB 호스트 주소 (AWS RDS Endpoint) |
| POSTGRES_PORT | PostgreSQL 포트 (기본: 5432) |

📌 이메일 SMTP 설정
| Key | 설명 |
|-----|------|
| EMAIL_HOST | SMTP 서버 주소 |
| EMAIL_PORT | SMTP 포트 |
| EMAIL_HOST_USER | SMTP 사용자 이메일 |
| EMAIL_HOST_PASSWORD | SMTP 비밀번호(App Password 등) |
| EMAIL_USE_TLS | TLS 사용 여부 |
| DEFAULT_FROM_EMAIL | Django 기본 발신 이메일 |

📌 Django 보안/기타 설정
| Key | 설명 |
|-----|------|
| DEBUG | Debug 모드 설정 (True/False) |
| ALLOWED_HOSTS | 허용할 도메인 목록 |
| CSRF_TRUSTED_ORIGINS | CSRF 허용 도메인 |
| SECURE_SSL_REDIRECT | HTTPS 강제 여부 |


---

# 4. 주요 API

## 4.1. ORS 기반 경로 추천 API

**POST `/api/route`**

예시 요청:
```json
{
  "start": { "lat": 37.4979, "lng": 127.0276 },
  "end":   { "lat": 37.5080, "lng": 127.0630 }
}
```

### 내부 처리 과정
- ORS에 다양한 프로필로 요청:
  - `cycling-electric + recommended`
  - `cycling-electric + fastest`
  - `cycling-electric + shortest`
- 경로 중복 제거
- 고도 및 경사도 계산
- 교차로(신호등) 추출 및 지연 반영
- 자전거도로 비율(waytypes) 계산
- 경사도 및 도로타입 기반 이동시간 조정
- 자전거 요금 계산
- 최종적으로 3개의 추천 경로 반환:
  - `recommended`
  - `easiest`
  - `shortest`

---

## 4.2. Kakao 통합 검색 API

**GET `/api/combined_search?query=...&x=...&y=...`**

예시 요청:
```
/api/combined_search?query=스타벅스&x=127.0276&y=37.4979
```

### 기능
- 주소 검색 API 호출
- 키워드 기반 장소 검색 API 호출
- 최대 8개 결과로 통합 및 정렬
- 공통 schema로 serialize 후 반환

---

# 5. React Native (Expo)

## 5.1. 기술 스택
- **React Native**
- **Expo Go**
- **TypeScript / TSX**
- **fetch 기반 API 호출**
- **useState / useEffect 기반 로컬 상태 관리**

## 5.2. 구조적 특징
- RN 전형적 구조(`screens/`, `components/` 등)
- 네트워크 레이어는 fetch 단일 방식

---

# 6. 지도 기능 (Leaflet + WebView)

## 6.1. 구현 구조

```
React Native → WebView → HTML + Leaflet 지도
```

RN에서 Leaflet을 직접 사용할 수 없기 때문에 WebView로 감싼 HTML 기반 Leaflet을 사용합니다.

## 6.2. Leaflet 선택 이유
- 완전 무료
- Google/Naver/Kakao 지도 SDK 대비 비용·쿼터 이슈 없음
- ORS 경로 폴리라인 렌더링이 자유로움
- 커스터마이징 높은 편

## 6.3. GPS 연동 예정
- `expo-location` 도입 예정
- 실시간 위치 기반 탐색 기능 확장 가능

---

# 7. Docker / 인프라

## 7.1. 개발 환경(`docker-compose.yml`)
- Django 백엔드
- Nginx reverse proxy

## 7.2. 운영 환경(`docker-compose.prod.yml`)
AWS EC2에서 실행되는 프로덕션 구성:
- Django(Gunicorn)
- Nginx(SSL termination · 정적 파일 · API proxy)
- PostgreSQL(AWS RDS)

---

# 8. 배포 파이프라인 (CI/CD)

GitHub Actions 기반 자동 배포:

1. main 브랜치 push
2. GitHub Actions에서 빌드/CI 수행
3. EC2에 pull 또는 SSH 배포
4. 프로덕션 Compose 실행

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

# 9. 도메인 & HTTPS

- 도메인: **mobilfit.kr (가비아)**
- 인증서: **Let’s Encrypt**
- Nginx에서 SSL 자동 갱신 및 HTTPS 운영

---

# 10. 기술적 요약


| 구성 | 기술 |
|------|------|
| 백엔드 | Django + DRF, JWT, 이메일 인증 |
| 모바일 | React Native(Expo), TypeScript |
| 지도 | Leaflet(WebView), ORS, Kakao |
| 인프라 | Docker, Nginx, EC2, RDS |
| 자동배포 | GitHub Actions |

