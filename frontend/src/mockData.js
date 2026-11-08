// 가짜 데이터: 백엔드가 생기기 전까지 화면을 만들 때 쓰는 견본 (담당: 조현기)
// 이름은 DB 컬럼 이름 그대로. DB에 없는 값(작성자 닉네임, 좋아요 수 등)은 서버가 붙여 줄 이름으로 미리 맞춰 둠.
// 쓰는 법: import { mockRecipes } from "../mockData";
//          const [recipes, setRecipes] = useState(mockRecipes);
// 백엔드가 생기면 useState(mockRecipes) 대신 서버 요청 결과를 넣는다.
// 화면에 필요한 값이 여기 없으면 각자 파일에 따로 만들지 말고 메신저로 알려서 이 파일에 추가한다.

const IMG = (text) => `https://placehold.co/400x300?text=${text}`;

// ── 로그인한 사용자 ─────────────────────
// AuthContext의 DEV_LOGIN을 true로 바꾸면 이 사용자로 로그인한 상태가 된다.
export const mockUser = {
  user_id: 1,
  email: "user1@test.com",
  nickname: "요리왕유빈",
};

// ── 식재료 · 대분류 (재료 담기, 식재료 선택 모달) ──
// 대분류 이름은 가안 (DB ingredients_categories와 맞출 예정)
export const mockIngredientCategories = [
  { ing_category_id: 1, category_name: "채소" },
  { ing_category_id: 2, category_name: "육류" },
  { ing_category_id: 3, category_name: "달걀·유제품" },
  { ing_category_id: 4, category_name: "음료" },
  { ing_category_id: 5, category_name: "양념" },
];

export const mockIngredients = [
  { ing_id: 1, ing_name: "달걀", ing_category_id: 3 },
  { ing_id: 2, ing_name: "양파", ing_category_id: 1 },
  { ing_id: 3, ing_name: "대파", ing_category_id: 1 },
  { ing_id: 4, ing_name: "마늘", ing_category_id: 1 },
  { ing_id: 5, ing_name: "돼지고기", ing_category_id: 2 },
  { ing_id: 6, ing_name: "소고기", ing_category_id: 2 },
  { ing_id: 7, ing_name: "간장", ing_category_id: 5 },
  { ing_id: 8, ing_name: "고추장", ing_category_id: 5 },
  { ing_id: 9, ing_name: "우유", ing_category_id: 4 },
  { ing_id: 10, ing_name: "참기름", ing_category_id: 5 },
];

// ── 내 냉장고 (user_ingredients + 재료 이름 · 대분류) ──
// amount는 DB에서 문자열(VARCHAR)이라 "10"처럼 문자열로 둠
export const mockFridge = [
  { user_ing_id: 1, ing_id: 1, ing_name: "달걀", ing_category_id: 3, amount: "10", unit: "개", expiration_date: "2026-11-20" },
  { user_ing_id: 2, ing_id: 2, ing_name: "양파", ing_category_id: 1, amount: "3", unit: "개", expiration_date: "2026-11-30" },
  { user_ing_id: 3, ing_id: 5, ing_name: "돼지고기", ing_category_id: 2, amount: "500", unit: "g", expiration_date: "2026-11-10" },
  { user_ing_id: 4, ing_id: 9, ing_name: "우유", ing_category_id: 4, amount: "1", unit: "L", expiration_date: "2026-11-09" },
  { user_ing_id: 5, ing_id: 7, ing_name: "간장", ing_category_id: 5, amount: "1", unit: "개", expiration_date: null },
];

// ── 조리도구 ────────────────────────────
export const mockStandardTools = [
  { tool_id: 1, tool_name: "프라이팬" },
  { tool_id: 2, tool_name: "냄비" },
  { tool_id: 3, tool_name: "전자레인지" },
  { tool_id: 4, tool_name: "에어프라이어" },
  { tool_id: 5, tool_name: "오븐" },
];

export const mockMyTools = [
  { user_tool_id: 1, tool_id: 1, tool_name: "프라이팬" },
  { user_tool_id: 2, tool_id: 2, tool_name: "냄비" },
  { user_tool_id: 3, tool_id: 4, tool_name: "에어프라이어" },
];

