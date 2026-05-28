import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'it', flag: '🇮🇹', label: 'IT' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'ja', flag: '🇯🇵', label: 'JA' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  function change(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem('kdd-lang', code);
  }

  return (
    <div className="lang-switcher">
      {LANGS.map(l => (
        <button
          key={l.code}
          className={`lang-btn${current === l.code ? ' active' : ''}`}
          onClick={() => change(l.code)}
          title={l.label}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}
