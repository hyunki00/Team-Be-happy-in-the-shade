# 담당: 권우정
# 할 일:
#   RecipeCategory   → recipe_categories    r_category_id, category_name
#   CategorySynonym  → category_synonyms    r_cate_sy_id, r_category_id, r_cate_sy_name
#   Recipe           → recipes              recipe_id, user_id, recipe_title, intro, image_url, servings,
#                                           tool_id(NULL 가능), level, cooking_time, created_at, r_category_id
#   RecipeIngredient → recipe_ingredients   recipe_ing_id, recipe_id, ing_id, amount_text
#   RecipeStep       → recipe_steps         step_id, recipe_id, step_no, step_content, step_image_url
#   RecipeLike       → recipe_likes         user_id + recipe_id 복합 기본키 (둘 다 primary_key=True), created_at
#   Bookmark         → bookmarks            user_id + recipe_id 복합 기본키, created_at
#
# - 모양은 app/db/models/ingredients.py · recipe_comments.py(조현기) 참고: class 이름(Base) + __tablename__ + mapped_column
# - 테이블 · 컬럼 이름과 타입은 테이블 생성 SQL(11/13)과 글자 하나까지 같게
# - ForeignKey는 DB에 이미 걸려 있으니 안 적어도 됨 (적으면 상대 모델이 없을 때 오류)
# - 다 만들면 app/db/models/__init__.py에 import 한 줄 추가
