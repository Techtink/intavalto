import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useTranslation } from '../../../i18n';

const inputClass = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400';

export default function EmailSection({ settings, onSuccess, onError }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [emailFromName, setEmailFromName] = useState('');

  useEffect(() => {
    if (settings) {
      setSmtpHost(settings.smtpHost || '');
      setSmtpPort(settings.smtpPort || '');
      setSmtpUser(settings.smtpUser || '');
      setSmtpPassword(settings.smtpPassword || '');
      setEmailFromAddress(settings.emailFromAddress || '');
      setEmailFromName(settings.emailFromName || '');
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError('');
    try {
      await api.put('/admin/settings/email', {
        smtpHost, smtpPort, smtpUser, smtpPassword, emailFromAddress, emailFromName,
      });
      onSuccess(t('admin.settings.emailSaved'));
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mt-6 transition-colors">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('admin.settings.emailTitle')}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('admin.settings.emailDesc')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.smtpHostLabel')}</label>
          <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)}
            placeholder={t('admin.settings.smtpHostPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.smtpPortLabel')}</label>
          <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)}
            placeholder={t('admin.settings.smtpPortPlaceholder')} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.smtpUserLabel')}</label>
          <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)}
            placeholder={t('admin.settings.smtpUserPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.smtpPasswordLabel')}</label>
          <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)}
            placeholder={t('admin.settings.smtpPasswordPlaceholder')} className={inputClass} />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('admin.settings.smtpPasswordHint')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.emailFromAddressLabel')}</label>
          <input type="email" value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)}
            placeholder={t('admin.settings.emailFromAddressPlaceholder')} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.settings.emailFromNameLabel')}</label>
          <input type="text" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)}
            placeholder={t('admin.settings.emailFromNamePlaceholder')} className={inputClass} />
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors">
        {saving ? t('admin.settings.saving') : t('admin.settings.saveEmailSettings')}
      </button>
    </form>
  );
}
