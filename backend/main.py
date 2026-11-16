# 담당: 조현기 (공통)
# 앱 시작 파일: CORS · 미들웨어 · 라우터 등록
# 실행: backend 폴더에서  uvicorn main:app --port=8044 --reload
import importlib
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import asynccontextmanager
from dotenv import load_dotenv
from app.db.database import async_engine
from app.middleware.token_refresh import TokenRefreshMiddleware

load_dotenv(dotenv_path=".env")


# mini는 여기서 Base.metadata.create_all로 테이블을 자동으로 만들지만,
# 우리는 테이블 생성 SQL(11/13) + seed.sql로 DB를 만들기 때문에 자동 생성은 하지 않는다.
# (모델 클래스가 SQL과 조금만 달라도 엉뚱한 테이블이 생기는 것을 막기 위해)
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await async_engine.dispose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(TokenRefreshMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite 개발 서버 (mini는 3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록: app/routers/파일이름.py 안에 router = APIRouter(...)가 있으면 자동으로 등록된다.
# 그래서 각자 라우터를 만들 때 이 파일(main.py)은 고치지 않아도 된다. (같은 파일 동시 수정 → 충돌 방지)
ROUTERS = ["auth", "user", "ingredient", "fridge", "recipe", "recipe_comment", "post"]
for name in ROUTERS:
    module = importlib.import_module(f"app.routers.{name}")
    if hasattr(module, "router"):
        app.include_router(module.router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8044, reload=True)
