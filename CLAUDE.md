# 프로젝트 안내 (Claude Code가 먼저 읽는 파일)

팀: 그늘에있으면기분이해피하조 (5명) · 기간 2026-11-03 ~ 11-27

주제: 냉장고 식재료 기반 간단 레시피 추천 및 커뮤니티 플랫폼 (자취생 · 1인 가구). AI 기능은 쓰지 않는다.

스택: 프론트 React(Vite) · react-router-dom · axios · sweetalert2 · Tailwind / 백엔드 FastAPI + SQLAlchemy(async) + MySQL, JWT 쿠키 인증

## 기준 세 가지

1. **화면** → 와이어프레임 v6
2. **파일 이름 · 위치 · 경로** → 컴포넌트 정리 문서 (아래 ‘폴더 구조’가 그대로 옮긴 것)
3. **코드 쓰는 방식** → 수업 예시 프로젝트(mini) 방식. 새로운 라이브러리나 낯선 방식은 들이지 않는다.

## 작업할 때 지킬 것

- 파일은 **폴더 없이 `.jsx` 한 개**로 만든다. `Components/X/index.jsx`처럼 폴더 + `index.jsx` 구조로 만들지 않는다.
- 아래 ‘폴더 구조’에 없는 파일 · 폴더는 만들지 말고 먼저 물어본다.
- 초보 팀이 읽을 코드다. 짧고 쉬운 코드, 한국어 주석을 짧게 단다.
- 스타일(색 · 간격)은 나중에 정한다. 지금은 Tailwind 기본 클래스로 최소한만.
- 자기 담당 파일만 고친다. 다른 사람 파일이 필요하면 메신저로 요청한다.
- `.env`, `node_modules`, `venv`, `__pycache__`는 커밋하지 않는다.
- `git push --force` 금지. main 브랜치는 팀장(조현기)만 다룬다. 각자 자기 브랜치(hyunki, woojung, hojin, hyojeong, yubin)에서 작업한다.
- 커밋 메시지에는 어떤 파일의 어느 부분을 고쳤는지 적는다. 예: `feat: FridgePage 재료 카드 목록 추가`
- 커밋 · push는 내가 요청할 때만 한다.

## 폴더 구조

Vite 프로젝트 루트는 `frontend/`다 (`frontend/front/` 아님).

```
frontend/src/
├── main.jsx
├── App.jsx                  라우터(createBrowserRouter) + 공통 레이아웃(RootLayout + Outlet)
├── constants.js             공통 상수 (같이 쓰는 고정 값)
├── mockData.js              가짜 데이터 (백엔드 전까지 쓰는 견본, DB 이름 그대로)
├── components/              여러 페이지가 같이 쓰는 컴포넌트
│   ├── NavBar.jsx
│   ├── ProtectedRoute.jsx
│   ├── SearchFilter.jsx
│   ├── RecipeCard.jsx
│   ├── IngredientCard.jsx
│   ├── IngredientForm.jsx
│   └── CommentSection.jsx
├── contexts/
│   └── AuthContext.jsx      로그인 정보 (AuthProvider + useAuth)
└── pages/
    ├── HomePage.jsx  LoginPage.jsx  SignUpPage.jsx  MyPage.jsx  FridgePage.jsx
    ├── RecipeListPage.jsx  RecipeRecommendPage.jsx  RecipeDetailPage.jsx
    ├── RecipeCreatePage.jsx  RecipeEditPage.jsx
    ├── BoardListPage.jsx  BoardDetailPage.jsx  BoardFormPage.jsx
    └── NotFoundPage.jsx
```

폴더 이름은 소문자(`components`, `contexts`, `pages`), 파일 이름은 PascalCase.

## 파일 · 경로 · 담당

