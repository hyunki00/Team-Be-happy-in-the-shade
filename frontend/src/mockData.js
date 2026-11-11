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
  login_id: "user1", // 로그인 아이디 (영문 · 숫자 4~20자)
  email: "user1@test.com", // 회원가입 인증 · 비밀번호 찾기용
  nickname: "요리왕유빈",
};

// ── 식재료 · 대분류 (재료 담기, 식재료 선택 모달) ──
// DB ingredients_categories 테이블 기준 8가지 대분류 반영
export const mockIngredientCategories = [
  { ing_category_id: 1, category_name: "채소" },
  { ing_category_id: 2, category_name: "버섯" },
  { ing_category_id: 3, category_name: "육류" },
  { ing_category_id: 4, category_name: "해산물" },
  { ing_category_id: 5, category_name: "달걀·유제품" },
  { ing_category_id: 6, category_name: "과일" },
  { ing_category_id: 7, category_name: "곡류·면" },
  { ing_category_id: 8, category_name: "양념·소스" },
];

// SQL INSERT 데이터와 일치하도록 대분류별 식재료 추가
export const mockIngredients = [
  // 1. 채소
  { ing_id: 1, ing_name: "대파", ing_category_id: 1 },
  { ing_id: 2, ing_name: "양파", ing_category_id: 1 },
  { ing_id: 3, ing_name: "마늘", ing_category_id: 1 },
  { ing_id: 4, ing_name: "시금치", ing_category_id: 1 },
  { ing_id: 5, ing_name: "깻잎", ing_category_id: 1 },
  // 2. 버섯
  { ing_id: 6, ing_name: "표고버섯", ing_category_id: 2 },
  { ing_id: 7, ing_name: "팽이버섯", ing_category_id: 2 },
  { ing_id: 8, ing_name: "새송이버섯", ing_category_id: 2 },
  // 3. 육류
  { ing_id: 9, ing_name: "돼지고기", ing_category_id: 3 },
  { ing_id: 10, ing_name: "소고기", ing_category_id: 3 },
  { ing_id: 11, ing_name: "닭고기", ing_category_id: 3 },
  // 4. 해산물
  { ing_id: 12, ing_name: "새우", ing_category_id: 4 },
  { ing_id: 13, ing_name: "오징어", ing_category_id: 4 },
  { ing_id: 14, ing_name: "바지락", ing_category_id: 4 },
  // 5. 달걀·유제품
  { ing_id: 15, ing_name: "달걀", ing_category_id: 5 },
  { ing_id: 16, ing_name: "우유", ing_category_id: 5 },
  { ing_id: 17, ing_name: "버터", ing_category_id: 5 },
  { ing_id: 18, ing_name: "치즈", ing_category_id: 5 },
  // 6. 과일
  { ing_id: 19, ing_name: "사과", ing_category_id: 6 },
  { ing_id: 20, ing_name: "바나나", ing_category_id: 6 },
  { ing_id: 21, ing_name: "레몬", ing_category_id: 6 },
  // 7. 곡류·면
  { ing_id: 22, ing_name: "쌀", ing_category_id: 7 },
  { ing_id: 23, ing_name: "소면", ing_category_id: 7 },
  { ing_id: 24, ing_name: "라면사리", ing_category_id: 7 },
  { ing_id: 25, ing_name: "스파게티면", ing_category_id: 7 },
  // 8. 양념·소스
  { ing_id: 26, ing_name: "간장", ing_category_id: 8 },
  { ing_id: 27, ing_name: "고추장", ing_category_id: 8 },
  { ing_id: 28, ing_name: "된장", ing_category_id: 8 },
  { ing_id: 29, ing_name: "설탕", ing_category_id: 8 },
  { ing_id: 30, ing_name: "참기름", ing_category_id: 8 },
  { ing_id: 31, ing_name: "고춧가루", ing_category_id: 8 },
];

