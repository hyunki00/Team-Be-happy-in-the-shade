// 담당: 권우정
// [디자인 11/22 조현기] 시안 F 적용 — 모양만 바꿈, 좋아요 · 북마크 로직은 그대로
//   1. 가운데 한 줄(최대 760px): 큰 사진 → 제목 카드 → 재료 카드 → 조리 순서 카드 → 댓글 카드
//   2. 조리 시간 · 난이도 · 인분 · 조리도구를 4칸 표로, 좋아요 · 북마크는 둥근 버튼
//   3. 재료는 칩: 보유 = 초록, 부족 = 빨강
//   4. 확인용 줄(레시피 번호 · 좋아요 상태 · 북마크 상태)은 뺌. 버튼 글자 · 개수로 보임
//      '레시피 상세 페이지' 제목은 화면에서 숨기고 화면 읽기 프로그램에만 남김
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
    return <p className="mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card">레시피를 찾을 수 없습니다.</p>;
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

  const cardClass = "rounded-card bg-surface p-6 shadow-card md:p-8";
  const pillClass = (isOn) =>
    `inline-flex items-center h-12 px-5 rounded-pill text-[15px] font-bold ${
      isOn ? "bg-ink text-white" : "bg-gray-100 text-ink hover:bg-gray-200"
    }`;

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-8">
      <h1 className="sr-only">레시피 상세 페이지</h1>

      {mockRecipeDetail.image_url ? (
        <img
          src={mockRecipeDetail.image_url}
          alt={mockRecipeDetail.recipe_title}
          className="aspect-[16/10] w-full rounded-[32px] object-cover bg-photo shadow-card"
        />
      ) : (
        <div className="aspect-[16/10] w-full rounded-[32px] bg-photo" aria-hidden="true" />
      )}

      <section className={`${cardClass} relative -mt-16 mx-2 md:mx-4`}>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-pill bg-gray-100 px-3 py-1 text-sm font-bold text-ink-soft">
            {mockRecipeDetail.category_name}
          </span>
          {/* 로그인을 했을때&&내 레시피일 경우에만 수정/삭제 버튼 출력 */}
          {isAuthenticated && mockRecipeDetail.is_mine && (
            <div className="flex gap-1 text-sm text-ink-soft">
              <button type="button" className="px-3 py-2 disabled:opacity-40" disabled>수정</button>
              <button type="button" className="px-3 py-2 disabled:opacity-40" disabled>삭제</button>
            </div>
          )}
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{mockRecipeDetail.recipe_title}</h2>
        <p className="mt-3 text-ink-soft leading-relaxed">{mockRecipeDetail.intro}</p>
        <p className="mt-2 text-sm text-muted">작성자 {mockRecipeDetail.nickname}</p>

        <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-[18px] bg-page py-3 text-center">
            <dt className="text-sm text-muted">인분</dt>
            <dd className="mt-1 font-bold">{mockRecipeDetail.servings}인분</dd>
          </div>
          <div className="rounded-[18px] bg-page py-3 text-center">
            <dt className="text-sm text-muted">조리 시간</dt>
            <dd className="mt-1 font-bold">{mockRecipeDetail.cooking_time}분</dd>
          </div>
          <div className="rounded-[18px] bg-page py-3 text-center">
            <dt className="text-sm text-muted">난이도</dt>
            <dd className="mt-1 font-bold">{mockRecipeDetail.level}</dd>
          </div>
          <div className="rounded-[18px] bg-page py-3 text-center">
            <dt className="text-sm text-muted">필요한 조리도구</dt>
            <dd className="mt-1 font-bold">{mockRecipeDetail.tool_name}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={isLiked} className={pillClass(isLiked)} onClick={handleLike}>
            {isLiked ? "좋아요 취소" : "좋아요"}
          </button>
          <button type="button" aria-pressed={isBookmarked} className={pillClass(isBookmarked)} onClick={handleBookmark}>
            {isBookmarked ? "북마크 취소" : "북마크"}
          </button>
          <p className="ml-1 text-sm text-muted">
            좋아요 {likeCount}개 · 댓글 {mockRecipeDetail.comment_count}개
          </p>
        </div>
      </section>

      <section className={cardClass}>
        <h3 className="text-xl font-black">필요한 재료</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {/* some() : 배열에서 조건에 맞는 항목이 하나라도 있으면 true를 반환 */}
          {mockRecipeDetail.ingredients.map((ingredient) => {
            const isMissing = mockRecipeDetail.missing_ingredients.some(
              (missing) => missing.ing_id === ingredient.ing_id
            );

            return (
              <li
                key={ingredient.ing_id}
                className={`inline-flex items-center gap-2 h-11 px-4 rounded-pill ${
                  isMissing ? "bg-miss-soft" : "bg-have-soft"
                }`}
              >
                <span className="font-bold">{ingredient.ing_name}</span>
                <span className="text-sm text-ink-soft">{ingredient.amount_text}</span>
                <span className={`text-xs font-bold ${isMissing ? "text-miss" : "text-have"}`}>
                  {isMissing ? "부족" : "보유"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={cardClass}>
        <h3 className="text-xl font-black">조리 순서</h3>
        <ol className="mt-5 flex flex-col gap-6">
          {mockRecipeDetail.steps.map((step, index) => (
            <li key={step.step_id} className="flex gap-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent font-bold text-white">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-3 pt-1.5">
                <p className="text-[17px] leading-relaxed">{step.step_content}</p>
                {/* step_image_url에 주소가 있으면 이미지가 나오고, null이면 아무것도 표시하지 않는다 */}
                {step.step_image_url && (
                  <img
                    src={step.step_image_url}
                    alt={`${step.step_no}번 조리 단계`}
                    className="aspect-video w-full max-w-md rounded-[20px] object-cover bg-photo"
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={cardClass}>
        <h3 className="text-xl font-black">댓글</h3>
        <div className="mt-4">
          <CommentSection targetType="recipe" targetId={recipeId} />
        </div>
      </section>
    </div>
  );
}

export default RecipeDetailPage;
