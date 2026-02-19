import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useTranslation } from '../../../i18n';

const inputClass = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400';

export default function SmsSection({ settings, onSuccess, onError }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [termiiApiKey, setTermiiApiKey] = useState('');
  const [termiiSenderId, setTermiiSenderId] = useState('');

  useEffect(() => {
    if (settings) {
      setTermiiApiKey(settings.termiiApiKey || '');
      setTermiiSenderId(settings.termiiSenderId || '');
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError('');
    try {
      await api.put('/admin/settings/sms', { termiiApiKey, termiiSenderId });
      onSuccess(t('admin.settings.smsSaved'));
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mt-6 transition-colors">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('admin.settings.smsTitle')}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('admin.settings.smsDesc')}</p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.termiiApiKeyLabel')}</label>
        <input type="password" value={termiiApiKey} onChange={(e) => setTermiiApiKey(e.target.value)}
          placeholder={t('admin.settings.termiiApiKeyPlaceholder')} className={inputClass} />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('admin.settings.termiiApiKeyHint')}</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.termiiSenderIdLabel')}</label>
        <input type="text" value={termiiSenderId} onChange={(e) => setTermiiSenderId(e.target.value)}
          placeholder={t('admin.settings.termiiSenderIdPlaceholder')} maxLength={11} className={inputClass} />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('admin.settings.termiiSenderIdHint')}</p>
      </div>

      <button type="submit" disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors">
        {saving ? t('admin.settings.saving') : t('admin.settings.saveSmsSettings')}
      </button>
    </form>
  );
}
