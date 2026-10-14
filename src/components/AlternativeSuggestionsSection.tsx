import React, { useState } from 'react';
import {
  Volume2,
  Copy,
  Check,
  MessageSquare,
  FileText,
  BadgeCheck,
  Compass,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { AnalysisResult, AppLanguage, ExpressionSuggestion, KoreanLevel } from '../types';
import { translations } from '../locales';
import { ThemeConfig } from '../theme';
import { playKoreanPronunciation } from '../utils/koreanAudio';

interface AlternativeSuggestionsSectionProps {
  result: AnalysisResult;
  lang: AppLanguage;
  theme: ThemeConfig;
  onApplySuggestion?: (sentence: string) => void;
}

export const AlternativeSuggestionsSection: React.FC<AlternativeSuggestionsSectionProps> = ({
  result,
  lang,
  theme,
  onApplySuggestion,
}) => {
  const t = translations[lang];
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | KoreanLevel>('all');

  const suggestions = result.suggestions || [];
  if (suggestions.length === 0) return null;

  const handleCopy = (sentence: string, idx: number) => {
    navigator.clipboard.writeText(sentence);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeak = (sentence: string, idx: number) => {
    if (!sentence) return;
    playKoreanPronunciation(
      sentence,
      () => setSpeakingIndex(idx),
      () => setSpeakingIndex(null)
    );
  };

  const filteredSuggestions = suggestions.filter((sug) => {
    if (selectedFilter === 'all') return true;
    return sug.level === selectedFilter;
  });

  const countByLevel = {
    beginner: suggestions.filter((s) => s.level === 'beginner').length,
    intermediate: suggestions.filter((s) => s.level === 'intermediate').length,
    advanced: suggestions.filter((s) => s.level === 'advanced').length,
  };

  const getLevelBadge = (level: KoreanLevel) => {
    switch (level) {
      case 'beginner':
        return {
          label: lang === 'vi' ? 'Sơ cấp (초급)' : lang === 'ko' ? '초급 (TOPIK 1-2)' : 'Beginner (초급)',
          className: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dotColor: 'bg-emerald-500',
        };
      case 'intermediate':
        return {
          label: lang === 'vi' ? 'Trung cấp (중급)' : lang === 'ko' ? '중급 (TOPIK 3-4)' : 'Intermediate (중급)',
          className: 'bg-blue-50 text-blue-800 border-blue-200/80',
          dotColor: 'bg-blue-500',
        };
      case 'advanced':
        return {
          label: lang === 'vi' ? 'Cao cấp (고급)' : lang === 'ko' ? '고급 (TOPIK 5-6)' : 'Advanced (고급)',
          className: 'bg-purple-50 text-purple-800 border-purple-200/80',
          dotColor: 'bg-purple-500',
        };
      default:
        return {
          label: level,
          className: 'bg-stone-100 text-stone-700 border-stone-200',
          dotColor: 'bg-stone-400',
        };
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border-2 border-slate-300 shadow-sm transition-all ${theme.cardBg}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-indigo-700" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                {t.step4SuggestionsTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {t.suggestionsSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Level Progression Indicator / Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto pb-1 sm:pb-1 scrollbar-none self-stretch sm:self-auto shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap min-h-[32px] flex items-center cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#0f172a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {t.levelFilterAll} ({suggestions.length})
          </button>
          {countByLevel.beginner > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilter('beginner')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[32px] cursor-pointer ${
                selectedFilter === 'beginner'
                  ? 'bg-emerald-600 text-white shadow-xs border border-emerald-700'
                  : 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedFilter === 'beginner' ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>{t.levelFilterBeginner}</span>
              <span className="text-[10px] opacity-90">({countByLevel.beginner})</span>
            </button>
          )}
          {countByLevel.intermediate > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilter('intermediate')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[32px] cursor-pointer ${
                selectedFilter === 'intermediate'
                  ? 'bg-blue-600 text-white shadow-xs border border-blue-700'
                  : 'text-stone-600 hover:text-blue-800 hover:bg-blue-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedFilter === 'intermediate' ? 'bg-white' : 'bg-blue-500'}`} />
              <span>{t.levelFilterIntermediate}</span>
              <span className="text-[10px] opacity-90">({countByLevel.intermediate})</span>
            </button>
          )}
          {countByLevel.advanced > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilter('advanced')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[32px] cursor-pointer ${
                selectedFilter === 'advanced'
                  ? 'bg-purple-600 text-white shadow-xs border border-purple-700'
                  : 'text-stone-600 hover:text-purple-800 hover:bg-purple-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedFilter === 'advanced' ? 'bg-white' : 'bg-purple-500'}`} />
              <span>{t.levelFilterAdvanced}</span>
              <span className="text-[10px] opacity-90">({countByLevel.advanced})</span>
            </button>
          )}
        </div>
      </div>

      {/* Pedagogical Step Ladder Notice */}
      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 font-medium">
        <GraduationCap className="w-4 h-4 text-[#0f172a] shrink-0" />
        <span className="leading-relaxed">
          {t.levelProgressionHint}
        </span>
      </div>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSuggestions.map((sug: ExpressionSuggestion, idx: number) => {
          const isSpoken = sug.style === 'spoken';
          const levelInfo = getLevelBadge(sug.level);
          const borderAccent =
            sug.level === 'beginner'
              ? 'border-l-4 border-l-emerald-500 hover:border-emerald-300'
              : sug.level === 'intermediate'
              ? 'border-l-4 border-l-blue-500 hover:border-blue-300'
              : 'border-l-4 border-l-purple-500 hover:border-purple-300';

          return (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-xl border border-stone-200 bg-white hover:shadow-md transition-all relative overflow-hidden ${borderAccent}`}
            >
              {/* Top metadata tags & action buttons */}
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Level Badge with colored dot */}
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold border flex items-center gap-1.5 ${levelInfo.className}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${levelInfo.dotColor}`} />
                    <span>{levelInfo.label}</span>
                  </span>

                  {/* Style Badge */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                    isSpoken
                      ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                      : 'bg-stone-100 text-stone-800 border border-stone-200/60'
                  }`}>
                    {isSpoken ? <MessageSquare className="w-3 h-3 text-amber-600" /> : <FileText className="w-3 h-3 text-stone-600" />}
                    <span>{isSpoken ? t.spokenBadge : t.writtenBadge}</span>
                  </span>

                  {/* Formality Tag */}
                  {sug.formality && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-stone-100 text-stone-700 border border-stone-200/60">
                      {sug.formality}
                    </span>
                  )}
                </div>

                {/* Quick Audio & Copy buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSpeak(sug.sentence, idx)}
                    title={t.listenAudio}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                  >
                    <Volume2 className={`w-4 h-4 ${speakingIndex === idx ? 'text-blue-600 animate-pulse' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(sug.sentence, idx)}
                    title={t.copySuccess}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Korean Sentence */}
              <div className="text-base sm:text-lg font-bold text-stone-900 font-sans mb-1 leading-snug">
                {sug.sentence}
              </div>

              {/* Pronunciation Guide */}
              {sug.pronunciation && (
                <div className="text-xs text-stone-400 font-mono mb-1.5">
                  [{sug.pronunciation}]
                </div>
              )}

              {/* Translation */}
              <div className="text-sm font-medium text-stone-700 mb-3 bg-stone-50/80 px-3 py-1.5 rounded-lg border border-stone-200/40">
                {sug.translation}
              </div>

              {/* Deep Level Highlights: Vocabulary, Grammar & Distinction */}
              {(sug.vocabularyHighlights || sug.grammarPattern || sug.distinctionNote) && (
                <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {sug.vocabularyHighlights && (
                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-amber-900">
                      <div className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
                        <BookOpen className="w-3 h-3 text-amber-700" />
                        <span>{t.vocabHighlightsLabel}</span>
                      </div>
                      <p className="font-medium text-amber-900 leading-relaxed">
                        {sug.vocabularyHighlights}
                      </p>
                    </div>
                  )}

                  {sug.grammarPattern && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/60 text-indigo-900">
                      <div className="font-bold flex items-center gap-1 text-indigo-950 mb-0.5">
                        <Layers className="w-3 h-3 text-indigo-700" />
                        <span>{t.grammarPatternLabel}</span>
                      </div>
                      <p className="font-medium text-indigo-900 leading-relaxed font-mono">
                        {sug.grammarPattern}
                      </p>
                    </div>
                  )}

                  {sug.distinctionNote && (
                    <div className="sm:col-span-2 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/50 text-emerald-950">
                      <div className="font-bold flex items-center gap-1 text-emerald-900 mb-0.5">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>{t.distinctionLabel}</span>
                      </div>
                      <p className="font-medium text-emerald-900 leading-relaxed">
                        {sug.distinctionNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Situational Context & Nuance Details */}
              <div className="space-y-1.5 pt-2 border-t border-stone-200/60 text-xs">
                {sug.situationalUsage && (
                  <div className="flex items-start gap-1.5 text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60">
                    <Compass className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-700" />
                    <div>
                      <span className="font-bold mr-1">{t.situationalUsageLabel}</span>
                      <span className="leading-relaxed font-medium">{sug.situationalUsage}</span>
                    </div>
                  </div>
                )}

                {sug.nuance && (
                  <div className="flex items-start gap-1.5 text-stone-600 px-1 pt-0.5">
                    <span className="font-semibold text-stone-700 shrink-0">
                      {t.nuanceLabel}
                    </span>
                    <span className="leading-relaxed">{sug.nuance}</span>
                  </div>
                )}

                {sug.reason && !sug.distinctionNote && (
                  <div className="flex items-start gap-1.5 text-stone-500 px-1">
                    <span className="font-bold text-stone-700 shrink-0">
                      {t.whyNaturalLabel}
                    </span>
                    <span className="leading-relaxed">{sug.reason}</span>
                  </div>
                )}
              </div>

              {/* Mobile-Friendly Apply Button */}
              {onApplySuggestion && (
                <div className="pt-2.5 mt-2.5 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 hidden xs:inline">
                    {t.applyToInputLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onApplySuggestion(sug.sentence)}
                    className="w-full xs:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-[#0f172a] hover:bg-[#1e293b] text-white transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 min-h-[38px]"
                    title={t.useInInputBtn}
                  >
                    <span>{t.useInInputBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
