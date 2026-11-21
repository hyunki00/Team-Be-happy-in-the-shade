# 담당: 정호진 — 프론트 mockFridge · mockMyTools와 같은 필드 이름
from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


class UserIngredientCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ing_id: int = Field(gt=0)
    amount: int = Field(strict=True, ge=1, le=999)
    unit: Literal["g", "L", "개"]
    expiration_date: date | None = None


class UserIngredientUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ing_id: int | None = Field(None, gt=0)
    amount: int | None = Field(None, strict=True, ge=1, le=999)
    unit: Literal["g", "L", "개"] | None = None
    expiration_date: date | None = None

    @model_validator(mode="after")
    def check_fields(self):
        # 생략한 값은 유지하고, 날짜만 null로 지울 수 있습니다.
        if not self.model_fields_set:
            raise ValueError("수정할 값을 보내 주세요.")
        for name in ("ing_id", "amount", "unit"):
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"{name}에는 null을 넣을 수 없습니다.")
        return self


class UserIngredientRead(BaseModel):
    user_ing_id: int
    ing_id: int
    ing_name: str
    ing_category_id: int
    amount: int | None
    unit: str | None
    expiration_date: date | None


class ToolRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tool_id: int
    tool_name: str


class MyToolCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tool_id: int = Field(gt=0)


class MyToolRead(ToolRead):
    user_tool_id: int