| 파일 (`src/` 아래) | 경로 | 담당 | 비고 |
| --- | --- | --- | --- |
| `main.jsx` · `App.jsx` | — | 조현기 | 아래 경로를 라우터에 모두 등록 |
| `contexts/AuthContext.jsx` | — | 조현기 | mini의 `useAuth.jsx`와 같은 내용 |
| `components/NavBar.jsx` | — | 조현기 | 메뉴: 내 냉장고 · 레시피 검색 · 레시피 쓰기 · 커뮤니티 · 마이페이지 |
| `components/ProtectedRoute.jsx` | — | 조현기 | 로그인 필요 경로를 감쌈 |
| `components/SearchFilter.jsx` | — | 조현기 | `RecipeListPage`에서 사용 |
| `pages/NotFoundPage.jsx` | `*` | 조현기 |  |
| `pages/LoginPage.jsx` | `/login` | 오효정 |  |
| `pages/SignUpPage.jsx` | `/signup` | 오효정 | 이메일 인증 |
| `pages/MyPage.jsx` | `/mypage` | 오효정 | 로그인 필요 |
| `pages/RecipeCreatePage.jsx` | `/recipes/new` | 오효정 | 로그인 필요 |
| `pages/RecipeEditPage.jsx` | `/recipes/:id/edit` | 오효정 | 로그인 · 본인만 |
| `components/CommentSection.jsx` | — | 오효정 | `RecipeDetailPage`에서 사용 |
| `pages/HomePage.jsx` | `/` | 정호진 |  |
| `pages/FridgePage.jsx` | `/fridge` | 정호진 | 로그인 필요. 조리도구 탭도 이 화면 안 |
| `components/IngredientForm.jsx` | — | 정호진 | 재료 등록 · 수정 |
| `components/IngredientCard.jsx` | — | 정호진 | `FridgePage`, `HomePage`에서 사용 |
| `pages/RecipeListPage.jsx` | `/recipes` | 권우정 |  |
| `pages/RecipeRecommendPage.jsx` | `/recipes/recommend` | 권우정 |  |
| `pages/RecipeDetailPage.jsx` | `/recipes/:id` | 권우정 | 한 열 스크롤 |
| `components/RecipeCard.jsx` | — | 권우정 | 홈 · 내 냉장고 · 마이페이지에서도 사용 |
| `pages/BoardListPage.jsx` | `/board` | 임유빈 |  |
| `pages/BoardDetailPage.jsx` | `/board/:id` | 임유빈 |  |
| `pages/BoardFormPage.jsx` | `/board/new`, `/board/:id/edit` | 임유빈 | 로그인 필요 |

라우터에서 `/recipes/recommend`, `/recipes/new`는 `/recipes/:id`보다 먼저 둔다.

## 공통 상수 · 가짜 데이터

- 여러 파일에서 쓰는 고정 값(요리 종류, 난이도, 글자 수 제한, 단위 등)은 `src/constants.js`에서 import 한다. 파일 안에 값을 직접 적지 않는다. 새 상수가 필요하면 만들기 전에 물어본다.
- 백엔드가 생기기 전까지 화면 데이터는 `src/mockData.js`에서 import 해서 `useState(mockRecipes)`처럼 쓴다. 필드 이름을 바꾸거나 새 모양을 지어내지 않는다. 필요한 값이 없으면 물어본다.
- 레시피는 `recipe_title` · `intro`, 게시글은 `title` · `content`. 냉장고 `amount`는 문자열.
- 로그인한 화면을 확인할 때는 `AuthContext.jsx`의 `DEV_LOGIN`을 `true`로 바꾼다. 커밋 전에는 `false`로 되돌린다.
- `user`는 로그인 전 `null`이므로 `user?.nickname`처럼 쓴다.
- 사진 업로드는 미리보기(`URL.createObjectURL`)까지만 만든다.

## 코드 방식 (mini 기준)

