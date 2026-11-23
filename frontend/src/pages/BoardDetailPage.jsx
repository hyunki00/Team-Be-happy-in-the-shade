// 담당: 임유빈
// 커뮤니티 게시물 상세페이지 [아직 수정중] -
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 좋아요 · 댓글 로직은 그대로
//   1. 본문 상자: 흰 둥근 카드(rounded-card · shadow-card), 관련 레시피 · 댓글 상자는 둥근 회색 상자
//   2. 댓글 등록 · 저장 등 주요 버튼: 검정 → 포인트색(accent), 버튼 · 입력칸은 알약 모양(rounded-pill)
//   3. 좋아요 누른 상태 · 삭제 글씨: 빨강 → 시안 색(miss), 입력칸 포커스 테두리는 포인트색
//   4. 회색(gray) 클래스는 그대로 둠 — index.css에서 따뜻한 회색으로 바뀌어 있음

import React, { useState, useEffect } from 'react'; // [API 변경] useEffect 추가
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api'; // [API 변경] mockPosts, mockPostComments 제거 후 공통 api 사용
import { useAuth } from '../contexts/AuthContext';
import { COMMENT_MAX } from '../constants';

export default function BoardDetailPage({ onDeletePost }) { // [API 변경] posts = mockPosts 기본값 제거
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // [API 변경] 초기값을 null / []로 두고 useEffect에서 API로 채움

  const [post, setPost] = useState(null);


  const [comments, setComments] = useState([]);




  // 사진 슬라이드 인덱스 상태
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 댓글 입력 상태
  const [newComment, setNewComment] = useState('');

  // 댓글 수정 상태 (pc_id : 수정 중인 텍스트)
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  // [API 추가] 게시글 상세 + 댓글 목록 불러오기
  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      api.get(`/posts/${id}`, { signal: controller.signal }),
      api.get(`/posts/${id}/comments`, { signal: controller.signal }),
    ])
      .then(([postRes, commentRes]) => {
        setPost(postRes.data);
        setComments(commentRes.data);
        setCurrentImageIndex(0);
      })
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') {
          setPost(null);
        }
      });

    return () => controller.abort();
  }, [id]);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <p className="text-gray-500 mb-4">삭제되었거나 확인할 수 없는 게시글입니다.</p>
        <button
          onClick={() => navigate('/board')}
          className="px-4 py-2 bg-accent text-white rounded-pill text-sm hover:bg-accent-dark transition-colors"
        >
          목록으로
        </button>
      </div>
    );
  }

  // [API 변경] 좋아요 추가(POST) / 취소(DELETE) API 호출
  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }

    try {
      const { data } = post.is_liked
        ? await api.delete(`/posts/${post.post_id}/likes`)
        : await api.post(`/posts/${post.post_id}/likes`);
      
      //좋아요 갱신
      setPost((prev) => ({
        ...prev,
        is_liked: data.is_liked,
        like_count: data.like_count,
      }));
    } catch (err) {
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  // [API 변경] 게시글 삭제 API 호출
  const handleDeletePost = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;

    try {
      await api.delete(`/posts/${post.post_id}`);
      if (onDeletePost) {
        onDeletePost(post.post_id);
      }
      navigate('/board');
    } catch (err) {
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  // [API 변경] 댓글 등록 API 호출
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const { data: created } = await api.post(`/posts/${post.post_id}/comments`, {
        pc_content: newComment.trim(),
        pc_image_url: null,
      });
      setComments((prev) => [created, ...prev]);
      setNewComment('');
    } catch (err) {
      alert('댓글 등록에 실패했습니다.');
    }
  };

  // [API 변경] 댓글 삭제 API 호출
  const handleDeleteComment = async (pc_id) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/post-comments/${pc_id}`);
      setComments((prev) => prev.filter((c) => c.pc_id !== pc_id));
    } catch (err) {
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 수정 시작
  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.pc_id);
    setEditText(comment.pc_content);
  };

  // [API 변경] 댓글 수정 API 호출
  const handleSaveEditComment = async (pc_id) => {
    if (!editText.trim()) return;

    try {
      const { data: updated } = await api.patch(`/post-comments/${pc_id}`, {
        pc_content: editText.trim(),
      });
      setComments((prev) => prev.map((c) => (c.pc_id === pc_id ? updated : c)));
      setEditingCommentId(null);
      setEditText('');
    } catch (err) {
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const hasImages = post.images && post.images.length > 0;
  const isMyPost = user && post.user_id === user.user_id;

// 작성시간 표기
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
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 상단 네비게이션 & 수정/삭제 버튼 */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <button
          onClick={() => navigate('/board')}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← 목록으로
        </button>
        {isMyPost && (
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => navigate(`/board/${post.post_id}/edit`)}
              className="text-gray-600 hover:text-gray-900"
            >
              수정
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDeletePost}
              className="text-miss hover:text-miss"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 시안 C 메인 레이아웃 (사진 유무에 따라 분기) */}
      <div className={`grid grid-cols-1 ${hasImages ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 bg-white border rounded-xl overflow-hidden shadow-sm`}>

        {/* 왼쪽: 사진 영역 (mockData의 image_url 속성 사용) */}
        {hasImages && (
          <div className="bg-gray-100 flex flex-col justify-center items-center relative min-h-[350px] lg:min-h-[550px]">
            <img
              src={post.images[currentImageIndex].image_url|| post.images[currentImageIndex]}
              alt="게시글 이미지"
              className="w-full h-full max-h-[600px] object-contain"
            />
            {post.images.length > 1 && (
              <div className="absolute inset-x-4 flex justify-between items-center">
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev === 0 ? post.images.length - 1 : prev - 1))
                  }
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev === post.images.length - 1 ? 0 : prev + 1))
                  }
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  ›
                </button>
              </div>
            )}
            <div className="absolute bottom-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              {currentImageIndex + 1} / {post.images.length}
            </div>
          </div>
        )}

        {/* 오른쪽 (또는 단독): 본문 및 댓글 영역 */}
        <div className="flex flex-col h-full p-6 lg:p-8">

          {/* 게시글 정보 및 본문 헤더 */}
          <div className="border-b pb-6 mb-6">
            <h1 className="text-3xl font-black text-ink mb-3">{post.title}</h1>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{post.nickname}</span>
              <span>{formatBoardDate(post.created_at)}</span>
            </div>
          </div>

          {/* 본문 내용 */}
          <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap mb-8 flex-1 min-h-[120px]">
            {post.content}
          </div>

          {/* 관련 레시피 박스 클릭 시 해당 레시피 상세 페이지로 이동 */}
          {post.linked_recipe && (
            <div
              onClick={() => navigate(`/recipe/${post.linked_recipe.recipe_id}`)}
              className="mb-6 p-4 bg-gray-50 rounded-[20px] flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                  <img src={post.linked_recipe.image_url || 'https://placehold.co/100'} alt="레시피" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium">관련 레시피</span>
                  <p className="text-sm font-bold text-gray-900">{post.linked_recipe.recipe_title}</p>
                  <p className="text-xs text-gray-500">{post.linked_recipe.nickname} · {post.linked_recipe.cooking_time}분 · {post.linked_recipe.level}</p>
                </div>
              </div>
            </div>
          )}

          {/* 좋아요 버튼 영역 */}
          <div className="flex justify-center pb-6 border-b">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm font-semibold transition-all ${
                post.is_liked
                  ? 'bg-miss-soft border-miss-soft text-miss shadow-sm'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{post.is_liked ? '♥' : '♡'}</span>
              <span>좋아요 {post.like_count}</span>
            </button>
          </div>

          {/* 댓글 섹션 */}
          <div className="pt-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              댓글 ({comments.length})
            </h3>

            {/* 댓글 입력 폼 */}
            <form onSubmit={handleAddComment} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder={isAuthenticated ? "댓글을 입력하세요 (최대 500자)" : "로그인 후 댓글을 남겨보세요"}
                value={newComment}
                maxLength={COMMENT_MAX}
                disabled={!isAuthenticated}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 border rounded-pill px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-100"
              />
              {/* 실시간 댓글 글자수 카운터 / 제한 수  추가*/}
              <span className="text-xs text-gray-400">
                {newComment.length} / {COMMENT_MAX}자
              </span>
              <button
                type="submit"
                disabled={!isAuthenticated || !newComment.trim()}
                className="bg-accent text-white px-4 py-2 rounded-pill text-sm font-medium hover:bg-accent-dark transition-colors disabled:bg-gray-300"
              >
                등록
              </button>
            </form>

            {/* 댓글 목록 (스크롤 영역) */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {comments.length > 0 ? (
                comments.map((c) => {
                  return (
                    <div key={c.pc_id} className="p-3 bg-gray-50 rounded-[16px] text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-800">{c.nickname}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatBoardDate(c.created_at)}</span>

                          {/* 💡 본인 댓글이고, 현재 수정 중이 아닐 때 항상 노출되도록 수정 */}
                          {user && c.user_id === user.user_id && editingCommentId !== c.pc_id && (
                            <div className="flex gap-1.5 ml-2">
                              <button
                                onClick={() => handleStartEditComment(c)}
                                className="text-gray-500 hover:text-gray-800 font-medium underline"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c.pc_id)}
                                className="text-miss hover:text-miss font-medium underline"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                          {/* 댓글 수정 모드 vs 일반 보기 모드 */}
                      {editingCommentId === c.pc_id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editText}
                            maxLength={COMMENT_MAX}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            rows="2"
                          />
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs rounded-pill hover:bg-gray-300"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditComment(c.pc_id)}
                              className="px-2.5 py-1 bg-accent text-white text-xs rounded-pill hover:bg-accent-dark"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{c.pc_content}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}