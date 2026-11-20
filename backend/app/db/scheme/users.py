# 담당: 오효정
# 할 일: BaseModel 클래스
#   UserCreate  가입 때 받는 값 (login_id, email, nickname, password)
#   UserLogin   로그인 때 받는 값 (login_id, password)
#   UserUpdate  닉네임 · 프로필 사진 수정
#   UserRead    돌려주는 내 정보 (password · refresh_token은 넣지 않기)
#   ※ 아이디 4~20자 영문 · 숫자, 비밀번호 8자 이상 (프론트 constants.js와 같게)
#
# - 모양은 app/db/scheme/ingredients.py · recipe_comments.py(조현기) 참고
# - 필드 이름은 프론트 mockData.js와 같게 (화면이 그대로 받을 수 있게)
# - DB 모델 객체를 그대로 돌려줄 클래스에는 model_config = ConfigDict(from_attributes=True)
# - 글자 수 제한은 Field(max_length=…)로, 숫자는 프론트 constants.js와 맞추기

from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Annotated
from datetime import datetime

class UserCreate(BaseModel):
    login_id: Annotated[str, Field(min_length=4, max_length=20, pattern=r"^[a-zA-Z0-9]+$")] #영문숫자
    email: EmailStr
    nickname: Annotated[str, Field(max_length=50)] # model(DB)과 일치 - 50자 제한
    password: Annotated[str, Field(min_length=8)]

class UserLogin(BaseModel):
    login_id: str
    password: str

#닉네임, 프로필 사진 수정
# nickname: 생략하면 기존 값 유지, null 허용
# profile_image: 생략하면 기존 값 유지, null이면 사진 삭제
class UserUpdate(BaseModel):
    nickname: str | None = Field(default=None, max_length=50)
    profile_image: str | None = Field(default=None, max_length=255)

# 돌려주는 내 정보 (password · refresh_token는 제외)
class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True) #react JSON로 객체 직접 반환하는 것만(응답)

    user_id: int
    login_id: str
    email: str
    nickname: str
    profile_image: str | None = None
    created_at: datetime
