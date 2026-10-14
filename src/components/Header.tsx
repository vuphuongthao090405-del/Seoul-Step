import React from 'react';
import {
  History,
} from 'lucide-react';
import { AppLanguage, KoreanLevel } from '../types';
import { translations } from '../locales';

interface HeaderProps {
  currentLang: AppLanguage;
  onSelectLang: (lang: AppLanguage) => void;
  currentLevel?: KoreanLevel;
  onSelectLevel?: (level: KoreanLevel) => void;
  historyCount: number;
  onToggleHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onSelectLang,
  historyCount,
  onToggleHistory,
}) => {
  const t = translations[currentLang];

  const langs: { id: AppLanguage; label: string; flag: string; short: string }[] = [
    { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', short: 'VIE' },
    { id: 'ko', label: '한국어', flag: '🇰🇷', short: 'KOR' },
    { id: 'en', label: 'English', flag: '🇬🇧', short: 'ENG' },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 border-b border-slate-200/90 shadow-2xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* App Brand - Navy + White + Gray */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shadow-sm shrink-0 active:scale-95 bg-[#0f172a] text-white border border-slate-800">
              SS
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-[#0f172a] leading-none truncate">
                  SEOUL STEP
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  서울스텝
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Right Controls: High-response Language Switcher + History */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Language Switcher */}
            <div
              role="radiogroup"
              aria-label="Ngôn ngữ giao diện"
              className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 shadow-2xs gap-0.5"
            >
              {langs.map((l) => {
                const isActive = currentLang === l.id;
                return (
                  <button
                    key={l.id}
                    id={`lang-btn-${l.id}`}
                    role="radio"
                    aria-checked={isActive}
                    type="button"
                    onClick={() => onSelectLang(l.id)}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 min-h-[34px] flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-[#0f172a] text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title={l.label}
                  >
                    <span className="text-sm">{l.flag}</span>
                    <span className="text-[11px] tracking-wide font-extrabold">{l.short}</span>
                  </button>
                );
              })}
            </div>

            {/* History Toggle Button */}
            <button
              id="btn-toggle-history"
              type="button"
              onClick={onToggleHistory}
              title={t.historyTitle}
              className="relative p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors border border-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer active:scale-95"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0f172a] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {historyCount > 9 ? '9+' : historyCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
