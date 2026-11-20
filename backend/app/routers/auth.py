# 담당: 오효정
# 할 일: prefix="/auth"
#   POST /auth/signup, POST /auth/login, GET /auth/me, POST /auth/logout, POST /auth/refresh
#   아이디 · 닉네임 중복 확인, 이메일 인증번호, 비밀번호 재설정
#   ※ 로그인 성공 시 set_auth_cookies(response, access_token, refresh_token)  (app/core/auth.py)
#   ※ 로그아웃은 response.delete_cookie로 두 쿠키 지우기 (mini routers/user.py 참고)
#   ※ 로그인 때 리프레시 토큰을 users.refresh_token에 저장, 로그아웃 때 NULL로 지우기
#     (토큰 재발급 미들웨어가 DB 값과 같을 때만 재발급함. 저장 안 하면 15분 뒤 로그인이 풀림)
#   ※ POST /auth/refresh는 미들웨어가 자동으로 재발급하므로 따로 안 만들어도 됨 -> 넹
#
# - 파일 안에 router = APIRouter(prefix=..., tags=[...])를 만들면 main.py가 자동으로 등록함 (main.py는 안 고쳐도 됨)
# - 모양은 app/routers/ingredient.py · recipe_comment.py(조현기) 참고
# - 로그인 필수: user_id: int = Depends(get_user_id) / 로그인 선택: Depends(get_optional)  (app/core/auth.py)
# - DB 세션: db: AsyncSession = Depends(get_db)  (app/db/database.py)
# - 만든 뒤 http://localhost:8044/docs 에서 바로 눌러 보며 확인



from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_user_id, set_auth_cookies
from app.db.database import get_db
from app.db.scheme.users import UserCreate, UserLogin, UserRead
from app.services.user import UserService

# GET /auth/me 구현하지 않음 backend\app\routers\user.py에서 Get /users/me 추가함(내 프로필 조회)
# POST /auth/refresh 같은 경우는 미들웨어가 자동 처리하므로 라우트 안만듦

router = APIRouter(prefix="/auth", tags=["Auth"])


# 회원가입 성공시 상태코드 201보냄
@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(data: UserCreate,db: AsyncSession = Depends(get_db)):
    return await UserService.signup(db, data)

# 로그인 성공 시 쿠키 생성
@router.post("/login", response_model=UserRead)
async def login(data: UserLogin,response: Response,db: AsyncSession = Depends(get_db)):
    user, access_token, refresh_token = await UserService.login(db, data)
    set_auth_cookies(response, access_token, refresh_token)
    return user

# 로그아웃 후 상태코드 204보냄
# 로그아웃 후 access_token, refresh_token 삭제
@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response, user_id: int = Depends(get_user_id),db: AsyncSession = Depends(get_db)):
    await UserService.logout(db, user_id)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")