- `App.jsx`: `createBrowserRouter` + `RouterProvider`, 공통 레이아웃 `RootLayout` 안에 `NavBar` + `<Outlet />`.
- `AuthContext.jsx`: `AuthProvider`와 `useAuth`를 내보낸다. 값은 `user`, `isAuthenticated`, `error`, `setError`, `login`, `signup`, `logout`.
- 로그인은 **아이디(`login_id`, 영문 · 숫자 4~20자) + 비밀번호(8자 이상)**. 이메일은 회원가입 인증번호와 비밀번호 찾기에만 쓴다. `login(login_id, password)`.
- 서버 요청은 axios 인스턴스 하나(`baseURL: import.meta.env.VITE_API_URL`, `withCredentials: true`)로만 한다. 페이지마다 axios를 새로 만들지 않는다.
- 알림 · 확인창은 sweetalert2로 mini의 `showSuccessAlert`, `showErrorAlert`, `showConfirmDialog`, `handleAuthError` 방식을 쓴다.
- 서버 요청용 파일과 알림 함수 파일은 아직 위치를 정하지 않았다 (백엔드 시작 때). 필요하면 만들기 전에 물어본다.

## 이름 규칙

| 대상 | 표기법 | 예 |
| --- | --- | --- |
| 컴포넌트 · 페이지 | PascalCase `.jsx` | `RecipeCard.jsx`, `FridgePage.jsx` |
| 변수 · 함수 · props | camelCase | `formData`, `handleSubmit`, `onDeleteClick` |
| 훅 | `use` + PascalCase | `useAuth` |
| 상수 | UPPER_SNAKE_CASE | `MATCH_RATE`, `COMMENT_MAX` |
| 환경 변수 | 프론트 `VITE_` + UPPER_SNAKE, 백엔드 UPPER_SNAKE | `VITE_API_URL`, `DB_USER` |
| Python 파일 · 변수 · 함수 | snake_case | `get_by_id`, `user_id` |
| Python 클래스 | PascalCase | `UserCrud`, `UserCreate` |
| DB 테이블 · 컬럼 · API 필드 | snake_case | `users`, `created_at` |
| URL | 소문자 | `/recipes`, `/board` |

- 영어로만 짓는다 (한글 발음 `naengjanggo` 금지). 줄임말은 `id` · `img` · `ing`(DB 이름)만.
- 폼 입력값은 `formData` 객체 하나 + `handleChange`, 제출은 `handleSubmit` (맨 앞에 `e.preventDefault()`).
- 모달 열림은 `is` + 대상 + `Open`, 닫기는 `onClose`, 버튼 클릭은 `on` + 대상 + `Click`.
- 참 · 거짓은 `is` · `has` · `can` + 내용 (`isLoading`, `canSubmit`).
- 목록은 복수형, 하나는 단수형 (`recipes` / `recipe`).
- 서버 요청 함수는 `get` · `create` · `update` · `delete` + 대상 (`getRecipes`, `createComment`), 켜기 · 끄기는 `toggle` + 대상 (`toggleLike`).
- 입력칸 `name`과 API로 주고받는 필드는 DB 컬럼 이름 그대로 쓴다. 프론트에서 바꾸지 않는다.
- 닉네임은 mini의 `username` 대신 DB에 맞춰 `nickname`으로 쓴다.

## 화면 결정 사항 (와이어프레임 v6)

- 레시피 추천: 냉장고 재료 일치율 70% 이상만. 필수 재료 없음. 70%는 백엔드 설정 `MATCH_RATE`로만 바꾼다 (화면에서 못 바꿈).
- 보관 위치(냉장 · 냉동 · 실온) 없음.
- 재료 단위: 육류 `g`(1–999), 음료 `L`, 나머지 `개`(1–99).
- 내 냉장고는 소비기한 순 정렬. 소비기한이 지난 재료는 확인창을 띄운 뒤 자동 삭제.
- 요리 종류: 밥 · 일품 · 국&찌개 · 반찬 · 후식 · 기타.
- 레시피 검색: 재료를 안 고르면 가나다순, 고르면 일치율순. ‘모든 재료 일치’ ON + 재료 필터면 그 재료가 꼭 들어간 레시피만 보이고, 일치율은 내 냉장고 기준으로 계산.
- 레시피 쓰기: 단계마다 사진, 빈 글자(null) 저장 안 함.
- 게시글 상세: 사진이 없으면 글 영역을 넓게.
- 댓글은 최신순, 댓글 좋아요 없음. 커뮤니티 목록에 카테고리 탭 없음.

