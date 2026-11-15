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
