// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 사진 · 닉네임 검사 로직은 그대로
//   1. 위: 둥근 프로필 사진(120px) + 사진 변경 · 삭제 알약 버튼
//   2. 이메일 · 닉네임: 라벨 위 · 값 아래, 입력칸 최대 400px
//   3. 변경하기 = 포인트색, 취소 = 회색 / 오류는 연한 빨간 상자

// [수정 11/24 조현기] '변경하기'가 실제로 닉네임을 저장 (원래는 'DB 연결 후 제공 예정' 알림만 띄웠음)
//   흐름: 글자 수 확인(원래 코드) → PATCH /users/me { nickname } → 성공하면 setUser(새 내 정보) + 초록 안내
//   - 다른 사람과 겹치는 닉네임이면 서버가 400 "이미 사용 중인 닉네임입니다." → 빨간 상자에 그대로 표시
//   - setUser: AuthContext의 로그인 정보를 바꿈 → 위 메뉴 · 마이페이지 왼쪽 프로필도 바로 새 닉네임
// [수정 11/24 조현기 2차] 프로필 사진도 저장
//   원래: FileReader로 사진을 긴 글자(data:…)로 바꿔 미리보기만 하고 저장하지 않았음
//         + 화면은 profile_image_url이라는 이름을 썼는데 DB · 서버 이름은 profile_image라서 저장해도 못 읽었음
//   지금: ① 사진을 고르면 바로 서버에 올림(uploadImage → POST /images) → 돌려받은 주소로 미리보기
//         ② '변경하기'를 누르면 PATCH /users/me { nickname, profile_image } 로 닉네임과 사진 주소를 같이 저장
//         ③ '사진 삭제' 후 저장하면 profile_image: null → 사진 없음(닉네임 첫 글자 동그라미)
//         이름은 모두 DB 그대로 profile_image (MyPage 왼쪽 · 위 메뉴 동그라미도 같은 이름으로 읽음)
import { useRef, useState } from 'react';   // [수정 11/24 조현기 2차] useEffect는 FileReader 정리용이라 뺌
import { IMAGE_MAX_MB, IMAGE_TYPES, NICKNAME_MAX, NICKNAME_MIN } from '../../constants';
import api, { uploadImage } from '../../api';   // [수정 11/24 조현기 2차] uploadImage: 사진 올리기
import { useAuth } from '../../contexts/AuthContext';

