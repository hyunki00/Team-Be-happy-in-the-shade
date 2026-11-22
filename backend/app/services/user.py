# 담당: 오효정
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
        # if await UserCrud.get_by_nickname(db, data.nickname):
        #     raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다.")

        # 비밀번호해시 DB에 저장
        create_data = data.model_copy(update={"password": get_password_hash(data.password)})

        try:
            user = await UserCrud.create(db, create_data)
            await db.commit()
            await db.refresh(user)
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