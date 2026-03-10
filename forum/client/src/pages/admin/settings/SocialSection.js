import { useState, useEffect } from 'react';
import api from '../../../utils/api';

const inputClass = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#50ba4b] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400';

export default function SocialSection({ settings, onSuccess, onError }) {
  const [saving, setSaving] = useState(false);
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialX, setSocialX] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');

  useEffect(() => {
    if (settings) {
      setSocialFacebook(settings.socialFacebook || '');
      setSocialX(settings.socialX || '');
      setSocialInstagram(settings.socialInstagram || '');
      setSocialYoutube(settings.socialYoutube || '');
      setSocialTiktok(settings.socialTiktok || '');
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError('');
    try {
      await api.put('/admin/settings/social', {
        socialFacebook, socialX, socialInstagram, socialYoutube, socialTiktok,
      });
      onSuccess('Social media settings saved successfully');
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to save social media settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mt-6 transition-colors">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Social Media Links</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Configure the social media URLs shown in the sidebar &quot;Explore More&quot; popup. Leave blank to hide a platform.</p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook</label>
          <input type="url" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)}
            placeholder="https://facebook.com/yourpage" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">X (Twitter)</label>
          <input type="url" value={socialX} onChange={(e) => setSocialX(e.target.value)}
            placeholder="https://x.com/yourhandle" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram</label>
          <input type="url" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)}
            placeholder="https://instagram.com/yourhandle" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube</label>
          <input type="url" value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)}
            placeholder="https://youtube.com/@yourchannel" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TikTok</label>
          <input type="url" value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)}
            placeholder="https://tiktok.com/@yourhandle" className={inputClass} />
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="bg-[#50ba4b] text-white px-6 py-2 rounded-lg hover:bg-[#45a340] text-sm font-medium disabled:opacity-50 transition-colors">
        {saving ? 'Saving...' : 'Save Social Media Settings'}
      </button>
    </form>
  );
}
