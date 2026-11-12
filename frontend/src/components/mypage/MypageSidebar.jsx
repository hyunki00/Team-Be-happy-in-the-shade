// 담당: 오효정 (임시화면입니다~)

// 좋아요한 요리, 북마크한 요리, 내 레시피 , 내 댓글, 로그아웃

function MypageSidebar({ activeMenu, onMenuChange, onLogout }) {
  // 로그아웃은 onLogout에 위임. 서버 로그아웃 연결은 AuthContext에서 처리?
  //  메뉴 전환·선택한 메뉴 버튼 비활성화·화면 출력은 그대로 사용
  return (
    <nav className="mypage-sidebar">

      <button
        type="button"
        onClick={() => onMenuChange('profile')}
        disabled={activeMenu === 'profile'}>
        프로필 수정
      </button>

      <button
        type="button"
        onClick={() => onMenuChange('recipe_liked')}
        disabled={activeMenu === 'recipe_liked'}>
        좋아요한 레시피
      </button>

      <button
        type="button"
        onClick={() => onMenuChange('recipe_bookmarked')}
        disabled={activeMenu === 'recipe_bookmarked'}>
        북마크한 레시피
      </button>

      <button
        type="button"
        onClick={() => onMenuChange('recipes')}
        disabled={activeMenu === 'recipes'}>
        내 레시피
      </button>

      <button
        type="button"
        onClick={() => onMenuChange('posts')}
        disabled={activeMenu === 'posts'}>
        내 게시글
      </button>

      <button
        type="button"
        onClick={() => onMenuChange('comments')}
        disabled={activeMenu === 'comments'}>
        내 댓글
      </button>

      <button
        type="button"
        onClick={() => onMenuChange('posts_liked')}
        disabled={activeMenu === 'posts_liked'}>
        좋아요한 게시글
      </button>

      <hr />

      <button
        type="button"
        onClick={onLogout}>
        로그아웃
      </button>

    </nav>
  );
}

export default MypageSidebar;
