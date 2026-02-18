import useLanguageStore from '../store/languageStore';
import en from './translations/en.json';
import fr from './translations/fr.json';
import la from './translations/la.json';
import de from './translations/de.json';
import zh from './translations/zh.json';

const translations = { en, fr, la, de, zh };

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);

  const t = (key, params) => {
    let value = getNestedValue(translations[language], key);
    if (value === undefined) value = getNestedValue(translations.en, key);
    if (value === undefined) return key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      });
    }
    return value;
  };

  return { t, language };
}
