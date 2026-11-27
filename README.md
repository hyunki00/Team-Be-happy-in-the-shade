<p align="center">
  <img src="frontend/public/logo.png" alt="뭐먹 로고" width="200">
</p>

<h1 align="center">뭐먹 — 냉장고 속 재료로, 오늘 뭐 해 먹지?</h1>

<p align="center">
  냉장고에 있는 재료로 만들 수 있는 레시피를 추천하고, 요리 이야기를 나누는 커뮤니티 플랫폼<br>
  자취생 · 1인 가구를 위한 서비스 · 팀 <b>그늘에있으면기분이해피하조</b> · 2026.11.03 – 11.27
</p>

<p align="center">
  <a href="https://hyun1208.atlassian.net/browse/QYEB"><img src="https://img.shields.io/badge/Jira-%EC%9D%BC%EC%A0%95%20%EA%B4%80%EB%A6%AC-0052CC?style=for-the-badge&logo=jira&logoColor=white" alt="Jira"></a>
</p>

---

## 목차

1. [기획 배경](#기획-배경)
2. [주요 기능](#주요-기능)
3. [기술 스택](#기술-스택)
4. [시스템 구조](#시스템-구조)
5. [DB 구조](#db-구조)
6. [API](#api)
7. [폴더 구조](#폴더-구조)
8. [실행 방법](#실행-방법)
9. [팀원과 담당](#팀원과-담당)
10. [협업 규칙](#협업-규칙)
11. [진행 기록](#진행-기록)

---

## 기획 배경

- 혼자 사는 사람은 장을 봐도 재료가 남고, 남은 재료로 무엇을 만들지 몰라 버리게 된다.
- 레시피 사이트는 "요리 이름"으로 찾는 구조라서, "지금 가진 재료"로 찾기가 어렵다.
- **뭐먹**은 내 냉장고 재료를 등록해 두면, 그 재료와 많이 겹치는 레시피부터 보여 준다.

## 주요 기능

| 기능 | 설명 |
|---|---|
| **내 냉장고** | 가진 재료와 수량 · 소비기한을 등록. 소비기한이 가까운 순으로 정렬, 지난 재료는 확인 후 삭제. 조리도구 탭에서 가진 도구 등록 |
| **레시피 추천** | 내 냉장고 재료와 **50% 이상** 겹치는 레시피를 일치율 순으로 추천 (기준은 백엔드 `MATCH_RATE`) |
| **레시피 검색** | 식약처 레시피 773개. 재료 · 요리 종류 · 난이도 · 조리 시간 필터, ‘내 냉장고 재료 우선’ 정렬. ‘계란’을 쳐도 ‘달걀’이 나오는 유의어 검색 |
| **레시피 상세** | 재료와 분량, 필요한 조리도구, 사진이 있는 조리 순서. 좋아요 · 북마크 · 댓글 |
| **레시피 쓰기** | 대표 사진 · 제목 · 소개 · 재료 · 조리도구 · 단계별 사진과 설명으로 직접 레시피 등록 · 수정 · 삭제 |
| **커뮤니티** | 요리 후기 · 팁 게시글. 사진 첨부, 레시피 연결, 좋아요 · 댓글 |
| **회원** | 아이디 중복 확인, 이메일 인증번호로 가입, 이메일 인증 후 비밀번호 재설정, JWT 쿠키 로그인 |
| **마이페이지** | 프로필 수정, 내 레시피 · 좋아요 · 북마크 · 내 글 · 내 댓글 모아 보기 |
| **메인** | 음식 사진 배너, 로그인하면 ‘지금 만들 수 있는 요리’ 추천, 인기 · 새 레시피, 커뮤니티 새 글 |

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| **프론트엔드** | React 19 · Vite 8 · React Router 7 · Tailwind CSS 4 · axios · SweetAlert2 · react-icons |
| **백엔드** | Python · FastAPI · SQLAlchemy 2 (async, asyncmy) · Pydantic Settings · JWT (PyJWT, 쿠키 인증) · passlib(bcrypt) · Pillow |
| **데이터베이스** | MySQL (테이블 20개) |
| **데이터** | 식품의약품안전처 조리식품 레시피 DB (레시피 773개, 식재료 1,039개) |
| **협업** | GitHub (브랜치 · PR) · [Jira](https://hyun1208.atlassian.net/browse/QYEB) · Confluence · Notion |

- **SweetAlert2**: 삭제 · 로그아웃처럼 되돌리기 어려운 동작 전 확인 창, 등록 성공 · 실패 알림
- **사진**: 업로드한 사진은 `backend/uploads`에 저장하고 DB에는 주소만 저장. 레시피 목록용 썸네일(WebP)은 `frontend/public/thumbs`

## 시스템 구조

```
[브라우저 · React]  ──axios (쿠키 포함)──▶  [FastAPI :8044]  ──SQLAlchemy async──▶  [MySQL]
   localhost:5173                            router → service → crud
                                             JWT 쿠키 인증 · 토큰 자동 재발급(middleware)
```

- 모든 기능은 **router → service → crud** 한 벌로 나뉜다.
- 프론트는 `src/api.js`의 axios 인스턴스 하나(`withCredentials: true`)로만 서버에 요청한다.

## DB 구조

테이블 20개, 외래키 27개. **회원(users)** 에 9개, **레시피(recipes)** 에 6개 테이블이 연결되어 두 테이블이 중심이다.

| 묶음 | 테이블 |
|---|---|
| 회원 | `users` |
| 내 냉장고 | `user_ingredients` · `standard_tools` · `my_tools` |
| 식재료 | `ingredients` · `ingredients_categories` · `ingredient_synonyms` · `ing_cate_synonyms` |
| 레시피 | `recipes` · `recipe_ingredients` · `recipe_steps` · `recipe_categories` · `category_synonyms` |
| 레시피 반응 | `recipe_likes` · `bookmarks` · `recipe_comments` |
| 커뮤니티 | `posts` · `post_images` · `post_comments` · `posts_likes` |

```
users ─┬─ user_ingredients ── ingredients ── ingredients_categories
       ├─ my_tools ── standard_tools ── recipes
       ├─ recipe_likes · bookmarks · recipe_comments ── recipes
       ├─ recipes (작성자) ─┬─ recipe_ingredients ── ingredients
       │                    ├─ recipe_steps
       │                    └─ recipe_categories
       └─ posts · posts_likes · post_comments ── posts ── recipes (연결 레시피)
```

## API

백엔드 실행 후 **http://localhost:8044/docs** 에서 전체 API를 확인하고 바로 호출해 볼 수 있다. (총 53개)

| 기능 | 주소 | 주요 API |
|---|---|---|
| 회원 인증 | `/auth` | 가입 · 로그인 · 로그아웃, 인증번호 보내기 · 확인, 비밀번호 재설정 |
| 회원 | `/users` | 내 정보 조회 · 수정, 아이디 중복 확인, 내 레시피 · 좋아요 · 북마크 · 글 · 댓글 |
| 내 냉장고 | `/fridge` | 재료 조회 · 추가 · 수정 · 삭제, 조리도구 조회 · 추가 · 삭제, 냉장고 기준 추천 |
| 식재료 | `/ingredients` | 재료 검색(유의어 포함), 대분류 |
| 레시피 | `/recipes` | 검색 · 상세 · 추천, 등록 · 수정 · 삭제, 좋아요 · 북마크 |
| 레시피 댓글 | `/recipes/{id}/comments`, `/recipe-comments` | 댓글 조회 · 쓰기 · 수정 · 삭제 |
| 커뮤니티 | `/posts`, `/post-comments` | 게시글 CRUD, 좋아요, 댓글 |
| 메인 | `/home` | 배너 사진, 메인 추천 카드 |
| 사진 | `/images` | 사진 업로드 (JPG · PNG · WEBP, 10MB 이하) |

## 폴더 구조

```
├── backend/
│   ├── main.py                  FastAPI 앱 · CORS · 라우터 등록 · 사진 폴더 열기
│   ├── make_thumbnails.py       레시피 썸네일 일괄 생성 (팀장이 한 번만 실행)
│   ├── requirements.txt
│   └── app/
│       ├── core/                settings · auth · jwt_handle
│       ├── middleware/          token_refresh (토큰 자동 재발급)
│       ├── db/
│       │   ├── database.py
│       │   ├── models/          테이블 모델 (복수형 파일)
│       │   ├── scheme/          요청 · 응답 모양 (Create · Update · Read)
│       │   └── crud/            DB 읽기 · 쓰기
│       ├── services/            기능 로직
│       └── routers/             API 주소
└── frontend/
    ├── public/                  로고 · 파비콘 · 레시피 썸네일(thumbs/)
    └── src/
        ├── App.jsx              라우터 + 공통 레이아웃
        ├── api.js               axios 인스턴스 (모든 요청)
        ├── constants.js         공통 상수
        ├── index.css            디자인 색 · 글꼴 (시안 F)
        ├── components/          NavBar · ProtectedRoute · RecipeCard · IngredientCard · IngredientForm · CommentSection, mypage/
        ├── contexts/            AuthContext (로그인 정보)
        └── pages/               화면 (페이지 파일 16개)
```

## 실행 방법

### 0. 준비

- Python 3.10 이상 (팀은 3.13 사용), Node.js 22 LTS 권장, MySQL 8
- DB는 팀 공유 SQL(테이블 생성 + 초기 데이터)로 먼저 만들어 둔다.

### 1. 백엔드

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # macOS · Linux: source venv/bin/activate
pip install -r requirements.txt
```

`backend/.env` 파일을 만든다. **이 파일은 커밋하지 않는다.**

```env
DB_USER=root
DB_PASSWORD=비밀번호
DB_HOST=localhost
DB_PORT=3306
DB_NAME=DB이름
SECRET_KEY=아무_긴_문자열

# 선택: 레시피 추천 기준 일치율 (기본 0.5 = 50%)
MATCH_RATE=0.5

# 선택: 인증번호 메일 발송용 Gmail (없으면 인증번호가 서버 콘솔에 출력되는 테스트 모드)
MAIL_USERNAME=보내는주소@gmail.com
MAIL_PASSWORD=Gmail앱비밀번호16자리
```

```bash
uvicorn main:app --port=8044 --reload
```

→ API 문서: http://localhost:8044/docs

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

→ 사이트: http://localhost:5173

백엔드 주소가 다르면 `frontend/.env`에 `VITE_API_URL=주소`를 적는다. (기본 `http://localhost:8044`)

## 팀원과 담당

| 이름 | 역할 | 화면 | 서버 |
|---|---|---|---|
| **조현기** | 팀장 · 공통 · 디자인 | 공통 레이아웃 · 메뉴 · 로그인 정보, 메인, 레시피 댓글, 디자인 시안(시안 F) | 서버 기본 구조 · 공통 모듈, 식재료 검색, 레시피 댓글, 사진 업로드, 메인 API, 초기 데이터 |
| **오효정** | 부팀장 · 회원 | 로그인 · 회원가입 · 비밀번호 찾기 · 마이페이지 · 레시피 쓰기 · 수정 | 회원 · 인증, 이메일 인증, 레시피 등록 · 수정 · 삭제 |
| **권우정** | 레시피 | 레시피 검색 · 추천 · 상세, 레시피 카드 | 레시피 검색 · 상세 · 추천 · 좋아요 · 북마크 |
| **정호진** | 내 냉장고 | 내 냉장고 · 재료 카드 · 재료 입력 폼 · 조리도구 탭 | 냉장고 재료 · 조리도구 · 냉장고 추천 |
| **임유빈** | 커뮤니티 · DB | 커뮤니티 목록 · 상세 · 글쓰기 | 게시글 · 좋아요 · 댓글, DB 테이블 설계 |

## 협업 규칙

- **브랜치**: `main`은 팀장만 다룬다. 각자 자기 브랜치(`hyunki`, `woojung`, `hojin`, `hyojeong`, `yubin`)에서 작업 → PR → 팀장이 병합
- **커밋 메시지**: 어떤 파일의 어느 부분을 고쳤는지 적는다. 예) `feat: FridgePage 재료 카드 목록 추가`
- **올리지 않는 것**: `.env`, `node_modules`, `venv`, `__pycache__`
- `git push --force` 금지
- 이름 규칙: 컴포넌트 PascalCase, 변수 · 함수 camelCase, Python · DB · API 필드 snake_case
- 일정 · 할 일은 [Jira](https://hyun1208.atlassian.net/browse/QYEB) (프로젝트 키 `QYEB`, 1~4주차 카드 37장), 회의록은 Confluence, 문서(API 명세 · 컴포넌트 정리 · DB 설계)는 Notion

## 진행 기록

| 기간 | 내용 |
|---|---|
| 1주차 (11/03 – 11/09) | 주제 선정, 와이어프레임 v6, API 명세 · 컴포넌트 정리 · DB 설계, 프론트엔드 기본 세팅 · 공통 레이아웃 |
| 2주차 (11/10 – 11/16) | 디자인 시안 6개 → 시안 F 선정, 화면별 프론트엔드 개발 (가짜 데이터) |
| 3주차 (11/17 – 11/23) | 백엔드 기본 구조, 기능별 API 개발, 화면 – API 연결 |
| 4주차 (11/24 – 11/27) | 이메일 인증 · 사진 업로드 · 썸네일, 메인 · 공통 하단, 버그 수정 · 마무리, 최종 발표 |

---

<p align="center">
  레시피 데이터 출처: 식품의약품안전처 식품안전나라 조리식품 레시피 DB
</p>
