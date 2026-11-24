# 담당: 오효정
# [수정 11/24 조현기] 이 파일에서 바뀐 곳
#   signup         : ① 닉네임 중복 확인을 켬 (주석 처리돼 있었음) ② 이메일 인증을 끝낸 이메일만 가입
#   update_profile : 닉네임을 바꿀 때 다른 사람과 겹치면 400
#   ※ 화면(SignUpPage)에서도 인증을 확인하지만, 화면만 막으면 API를 직접 부르면 통과됨 → 서버에서도 막음
# 할 일: class UserService
#   signup(db, data)    아이디 · 닉네임 중복 확인, 비밀번호 암호화(get_password_hash)
#   login(db, data)     login_id로 찾고 verify_password, 토큰 두 개 발급, refresh_token 저장
#   get_user / check_login_id / check_nickname / update_profile
#   ※ mini serivces/user.py에서 email 로그인 → login_id 로그인으로 바꾸면 거의 그대로
#
# - mini의 serivces/user.py 모양: crud를 부르고, 안 되는 경우는 HTTPException(status_code, detail)으로 막기
# - 404 없음 / 403 남의 것 / 400 잘못된 값 / 401 로그인 필요
# - commit은 여기서. 실패하면 rollback
# - 다 만들면 app/services/__init__.py에 import 한 줄 추가
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud.user import UserCrud
# [수정 11/24 조현기] 인증을 끝낸 이메일 목록 (email_auth.py가 서버 메모리에 들고 있는 set)
#   /auth/verify-code에서 번호가 맞으면 여기에 이메일이 들어감 → 가입할 때 여기에 있는지 확인
#   ※ 서버를 다시 켜면 비워지므로, 재시작했으면 인증번호를 다시 받아야 함
from app.routers.email_auth import verified_emails
from app.db.scheme.users import UserCreate, UserLogin, UserRead, UserUpdate
from app.core.jwt_handle import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)


class UserService:
    @staticmethod
    async def signup(db: AsyncSession, data: UserCreate) -> UserRead:
        # 가입 정보 중 하나라도 이미 사용 중이면 400
        if await UserCrud.get_by_login_id(db, data.login_id):
            raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")
        if await UserCrud.get_by_email(db, str(data.email)):
            raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
        # [수정 11/24 조현기] 닉네임 중복 확인 켜기
        #   원래 주석 처리돼 있어서 같은 닉네임으로 여러 명이 가입할 수 있었음
        #   (DB에는 닉네임 중복을 막는 규칙(UNIQUE)이 없어서 여기서 직접 확인해야 함)
        if await UserCrud.get_by_nickname(db, data.nickname):
            raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다.")
        # [수정 11/24 조현기] 이메일 인증을 끝낸 이메일만 가입
        #   원래는 화면에서만 막아서, /docs나 다른 도구로 API를 직접 부르면 인증 없이 가입됐음
        #   email_auth.py 맨 위 안내('회원가입에 쓰려면')에 적힌 방법 그대로
        #   str(): data.email은 이메일 전용 타입이라 글자로 바꿔서 비교
        if str(data.email) not in verified_emails:
            raise HTTPException(status_code=400, detail="이메일 인증을 완료해 주세요.")

        # 비밀번호해시 DB에 저장
        create_data = data.model_copy(update={"password": get_password_hash(data.password)})

        try:
            user = await UserCrud.create(db, create_data)
            await db.commit()
            await db.refresh(user)
            # [수정 11/24 조현기] 가입에 성공하면 인증 기록을 지움 (한 번 인증으로 여러 번 가입하지 못하게)
            #   discard: 없으면 그냥 넘어가는 삭제 (remove는 없으면 오류)
            verified_emails.discard(str(data.email))
            return UserRead.model_validate(user)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def login(db: AsyncSession, data: UserLogin) -> tuple[UserRead, str, str]:
        user = await UserCrud.get_by_login_id(db, data.login_id)

        # 아이디가 없거나 비밀번호가 틀렸다는 정보를 구분하지 않음
        if user is None or not verify_password(data.password, user.password):
            raise HTTPException(status_code=400, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

        access_token = create_access_token(user.user_id)
        refresh_token = create_refresh_token(user.user_id)

        try:
            # Refresh Token DB 저장
            await UserCrud.update_refresh_token_by_id(db, user.user_id, refresh_token)
            await db.commit()
            # commit 후 만료된 ORM 속성을 비동기로 다시 읽습니다.
            await db.refresh(user)
            return UserRead.model_validate(user), access_token, refresh_token
        except Exception:
            await db.rollback()
            raise

    # 사용자 정보 조회
    @staticmethod
    async def get_user(db: AsyncSession, user_id: int) -> UserRead:
        user = await UserCrud.get_by_id(db, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        return UserRead.model_validate(user)

    @staticmethod
    async def check_login_id(db: AsyncSession, login_id: str) -> bool:
        return await UserCrud.get_by_login_id(db, login_id) is None

    @staticmethod
    async def check_nickname(db: AsyncSession, nickname: str) -> bool:
        return await UserCrud.get_by_nickname(db, nickname) is None

    # 닉네임과 시진 수정. 업데이트 후 따로 닉네임 중복 여부 체크 안함
    @staticmethod
    async def update_profile(
        db: AsyncSession, user_id: int, data: UserUpdate) -> UserRead:
        # [수정 11/24 조현기] 프로필에서 닉네임을 바꿀 때도 다른 사람과 겹치면 400
        #   - 닉네임을 안 보냈으면(None · 빈 값) 확인하지 않음 (사진만 바꾸는 경우)
        #   - 같은 닉네임을 가진 사람이 '나 자신'이면 통과 (닉네임을 그대로 두고 저장하는 경우)
        #   getattr(data, "nickname", None): data에 nickname이 없을 때도 오류 없이 None
        new_nickname = getattr(data, "nickname", None)
        if new_nickname:
            same = await UserCrud.get_by_nickname(db, new_nickname)
            if same is not None and same.user_id != user_id:
                raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다.")
        try:
            user = await UserCrud.update_by_id(db, user_id, data)
            if user is None:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
            await db.commit()
            await db.refresh(user)
            return UserRead.model_validate(user)
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def logout(db: AsyncSession, user_id: int) -> None:
        try:
            user = await UserCrud.update_refresh_token_by_id(db, user_id, None)
            if user is None:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
            await db.commit()
        except Exception:
            await db.rollback()
            raise