# 담당: 임유빈
# 할 일: class PostService
#   get_list / get_detail / write / edit / remove / toggle_like
#   ※ 본인 글 · 댓글만 수정 · 삭제 (아니면 403), 사진 최대 5장
#
# - mini의 serivces/user.py 모양: crud를 부르고, 안 되는 경우는 HTTPException(status_code, detail)으로 막기
# - 404 없음 / 403 남의 것 / 400 잘못된 값 / 401 로그인 필요
# - commit은 여기서. 실패하면 rollback
# - 다 만들면 app/services/__init__.py에 import 한 줄 추가

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import column, func, select, table
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud.post import PostCrud
from app.db.models.posts import PostComment, PostLike
from app.db.scheme.posts import (
    BOARD_IMAGE_MAX_COUNT,
    PostCommentCreate,
    PostCommentRead,
    PostCommentUpdate,
    PostCreate,
    PostDetail,
    PostImageRead,
    PostListItem,
    PostUpdate,
)

users_t = table("users", column("user_id"), column("nickname"))


class PostService:
      # 게시글 목록 조회
      @staticmethod
      async def get_list(
            db: AsyncSession,
            sort: str = "latest",
            search_type: Optional[str] = None,
            keyword: Optional[str] = None,
            skip: int = 0,
            limit: int = 20,
      ) -> list[PostListItem]:
            
            # 최신순, 인기순이 아닌 정렬 기준이 들어오면
            if sort not in ("latest", "popular"):
                  raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="잘못된 정렬 기준입니다.")
            #검색 기준(제목, 내용, 작성자)에 맞지 않는 값 들어오면 
            if search_type is not None and search_type not in ("title", "title_content", "author"):
                  raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="잘못된 검색 기준입니다.")

            posts = await PostCrud.get_list(db, sort=sort, search_type=search_type, keyword=keyword, skip=skip, limit=limit)

            #조회된 게시글 없으면 빈 리스트 반환
            if not posts:  
                  return []

            # 목록에 포함된 게시글 ID들과 작성자 ID들을 중복 없이 모음
            post_ids = [p.post_id for p in posts]
            user_ids = {p.user_id for p in posts}

            # 작성자 ID들에 해당하는 닉네임을 한 번의 쿼리로 조회해 {user_id: nickname} 딕셔너리로 만듦
            nick_rows = await db.execute(select(users_t.c.user_id, users_t.c.nickname).where(users_t.c.user_id.in_(user_ids)))
            nicknames = {r.user_id: r.nickname for r in nick_rows.all()}

            # 각 게시글별 좋아요 개수를 집계해 {post_id: 좋아요수} 딕셔너리로 만듦
            like_rows = await db.execute(
                  select(PostLike.post_id, func.count(PostLike.user_id).label("cnt"))
                  .where(PostLike.post_id.in_(post_ids))
                  .group_by(PostLike.post_id)
            )
            like_counts = {r.post_id: r.cnt for r in like_rows.all()}

            # 각 게시글별 댓글 개수를 집계해 {post_id: 댓글수} 딕셔너리로 만듦
            comment_rows = await db.execute(
                  select(PostComment.post_id, func.count(PostComment.pc_id).label("cnt"))
                  .where(PostComment.post_id.in_(post_ids))
                  .group_by(PostComment.post_id)
            )
            comment_counts = {r.post_id: r.cnt for r in comment_rows.all()}

            items = []
            for p in posts:
                  imgs = sorted(p.images, key=lambda img: img.p_image_order)
                  items.append(
                  PostListItem(
                        post_id=p.post_id,
                        user_id=p.user_id,
                        title=p.title,
                        created_at=p.created_at,
                        nickname=nicknames.get(p.user_id),
                        like_count=like_counts.get(p.post_id, 0),
                        comment_count=comment_counts.get(p.post_id, 0),
                        images=[PostImageRead.model_validate(img) for img in imgs],
                  )
                  )
            return items


      # 게시글 상세 조회
      @staticmethod
      async def get_detail(db: AsyncSession, post_id: int, user_id: Optional[int] = None) -> PostDetail:
            post = await PostCrud.get_by_id(db, post_id)
            if not post:
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="게시글을 찾을 수 없습니다.")

            # 게시글 작성자의 닉네임 조회
            nick_row = (await db.execute(select(users_t.c.nickname).where(users_t.c.user_id == post.user_id))).first()
            nickname = nick_row.nickname if nick_row else None

            # 해당 게시글의 총 좋아요 수 조회
            like_count = (
                  await db.execute(select(func.count(PostLike.user_id)).where(PostLike.post_id == post_id))
            ).scalar_one()

            # 해당 게시글의 총 댓글 수 조회
            comment_count = (
                  await db.execute(select(func.count(PostComment.pc_id)).where(PostComment.post_id == post_id))
            ).scalar_one()

            # 로그인 상태일 때만 현재 사용자가 이 글에 좋아요를 눌렀는지 확인
            is_liked = False
            if user_id is not None:
                  liked = (
                  await db.execute(
                        select(PostLike.post_id).where(PostLike.user_id == user_id, PostLike.post_id == post_id)
                  )
                  ).first()
                  is_liked = liked is not None

            # 이미지 순번대로 정렬 후 PostDetail 스키마로 반환
            imgs = sorted(post.images, key=lambda img: img.p_image_order)
            return PostDetail(
                  post_id=post.post_id,
                  user_id=post.user_id,
                  title=post.title,
                  content=post.content,
                  created_at=post.created_at,
                  nickname=nickname,
                  like_count=like_count,
                  comment_count=comment_count,
                  images=[PostImageRead.model_validate(img) for img in imgs],
                  is_liked=is_liked,
                  is_mine=(user_id is not None and post.user_id == user_id),
            )

      # 게시글 작성
      @staticmethod
      async def write(db: AsyncSession, user_id: int, data: PostCreate) -> PostDetail:
            # 로그인 사용자여부
            if not user_id:
                  raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")
            
            # 사진 최대 허용 장수 넘으면
            if len(data.images) > BOARD_IMAGE_MAX_COUNT:
                  raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=f"사진은 최대 {BOARD_IMAGE_MAX_COUNT}장까지 등록할 수 있습니다.",)

            # CRUD로 게시글+사진 flush 후 여기서 commit, 실패 시 rollback 후 예외 다시 던짐
            try:
                  created = await PostCrud.create(db, user_id=user_id, post=data)
                  post_id = created.post_id
                  await db.commit()
            except Exception:
                  await db.rollback()
                  raise

            return await PostService.get_detail(db, post_id=post_id, user_id=user_id)

      # 게시글 수정 (본인만)
      @staticmethod
      async def edit(db: AsyncSession, user_id: int, post_id: int, data: PostUpdate) -> PostDetail:
            # 로그인 여부 확인
            if not user_id:
                  raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")

            # 수정할 대상 게시글 존재 여부 확인
            post = await PostCrud.get_by_id(db, post_id)
            if not post:
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="게시글을 찾을 수 없습니다.")
            
            # 내 글이 아니면 403(권한 없음)
            if post.user_id != user_id:
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인 게시글만 수정할 수 있습니다.")
            
            # 새 사진 목록을 보낸 경우 최대 5장 제한 확인
            if data.images is not None and len(data.images) > BOARD_IMAGE_MAX_COUNT:
                  raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"사진은 최대 {BOARD_IMAGE_MAX_COUNT}장까지 등록할 수 있습니다.")

            try:
                  await PostCrud.update_by_id(db, post_id=post_id, post=data)
                  await db.commit()
            except Exception:
                  await db.rollback()
                  raise

            return await PostService.get_detail(db, post_id=post_id, user_id=user_id)

      # 게시글 삭제 (본인만)
      @staticmethod
      async def remove(db: AsyncSession, user_id: int, post_id: int) -> None:
            #로그인여부
            if not user_id:
                  raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")

            # 삭제할 대상 게시글 존재여부
            post = await PostCrud.get_by_id(db, post_id)
            if not post:
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="게시글을 찾을 수 없습니다.")

            # 본인글 아니면 403 에러
            if post.user_id != user_id:
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인 게시글만 삭제할 수 있습니다.")

            try:
                  await PostCrud.delete_by_id(db, post_id=post_id)
                  await db.commit()
            except Exception:
                  await db.rollback()
                  raise


      #게시글 좋아요 토글 (이미 눌렀으면 취소, 안 눌렀으면 추가)
      @staticmethod
      async def toggle_like(db: AsyncSession, user_id: int, post_id: int) -> dict:
            #로그인여부
            if not user_id:
                  raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")
            
            # 대상 게시글 존재여부
            post = await PostCrud.get_by_id(db, post_id)
            if not post:
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="게시글을 찾을 수 없습니다.")

            try:
                  # 현재 사용자가 해당 게시글에 좋아요 눌렀는지 조회
                  exists = (
                  await db.execute(
                        select(PostLike).where(PostLike.user_id == user_id, PostLike.post_id == post_id)
                        )
                  ).scalar_one_or_none()

                  # 이미 눌렀으면 취소(False), 안 눌렀으면 추가(True)
                  if exists:
                        await PostCrud.remove_like(db, user_id=user_id, post_id=post_id)
                        is_liked = False
                  else:
                        await PostCrud.add_like(db, user_id=user_id, post_id=post_id)
                        is_liked = True

                  await db.commit()
            except Exception:
                  await db.rollback()
                  raise

            # 변경된 최종 좋아요 수 집계 후 결과 반환
            like_count = (
                  await db.execute(select(func.count(PostLike.user_id)).where(PostLike.post_id == post_id))
            ).scalar_one()
            return {"post_id": post_id, "is_liked": is_liked, "like_count": like_count}




      # 댓글 목록 (최신순)
      @staticmethod
      async def get_comments(db: AsyncSession, post_id: int, user_id: Optional[int] = None) -> list[PostCommentRead]:

            # 게시글 존재여부
            post = await PostCrud.get_by_id(db, post_id)
            if not post:
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="게시글을 찾을 수 없습니다.")

            # CRUD에서 최신순으로 가져와 스키마 PostCommentRead로 
            rows = await PostCrud.get_comments(db, post_id=post_id)
            return [
                  PostCommentRead(
                  pc_id=c.pc_id,
                  user_id=c.user_id,
                  post_id=c.post_id,
                  pc_content=c.pc_content,
                  pc_image_url=c.pc_image_url,
                  created_at=c.created_at,
                  nickname=nickname,
                  is_mine=(user_id is not None and c.user_id == user_id),
                  )
                  for c, nickname in rows
            ]

      # 댓글 작성
      @staticmethod
      async def create_comment(
            db: AsyncSession, user_id: int, post_id: int, data: PostCommentCreate
      ) -> PostCommentRead:
            
            #로그인여부
            if not user_id:
                  raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")
            
            #게시글 존재 여부
            post = await PostCrud.get_by_id(db, post_id)
            if not post:
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="게시글을 찾을 수 없습니다.")

            #댓글 생성 후 commit, 실패 시 rollback
            try:
                  created = await PostCrud.create_comment(db, user_id=user_id, post_id=post_id, comment=data)
                  pc_id = created.pc_id
                  await db.commit()
            except Exception:
                  await db.rollback()
                  raise

            #저장된 댓글, 작성자 닉네임 조회  응답 스키마로 반환
            saved = await db.get(PostComment, pc_id)
            nick_row = (await db.execute(select(users_t.c.nickname).where(users_t.c.user_id == user_id))).first()
            return PostCommentRead(
                  pc_id=saved.pc_id,
                  user_id=saved.user_id,
                  post_id=saved.post_id,
                  pc_content=saved.pc_content,
                  pc_image_url=saved.pc_image_url,
                  created_at=saved.created_at,
                  nickname=nick_row.nickname if nick_row else None,
                  is_mine=True,
            )

      #게시글 댓글 수정 (본인만)
      @staticmethod
      async def edit_comment(
            db: AsyncSession, user_id: int, pc_id: int, data: PostCommentUpdate
      ) -> PostCommentRead:
            
            # 로그인여부
            if not user_id:
                  raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")
            
            # 수정할 댓글 존재여부
            comment = await db.get(PostComment, pc_id)
            if not comment:
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="댓글을 찾을 수 없습니다.")
            
            #작성자 본인 확인
            if comment.user_id != user_id:
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인 댓글만 수정할 수 있습니다.")

            try:
                  await PostCrud.update_comment(db, pc_id=pc_id, comment=data)
                  await db.commit()
            except Exception:
                  await db.rollback()
                  raise

            updated = await db.get(PostComment, pc_id)
            nick_row = (
                  await db.execute(select(users_t.c.nickname).where(users_t.c.user_id == updated.user_id))
            ).first()
            return PostCommentRead(
                  pc_id=updated.pc_id,
                  user_id=updated.user_id,
                  post_id=updated.post_id,
                  pc_content=updated.pc_content,
                  pc_image_url=updated.pc_image_url,
                  created_at=updated.created_at,
                  nickname=nick_row.nickname if nick_row else None,
                  is_mine=True,
            )

      #게시글 댓글 삭제 (본인만)
      @staticmethod
      async def remove_comment(db: AsyncSession, user_id: int, pc_id: int) -> None:
            
            #로그인 여 부
            if not user_id:
                  raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")

            # 댓글 존재, 작성자 본인 여부 확인
            comment = await db.get(PostComment, pc_id)
            if not comment:
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="댓글을 찾을 수 없습니다.")
            if comment.user_id != user_id:
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인 댓글만 삭제할 수 있습니다.")

            try:
                  await PostCrud.delete_comment(db, pc_id=pc_id)
                  await db.commit()
            except Exception:
                  await db.rollback()
                  raise