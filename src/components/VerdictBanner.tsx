import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Award,
  Edit3,
} from 'lucide-react';
import { AnalysisResult, AppLanguage, CoreCaseType } from '../types';
import { translations } from '../locales';

interface VerdictBannerProps {
  result: AnalysisResult;
  lang: AppLanguage;
  onEditOriginal?: () => void;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({ result, lang, onEditOriginal }) => {
  const t = translations[lang];

  // Map to the 3 Core Cases
  const coreCase: CoreCaseType =
    result.coreCase ||
    (result.verdict === 'CORRECT'
      ? 'CASE_1_CORRECT'
      : result.verdict === 'GRAMMAR_OK_CONTEXT_UNSUITABLE'
      ? 'CASE_3_CONTEXT_UNSUITABLE'
      : 'CASE_2_HAS_ERRORS');

  const getCaseDetails = (cCase: CoreCaseType) => {
    switch (cCase) {
      case 'CASE_1_CORRECT':
        return {
          caseNumber: '1',
          title: t.case1Badge,
          bg: 'bg-emerald-50/95 border-emerald-300 text-emerald-950 border-l-[6px] border-l-emerald-600',
          badgeBg: 'bg-emerald-600 text-white font-black shadow-2xs',
          icon: <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />,
          desc:
            result.verdictSummary ||
            (lang === 'vi'
              ? 'Câu hoàn toàn chính xác về mặt chính tả, cấu trúc ngữ pháp và phù hợp sử dụng ngay trong ngữ cảnh.'
              : lang === 'ko'
              ? '맞춤법, 문법, 띄어쓰기가 모두 정확하며 해당 상황과 맥락에 완벽하게 부합합니다.'
              : 'Sentence is completely accurate in spelling and grammar, and perfectly fits your target context.'),
        };
      case 'CASE_2_HAS_ERRORS':
        return {
          caseNumber: '2',
          title: t.case2Badge,
          bg: 'bg-rose-50/95 border-rose-300 text-rose-950 border-l-[6px] border-l-rose-600',
          badgeBg: 'bg-rose-600 text-white font-black shadow-2xs',
          icon: <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0" />,
          desc:
            result.verdictSummary ||
            (lang === 'vi'
              ? 'Phát hiện lỗi sai về chính tả, khoảng cách chữ (띄어쓰기) hoặc ngữ pháp cần điều chỉnh.'
              : lang === 'ko'
              ? '맞춤법, 띄어쓰기 또는 문법 규칙에 어긋난 부분이 발견되어 교정이 필요합니다.'
              : 'Orthographical, spacing, or grammatical issues detected that require revision.'),
        };
      case 'CASE_3_CONTEXT_UNSUITABLE':
      default:
        return {
          caseNumber: '3',
          title: t.case3Badge,
          bg: 'bg-amber-50/95 border-amber-300 text-amber-950 border-l-[6px] border-l-amber-600',
          badgeBg: 'bg-amber-600 text-white font-black shadow-2xs',
          icon: <HelpCircle className="w-7 h-7 text-amber-600 shrink-0" />,
          desc:
            result.verdictSummary ||
            (lang === 'vi'
              ? 'Cấu trúc câu hoàn toàn đúng ngữ pháp nhưng mức độ trang trọng hoặc cách diễn đạt chưa phù hợp với ngữ cảnh đã chọn.'
              : lang === 'ko'
              ? '문법 구조는 맞으나, 대화 상대나 상황의 격식에 적절하지 않아 표현 수정이 권장됩니다.'
              : 'Grammatically sound, but register or politeness level does not fit this communication context.'),
        };
    }
  };

  const info = getCaseDetails(coreCase);
  const fn = result.explanations?.formalityAndNaturalness;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-sm transition-all ${info.bg}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        {/* Main Case Info */}
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 shrink-0 p-1 rounded-xl bg-white shadow-2xs">{info.icon}</div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
              <span className={`px-3 py-1 rounded-lg text-xs tracking-tight ${info.badgeBg}`}>
                {info.title}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 border border-slate-300">
                <Sparkles className="w-3 h-3 text-[#0f172a]" />
                {result.aiEngine || "Gemini AI"}
              </span>
              {coreCase === 'CASE_3_CONTEXT_UNSUITABLE' && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {t.grammarValidBadge}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed max-w-2xl opacity-95">
              {info.desc}
            </p>
          </div>
        </div>

        {/* Right Action: Edit Original Button & Naturalness Indicators */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2.5 pt-2.5 md:pt-0 border-t md:border-t-0 border-current/10 shrink-0">
          {onEditOriginal && (
            <button
              type="button"
              id="btn-edit-sentence-banner"
              onClick={onEditOriginal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300/80 shadow-2xs transition-all active:scale-95 min-h-[40px] cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-600" />
              <span>{t.editSentenceBtn}</span>
            </button>
          )}

          {fn && (
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-1 font-semibold opacity-85">
                <ShieldCheck className="w-3.5 h-3.5 opacity-70" />
                <span className="truncate max-w-[120px]">{fn.formalityLevel || (lang === 'ko' ? '표준 존댓말' : lang === 'en' ? 'Standard Polite' : 'Chuẩn mực')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="opacity-75">{t.naturalnessTitle}:</span>
                <span className="font-bold">
                  {fn.naturalnessScore ?? 8}/10
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

