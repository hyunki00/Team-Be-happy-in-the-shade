# 담당: 임유빈
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
