// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 목록 · 좋아요 취소 로직은 그대로
//   1. 제목 크게, 글 목록은 줄마다 연한 구분선
//   2. 좋아요 취소는 작은 회색 알약 버튼, 빈 목록 안내는 흐린 글씨

//board 컴포넌트 재사용해 출력하게한다


//내포스트
function MyPostList({
  posts, title = '내 게시글', emptyMessage = '작성한 게시글이 없습니다.', onCancelLike,
}) {
  // ① 게시글 조회 데이터는 부모의 posts props로 전달받음
  // ② 좋아요 취소는 부모의 onCancelLike에 위임. 현재 MyPage에서 구현 예정 알림 표시
  // ③ 목록·빈 목록 안내·버튼 출력은 DB 연결 후에도 사용
  return (
    <section>
      <h2 className="text-xl font-black">{title}</h2>

      {posts.length === 0 ? (
        <p className="mt-6 text-muted">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {posts.map((post) => (
            <li key={post.post_id} className="flex items-center justify-between gap-3 py-4">
              {post.title}
              {onCancelLike && (
                <button type="button" className="h-9 flex-none rounded-pill bg-gray-100 px-4 text-sm font-medium hover:bg-gray-200" onClick={() => onCancelLike(post.post_id)}>
                  좋아요 취소
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MyPostList;

//
