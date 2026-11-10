// 담당: 임유빈
// 커뮤니티 게시물 작성 페이지 [임시코드 - 아직 수정중]
// 후기작성 경로 [수정중]
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { mockPosts, mockRecipes } from '../mockData';
import { BOARD_TITLE_MAX, BOARD_CONTENT_MAX, BOARD_IMAGE_MAX_COUNT, IMAGE_MAX_MB } from '../constants';

export default function BoardFormPage({ posts = mockPosts, onSavePost }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // id가 있으면 수정 모드
  const isEditMode = Boolean(id);

  // 레시피 상세페이지에서 넘어온 연결 레시피 데이터 확인
  const passedRecipe = location.state?.linkedRecipe;

  // 폼 입력 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]); // 이미지 URL 배열
  const [linkedRecipe, setLinkedRecipe] = useState(passedRecipe || null); // 선택된 레시피 (선택 1개)
  
  // 레시피 검색 모달 오픈 상태
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 수정 모드일 경우 기존 데이터 불러오기
  useEffect(() => {
    if (isEditMode) {
      const targetPost = posts.find((p) => String(p.post_id) === String(id));
      if (targetPost) {
        setTitle(targetPost.title || '');
        setContent(targetPost.content || '');
        setImages(targetPost.images || []);
        setLinkedRecipe(targetPost.linked_recipe || null);
      }
    }
  }, [id, isEditMode, posts]);

  // 필수 조건 충족 여부 (제목, 본문 공백 불가)
  const isValid = title.trim() !== '' && content.trim() !== '';

  // 이미지 추가 핸들러 (최대 5장 제한)
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
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const postData = {
      post_id: isEditMode ? Number(id) : Date.now(),
      title: title.trim(),
      content: content.trim(),
      images: images.map((url, idx) => ({
        image_id: idx + 1,
        image_url: url,
        image_order: idx + 1,
      })),
      linked_recipe: linkedRecipe,
      nickname: '효정', // 현재 로그인 유저 기준
      created_at: isEditMode ? undefined : '방금 전',
      is_edited: isEditMode ? true : undefined,
    };

    if (onSavePost) {
      onSavePost(postData, isEditMode);
    }

    alert(isEditMode ? '수정이 완료되었습니다.' : '게시글이 등록되었습니다.');
    navigate(isEditMode ? `/board/${id}` : '/board');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? '게시글 수정' : '커뮤니티 글쓰기'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        
        {/* 1. 제목 입력 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-gray-700">
              제목 <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-gray-400">{title.length} / {BOARD_TITLE_MAX}자</span>
          </div>
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            maxLength={BOARD_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-300"
          />
        </div>

        {/* 2. 본문 입력 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-gray-700">
              본문 <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-gray-400">{content.length} / {BOARD_CONTENT_MAX}자</span>
          </div>
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            maxLength={BOARD_CONTENT_MAX}
            rows={8}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded-lg p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-300"
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
                className="text-xs text-red-500 hover:underline font-medium"
              >
                연결 해제
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
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
            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isEditMode ? '저장하기' : '등록하기'}
          </button>
        </div>

      </form>

      {/* 5. 레시피 검색 모달 (배경 딤 처리 + 스크롤 지원 + 제목 실시간 자동 검색) */}
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
// 팝업(모달) 서브 컴포넌트
// ----------------------------------------------------------------------
function RecipeSearchModal({ onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  // 검색어(recipe_title 기준)에 일치하는 레시피 필터링
  // 검색어가 없으면([]) 아무것도 안 뜨도록 설정
  const filteredRecipes = searchTerm.trim() === '' 
    ? [] 
    : mockRecipes.filter((r) => r.recipe_title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* 모달 창 본체 */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        
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
            placeholder="레시피 제목을 입력하세요 (예: 두부조림, 계란볶음밥)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 border-gray-300 bg-white"
          />
        </div>

        {/* 검색 결과 영역 (스크롤 지원) */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {searchTerm.trim() === '' ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              검색어를 입력하면 일치하는 레시피가 자동으로 표시됩니다.
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              검색 결과가 없습니다.
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
              <div
                key={recipe.recipe_id}
                onClick={() => onSelect(recipe)}
                className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
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
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
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
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}