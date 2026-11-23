// 담당: 임유빈
// 커뮤니티 게시물 작성 페이지 [아직 수정중]
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 작성 · 사진 · 레시피 연결 로직은 그대로
//   1. 작성 폼 · 레시피 검색 창: 흰 둥근 카드(rounded-card · shadow-card)
//   2. 등록 버튼: 검정 → 포인트색(accent), 버튼 · 한 줄 입력칸은 알약 모양(rounded-pill)
//   3. 필수(*) · 연결 해제 글씨: 빨강 → 시안 색(miss), 입력칸 포커스 테두리는 포인트색
//   4. 회색(gray) 클래스는 그대로 둠 — index.css에서 따뜻한 회색으로 바뀌어 있음
// 후기작성 경로 [아직 수정/작성중..]
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../api'; 
import { BOARD_TITLE_MAX, BOARD_CONTENT_MAX, BOARD_IMAGE_MAX_COUNT, IMAGE_MAX_MB } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export default function BoardFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // id가 있으면 수정 모드
  const isEditMode = Boolean(id);
  const { isAuthenticated } = useAuth();

  // 레시피 상세페이지에서 넘어온 연결 레시피 데이터 확인
  const passedRecipe = location.state?.linkedRecipe;

  // 폼 입력 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]); // 이미지 URL 배열
  const [linkedRecipe, setLinkedRecipe] = useState(passedRecipe || null); // 선택된 레시피 (선택 1개)
 
  // 레시피 검색 모달 오픈 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isLoadingPost, setIsLoadingPost] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

useEffect(() => {
  if (isEditMode) {
    const controller = new AbortController();

    api
      .get(`/posts/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        setTitle(data.title || '');
        setContent(data.content || '');
        const loadedImages = Array.isArray(data.images)
          ? data.images.map((img) => (typeof img === 'string' ? img : img.image_url)).filter(Boolean)
          : [];

        setImages(loadedImages);
        setLinkedRecipe(data.linked_recipe || null);
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        alert('존재하지 않거나 이미 삭제된 게시글입니다.');
        navigate('/board', { replace: true });
      });

    return () => controller.abort();

  }
}, [id, isEditMode, navigate]);

const isValid = title.trim() !== '' && content.trim() !== '' && !isSubmitting;

  // 이미지 추가 핸들러 (최대 5장 제한(가안))
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > BOARD_IMAGE_MAX_COUNT) {
      alert(`사진은 최대 ${BOARD_IMAGE_MAX_COUNT}장까지 업로드할 수 있습니다.`);
      return;
    }

    const newImageUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newImageUrls]);
  };
  
  // 이미지 삭제
  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // 취소 / 뒤로가기 버튼 처리
  const handleCancel = () => {
    if ((title.trim() || content.trim() || images.length > 0) && !window.confirm('작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?')) {
      return;
    }
    navigate(-1);
  };
 
  // 등록 및 수정 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    if (!isAuthenticated) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        images,
      };

      const { data } = isEditMode
        ? await api.patch(`/posts/${id}`, payload)
        : await api.post('/posts', payload);

      alert(isEditMode ? '수정이 완료되었습니다.' : '게시글이 등록되었습니다.');
      navigate(`/board/${data.post_id}`);

    } catch (err) {
      alert(isEditMode ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다.');

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      <h1 className="text-3xl font-black text-ink mb-6">
        {isEditMode ? '게시글 수정' : '커뮤니티 글쓰기'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-card shadow-card">
        
        {/* 1. 제목 입력 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-gray-700">
              제목 <span className="text-miss">*</span>
            </label>
            <span className="text-xs text-gray-400">{title.length} / {BOARD_TITLE_MAX}자</span>
          </div>
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            maxLength={BOARD_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-pill px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent border-gray-300"
          />
        </div>

        {/* 2. 본문 입력 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-gray-700">
              본문 <span className="text-miss">*</span>
            </label>
            <span className="text-xs text-gray-400">{content.length} / {BOARD_CONTENT_MAX}자</span>
          </div>
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            maxLength={BOARD_CONTENT_MAX}
            rows={8}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded-lg p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent border-gray-300"
          />
        </div>

        {/* 3. 사진 첨부 (최대 5장) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            사진 첨부 (선택 · 최대 {BOARD_IMAGE_MAX_COUNT}장 · 장당 {IMAGE_MAX_MB}MB · JPG, PNG, WEBP)
          </label>
          <div className="flex flex-wrap gap-3 items-center mt-2">
            {images.map((imgUrl, index) => (
              <div key={index} className="relative w-20 h-20 border rounded-lg overflow-hidden bg-gray-100">
                <img src={imgUrl} alt={`업로드 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                {index === 0 && (
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    대표
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-black"
                >
                  ✕
                </button>
              </div>
            ))}

            {images.length < BOARD_IMAGE_MAX_COUNT && (
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 text-gray-500">
                <span className="text-xl">+</span>
                <span className="text-xs mt-1">추가</span>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* 4. 관련 레시피 연결 (선택 1개) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            관련 레시피 (선택 1개)
          </label>
          {linkedRecipe ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden shrink-0">
                  <img src={linkedRecipe.image_url || 'https://placehold.co/100'} alt="레시피" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{linkedRecipe.recipe_title}</p>
                  <p className="text-xs text-gray-500">{linkedRecipe.nickname} · {linkedRecipe.cooking_time}분 · {linkedRecipe.level}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkedRecipe(null)}
                className="text-xs text-miss hover:underline font-medium"
              >
                연결 해제
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-pill hover:bg-gray-200 transition-colors"
            >
              🔍 레시피 검색 및 연결
            </button>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-pill text-sm hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="px-5 py-2.5 bg-accent text-white font-medium rounded-pill text-sm hover:bg-accent-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isEditMode ? '저장하기' : '등록하기'}
          </button>
        </div>

      </form>

      {isModalOpen && (
        <RecipeSearchModal
          onClose={() => setIsModalOpen(false)}
          onSelect={(recipe) => {
            setLinkedRecipe(recipe);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 팝업(모달) 서브 컴포넌트 [API 변경] mockRecipes 대신 GET /recipes?keyword=... 호출
// ----------------------------------------------------------------------
function RecipeSearchModal({ onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    api
      .get('/recipes', { params: { keyword: trimmed}, signal: controller.signal })
      .then(({ data }) => setResults(data))
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setResults([]);
      });

    return () => controller.abort();
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* 모달 창 본체 */}
      <div className="bg-white w-full max-w-lg rounded-card shadow-card overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">레시피 검색 및 연결</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* 상단 검색 입력창 */}
        <div className="p-4 border-b bg-gray-50">
          <input
            type="text"
            placeholder="연결하실 레시피 제목을 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full border rounded-pill px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent border-gray-300 bg-white"
          />
        </div>

        {/* 검색 결과 영역 (스크롤 지원) */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {searchTerm.trim() === '' ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              검색어를 입력하면 일치하는 레시피가 자동으로 표시됩니다.
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              검색 결과가 없습니다.
            </div>
          ) : (
            results.map((recipe) => (
              <div
                key={recipe.recipe_id}
                onClick={() => onSelect(recipe)}
                className="flex items-center justify-between p-3 rounded-[20px] hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                    <img src={recipe.image_url || 'https://placehold.co/100'} alt={recipe.recipe_title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{recipe.recipe_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{recipe.nickname} · {recipe.cooking_time}분 · {recipe.level}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-pill">
                  선택
                </span>
              </div>
            ))
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-pill hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}