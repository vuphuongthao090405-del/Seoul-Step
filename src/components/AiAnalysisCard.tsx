import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Lightbulb,
  Compass,
  MessageSquare,
  Send,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Volume2,
  AlertTriangle,
} from "lucide-react";
import { AnalysisResult, AppLanguage } from "../types";
import { translations } from "../locales";
import { playKoreanPronunciation } from "../utils/koreanAudio";

interface AiAnalysisCardProps {
  analysis: AnalysisResult;
  uiLanguage: AppLanguage;
  onApplySentence: (sentence: string) => void;
}

export const AiAnalysisCard: React.FC<AiAnalysisCardProps> = ({
  analysis,
  uiLanguage,
  onApplySentence,
}) => {
  const t = translations[uiLanguage];
  const insights = analysis.aiInsights;

  const [copiedSentence, setCopiedSentence] = useState<string | null>(null);
  const [followupQuestion, setFollowupQuestion] = useState("");
  const [isLoadingFollowup, setIsLoadingFollowup] = useState(false);
  const [followupAnswer, setFollowupAnswer] = useState<string | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const handleSpeakVariation = (sentence: string, idx: number) => {
    if (!sentence) return;
    playKoreanPronunciation(
      sentence,
      () => setSpeakingIdx(idx),
      () => setSpeakingIdx(null)
    );
  };

  const getLocalizedVariation = (v: any, langChoice: AppLanguage) => {
    if (v.labelMap && v.labelMap[langChoice]) {
      return {
        label: v.labelMap[langChoice],
        note: (v.noteMap && v.noteMap[langChoice]) || v.note,
      };
    }

    const rawLabel = String(v.label || "").toLowerCase();
    const rawSentence = String(v.sentence || "");

    const isCasual =
      rawLabel.includes("thân mật") ||
      rawLabel.includes("bạn bè") ||
      rawLabel.includes("kakaotalk") ||
      rawLabel.includes("반말") ||
      rawLabel.includes("casual") ||
      rawLabel.includes("informal") ||
      (!rawSentence.endsWith("요") && !rawSentence.endsWith("다") && !rawSentence.endsWith("까") && !rawSentence.endsWith("죠"));

    const isFormal =
      rawLabel.includes("trang trọng") ||
      rawLabel.includes("công sở") ||
      rawLabel.includes("công vụ") ||
      rawLabel.includes("하십시오") ||
      rawLabel.includes("formal") ||
      rawLabel.includes("business") ||
      rawSentence.includes("습니다") ||
      rawSentence.includes("십니까") ||
      rawSentence.includes("합니다");

    if (langChoice === "ko") {
      if (isCasual) {
        return {
          label: "반말 (카카오톡 / 친한 친구)",
          note: "동갑 친구, 친한 사이에서 부담 없이 사용하는 편안한 일상 구어체입니다.",
        };
      } else if (isFormal) {
        return {
          label: "격식 존댓말 (하십시오체 / 공적 업무)",
          note: "직장 상사, 면접, 비즈니스 이메일, 공식 발표 등 격식을 엄격히 갖추어야 하는 상황에 적합합니다.",
        };
      } else {
        return {
          label: "비격식 존댓말 (해요체 / 일상 표준)",
          note: "사회생활 및 일상 대화에서 가장 널리 쓰이며, 정중하면서도 부드러운 표준 존댓말입니다.",
        };
      }
    }

    if (langChoice === "en") {
      if (isCasual) {
        return {
          label: "Casual / Chat (반말)",
          note: "Informal, casual tone for close friends, peers, or texting on KakaoTalk.",
        };
      } else if (isFormal) {
        return {
          label: "Formal / Business (하십시오체)",
          note: "Formal honorific style ideal for job interviews, corporate emails, or official presentations.",
        };
      } else {
        return {
          label: "Everyday Polite (해요체)",
          note: "Standard polite register for daily social interactions, dining, shopping, and acquaintances.",
        };
      }
    }

    // Default Vietnamese
    if (isCasual) {
      return {
        label: "Thân mật Kakaotalk (반말)",
        note: "Dành cho bạn bè thân thiết, đồng trang lứa hoặc người nhỏ tuổi hơn khi nhắn tin Kakaotalk.",
      };
    } else if (isFormal) {
      return {
        label: "Trang trọng công sở (하십시오체)",
        note: "Dùng trong phỏng vấn tuyển dụng, gửi email báo cáo cấp trên hoặc thuyết trình trang trọng.",
      };
    } else {
      return {
        label: "Lịch sự đời thường (해요체)",
        note: "Cách nói phổ biến và tự nhiên nhất trong đời sống, vừa tôn trọng vừa gần gũi với mọi đối tượng.",
      };
    }
  };

  const quickFollowupPrompts = [
    uiLanguage === "ko"
      ? "카카오톡에서 친구에게 보낼 때 쓰는 자연스러운 반말 표현은?"
      : uiLanguage === "en"
      ? "How to say this casually on KakaoTalk with close friends?"
      : "Cách nói thân mật (반말) tự nhiên khi nhắn tin KakaoTalk với bạn bè?",
    uiLanguage === "ko"
      ? "회사 상사나 격식 있는 자리에서 쓰는 가장 높은 존댓말(하십시오체)은?"
      : uiLanguage === "en"
      ? "How to express this in highest formal honorifics for workplace or interview?"
      : "Đổi sang kính ngữ trang trọng nhất (하십시오체) khi nói với sếp hoặc phỏng vấn?",
    uiLanguage === "ko"
      ? "한국어 원어민들이 일상에서 자주 축약해서 쓰는 표현은?"
      : uiLanguage === "en"
      ? "What is the common spoken contraction native speakers use?"
      : "Người bản xứ Hàn Quốc có cách nói tắt hoặc rút gọn nào thông dụng không?",
    uiLanguage === "ko"
      ? "이 문장의 핵심 조사와 문법 포인트 추가 해설"
      : uiLanguage === "en"
      ? "Explain the key particles and grammatical rules in detail"
      : "Giải thích chi tiết các trợ từ và điểm ngữ pháp trọng tâm của câu",
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSentence(text);
    setTimeout(() => setCopiedSentence(null), 2000);
  };

  const handleAskFollowup = async (questionToAsk: string) => {
    if (!questionToAsk || typeof questionToAsk !== 'string' || !questionToAsk.trim() || isLoadingFollowup) return;
    setIsLoadingFollowup(true);
    setFollowupAnswer(null);

    try {
      const response = await fetch("/api/ai-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: analysis.correctedText || analysis.originalText,
          question: questionToAsk,
          uiLanguage,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      setFollowupAnswer(data.answer);
    } catch (err) {
      setFollowupAnswer(
        uiLanguage === "ko"
          ? "AI 답변을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
          : uiLanguage === "en"
          ? "Failed to get AI answer. Please try again in a moment."
          : "Không thể nhận phản hồi từ AI vào lúc này. Vui lòng thử lại sau giây lát."
      );
    } finally {
      setIsLoadingFollowup(false);
    }
  };

  return (
    <div
      id="ai-analysis-deep-card"
      className="rounded-2xl border border-indigo-200/80 bg-[#fbfbfe] p-4 sm:p-6 shadow-xs space-y-5 transition-all"
    >
      {/* 1. SECTION HEADER: Purple/Indigo Accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {t.aiInsightsTitle}
              </h3>
              {analysis.isAiPowered === false || analysis.isFallbackMode ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {analysis.aiEngine || "Chế độ dự phòng"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                  <Bot className="w-3.5 h-3.5" />
                  {analysis.aiEngine || "Gemini AI"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {uiLanguage === "ko"
                ? "단순 문법 검사를 넘어, 한국어 특유의 화용론 및 소통 문화까지 종합 분석합니다."
                : uiLanguage === "en"
                ? "Analyzes pragmatics, conversational etiquette, and native nuance beyond raw grammar."
                : "Phân tích ngữ dụng học, quy chuẩn giao tiếp và sắc thái bản xứ tự nhiên cùng AI."}
            </p>
          </div>
        </div>

        {insights?.toneNuance && (
          <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-white px-3 py-1.5 border border-indigo-200/80 text-xs font-semibold text-indigo-900 shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>{insights.toneNuance}</span>
          </div>
        )}
      </div>

      {/* 2. SUBSECTION: Lời khuyên Sư phạm, Văn hóa Giao tiếp & Đánh giá Sư phạm Tổng quan của AI (3 Khung màu nổi bật) */}
      <div className="space-y-3">
        <div className="text-[11px] font-black uppercase tracking-wider text-indigo-900/60 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
          <span>{uiLanguage === "ko" ? "언어적 진단 및 문화적 배경" : uiLanguage === "en" ? "LINGUISTIC INSIGHTS & CULTURAL CONTEXT" : "NHẬN ĐỊNH NGÔN NGỮ & BỐI CẢNH VĂN HÓA"}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Khung màu: Lời khuyên Sư phạm (Tone Vàng/Hổ phách ấm áp) */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-4 sm:p-5 transition-all shadow-xs">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Lightbulb className="w-4 h-4 text-amber-700" />
              </div>
              <h4 className="text-sm font-black text-amber-950 tracking-tight">
                {t.aiLearnerTipsTitle}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-amber-950/90 leading-relaxed font-medium">
              {insights?.learnerTips ||
                (uiLanguage === "ko"
                  ? "한국어 표현 시 조사와 동사 서술어의 조응 관계에 유의하여 문법적 완결성을 확보하세요."
                  : uiLanguage === "en"
                  ? "Pay close attention to particle-predicate harmony to ensure syntactic coherence."
                  : "Khi diễn đạt tiếng Hàn, hãy chú ý mối tương quan giữa trợ từ và động từ vị ngữ để bảo đảm sự liên kết ngữ pháp chặt chẽ.")}
            </p>
          </div>

          {/* Khung màu: Văn hóa Giao tiếp & Ứng xử Hàn Quốc (Tone Tím/Indigo sâu sắc) */}
          <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/80 p-4 sm:p-5 transition-all shadow-xs">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Compass className="w-4 h-4 text-indigo-700" />
              </div>
              <h4 className="text-sm font-black text-indigo-950 tracking-tight">
                {t.aiCulturalContextTitle}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-indigo-950/90 leading-relaxed font-medium">
              {insights?.culturalContext ||
                (uiLanguage === "ko"
                  ? "한국어는 화자와 청자의 사회적 관계 및 상호 존중이 종결 어미(존댓말·반말)에 직결되는 고맥락 언어입니다."
                  : uiLanguage === "en"
                  ? "Korean is a high-context hierarchical language where sentence endings directly reflect social distance and etiquette."
                  : "Tiếng Hàn là ngôn ngữ có tính thứ bậc cao. Việc lựa chọn đuôi câu (존댓말 vs 반말) phản ánh trực tiếp sự tôn trọng và khoảng cách giữa người nói và người nghe.")}
            </p>
          </div>
        </div>

        {/* Khung màu: Đánh giá Sư phạm Tổng quan của AI (Tone Xanh lam/Baby Sky) */}
        <div className="rounded-2xl border-2 border-sky-300 bg-sky-50/85 p-4 sm:p-5 shadow-xs mt-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-900 border border-sky-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-4 h-4 text-sky-700" />
            </div>
            <h4 className="text-sm font-black text-sky-950 tracking-tight">
              {t.aiModelAssessmentTitle}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            {insights?.modelAssessment ||
              (uiLanguage === "ko"
                ? "해당 문장은 학습 목적에 적합하며, 실전 소통 상황에 맞는 자연스러운 어휘와 문형을 숙달하는 것이 핵심입니다."
                : uiLanguage === "en"
                ? "This sentence is well-suited for pedagogical analysis; focus on native particle placement and register appropriateness for authentic communication."
                : "Mẫu câu có tính ứng dụng thực tế cao; người học nên chú trọng tính chuẩn xác của trợ từ và lựa chọn đúng mức độ trang trọng để giao tiếp tự nhiên.")}
          </p>
        </div>
      </div>

      {/* 3. SUBSECTION: Biến đổi câu linh hoạt (Tích hợp trực tiếp vào ngôn ngữ toàn ứng dụng, không có nút switch cục bộ) */}
      {insights?.quickVariations && insights.quickVariations.length > 0 && (
        <div className="pt-4 border-t border-indigo-100 space-y-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-indigo-900/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
              <span>{t.aiVariationsSectionTitle}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
              {t.aiVariationsTitle}
            </h4>
          </div>

          {/* 3 Variations Grid - Dynamically adapts to global uiLanguage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {insights.quickVariations.map((v, idx) => {
              const localized = getLocalizedVariation(v, uiLanguage);
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-indigo-100 bg-white p-3.5 hover:border-indigo-300 hover:shadow-xs transition-all shadow-2xs"
                >
                  <div>
                    {/* Top Register Label & Speak button */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="inline-block rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold text-indigo-900">
                        {localized.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSpeakVariation(v.sentence, idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center active:scale-95 cursor-pointer"
                        title={t.listenBtn}
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${speakingIdx === idx ? "text-indigo-600 animate-pulse" : ""}`} />
                      </button>
                    </div>

                    {/* Sentence */}
                    <div className="font-bold text-slate-900 text-base leading-snug break-words">
                      {v.sentence}
                    </div>

                    {/* Usage note */}
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50/80 p-2 rounded-lg border border-slate-100 font-medium">
                      {localized.note}
                    </p>
                  </div>

                  {/* Actions: Copy & Use */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(v.sentence)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-900 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 active:scale-95 cursor-pointer"
                    >
                      {copiedSentence === v.sentence ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">
                            {t.copiedBtn}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>
                            {t.copyBtn}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onApplySentence(v.sentence)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-white hover:bg-indigo-600 px-2.5 py-1 rounded-lg transition-colors active:scale-95 cursor-pointer border border-slate-200 hover:border-indigo-600 shadow-2xs"
                      title={t.useThisSentenceBtn}
                    >
                      <span>
                        {t.useThisSentenceBtn}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SUBSECTION: Hỏi đáp ngôn ngữ tức thì (Toàn bộ đổi sang màu Xanh Baby chuẩn mực) */}
      <div className="mt-5 rounded-2xl bg-[#f0f7ff] border-2 border-sky-300/80 p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
            <span>{t.aiAskInstantTitle}</span>
          </div>
          <h4 className="text-sm sm:text-base font-black text-sky-950 mt-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 shadow-2xs">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <span>{t.aiAskFollowupTitle}</span>
          </h4>
          <p className="text-xs text-sky-900/85 mt-1 font-medium">
            {uiLanguage === "ko"
              ? "이 문장과 관련해 궁금한 점, 다른 상황에서의 말투, 문법 질문을 AI에게 자유롭게 물어보세요."
              : uiLanguage === "en"
              ? "Ask any question about this sentence, nuance shifts, or grammatical rules directly to the AI."
              : "Nhấn chọn gợi ý nhanh hoặc đặt bất kỳ câu hỏi nào để AI giải đáp chi tiết về câu này."}
          </p>
        </div>

        {/* Quick prompt chips (Baby Blue theme) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
          {quickFollowupPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setFollowupQuestion(prompt);
                handleAskFollowup(prompt);
              }}
              disabled={isLoadingFollowup}
              className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs text-sky-950 hover:bg-sky-100 hover:border-sky-300 transition-all text-left disabled:opacity-50 shrink-0 whitespace-nowrap sm:whitespace-normal cursor-pointer shadow-2xs font-semibold"
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Question Form (Baby Blue theme) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskFollowup(followupQuestion);
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
        >
          <div className="relative flex-1">
            <input
              id="ai-followup-input"
              type="text"
              value={followupQuestion}
              onChange={(e) => setFollowupQuestion(e.target.value)}
              placeholder={t.aiAskPlaceholder}
              disabled={isLoadingFollowup}
              className="w-full rounded-xl border border-sky-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-hidden transition-all disabled:opacity-60 min-h-[42px] shadow-2xs font-medium"
            />
          </div>

          <button
            id="ai-followup-submit-btn"
            type="submit"
            disabled={!followupQuestion.trim() || isLoadingFollowup}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 px-6 py-2.5 text-sm font-bold text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-h-[42px] cursor-pointer"
          >
            {isLoadingFollowup ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.aiAskingBtn}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t.aiAskSubmitBtn}</span>
              </>
            )}
          </button>
        </form>

        {/* AI Answer Box (Baby Blue styled) */}
        {followupAnswer && (
          <div
            id="ai-followup-answer-box"
            className="mt-3.5 rounded-xl border border-sky-200 bg-white p-4 shadow-2xs space-y-2 animate-in fade-in"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-sky-950">
              <div className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span>
                {uiLanguage === "ko"
                  ? "AI 답변"
                  : uiLanguage === "en"
                  ? "AI Response"
                  : "Phản hồi giải đáp của AI"}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
              {followupAnswer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
