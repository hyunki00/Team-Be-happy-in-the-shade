// 담당: 권우정
import { useParams } from "react-router-dom";
import { mockRecipeDetail } from "../mockData";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import CommentSection from "../components/CommentSection";

function RecipeDetailPage() {
  //useParams() : 현재 URL에 들어 있는 동적인 값을 가져오는 React Router 기능
  //App.jsx의 <Route path="/recipes/:id" element={<RecipeDetailPage />} />에서 :id값(문자열) 가져옴
  const { id } = useParams();

  //좋아요 상태 변수
  const [isLiked, setIsLiked] = useState(mockRecipeDetail.is_liked);
  //좋아요 카운트 변수
  const [likeCount, setLikeCount] = useState(mockRecipeDetail.like_count);
  //북마크 상태 변수
  const [isBookmarked, setIsBookmarked] = useState(mockRecipeDetail.is_bookmarked);
  //로그인 상태 변수
  const { isAuthenticated } = useAuth();

  //URL에서 가져온 문자열 ID를 숫자로 변환
  const recipeId = Number(id);

  //URL의 ID와 실제 레시피 ID가 같은지 확인(두 값이 자료형까지 같은지 비교)
  //isSameRecipe : 같은 레시피라면 true, 아니면 false
  const isSameRecipe = recipeId === mockRecipeDetail.recipe_id;

  //isSameRecipe가 false인 경우
  if (!isSameRecipe){
    return <p>레시피를 찾을 수 없습니다.</p>;
  }

  //좋아요 버튼 클릭 함수
  const handleLike = () => {
    //로그인하지 않았다면 좋아요 변경하지 않음
    if (!isAuthenticated) {
      alert("로그인이 필요한 기능입니다.");
      return; //함수 실행 종료
    }

    //현재 좋아요 상태를 반대로 변경
    setIsLiked(!isLiked);

    if (isLiked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1)
    }
  }

  //북마크 버튼 클릭 함수
  const handleBookmark = () => {
    //로그인하지 않았다면 북마크 변경하지 않음
    if (!isAuthenticated) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    //현재 북마크 상태를 반대로 변경
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div>
      <h1>레시피 상세 페이지</h1>
      <p>레시피 번호 : {id}</p>
      <h2>{mockRecipeDetail.recipe_title}</h2>
      <p>{mockRecipeDetail.intro}</p>

      <img
        src={mockRecipeDetail.image_url}
        alt={mockRecipeDetail.recipe_title}
        width="300"
      />
      <p>조리 시간 : {mockRecipeDetail.cooking_time}분</p>
      <p>난이도 : {mockRecipeDetail.level}</p>
      <p>작성자 : {mockRecipeDetail.nickname}</p>
      <p>인분 : {mockRecipeDetail.servings}인분</p>
      <p>요리 종류 : {mockRecipeDetail.category_name}</p>
      <p>필요한 조리도구 : {mockRecipeDetail.tool_name}</p>
      {/* 로그인을 했을때&&내 레시피일 경우에만 수정/삭제 버튼 출력 */}
      {isAuthenticated && mockRecipeDetail.is_mine && (
        <div>
          <button type="button" disabled>수정</button>
          <button type="button" disabled>삭제</button>
        </div>
      )}
      <button type="button" onClick={handleLike}>
        {isLiked ? "좋아요 취소" : "좋아요"}
      </button>
      <p>좋아요 : {likeCount}개</p>
      <p>댓글 : {mockRecipeDetail.comment_count}개</p>
      <p>좋아요 상태 : {isLiked ? "좋아요 누름" : "좋아요 안 누름"}</p>
      <button type="button" onClick={handleBookmark}>
        {isBookmarked ? "북마크 취소" : "북마크"}
      </button>
      <p>북마크 상태 : {isBookmarked ? "북마크 저장됨" : "북마크 안 됨"}</p>
      <h3>필요한 재료</h3>
      <ul>
        {/* some() : 배열에서 조건에 맞는 항목이 하나라도 있으면 true를 반환 */}
        {mockRecipeDetail.ingredients.map((ingredient) => {
          const isMissing = mockRecipeDetail.missing_ingredients.some(
            (missing) => missing.ing_id === ingredient.ing_id
          );

          return (
            <li key={ingredient.ing_id}>
              {ingredient.ing_name} : {ingredient.amount_text}
              {isMissing ? " (부족)" : " (보유)"}
            </li>
          );
        })}
      </ul>
      <h3>조리 순서</h3>
      <ol style={{ listStyleType: "decimal", paddingLeft: "30px" }}>
        {mockRecipeDetail.steps.map((step) => (
          <li key={step.step_id}>
            {step.step_content}
            {/* step_image_url에 주소가 있으면 이미지가 나오고, null이면 아무것도 표시하지 않는다 */}
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
      <CommentSection targetType="recipe" targetId={recipeId} />
    </div>
  );
}

export default RecipeDetailPage;
