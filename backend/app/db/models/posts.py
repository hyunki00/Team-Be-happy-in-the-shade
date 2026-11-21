# 담당: 임유빈
# 할 일:
#   Post        → posts          post_id, user_id, title, content, created_at
#   PostImage   → post_images    p_image_id, post_id, p_image_url, p_image_order
#   PostLike    → posts_likes    user_id + post_id 복합 기본키 (둘 다 primary_key=True), created_at
#   PostComment → post_comments  pc_id, user_id, post_id, pc_content, pc_image_url, created_at
#
# - 모양은 app/db/models/ingredients.py · recipe_comments.py(조현기) 참고: class 이름(Base) + __tablename__ + mapped_column
# - 테이블 · 컬럼 이름과 타입은 테이블 생성 SQL(11/13)과 글자 하나까지 같게
# - ForeignKey는 DB에 이미 걸려 있으니 안 적어도 됨 (적으면 상대 모델이 없을 때 오류)
# - 다 만들면 app/db/models/__init__.py에 import 한 줄 추가

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base
from sqlalchemy.orm import relationship, foreign


# 게시글 테이블
class Post(Base):
    __tablename__ = "posts"

    post_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    # relationship 추가해 주어야 Pydantic스키마가 images를 빼갈 수 있습니다!
    # 모델에 ForeignKey를 선언하지 않아 연결 조건을 직접 지정합니다.
    images: Mapped[list["PostImage"]] = relationship(
        back_populates="post", cascade="all, delete-orphan",
        primaryjoin=lambda: Post.post_id == foreign(PostImage.post_id),
    )



# 게시글 이미지 테이블 (post_images)
class PostImage(Base):
    __tablename__ = "post_images"

    p_image_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(nullable=False)
    p_image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    p_image_order: Mapped[int] = mapped_column(nullable=False)

    # Post처럼 relationship추가 - 양방향 관계 설정(사진에서 부모 게시글 쪽으로 찾아갈 수 있게)
    post: Mapped["Post"] = relationship(
        back_populates="images",
        primaryjoin=lambda: Post.post_id == foreign(PostImage.post_id),
    )



# 게시글 좋아요 테이블 (posts_likes) - 복합 기본키
class PostLike(Base):
    __tablename__ = "posts_likes"

    user_id: Mapped[int] = mapped_column(primary_key=True, nullable=False)
    post_id: Mapped[int] = mapped_column(primary_key=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


# 게시글 댓글 테이블 (post_comments)
class PostComment(Base):
    __tablename__ = "post_comments"

    pc_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(nullable=False)
    post_id: Mapped[int] = mapped_column(nullable=False)
    pc_content: Mapped[str] = mapped_column(Text, nullable=False)
    pc_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)