# 담당: 정호진 — 냉장고 재료와 조리도구
from datetime import date
from sqlalchemy import Date, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class UserIngredient(Base):
    __tablename__ = "user_ingredients"

    user_ing_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(nullable=False)
    ing_id: Mapped[int] = mapped_column(nullable=False)
    expiration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    amount: Mapped[int | None] = mapped_column(nullable=True)
    unit: Mapped[str | None] = mapped_column(String(10), nullable=True)


class StandardTool(Base):
    __tablename__ = "standard_tools"

    tool_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tool_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)


class MyTool(Base):
    __tablename__ = "my_tools"

    user_tool_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(nullable=False)
    tool_id: Mapped[int] = mapped_column(nullable=False)
