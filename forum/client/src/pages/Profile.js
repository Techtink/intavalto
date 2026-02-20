import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import AvatarCropModal from '../components/AvatarCropModal';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', bio: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/users/${id}`);
        setProfile(data);
        setEditData({ displayName: data.displayName || '', bio: data.bio || '' });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const { data } = await api.get(`/posts?page=1&limit=50`);
        const userPosts = data.posts.filter(p => p.User?.id === id);
        setPosts(userPosts);
      } catch (err) {
        console.error('Failed to load posts:', err);
      }
    };
    fetchUserPosts();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put(`/users/${id}`, editData);
      setProfile({ ...profile, ...data.user });
      if (isOwnProfile) setUser({ ...currentUser, ...data.user });
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to update profile');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result);
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropSave = async (blob) => {
    setCropImageSrc(null);
    setAvatarUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      const { data } = await api.put(`/users/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile({ ...profile, avatar: data.user.avatar });
      if (isOwnProfile) setUser({ ...currentUser, avatar: data.user.avatar });
      setSuccess(t('avatar.uploadSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('/uploads')) return `${API_ORIGIN}${avatar}`;
    return avatar;
  };

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">{t('common.loading')}</div>;
  if (!profile) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('profile.userNotFound')}</p>
        <button onClick={() => navigate('/forum')} className="text-[#50ba4b] hover:underline">{t('profile.backToForum')}</button>
      </div>
    </div>
  );

  const avatarUrl = getAvatarUrl(profile.avatar);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/forum')} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 text-sm">
          &larr; {t('profile.backToForum')}
        </button>

        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{success}</div>}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-8 transition-colors">
          {editing ? (
            <form onSubmit={handleUpdate}>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('profile.editProfile')}</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('profile.displayNameLabel')}</label>
                  <input type="text" value={editData.displayName}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Display Name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('profile.bioLabel')}</label>
                  <textarea value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows="3" placeholder={t('profile.bioPlaceholder')} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-[#50ba4b] text-white px-4 py-2 rounded-lg hover:bg-[#45a340] text-sm">{t('profile.saveProfile')}</button>
                <button type="button" onClick={() => setEditing(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">{t('profile.cancelEdit')}</button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                {/* Avatar with hover upload */}
                <div className="relative group flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl font-bold text-[#50ba4b] overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      (profile.displayName || profile.username || '?')[0].toUpperCase()
                    )}
                  </div>
                  {isOwnProfile && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        {avatarUploading ? (
                          <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.displayName || profile.username}</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">@{profile.username}</p>
                  {profile.bio && <p className="text-gray-700 dark:text-gray-300 mt-2">{profile.bio}</p>}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{t('profile.joined')} {new Date(profile.createdAt).toLocaleDateString()}</span>
                    <span>&middot;</span>
                    <span>Reputation: {profile.reputation || 0}</span>
                    <span>&middot;</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${profile.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : profile.role === 'moderator' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>
              {isOwnProfile && (
                <button onClick={() => setEditing(true)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">{t('profile.editProfile')}</button>
              )}
            </div>
          )}
        </div>

        {/* User's Posts */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('profile.recentPosts')}</h2>
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors">{t('profile.noPosts')}</div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <Link key={post.id} to={`/posts/${post.id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-all">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{post.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span>&middot;</span>
                  <span>{post.views} {t('common.views')}</span>
                  <span>&middot;</span>
                  <span>&#9829; {post.likes}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Avatar Crop Modal */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onCancel={() => setCropImageSrc(null)}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}
