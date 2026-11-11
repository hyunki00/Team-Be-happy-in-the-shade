// 공통 상수: 여러 사람이 같이 쓰는 고정 값 (담당: 조현기)
// 값을 바꿀 때는 이 파일만 고치고 메신저로 알린다. 각자 파일에 같은 값을 따로 적지 않는다.
// 쓰는 법: import { RECIPE_CATEGORIES, COMMENT_MAX } from "../constants";
// (가안) 표시는 팀이 아직 확정하지 않은 값이다.

// ── 레시피 ──────────────────────────────

// 요리 종류 (와이어프레임 v6). 번호는 DB recipe_categories와 맞출 예정 (가안)
export const RECIPE_CATEGORIES = [
  { r_category_id: 1, category_name: "밥" },
  { r_category_id: 2, category_name: "일품" },
  { r_category_id: 3, category_name: "국&찌개" },
  { r_category_id: 4, category_name: "반찬" },
  { r_category_id: 5, category_name: "후식" },
  { r_category_id: 6, category_name: "기타" },
];

// 난이도 (DB recipes.level 값)
export const RECIPE_LEVELS = ["초급", "중급", "고급"];

// 조리시간 필터. value는 "몇 분 이하", 0은 "60분 초과"
export const COOKING_TIME_FILTERS = [
  { value: 15, label: "15분 이내" },
  { value: 30, label: "30분 이내" },
  { value: 60, label: "60분 이내" },
  { value: 0, label: "60분 이상" },
];

// 레시피 정렬: 재료를 안 고르면 가나다순, 고르면 일치율순
export const RECIPE_SORT = [
  { value: "name", label: "가나다순" },
  { value: "match_rate", label: "일치율순" },
];

export const COOKING_TIME_DEFAULT = 10; // 레시피 쓰기 기본 조리시간(분) (가안)
export const SERVINGS_DEFAULT = 1; // 인분 기본값 (가안, DB에 인분 컬럼이 아직 없음)
export const SERVINGS_MAX = 99; // (가안)

export const RECIPE_TITLE_MAX = 50; // 레시피 제목 글자 수 (가안, DB는 100자)
export const RECIPE_INTRO_MAX = 200; // 레시피 소개글 글자 수 (DB recipes.intro 200자)

// ── 내 냉장고 ───────────────────────────

// 재료 단위: 육류 g, 음료 L, 나머지 개 (와이어프레임 v6)
export const UNIT_MEAT = "g";
export const UNIT_DRINK = "L";
export const UNIT_DEFAULT = "개";

export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 99; // 개 · L 최대
export const MEAT_AMOUNT_MAX = 999; // g 최대

export const EXPIRY_WARNING_DAYS = 3; // 소비기한 며칠 남으면 강조할지 (가안)

// ── 커뮤니티 · 댓글 ─────────────────────

export const BOARD_SORT = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
];

export const BOARD_SEARCH_TYPES = [
  { value: "title", label: "제목" },
  { value: "title_content", label: "제목+내용" },
  { value: "author", label: "작성자" },
];

export const BOARD_TITLE_MAX = 100; // DB posts.title 100자
export const BOARD_CONTENT_MAX = 5000; // (가안)
export const COMMENT_MAX = 500; // (가안)

// ── 회원 ────────────────────────────────

export const LOGIN_ID_MIN = 4; // 로그인 아이디: 영문 · 숫자 4~20자 (와이어프레임 8장)
export const LOGIN_ID_MAX = 20;
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20; // (가안, DB는 50자)
export const PASSWORD_MIN = 8; // 8자 이상 (와이어프레임 8장)

// ── 사진 ────────────────────────────────

export const BOARD_IMAGE_MAX_COUNT = 5; // 게시글 사진 최대 장수 (가안)
export const IMAGE_MAX_MB = 10; // 사진 한 장 최대 용량 (가안)
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
