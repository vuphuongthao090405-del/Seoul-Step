import React, { useState } from 'react';
import {
  Check,
  Copy,
  Volume2,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { AnalysisResult, AppLanguage, DiffToken } from '../types';
import { translations } from '../locales';
import { ThemeConfig } from '../theme';
import { playKoreanPronunciation } from '../utils/koreanAudio';

interface CorrectedSentenceCardProps {
  result: AnalysisResult;
  lang: AppLanguage;
  theme: ThemeConfig;
}

export const CorrectedSentenceCard: React.FC<CorrectedSentenceCardProps> = ({
  result,
  lang,
  theme,
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTokenNote, setActiveTokenNote] = useState<{ text: string; note: string; original?: string } | null>(null);

  const hasChanges =
    Boolean(result?.correctedText &&
    result?.originalText &&
    String(result.correctedText).trim() !== String(result.originalText).trim());

  const handleCopy = () => {
    navigator.clipboard.writeText(result.correctedText || result.originalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    const textToSpeak = result.correctedText || result.originalText;
    if (!textToSpeak) return;
    playKoreanPronunciation(
      textToSpeak,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border-2 border-slate-300 shadow-sm transition-all ${theme.cardBg}`}>
      {/* Title & Tools */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#0f172a] text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-black text-sm sm:text-base text-slate-900">
            {t.correctedSentenceTitle}
          </h3>
          {hasChanges ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {t.revisedBadge}
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              {t.originalOkBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="btn-speak-corrected"
            onClick={handleSpeak}
            disabled={isSpeaking}
            title={t.listenAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors min-h-[38px] min-w-[38px] justify-center cursor-pointer border border-slate-300 active:scale-95"
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-[#0f172a] animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{t.listenAudio}</span>
          </button>
          <button
            type="button"
            id="btn-copy-corrected"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 transition-colors min-h-[38px] min-w-[38px] justify-center cursor-pointer border border-slate-300 shadow-2xs active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-900 font-bold text-xs">{t.copySuccess}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">{t.copyBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison: Original -> Corrected */}
      {hasChanges && (
        <div className="mb-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {t.originalLabel}
          </div>
          <p className="text-sm line-through text-slate-500 font-mono break-words leading-relaxed">
            {result.originalText}
          </p>
        </div>
      )}

      {/* Corrected Text with Diff Highlighting */}
      <div className="mb-3.5 sm:mb-4">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="text-[#0f172a] font-black">{t.polishedVersionLabel}</span>
          {hasChanges && (
            <span className="text-[11px] text-slate-500 font-normal">
              {t.tapToSeeReasonLabel}
            </span>
          )}
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl bg-slate-50 border-2 border-slate-300 text-base sm:text-2xl font-bold text-slate-900 leading-relaxed font-sans shadow-2xs">
          {result.diffTokens && result.diffTokens.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 leading-loose">
              {result.diffTokens.map((token: DiffToken, idx: number) => {
                if (token.type === 'modified' || token.type === 'added') {
                  const noteContent = token.note || (token.original ? `${t.replaceOriginalPrefix} "${token.original}"` : t.addParticleNote);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTokenNote({ text: token.text, note: noteContent, original: token.original })}
                      className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 font-black underline decoration-emerald-500 decoration-2 transition-all cursor-pointer shadow-2xs active:scale-95 text-left inline-flex"
                    >
                      {token.text}
                    </button>
                  );
                }
                if (token.type === 'removed') {
                  return (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 line-through text-xs sm:text-sm opacity-80"
                    >
                      {token.text}
                    </span>
                  );
                }
                return <span key={idx}>{token.text}</span>;
              })}
            </div>
          ) : (
            <span>{result.correctedText || result.originalText}</span>
          )}
        </div>

        {/* Mobile-Friendly Interactive Token Note Box */}
        {activeTokenNote && (
          <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start justify-between gap-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">"{activeTokenNote.text}"</span>
                {activeTokenNote.original && (
                  <span className="text-emerald-700 ml-1">({t.replaceOriginalPrefix} "{activeTokenNote.original}")</span>
                )}
                <p className="mt-0.5 text-stone-700 leading-relaxed font-medium">{activeTokenNote.note}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTokenNote(null)}
              className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Translation */}
      {result.translation && (
        <div className="pt-3 border-t border-stone-100">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            {t.translationTitle}
          </div>
          <p className="text-xs sm:text-sm font-medium text-stone-700 leading-relaxed">
            {result.translation}
          </p>
        </div>
      )}
    </div>
  );
};
