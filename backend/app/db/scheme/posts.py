# 담당: 임유빈
# [병합 수정 11/24 조현기] 마이페이지 '내 게시글 댓글' 모양 MyPostCommentRead를 맨 아래에 추가
# [수정 11/24 조현기] 관련 레시피 저장 · 보여 주기
#   - PostCreate · PostUpdate에 recipe_id : 화면이 고른 레시피 번호를 받음
#   - LinkedRecipe (새로 만듦)             : 게시글 상세에 붙일 레시피 카드 모양
#   - PostDetail에 linked_recipe          : 상세 화면(BoardDetailPage)이 원래 쓰던 이름 그대로 채워서 보냄
# 할 일: BaseModel 클래스
#   PostCreate / PostUpdate   title, content, 사진
#   PostListItem / PostDetail mockPosts 모양 (nickname, like_count, comment_count, images, is_liked, is_mine)
#   PostCommentCreate / PostCommentRead   mockPostComments 모양
#   ※ DB 사진 컬럼은 p_image_url · p_image_order, 화면은 images[image_url, image_order] → 돌려줄 때 이름 바꾸기
#
# - 모양은 app/db/scheme/ingredients.py · recipe_comments.py(조현기) 참고
# - 필드 이름은 프론트 mockData.js와 같게 (화면이 그대로 받을 수 있게)
# - DB 모델 객체를 그대로 돌려줄 클래스에는 model_config = ConfigDict(from_attributes=True)
# - 글자 수 제한은 Field(max_length=…)로, 숫자는 프론트 constants.js와 맞추기


from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

#프론트의 constants.js와 동일하게
BOARD_TITLE_MAX = 100
BOARD_CONTENT_MAX = 5000  
COMMENT_MAX = 500     
BOARD_IMAGE_MAX_COUNT = 5    

### ConfigDict(str_strip_whitespace=True) 앞뒤 공백 자동 제거 - 기능 없애도 괜찮음(프론트엔드 검증은 우회 방지용)###
### populate_by_name=True : 필드 이름(예: image_url)과 별칭(Alias, 예: p_image_url) 중 어떤 이름으로 데이터가 들어와도 전부 허용(인식)해 주는 옵션


# 게시글 이미지 조회 스키마 (post_images 테이블 대응)
class PostImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # DB 'p_image_id' - 프론트엔드 'image_id'
    image_id: int = Field(validation_alias="p_image_id", serialization_alias="image_id")
    post_id: int
  
    # DB 'p_image_url' - 프론트엔드 'image_url'
    image_url: str = Field(validation_alias="p_image_url", serialization_alias="image_url")
    
    # DB 'p_image_order' - 프론트엔드 'image_order'
    image_order: int = Field(validation_alias="p_image_order", serialization_alias="image_order")


# 게시글 작성 스키마
class PostCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=BOARD_TITLE_MAX)
    content: str = Field(min_length=1, max_length=BOARD_CONTENT_MAX)
    images: list[str] = Field(default_factory=list, max_length=BOARD_IMAGE_MAX_COUNT)
    # [수정 11/24 조현기] 관련 레시피 번호 (선택). 안 보내거나 null이면 연결 없음. gt=0: 1 이상만
    recipe_id: Optional[int] = Field(None, gt=0)


#게시글 수정 스키마
class PostUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    title: Optional[str] = Field(None, min_length=1, max_length=BOARD_TITLE_MAX)
    content: Optional[str] = Field(None, min_length=1, max_length=BOARD_CONTENT_MAX)
    images: Optional[list[str]] = Field(None, max_length=BOARD_IMAGE_MAX_COUNT)
    # [수정 11/24 조현기] 관련 레시피 번호
    #   - 요청에 recipe_id를 아예 안 보내면 → 기존 연결 그대로 (crud가 exclude_unset으로 '보낸 칸만' 바꿈)
    #   - "recipe_id": null 을 보내면     → 연결 해제
    #   - "recipe_id": 750 을 보내면      → 750번 레시피로 연결
    recipe_id: Optional[int] = Field(None, gt=0)


# [수정 11/24 조현기] 게시글 상세에 붙는 '관련 레시피' 카드
#   필드 이름은 BoardDetailPage.jsx · BoardFormPage.jsx가 이미 쓰던 이름 그대로
#   (post.linked_recipe.recipe_title, .image_url, .nickname, .cooking_time, .level)
#   nickname은 레시피 작성자 닉네임 (게시글 작성자 아님)
class LinkedRecipe(BaseModel):
    recipe_id: int
    recipe_title: str
    image_url: Optional[str] = None
    nickname: Optional[str] = None
    cooking_time: int
    level: str


# 게시글 목록 화면 아이템 (PostListItem)
class PostListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    post_id: int
    user_id: int
    title: str
    created_at: datetime
    nickname: Optional[str] = None      
    like_count: int = 0
    comment_count: int = 0
    images: list[PostImageRead] = []    
    is_liked: bool = False
    is_mine: bool = False


# 게시글 상세 페이지용 (PostDetail) - 본문(content)정보 포함
class PostDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    post_id: int
    user_id: int
    title: str
    content: str                       
    created_at: datetime
    nickname: Optional[str] = None
    like_count: int = 0
    comment_count: int = 0
    images: list[PostImageRead] = []   
    is_liked: bool = False
    is_mine: bool = False
    # [수정 11/24 조현기] 관련 레시피 카드. 연결 안 했거나 연결한 레시피가 지워졌으면 null
    linked_recipe: Optional[LinkedRecipe] = None


#게시글 댓글 작성
class PostCommentCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    pc_content: str = Field(min_length=1, max_length=COMMENT_MAX)
    pc_image_url: Optional[str] = Field(None, max_length=500)


#@게시글 댓글 수정(crud의 댓글 수정기능과 자연스럽게 쓰기위해 추가)   
class PostCommentUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    pc_content: Optional[str] = Field(None, min_length=1,max_length=COMMENT_MAX)
    pc_image_url: Optional[str] = Field(None, max_length=500)



#게시글 댓글 조회
class PostCommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pc_id: int
    user_id: int
    post_id: int
    pc_content: str
    pc_image_url: Optional[str] = None
    created_at: datetime
    nickname: Optional[str] = None
    is_mine: bool = False


# [병합 수정 11/24 조현기] 마이페이지 '내 게시글 댓글' (routers/user.py에서 씀 · 오효정 마이페이지 API용)
class MyPostCommentRead(BaseModel):
    pc_id: int
    post_id: int
    post_title: str
    pc_content: str
    pc_image_url: Optional[str] = None
    created_at: datetime