// ── 레시피 목록 · 카드 (RecipeCard) ─────
// match_rate: 내 냉장고 일치율(0~1), missing_ingredients: 냉장고에 없는 재료
export const mockRecipes = [
  {
    recipe_id: 1,
    recipe_title: "초간단 계란볶음밥",
    intro: "남은 찬밥과 계란으로 5분 만에 만드는 볶음밥",
    image_url: IMG("Rice"),
    level: "초급",
    cooking_time: 10,
    r_category_id: 1,
    category_name: "밥",
    tool_id: 1,
    tool_name: "프라이팬",
    user_id: 1,
    nickname: "요리왕유빈",
    created_at: "2026-11-05T12:00:00",
    like_count: 12,
    comment_count: 2,
    match_rate: 1,
    missing_ingredients: [],
  },
  {
    recipe_id: 2,
    recipe_title: "매콤달콤 제육볶음",
    intro: "밥도둑 양념장으로 만드는 돼지고기 제육볶음",
    image_url: IMG("Pork"),
    level: "중급",
    cooking_time: 20,
    r_category_id: 4,
    category_name: "반찬",
    tool_id: 1,
    tool_name: "프라이팬",
    user_id: 1,
    nickname: "요리왕유빈",
    created_at: "2026-11-06T18:30:00",
    like_count: 30,
    comment_count: 0,
    match_rate: 0.67,
    missing_ingredients: [{ ing_id: 8, ing_name: "고추장" }],
  },
  {
    recipe_id: 3,
    recipe_title: "자취생 계란찜",
    intro: "전자레인지에 3분만 돌리면 끝나는 부드러운 계란찜",
    image_url: IMG("Egg"),
    level: "초급",
    cooking_time: 5,
    r_category_id: 4,
    category_name: "반찬",
    tool_id: 3,
    tool_name: "전자레인지",
    user_id: 2,
    nickname: "자취생김프로",
    created_at: "2026-11-07T09:10:00",
    like_count: 5,
    comment_count: 1,
    match_rate: 1,
    missing_ingredients: [],
  },
];

// ── 레시피 상세 (RecipeDetailPage) ─────
// 목록 카드 값 + 재료 · 조리 순서 · 내 반응
// amount_text(재료 분량)와 servings(인분)는 DB에 아직 없음 → 정할 것
export const mockRecipeDetail = {
  ...mockRecipes[0],
  servings: 1,
  is_liked: false,
  is_bookmarked: true,
  is_mine: true,
  ingredients: [
    { ing_id: 1, ing_name: "달걀", amount_text: "2개" },
    { ing_id: 2, ing_name: "양파", amount_text: "1/2개" },
    { ing_id: 7, ing_name: "간장", amount_text: "1큰술" },
  ],
  steps: [
    { step_id: 1, step_no: 1, step_content: "팬에 기름을 두르고 달걀을 풀어 스크램블을 만든 후 잠시 꺼내 둡니다.", step_image_url: IMG("Step1") },
    { step_id: 2, step_no: 2, step_content: "팬에 밥과 간장을 넣고 볶다가 스크램블을 섞어 줍니다.", step_image_url: null },
  ],
};

// ── 레시피 댓글 (CommentSection) ───────
// 최신순으로 정렬된 상태
export const mockRecipeComments = [
  { rc_id: 2, recipe_id: 1, user_id: 2, nickname: "자취생김프로", rc_content: "간장 대신 굴소스도 맛있어요!", rc_image_url: null, created_at: "2026-11-07T20:00:00", is_mine: false },
  { rc_id: 1, recipe_id: 1, user_id: 3, nickname: "냉장고파괴자", rc_content: "5분 컷 인정합니다", rc_image_url: null, created_at: "2026-11-06T08:15:00", is_mine: false },
];

// ── 커뮤니티 게시글 (BoardListPage · BoardDetailPage) ──
// 게시글은 레시피와 달리 title · content 이름을 씀 (DB posts)
export const mockPosts = [
  {
    post_id: 1,
    title: "오늘 자취방 냉장고 파먹기 성공!",
    content: "냉장고에 있던 남은 재료로 계란볶음밥 만들어 먹었는데 대성공이네요. 다들 식사 챙기세요!",
    user_id: 1,
    nickname: "요리왕유빈",
    created_at: "2026-11-07T12:00:00",
    like_count: 8,
    comment_count: 1,
    is_liked: false,
    is_mine: true,
    images: [{ image_id: 1, image_url: IMG("Post1"), image_order: 1 }],
  },
  {
    post_id: 2,
    title: "요리 초보인데 에어프라이어 추천 있나요?",
    content: "치킨너겟만 돌려 먹다가 다른 요리도 해 보고 싶어요.",
    user_id: 2,
    nickname: "자취생김프로",
    created_at: "2026-11-06T22:40:00",
    like_count: 3,
    comment_count: 0,
    is_liked: true,
    is_mine: false,
    images: [], // 사진 없는 글 → 상세에서 글 영역을 넓게
  },
];

// ── 게시글 댓글 ─────────────────────────
export const mockPostComments = [
  { pc_id: 1, post_id: 1, user_id: 3, nickname: "냉장고파괴자", pc_content: "저도 해 봐야겠어요", pc_image_url: null, created_at: "2026-11-07T13:00:00", is_mine: false },
];
