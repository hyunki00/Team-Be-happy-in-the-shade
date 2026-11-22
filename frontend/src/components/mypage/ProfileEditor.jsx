// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 사진 · 닉네임 검사 로직은 그대로
//   1. 위: 둥근 프로필 사진(120px) + 사진 변경 · 삭제 알약 버튼
//   2. 이메일 · 닉네임: 라벨 위 · 값 아래, 입력칸 최대 400px
//   3. 변경하기 = 포인트색, 취소 = 회색 / 오류는 연한 빨간 상자

import { useEffect, useRef, useState } from 'react';
import { IMAGE_MAX_MB, IMAGE_TYPES, NICKNAME_MAX, NICKNAME_MIN } from '../../constants';

function ProfileEditor({ user }) {
  // 사용자 데이터는 부모의 user props로 전달받음. 조회 API는 부모·AuthContext에서 연결
  // 입력 상태·검증·이미지 미리보기는 DB 연결 후에도 사용
  const [formData, setFormData] = useState({
    nickname: user?.nickname ?? '',
    profile_image_url: user?.profile_image_url ?? null,
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => () => readerRef.current?.abort(), []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setMessage('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    readerRef.current?.abort();
    setIsReading(false);
    setMessage('');
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('JPG, PNG, WEBP 사진만 선택할 수 있습니다.');
      return;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setError(`사진은 ${IMAGE_MAX_MB}MB 이하로 선택해 주세요.`);
      return;
    }

    // mock에서는 사진을 메모리에 보관한다. 실제 업로드 시 원본 파일을 전송한다.
    const reader = new FileReader();
    readerRef.current = reader;
    setError('');
    setIsReading(true);
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profile_image_url: reader.result }));
      setIsReading(false);
    };
    reader.onerror = () => {
      setError('사진을 읽지 못했습니다. 다시 선택해 주세요.');
      setIsReading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDelete = () => {
    readerRef.current?.abort();
    setIsReading(false);
    setFormData((prev) => ({ ...prev, profile_image_url: null }));
    setError('');
    setMessage('');
  };

  // 프로필 변경: 실제 저장은 DB 연결 후 구현
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReading || !user) return;
    const nickname = formData.nickname.trim();
    if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
      setError(`닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}글자로 입력해 주세요.`);
      return;
    }

    setError('');
    setMessage('');
    // DB구현 후:  사진 업로드·삭제, 프로필 변경 API 요청, 성공 시 사용자 정보 갱신 및 실패 처리
    window.alert('프로필 변경 기능은 DB 연결 후 제공될 예정입니다.');
  };

  //  저장 전 입력만 원래 값으로 복원
  const handleCancel = () => {
    readerRef.current?.abort();
    setIsReading(false);
    setFormData({
      nickname: user.nickname,
      profile_image_url: user.profile_image_url ?? null,
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
          {formData.profile_image_url ? (
            <img src={formData.profile_image_url} alt="프로필 미리보기"
              width={120} height={120} className="h-[120px] w-[120px] rounded-full object-cover" />
          ) : <p className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gray-100 p-4 text-center text-xs text-muted">프로필 사진이 없습니다.</p>}
          <input ref={fileInputRef} type="file" accept={IMAGE_TYPES.join(',')}
            aria-label="프로필 사진 선택" onChange={handleImageChange} hidden />
          <button type="button" className="h-10 rounded-pill bg-gray-100 px-4 text-sm font-medium hover:bg-gray-200 disabled:opacity-40" onClick={() => fileInputRef.current.click()}>사진 변경</button>
          <button type="button" className="h-10 rounded-pill bg-gray-100 px-4 text-sm font-medium hover:bg-gray-200 disabled:opacity-40" onClick={handleImageDelete}
            disabled={!formData.profile_image_url && !isReading}>사진 삭제</button>
          {isReading && <p role="status" className="w-full text-sm text-muted">사진을 불러오는 중입니다.</p>}
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
          <button type="submit" disabled={isReading} className="h-12 rounded-pill bg-accent px-6 font-bold text-white hover:bg-accent-dark disabled:opacity-40">변경하기</button>
          <button type="button" onClick={handleCancel} className="h-12 rounded-pill bg-gray-100 px-6 font-medium hover:bg-gray-200">취소</button>
        </div>
      </form>
    </section>
  );
}

export default ProfileEditor;
