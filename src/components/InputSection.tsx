import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Trash2,
  BookOpen,
  MessageSquare,
  FileText,
  Lightbulb,
  Compass,
  Keyboard,
  Check,
  ArrowRight,
} from 'lucide-react';
import { AppLanguage, CommunicationStyle, KoreanLevel, PresetSample } from '../types';
import { translations } from '../locales';
import { ThemeConfig } from '../theme';
import { PRESET_SAMPLES } from '../data/samples';
import { playKoreanPronunciation } from '../utils/koreanAudio';

interface InputSectionProps {
  text: string;
  setText: (v: string) => void;
  context: string;
  setContext: (v: string) => void;
  style: CommunicationStyle;
  setStyle: (s: CommunicationStyle) => void;
  level: KoreanLevel;
  setLevel: (l: KoreanLevel) => void;
  theme: ThemeConfig;
  lang: AppLanguage;
  onAnalyze: () => void;
  isLoading: boolean;
  onSwitchToTranslator?: (prefillText?: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  text,
  setText,
  context,
  setContext,
  style,
  setStyle,
  level,
  setLevel,
  lang,
  onAnalyze,
  isLoading,
  onSwitchToTranslator,
}) => {
  const t = translations[lang];
  const [showSamplesModal, setShowSamplesModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const contextPresets = [
    {
      id: 'daily',
      label: t.ctxDaily,
      valMap: {
        vi: 'Hội thoại đời thường với bạn bè, đồng nghiệp',
        ko: '친구 또는 지인과의 일상 대화',
        en: 'Everyday casual conversation',
      },
      style: 'spoken' as CommunicationStyle,
    },
    {
      id: 'friends',
      label: t.ctxFriends,
      valMap: {
        vi: 'Trò chuyện bạn bè thân mật (반말)',
        ko: '친한 친구와의 편안한 대화 (반말)',
        en: 'Casual chat with close friends (반말)',
      },
      style: 'spoken' as CommunicationStyle,
    },
    {
      id: 'elders',
      label: t.ctxElders,
      valMap: {
        vi: 'Nói chuyện kính trọng với thầy cô, người lớn tuổi (존댓말)',
        ko: '선생님 및 어르신께 정중히 말씀드리기 (존댓말)',
        en: 'Respectful speech to teachers and elders (존댓말)',
      },
      style: 'spoken' as CommunicationStyle,
    },
    {
      id: 'business',
      label: t.ctxBusinessEmail,
      valMap: {
        vi: 'Viết thư điện tử công việc cho đối tác',
        ko: '공식 비즈니스 업무 이메일 작성',
        en: 'Official business email correspondence',
      },
      style: 'written' as CommunicationStyle,
    },
    {
      id: 'interview',
      label: t.ctxInterview,
      valMap: {
        vi: 'Phỏng vấn xin việc & trả lời phỏng vấn trang trọng',
        ko: '채용 면접 및 공식 질의응답 (하십시오체)',
        en: 'Job interview and formal Q&A',
      },
      style: 'spoken' as CommunicationStyle,
    },
    {
      id: 'academic',
      label: t.ctxAcademicEssay,
      valMap: {
        vi: 'Bài luận học thuật, viết bài thi TOPIK (한다체)',
        ko: '학술 에세이 및 TOPIK 쓰기 시험 작문 (한다체)',
        en: 'Academic essay and TOPIK writing exam (한다체)',
      },
      style: 'written' as CommunicationStyle,
    },
    {
      id: 'service',
      label: t.ctxServiceShopping,
      valMap: {
        vi: 'Giao dịch, gọi món tại nhà hàng, quán ăn',
        ko: '식당 및 매장 주문과 정중한 요청',
        en: 'Dining order and customer service request',
      },
      style: 'spoken' as CommunicationStyle,
    },
  ];

  // Sync context with active language when selected via preset
  React.useEffect(() => {
    if (selectedPresetId) {
      const preset = contextPresets.find((p) => p.id === selectedPresetId);
      if (preset) {
        setContext(preset.valMap[lang] || preset.valMap.vi);
      }
    }
  }, [lang, selectedPresetId]);

  const handleSpeak = () => {
    if (!text.trim()) return;
    playKoreanPronunciation(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleApplySample = (sample: PresetSample) => {
    setText(sample.korean);
    setContext(sample.contextMap ? sample.contextMap[lang] : sample.context);
    setStyle(sample.style);
    setLevel(sample.level);
    setShowSamplesModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && text.trim()) {
        onAnalyze();
      }
    }
  };

  return (
    // 1. SECTION CONTAINER: Clean white neutral surface, cohesive single input block
    <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4 sm:space-y-5 transition-all">
      {/* Top Header: Subsection title & Secondary 'Ví dụ mẫu' button */}
      <div className="flex flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {t.inputTitle}
          </h3>
        </div>

        {/* 6. BUTTON 'VÍ DỤ MẪU': Secondary subtle button, does not compete with CTA */}
        <button
          id="btn-open-samples"
          type="button"
          onClick={() => setShowSamplesModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors min-h-[36px] cursor-pointer active:scale-95 shadow-2xs shrink-0"
        >
          <Lightbulb className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="hidden xs:inline">{t.quickSamplesBtn}</span>
          <span className="xs:hidden">{t.quickSamplesBtn}</span>
        </button>
      </div>

      {/* 2. Ô 'CÂU HOẶC ĐOẠN VĂN TIẾNG HÀN CẦN KIỂM TRA': Label with light baby blue background, Input with light gray background */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="korean-input"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-950 text-xs font-bold cursor-pointer shadow-2xs"
          >
            <Keyboard className="w-3.5 h-3.5 text-sky-700" />
            <span>{t.inputKoreanLabel}</span>
          </label>

          <div className="flex items-center gap-1.5">
            {text && (
              <>
                <button
                  type="button"
                  onClick={handleSpeak}
                  disabled={isSpeaking}
                  title={t.listenAudio}
                  className="px-2 py-1 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer min-h-[28px]"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-[#0f172a] animate-pulse' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline">{t.listenBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setText('')}
                  title={t.clearBtn}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer min-h-[28px] min-w-[28px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono">
              {text.length} {t.characterCountLabel}
            </span>
          </div>
        </div>

        {/* Ô nhập câu tiếng Hàn: Nền xám nhạt (bg-[#f8fafc]) */}
        <div className="rounded-xl border border-slate-200 bg-[#f8fafc] focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 focus-within:bg-white transition-all p-2.5 sm:p-3 shadow-2xs">
          <textarea
            id="korean-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder={t.inputPlaceholder}
            className="w-full p-1 text-base sm:text-lg font-semibold text-slate-900 bg-transparent placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition-all font-sans leading-relaxed resize-y min-h-[96px]"
          />
        </div>

        {/* Non-Korean input helper notification (Vietnamese or English detected) */}
        {!/[\uac00-\ud7af\u1100-\u11ff]/.test(text) && onSwitchToTranslator && (
          (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(text) || /[a-zA-Z]{3,}/.test(text)) && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-slate-700 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-600 shrink-0" />
                <span>
                  {/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(text)
                    ? t.detectedVietnameseNotice
                    : t.detectedEnglishNotice}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSwitchToTranslator(text)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white shrink-0 transition cursor-pointer self-start sm:self-auto shadow-2xs min-h-[34px]"
              >
                {t.switchToTranslateBtn}
              </button>
            </div>
          )
        )}
      </div>

      {/* 3. Ô 'NGỮ CẢNH & HOÀN CẢNH SỬ DỤNG': Label with light baby blue background, Input with light gray background */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="context-input"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-950 text-xs font-bold cursor-pointer shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-sky-700" />
            <span>{t.inputContextLabel}</span>
          </label>
          <span className="text-[11px] font-medium text-slate-400 tracking-wide">
            {t.inputContextCriticalBadge}
          </span>
        </div>

        {/* Ô nhập ngữ cảnh: Nền xám nhạt (bg-[#f8fafc]) */}
        <input
          id="context-input"
          type="text"
          value={context}
          onChange={(e) => {
            setContext(e.target.value);
            setSelectedPresetId(null);
          }}
          placeholder={t.contextPlaceholder}
          className="w-full px-3.5 py-2.5 text-sm sm:text-base font-semibold text-slate-900 bg-[#f8fafc] border border-slate-200 rounded-xl placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all shadow-2xs"
        />

        {/* 4. CÁC LỰA CHỌN NGỮ CẢNH: Unselected = white + border neutral; Selected = Navy + white text */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none sm:flex-wrap">
          <span className="text-[11px] font-medium text-slate-400 shrink-0 mr-1 hidden sm:inline">
            {t.quickContextPrompt}
          </span>
          {contextPresets.map((preset, idx) => {
            const presetVal = preset.valMap[lang] || preset.valMap.vi;
            const isSelected = selectedPresetId === preset.id || context === presetVal;
            return (
              <button
                key={idx}
                type="button"
                id={`preset-chip-${idx}`}
                onClick={() => {
                  setSelectedPresetId(preset.id);
                  setContext(presetVal);
                  setStyle(preset.style);
                }}
                className={`text-xs px-2.5 py-1.5 rounded-lg border whitespace-nowrap shrink-0 transition-all min-h-[32px] cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-[#0f172a] text-white font-bold border-slate-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Bar: Style segmented switcher & Primary Navy CTA */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Style Segmented Switcher (Neutral background, Navy active) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">{t.styleSectionLabel}</span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-full sm:w-auto">
            <button
              id="style-btn-spoken"
              type="button"
              onClick={() => setStyle('spoken')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] cursor-pointer active:scale-95 ${
                style === 'spoken'
                  ? 'bg-[#0f172a] text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>{t.styleSpoken}</span>
            </button>
            <button
              id="style-btn-written"
              type="button"
              onClick={() => setStyle('written')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[34px] cursor-pointer active:scale-95 ${
                style === 'written'
                  ? 'bg-[#0f172a] text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>{t.styleWritten}</span>
            </button>
          </div>
        </div>

        {/* 7. BUTTON 'AI PHÂN TÍCH CÂU': PRIMARY CTA (Solid Navy, highest visual weight) */}
        <div className="flex items-center gap-2 justify-end">
          <div className="text-xs text-slate-400 hidden lg:flex items-center gap-1 font-medium">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-medium text-slate-500">⌘/Ctrl + Enter</kbd>
          </div>

          <button
            id="btn-submit-analyze"
            type="button"
            onClick={() => onAnalyze()}
            disabled={isLoading || !text.trim()}
            className={`w-full sm:w-auto px-7 py-3 rounded-xl font-black text-sm sm:text-base shadow-sm shadow-slate-900/15 transition-all duration-200 flex items-center justify-center gap-2 min-h-[46px] active:scale-98 cursor-pointer ${
              isLoading || !text.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t.analyzingBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>{t.analyzeBtn}</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Samples Modal - Native Bottom Sheet on Mobile */}
      {showSamplesModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs transition-opacity"
          onClick={() => setShowSamplesModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col pb-safe animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0f172a]" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t.quickSamplesBtn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSamplesModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-sm font-semibold min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer active:scale-95"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-3.5 leading-relaxed">
              {lang === 'vi'
                ? 'Chọn một câu mẫu điển hình dưới đây để kiểm tra ngay khả năng phân tích lỗi chính tả, kính ngữ và ngữ cảnh:'
                : lang === 'ko'
                ? '아래 대표 학습 예시 문장을 선택하여 맞춤법, 존댓말, 문체 분석 기능을 즉시 체험해보세요:'
                : 'Choose a typical learning example below to immediately inspect orthography, honorifics, and register:'}
            </p>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {PRESET_SAMPLES.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleApplySample(sample)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.99] group"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">
                      {sample.title[lang]}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {sample.caseType === 'CASE_1_CORRECT' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {lang === 'vi' ? 'TH 1: Chuẩn' : lang === 'ko' ? '1단계' : 'Case 1'}
                        </span>
                      )}
                      {sample.caseType === 'CASE_2_HAS_ERRORS' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {lang === 'vi' ? 'TH 2: Có lỗi' : lang === 'ko' ? '2단계' : 'Case 2'}
                        </span>
                      )}
                      {sample.caseType === 'CASE_3_CONTEXT_UNSUITABLE' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {lang === 'vi' ? 'TH 3: Sai ngữ cảnh' : lang === 'ko' ? '3단계' : 'Case 3'}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                        {sample.level === 'beginner'
                          ? (lang === 'vi' ? 'Sơ cấp' : lang === 'ko' ? '초급' : 'Beginner')
                          : sample.level === 'intermediate'
                          ? (lang === 'vi' ? 'Trung cấp' : lang === 'ko' ? '중급' : 'Intermediate')
                          : (lang === 'vi' ? 'Cao cấp' : lang === 'ko' ? '고급' : 'Advanced')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-[#0f172a] transition-colors">
                    "{sample.korean}"
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {sample.description[lang]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
