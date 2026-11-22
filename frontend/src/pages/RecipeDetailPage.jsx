// 담당: 권우정
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import CommentSection from "../components/CommentSection";

// 백엔드 FastAPI 서버 주소
const API_URL = "http://127.0.0.1:8044";

function RecipeDetailPage() {

  // URL에서 레시피 ID를 가져와 숫자로 변환
  const { id } = useParams();
  const recipeId = Number(id);

  // 현재 사용자의 로그인 여부
  const { isAuthenticated } = useAuth();

  // 실제 API에서 가져온 레시피
  const [recipe, setRecipe] = useState(null);

  // 레시피 조회 중인지와 오류 메시지를 저장
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 좋아요 / 북마크 상태
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 버튼 중복 클릭 방지
  const [isSaving, setIsSaving] = useState(false);

  // STEP 1. 레시피 상세 조회
  useEffect(() => {
    // 페이지 이동이나 재요청 시 이전 API 요청을 취소하기 위한 객체
    const controller = new AbortController();

    // 백엔드에서 레시피 상세 정보를 조회하는 함수
    const fetchRecipe = async () => {
      setLoading(true);
      setError("");
      setRecipe(null);

      try {
        const response = await fetch(
          `${API_URL}/recipes/${recipeId}`,
          {
            credentials: "include",
            signal: controller.signal
          }
        );

        if (response.status === 404) {
          throw new Error("레시피를 찾을 수 없습니다.");
        }

        if (!response.ok) {
          throw new Error("레시피 조회에 실패했습니다.");
        }

         // 서버 응답을 JSON으로 변환
        const data = await response.json();

        setRecipe(data);
        setIsLiked(data.is_liked);
        setLikeCount(data.like_count);
        setIsBookmarked(data.is_bookmarked);

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

    fetchRecipe();

    // 컴포넌트가 사라지거나 조회 조건이 바뀌면 진행 중인 요청 취소
    return () => controller.abort();
  }, [recipeId, isAuthenticated]);

  // STEP 2. 좋아요 추가 / 취소
  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    try {
      // 현재 좋아요 상태에 따라 추가(POST) 또는 취소(DELETE) 요청
      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch(
        `${API_URL}/recipes/${recipeId}/likes`,
        {
          method,
          credentials: "include"
        }
      );

      if (response.status === 401) {
        throw new Error("서버 로그인이 필요합니다.");
      }

      if (!response.ok) {
        throw new Error("좋아요 처리에 실패했습니다.");
      }

      // 서버에서 반환한 좋아요 상태로 화면 갱신
      const data = await response.json();

      setIsLiked(data.is_liked);
      setLikeCount((prev) =>
        prev + (data.is_liked ? 1 : -1)
      );

    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // STEP 3. 북마크 추가 / 취소
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    if (isSaving) return;

    setIsSaving(true);

    try {
      // 현재 북마크 상태에 따라 추가(POST) 또는 취소(DELETE) 요청
      const method = isBookmarked ? "DELETE" : "POST";

      const response = await fetch(
        `${API_URL}/recipes/${recipeId}/bookmarks`,
        {
          method,
          credentials: "include"
        }
      );

      if (response.status === 401) {
        throw new Error("서버 로그인이 필요합니다.");
      }

      if (!response.ok) {
        throw new Error("북마크 처리에 실패했습니다.");
      }

      // 서버에서 반환한 북마크 상태로 화면 갱신
      const data = await response.json();
      setIsBookmarked(data.is_bookmarked);

    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 로딩 / 오류
  if (loading) {
    return <p>레시피를 불러오는 중...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!recipe) {
    return <p>레시피를 찾을 수 없습니다.</p>;
  }

  return (
    <div>
      <h1>레시피 상세 페이지</h1>
      <p>레시피 번호 : {recipeId}</p>

      <h2>{recipe.recipe_title}</h2>
      <p>{recipe.intro}</p>

      {/* 레시피 이미지가 있을 때만 표시 */}
      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.recipe_title}
          width="300"
        />
      )}

      <p>조리 시간 : {recipe.cooking_time}분</p>
      <p>난이도 : {recipe.level}</p>
      <p>작성자 : {recipe.nickname}</p>
      <p>인분 : {recipe.servings}인분</p>
      <p>요리 종류 : {recipe.category_name}</p>
      <p>필요한 조리도구 : {recipe.tool_name ?? "없음"}</p>

      {/* 로그인한 사용자 본인의 레시피인 경우 수정/삭제 버튼 표시 */}
      {isAuthenticated && recipe.is_mine && (
        <div>
          <button type="button" disabled>수정</button>
          <button type="button" disabled>삭제</button>
        </div>
      )}

      <button
        type="button"
        onClick={handleLike}
        disabled={isSaving}
      >
        {isLiked ? "좋아요 취소" : "좋아요"}
      </button>

      <p>좋아요 : {likeCount}개</p>
      <p>댓글 : {recipe.comment_count}개</p>
      <p>
        좋아요 상태 : {isLiked ? "좋아요 누름" : "좋아요 안 누름"}
      </p>

      <button
        type="button"
        onClick={handleBookmark}
        disabled={isSaving}
      >
        {isBookmarked ? "북마크 취소" : "북마크"}
      </button>

      <p>
        북마크 상태 :
        {isBookmarked ? " 북마크 저장됨" : " 북마크 안 됨"}
      </p>

      <h3>필요한 재료</h3>

      {/* 레시피에 필요한 식재료 이름과 수량 출력 */}
      <ul>
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient.ing_id}>
            {ingredient.ing_name} : {ingredient.amount_text}
          </li>
        ))}
      </ul>

      <h3>조리 순서</h3>

      {/* 조리 단계와 단계별 이미지 출력 */}
      <ol style={{ listStyleType: "decimal", paddingLeft: "30px" }}>
        {recipe.steps.map((step) => (
          <li key={step.step_id}>
            {step.step_content}

            {step.step_image_url && (
              <div>
                <img
                  src={step.step_image_url}
                  alt={`${step.step_no}번 조리 단계`}
                  width="200"
                />
              </div>
            )}
          </li>
        ))}
      </ol>

      <h3>댓글</h3>
      {/* 현재 레시피 ID를 댓글 컴포넌트에 전달 */}
      <CommentSection
        targetType="recipe"
        targetId={recipeId}
      />
    </div>
  );
}

export default RecipeDetailPage;
