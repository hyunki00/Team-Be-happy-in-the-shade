# 담당: 조현기
# 테이블: recipe_comments (테이블 생성 SQL 11/13과 같음)
# 외래키(user_id → users, recipe_id → recipes)는 DB에 걸려 있어서 모델에는 적지 않음
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class RecipeComment(Base):
    __tablename__ = "recipe_comments"

    rc_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(nullable=False)
    recipe_id: Mapped[int] = mapped_column(nullable=False)
    rc_content: Mapped[str] = mapped_column(Text, nullable=False)
    rc_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
