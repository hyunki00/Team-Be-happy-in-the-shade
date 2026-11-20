# 담당: 오효정
# 할 일: class UserCrud
#   get_by_id(db, user_id) / get_by_login_id(db, login_id) / get_by_email(db, email) / get_by_nickname(db, nickname)
#   create(db, data) / update_by_id(db, user_id, data)
#   update_refresh_token_by_id(db, user_id, refresh_token)
#   ※ 마지막 함수는 토큰 재발급(공통 미들웨어)이 이 이름 그대로 부름. 없으면 DB 저장만 건너뜀
#   ※ mini crud/user.py를 거의 그대로 쓰고 username → login_id로 바꾸면 됨
#
# - crud는 DB 읽기 · 쓰기만. 권한 확인 · 계산 같은 규칙은 services에
# - 모양은 app/db/crud/recipe_comment.py(조현기) 참고: @staticmethod + async def + await db.execute(select(...))
# - 쓰기 함수는 flush까지만, commit은 서비스(또는 라우터)에서 한 번에
# - 다 만들면 app/db/crud/__init__.py에 import 한 줄 추가

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.users import User
from app.db.scheme.users import UserCreate, UserUpdate


class UserCrud:
    #id로 사용자 조회
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> User | None:
        return await db.get(User, user_id) #pk로 조회할 때 get()

    # login_id로 사용자 조회
    @staticmethod
    async def get_by_login_id(db: AsyncSession, login_id: str) -> User | None:
        result = await db.execute(select(User).where(User.login_id == login_id))
        return result.scalar_one_or_none() #unique일때 중복허용하지 않을 때만

    # 이메일로 사용자 조회
    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()


    # nickname으로 사용자 조회
    # unique한 값이 아니라 여러 행이 있을 수 있다(중복허용) 
    @staticmethod
    async def get_by_nickname(db: AsyncSession, nickname: str) -> User | None:
        result = await db.execute(select(User).where(User.nickname == nickname))
        return result.scalars().first() # 여러명이어도 첫 번째 사용자 한 명만 반환

    # 사용자 생성
    @staticmethod
    async def create(db: AsyncSession, data: UserCreate) -> User:
        user = User(**data.model_dump())
        db.add(user)
        await db.flush()
        return user

    # user_id로 사용자 정보 수정
    @staticmethod
    async def update_by_id(
        db: AsyncSession, user_id: int, data: UserUpdate) -> User | None:
        user = await db.get(User, user_id) #수정할 사용자 조회
        if user is None:
            return None

        for key, value in data.model_dump(exclude_unset=True).items(): #요정에서 전달되지 않은 것은 제외
            setattr(user, key, value)

        await db.flush()
        return user

    #  refresh_token 업데이트
    @staticmethod
    async def update_refresh_token_by_id(db: AsyncSession, user_id: int, refresh_token: str | None) -> User | None:
        user = await db.get(User, user_id)
        if user is None:
            return None #None을 전달하면 무효화

        user.refresh_token = refresh_token
        await db.flush()
        return user 