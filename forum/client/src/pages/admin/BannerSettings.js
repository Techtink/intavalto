import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useTranslation } from '../../i18n';
import EmailSection from './settings/EmailSection';
import SmsSection from './settings/SmsSection';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');

export default function BannerSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWallpaper, setSavingWallpaper] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [wallpaperPreview, setWallpaperPreview] = useState(null);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [currentWallpaperUrl, setCurrentWallpaperUrl] = useState(null);
  const [settings, setSettings] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/settings');
      setSettings(data);
      setBannerEnabled(data.bannerEnabled || false);
      setBannerTitle(data.bannerTitle || '');
      setBannerSubtitle(data.bannerSubtitle || '');
      if (data.bannerImageUrl) {
        setCurrentImageUrl(`${API_ORIGIN}${data.bannerImageUrl}`);
      }
      if (data.loginWallpaperUrl) {
        setCurrentWallpaperUrl(`${API_ORIGIN}${data.loginWallpaperUrl}`);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('bannerEnabled', bannerEnabled);
      formData.append('bannerTitle', bannerTitle);
      formData.append('bannerSubtitle', bannerSubtitle);
      if (selectedFile) {
        formData.append('bannerImage', selectedFile);
      }

      const { data } = await api.put('/admin/settings', formData);

      if (data.settings.bannerImageUrl) {
        setCurrentImageUrl(`${API_ORIGIN}${data.settings.bannerImageUrl}`);
      }
      setSelectedFile(null);
      setPreview(null);
      showSuccess('Banner settings saved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleWallpaperChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedWallpaper(file);
      setWallpaperPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveWallpaper = async (e) => {
    e.preventDefault();
    if (!selectedWallpaper) return;
    setSavingWallpaper(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('loginWallpaper', selectedWallpaper);
      const { data } = await api.put('/admin/settings/wallpaper', formData);
      if (data.settings.loginWallpaperUrl) {
        setCurrentWallpaperUrl(`${API_ORIGIN}${data.settings.loginWallpaperUrl}`);
      }
      setSelectedWallpaper(null);
      setWallpaperPreview(null);
      showSuccess('Login wallpaper updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update wallpaper');
    } finally {
      setSavingWallpaper(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const displayImage = preview || currentImageUrl;
  const displayWallpaper = wallpaperPreview || currentWallpaperUrl;

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('admin.settings.title')}</h1>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{success}</div>}

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl transition-colors">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('admin.settings.bannerTitle')}</h2>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.settings.bannerEnabled')}</label>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.settings.bannerEnabledDesc')}</p>
          </div>
          <button type="button" onClick={() => setBannerEnabled(!bannerEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              bannerEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              bannerEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Banner Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.settings.bannerImageLabel')}</label>
          {displayImage && (
            <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={displayImage} alt="Banner preview" className="w-full h-48 object-cover" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0 file:text-sm file:font-medium
            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400" />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('admin.settings.bannerImageHint')}</p>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.bannerTitleLabel')}</label>
          <input type="text" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)}
            placeholder={t('admin.settings.bannerTitlePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
        </div>

        {/* Subtitle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.bannerSubtitleLabel')}</label>
          <input type="text" value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)}
            placeholder={t('admin.settings.bannerSubtitlePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
        </div>

        {/* Save */}
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors">
          {saving ? t('admin.settings.saving') : t('admin.settings.saveSettings')}
        </button>
      </form>

      {/* Login Wallpaper */}
      <form onSubmit={handleSaveWallpaper} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mt-6 transition-colors">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('admin.settings.wallpaperTitle')}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('admin.settings.wallpaperDesc')}</p>

        {displayWallpaper && (
          <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img src={displayWallpaper} alt="Login wallpaper preview" className="w-full h-48 object-cover" />
          </div>
        )}

        <input type="file" accept="image/*" onChange={handleWallpaperChange}
          className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4
          file:rounded file:border-0 file:text-sm file:font-medium
          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400" />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('admin.settings.wallpaperHint')}</p>

        <button type="submit" disabled={savingWallpaper || !selectedWallpaper}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors">
          {savingWallpaper ? t('admin.settings.saving') : t('admin.settings.saveWallpaper')}
        </button>
      </form>

      <EmailSection settings={settings} onSuccess={showSuccess} onError={setError} />
      <SmsSection settings={settings} onSuccess={showSuccess} onError={setError} />
    </div>
  );
}
