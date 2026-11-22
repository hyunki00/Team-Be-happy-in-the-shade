// 담당: 조현기
// 메인 화면 (와이어프레임 v6 5~6장)
// 로그인: 배너(내 냉장고 열기) → 내 냉장고 추천 → 인기 레시피 + 커뮤니티 새 글
// 비로그인: 배너(로그인하고 시작하기) → 인기 레시피 → 새로 올라온 레시피 + 커뮤니티 새 글
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";
import RecipeCard from "../components/RecipeCard";
import { mockRecipes, mockPosts } from "../mockData";

// 섹션마다 보여 줄 개수 (이 화면에서만 쓰는 값)
const RECOMMEND_COUNT = 4;
const POPULAR_COUNT = 4;
const NEW_RECIPE_COUNT = 3;
const NEW_POST_COUNT = 4;

// 섹션 제목 + 더보기 링크
function SectionTitle({ title, moreTo }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {moreTo && (
        <Link to={moreTo} className="text-sm text-gray-500">
          더보기 ›
        </Link>
      )}
    </div>
  );
}

function HomePage() {
  const { isAuthenticated } = useAuth();

  // 내 냉장고 추천: 서버 GET /fridge/recommendations (일치율 70% 이상, 높은 순으로 줌)
  const [recommendRecipes, setRecommendRecipes] = useState([]);
  const [recommendError, setRecommendError] = useState("");

  // 아직 서버에 없는 것은 가짜 데이터로 보여 준다
  // 인기 · 새 레시피: /recipes에 인기순 · 최신순 정렬이 생기면 서버로 바꾼다
  // 커뮤니티 새 글: 게시글 API(/posts)가 생기면 서버로 바꾼다
  const [recipes] = useState(mockRecipes);
  const [posts] = useState(mockPosts);

  // 로그인했을 때만 추천을 받아 온다
  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    api
      .get("/fridge/recommendations", { signal: controller.signal })
      .then(({ data }) => {
        setRecommendRecipes(data.slice(0, RECOMMEND_COUNT));
        setRecommendError("");
      })
      .catch((err) => {
        if (err.code !== "ERR_CANCELED") setRecommendError("추천 레시피를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [isAuthenticated]);

  // 인기 레시피: 좋아요 많은 순
  const popularRecipes = [...recipes]
    .sort((a, b) => b.like_count - a.like_count)
    .slice(0, POPULAR_COUNT);

  // 새로 올라온 레시피: 최신 순
  const newRecipes = [...recipes]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, NEW_RECIPE_COUNT);

  // 커뮤니티 새 글: 최신 순
  const newPosts = [...posts]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, NEW_POST_COUNT);

  return (
    <div className="p-6 flex flex-col gap-10">
      {/* ③ 첫 화면 배너: 로그인 → 내 냉장고 / 비로그인 → 로그인 */}
      <section className="flex items-center justify-between gap-6 p-8 rounded bg-gray-100">
        <div>
          <h1 className="text-2xl font-bold">냉장고 속 재료로 오늘 뭐 해먹지?</h1>
          <p className="mt-2 text-gray-600">
            {isAuthenticated
              ? "재료를 등록하면 지금 만들 수 있는 요리를 바로 보여드려요"
              : "로그인하고 재료를 담으면 지금 만들 수 있는 요리를 보여드려요"}
          </p>
          <Link
            to={isAuthenticated ? "/fridge" : "/login"}
            className="inline-block mt-4 px-5 py-2 rounded bg-orange-600 text-white"
          >
            {isAuthenticated ? "내 냉장고 열기" : "로그인하고 시작하기"}
          </Link>
        </div>
        {/* 대표 음식 사진 자리 (사진은 나중에 정함) */}
        <div className="hidden md:flex w-64 h-36 items-center justify-center rounded bg-gray-200 text-gray-500">
          대표 음식 사진
        </div>
      </section>

      {/* ④ 내 냉장고 추천: 로그인한 사용자에게만 */}
      {isAuthenticated && (
        <section>
          <SectionTitle title="내 냉장고 재료로 만들 수 있는 요리" moreTo="/fridge" />
          {recommendError ? (
            <p className="text-gray-500">{recommendError}</p>
          ) : recommendRecipes.length === 0 ? (
            <p className="text-gray-500">냉장고에 재료를 담으면 만들 수 있는 요리를 보여드려요.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {recommendRecipes.map((recipe) => (
                <RecipeCard key={recipe.recipe_id} recipe={recipe} showMatch={true} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ⑤ 인기 레시피: 비로그인이면 맨 위 (배너 바로 아래) */}
      {!isAuthenticated && (
        <section>
          <SectionTitle title="인기 레시피" moreTo="/recipes" />
          <div className="flex flex-wrap gap-4">
            {popularRecipes.map((recipe) => (
              <RecipeCard key={recipe.recipe_id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* 아래 줄: 왼쪽 레시피 + 오른쪽 커뮤니티 새 글 */}
      <div className="flex flex-col lg:flex-row gap-10">
        <section className="flex-1">
          {isAuthenticated ? (
            <>
              <SectionTitle title="인기 레시피" moreTo="/recipes" />
              <div className="flex flex-wrap gap-4">
                {popularRecipes.slice(0, NEW_RECIPE_COUNT).map((recipe) => (
                  <RecipeCard key={recipe.recipe_id} recipe={recipe} />
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionTitle title="새로 올라온 레시피" moreTo="/recipes" />
              <div className="flex flex-wrap gap-4">
                {newRecipes.map((recipe) => (
                  <RecipeCard key={recipe.recipe_id} recipe={recipe} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ⑥ 커뮤니티 새 글: 최신 순 */}
        <section className="lg:w-80">
          <SectionTitle title="커뮤니티 새 글" moreTo="/board" />
          <ul className="flex flex-col gap-2">
            {newPosts.map((post) => (
              <li key={post.post_id}>
                <Link to={`/board/${post.post_id}`} className="hover:underline">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
