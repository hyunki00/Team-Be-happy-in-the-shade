// 담당: 조현기 (원래 오효정, 레시피 댓글 담당이 바뀜)
// 레시피 상세(RecipeDetailPage) 맨 아래 댓글 칸
//   쓰는 곳: <CommentSection targetType="recipe" targetId={recipeId} />
//   쓰는 API (backend/app/routers/recipe_comment.py, 조현기)
//     GET    /recipes/{id}/comments   목록 (최신순, 로그인 안 해도 보임 · 로그인하면 is_mine 채워짐)
//     POST   /recipes/{id}/comments   쓰기 (로그인 필요)
//     PATCH  /recipe-comments/{rc_id} 수정 (본인만)
//     DELETE /recipe-comments/{rc_id} 삭제 (본인만)
//   - 로그인 안 했으면 입력칸 대신 [로그인하고 댓글 쓰기] 버튼
//   - 내 댓글(is_mine)에만 수정 · 삭제 버튼
//   - 쓰기 · 수정 · 삭제가 끝나면 목록을 서버에서 다시 받아 옴 (화면과 DB가 어긋나지 않게)
//   - 글자 수 제한은 constants.js의 COMMENT_MAX (서버 scheme과 같은 500자)
//   - targetType은 지금 "recipe"만 씀 (게시판 댓글은 BoardDetailPage가 따로 처리)
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import { COMMENT_MAX } from "../constants";

// 2026-11-24T05:40:00 → 2026.11.24 05:40
function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 서버가 준 오류 문장 꺼내기 (없으면 기본 문장)
function errorText(err, fallback) {
  if (err.response?.status === 401) return "로그인이 필요해요. 다시 로그인해 주세요.";
  const detail = err.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function CommentSection({ targetId }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [content, setContent] = useState("");       // 새 댓글 입력값
  const [saving, setSaving] = useState(false);      // 버튼 두 번 눌림 막기

  const [editingId, setEditingId] = useState(null); // 수정 중인 댓글 rc_id
  const [editContent, setEditContent] = useState("");

  // 목록 다시 받기 (쓰기 · 수정 · 삭제 뒤, '다시 불러오기' 버튼)
  const loadComments = async () => {
    try {
      const { data } = await api.get(`/recipes/${targetId}/comments`);
      setComments(data);
      setLoadError("");
    } catch {
      setLoadError("댓글을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  // 처음 열 때 · 레시피가 바뀔 때 · 로그인 상태가 바뀔 때 받기 (is_mine이 달라짐)
  useEffect(() => {
    const controller = new AbortController();
    api.get(`/recipes/${targetId}/comments`, { signal: controller.signal })
      .then(({ data }) => {
        setComments(data);
        setLoadError("");
      })
      .catch((err) => {
        if (err.code === "ERR_CANCELED") return;
        setLoadError("댓글을 불러오지 못했어요.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [targetId, isAuthenticated]);

  // 댓글 쓰기
  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await api.post(`/recipes/${targetId}/comments`, { rc_content: text });
      setContent("");
      await loadComments();
    } catch (err) {
      Swal.fire("댓글 등록 실패", errorText(err, "잠시 후 다시 시도해 주세요."), "error");
    } finally {
      setSaving(false);
    }
  };

  // 수정 시작 · 취소
  const startEdit = (comment) => {
    setEditingId(comment.rc_id);
    setEditContent(comment.rc_content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  // 수정 저장
  const handleUpdate = async (rcId) => {
    const text = editContent.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await api.patch(`/recipe-comments/${rcId}`, { rc_content: text });
      cancelEdit();
      await loadComments();
    } catch (err) {
      Swal.fire("댓글 수정 실패", errorText(err, "잠시 후 다시 시도해 주세요."), "error");
    } finally {
      setSaving(false);
    }
  };

  // 삭제 (한 번 더 묻기)
  const handleDelete = async (rcId) => {
    const result = await Swal.fire({
      title: "댓글을 삭제할까요?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;
    setSaving(true);
    try {
      await api.delete(`/recipe-comments/${rcId}`);
      if (editingId === rcId) cancelEdit();
      await loadComments();
    } catch (err) {
      Swal.fire("댓글 삭제 실패", errorText(err, "잠시 후 다시 시도해 주세요."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 입력칸: 로그인했을 때만 */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor="comment-input" className="sr-only">댓글 입력</label>
          <textarea
            id="comment-input"
            rows={3}
            maxLength={COMMENT_MAX}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="만들어 본 후기나 팁을 남겨 주세요"
            className="w-full resize-none rounded-[20px] bg-page px-5 py-4 leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{content.length} / {COMMENT_MAX}</span>
            <button
              type="submit"
              disabled={!content.trim() || saving}
              className="h-11 rounded-pill bg-accent px-6 font-bold text-white hover:bg-accent-dark disabled:opacity-40"
            >
              등록
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-page px-5 py-4">
          <p className="text-ink-soft">로그인하면 댓글을 남길 수 있어요.</p>
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="inline-flex h-11 items-center rounded-pill bg-ink px-5 font-bold text-white"
          >
            로그인하고 댓글 쓰기
          </Link>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <p role="status" className="py-6 text-center text-muted">댓글을 불러오는 중...</p>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p role="alert" className="text-muted">{loadError}</p>
          <button type="button" onClick={() => { setLoading(true); loadComments(); }}
            className="h-10 rounded-pill bg-gray-100 px-5 text-sm font-bold text-ink hover:bg-gray-200">
            다시 불러오기
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-muted">아직 댓글이 없어요. 첫 댓글을 남겨 보세요!</p>
      ) : (
        <>
          <p className="text-sm font-bold text-ink-soft">댓글 {comments.length}개</p>
          <ul className="flex flex-col">
            {comments.map((comment) => (
              <li key={comment.rc_id} className="flex flex-col gap-2 border-t py-4 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-bold text-ink">{comment.nickname}</span>
                    {comment.is_mine && (
                      <span className="ml-2 rounded-pill bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">내 댓글</span>
                    )}
                    <span className="ml-2 text-muted">{formatDate(comment.created_at)}</span>
                  </p>
                  {comment.is_mine && editingId !== comment.rc_id && (
                    <div className="flex gap-1 text-sm text-ink-soft">
                      <button type="button" onClick={() => startEdit(comment)} disabled={saving}
                        className="rounded-pill px-3 py-1 hover:bg-gray-100 disabled:opacity-40">수정</button>
                      <button type="button" onClick={() => handleDelete(comment.rc_id)} disabled={saving}
                        className="rounded-pill px-3 py-1 hover:bg-gray-100 disabled:opacity-40">삭제</button>
                    </div>
                  )}
                </div>

                {editingId === comment.rc_id ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor={`comment-edit-${comment.rc_id}`} className="sr-only">댓글 수정</label>
                    <textarea
                      id={`comment-edit-${comment.rc_id}`}
                      rows={3}
                      maxLength={COMMENT_MAX}
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      className="w-full resize-none rounded-[20px] bg-page px-5 py-4 leading-relaxed"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <span className="mr-auto text-sm text-muted">{editContent.length} / {COMMENT_MAX}</span>
                      <button type="button" onClick={cancelEdit}
                        className="h-10 rounded-pill bg-gray-100 px-4 text-sm font-bold text-ink hover:bg-gray-200">취소</button>
                      <button type="button" onClick={() => handleUpdate(comment.rc_id)} disabled={!editContent.trim() || saving}
                        className="h-10 rounded-pill bg-accent px-4 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-40">저장</button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-ink">{comment.rc_content}</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default CommentSection;