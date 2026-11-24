// 담당: 조현기
// 메인 화면 (와이어프레임 v6 5~6장 · 디자인 시안 F)
// 로그인: 배너(내 냉장고 열기) → 내 냉장고 추천 → 인기 레시피 + 커뮤니티 새 글
// 비로그인: 배너(로그인하고 시작하기) → 인기 레시피 → 새로 올라온 레시피 + 커뮤니티 새 글
// [11/24 조현기] 내 냉장고 추천은 서버 계산이 3~4초 걸려서 따로 로딩: 그동안 회색 자리 카드 4장 + 배너 '찾는 중'
//   (나머지 섹션은 먼저 뜨고, 추천이 오면 같은 자리에 카드만 바뀜 → 화면이 밀리지 않음)
// [11/24 조현기] 추천 '더보기' · 주황 배너 카드 → 추천 전체 화면(/recipes/recommend, 권우정)으로 연결
// [11/24 조현기] 내 냉장고 추천: /fridge/recommendations(3초 넘게 걸림) → 메인 전용 /home/recommendations (0.1초 안팎)
//   서버가 { total: 전체 개수, recipes: 위 4개 }로 줌. 계산 방법 · 순서는 기존 추천과 같음
// [11/24 조현기] 인기 · 새 레시피 · 커뮤니티 새 글도 불러오는 동안 '아직 없어요' 대신 회색 자리 표시 (처음 값 null = 불러오는 중)
// [11/24 조현기] 첫 배너 오른쪽에 음식 사진이 3초마다 스르륵 바뀜 (HeroFoodImages, 장식용)
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";
import RecipeCard from "../components/RecipeCard";

// 섹션마다 보여 줄 개수 (이 화면에서만 쓰는 값)
const RECOMMEND_COUNT = 4;
const POPULAR_COUNT = 4;
const NEW_RECIPE_COUNT = 3;
const NEW_POST_COUNT = 4;

// [11/24 조현기] 첫 배너 음식 사진: 몇 장 받을지 · 몇 초마다 넘길지 (10장 × 3초 = 30초에 한 바퀴)
const HERO_IMAGE_COUNT = 10;
const HERO_INTERVAL_MS = 3000;

