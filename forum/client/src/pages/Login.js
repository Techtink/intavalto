import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { useTranslation } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const API_ORIGIN = (process.env.REACT_APP_API_URL || `${window.location.origin}/api`).replace('/api', '');
const FALLBACK_BG = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80';

const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#50ba4b] focus:border-transparent transition-shadow';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState(FALLBACK_BG);
  const [logoUrl, setLogoUrl] = useState(null);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchWallpaper = async () => {
      try {
        const { data } = await api.get('/settings/login');
        if (data.loginWallpaperUrl) {
          setBgImage(`${API_ORIGIN}${data.loginWallpaperUrl}`);
        }
      } catch (err) { /* use fallback */ }
    };
    const fetchLogo = async () => {
      try {
        const { data } = await api.get('/settings/logo');
        if (data.logoUrl) setLogoUrl(`${API_ORIGIN}${data.logoUrl}`);
      } catch (err) { /* use fallback */ }
    };
    fetchWallpaper();
    fetchLogo();
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/forum');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('login.passwordsNoMatch'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { username, email, password, displayName: displayName || undefined });
      login(data.user, data.token);
      navigate('/forum');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative"
      style={{
        backgroundImage: `url("${bgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        colorScheme: 'light',
      }}
    >
      {/* Light overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Logo */}
      <div className="absolute top-6 left-8 z-20">
        <Link to="/" className="flex items-center gap-1.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Intavalto" className="h-9 object-contain" />
          ) : (
            <span className="text-[20px] font-bold text-white tracking-tight">Intavalto</span>
          )}
        </Link>
      </div>

      {/* Language selector */}
      <div className="absolute top-6 right-8 z-20">
        <LanguageSelector />
      </div>

      {/* Card */}
      <div className="relative z-10 flex items-center justify-end w-full px-6 md:px-16 lg:px-24">
        <div className="w-full max-w-[420px] bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10">

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-[13px]">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <h1 className="text-[26px] font-bold text-gray-900 leading-tight">{t('login.title')}</h1>
              <p className="text-[14px] text-gray-500 mt-1.5">{t('login.subtitle')}</p>

              <form onSubmit={handleLogin} className="mt-7 space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('login.emailLabel')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('login.passwordLabel')}</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')} className={inputClass} required />
                </div>
                <div className="flex items-center justify-end">
                  <Link to="/forgot-password" className="text-[13px] text-[#50ba4b] hover:text-[#45a340] font-medium">
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gray-900 text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  {loading ? t('login.signingIn') : t('login.signIn')}
                </button>
              </form>

              <p className="mt-7 text-center text-[13px] text-gray-500">
                {t('login.newUser')}{' '}
                <button onClick={() => switchMode('register')} className="text-[#50ba4b] hover:text-[#45a340] font-semibold">
                  {t('login.createAccount')}
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[26px] font-bold text-gray-900 leading-tight">{t('login.createAccountTitle')}</h1>
              <p className="text-[14px] text-gray-500 mt-1.5">{t('login.createAccountSubtitle')}</p>

              <form onSubmit={handleRegister} className="mt-7 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('login.usernameLabel')}</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('login.usernamePlaceholder')} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('login.emailLabel')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('login.displayNameLabel')} <span className="text-gray-400 font-normal">{t('login.displayNameOptional')}</span></label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('login.displayNamePlaceholder')} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('login.passwordLabel')}</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordRulePlaceholder')} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{t('login.confirmPasswordLabel')}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('login.confirmPasswordPlaceholder')} className={inputClass} required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gray-900 text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  {loading ? t('login.creatingAccount') : t('login.createAccount')}
                </button>
              </form>

              <p className="mt-7 text-center text-[13px] text-gray-500">
                {t('login.alreadyHaveAccount')}{' '}
                <button onClick={() => switchMode('login')} className="text-[#50ba4b] hover:text-[#45a340] font-semibold">
                  {t('login.signIn')}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