// ── 내 냉장고 (user_ingredients + 재료 이름 · 대분류) ──
// amount는 DB에서 문자열(VARCHAR) 또는 정수형태이므로 기존 스타일에 맞춤
export const mockFridge = [
  { user_ing_id: 1, ing_id: 15, ing_name: "달걀", ing_category_id: 5, amount: "10", unit: "개", expiration_date: "2026-11-20" },
  { user_ing_id: 2, ing_id: 2, ing_name: "양파", ing_category_id: 1, amount: "3", unit: "개", expiration_date: "2026-11-30" },
  { user_ing_id: 3, ing_id: 9, ing_name: "돼지고기", ing_category_id: 3, amount: "500", unit: "g", expiration_date: "2026-11-10" },
  { user_ing_id: 4, ing_id: 16, ing_name: "우유", ing_category_id: 5, amount: "1", unit: "L", expiration_date: "2026-11-09" },
  { user_ing_id: 5, ing_id: 26, ing_name: "간장", ing_category_id: 8, amount: "1", unit: "개", expiration_date: null },
];

// ── 조리도구 (standard_tools 12가지 반영) ──
export const mockStandardTools = [
  { tool_id: 1, tool_name: "프라이팬" },
  { tool_id: 2, tool_name: "냄비" },
  { tool_id: 3, tool_name: "전자레인지" },
  { tool_id: 4, tool_name: "밥솥" },
  { tool_id: 5, tool_name: "전기포트" },
  { tool_id: 6, tool_name: "에어프라이어" },
  { tool_id: 7, tool_name: "오븐" },
  { tool_id: 8, tool_name: "믹서기" },
  { tool_id: 9, tool_name: "찜기" },
  { tool_id: 10, tool_name: "토스터" },
  { tool_id: 11, tool_name: "그릴팬" },
  { tool_id: 12, tool_name: "와플메이커" },
];

export const mockMyTools = [
  { user_tool_id: 1, tool_id: 1, tool_name: "프라이팬" },
  { user_tool_id: 2, tool_id: 2, tool_name: "냄비" },
  { user_tool_id: 3, tool_id: 6, tool_name: "에어프라이어" },
];