// [11/24 조현기] 첫 배너 오른쪽 음식 사진 (장식용 — 눌러도 아무 일 없음)
//   1. 처음 한 번 GET /home/hero-images로 사진이 있는 레시피 10장을 무작위로 받음 (새로고침마다 다른 음식)
//   2. 10장을 모두 같은 자리에 겹쳐 두고, 지금 차례(index)인 한 장만 보이게(opacity-100) 함
//      나머지는 투명(opacity-0). 차례가 바뀌면 이전 사진은 흐려지고 다음 사진은 나타남 (1초 동안 = 스르륵)
//      → 10장을 처음부터 같이 불러 두니, 바뀌는 순간 빈칸이 생기지 않음
//   3. 3초마다 index를 1씩 늘림. 마지막 다음은 다시 처음으로
//   4. 모양: 왼쪽은 안 보이고 오른쪽으로 갈수록 드러나는 그라데이션(index.css의 hero-fade-mask) + 전체 반투명
//   - 사진을 받기 전 · 받기 실패 · 사진이 깨진 경우: 그 사진은 안 보이고 베이지 바탕 그대로 (오류 안내 없음, 장식이라서)
//   - 컴퓨터 설정에서 '애니메이션 줄이기'를 켠 사람: 넘기지 않고 첫 사진 한 장만 보여 줌
function HeroFoodImages() {
  const [images, setImages] = useState([]);        // 받은 사진 목록 [{ recipe_id, image_url }, …]
  const [index, setIndex] = useState(0);           // 지금 보이는 사진 번호 (0부터)
  const [loadedIds, setLoadedIds] = useState([]);  // 다 내려받은 사진의 recipe_id (다 받기 전에는 안 보이게)

  // 1. 사진 목록 받기 (처음 한 번)
  useEffect(() => {
    const controller = new AbortController();
    api.get("/home/hero-images", { params: { count: HERO_IMAGE_COUNT }, signal: controller.signal })
      .then(({ data }) => setImages(data))
      .catch(() => {});   // 장식이라 실패해도 조용히 (사진 없이 배너만)
    return () => controller.abort();
  }, []);

  // 3. 3초마다 다음 사진으로 (사진이 2장 이상이고, '애니메이션 줄이기'가 꺼져 있을 때만)
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (images.length < 2 || reduceMotion) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);   // % : 나머지 → 9 다음은 0
    }, HERO_INTERVAL_MS);
    return () => clearInterval(timer);   // 화면을 떠나면 타이머 정지
  }, [images.length]);

  // 사진 한 장이 다 내려받아지면 기록 (onLoad)
  const handleLoad = (recipeId) => setLoadedIds((prev) => [...prev, recipeId]);

  return (
    // absolute inset-y-0 right-0: 배너 카드의 위아래 끝까지, 오른쪽에 붙는 층 (카드에 relative가 있어야 카드 기준)
    // w-full md:w-[65%]: 좁은 화면은 카드 전체, 넓은 화면은 오른쪽 65%만 → 음식이 오른쪽 빈 곳 가운데에 옴
    // pointer-events-none: 장식이라 마우스 클릭을 아래(버튼)로 그대로 통과시킴
    // opacity-30 md:opacity-70: 좁은 화면은 글자와 겹치니 더 옅게(30%), 넓은 화면은 70%
    // aria-hidden: 화면 읽기 프로그램이 장식 사진을 읽지 않게
    <div className="hero-fade-mask pointer-events-none absolute inset-y-0 right-0 w-full opacity-30 md:w-[65%] md:opacity-70" aria-hidden="true">
      {images.map((image, i) => (
        <img
          key={image.recipe_id}
          src={image.image_url}
          alt=""
          onLoad={() => handleLoad(image.recipe_id)}
          // 지금 차례이고 다 내려받았을 때만 보이게. transition-opacity duration-1000: 투명도가 1초에 걸쳐 바뀜
          // motion-reduce:transition-none: '애니메이션 줄이기'면 스르륵 없이 바로
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${
            i === index && loadedIds.includes(image.recipe_id) ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}

// 섹션 제목 + 더보기 링크
function SectionTitle({ title, moreTo }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-xl font-black">{title}</h2>
      {moreTo && (
        <Link to={moreTo} className="text-sm text-muted hover:text-accent">
          더보기 ›
        </Link>
      )}
    </div>
  );
}

// 추천을 기다리는 동안 보여 줄 회색 자리 카드 (RecipeCard와 같은 크기)
function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card animate-pulse" aria-hidden="true">
      <div className="aspect-[4/3] w-full bg-photo" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-5 w-3/4 rounded-pill bg-gray-100" />
        <div className="h-4 w-1/2 rounded-pill bg-gray-100" />
        <div className="h-2 w-full rounded-pill bg-gray-100" />
        <div className="h-6 w-1/3 rounded-pill bg-gray-100" />
      </div>
    </div>
  );
}

// 레시피 카드 목록 (카드는 권우정 RecipeCard, 여기서는 칸만 나눔)
// columns: 넓은 화면에서 한 줄에 몇 개 놓을지 (3 또는 4)
function RecipeCardList({ recipes, showMatch = false, emptyText, columns = 4 }) {
  const gridClass = `grid grid-cols-1 gap-5 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`;
  // null = 아직 불러오는 중 → 회색 자리 카드
  if (recipes === null) {
    return (
      <div role="status" aria-label="레시피를 불러오는 중" className={gridClass}>
        {Array.from({ length: columns }, (_, i) => <RecipeCardSkeleton key={i} />)}
      </div>
    );
  }
  if (recipes.length === 0) {
    return <p className="rounded-card bg-surface p-6 text-muted shadow-card">{emptyText}</p>;
  }
  return (
    <div className={gridClass}>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.recipe_id} recipe={recipe} showMatch={showMatch} />
      ))}
    </div>
  );
}

