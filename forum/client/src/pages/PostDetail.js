import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(false);
  const [editPost, setEditPost] = useState({ title: '', content: '', tags: '' });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [error, setError] = useState('');
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/posts/${id}`);
        setPost(data);
        setComments(data.Comments || []);
      } catch (err) {
        console.error('Failed to load post:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/comments', { content: newComment, postId: id });
      const commentWithUser = { ...data.comment, User: { id: user.id, username: user.username, avatar: user.avatar } };
      setComments([...comments, commentWithUser]);
      setNewComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await api.post(`/posts/${id}/like`);
      setPost({ ...post, likes: data.likes });
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm(t('postDetail.deleteConfirm'))) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate('/forum');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const startEditPost = () => {
    setEditingPost(true);
    setEditPost({
      title: post.title,
      content: post.content,
      tags: (post.tags || []).join(', ')
    });
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const tags = editPost.tags ? editPost.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const { data } = await api.put(`/posts/${id}`, {
        title: editPost.title,
        content: editPost.content,
        tags
      });
      setPost({ ...post, ...data.post });
      setEditingPost(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t('postDetail.deleteCommentConfirm'))) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    try {
      const { data } = await api.put(`/comments/${commentId}`, { content: editCommentContent });
      setComments(comments.map(c => c.id === commentId ? { ...c, content: data.comment.content } : c));
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const canEditPost = user && (post?.userId === user.id || user.role === 'admin');
  const canEditComment = (comment) => user && (comment.userId === user.id || user.role === 'admin');

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">{t('common.loading')}</div>;
  if (!post) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('postDetail.postNotFound')}</p>
        <button onClick={() => navigate('/forum')} className="text-[#50ba4b] hover:underline">{t('postDetail.backToForum')}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button onClick={() => navigate('/forum')} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 text-sm">
          &larr; {t('postDetail.backToForum')}
        </button>

        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* Post */}
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-8 transition-colors">
          {editingPost ? (
            <form onSubmit={handleUpdatePost}>
              <input type="text" value={editPost.title} onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 text-xl font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              <textarea value={editPost.content} onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="8" required />
              <input type="text" value={editPost.tags} onChange={(e) => setEditPost({ ...editPost, tags: e.target.value })}
                placeholder={t('postDetail.tagsPlaceholder')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
              <div className="flex gap-2">
                <button type="submit" className="bg-[#50ba4b] text-white px-4 py-2 rounded-lg hover:bg-[#45a340] text-sm">{t('postDetail.savePost')}</button>
                <button type="button" onClick={() => setEditingPost(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">{t('postDetail.cancelEdit')}</button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {post.isPinned && <span className="text-yellow-500 mr-1">&#9733;</span>}
                    {post.isLocked && <span className="text-gray-400 mr-1">&#128274;</span>}
                    {post.title}
                  </h1>
                </div>
                {canEditPost && (
                  <div className="flex gap-2 ml-4">
                    <button onClick={startEditPost} className="text-[#50ba4b] hover:text-[#45a340] text-sm">{t('postDetail.editPost')}</button>
                    <button onClick={handleDeletePost} className="text-red-600 hover:text-red-800 text-sm">{t('postDetail.deletePost')}</button>
                  </div>
                )}
              </div>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2 mb-6 flex-wrap">
                <Link to={`/profile/${post.User?.id}`} className="hover:text-[#50ba4b]">{post.User?.username}</Link>
                <span>&middot;</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span>&middot;</span>
                <span>{post.views} {t('postDetail.views')}</span>
                {post.Product && (
                  <>
                    <span>&middot;</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: (post.Product.color || '#6B7280') + '18', color: post.Product.color || '#6B7280' }}>
                      {post.Product.name}
                    </span>
                  </>
                )}
                {post.Category && (
                  <>
                    <span>&middot;</span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">{post.Category.name}</span>
                  </>
                )}
                {post.tags?.length > 0 && post.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-[#50ba4b] dark:text-[#50ba4b] rounded text-xs">{tag}</span>
                ))}
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none mb-6 whitespace-pre-wrap text-gray-900 dark:text-gray-200">{post.content}</div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={handleLike} className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">
                  &#9829; <span>{post.likes}</span>
                </button>
                <span className="text-gray-400 dark:text-gray-500 text-sm">{comments.length === 1 ? t('postDetail.commentCount', { count: comments.length }) : t('postDetail.commentCountPlural', { count: comments.length })}</span>
              </div>
            </>
          )}
        </article>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('postDetail.commentsTitle', { count: comments.length })}</h2>

          {user && !post.isLocked && (
            <form onSubmit={handleAddComment} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('postDetail.commentPlaceholder')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#50ba4b] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                rows="3" required />
              <button type="submit" className="bg-[#50ba4b] text-white px-4 py-2 rounded-lg hover:bg-[#45a340] text-sm">{t('postDetail.postComment')}</button>
            </form>
          )}

          {!user && !post.isLocked && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <Link to="/login" className="text-[#50ba4b] hover:underline font-medium">{t('postDetail.loginToComment')}</Link> or{' '}
              <Link to="/login" className="text-[#50ba4b] hover:underline font-medium">{t('postDetail.signupToComment')}</Link> {t('postDetail.joinDiscussion')}
            </div>
          )}

          {post.isLocked && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg text-sm">{t('postDetail.postLocked')}</div>
          )}

          {comments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors">{t('postDetail.noComments')}</div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Link to={`/profile/${comment.User?.id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-[#50ba4b]">
                      {comment.User?.username}
                    </Link>
                    <span className="text-gray-400 dark:text-gray-500">&middot;</span>
                    <span className="text-gray-500 dark:text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {canEditComment(comment) && editingCommentId !== comment.id && (
                    <div className="flex gap-2">
                      <button onClick={() => startEditComment(comment)} className="text-[#50ba4b] hover:text-[#45a340] text-xs">{t('common.edit')}</button>
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-red-600 hover:text-red-800 text-xs">{t('common.delete')}</button>
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div>
                    <textarea value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="3" />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateComment(comment.id)} className="bg-[#50ba4b] text-white px-3 py-1 rounded text-xs hover:bg-[#45a340]">{t('common.save')}</button>
                      <button onClick={() => setEditingCommentId(null)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500">{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
