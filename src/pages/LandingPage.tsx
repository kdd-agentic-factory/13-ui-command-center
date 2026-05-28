import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, ChevronRight } from 'lucide-react';
import { PROFILES, ProfileId } from '../context/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface LandingPageProps {
  onEnter: (id: ProfileId) => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ProfileId | null>(null);

  return (
    <div className="landing-page">
      {/* Animated background grid */}
      <div className="landing-bg" aria-hidden="true" />

      {/* Language switcher top-right */}
      <div className="landing-lang-row">
        <LanguageSwitcher />
      </div>

      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <Zap size={32} />
          </div>
          <div>
            <div className="landing-title">{t('landing.title', 'KDD RACE ENGINEERING')}</div>
            <div className="landing-subtitle">{t('landing.subtitle', 'Agentic Factory · v3.0 · Race Edition')}</div>
          </div>
        </div>

        <p className="landing-prompt">{t('landing.selectProfile', 'Select your role to enter the platform')}</p>

        {/* Profile cards */}
        <div className="profile-cards">
          {PROFILES.map(profile => (
            <button
              key={profile.id}
              className={`profile-card${selected === profile.id ? ' selected' : ''}`}
              style={{
                '--profile-color': profile.color,
              } as React.CSSProperties}
              onClick={() => setSelected(profile.id)}
            >
              <div className="profile-card-icon">{profile.icon}</div>
              <div className="profile-card-name">{t(profile.nameKey)}</div>
              <div className="profile-card-desc">{t(profile.descKey)}</div>
              <div className="profile-card-modules">
                {profile.accessCount} {parseInt(profile.accessCount) === 1 ? 'module' : 'modules'}
              </div>
              {selected === profile.id && (
                <div className="profile-card-check">✓</div>
              )}
            </button>
          ))}
        </div>

        {/* Enter button */}
        <button
          className="enter-btn"
          disabled={!selected}
          onClick={() => selected && onEnter(selected)}
        >
          {t('landing.enterPlatform', 'Enter Platform')}
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        KDD Agentic Factory · GP Mugello · Round 7 of 20 · 2026
      </div>
    </div>
  );
}
