import { create } from 'zustand';

const SUPPORTED_LANGUAGES = ['en', 'fr', 'la', 'de', 'zh'];
const DEFAULT_LANGUAGE = 'en';

const getInitialLanguage = () => {
  const stored = localStorage.getItem('language');
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  return DEFAULT_LANGUAGE;
};

const useLanguageStore = create((set) => ({
  language: getInitialLanguage(),
  setLanguage: (lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
      set({ language: lang });
    }
  },
}));

// Set initial lang attribute
document.documentElement.lang = getInitialLanguage();

export default useLanguageStore;
