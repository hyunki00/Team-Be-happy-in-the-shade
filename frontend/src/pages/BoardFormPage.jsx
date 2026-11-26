// 담당: 임유빈
// [수정 11/24 조현기] 이 파일에서 바뀐 곳 (자세한 건 코드 안 [수정 11/24] 주석)
//   1) 관련 레시피 저장: 고른 레시피 번호(recipe_id)를 같이 보냄 (원래는 화면에서만 고르고 저장 안 됨)
//      백엔드 posts 테이블에 recipe_id 칸이 생김 → 3_DB수정_중복삭제_게시글레시피연결.sql
//   2) blob: 사진 주소를 DB에 보내지 않음 (2차부터는 5)처럼 진짜 주소로 올라가서 blob:이 생기지 않음. 혹시 남은 것만 거름)
//   3) 수정 화면: 글을 불러오는 동안 빈 폼 대신 '불러오는 중...' (만들어만 두고 안 쓰던 isLoadingPost 사용)
//   4) 린트 오류 5개: 안 쓰는 React import · err, 이펙트 안 setState
//   5) [2차] 사진 저장: 사진을 고르는 즉시 서버(POST /images)에 올리고, 돌려받은 진짜 주소를 images에 넣음
//      → 다시 열어도 사진이 깨지지 않음 (원래는 blob: 임시 주소라 창을 닫으면 깨졌음)
// 커뮤니티 게시물 작성 페이지
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 작성 · 사진 · 레시피 연결 로직은 그대로
//   1. 작성 폼 · 레시피 검색 창: 흰 둥근 카드(rounded-card · shadow-card)
//   2. 등록 버튼: 검정 → 포인트색(accent), 버튼 · 한 줄 입력칸은 알약 모양(rounded-pill)
//   3. 필수(*) · 연결 해제 글씨: 빨강 → 시안 색(miss), 입력칸 포커스 테두리는 포인트색
//   4. 회색(gray) 클래스는 그대로 둠 — index.css에서 따뜻한 회색으로 바뀌어 있음

import { useState, useEffect } from 'react'; // [수정 11/24 조현기] 린트: 안 쓰는 React import 삭제 (React 17 이후 JSX에 필요 없음)
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api, { uploadImage } from '../api';   // [수정 11/24 조현기 2차] uploadImage: 사진 올리기 (api.js)
import { BOARD_TITLE_MAX, BOARD_CONTENT_MAX, BOARD_IMAGE_MAX_COUNT, IMAGE_MAX_MB } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

const SWAL_ACCENT_COLOR = '#C85A32';

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
  const [isUploading, setIsUploading] = useState(false);   // [수정 11/24 조현기 2차] 사진 올리는 중이면 true (그동안 등록 버튼 잠금)

