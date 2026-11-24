// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 메뉴 전환 · 목록 로직은 그대로
//   1. mypage · mypage-layout · mypage-aside 등은 정의된 CSS가 없어서 적용이 안 되고 있었음 → Tailwind 클래스로 바꿈
//   2. 위: 작은 영문 표시 + 큰 제목, 아래: 왼쪽 프로필 · 메뉴 카드(260px) + 오른쪽 내용 카드
//   3. 프로필 사진이 없으면 닉네임 첫 글자 동그라미

// [수정 11/24 조현기] 가짜 데이터(mockData) → 실제 마이페이지 API 연결
//   백엔드 API는 오효정이 만든 routers/user.py의 7개를 그대로 씀
//     GET /users/me/recipes            내 레시피             (레시피 카드 모양, RecipeListItem)
//     GET /users/me/liked-recipes      좋아요한 레시피       (〃, 누른 최신순)
//     GET /users/me/bookmarked-recipes 북마크한 레시피       (〃, 누른 최신순)
//     GET /users/me/posts              내 게시글             (게시글 목록 모양, PostListItem)
//     GET /users/me/liked-posts        좋아요한 게시글       (〃)
//     GET /users/me/post-comments      내 게시글 댓글        (pc_id, post_id, post_title, pc_content, created_at)
//     GET /users/me/recipe-comments    내 레시피 댓글        (rc_id, recipe_id, recipe_title, rc_content, created_at)
//
//   흐름
//     1. 마이페이지를 열면 7개를 한 번에(Promise.all) 받아서 lists에 저장
//     2. 받는 동안은 '불러오는 중...', 실패하면 안내 + [다시 불러오기]
//     3. 삭제 · 취소 버튼 → 확인창 → API 요청 → 성공하면 7개를 다시 받아서 화면 갱신(reload)
//   바뀌지 않은 것: 화면 모양, 사이드 메뉴, 자식 컴포넌트(MyRecipeList 등)에 넘기는 props 이름
//   프로필 수정(ProfileEditor)은 따로 저장하므로 이 목록과 상관없이 바로 보임

import { useAuth } from '../contexts/AuthContext'
import api from '../api';   // [수정 11/24 조현기] mockData 대신 공통 api (로그인 쿠키가 같이 감)
import Swal from 'sweetalert2';   // [수정 11/24 조현기] 삭제 · 취소 전에 한 번 더 묻는 확인창 (window.alert 대신)

//자식 컴포넌트들
import MyPostList from '../components/mypage/MyPostList'; //내 게시글들
import MypageSidebar from '../components/mypage/MypageSidebar'; //사이드 바
import ProfileEditor from '../components/mypage/ProfileEditor'; //프로필 수정
import MyCommentList from '../components/mypage/MyCommentList'; //내가 쓴 댓글(레시피, 포스트)
import MyRecipeList from '../components/mypage/MyRecipeList'; //내 레시피
import { useEffect, useState } from 'react';

// [수정 11/24 조현기] 서버가 준 오류 문장 꺼내기
//   서버는 실패하면 { detail: "본인 레시피만 삭제할 수 있습니다." }처럼 보냄 → 그 문장을 그대로 보여 줌
//   글자가 아니면(입력 형식 오류 목록 등) 또는 서버가 꺼져 있으면 fallback(기본 문장)
const errorText = (err, fallback) => {
  const detail = err.response?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
};

