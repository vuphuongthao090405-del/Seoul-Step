/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { VerdictBanner } from './components/VerdictBanner';
import { CorrectedSentenceCard } from './components/CorrectedSentenceCard';
import { DetailedExplanationSection } from './components/DetailedExplanationSection';
import { AiAnalysisCard } from './components/AiAnalysisCard';
import { AlternativeSuggestionsSection } from './components/AlternativeSuggestionsSection';
import { AuthoritativeReferencesSection } from './components/AuthoritativeReferencesSection';
import { AnalysisHistoryDrawer } from './components/AnalysisHistoryDrawer';
import {
  AnalysisResult,
  AppLanguage,
  AppMode,
  CommunicationStyle,
  KoreanLevel,
} from './types';
import { translations } from './locales';
import { NAVY_THEME } from './theme';
import { Sparkles, AlertCircle, BookOpen, Languages, History, ArrowUp, Edit3 } from 'lucide-react';
import { ContextualTranslator } from './components/ContextualTranslator';

const LOCAL_STORAGE_KEY_LANG = 'seoul_step_lang';
const LOCAL_STORAGE_KEY_LEVEL = 'seoul_step_level';
const LOCAL_STORAGE_KEY_HISTORY = 'seoul_step_history';

export default function App() {
  // App Mode (Analyzer vs Contextual Translator)
  const [appMode, setAppMode] = useState<AppMode>('analyzer');

  // User Preferences (Brand identity is permanently Navy + White + Gray)
  const theme = NAVY_THEME;

  const [lang, setLang] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LANG);
    return (saved as AppLanguage) || 'vi';
  });

  const [level, setLevel] = useState<KoreanLevel>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
    return (saved as KoreanLevel) || 'beginner';
  });

  // Inputs
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [style, setStyle] = useState<CommunicationStyle>('spoken');

  // Analysis State
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslatingContent, setIsTranslatingContent] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const t = translations[lang];

  // Track window scroll for mobile floating action button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_LANG, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, level);
  }, [level]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 25)));
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }, [history]);

  const handleAnalyze = async (overrideText?: string, overrideContext?: string) => {
    const textToAnalyze = (typeof overrideText === 'string' ? overrideText : (text || '')).trim();
    const contextToAnalyze = (typeof overrideContext === 'string' ? overrideContext : (context || '')).trim();

    if (!textToAnalyze) {
      setErrorMessage(t.errorEmptyText);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          context: contextToAnalyze,
          style,
          level,
          uiLanguage: lang,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      setCurrentResult(data);

      // Add to history
      setHistory((prev) => [data, ...prev.filter((item) => item.originalText !== data.originalText)].slice(0, 25));

      // Smooth scroll to results on mobile/desktop
      setTimeout(() => {
        const resultsEl = document.getElementById('results-container');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Failed to analyze:', err);
      setErrorMessage(
        lang === 'vi'
          ? 'Không thể hoàn tất phân tích. Vui lòng kiểm tra kết nối mạng và thử lại.'
          : lang === 'ko'
          ? '문장 분석에 실패했습니다. 네트워크 연결을 확인한 후 다시 시도해 주세요.'
          : 'Failed to complete analysis. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLanguage = async (newLang: AppLanguage) => {
    if (newLang === lang) return;
    const prevLang = lang;
    setLang(newLang);

    // If there is an active analysis result, automatically translate all explanations and suggestions using AI
    if (currentResult) {
      setIsTranslatingContent(true);
      try {
        const res = await fetch('/api/translate-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis: currentResult,
            targetLanguage: newLang,
          }),
        });

        if (res.ok) {
          const translated: AnalysisResult = await res.json();
          setCurrentResult(translated);
          setHistory((prev) =>
            prev.map((item) =>
              item.id === currentResult.id || item.originalText === currentResult.originalText
                ? { ...translated }
                : item
            )
          );
        }
      } catch (err) {
        console.warn('AI translation of analysis failed:', err);
      } finally {
        setIsTranslatingContent(false);
      }
    }
  };

  const handleSelectHistoryItem = (item: AnalysisResult) => {
    setText(item.originalText);
    setContext(item.selectedContext || '');
    setStyle(item.selectedStyle || 'spoken');
    setLevel(item.selectedLevel || 'beginner');
    setCurrentResult(item);
  };

  const handleScrollToEdit = () => {
    const el = document.getElementById('korean-input');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  const handleApplySuggestion = (suggestionSentence: string) => {
    setText(suggestionSentence);
    handleScrollToEdit();
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_HISTORY);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f8fafc] text-slate-900 transition-colors duration-300 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentLang={lang}
        onSelectLang={handleSelectLanguage}
        currentLevel={level}
        onSelectLevel={setLevel}
        historyCount={history.length}
        onToggleHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
        
        {/* 2 CHỨC NĂNG CHÍNH - Prominent Mobile-First Primary Function Hub (Baby Blue theme like AI Q&A) */}
        <section aria-label="Lựa chọn chức năng chính" className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-2 bg-[#f0f7ff] rounded-2xl border-2 border-sky-300/80 shadow-2xs">
            {/* TAB 1: PHÂN TÍCH & HIỆU ĐÍNH */}
            <button
              type="button"
              id="mode-tab-analyzer"
              onClick={() => {
                setAppMode('analyzer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`p-3.5 sm:p-4 rounded-xl text-left transition-all duration-200 flex items-start gap-3 cursor-pointer min-h-[64px] active:scale-[0.99] ${
                appMode === 'analyzer'
                  ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-500/40 border border-sky-500'
                  : 'bg-white/90 hover:bg-white text-sky-950 hover:text-sky-900 border border-sky-200 shadow-2xs'
              }`}
            >
              <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                appMode === 'analyzer' ? 'bg-sky-700/80 text-white' : 'bg-sky-100 text-sky-700 border border-sky-200'
              }`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                {appMode === 'analyzer' && (
                  <div className="flex justify-end">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-700/90 text-white font-bold border border-sky-400">
                      {t.tabActiveBadge}
                    </span>
                  </div>
                )}
                <h2 className="text-sm sm:text-base font-black tracking-tight leading-snug mt-0.5">
                  {t.tabAnalyzer}
                </h2>
                <p className={`text-xs mt-0.5 leading-relaxed font-medium ${
                  appMode === 'analyzer' ? 'text-sky-100' : 'text-sky-800/80'
                }`}>
                  {t.tabAnalyzerDesc}
                </p>
              </div>
            </button>

            {/* TAB 2: DỊCH THUẬT NGỮ CẢNH AI */}
            <button
              type="button"
              id="mode-tab-translator"
              onClick={() => {
                setAppMode('translator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`p-3.5 sm:p-4 rounded-xl text-left transition-all duration-200 flex items-start gap-3 cursor-pointer min-h-[64px] active:scale-[0.99] ${
                appMode === 'translator'
                  ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-500/40 border border-sky-500'
                  : 'bg-white/90 hover:bg-white text-sky-950 hover:text-sky-900 border border-sky-200 shadow-2xs'
              }`}
            >
              <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                appMode === 'translator' ? 'bg-sky-700/80 text-white' : 'bg-sky-100 text-sky-700 border border-sky-200'
              }`}>
                <Languages className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                {appMode === 'translator' && (
                  <div className="flex justify-end">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-700/90 text-white font-bold border border-sky-400">
                      {t.tabActiveBadge}
                    </span>
                  </div>
                )}
                <h2 className="text-sm sm:text-base font-black tracking-tight leading-snug mt-0.5">
                  {t.tabTranslator}
                </h2>
                <p className={`text-xs mt-0.5 leading-relaxed font-medium ${
                  appMode === 'translator' ? 'text-sky-100' : 'text-sky-800/80'
                }`}>
                  {t.tabTranslatorDesc}
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* View Mode 1: DỊCH THUẬT NGỮ CẢNH CHUẨN BẢN XỨ AI */}
        {appMode === 'translator' && (
          <ContextualTranslator
            theme={theme}
            lang={lang}
            onSendToAnalyzer={(koreanText, contextText) => {
              setText(koreanText);
              if (contextText) setContext(contextText);
              setAppMode('analyzer');
              handleAnalyze(koreanText, contextText);
            }}
          />
        )}

        {/* View Mode 2: PHÂN TÍCH & HIỆU ĐÍNH */}
        {appMode === 'analyzer' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Input Workspace */}
            <InputSection
              text={text}
              setText={setText}
              context={context}
              setContext={setContext}
              style={style}
              setStyle={setStyle}
              level={level}
              setLevel={setLevel}
              theme={theme}
              lang={lang}
              onAnalyze={() => handleAnalyze()}
              isLoading={isLoading}
              onSwitchToTranslator={(prefill) => {
                if (prefill) setText(prefill);
                setAppMode('translator');
              }}
            />

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Grouped Results Workspace */}
            {currentResult && (
              <div id="results-container" className="space-y-6 pt-1 animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* AI Realtime Translation Notification Banner */}
                {isTranslatingContent && (
                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-xs font-semibold flex items-center justify-between gap-2 animate-pulse shadow-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0f172a] animate-spin" />
                      <span>{t.translatingAnalysisBanner}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono">
                      AI Realtime Localizing
                    </span>
                  </div>
                )}

                {/* MACRO-SECTION 1: Tổng quan đánh giá */}
                <section aria-labelledby="section-verdict-title" className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h3 id="section-verdict-title" className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500">
                        {t.macroSectionVerdict}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleScrollToEdit}
                      className="text-xs font-bold text-slate-600 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      {t.editSentenceBtn}
                    </button>
                  </div>

                  <VerdictBanner
                    result={currentResult}
                    lang={lang}
                    onEditOriginal={handleScrollToEdit}
                  />

                  <CorrectedSentenceCard result={currentResult} lang={lang} theme={theme} />
                </section>

                {/* MACRO-SECTION 2: Bắt bệnh câu chuẩn mực */}
                <section aria-labelledby="section-explanations-title" className="space-y-3 pt-2">
                  <DetailedExplanationSection result={currentResult} lang={lang} theme={theme} />
                </section>

                {/* MACRO-SECTION 3: Chuyên sâu & Văn hóa */}
                <section aria-labelledby="section-insights-title" className="space-y-4 pt-2">
                  <div className="border-b border-indigo-200/80 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900/60 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                      {t.macroSectionInsights}
                    </span>
                  </div>

                  <AiAnalysisCard
                    analysis={currentResult}
                    uiLanguage={lang}
                    onApplySentence={handleApplySuggestion}
                  />

                  <AlternativeSuggestionsSection
                    result={currentResult}
                    lang={lang}
                    theme={theme}
                    onApplySuggestion={handleApplySuggestion}
                  />

                  <AuthoritativeReferencesSection result={currentResult} lang={lang} theme={theme} />
                </section>
              </div>
            )}
          </div>
        )}
      </main>

      {/* History Drawer */}
      <AnalysisHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleSelectHistoryItem}
        onClear={handleClearHistory}
        lang={lang}
      />

      {/* Footer */}
      <footer className="mt-8 sm:mt-12 py-6 border-t border-slate-200 text-center text-xs text-slate-500 mb-14 md:mb-0">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {lang === 'vi'
              ? 'SEOUL STEP — Trợ lý ngôn ngữ tiếng Hàn chuẩn mực'
              : lang === 'ko'
              ? 'SEOUL STEP — 신뢰할 수 있는 표준 한국어 학습 어시스턴트'
              : 'SEOUL STEP — Authentic Korean Language Assistant'}
          </span>
          <span>
            {lang === 'vi'
              ? 'Đối chiếu từ điển Quốc gia: 표준국어대사전 • 한국어기초사전 • 네이버 국어사전'
              : lang === 'ko'
              ? '국립국어원 표준국어대사전 • 한국어기초사전 • 네이버 국어사전 공인 데이터 연동'
              : 'Grounded in National Institute of Korean Language Dictionaries'}
          </span>
        </div>
      </footer>

      {/* Mobile Floating Quick Action (Edit Input & Scroll to Top) */}
      {showScrollTop && (
        <div className="md:hidden fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {currentResult && appMode === 'analyzer' && (
            <button
              type="button"
              onClick={handleScrollToEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-white text-[#0f172a] border border-slate-300 shadow-lg active:scale-95 transition-all cursor-pointer shadow-slate-900/10"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#0f172a]" />
              <span>{t.editSentenceBtn}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 rounded-full bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-xl active:scale-95 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center backdrop-blur-md border border-slate-800"
            title={t.mobileScrollTop}
            aria-label={t.mobileScrollTop}
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Mobile Bottom Sticky Navigation Bar - Navy + White + Gray */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-xl px-2 py-1 pb-safe transition-all duration-200">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            type="button"
            id="mobile-nav-analyzer"
            onClick={() => {
              setAppMode('analyzer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all min-h-[50px] active:scale-95 ${
              appMode === 'analyzer'
                ? 'text-[#0f172a] font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className={`w-5 h-5 mb-0.5 ${appMode === 'analyzer' ? 'text-[#0f172a] stroke-[2.5]' : 'text-slate-500'}`} />
            <span className="text-[11px] leading-tight">{t.tabAnalyzerShort}</span>
            {appMode === 'analyzer' && <span className="w-1.5 h-1 rounded-full bg-[#0f172a] mt-0.5" />}
          </button>

          <button
            type="button"
            id="mobile-nav-translator"
            onClick={() => {
              setAppMode('translator');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all min-h-[50px] active:scale-95 ${
              appMode === 'translator'
                ? 'text-[#0f172a] font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Languages className={`w-5 h-5 mb-0.5 ${appMode === 'translator' ? 'text-[#0f172a] stroke-[2.5]' : 'text-slate-500'}`} />
            <span className="text-[11px] leading-tight">{t.tabTranslatorShort}</span>
            {appMode === 'translator' && <span className="w-1.5 h-1 rounded-full bg-[#0f172a] mt-0.5" />}
          </button>

          <button
            type="button"
            id="mobile-nav-history"
            onClick={() => setIsHistoryOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all min-h-[50px] text-slate-500 hover:text-slate-900 active:scale-95 relative"
          >
            <div className="relative">
              <History className="w-5 h-5 mb-0.5 text-slate-500" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#0f172a] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {history.length > 9 ? '9+' : history.length}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">{t.mobileNavHistory}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
