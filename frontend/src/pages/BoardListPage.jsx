// 담당: 임유빈 
// 커뮤니티 게시물 목록 페이지 [임시코드 - 아직 수정중]
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 검색 · 정렬 · 목록 로직은 그대로
//   1. 글쓰기 · 검색 등 주요 버튼: 검정 → 포인트색(accent), 버튼 · 입력칸은 알약 모양(rounded-pill)
//   2. 게시글 목록 · 빈 목록 안내: 흰 둥근 카드(rounded-card · shadow-card)
//   3. 빨강 · 파랑 글씨 → 시안 색(miss · have), 입력칸 포커스 테두리는 포인트색
//   4. 회색(gray) 클래스는 그대로 둠 — index.css에서 따뜻한 회색으로 바뀌어 있음
// [수정 11/24 조현기] (로딩) 불러오는 동안 '등록된 게시글이 없습니다'가 먼저 뜨던 문제 수정
//   원인: posts가 처음에 빈 배열([])이라, 서버 응답이 오기 전까지 '게시글 0개'로 보고 빈 목록 안내를 그렸음
//   해결: '지금 화면의 조건(정렬 · 검색)으로 받아 온 적이 있는지'를 기억해서, 아직이면 '불러오는 중'으로 봄
//   - requestKey : 지금 조건을 글자 하나로 묶은 것 (예: '["latest","title",""]')
//   - loadedKey  : 마지막으로 응답을 받은 조건 (+ 다시 불러오기 횟수). 처음엔 null
//   - isLoading  : 둘이 다르면 true → 회색 자리 줄 5개(스켈레톤)
//   화면 순서: 불러오는 중이면 회색 자리 → 실패면 오류 안내 + [다시 불러오기] → 0개면 빈 목록 안내 → 목록
//   (setLoading(true)를 이펙트에서 부르지 않는 이유: 린트 오류 set-state-in-effect. 비교로 계산하면 필요 없음)

import { useState, useEffect } from 'react'; // [수정 11/24 조현기] 린트(no-unused-vars): 안 쓰는 React import 삭제 (React 17 이후 JSX에 React import 필요 없음)
import { useNavigate } from 'react-router-dom';
import { BOARD_SORT, BOARD_SEARCH_TYPES } from '../constants';
import api from '../api'; 

