import React, { useState } from 'react';
import {
  SpellCheck,
  Binary,
  BookA,
  Compass,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Layers,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { AnalysisResult, AppLanguage, CoreCaseType, StructuredErrorItem } from '../types';
import { translations } from '../locales';
import { ThemeConfig } from '../theme';

interface DetailedExplanationSectionProps {
  result: AnalysisResult;
  lang: AppLanguage;
  theme: ThemeConfig;
}

type DiagnosisStatus = 'good' | 'warning' | 'error';

interface DiagnosisItem {
  id: 'spelling' | 'grammar' | 'wordUsage' | 'context' | 'formality';
  index: number;
  romanIndex: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  status: DiagnosisStatus;
  statusLabel: string;
  shortSummary: string;
  errorItems?: StructuredErrorItem[];
  issues?: string[];
  explanation?: string;
  // context specific
  suitableContexts?: string[];
  whenOriginalCanBeUsed?: string;
  whyUnsuitableForTarget?: string;
  // formality specific
  formalityLevel?: string;
  naturalnessScore?: number;
  naturalnessComment?: string;
}

export const DetailedExplanationSection: React.FC<DetailedExplanationSectionProps> = ({
  result,
  lang,
}) => {
  const t = translations[lang];
  const explanations = result.explanations;
  const coreCase: CoreCaseType =
    result.coreCase ||
    (result.verdict === 'CORRECT'
      ? 'CASE_1_CORRECT'
      : result.verdict === 'GRAMMAR_OK_CONTEXT_UNSUITABLE'
      ? 'CASE_3_CONTEXT_UNSUITABLE'
      : 'CASE_2_HAS_ERRORS');

  if (!explanations) return null;

  // Formality details extraction
  const formalityLevel =
    explanations.formalityAndNaturalness?.formalityLevel ||
    (result.selectedStyle === 'written' ? 'Văn viết (한다체)' : 'Văn nói (해요체)');
  const isFormalityMismatched =
    (explanations.formalityAndNaturalness && !explanations.formalityAndNaturalness.formalityMatch) ||
    coreCase === 'CASE_3_CONTEXT_UNSUITABLE';

  // Helper to determine status type
  const getSpellingStatus = (): DiagnosisStatus => {
    if (explanations.spelling?.hasIssues || (explanations.spelling?.errorItems && explanations.spelling.errorItems.length > 0)) {
      return coreCase === 'CASE_2_HAS_ERRORS' ? 'error' : 'warning';
    }
    return 'good';
  };

  const getGrammarStatus = (): DiagnosisStatus => {
    if (explanations.grammar?.hasIssues || (explanations.grammar?.errorItems && explanations.grammar.errorItems.length > 0)) {
      return coreCase === 'CASE_2_HAS_ERRORS' ? 'error' : 'warning';
    }
    return 'good';
  };

  const getWordUsageStatus = (): DiagnosisStatus => {
    if (explanations.wordUsage?.hasIssues || (explanations.wordUsage?.errorItems && explanations.wordUsage.errorItems.length > 0)) {
      return 'warning';
    }
    return 'good';
  };

  const getContextStatus = (): DiagnosisStatus => {
    if (explanations.context?.hasIssues || coreCase === 'CASE_3_CONTEXT_UNSUITABLE') {
      return 'warning';
    }
    return 'good';
  };

  const getFormalityStatus = (): DiagnosisStatus => {
    if (isFormalityMismatched) {
      return 'warning';
    }
    return 'good';
  };

  const spellingStatus = getSpellingStatus();
  const grammarStatus = getGrammarStatus();
  const wordUsageStatus = getWordUsageStatus();
  const contextStatus = getContextStatus();
  const formalityStatus = getFormalityStatus();

  const getStatusLabel = (status: DiagnosisStatus): string => {
    if (status === 'error') {
      return lang === 'vi' ? 'Có lỗi' : lang === 'ko' ? '오류' : 'Has errors';
    }
    if (status === 'warning') {
      return lang === 'vi' ? 'Cần lưu ý' : lang === 'ko' ? '주의 요망' : 'Attention';
    }
    return lang === 'vi' ? 'Tốt' : lang === 'ko' ? '양호' : 'Good';
  };

  // Build the 5 unified items
  const items: DiagnosisItem[] = [
    // 1. Chính tả & khoảng cách
    {
      id: 'spelling',
      index: 1,
      romanIndex: '①',
      title: lang === 'vi' ? 'Chính tả & khoảng cách' : lang === 'ko' ? '맞춤법 & 띄어쓰기' : 'Spelling & Spacing',
      subtitle: lang === 'vi' ? 'Chính tả từ vựng, biến âm và quy tắc ngắt từ (띄어쓰기)' : lang === 'ko' ? '철자, 오탈자, 띄어쓰기 규정 준수' : 'Orthography and spacing rules',
      icon: <SpellCheck className="w-4 h-4" />,
      status: spellingStatus,
      statusLabel: getStatusLabel(spellingStatus),
      shortSummary: spellingStatus !== 'good'
        ? (explanations.spelling?.issues?.[0] ||
           (explanations.spelling?.errorItems?.[0] ? `${explanations.spelling.errorItems[0].targetWord}: ${explanations.spelling.errorItems[0].whyWrong}` : '') ||
           explanations.spelling?.explanation ||
           (lang === 'vi' ? 'Phát hiện điểm cần hiệu đính về chính tả hoặc khoảng cách từ.' : 'Spelling or spacing adjustments needed.'))
        : (lang === 'vi' ? 'Chính tả và quy tắc khoảng cách từ (띄어쓰기) hoàn toàn chuẩn xác.' : lang === 'ko' ? '맞춤법과 띄어쓰기 규범에 완벽하게 부합합니다.' : 'Correct orthography and standard Korean spacing.'),
      errorItems: explanations.spelling?.errorItems,
      issues: explanations.spelling?.issues,
      explanation: explanations.spelling?.explanation,
    },

    // 2. Ngữ pháp
    {
      id: 'grammar',
      index: 2,
      romanIndex: '②',
      title: lang === 'vi' ? 'Ngữ pháp' : lang === 'ko' ? '문법' : 'Grammar',
      subtitle: lang === 'vi' ? 'Cấu trúc câu, chia động/tính từ, liên kết câu và trợ từ' : lang === 'ko' ? '문장 구조, 동사/형용사 활용, 조사 결합' : 'Sentence structure, particles, and conjugations',
      icon: <Binary className="w-4 h-4" />,
      status: grammarStatus,
      statusLabel: getStatusLabel(grammarStatus),
      shortSummary: grammarStatus !== 'good'
        ? (explanations.grammar?.issues?.[0] ||
           (explanations.grammar?.errorItems?.[0] ? `${explanations.grammar.errorItems[0].targetWord}: ${explanations.grammar.errorItems[0].whyWrong}` : '') ||
           explanations.grammar?.explanation ||
           (lang === 'vi' ? 'Cần điều chỉnh trợ từ, chia động từ hoặc liên kết câu.' : 'Grammar adjustments needed.'))
        : (lang === 'vi' ? 'Cấu trúc ngữ pháp, liên kết câu, trợ từ và chia đuôi câu đúng chuẩn.' : lang === 'ko' ? '문장 구조, 조사, 어미 활용이 문법적으로 정확합니다.' : 'Grammar structure, particles, and conjugations are accurate.'),
      errorItems: explanations.grammar?.errorItems,
      issues: explanations.grammar?.issues,
      explanation: explanations.grammar?.explanation,
    },

    // 3. Cách dùng & sắc thái
    {
      id: 'wordUsage',
      index: 3,
      romanIndex: '③',
      title: lang === 'vi' ? 'Cách dùng & sắc thái' : lang === 'ko' ? '어휘 & 뉘앙스' : 'Usage & Nuance',
      subtitle: lang === 'vi' ? 'Từ vựng thích hợp, từ Hán-Hàn, quán dụng ngữ và độ tự nhiên' : lang === 'ko' ? '어휘 선택, 뉘앙스 및 관용 표현' : 'Vocabulary fit, nuances, and natural expressions',
      icon: <BookA className="w-4 h-4" />,
      status: wordUsageStatus,
      statusLabel: getStatusLabel(wordUsageStatus),
      shortSummary: wordUsageStatus !== 'good'
        ? (explanations.wordUsage?.issues?.[0] ||
           (explanations.wordUsage?.errorItems?.[0] ? `${explanations.wordUsage.errorItems[0].targetWord}: ${explanations.wordUsage.errorItems[0].whyWrong}` : '') ||
           explanations.wordUsage?.explanation ||
           (lang === 'vi' ? 'Từ vựng hoặc sắc thái diễn đạt chưa phản ánh đúng ý đồ tự nhiên.' : 'Vocabulary choice or nuance can be refined.'))
        : (lang === 'vi' ? 'Lựa chọn từ vựng chuẩn xác, tự nhiên, diễn đạt trọn vẹn sắc thái ý nghĩa.' : lang === 'ko' ? '어휘 선택이 자연스럽고 전달 뉘앙스가 정확합니다.' : 'Accurate vocabulary choice and authentic nuance.'),
      errorItems: explanations.wordUsage?.errorItems,
      issues: explanations.wordUsage?.issues,
      explanation: explanations.wordUsage?.explanation,
    },

    // 4. Ngữ cảnh
    {
      id: 'context',
      index: 4,
      romanIndex: '④',
      title: lang === 'vi' ? 'Ngữ cảnh' : lang === 'ko' ? '맥락' : 'Context',
      subtitle: lang === 'vi' ? 'Mức độ tương thích với người nghe, hoàn cảnh và mục đích sử dụng' : lang === 'ko' ? '상황 맥락 및 대화 상대 적합도' : 'Situational suitability and audience alignment',
      icon: <Compass className="w-4 h-4" />,
      status: contextStatus,
      statusLabel: getStatusLabel(contextStatus),
      shortSummary: contextStatus !== 'good'
        ? (explanations.context?.whyUnsuitableForTarget ||
           explanations.context?.issues?.[0] ||
           explanations.context?.explanation ||
           (lang === 'vi' ? 'Chưa phù hợp tối ưu với đối tượng hoặc hoàn cảnh giao tiếp đã chọn.' : 'Context alignment adjustments recommended.'))
        : (lang === 'vi' ? 'Hoàn toàn phù hợp với đối tượng và bối cảnh giao tiếp đã chọn.' : lang === 'ko' ? '선택하신 대화 상대 및 상황 맥락에 완벽하게 어울립니다.' : 'Naturally fits your target audience and context.'),
      issues: explanations.context?.issues,
      explanation: explanations.context?.explanation,
      suitableContexts: (explanations.context as any)?.suitableContexts,
      whenOriginalCanBeUsed: explanations.context?.whenOriginalCanBeUsed,
      whyUnsuitableForTarget: explanations.context?.whyUnsuitableForTarget,
    },

    // 5. Độ trang trọng
    {
      id: 'formality',
      index: 5,
      romanIndex: '⑤',
      title: lang === 'vi' ? 'Độ trang trọng' : lang === 'ko' ? '격식도' : 'Formality',
      subtitle: lang === 'vi' ? 'Đuôi câu kính ngữ, thể câu văn nói (해요체) / văn viết (한다체)' : lang === 'ko' ? '존댓말/반말 격식 등급 및 문체' : 'Politeness register and sentence style match',
      icon: <SlidersHorizontal className="w-4 h-4" />,
      status: formalityStatus,
      statusLabel: getStatusLabel(formalityStatus),
      shortSummary: formalityStatus !== 'good'
        ? (lang === 'vi'
            ? `Thể câu hiện tại (${formalityLevel}) chưa tương thích tối ưu với đối tượng giao tiếp.`
            : lang === 'ko'
            ? `현재 어조(${formalityLevel})가 대상과의 격식 관계에 어색합니다.`
            : `Current register (${formalityLevel}) is not ideal for this audience.`)
        : (lang === 'vi'
            ? `Đúng chuẩn thể câu (${formalityLevel})${explanations.formalityAndNaturalness?.naturalnessScore ? `, độ tự nhiên ${explanations.formalityAndNaturalness.naturalnessScore}/10` : ''}.`
            : lang === 'ko'
            ? `적절한 격식 어조(${formalityLevel})를 갖추고 있습니다.`
            : `Appropriate formality register (${formalityLevel}).`),
      formalityLevel: formalityLevel,
      naturalnessScore: explanations.formalityAndNaturalness?.naturalnessScore,
      naturalnessComment: explanations.formalityAndNaturalness?.naturalnessComment,
      explanation: explanations.formalityAndNaturalness?.naturalnessComment || (lang === 'vi' ? `Độ trang trọng của câu được đánh giá phù hợp với phong cách ${result.selectedStyle === 'written' ? 'văn viết' : 'giao tiếp'}.` : 'Register is appropriate.'),
    },
  ];

  // Auto-expand items needing attention; items that are "good" remain collapsed
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      initial[item.id] = item.status !== 'good';
    });
    return initial;
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allExpanded = items.every((i) => expandedSections[i.id]);
  const toggleAll = () => {
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    items.forEach((item) => {
      updated[item.id] = nextState;
    });
    setExpandedSections(updated);
  };

  const goodCount = items.filter((i) => i.status === 'good').length;
  const warningCount = items.filter((i) => i.status === 'warning').length;
  const errorCount = items.filter((i) => i.status === 'error').length;

  return (
    // SINGLE CONTAINER FOR ENTIRE SECTION: No nested cards!
    <div
      id="section-diagnosis-container"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all"
    >
      {/* Container Header */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0f172a] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {t.diagnosisSectionTitle}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              {t.diagnosisSectionSubtitle}
            </p>
          </div>
        </div>

        {/* Quick status summary badges & Toggle All */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span>{goodCount} {t.countGood}</span>
            </span>

            {warningCount > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-amber-800 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span>{warningCount} {t.countWarning}</span>
                </span>
              </>
            )}

            {errorCount > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-rose-800 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  <span>{errorCount} {t.countError}</span>
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-bold text-slate-600 hover:text-blue-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer border border-slate-200 min-h-[30px] flex items-center gap-1 bg-white active:scale-95"
          >
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden xs:inline">{allExpanded ? t.collapseAllText : t.expandAllText}</span>
          </button>
        </div>
      </div>

      {/* Case 3 Context Notice (if applicable) - Simple embedded notice, no card nesting */}
      {coreCase === 'CASE_3_CONTEXT_UNSUITABLE' && (
        <div className="p-3 bg-amber-50/70 border-b border-amber-200/80 text-xs flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-bold text-amber-950 block">{t.case3Badge}</span>
            <p className="text-amber-900 leading-relaxed font-medium">
              {t.grammarValidNotice}
            </p>
          </div>
        </div>
      )}

      {/* Case 1 All Correct Confirmation (if applicable) */}
      {coreCase === 'CASE_1_CORRECT' && (
        <div className="p-3 bg-blue-50/50 border-b border-blue-200/60 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
          <p className="text-blue-950 font-semibold leading-relaxed">
            {t.allPassedNotice}
          </p>
        </div>
      )}

      {/* 5 ITEMS AS A SINGLE ACCORDION LIST DIVIDED BY CLEAN LINES */}
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const isExpanded = Boolean(expandedSections[item.id]);
          const errorItems = item.errorItems || [];
          const isWarning = item.status === 'warning';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              className={`transition-colors duration-150 ${
                isWarning
                  ? 'bg-amber-50/40 border-l-4 border-l-amber-500'
                  : isError
                  ? 'bg-rose-50/40 border-l-4 border-l-rose-500'
                  : 'bg-white hover:bg-slate-50/50 border-l-4 border-l-transparent'
              }`}
            >
              {/* ACCORDION ROW HEADER */}
              <button
                type="button"
                id={`accordion-row-${item.id}`}
                onClick={() => toggleSection(item.id)}
                className="w-full px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
              >
                {/* Left group: Roman numeral / Icon / Title / Status badge / Short snippet */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  {/* Roman Index Symbol (①, ②, ③, ④, ⑤) */}
                  <span
                    className={`font-mono text-sm sm:text-base font-black shrink-0 ${
                      isWarning
                        ? 'text-amber-700'
                        : isError
                        ? 'text-rose-700'
                        : 'text-blue-700/80'
                    }`}
                  >
                    {item.romanIndex}
                  </span>

                  {/* Icon */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : isError
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.icon}
                  </div>

                  {/* Category Title & Status */}
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.title}
                      </span>

                      {/* STATUS BADGES: Highlighted amber for "Cần lưu ý", clean blue for "Tốt" */}
                      {isWarning && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 fill-amber-500/20" />
                          <span>⚠ {item.statusLabel}</span>
                        </span>
                      )}

                      {isError && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>✕ {item.statusLabel}</span>
                        </span>
                      )}

                      {!isWarning && !isError && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>✓ {item.statusLabel}</span>
                        </span>
                      )}
                    </div>

                    {/* Short Result snippet right in the row */}
                    <div
                      className={`text-xs truncate font-medium ${
                        isWarning
                          ? 'text-amber-950 font-semibold'
                          : isError
                          ? 'text-rose-950 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.shortSummary}
                    </div>
                  </div>
                </div>

                {/* Right side: Chevron toggle */}
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isWarning
                      ? 'text-amber-800'
                      : 'text-slate-400 hover:text-slate-700'
                  } ${isExpanded ? 'rotate-180' : ''}`}
                  aria-label="Toggle details"
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* EXPANDED ACCORDION CONTENT: Placed directly below the row, NO nested card clutter */}
              {isExpanded && (
                <div
                  className={`px-4 sm:px-6 pb-4 pt-1 space-y-2.5 text-xs animate-in fade-in duration-150 ${
                    isWarning
                      ? 'border-t border-amber-200/70 bg-amber-50/20'
                      : isError
                      ? 'border-t border-rose-200/70 bg-rose-50/20'
                      : 'border-t border-slate-100 bg-slate-50/30'
                  }`}
                >
                  {/* Issue tags (if any) */}
                  {item.issues && item.issues.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.issues.map((iss, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-medium border ${
                            isWarning
                              ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isWarning ? 'bg-amber-600' : 'bg-blue-600'}`} />
                          <span>{iss}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Structured Error Items */}
                  {errorItems.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {errorItems.map((err, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-1.5"
                        >
                          {/* 1. Target word & error type */}
                          <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-500">
                                {t.errorTargetLabel}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-900 font-bold font-mono rounded border border-slate-300">
                                {err.targetWord}
                              </span>
                            </div>
                            {err.errorTypeName && (
                              <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                                {err.errorTypeName}
                              </span>
                            )}
                          </div>

                          {/* 2. Why it's wrong */}
                          <div>
                            <span className="font-bold text-amber-900 block mb-0.5">
                              {t.errorWhyLabel}
                            </span>
                            <p className="text-slate-700 leading-relaxed font-medium">
                              {err.whyWrong}
                            </p>
                          </div>

                          {/* 3. How to fix */}
                          <div>
                            <span className="font-bold text-slate-900 block mb-0.5">
                              {t.errorFixLabel}
                            </span>
                            <p className="text-slate-900 font-bold leading-relaxed">
                              {err.howToFix}
                            </p>
                          </div>

                          {/* 4. Example if provided */}
                          {err.example && (
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                              <span className="font-semibold text-slate-500 mr-1.5">
                                {t.errorExampleLabel}
                              </span>
                              <span className="text-slate-900 font-mono font-medium">
                                "{err.example}"
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback to concise paragraph explanation */
                    <p className="text-slate-700 leading-relaxed font-medium pt-1">
                      {item.explanation || t.noIssuesFoundNotice}
                    </p>
                  )}

                  {/* Context-specific notes */}
                  {item.id === 'context' && (item.whenOriginalCanBeUsed || item.whyUnsuitableForTarget) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {item.whenOriginalCanBeUsed && (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                          <span className="font-bold text-slate-800 block">
                            {t.whenOriginalUsedLabel}
                          </span>
                          <p className="text-slate-600 leading-relaxed font-medium">
                            {item.whenOriginalCanBeUsed}
                          </p>
                        </div>
                      )}
                      {item.whyUnsuitableForTarget && (
                        <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs space-y-1">
                          <span className="font-bold text-amber-900 block">
                            {t.whyUnsuitableLabel}
                          </span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {item.whyUnsuitableForTarget}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Context-specific suitable contexts list */}
                  {item.id === 'context' && item.suitableContexts && item.suitableContexts.length > 0 && (
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                      <span className="text-xs font-bold text-slate-700 block">
                        {t.recommendedContextsLabel}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.suitableContexts.map((ctx, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium border border-slate-200"
                          >
                            ✓ {ctx}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formality specific */}
                  {item.id === 'formality' && (
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">
                          {t.sentenceStyleLabel} <span className="font-black text-slate-900">{item.formalityLevel}</span>
                        </span>
                        {typeof item.naturalnessScore === 'number' && (
                          <span className="font-bold text-slate-700">
                            {t.naturalnessScoreLabel} <span className="text-slate-900 font-mono font-bold">{item.naturalnessScore}/10</span>
                          </span>
                        )}
                      </div>
                      {item.naturalnessComment && (
                        <p className="text-slate-600 leading-relaxed font-medium">
                          {item.naturalnessComment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
