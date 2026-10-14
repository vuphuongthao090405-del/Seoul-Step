import React from 'react';
import {
  X,
  History,
  Trash2,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AnalysisResult, AppLanguage } from '../types';
import { translations } from '../locales';

interface AnalysisHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisResult[];
  onSelect: (item: AnalysisResult) => void;
  onClear: () => void;
  lang: AppLanguage;
}

export const AnalysisHistoryDrawer: React.FC<AnalysisHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
  lang,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#0f172a]" />
            <h2 className="font-bold text-base text-slate-900">
              {t.historyTitle} ({history.length})
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                title={t.clearHistory}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t.historyEmpty}</p>
            </div>
          ) : (
            history.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                        {item.selectedLevel === 'beginner'
                          ? (lang === 'vi' ? 'Sơ cấp' : lang === 'ko' ? '초급' : 'Beginner')
                          : item.selectedLevel === 'intermediate'
                          ? (lang === 'vi' ? 'Trung cấp' : lang === 'ko' ? '중급' : 'Intermediate')
                          : (lang === 'vi' ? 'Cao cấp' : lang === 'ko' ? '고급' : 'Advanced')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                        {item.selectedStyle === 'spoken' ? t.spokenBadge : t.writtenBadge}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-900 group-hover:text-[#0f172a] transition-colors line-clamp-2">
                    {item.originalText}
                  </div>

                  {item.correctedText && item.correctedText !== item.originalText && (
                    <div className="text-xs text-emerald-700 font-semibold mt-1 truncate">
                      → {item.correctedText}
                    </div>
                  )}

                  {item.translation && (
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      {item.translation}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
