// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 목록 · 수정 · 삭제 · 취소 로직은 그대로
//   1. mypage-recipes 클래스는 정의된 CSS가 없어서 적용이 안 되고 있었음 → Tailwind 클래스로 바꿈
//   2. 레시피를 한 줄씩: 왼쪽 둥근 사진(80px) + 제목 · 날짜 · 좋아요 · 댓글, 오른쪽 버튼
//   3. 취소 · 수정은 회색 알약, 삭제는 연한 빨간 알약

//recipe 컴포넌트 재사용해 출력하게한다
import { Link } from 'react-router-dom';
import { thumbUrl, fallbackToOriginal } from '../../api';   // [11/24 조현기] 레시피 사진 썸네일

function MyRecipeList({
  recipes, title = '내 레시피', emptyMessage = '작성한 레시피가 없습니다.',
  editable = false, onDelete, onCancel, cancelLabel,
}) {
  // ① 레시피 조회 데이터는 부모의 recipes props로 전달받음
  // ② 삭제·반응 취소는 onDelete·onCancel에 위임. 현재 MyPage에서 구현 예정 알림 표시
  // ③ 목록·상세/수정 링크·버튼 출력은 DB 연결 후에도 사용
  return (
    <section>
      <h2 className="text-xl font-black">{title} <span className="text-accent">{recipes.length}</span></h2>

      {recipes.length === 0 ? (
        <p className="mt-6 text-muted">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {recipes.map((recipe) => (
            <li key={recipe.recipe_id} className="flex flex-wrap items-center gap-4 py-4">
              <Link to={`/recipes/${recipe.recipe_id}`} className="flex min-w-0 flex-1 items-center gap-4 hover:text-accent">
                {/* [11/24 조현기] 큰 원본 대신 썸네일 (없으면 원본으로 자동 교체) */}
                <img src={thumbUrl(recipe.recipe_id, recipe.main_image_url ?? recipe.image_url)}
                  onError={(e) => fallbackToOriginal(e, recipe.main_image_url ?? recipe.image_url)}
                  loading="lazy"
                  alt={recipe.recipe_title} className="h-20 w-20 flex-none rounded-[18px] object-cover bg-photo"
                />
                <span className="truncate font-bold">{recipe.recipe_title}</span>
              </Link>

              <p className="w-full text-sm text-muted sm:order-none">
                {recipe.created_at?.slice(0, 10)}
                {' · '}좋아요 {recipe.like_count ?? 0}
                {' · '}댓글 {recipe.comment_count ?? 0}
              </p>

              {onCancel && (
                <button type="button" className="h-9 rounded-pill bg-gray-100 px-4 text-sm font-medium hover:bg-gray-200" onClick={() => onCancel(recipe.recipe_id)}>
                  {cancelLabel}
                </button>
              )}

              {editable && (
                <>
                  <Link to={`/recipes/${recipe.recipe_id}/edit`} className="inline-flex h-9 items-center rounded-pill bg-gray-100 px-4 text-sm font-medium hover:bg-gray-200">수정</Link>

                  <button type="button" className="h-9 rounded-pill bg-miss-soft px-4 text-sm font-bold text-miss" onClick={() => onDelete?.(recipe.recipe_id)}>
                    삭제
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MyRecipeList;