useEffect(() => {
  if (isEditMode) {
    const controller = new AbortController();

    api
      .get(`/posts/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        // [수정 11/24 조현기] 글을 다 받았으면 '불러오는 중' 끝 → 폼을 보여 줌
        //   isLoadingPost는 원래 만들어만 두고 안 쓰던 값 (린트 오류). 수정 화면이면 true로 시작함
        setIsLoadingPost(false);
        setTitle(data.title || '');
        setContent(data.content || '');
        // [수정 11/24 조현기] 예전에 잘못 저장된 blob: 주소는 빼고 불러옴
        //   (이 수정 전에 쓴 글은 blob: 주소가 DB에 들어가 있을 수 있음. 다시 열면 깨진 사진이라 보여 줄 수 없음)
        const loadedImages = Array.isArray(data.images)
          ? data.images.map((img) => (typeof img === 'string' ? img : img.image_url)).filter((url) => url && !url.startsWith('blob:'))
          : [];

        setImages(loadedImages);
        setLinkedRecipe(data.linked_recipe || null);
      })
      .catch(async (err) => {
        if (err.code === 'ERR_CANCELED') return;
        await Swal.fire({
          icon: 'error',
          text: '존재하지 않거나 이미 삭제된 게시글입니다.',
          confirmButtonColor: SWAL_ACCENT_COLOR,
        });
        navigate('/board', { replace: true });
      });

    return () => controller.abort();

  }
}, [id, isEditMode, navigate]);

// [수정 11/24 조현기 2차] 사진을 올리는 중에도 등록 못 하게 (!isUploading) — 다 올라가기 전에 저장하면 사진이 빠짐
const isValid = title.trim() !== '' && content.trim() !== '' && !isSubmitting && !isUploading;

  // 이미지 추가 핸들러 (최대 5장 제한(가안))
  // [수정 11/24 조현기 2차] 사진을 고르면 바로 서버에 올림
  //   원래: URL.createObjectURL(file)로 만든 blob: 임시 주소를 images에 넣음 → 저장 후 다시 열면 깨진 사진
  //   지금: uploadImage(file)로 한 장씩 올리고, 서버가 돌려준 진짜 주소(http://localhost:8044/uploads/…)를 넣음
  //   - async: 서버 응답을 기다려야 해서. 올리는 동안 '사진 올리는 중...' + 등록 버튼 잠금
  //   - 여러 장을 고르면 차례대로 올림. 중간에 실패하면 거기까지 올린 사진은 남기고 알림
  //   - e.target.value = '': 같은 사진을 지웠다가 다시 골라도 onChange가 다시 불리게 입력칸을 비움
const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (images.length + files.length > BOARD_IMAGE_MAX_COUNT) {
      await Swal.fire({
        icon: 'warning',
        text: `사진은 최대 ${BOARD_IMAGE_MAX_COUNT}장까지 업로드할 수 있습니다.`,
        confirmButtonColor: SWAL_ACCENT_COLOR,
      });
      return;
    }

    setIsUploading(true);
    try {
      for (const file of files) {
        const url = await uploadImage(file);
        setImages((prev) => [...prev, url]);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      await Swal.fire({
        icon: 'error',
        text: typeof detail === 'string' ? detail : '사진을 올리지 못했습니다. 잠시 후 다시 시도해 주세요.',
        confirmButtonColor: SWAL_ACCENT_COLOR,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // 취소 / 뒤로가기 버튼 처리
  const handleCancel = async () => {
    if (title.trim() || content.trim() || images.length > 0) {
      const result = await Swal.fire({
        icon: 'warning',
        text: '작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?',
        showCancelButton: true,
        confirmButtonText: '나가기',
        cancelButtonText: '계속 작성',
        confirmButtonColor: SWAL_ACCENT_COLOR,
      });
      if (!result.isConfirmed) return;
    }
    navigate(-1);
  };
 
  // 등록 및 수정 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    if (!isAuthenticated) {
      await Swal.fire({
        icon: 'info',
        text: '로그인이 필요한 서비스입니다.',
        confirmButtonColor: SWAL_ACCENT_COLOR,
      });
      navigate('/login', { state: { from: location.pathname } });   // [수정 11/24 조현기] 로그인하면 이 글쓰기 화면으로 돌아옴
      return;
    }

    setIsSubmitting(true);
    try {
      // [수정 11/24 조현기] 사진 주소 중 blob:으로 시작하는 것은 보내지 않음
      //   blob: 주소란? 사진을 고르면 URL.createObjectURL(file)이 만드는 '미리보기용 임시 주소'
      //     (blob:http://localhost:5173/…). 이 브라우저 · 이 창에서만 보이고, DB에 저장하면 다른 사람에겐 깨진 사진
      //   → 서버에는 blob:이 아닌 주소만 보냄
      //   [2차] 이제는 사진을 고를 때 바로 서버에 올려서(handleImageChange) images에 진짜 주소만 들어감
      //         이 거르기는 혹시 남은 blob: 주소를 막는 안전장치
      //   recipe_id: 고른 관련 레시피 번호. 안 골랐거나 ✕로 뺐으면 null → 서버가 연결을 비움
      const payload = {
        title: title.trim(),
        content: content.trim(),
        images: images.filter((url) => !url.startsWith('blob:')),
        recipe_id: linkedRecipe?.recipe_id ?? null,   // [수정 11/24 조현기] 관련 레시피 번호 (?. : linkedRecipe가 null이어도 오류 없이 undefined → ?? null)
      };

      const { data } = isEditMode
        ? await api.patch(`/posts/${id}`, payload)
        : await api.post('/posts', payload);

      await Swal.fire({
        icon: 'success',
        text: isEditMode ? '수정이 완료되었습니다.' : '게시글이 등록되었습니다.',
        confirmButtonColor: SWAL_ACCENT_COLOR,
      });
      navigate(`/board/${data.post_id}`);

    } catch {   // [수정 11/24 조현기] 린트(no-unused-vars): catch (err)의 err를 안 써서 삭제
      await Swal.fire({
        icon: 'error',
        text: isEditMode ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다.',
        confirmButtonColor: SWAL_ACCENT_COLOR,
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // [수정 11/24 조현기] 수정 화면: 글을 불러오는 동안 빈 폼 대신 안내
  //   원래는 빈 폼이 먼저 보였다가 제목 · 내용이 뒤늦게 채워졌음. 새 글 쓰기는 isLoadingPost가 처음부터 false라 바로 폼
  if (isLoadingPost) {
    return <p role="status" className="max-w-3xl mx-auto py-16 text-center text-muted">게시글을 불러오는 중...</p>;
  }

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

            {/* [수정 11/24 조현기 2차] 사진을 올리는 동안 안내 (원래 있던 '미리보기만 돼요' 안내는 사진이 저장되니 뺌) */}
            {isUploading && (
              <p role="status" className="basis-full text-xs text-muted">사진 올리는 중...</p>
            )}
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
    // [수정 11/24 조현기] 린트(set-state-in-effect): 이펙트 안에서 바로 setResults([]) 하던 줄 삭제
    //   검색어가 비어 있으면 아래 화면이 결과 목록 대신 '검색어를 입력하면…' 안내를 보여 줌
    //   → results에 예전 결과가 남아 있어도 화면에 안 나오므로 비울 필요가 없음
    if (!trimmed) {
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