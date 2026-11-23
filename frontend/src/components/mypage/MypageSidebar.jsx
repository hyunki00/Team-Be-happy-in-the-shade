// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 메뉴 전환 로직은 그대로
//   1. 메뉴를 세로 목록으로, 지금 메뉴(비활성 버튼)는 연한 포인트 바탕 + 포인트 글자
//   2. 구분선은 연한 선, 로그아웃은 흐린 글씨

// 좋아요한 요리, 북마크한 요리, 내 레시피 , 내 댓글, 로그아웃

function MypageSidebar({ activeMenu, onMenuChange, onLogout }) {
  // 로그아웃은 onLogout에 위임. 서버 로그아웃 연결은 AuthContext에서 처리?
  //  메뉴 전환·선택한 메뉴 버튼 비활성화·화면 출력은 그대로 사용
  return (
    <nav aria-label="마이페이지 메뉴" className="flex flex-col gap-1">

      <button
        type="button"
        className="flex h-11 w-full items-center rounded-[14px] px-4 text-left text-[15px] font-medium hover:bg-gray-50 disabled:cursor-default disabled:bg-accent-soft disabled:font-bold disabled:text-accent"
        onClick={() => onMenuChange('profile')}
        disabled={activeMenu === 'profile'}>
        프로필 수정
      </button>

      <button
        type="button"
        className="flex h-11 w-full items-center rounded-[14px] px-4 text-left text-[15px] font-medium hover:bg-gray-50 disabled:cursor-default disabled:bg-accent-soft disabled:font-bold disabled:text-accent"
        onClick={() => onMenuChange('recipe_liked')}
        disabled={activeMenu === 'recipe_liked'}>
        좋아요한 레시피
      </button>

      <button
        type="button"
        className="flex h-11 w-full items-center rounded-[14px] px-4 text-left text-[15px] font-medium hover:bg-gray-50 disabled:cursor-default disabled:bg-accent-soft disabled:font-bold disabled:text-accent"
        onClick={() => onMenuChange('recipe_bookmarked')}
        disabled={activeMenu === 'recipe_bookmarked'}>
        북마크한 레시피
      </button>

      <button
        type="button"
        className="flex h-11 w-full items-center rounded-[14px] px-4 text-left text-[15px] font-medium hover:bg-gray-50 disabled:cursor-default disabled:bg-accent-soft disabled:font-bold disabled:text-accent"
        onClick={() => onMenuChange('recipes')}
        disabled={activeMenu === 'recipes'}>
        내 레시피
      </button>

      <button
        type="button"
        className="flex h-11 w-full items-center rounded-[14px] px-4 text-left text-[15px] font-medium hover:bg-gray-50 disabled:cursor-default disabled:bg-accent-soft disabled:font-bold disabled:text-accent"
        onClick={() => onMenuChange('posts')}
        disabled={activeMenu === 'posts'}>
        내 게시글
      </button>

      <button
        type="button"
        className="flex h-11 w-full items-center rounded-[14px] px-4 text-left text-[15px] font-medium hover:bg-gray-50 disabled:cursor-default disabled:bg-accent-soft disabled:font-bold disabled:text-accent"
        onClick={() => onMenuChange('comments')}
        disabled={activeMenu === 'comments'}>
        내 댓글
      </button>

      <button
        type="button"
        className="flex h-11 w-full items-center rounded-[14px] px-4 text-left text-[15px] font-medium hover:bg-gray-50 disabled:cursor-default disabled:bg-accent-soft disabled:font-bold disabled:text-accent"
        onClick={() => onMenuChange('posts_liked')}
        disabled={activeMenu === 'posts_liked'}>
        좋아요한 게시글
      </button>

      <hr className="my-2 border-line" />

      <button
        type="button"
        className="flex h-11 w-full items-center rounded-[14px] px-4 text-left text-sm text-muted hover:text-accent"
        onClick={onLogout}>
        로그아웃
      </button>

    </nav>
  );
}

export default MypageSidebar;