//게시글생성 시간 표기
function formatBoardDate(dateValue) {
  if (!dateValue) return '방금 전';
  if (typeof dateValue === 'string' && dateValue.includes('방금')) return dateValue;

  if (typeof dateValue === 'string') {
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}`;
    }
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export default function BoardListPage() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);

  // 1. 상태 관리 (정렬, 검색타입, 검색어)
  const [sortType, setSortType] = useState('latest'); // 'latest' | 'popular'
  const [searchType, setSearchType] = useState('title_content'); // 'title_content' | 'title' | 'author'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeKeyword, setActiveKeyword] = useState(''); // 실제 적용된 검색어

  // 2. 검색어 제출 처리
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveKeyword(searchKeyword.trim());
  };

  // 3. 검색어 초기화
  const handleResetSearch = () => {
    setSearchKeyword('');
    setActiveKeyword('');
  };

  // [수정 11/24 조현기] (로딩) 위 맨 위 주석 참고
  //   loadError   : 불러오기 실패 문구 ('' 이면 실패 아님)
  //   reloadCount : [다시 불러오기]를 누를 때마다 1씩 늘림 → 조건이 같아도 다시 요청하게 하려고
  //   응답을 받으면(성공이든 실패든) setLoadedKey(`${requestKey}#${reloadCount}`) → isLoading이 false가 됨
  const requestKey = JSON.stringify([sortType, searchType, activeKeyword]);
  const [loadedKey, setLoadedKey] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const isLoading = loadedKey !== `${requestKey}#${reloadCount}`;

  // 정렬·검색 조건이 바뀔 때 GET /posts 호출
  useEffect(() => {
    const controller = new AbortController();

    const params = { sort: sortType };
    if (activeKeyword) {
      params.search_type = searchType;
      params.keyword = activeKeyword;
    }

    api
      .get('/posts', { params, signal: controller.signal })
      .then(({ data }) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoadError('');
        setLoadedKey(`${requestKey}#${reloadCount}`);
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setLoadError('게시글을 불러오지 못했어요.');
        setLoadedKey(`${requestKey}#${reloadCount}`);
      });

    return () => controller.abort();
  }, [sortType, searchType, activeKeyword, requestKey, reloadCount]);


  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 타이틀 및 헤더 영역 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-ink">커뮤니티</h1>
        {/* 글쓰기 버튼 */}
        {/* [수정 11/24 조현기] 글자 넘침: whitespace-nowrap flex-none → '✏️ 글쓰기'가 한 줄 그대로 */}
        <button
          onClick={() => navigate('/board/new')}
          className="bg-accent hover:bg-accent-dark text-white font-medium px-4 py-2 rounded-pill text-sm flex flex-none items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <span>✏️</span> 글쓰기
        </button>
      </div>

      {/* 정렬 탭 & 검색바 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        {/* 정렬 탭 (BOARD_SORT 상수 기반 동적 렌더링) */}
        <div className="flex gap-2 border-b sm:border-b-0 pb-2 sm:pb-0">
          {BOARD_SORT.map((sort) => (
            <button
              key={sort.value}
              onClick={() => setSortType(sort.value)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                sortType === sort.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>

        {/* 검색 폼 (BOARD_SEARCH_TYPES 상수 기반 동적 렌더링) */}
        {/* [수정 11/24 조현기] 글자 넘침: 좁은 화면에서 버튼이 눌려 글자가 쪼개지던 것 → 버튼은 whitespace-nowrap flex-none(줄바꿈 · 줄어듦 없음), 입력칸은 min-w-0(남는 만큼만) */}
        {/*   원래 휴대폰 폭(390px 이하)에서 검색칸이 기본 폭을 고집해 [검색] 버튼이 '검/색'으로 쪼개지고 화면이 옆으로 밀렸음 */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="flex-none border rounded-pill px-2.5 py-1.5 text-sm bg-white text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {BOARD_SEARCH_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="min-w-0 border rounded-pill px-3 py-1.5 text-sm flex-1 sm:w-48 border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="flex-none whitespace-nowrap bg-accent text-white px-3.5 py-1.5 rounded-pill text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            검색
          </button>
        </form>
      </div>

      {/* 게시글 목록 영역 */}
      {isLoading ? (
        // [수정 11/24 조현기] (로딩) 불러오는 동안 회색 자리 줄 5개 (animate-pulse: 깜빡이는 효과)
        <div role="status" aria-label="게시글을 불러오는 중" className="divide-y divide-line rounded-card bg-surface px-4 shadow-card">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 py-5 animate-pulse" aria-hidden="true">
              <div className="h-5 w-2/3 rounded-pill bg-gray-100" />
              <div className="h-4 w-1/3 rounded-pill bg-gray-100" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="py-16 text-center rounded-card bg-surface shadow-card my-6">
          <p role="alert" className="text-gray-500 font-medium mb-3">{loadError}</p>
          <button
            onClick={() => setReloadCount((n) => n + 1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-pill text-sm hover:bg-gray-300 transition-colors"
          >
            다시 불러오기
          </button>
        </div>
      ) : posts.length === 0 ? (
        // 빈 화면 처리 (글이 없거나 검색 결과가 없을 때)
        <div className="py-16 text-center rounded-card bg-surface shadow-card my-6">
          {activeKeyword ? (
            <>
              <p className="text-gray-500 font-medium mb-3">검색 결과가 없습니다.</p>
              <button
                onClick={handleResetSearch}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-pill text-sm hover:bg-gray-300 transition-colors"
              >
                검색 초기화
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium mb-3">등록된 게시글이 없습니다.</p>
              <button
                onClick={() => navigate('/board/new')}
                className="px-4 py-2 bg-accent text-white rounded-pill text-sm hover:bg-accent-dark transition-colors"
              >
                글쓰기
              </button>
            </>
          )}
        </div>
      ) : (
        // 게시글 리스트
        <div className="divide-y divide-line rounded-card bg-surface px-4 shadow-card">
          {posts.map((post) => (
            <div
              key={post.post_id}
              onClick={() => navigate(`/board/${post.post_id}`)}
              className="py-4 flex justify-between items-center gap-4 cursor-pointer hover:bg-gray-50 px-2 transition-colors rounded-md"
            >
              {/* 왼쪽: 게시글 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  {/* 게시글 제목 */}
                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    {post.title}
                  </h2>
                </div>

                {/* 메타 정보: 작성자 | 작성일 | 좋아요 | 댓글 */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{post.nickname || '익명'}</span>
                  <span>{formatBoardDate(post.created_at)}</span>
                  <span className="flex items-center gap-0.5 text-miss font-medium">
                    ♡ {post.like_count || 0}
                  </span>
                  <span className="flex items-center gap-0.5 text-have font-medium">
                    💬 {post.comment_count || (post.comments ? post.comments.length : 0)}
                  </span>
                </div>
              </div>

              {/* 오른쪽: 대표 이미지 (있는 경우만) */}
              {post.images && post.images.length > 0 && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={post.images[0].image_url || post.images[0]}
                    alt="게시글 대표 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}