// ── 레시피 목록 · 카드 (RecipeCard) ─────
export const mockRecipes = [
  {
    recipe_id: 1,
    recipe_title: "초간단 계란볶음밥",
    intro: "찬밥과 계란으로 5분 만에 만드는 볶음밥",
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
    intro: "밥도둑 양념장의 돼지고기 제육볶음",
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
    missing_ingredients: [{ ing_id: 27, ing_name: "고추장" }],
  },
  {
    recipe_id: 3,
    recipe_title: "자취생 계란찜",
    intro: "전자레인지로 3분 만에 돌려 완성하는 계란찜",
    image_url: IMG("Egg"),
    level: "초급",
    cooking_time: 5,
    r_category_id: 5,
    category_name: "후식",
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
export const mockRecipeDetail = {
  ...mockRecipes[0],
  servings: 1,
  is_liked: false,
  is_bookmarked: true,
  is_mine: true,
  ingredients: [
    { ing_id: 15, ing_name: "달걀", amount_text: "2개" },
    { ing_id: 2, ing_name: "양파", amount_text: "1/2개" },
    { ing_id: 26, ing_name: "간장", amount_text: "1큰술" },
  ],
  steps: [
    { step_id: 1, step_no: 1, step_content: "달걀을 풀어 볶아둡니다.", step_image_url: IMG("Step1") },
    { step_id: 2, step_no: 2, step_content: "밥과 간장을 넣고 볶습니다.", step_image_url: null },
  ],
};

// ── 레시피 댓글 (CommentSection) ───────
export const mockRecipeComments = [
  { rc_id: 2, recipe_id: 1, user_id: 2, nickname: "자취생김프로", rc_content: "와 진짜 간단해 보이네요 오늘 저녁 메뉴로 정했습니다!", rc_image_url: null, created_at: "2026-11-07T20:00:00", is_mine: false },
  { rc_id: 1, recipe_id: 1, user_id: 3, nickname: "냉장고파괴자", rc_content: "간장 살짝 태워서 향 내면 더 맛있어요 꿀팁!", rc_image_url: null, created_at: "2026-11-06T08:15:00", is_mine: false },
];

// ── 커뮤니티 게시글 (BoardListPage · BoardDetailPage) ──
export const mockPosts = [
  {
    post_id: 1,
    title: "오늘 자취방 냉장고 파먹기 성공!",
    content: "냉장고에 있던 남은 재료로 계란볶음밥 만들어 먹었는데 대성공이네요 다들 식사 챙기세요!",
    user_id: 1,
    nickname: "요리왕유빈",
    created_at: "2026-11-07T12:00:00",
    like_count: 8,
    comment_count: 3,
    is_liked: false,
    is_mine: true,
    images: [
      { image_id: 1, image_url: "https://example.com/community1_1.jpg", image_order: 1 },
      { image_id: 2, image_url: "https://example.com/community1_2.jpg", image_order: 2 }
    ],
  },
  {
    post_id: 2,
    title: "요리 초보인데 에어프라이어 추천 제품 있나요?",
    content: "치킨너겟만 돌려먹다가 다른 요리도 해보고 싶은데 추천해주실 만한 에어프라이어 도구나 레시피 있나요?",
    user_id: 2,
    nickname: "자취생김프로",
    created_at: "2026-11-06T22:40:00",
    like_count: 3,
    comment_count: 0,
    is_liked: true,
    is_mine: false,
    images: [{ image_id: 3, image_url: "https://example.com/community2_1.jpg", image_order: 1 }],
  },
  {
    post_id: 3,
    title: "남은 대파 보관하는 꿀팁 공유합니다",
    content: "대파를 썰어서 냉동실에 얼려두면 요리할 때 정말 편해요!",
    user_id: 1,
    nickname: "요리왕유빈",
    created_at: "2026-11-05T15:20:00",
    like_count: 5,
    comment_count: 1,
    is_liked: false,
    is_mine: true,
    images: [],
  },
  {
    post_id: 4,
    title: "자취 3년 차의 냉장고 정리 꿀팁 공유합니다!",
    content: "유통기한 지난 식재료 주기적으로 확인하고 카테고리별로 밀폐용기에 담아두면 버리는 재료가 훨씬 줄어들어요.",
    user_id: 3,
    nickname: "냉장고파괴자",
    created_at: "2026-11-04T10:00:00",
    like_count: 12,
    comment_count: 1,
    is_liked: true,
    is_mine: false,
    images: [{ image_id: 4, image_url: "https://example.com/community4_1.jpg", image_order: 1 }],
  },
];

// ── 게시글 댓글 ─────────────────────────
export const mockPostComments = [
  { pc_id: 1, post_id: 1, user_id: 2, nickname: "자취생김프로", pc_content: "부러워요 저도 냉장고 비우기 도전해야 하는데 ㅎㅎ", pc_image_url: null, created_at: "2026-11-07T13:00:00", is_mine: false },
  { pc_id: 2, post_id: 1, user_id: 3, nickname: "냉장고파괴자", pc_content: "저도 오늘 저녁에 바로 도전해보겠습니다!", pc_image_url: null, created_at: "2026-11-07T14:00:00", is_mine: false },
  { pc_id: 3, post_id: 3, user_id: 1, nickname: "요리왕유빈", pc_content: "오 이 방법 써봐야겠네요 감사합니다!", pc_image_url: null, created_at: "2026-11-05T16:00:00", is_mine: true },
  { pc_id: 4, post_id: 4, user_id: 2, nickname: "자취생김프로", pc_content: "정말 유용한 팁이네요! 밀폐용기부터 사러 갑니다.", pc_image_url: null, created_at: "2026-11-04T11:30:00", is_mine: false },
];