// 사이드 버튼: 내 게시글, 내 레시피, 작성 댓글, 프로필 수정, 좋아요한 레시피, 북마크한 레시피, 좋아요한 게시글
const MyPage = () => {
  const { user, logout } = useAuth();

  const [activeMenu, setActiveMenu] = useState('profile');

  // [수정 11/24 조현기] 서버에서 받은 목록 7개를 한 객체에 담음
  //   lists = { myRecipes, likedRecipes, bookmarkedRecipes, myPosts, likedPosts, postComments, recipeComments }
  //   처음 값 null = '아직 불러오는 중' (빈 배열 []로 시작하면 받기 전에 '없습니다' 안내가 잠깐 보임)
  //   loadError: 불러오기 실패 문구 / reloadKey: 이 숫자가 바뀌면 아래 useEffect가 목록을 다시 받음
  const [lists, setLists] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);   // 1 늘리면 목록을 다시 받음
  const reload = () => setReloadKey((prev) => prev + 1);

  const userId = user?.user_id;

  // [수정 11/24 조현기] 마이페이지 목록 7개를 한 번에 받기
  //   - 로그인 정보(userId)가 없으면 아무것도 안 함 (아래에서 '로그인 후 이용해 주세요'만 보임)
  //   - Promise.all: 7개 요청을 동시에 보내고, 모두 끝나면 한꺼번에 저장 (하나라도 실패하면 catch)
  //   - AbortController: 화면을 떠나거나 다시 받기 전에 이전 요청을 취소 (취소는 오류가 아니라 무시)
  //   - [userId, reloadKey]: 다른 계정으로 바뀌었거나 reload()를 불렀을 때 다시 받음
  //   - 다시 받는 동안에도 이전 목록은 그대로 보여서 화면이 깜빡이지 않음
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const get = (url) => api.get(url, { signal: controller.signal }).then((res) => res.data);

    Promise.all([
      get('/users/me/recipes'),
      get('/users/me/liked-recipes'),
      get('/users/me/bookmarked-recipes'),
      get('/users/me/posts'),
      get('/users/me/liked-posts'),
      get('/users/me/post-comments'),
      get('/users/me/recipe-comments'),
    ])
      .then(([myRecipes, likedRecipes, bookmarkedRecipes, myPosts, likedPosts, postComments, recipeComments]) => {
        setLists({ myRecipes, likedRecipes, bookmarkedRecipes, myPosts, likedPosts, postComments, recipeComments });
        setLoadError('');
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setLoadError('마이페이지 정보를 불러오지 못했어요.');
      });

    return () => controller.abort();
  }, [userId, reloadKey]);

  // 게시글 댓글과 레시피 댓글을 화면에서 사용할 공통 형식으로 변환 (MyCommentList가 같이 처리)
  // [수정 11/24 조현기] 원래는 mock 게시글 · 레시피 목록에서 원문 제목을 찾아서 붙였는데,
  //   지금은 API가 원문 제목(post_title · recipe_title)을 같이 줘서 그대로 씀
  //   commentId(pc_id · rc_id)를 추가: 내 댓글 목록에서 삭제할 때 어떤 댓글인지 서버에 알려 주려고
  //   lists가 아직 없으면(불러오는 중) 빈 배열
  const myComments = lists ? [
    ...lists.postComments.map((comment) => ({
      id: `post-${comment.pc_id}`,
      commentId: comment.pc_id,
      type: '게시글',
      targetType: 'post',
      targetId: comment.post_id,
      targetTitle: comment.post_title,
      createdAt: comment.created_at,
      content: comment.pc_content,
    })),
    ...lists.recipeComments.map((comment) => ({
      id: `recipe-${comment.rc_id}`,
      commentId: comment.rc_id,
      type: '레시피',
      targetType: 'recipe',
      targetId: comment.recipe_id,
      targetTitle: comment.recipe_title,
      createdAt: comment.created_at,
      content: comment.rc_content,
    })),
  ] : [];

  // [수정 11/24 조현기] 삭제 · 취소 버튼이 같이 쓰는 함수 (원래는 'DB 연결 후 제공 예정' 알림만 띄웠음)
  //   question  : 확인창에 띄울 질문
  //   request   : 실제로 보낼 API 요청 (함수로 넘겨서, 사용자가 '확인'을 눌렀을 때만 실행)
  //   failTitle : 실패했을 때 오류 창 제목
  //   순서: 확인창 → [취소]면 끝 / [확인]이면 요청 → 성공하면 reload()로 목록 다시 받기 → 실패하면 오류 창
  //   아래 handleDeleteRecipe · cancelReaction · handleCancelPostLike · handleDeleteComment가 이걸 씀
  const confirmAndRun = async (question, request, failTitle) => {
    const result = await Swal.fire({
      title: question,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '확인',
      cancelButtonText: '취소',
    });
    if (!result.isConfirmed) return;
    try {
      await request();
      reload();
    } catch (err) {
      Swal.fire(failTitle, errorText(err, '잠시 후 다시 시도해 주세요.'), 'error');
    }
  };

  // 내 레시피 삭제 — DELETE /recipes/{id} (본인 레시피만, 아니면 서버가 403)
  const handleDeleteRecipe = (recipeId) =>
    confirmAndRun('레시피를 삭제할까요?', () => api.delete(`/recipes/${recipeId}`), '레시피 삭제 실패');

  // 좋아요 · 북마크 취소 — DELETE /recipes/{id}/likes 또는 /bookmarks (레시피 상세 화면의 버튼과 같은 API)
  //   field: 'is_liked'면 좋아요, 'is_bookmarked'면 북마크 (MyRecipeList가 넘겨줌)
  const cancelReaction = (recipeId, field) => {
    const label = field === 'is_liked' ? '좋아요' : '북마크';
    const path = field === 'is_liked' ? 'likes' : 'bookmarks';
    return confirmAndRun(`${label}를 취소할까요?`, () => api.delete(`/recipes/${recipeId}/${path}`), `${label} 취소 실패`);
  };

  // 게시글 좋아요 취소 — DELETE /posts/{id}/likes (게시글 상세 화면의 버튼과 같은 API)
  const handleCancelPostLike = (postId) =>
    confirmAndRun('게시글 좋아요를 취소할까요?', () => api.delete(`/posts/${postId}/likes`), '좋아요 취소 실패');

  // 내 댓글 삭제 — 댓글 종류(targetType)에 따라 주소가 다름
  //   레시피 댓글: DELETE /recipe-comments/{rc_id}   게시글 댓글: DELETE /post-comments/{pc_id}
  //   (MyCommentList의 [삭제] 버튼이 onDelete로 댓글 하나를 넘겨줌)
  const handleDeleteComment = (comment) => {
    const url = comment.targetType === 'recipe'
      ? `/recipe-comments/${comment.commentId}`
      : `/post-comments/${comment.commentId}`;
    return confirmAndRun('댓글을 삭제할까요?', () => api.delete(url), '댓글 삭제 실패');
  };

  if (!user) {
    return <p className="mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card">로그인 후 이용해 주세요.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <span className="text-sm font-bold tracking-widest text-accent">MY SPACE</span>
        <h1 className="mt-1 text-3xl font-black">나의 요리 기록</h1>
        <p className="mt-2 text-muted">좋아하는 요리부터 나눈 이야기까지, 한곳에서 모아보세요.</p>
      </header>
      <div className="grid items-start gap-6 md:grid-cols-[260px_1fr]">
      <aside className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-card">
        <div className="flex flex-col items-center gap-1 border-b border-line pb-5 text-center">
          {user.profile_image_url ? (
            <img src={user.profile_image_url} alt="내 프로필" className="mb-2 h-20 w-20 rounded-full object-cover" />
          ) : <span className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-black text-ink-soft">{user.nickname?.slice(0, 1) || '나'}</span>}
          <strong className="text-lg">{user.nickname}</strong>
          <span className="text-sm text-muted">오늘도 맛있는 하루</span>
        </div>
      <MypageSidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} onLogout = {logout}/>
      </aside>
      <div className="min-w-0 rounded-card bg-surface p-6 shadow-card md:p-8">
      
      {activeMenu === 'profile' && <ProfileEditor user={user} />}

      {/* [수정 11/24 조현기] 오른쪽 내용 영역
          - 프로필 수정: 목록이 필요 없어서 바로 보임 (위)
          - 다른 메뉴: 실패했으면 안내 + [다시 불러오기], 아직 받는 중이면 '불러오는 중...'
          - 목록(lists)을 다 받았으면 아래에서 메뉴별 목록을 보여 줌 (props 이름은 원래와 같고 값만 lists.xxx로) */}
      {activeMenu !== 'profile' && loadError && (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-muted">{loadError}</p>
          <button type="button" onClick={reload} className="h-10 rounded-pill bg-gray-100 px-5 text-sm font-bold hover:bg-gray-200">다시 불러오기</button>
        </div>
      )}
      {activeMenu !== 'profile' && !loadError && !lists && (
        <p role="status" className="text-muted">불러오는 중...</p>
      )}

      {lists && (
        <>
          {activeMenu === 'posts' && <MyPostList posts={lists.myPosts} />}
          {activeMenu === 'comments' && <MyCommentList comments={myComments} onDelete={handleDeleteComment} />}

          {activeMenu === 'recipe_liked' && (
            <MyRecipeList recipes={lists.likedRecipes} title="좋아요한 레시피" emptyMessage="좋아요한 레시피가 없습니다."
              onCancel={(recipeId) => cancelReaction(recipeId, 'is_liked')} cancelLabel="좋아요 취소" />
          )}
          {activeMenu === 'recipe_bookmarked' && (
            <MyRecipeList recipes={lists.bookmarkedRecipes} title="북마크한 레시피" emptyMessage="북마크한 레시피가 없습니다."
              onCancel={(recipeId) => cancelReaction(recipeId, 'is_bookmarked')} cancelLabel="북마크 취소" />
          )}
          {activeMenu === 'recipes' && (
            <MyRecipeList recipes={lists.myRecipes} editable onDelete={handleDeleteRecipe} />
          )}
          {activeMenu === 'posts_liked' && (
            <MyPostList posts={lists.likedPosts} title="좋아요한 게시글" emptyMessage="좋아요한 게시글이 없습니다."
              onCancelLike={handleCancelPostLike} />
          )}
        </>
      )}
      </div>
      </div>
    </div>
  )
}

export default MyPage



