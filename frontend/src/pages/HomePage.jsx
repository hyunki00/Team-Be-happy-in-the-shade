// 담당: 조현기
// 메인 화면 (와이어프레임 v6 5~6장 · 디자인 시안 F)
// 로그인: 배너(내 냉장고 열기) → 내 냉장고 추천 → 인기 레시피 + 커뮤니티 새 글
// 비로그인: 배너(로그인하고 시작하기) → 인기 레시피 → 새로 올라온 레시피 + 커뮤니티 새 글
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

// 레시피 카드 목록 (카드는 권우정 RecipeCard, 여기서는 칸만 나눔)
// columns: 넓은 화면에서 한 줄에 몇 개 놓을지 (3 또는 4)
function RecipeCardList({ recipes, showMatch = false, emptyText, columns = 4 }) {
  if (recipes.length === 0) {
    return <p className="rounded-card bg-surface p-6 text-muted shadow-card">{emptyText}</p>;
  }
  return (
    <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.recipe_id} recipe={recipe} showMatch={showMatch} />
      ))}
    </div>
  );
}

function HomePage() {
  const { isAuthenticated } = useAuth();

  // 내 냉장고 추천: 서버 GET /fridge/recommendations (일치율 70% 이상, 높은 순으로 줌)
  const [recommendRecipes, setRecommendRecipes] = useState([]);
  const [recommendTotal, setRecommendTotal] = useState(0); // 배너에 보여 줄 전체 개수
  const [recommendError, setRecommendError] = useState("");

  // 인기 레시피 GET /recipes?sort=popular · 새 레시피 ?sort=latest · 커뮤니티 새 글 GET /posts?sort=latest
  // ※ /recipes의 sort(인기순 · 최신순)는 권우정 백엔드에 추가가 필요함. 추가 전에는 서버가 무시해서 가나다순으로 옴
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [newRecipes, setNewRecipes] = useState([]);
  const [newPosts, setNewPosts] = useState([]);

  // 로그인 여부와 상관없이 처음 한 번 받아 온다
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    api.get("/recipes", { params: { sort: "popular", limit: POPULAR_COUNT }, signal })
      .then(({ data }) => setPopularRecipes(data))
      .catch(() => {});
    api.get("/recipes", { params: { sort: "latest", limit: NEW_RECIPE_COUNT }, signal })
      .then(({ data }) => setNewRecipes(data))
      .catch(() => {});
    api.get("/posts", { params: { sort: "latest", limit: NEW_POST_COUNT }, signal })
      .then(({ data }) => setNewPosts(data))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // 로그인했을 때만 추천을 받아 온다
  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    api
      .get("/fridge/recommendations", { signal: controller.signal })
      .then(({ data }) => {
        setRecommendRecipes(data.slice(0, RECOMMEND_COUNT));
        setRecommendTotal(data.length);
        setRecommendError("");
      })
      .catch((err) => {
        if (err.code !== "ERR_CANCELED") setRecommendError("추천 레시피를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [isAuthenticated]);


  return (
    <div className="flex flex-col gap-12">
      {/* ③ 첫 화면 배너: 왼쪽 큰 카드(사진 자리) + 오른쪽 포인트 카드 */}
      <section className="grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="flex min-h-72 flex-col justify-end rounded-[32px] bg-photo p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-black leading-tight">
            냉장고 속 재료로
            <br />
            오늘 뭐 해먹지?
          </h1>
          <p className="mt-3 text-ink-soft">
            {isAuthenticated
              ? "재료를 등록하면 지금 만들 수 있는 요리를 바로 보여드려요"
              : "로그인하고 재료를 담으면 지금 만들 수 있는 요리를 보여드려요"}
          </p>
          <div className="mt-6">
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
          to={isAuthenticated ? "/fridge" : "/signup"}
          className="flex flex-col justify-between gap-6 rounded-[32px] bg-accent p-7 text-white shadow-card hover:bg-accent-dark"
        >
          <span className="text-sm font-medium opacity-90">
            {isAuthenticated ? "내 냉장고" : "처음 오셨나요?"}
          </span>
          {isAuthenticated && recommendTotal > 0 ? (
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
          <SectionTitle title="내 냉장고 재료로 만들 수 있는 요리" moreTo="/fridge" />
          {recommendError ? (
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
                recipes={popularRecipes.slice(0, NEW_RECIPE_COUNT)}
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
          {newPosts.length === 0 ? (
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
