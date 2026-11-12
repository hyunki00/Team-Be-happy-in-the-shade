// 담당: 오효정 (임시화면입니다~)

import { useAuth } from '../contexts/AuthContext'
import { mockPosts, mockPostComments, mockRecipeComments, mockRecipes } from '../mockData';

//자식 컴포넌트들
import MyPostList from '../components/mypage/MyPostList'; //내 게시글들
import MypageSidebar from '../components/mypage/MypageSidebar'; //사이드 바
import ProfileEditor from '../components/mypage/ProfileEditor'; //프로필 수정
import MyCommentList from '../components/mypage/MyCommentList'; //내가 쓴 댓글(레시피, 포스트)
import MyRecipeList from '../components/mypage/MyRecipeList'; //내 레시피
import { useState } from 'react';


// 나중에 mock 필터링을 로그인한 사용자가 작성한 레시피 조회 API 호출로 교체
// 사이드 버튼: 내 게시글, 내 레시피, 작성 댓글, 프로필 수정, 좋아요한 레시피, 북마크한 레시피, 좋아요한 게시글
const MyPage = () => {
  const { user, logout } = useAuth();

  const [activeMenu, setActiveMenu] = useState('profile');

  
  const recipes = mockRecipes;
  const posts = mockPosts;
  const postComments = mockPostComments;
  const recipeComments = mockRecipeComments;


  // mock데이터에서 로그인한 userid와 레시피 userid가 같은 레시피만 꺼낸다. 
  const myRecipes = recipes.filter(
    (recipe) => recipe.user_id === user?.user_id
  );
  const myPosts = posts.filter((post) => post.user_id === user?.user_id);
  
  // mock의 반응 여부는 현재 테스트 사용자 기준.
  // DB 연결 후 실제 API에서는 로그인 사용자의 좋아요·북마크 정보를 조회
  const likedRecipes = recipes.filter((recipe) => recipe.is_liked);
  const bookmarkedRecipes = recipes.filter((recipe) => recipe.is_bookmarked);
  const likedPosts = posts.filter((post) => post.is_liked);



  // mock게시글 댓글과 mock레시피 댓글의 필드 이름을 맞춰 합쳐 commentlist에서 같이 처리하게 함
  // 게시글 댓글과 레시피 댓글을 화면에서 사용할 공통 형식으로 변환
  // DB연결 후 댓글 조회 API의 응답 형식에 맞춰 조정
  // DB연결 후 댓글 원문 제목을 댓글 API에서 함께받기
  const myComments = [
    ...postComments
      .filter((comment) => comment.user_id === user?.user_id)
      .map((comment) => ({
        id: `post-${comment.pc_id}`,
        type: '게시글',
        targetType: 'post',
        targetId: comment.post_id,
        targetTitle: posts.find((post) => post.post_id === comment.post_id)?.title,
        createdAt: comment.created_at,
        content: comment.pc_content,
      })),

    ...recipeComments
      .filter((comment) => comment.user_id === user?.user_id)
      .map((comment) => ({
        id: `recipe-${comment.rc_id}`,
        type: '레시피',
        targetType: 'recipe',
        targetId: comment.recipe_id,
        targetTitle: recipes.find((recipe) => recipe.recipe_id === comment.recipe_id)?.recipe_title,
        createdAt: comment.created_at,
        content: comment.rc_content,
      })),
  ];

  //변경 함수: DB구현 후 각 함수에 변경 API 요청, 실패 처리, 성공 후 목록 갱신 추가
  const handleDeleteRecipe = (recipeId) => {
    const recipe = recipes.find((item) => item.recipe_id === recipeId);

    if (!recipe || recipe.user_id !== user?.user_id) return;
    // DB 연결 후 레시피 삭제 기능 구현
    window.alert('레시피 삭제 기능은 DB 연결 후 제공될 예정입니다.');
  };


  const cancelReaction = (recipeId, field) => {
    const recipe = recipes.find((item) => item.recipe_id === recipeId);
    if (!user || !recipe) return;

    // DB 연결 후 좋아요 또는 북마크 취소 기능 구현
    const label = field === 'is_liked' ? '좋아요' : '북마크';
    window.alert(`${label} 취소 기능은 DB 연결 후 제공될 예정입니다.`);
  };

  const handleCancelPostLike = (postId) => {
    if (!user) return;

    const post = posts.find((item) => item.post_id === postId);
    if (!post) return;

    // TODO: 게시글 좋아요 취소 API 요청 후 목록 갱신
    window.alert('게시글 좋아요 취소 기능은 DB 연결 후 제공될 예정입니다.');
  };

  if (!user) {
    return <p>로그인 후 이용해 주세요.</p>;
  }

  return (
    <div className="mypage">
      <header className="mypage-heading">
        <span>MY SPACE</span>
        <h1>나의 요리 기록</h1>
        <p>좋아하는 요리부터 나눈 이야기까지, 한곳에서 모아보세요.</p>
      </header>
      <div className="mypage-layout">
      <aside className="mypage-aside">
        <div className="mypage-user">
          {user.profile_image_url ? (
            <img src={user.profile_image_url} alt="내 프로필" />
          ) : <span className="mypage-avatar">{user.nickname?.slice(0, 1) || '나'}</span>}
          <strong>{user.nickname}</strong>
          <span>오늘도 맛있는 하루</span>
        </div>
      <MypageSidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} onLogout = {logout}/>
      </aside>
      <div className="mypage-content">
      
      {activeMenu === 'profile' && <ProfileEditor user={user} />}
      {activeMenu === 'posts' && <MyPostList posts={myPosts} />}
      {activeMenu === 'comments' && <MyCommentList comments={myComments} />}
      
      {activeMenu === 'recipe_liked' && (
        <MyRecipeList recipes={likedRecipes} title="좋아요한 레시피" emptyMessage="좋아요한 레시피가 없습니다."
          onCancel={(recipeId) => cancelReaction(recipeId, 'is_liked')} cancelLabel="좋아요 취소" />
      )}
      {activeMenu === 'recipe_bookmarked' && (
        <MyRecipeList recipes={bookmarkedRecipes} title="북마크한 레시피" emptyMessage="북마크한 레시피가 없습니다."
          onCancel={(recipeId) => cancelReaction(recipeId, 'is_bookmarked')} cancelLabel="북마크 취소" />
      )}
      {activeMenu === 'recipes' && (
        <MyRecipeList recipes={myRecipes} editable onDelete={handleDeleteRecipe} />
      )}
      {activeMenu === 'posts_liked' && (
        <MyPostList posts={likedPosts} title="좋아요한 게시글" emptyMessage="좋아요한 게시글이 없습니다."
          onCancelLike={handleCancelPostLike} />
      )}
      </div>
      </div>
    </div>
  )
}

export default MyPage



