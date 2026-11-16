# 담당: 조현기
# 화면과 주고받는 레시피 댓글 모양 (프론트 mockData.js의 mockRecipeComments와 같은 이름)
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

COMMENT_MAX = 500  # 프론트 constants.js의 COMMENT_MAX와 같게 (가안)


# 댓글 쓰기 · 수정 때 받는 값
class RecipeCommentCreate(BaseModel):
    # str_strip_whitespace: 앞뒤 공백을 지운 뒤 길이를 검사 (공백만 쓴 댓글 막기)
    model_config = ConfigDict(str_strip_whitespace=True)

    rc_content: str = Field(min_length=1, max_length=COMMENT_MAX)
    rc_image_url: str | None = Field(None, max_length=500)  # 사진 올리기 방식이 정해지면 바뀔 수 있음


# 돌려주는 댓글 하나
class RecipeCommentRead(BaseModel):
    rc_id: int
    recipe_id: int
    user_id: int
    nickname: str           # 작성자 닉네임 (users 테이블에서 붙임)
    rc_content: str
    rc_image_url: str | None
    created_at: datetime
    is_mine: bool           # 로그인한 사람이 쓴 댓글이면 true (수정 · 삭제 버튼 표시용)


# 마이페이지 "내가 쓴 레시피 댓글" 한 줄 (오효정의 /users/me/recipe-comments에서 씀)
class MyRecipeCommentRead(BaseModel):
    rc_id: int
    recipe_id: int
    recipe_title: str
    rc_content: str
    created_at: datetime