function ProfileEditor({ user }) {
  // 사용자 데이터는 부모의 user props로 전달받음. 조회 API는 부모·AuthContext에서 연결
  // 입력 상태·검증·이미지 미리보기는 DB 연결 후에도 사용
  const [formData, setFormData] = useState({
    nickname: user?.nickname ?? '',
    profile_image: user?.profile_image ?? null,   // [수정 11/24 조현기 2차] profile_image_url → profile_image (DB 이름)
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isReading, setIsReading] = useState(false);   // [수정 11/24 조현기 2차] 지금은 '사진 올리는 중'이라는 뜻으로 씀
  const [isSaving, setIsSaving] = useState(false);   // [수정 11/24 조현기] 저장 중이면 true → 버튼 잠금 (두 번 눌러 두 번 저장되는 것 막기)
  const { setUser } = useAuth();                     // [수정 11/24 조현기] 저장 후 로그인 정보(user)를 새 값으로 바꾸는 함수
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setMessage('');
  };

  // [수정 11/24 조현기 2차] async: 사진을 서버에 올리고 기다려야 해서
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setMessage('');
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('JPG, PNG, WEBP 사진만 선택할 수 있습니다.');
      return;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setError(`사진은 ${IMAGE_MAX_MB}MB 이하로 선택해 주세요.`);
      return;
    }

    // [수정 11/24 조현기 2차] 원래: FileReader로 미리보기만 (mock) → 지금: 서버에 올리고 진짜 주소로 미리보기
    //   아직 저장 전이라 '변경하기'를 눌러야 내 정보에 들어감 (취소하면 원래 사진으로)
    setError('');
    setIsReading(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, profile_image: url }));
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : '사진을 올리지 못했습니다. 다시 선택해 주세요.');
    } finally {
      setIsReading(false);
    }
  };

  // [수정 11/24 조현기 2차] 사진 삭제: 미리보기에서 빼고, '변경하기'를 누르면 profile_image: null로 저장
  const handleImageDelete = () => {
    setFormData((prev) => ({ ...prev, profile_image: null }));
    setError('');
    setMessage('');
  };

  // 프로필 변경
  // [수정 11/24 조현기] 알림창만 띄우던 것 → 닉네임 저장 API 요청 (async: 서버 응답을 기다려야 해서)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReading || isSaving || !user) return;
    const nickname = formData.nickname.trim();
    if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
      setError(`닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}글자로 입력해 주세요.`);
      return;
    }

    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      // [수정 11/24 조현기 2차] 닉네임 + 사진 주소를 같이 저장 (사진이 없으면 null → 사진 지움)
      const { data } = await api.patch('/users/me', { nickname, profile_image: formData.profile_image });
      setUser(data);
      setMessage('프로필을 저장했어요.');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  //  저장 전 입력만 원래 값으로 복원
  const handleCancel = () => {
    setFormData({
      nickname: user.nickname,
      profile_image: user.profile_image ?? null,   // [수정 11/24 조현기 2차] 저장된 사진으로 되돌림
    });
    setError('');
    setMessage('');
  };

  // ③ 로그인 확인 및 화면 출력
  if (!user) {
    return <p className="text-muted">로그인 후 이용해 주세요.</p>;
  }

  return (
    <section>
      <h2 className="text-xl font-black">프로필 수정</h2>
      <form onSubmit={handleSubmit} className="mt-6 flex max-w-[400px] flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          {formData.profile_image ? (
            <img src={formData.profile_image} alt="프로필 미리보기"
              width={120} height={120} className="h-[120px] w-[120px] rounded-full object-cover" />
          ) : <p className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gray-100 p-4 text-center text-xs text-muted">프로필 사진이 없습니다.</p>}
          <input ref={fileInputRef} type="file" accept={IMAGE_TYPES.join(',')}
            aria-label="프로필 사진 선택" onChange={handleImageChange} hidden />
          <button type="button" className="h-10 rounded-pill bg-gray-100 px-4 text-sm font-medium hover:bg-gray-200 disabled:opacity-40" onClick={() => fileInputRef.current.click()}>사진 변경</button>
          <button type="button" className="h-10 rounded-pill bg-gray-100 px-4 text-sm font-medium hover:bg-gray-200 disabled:opacity-40" onClick={handleImageDelete}
            disabled={!formData.profile_image && !isReading}>사진 삭제</button>
          {isReading && <p role="status" className="w-full text-sm text-muted">사진을 올리는 중입니다.</p>}
        </div>

        <div className="flex flex-col gap-1">
          <strong className="text-sm">이메일</strong>
          <p className="text-muted">{user.email}</p>
        </div>

        <label htmlFor="profile-nickname" className="-mb-3 text-sm font-bold">닉네임</label>
        <input id="profile-nickname" name="nickname" value={formData.nickname}
          maxLength={NICKNAME_MAX} onChange={handleChange} required className="h-12" />
        {error && <p role="alert" className="rounded-[16px] bg-miss-soft px-4 py-3 text-sm text-miss">{error}</p>}
        {message && <p role="status" className="text-sm text-have">{message}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={isReading || isSaving} className="h-12 rounded-pill bg-accent px-6 font-bold text-white hover:bg-accent-dark disabled:opacity-40">변경하기</button>
          <button type="button" onClick={handleCancel} className="h-12 rounded-pill bg-gray-100 px-6 font-medium hover:bg-gray-200">취소</button>
        </div>
      </form>
    </section>
  );
}

export default ProfileEditor;
