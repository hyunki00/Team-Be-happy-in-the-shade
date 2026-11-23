// 담당: 권우정
// [병합 11/23 조현기] woojung 브랜치 새 화면 + main 디자인(시안 F) 입힘, 추천 로직은 그대로
//   - 서버 요청을 직접 주소(127.0.0.1) 대신 api.js로 (로그인 쿠키가 같이 가야 추천을 받을 수 있음)
//   - 안내 문구 '일치율 70%' → '50%' (MATCH_RATE 11/22 변경)
//   - 인라인 style → Tailwind 클래스, 카드는 한 줄 최대 4개
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RecipeCard from "../components/RecipeCard";
import api from "../api"; // [병합] 공통 api

function RecipeRecommendPage() {

  // 현재 사용자의 로그인 여부
  const { isAuthenticated } = useAuth();

  // 백엔드에서 조회한 추천 레시피 목록
  const [recipes, setRecipes] = useState([]);

  // 추천 레시피 조회 중인지와 오류 메시지를 저장
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 로그인 상태에 따라 냉장고 맞춤 추천 레시피를 조회
  useEffect(() => {
    if (!isAuthenticated) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // 컴포넌트가 사라지거나 로그인 상태가 변경되면 이전 API 요청 취소
    const controller = new AbortController();

    // 백엔드에서 냉장고 재료 기반 추천 레시피를 가져오는 함수
    const fetchRecommendations = async () => {
      setLoading(true);
      setError("");

      try {
        // [병합] api.js로 요청 (로그인 쿠키 같이 감)
        const { data } = await api.get("/recipes/recommendations", {
          signal: controller.signal,
        });

        // 서버에서 받은 추천 레시피 목록을 화면 상태에 저장
        if (!controller.signal.aborted) {
          setRecipes(data);
        }
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;
        setError(
          err.response?.status === 401
            ? "서버 로그인이 필요합니다. 로그인 상태를 확인해 주세요."
            : "추천 레시피 조회에 실패했습니다."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    // 로그인 상태가 바뀌거나 페이지를 벗어나면 진행 중인 요청 취소
    return () => controller.abort();
  }, [isAuthenticated]);

  // 로그인하지 않은 사용자에게 로그인 안내 화면 표시
  if (!isAuthenticated) {
    return (
      <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 rounded-card bg-surface p-10 text-center shadow-card">
        <h1 className="text-2xl font-black">내 냉장고 맞춤 레시피 추천</h1>
        <p className="text-muted">로그인 후 이용할 수 있습니다.</p>
        <Link to="/login" className="mt-2 inline-flex h-12 items-center rounded-pill bg-accent px-6 font-bold text-white hover:bg-accent-dark">로그인하러 가기</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">내 냉장고 맞춤 레시피 추천</h1>
        <p className="mt-2 text-muted">
          냉장고에 있는 재료를 기준으로 일치율 50% 이상의 레시피를 추천합니다.
        </p>
      </div>

      {/* API 요청 중 로딩 메시지 표시 */}
      {loading && <p role="status" className="text-muted">추천 레시피를 불러오는 중...</p>}

      {/* API 요청 실패 시 오류 메시지 표시 */}
      {error && <p role="alert" className="rounded-[16px] bg-miss-soft px-5 py-3 text-miss">{error}</p>}

      {/* 추천 결과가 없을 때 냉장고 재료 등록 안내 */}
      {!loading && !error && recipes.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-card bg-surface p-10 text-center shadow-card">
          <p className="font-bold">현재 추천할 수 있는 레시피가 없습니다.</p>
          <p className="text-muted">냉장고에 재료를 등록해 보세요!</p>
          <Link to="/fridge" className="mt-2 inline-flex h-11 items-center rounded-pill bg-accent px-5 text-sm font-bold text-white hover:bg-accent-dark">내 냉장고로 이동</Link>
        </div>
      )}

      {/* 추천 결과가 있으면 레시피 개수와 카드 목록 표시 */}
      {!loading && !error && recipes.length > 0 && (
        <>
          <p className="text-lg font-black">추천 결과 <span className="text-accent">{recipes.length}개</span></p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.recipe_id}
                recipe={recipe}
                showMatch={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RecipeRecommendPage;
