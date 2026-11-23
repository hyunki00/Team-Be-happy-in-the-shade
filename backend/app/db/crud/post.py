# 담당: 임유빈
# 할 일: class PostCrud
#   get_list(db, sort, search_type, keyword)  최신순 · 인기순 / 제목 · 제목+내용 · 작성자 검색
#   get_by_id / create / update_by_id / delete_by_id
#   add_like / remove_like / get_comments / create_comment / update_comment / delete_comment
#   ※ 댓글 부분은 app/db/crud/recipe_comment.py(조현기)와 거의 같은 모양
#
# - crud는 DB 읽기 · 쓰기만. 권한 확인 · 계산 같은 규칙은 services에
# - 모양은 app/db/crud/recipe_comment.py(조현기) 참고: @staticmethod + async def + await db.execute(select(...))
# - 쓰기 함수는 flush까지만, commit은 서비스(또는 라우터)에서 한 번에
# - 다 만들면 app/db/crud/__init__.py에 import 한 줄 추가
from typing import Optional
from sqlalchemy import column, func, or_, select, table
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.posts import Post, PostComment, PostImage, PostLike
from app.db.scheme.posts import PostCommentCreate, PostCommentUpdate, PostCreate, PostUpdate

users_t = table("users", column("user_id"), column("nickname"))


class PostCrud:
    # 목록 조회 (최신순·인기순 / 제목·제목+내용·작성자 검색)
    @staticmethod
    async def get_list(
        db: AsyncSession,
        sort: str = "latest",   #정렬기준 기본 최신순 
        search_type: Optional[str] = None,
        keyword: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ):
        stmt = select(Post).options(selectinload(Post.images))

        if search_type and keyword: #키워드로 검색 할 경우

            if search_type == "title": #제목 조회
                stmt = stmt.where(Post.title.ilike(f"%{keyword}%"))

            elif search_type == "title_content": #제목 또는 본문에 맞는 키워드 있으면 조회됨
                stmt = stmt.where(
                    or_(
                        Post.title.ilike(f"%{keyword}%"),
                        Post.content.ilike(f"%{keyword}%"),
                    )
                )

            elif search_type == "author":  #작정자 조회 (닉네임)
                stmt = stmt.join(users_t, Post.user_id == users_t.c.user_id).where(
                    users_t.c.nickname.ilike(f"%{keyword}%")
                )

        if sort == "popular": #인기순 정렬
            like_subq = (
                select(
                    PostLike.post_id,
                    func.count(PostLike.user_id).label("like_cnt"),
                )
                .group_by(PostLike.post_id)
                .subquery()
            )          #outerjoin:좋아요가 없는 글도 목록에서 빠지지 않게
            stmt = stmt.outerjoin(like_subq, Post.post_id == like_subq.c.post_id).order_by(
                func.coalesce(like_subq.c.like_cnt, 0).desc(), #좋아요 개수 null -> 0으로 채워줌
                Post.created_at.desc(),Post.post_id.desc(),
            )
        else:
            stmt = stmt.order_by(Post.created_at.desc(), Post.post_id.desc())

        result = await db.execute(stmt.offset(skip).limit(limit))
        return list(result.scalars().all())


    # 단건 상세 조회
    @staticmethod
    async def get_by_id(db: AsyncSession, post_id: int) -> Post | None:
        result = await db.execute(select(Post).options(selectinload(Post.images)).where(Post.post_id == post_id))
        return result.scalar_one_or_none()


    # 게시글 생성 (본문 + 사진)
    @staticmethod
    async def create(db: AsyncSession, user_id: int, post: PostCreate) -> Post:
        post_data = post.model_dump(exclude={"images"})
        db_post = Post(user_id=user_id, **post_data)
        db.add(db_post)
        await db.flush()

        for idx, url in enumerate(post.images, start=1):
            db.add(
                PostImage(
                    post_id=db_post.post_id,
                    p_image_url=url,
                    p_image_order=idx,
                )
            )

        await db.flush()
        return db_post

    #게시글 수정
    @staticmethod
    async def update_by_id(db: AsyncSession, post_id: int, post: PostUpdate) -> Post | None:
        db_post = await db.get(Post, post_id)
        if not db_post:
            return None

        update_data = post.model_dump(exclude_unset=True, exclude={"images"})
        for key, value in update_data.items():
            setattr(db_post, key, value)

        # 요청에 'images'가 포함된 경우에만 사진 목록을 새로 반영 (안 보냈으면 None이라 기존 사진 유지)
        if post.images is not None:

            result = await db.execute(select(PostImage).where(PostImage.post_id == post_id))

            for old_img in result.scalars().all():
                await db.delete(old_img)
            await db.flush()

            for idx, url in enumerate(post.images, start=1):
                db.add(
                    PostImage(
                        post_id=post_id,
                        p_image_url=url,
                        p_image_order=idx,
                    )
                )

        await db.flush()
        return db_post


    #게시글 삭제
    @staticmethod
    async def delete_by_id(db: AsyncSession, post_id: int) -> bool:
        db_post = await db.get(Post, post_id)
        if not db_post:
            return False

        await db.delete(db_post)
        await db.flush()
        return True


    #게시글 좋아요
    @staticmethod
    async def add_like(db: AsyncSession, user_id: int, post_id: int) -> PostLike:
        db_like = PostLike(user_id=user_id, post_id=post_id)
        db.add(db_like)
        await db.flush()
        return db_like


    #게시글 좋아요 취소
    @staticmethod 
    async def remove_like(db: AsyncSession, user_id: int, post_id: int) -> bool:
        result = await db.execute(
            select(PostLike).where(
                PostLike.user_id == user_id,
                PostLike.post_id == post_id,
            )
        )
        db_like = result.scalar_one_or_none()
        if not db_like:
            return False

        await db.delete(db_like)
        await db.flush()
        return True


    # 게시글 댓글 
    @staticmethod
    async def get_comments(db: AsyncSession, post_id: int) -> list[tuple[PostComment, str]]:
        result = await db.execute(
            select(PostComment, users_t.c.nickname)
            .join(users_t, users_t.c.user_id == PostComment.user_id)
            .where(PostComment.post_id == post_id)
            .order_by(PostComment.created_at.desc(), PostComment.pc_id.desc())
        )
        return [(row[0], row[1]) for row in result.all()]


    #게시글 댓글 작성
    @staticmethod
    async def create_comment(
        db: AsyncSession,
        user_id: int,
        post_id: int,
        comment: PostCommentCreate,
    ) -> PostComment:
        db_comment = PostComment(
            user_id=user_id,
            post_id=post_id,
            **comment.model_dump(),
        )
        db.add(db_comment)
        await db.flush()
        return db_comment


    # 게시글 댓글 수정
    @staticmethod
    async def update_comment(
        db: AsyncSession,
        pc_id: int,
        comment: PostCommentUpdate,
    ) -> PostComment | None:
        db_comment = await db.get(PostComment, pc_id)
        if not db_comment:
            return None

        for key, value in comment.model_dump(exclude_unset=True).items():
            setattr(db_comment, key, value)

        await db.flush()
        return db_comment


    #게시글 댓글 삭제
    @staticmethod
    async def delete_comment(db: AsyncSession, pc_id: int) -> bool:
        db_comment = await db.get(PostComment, pc_id)
        if not db_comment:
            return False

        await db.delete(db_comment)
        await db.flush()
        return True