// 담당: 임유빈 
// 커뮤니티 게시물 목록 페이지 [임시코드 - 아직 수정중]
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 검색 · 정렬 · 목록 로직은 그대로
//   1. 글쓰기 · 검색 등 주요 버튼: 검정 → 포인트색(accent), 버튼 · 입력칸은 알약 모양(rounded-pill)
//   2. 게시글 목록 · 빈 목록 안내: 흰 둥근 카드(rounded-card · shadow-card)
//   3. 빨강 · 파랑 글씨 → 시안 색(miss · have), 입력칸 포커스 테두리는 포인트색
//   4. 회색(gray) 클래스는 그대로 둠 — index.css에서 따뜻한 회색으로 바뀌어 있음

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BOARD_SORT, BOARD_SEARCH_TYPES } from '../constants';
import { mockPosts } from '../mockData';

export default function BoardListPage({ posts = mockPosts }) {
  const navigate = useNavigate();

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

  // 4. 필터링 및 정렬 로직
  const filteredPosts = posts
    .filter((post) => {
      if (!activeKeyword) return true;
      if (searchType === 'title') {
        return post.title?.toLowerCase().includes(activeKeyword.toLowerCase());
      }
      if (searchType === 'author') {
        return post.nickname?.toLowerCase().includes(activeKeyword.toLowerCase());
      }
      // title_content (제목 + 본문)
      return (
        post.title?.toLowerCase().includes(activeKeyword.toLowerCase()) ||
        post.content?.toLowerCase().includes(activeKeyword.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortType === 'popular') {
        // 인기순: 좋아요 높은 순, 같으면 최신순 (post_id 내림차순)
        if (b.like_count === a.like_count) {
          return b.post_id - a.post_id;
        }
        return (b.like_count || 0) - (a.like_count || 0);
      }
      // 최신순 (post_id 내림차순)
      return b.post_id - a.post_id;
    });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 타이틀 및 헤더 영역 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-ink">커뮤니티</h1>
        {/* 글쓰기 버튼 */}
        <button
          onClick={() => navigate('/board/new')}
          className="bg-accent hover:bg-accent-dark text-white font-medium px-4 py-2 rounded-pill text-sm flex items-center gap-1.5 transition-colors"
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
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="border rounded-pill px-2.5 py-1.5 text-sm bg-white text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
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
            className="border rounded-pill px-3 py-1.5 text-sm flex-1 sm:w-48 border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="bg-accent text-white px-3.5 py-1.5 rounded-pill text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            검색
          </button>
        </form>
      </div>

      {/* 게시글 목록 영역 */}
      {filteredPosts.length === 0 ? (
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
          {filteredPosts.map((post) => (
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

                {/* 메타 정보: 작성자 | 작성일 | 조회수 | 좋아요 | 댓글 */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{post.nickname || '익명'}</span>
                  <span>{post.created_at || '방금 전'}</span>                  
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