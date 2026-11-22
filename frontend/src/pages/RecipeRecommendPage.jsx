// 담당: 권우정
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RecipeCard from "../components/RecipeCard";

// 백엔드 FastAPI 서버 주소
const API_URL = "http://127.0.0.1:8044";

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
        const response = await fetch(
          `${API_URL}/recipes/recommendations`,
          {
            credentials: "include",
            signal: controller.signal
          }
        );

        if (response.status === 401) {
          throw new Error(
            "서버 로그인이 필요합니다. 로그인 상태를 확인해 주세요."
          );
        }

        if (!response.ok) {
          throw new Error("추천 레시피 조회에 실패했습니다.");
        }

        // 서버에서 받은 추천 레시피 목록을 화면 상태에 저장
        const data = await response.json();

        if (!controller.signal.aborted) {
          setRecipes(data);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
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
      <div>
        <h1>내 냉장고 맞춤 레시피 추천</h1>
        <p>로그인 후 이용할 수 있습니다.</p>
        <Link to="/login">로그인하러 가기</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>내 냉장고 맞춤 레시피 추천</h1>

      <p>
        냉장고에 있는 재료를 기준으로
        일치율 70% 이상의 레시피를 추천합니다.
      </p>

      {/* API 요청 중 로딩 메시지 표시 */}
      {loading && <p>추천 레시피를 불러오는 중...</p>}

      {/* API 요청 실패 시 오류 메시지 표시 */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 추천 결과가 없을 때 냉장고 재료 등록 안내 */}
      {!loading && !error && recipes.length === 0 && (
        <div>
          <p>현재 추천할 수 있는 레시피가 없습니다.</p>
          <p>냉장고에 재료를 등록해 보세요!</p>
          <Link to="/fridge">내 냉장고로 이동</Link>
        </div>
      )}

      {/* 추천 결과가 있으면 레시피 개수와 카드 목록 표시 */}
      {!loading && !error && recipes.length > 0 && (
        <>
          <p>추천 결과: {recipes.length}개</p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px"
            }}
          >
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