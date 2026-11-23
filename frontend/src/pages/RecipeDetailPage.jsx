// 담당: 권우정
// [병합 11/23 조현기] woojung 브랜치(DB 연결 · 주석 정리) + main 디자인(11/22) 합침
//   - 상세 조회 · 좋아요 · 북마크 로직은 woojung 브랜치 그대로 (mockData → 실제 DB)
//   - 화면 모양은 main 디자인 그대로 (큰 사진 → 제목 카드 → 재료 → 조리 순서 → 댓글)
//   - 서버 요청을 직접 주소(127.0.0.1) 대신 api.js로: 프로젝트 규칙(요청은 api.js 하나로)
//     + 127.0.0.1로 보내면 localhost에서 받은 로그인 쿠키가 같이 안 가서 좋아요 · 북마크가 401(로그인 필요)로 실패하던 문제
//   - 재료 칩: 상세 API는 내 냉장고 기준 부족 재료를 주지 않아서 '보유 / 부족' 표시는 뺌 (이름 + 분량만)
// [디자인 11/22 조현기] 시안 F: 가운데 한 줄(최대 760px), 4칸 정보, 둥근 좋아요 · 북마크 버튼, 번호 동그라미 조리 순서
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import CommentSection from "../components/CommentSection";
import api from "../api"; // [병합] 공통 api

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
        // [병합] api.js로 요청 (로그인 쿠키 같이 감)
        const { data } = await api.get(`/recipes/${recipeId}`, {
          signal: controller.signal,
        });

        setRecipe(data);
        setIsLiked(data.is_liked);
        setLikeCount(data.like_count);
        setIsBookmarked(data.is_bookmarked);

      } catch (err) {
        // [병합] axios: 취소는 ERR_CANCELED, 서버 응답 코드는 err.response.status
        if (err.code === "ERR_CANCELED") return;
        setError(
          err.response?.status === 404
            ? "레시피를 찾을 수 없습니다."
            : "레시피 조회에 실패했습니다."
        );
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
      const { data } = isLiked
        ? await api.delete(`/recipes/${recipeId}/likes`)
        : await api.post(`/recipes/${recipeId}/likes`);

      // 서버에서 반환한 좋아요 상태로 화면 갱신
      setIsLiked(data.is_liked);
      setLikeCount((prev) =>
        prev + (data.is_liked ? 1 : -1)
      );

    } catch (err) {
      alert(err.response?.status === 401 ? "서버 로그인이 필요합니다." : "좋아요 처리에 실패했습니다.");
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
      const { data } = isBookmarked
        ? await api.delete(`/recipes/${recipeId}/bookmarks`)
        : await api.post(`/recipes/${recipeId}/bookmarks`);

      // 서버에서 반환한 북마크 상태로 화면 갱신
      setIsBookmarked(data.is_bookmarked);

    } catch (err) {
      alert(err.response?.status === 401 ? "서버 로그인이 필요합니다." : "북마크 처리에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 카드 · 둥근 버튼 모양 (디자인)
  const cardClass = "rounded-card bg-surface p-6 shadow-card md:p-8";
  const noticeClass = "mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card";
  const pillClass = (isOn) =>
    `inline-flex items-center h-12 px-5 rounded-pill text-[15px] font-bold disabled:opacity-40 ${
      isOn ? "bg-ink text-white" : "bg-gray-100 text-ink hover:bg-gray-200"
    }`;

  // 로딩 / 오류
  if (loading) {
    return <p role="status" className={noticeClass}>레시피를 불러오는 중...</p>;
  }

  if (error) {
    return <p role="alert" className={noticeClass}>{error}</p>;
  }

  if (!recipe) {
    return <p className={noticeClass}>레시피를 찾을 수 없습니다.</p>;
  }

  // 부족 재료 ID (서버가 줄 때만 표시)
  const missingIds = (recipe.missing_ingredients ?? []).map((item) => item.ing_id);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-8">
      <h1 className="sr-only">레시피 상세 페이지</h1>

      {/* 레시피 이미지가 있을 때만 사진, 없으면 빈 자리 (16:10) */}
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.recipe_title}
          className="aspect-[16/10] w-full rounded-[32px] object-cover bg-photo shadow-card"
        />
      ) : (
        <div className="aspect-[16/10] w-full rounded-[32px] bg-photo" aria-hidden="true" />
      )}

      {/* 제목 카드: 사진 위로 살짝 겹침 */}
      <section className={`${cardClass} relative -mt-16 mx-2 md:mx-4`}>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-pill bg-gray-100 px-3 py-1 text-sm font-bold text-ink-soft">
            {recipe.category_name}
          </span>
          {/* 로그인한 사용자 본인의 레시피인 경우 수정/삭제 버튼 표시 */}
          {isAuthenticated && recipe.is_mine && (
            <div className="flex gap-1 text-sm text-ink-soft">
              <button type="button" className="px-3 py-2 disabled:opacity-40" disabled>수정</button>
              <button type="button" className="px-3 py-2 disabled:opacity-40" disabled>삭제</button>
            </div>
          )}
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{recipe.recipe_title}</h2>
        {recipe.intro && <p className="mt-3 text-ink-soft leading-relaxed">{recipe.intro}</p>}
        <p className="mt-2 text-sm text-muted">작성자 {recipe.nickname}</p>

        <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-[18px] bg-page py-3 text-center">
            <dt className="text-sm text-muted">인분</dt>
            <dd className="mt-1 font-bold">{recipe.servings}인분</dd>
          </div>
          <div className="rounded-[18px] bg-page py-3 text-center">
            <dt className="text-sm text-muted">조리 시간</dt>
            <dd className="mt-1 font-bold">{recipe.cooking_time}분</dd>
          </div>
          <div className="rounded-[18px] bg-page py-3 text-center">
            <dt className="text-sm text-muted">난이도</dt>
            <dd className="mt-1 font-bold">{recipe.level}</dd>
          </div>
          <div className="rounded-[18px] bg-page py-3 text-center">
            <dt className="text-sm text-muted">필요한 조리도구</dt>
            <dd className="mt-1 font-bold">{recipe.tool_name ?? "없음"}</dd>
          </div>
        </dl>

        {/* 좋아요 · 북마크: 누른 상태는 검정 버튼 */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={isLiked} className={pillClass(isLiked)} onClick={handleLike} disabled={isSaving}>
            {isLiked ? "좋아요 취소" : "좋아요"}
          </button>
          <button type="button" aria-pressed={isBookmarked} className={pillClass(isBookmarked)} onClick={handleBookmark} disabled={isSaving}>
            {isBookmarked ? "북마크 취소" : "북마크"}
          </button>
          <p className="ml-1 text-sm text-muted">
            좋아요 {likeCount}개 · 댓글 {recipe.comment_count}개
          </p>
        </div>
      </section>

      {/* 레시피에 필요한 식재료 이름과 수량 */}
      <section className={cardClass}>
        <h3 className="text-xl font-black">필요한 재료</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {recipe.ingredients.map((ingredient) => {
            const isMissing = missingIds.includes(ingredient.ing_id);
            return (
              <li
                key={ingredient.ing_id}
                className={`inline-flex items-center gap-2 h-11 px-4 rounded-pill ${
                  isMissing ? "bg-miss-soft" : "bg-gray-100"
                }`}
              >
                <span className="font-bold">{ingredient.ing_name}</span>
                <span className="text-sm text-ink-soft">{ingredient.amount_text}</span>
                {isMissing && <span className="text-xs font-bold text-miss">부족</span>}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 조리 단계와 단계별 이미지 */}
      <section className={cardClass}>
        <h3 className="text-xl font-black">조리 순서</h3>
        <ol className="mt-5 flex flex-col gap-6">
          {recipe.steps.map((step, index) => (
            <li key={step.step_id} className="flex gap-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent font-bold text-white">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-3 pt-1.5">
                <p className="text-[17px] leading-relaxed">{step.step_content}</p>
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

      {/* 현재 레시피 ID를 댓글 컴포넌트에 전달 */}
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