function HomePage() {
  const { isAuthenticated } = useAuth();

  // 내 냉장고 추천: 서버 GET /home/recommendations (일치율 50% 이상, 높은 순 · 위 4개 + 전체 개수)
  const [recommendRecipes, setRecommendRecipes] = useState([]);
  const [recommendTotal, setRecommendTotal] = useState(0); // 배너에 보여 줄 전체 개수
  const [recommendError, setRecommendError] = useState("");
  const [isRecommendLoading, setIsRecommendLoading] = useState(true); // 추천 계산 기다리는 중

  // 인기 레시피 GET /recipes?sort=popular · 새 레시피 ?sort=latest · 커뮤니티 새 글 GET /posts?sort=latest
  // ※ /recipes의 sort(인기순 · 최신순)는 권우정 백엔드에 추가가 필요함. 추가 전에는 서버가 무시해서 가나다순으로 옴
  // 처음 값 null = 불러오는 중 (실패하면 빈 목록 [])
  const [popularRecipes, setPopularRecipes] = useState(null);
  const [newRecipes, setNewRecipes] = useState(null);
  const [newPosts, setNewPosts] = useState(null);

  // 로그인 여부와 상관없이 처음 한 번 받아 온다
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    api.get("/recipes", { params: { sort: "popular", limit: POPULAR_COUNT }, signal })
      .then(({ data }) => setPopularRecipes(data))
      .catch((err) => { if (err.code !== "ERR_CANCELED") setPopularRecipes([]); });
    api.get("/recipes", { params: { sort: "latest", limit: NEW_RECIPE_COUNT }, signal })
      .then(({ data }) => setNewRecipes(data))
      .catch((err) => { if (err.code !== "ERR_CANCELED") setNewRecipes([]); });
    api.get("/posts", { params: { sort: "latest", limit: NEW_POST_COUNT }, signal })
      .then(({ data }) => setNewPosts(data))
      .catch((err) => { if (err.code !== "ERR_CANCELED") setNewPosts([]); });
    return () => controller.abort();
  }, []);

  // 로그인했을 때만 추천을 받아 온다
  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    api
      .get("/home/recommendations", { params: { limit: RECOMMEND_COUNT }, signal: controller.signal })
      .then(({ data }) => {
        setRecommendRecipes(data.recipes);
        setRecommendTotal(data.total);
        setRecommendError("");
      })
      .catch((err) => {
        if (err.code !== "ERR_CANCELED") setRecommendError("추천 레시피를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRecommendLoading(false);
      });
    return () => controller.abort();
  }, [isAuthenticated]);


  return (
    <div className="flex flex-col gap-12">
      {/* ③ 첫 화면 배너: 왼쪽 큰 카드(사진 자리) + 오른쪽 포인트 카드 */}
      <section className="grid gap-4 md:grid-cols-[1fr_300px]">
        {/* [11/24 조현기] relative overflow-hidden 추가: 음식 사진 층(HeroFoodImages)을 이 카드 안에 붙이고, 둥근 모서리 밖은 잘라냄 */}
        <div className="relative flex min-h-72 flex-col justify-end overflow-hidden rounded-[32px] bg-photo p-8 md:p-10">
          <HeroFoodImages />
          {/* [11/24 조현기] 글자 · 버튼은 relative로 사진 층보다 위에 그려짐 (뒤에 오는 relative 요소가 위) */}
          <h1 className="relative text-3xl md:text-4xl font-black leading-tight">
            냉장고 속 재료로
            <br />
            오늘 뭐 해먹지?
          </h1>
          <p className="relative mt-3 text-ink-soft">
            {isAuthenticated
              ? "재료를 등록하면 지금 만들 수 있는 요리를 바로 보여드려요"
              : "로그인하고 재료를 담으면 지금 만들 수 있는 요리를 보여드려요"}
          </p>
          <div className="relative mt-6">
            <Link
              to={isAuthenticated ? "/fridge" : "/login"}
              className="inline-flex items-center h-12 px-6 rounded-pill bg-ink text-white font-bold hover:bg-gray-800"
            >
              {isAuthenticated ? "내 냉장고 열기" : "로그인하고 시작하기"}
            </Link>
          </div>
        </div>

        {/* 로그인: 지금 만들 수 있는 요리 개수 / 비로그인: 서비스 소개 */}
        <Link
          to={isAuthenticated ? "/recipes/recommend" : "/signup"}
          className="flex flex-col justify-between gap-6 rounded-[32px] bg-accent p-7 text-white shadow-card hover:bg-accent-dark"
        >
          <span className="text-sm font-medium opacity-90">
            {isAuthenticated ? "내 냉장고" : "처음 오셨나요?"}
          </span>
          {isAuthenticated && isRecommendLoading ? (
            <p className="text-2xl font-black leading-snug">
              지금 만들 수 있는
              <br />
              요리를 찾는 중...
            </p>
          ) : isAuthenticated && recommendTotal > 0 ? (
            <p className="text-2xl font-black leading-snug">
              <span className="text-5xl">{recommendTotal}</span>가지
              <br />
              지금 만들 수 있어요
            </p>
          ) : (
            <p className="text-2xl font-black leading-snug">
              재료를 담으면
              <br />
              만들 요리를 골라 드려요
            </p>
          )}
          <span className="text-sm font-bold">{isAuthenticated ? "보러 가기 ›" : "회원가입 ›"}</span>
        </Link>
      </section>

      {/* ④ 내 냉장고 추천: 로그인한 사용자에게만 */}
      {isAuthenticated && (
        <section>
          <SectionTitle title="내 냉장고 재료로 만들 수 있는 요리" moreTo="/recipes/recommend" />
          {isRecommendLoading ? (
            <div role="status" aria-label="추천 레시피를 불러오는 중" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: RECOMMEND_COUNT }, (_, i) => <RecipeCardSkeleton key={i} />)}
            </div>
          ) : recommendError ? (
            <p role="alert" className="rounded-card bg-miss-soft p-6 text-miss">{recommendError}</p>
          ) : (
            <RecipeCardList
              recipes={recommendRecipes}
              showMatch={true}
              emptyText="냉장고에 재료를 담으면 만들 수 있는 요리를 보여드려요."
            />
          )}
        </section>
      )}

      {/* ⑤ 인기 레시피: 비로그인이면 맨 위 (배너 바로 아래) */}
      {!isAuthenticated && (
        <section>
          <SectionTitle title="인기 레시피" moreTo="/recipes" />
          <RecipeCardList recipes={popularRecipes} emptyText="아직 레시피가 없어요." />
        </section>
      )}

      {/* 아래 줄: 왼쪽 레시피 + 오른쪽 커뮤니티 새 글 */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-8">
        <section className="flex-1 min-w-0">
          {isAuthenticated ? (
            <>
              <SectionTitle title="인기 레시피" moreTo="/recipes" />
              <RecipeCardList
                recipes={popularRecipes && popularRecipes.slice(0, NEW_RECIPE_COUNT)}
                emptyText="아직 레시피가 없어요."
                columns={3}
              />
            </>
          ) : (
            <>
              <SectionTitle title="새로 올라온 레시피" moreTo="/recipes" />
              <RecipeCardList recipes={newRecipes} emptyText="아직 레시피가 없어요." columns={3} />
            </>
          )}
        </section>

        {/* ⑥ 커뮤니티 새 글: 최신 순, 흰 카드 안 목록 */}
        <section className="lg:w-80">
          <SectionTitle title="커뮤니티 새 글" moreTo="/board" />
          {newPosts === null ? (
            <ul role="status" aria-label="새 글을 불러오는 중" className="rounded-card bg-surface py-2 shadow-card divide-y divide-line">
              {Array.from({ length: NEW_POST_COUNT }, (_, i) => (
                <li key={i} className="px-6 py-4 animate-pulse" aria-hidden="true">
                  <div className="h-5 w-4/5 rounded-pill bg-gray-100" />
                </li>
              ))}
            </ul>
          ) : newPosts.length === 0 ? (
            <p className="rounded-card bg-surface p-6 text-muted shadow-card">아직 새 글이 없어요.</p>
          ) : (
            <ul className="rounded-card bg-surface py-2 shadow-card divide-y divide-line">
              {newPosts.map((post) => (
                <li key={post.post_id}>
                  <Link to={`/board/${post.post_id}`} className="block truncate px-6 py-4 hover:text-accent">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default HomePage;