## 백엔드 (mini 기준)

```
backend/
├── .env                     DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, SECRET_KEY ...
├── main.py                  FastAPI 앱, CORS, include_router
└── app/
    ├── core/                settings.py, auth.py, jwt_handle.py
    ├── middleware/          token_refresh.py
    ├── db/
    │   ├── database.py
    │   ├── models/          users.py   → class User
    │   ├── scheme/          users.py   → UserCreate, UserRead ...
    │   └── crud/            user.py    → class UserCrud
    ├── services/            user.py    → class UserService
    └── routers/             user.py    → APIRouter(prefix="/users")
```

mini의 오타(`serivces`, `alertUtiles`, `LootLayout`)는 따라 하지 않고 `services`, `alertUtils`, `RootLayout`으로 쓴다.

| 기능 | 모델 | crud · service | 라우터 prefix |
| --- | --- | --- | --- |
| 회원 | `User` | `UserCrud` · `UserService` | `/users` |
| 내 냉장고 | `UserIngredient` | `FridgeCrud` · `FridgeService` | `/fridge` |
| 식재료 | `Ingredient` · `IngredientCategory` · `IngredientSynonym` | `IngredientCrud` | `/ingredients` |
| 조리도구 | `StandardTool` · `MyTool` | `ToolCrud` · `ToolService` | `/tools` |
| 레시피 | `Recipe` · `RecipeCategory` · `RecipeIngredient` · `RecipeStep` | `RecipeCrud` · `RecipeService` | `/recipes` |
| 레시피 반응 | `RecipeLike` · `Bookmark` · `RecipeComment` | `RecipeCrud` 안에 | `/recipes/{recipe_id}/comments` 등 |
| 게시판 | `Post` · `PostImage` · `PostLike` · `PostComment` | `PostCrud` · `PostService` | `/posts` (화면 주소는 `/board`) |

- 모델 파일은 복수형(`recipes.py`), crud · service · router 파일은 단수형(`recipe.py`).
- scheme 클래스는 모델명 + `Create` · `Update` · `Read`. crud 메서드는 `get_by_id` · `create` · `update_by_id` · `delete_by_id`.
- DB 이름은 11/6 최신 DB 설계서(테이블 생성 SQL) 기준. 헷갈리기 쉬운 것:
  - `users`: `login_id`(로그인 아이디, DB에 추가 예정), `email`(인증용), `nickname` (username 아님), `created_at`
  - `user_ingredients.amount`는 문자열(VARCHAR)
  - `recipes`: 소개글은 `intro`(200자), `tool_id`(필요 조리도구) 필수, `level`은 초급 · 중급 · 고급
  - `posts`: `title`, `content` / `post_images`: `image_id`, `image_url`, `image_order` / 게시글 좋아요 테이블은 `posts_likes`
  - 좋아요 · 북마크 테이블은 `user_id` + 대상 id 복합 키 (별도 id 없음)
  - 유의어: `ingredient_synonyms` · `tool_synonyms` · `category_synonyms` (`synonym_id`, `synonym_name`)
- 일치율 계산은 `RecipeService`. 서버가 계산해서 주는 값: `match_rate`, `missing_ingredients`, `like_count`, `comment_count`, `is_liked`, `is_bookmarked`, `is_mine`.

## 아직 정하지 않은 것 (임의로 정하지 말고 물어볼 것)

- `RecipeRecommendPage`를 따로 둘지 (v6에서는 추천이 내 냉장고 · 검색 화면 안에 있음)
- `CommentSection`을 게시글 댓글에도 쓸지
- 컴포넌트 문서에 없는 화면(비밀번호 찾기, 프로필 수정, 내 댓글, 재료 담기, 식재료 선택 모달)의 파일 이름
- 서버 요청 · 알림 함수를 둘 파일 위치 (백엔드 시작 때)
- 재료 대분류 이름 · 번호, 사진 업로드 방식
- `constants.js`에 (가안)으로 표시된 값
- 내 냉장고 화면 안 (A-1 / A-2 / B)
