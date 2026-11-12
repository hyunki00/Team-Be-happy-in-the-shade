// 담당: 오효정 (임시화면입니다~)

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
    return <p>로그인 후 이용해 주세요.</p>;
  }

  return (
    <section>
      <h2>프로필 수정</h2>
      <form onSubmit={handleSubmit}>
        <div>
          {formData.profile_image_url ? (
            <img src={formData.profile_image_url} alt="프로필 미리보기"
              width={120} height={120} className="rounded-full object-cover" />
          ) : <p>프로필 사진이 없습니다.</p>}
          <input ref={fileInputRef} type="file" accept={IMAGE_TYPES.join(',')}
            aria-label="프로필 사진 선택" onChange={handleImageChange} hidden />
          <button type="button" onClick={() => fileInputRef.current.click()}>사진 변경</button>
          <button type="button" onClick={handleImageDelete}
            disabled={!formData.profile_image_url && !isReading}>사진 삭제</button>
          {isReading && <p role="status">사진을 불러오는 중입니다.</p>}
        </div>

        <div>
          <strong>이메일</strong>
          <p>{user.email}</p>
        </div>

        <label htmlFor="profile-nickname">닉네임</label>
        <input id="profile-nickname" name="nickname" value={formData.nickname}
          maxLength={NICKNAME_MAX} onChange={handleChange} required />
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <div>
          <button type="submit" disabled={isReading}>변경하기</button>
          <button type="button" onClick={handleCancel}>취소</button>
        </div>
      </form>
    </section>
  );
}

export default ProfileEditor;
