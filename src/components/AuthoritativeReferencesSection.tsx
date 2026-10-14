import React from 'react';
import {
  ExternalLink,
  BookOpen,
  Library,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AnalysisResult, AppLanguage, ReferenceSource } from '../types';
import { translations } from '../locales';
import { ThemeConfig } from '../theme';

interface AuthoritativeReferencesSectionProps {
  result: AnalysisResult;
  lang: AppLanguage;
  theme: ThemeConfig;
}

export const AuthoritativeReferencesSection: React.FC<AuthoritativeReferencesSectionProps> = ({
  result,
  lang,
  theme,
}) => {
  const t = translations[lang];
  const references = result.references || [];
  if (references.length === 0) return null;

  const getSourceIcon = (name: string) => {
    if (name.includes('표준') || name.includes('Standard')) {
      return <ShieldCheck className="w-4 h-4 text-blue-600" />;
    }
    if (name.includes('기초사전') || name.includes('Learners')) {
      return <BookOpen className="w-4 h-4 text-emerald-600" />;
    }
    return <Library className="w-4 h-4 text-stone-600" />;
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl border-2 border-slate-300 shadow-sm transition-all bg-white">
      <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0f172a] text-white shrink-0">
              <Library className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              {t.referencesTitle}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {t.referencesSubtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {references.map((ref: ReferenceSource, idx: number) => {
          return (
            <a
              key={idx}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-400 hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getSourceIcon(ref.name)}
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      {ref.name}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0f172a] transition-colors shrink-0" />
                </div>

                <div className="text-xs font-semibold text-slate-900 mb-1 line-clamp-2">
                  {ref.title}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                  {ref.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-700 group-hover:text-[#0f172a] font-bold">
                <span>{t.visitSource}</span>
                <span className="text-xs">→</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
