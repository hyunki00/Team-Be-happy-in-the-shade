// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 탭 · 정렬 · 수정/삭제 로직은 그대로
//   1. mypage-comments 클래스는 정의된 CSS가 없어서 적용이 안 되고 있었음 → Tailwind 클래스로 바꿈
//   2. 레시피 댓글 · 커뮤니티 댓글 탭: 알약 버튼, 고른 탭은 검정
//   3. 댓글마다 연한 구분선, 원문 제목 굵게 · 날짜 흐리게 · 원문 보기 / 수정 / 삭제는 작은 글씨 버튼
import { useState } from 'react';
import { Link } from 'react-router-dom';

// 댓글 조회 데이터는 부모의 comments props로 전달받음. 조회 API는 부모에서 연결
// [수정 11/24 조현기] 원래는 수정 · 삭제 버튼이 'DB 연결 후 제공 예정' 알림만 띄웠음
//   - [삭제]: 부모(MyPage)에게 받은 onDelete(댓글)를 부름 → MyPage가 확인창 + 삭제 API + 목록 갱신
//   - [수정]: 버튼을 뺌. 대신 링크 글자를 '원문 보기 · 수정'으로 바꿔서, 원래 글로 가서 그 화면의 댓글 칸에서 고침
//     (레시피 상세의 CommentSection · 게시글 상세에 이미 수정 기능이 있어서, 같은 기능을 여기 또 만들지 않음)
//   - onDelete?.(…): onDelete를 안 넘겨준 경우에도 오류 없이 넘어감
function MyCommentList({ comments, onDelete }) {
  // 탭 전환·필터링·정렬은 DB 연결 후에도 사용
  const [activeTab, setActiveTab] = useState('recipe');
  const visibleComments = comments
    .filter((comment) => comment.targetType === activeTab)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  // 목록·빈 목록 안내·원문 링크 출력
  return (
    <section>
      <h2 className="text-xl font-black">내 댓글</h2>

      <div role="group" aria-label="댓글 종류" className="mt-4 flex gap-2">
        <button type="button" aria-pressed={activeTab === 'recipe'} className={`h-10 rounded-pill px-4 text-sm font-bold ${activeTab === 'recipe' ? "bg-ink text-white" : "bg-gray-100 hover:bg-gray-200"}`} onClick={() => setActiveTab('recipe')}>
          레시피 댓글 {comments.filter((comment) => comment.targetType === 'recipe').length}
        </button>
        <button type="button" aria-pressed={activeTab === 'post'} className={`h-10 rounded-pill px-4 text-sm font-bold ${activeTab === 'post' ? "bg-ink text-white" : "bg-gray-100 hover:bg-gray-200"}`} onClick={() => setActiveTab('post')}>
          커뮤니티 댓글 {comments.filter((comment) => comment.targetType === 'post').length}
        </button>
      </div>

      {visibleComments.length === 0 ? (
        <p className="mt-6 text-muted">작성한 {activeTab === 'recipe' ? '레시피' : '커뮤니티'} 댓글이 없습니다.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {visibleComments.map((comment) => (
            <li key={comment.id} className="flex flex-col gap-1 py-4">
              <strong className="text-sm text-ink-soft">{comment.targetTitle ?? (comment.targetType === 'recipe' ? '삭제된 레시피' : '삭제된 게시글')}</strong>
              <p className="text-[15px]">{comment.content}</p>
              {comment.createdAt && (
                <time dateTime={comment.createdAt} className="text-sm text-muted">{comment.createdAt.slice(0, 10)}</time>
              )}
              {comment.targetTitle != null ? (
                <div className="mt-1 flex gap-3 text-sm text-muted">
                  <Link to={`/${comment.targetType === 'recipe' ? 'recipes' : 'board'}/${comment.targetId}`} className="hover:text-accent">
                    원문 보기 · 수정
                  </Link>
                  <button type="button" className="hover:text-miss" onClick={() => onDelete?.(comment)}>삭제</button>
                </div>
              ) : (
                <p className="text-sm text-muted">원문을 확인할 수 없습니다.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MyCommentList;
