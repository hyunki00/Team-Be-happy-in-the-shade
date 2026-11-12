// 담당: 오효정 (임시화면입니다~)

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
      <h2>{title}</h2>

      {posts.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.post_id}>
              {post.title}
              {onCancelLike && (
                <button type="button" onClick={() => onCancelLike(post.post_id)}>
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
