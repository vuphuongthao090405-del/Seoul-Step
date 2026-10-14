import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Sparkles,
  Volume2,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  MessageCircle,
  FileText,
  SlidersHorizontal,
  GraduationCap,
  Target,
  Compass,
  Users,
} from 'lucide-react';
import {
  AppLanguage,
  CommunicationStyle,
  KoreanLevel,
  TranslationDirection,
  ContextualTranslationResult,
  TranslationVariation,
} from '../types';
import { translations } from '../locales';
import { ThemeConfig } from '../theme';
import { playKoreanPronunciation } from '../utils/koreanAudio';

interface ContextualTranslatorProps {
  theme: ThemeConfig;
  lang: AppLanguage;
  onSendToAnalyzer: (koreanText: string, contextText: string) => void;
}

export const ContextualTranslator: React.FC<ContextualTranslatorProps> = ({
  theme,
  lang,
  onSendToAnalyzer,
}) => {
  const t = translations[lang];

  // Translator Controls State
  const [inputText, setInputText] = useState('');
  const [direction, setDirection] = useState<TranslationDirection>('vi-ko');
  const [customContext, setCustomContext] = useState('');
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [style, setStyle] = useState<CommunicationStyle>('spoken');
  const [level, setLevel] = useState<KoreanLevel>('intermediate');

  // Request State
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ContextualTranslationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio & Copy State
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Multilingual Variations State - Automatically responsive to global UI language
  const [variationLang, setVariationLang] = useState<string>(lang);
  const [isTranslatingVariations, setIsTranslatingVariations] = useState(false);
  const [translatedVariationsCache, setTranslatedVariationsCache] = useState<
    Record<string, TranslationVariation[]>
  >({});
  const [showOtherLangsDropdown, setShowOtherLangsDropdown] = useState(false);

  useEffect(() => {
    setVariationLang(lang);
  }, [lang]);

  // Sample Prompts for quick demonstration
  const samplePrompts = [
    {
      label:
        lang === 'ko'
          ? '동료에게 검토 부탁'
          : lang === 'en'
          ? 'Ask coworker to review doc'
          : 'Nhờ đồng nghiệp xem giúp tài liệu',
      text:
        lang === 'ko'
          ? '이 서류 시간 나실 때 한번만 검토해 주실 수 있을까요?'
          : lang === 'en'
          ? 'Could you please review this document when you have some free time?'
          : 'Nhờ bạn xem qua giúp tôi tài liệu này khi rảnh nhé.',
      dir: (lang === 'ko' ? 'ko-vi' : lang === 'en' ? 'en-ko' : 'vi-ko') as TranslationDirection,
      context:
        lang === 'ko'
          ? '직장 동료에게 정중히 업무 협조 요청'
          : lang === 'en'
          ? 'Polite workplace request to colleague'
          : 'Nói với đồng nghiệp công sở, nhờ vả lịch sự',
      style: 'spoken' as CommunicationStyle,
      level: 'intermediate' as KoreanLevel,
    },
    {
      label:
        lang === 'ko'
          ? '퇴근 후 저녁 식사 제안'
          : lang === 'en'
          ? 'Dinner invite after work'
          : 'Rủ bạn thân đi ăn tối sau giờ làm',
      text:
        lang === 'ko'
          ? '오늘 퇴근하고 홍대에서 삼겹살에 소주 한잔할래?'
          : lang === 'en'
          ? 'Do you want to grab pork belly and soju in Hongdae after work today?'
          : 'Hôm nay tan làm xong đi ăn thịt nướng làm ly soju ở Hongdae không?',
      dir: (lang === 'ko' ? 'ko-vi' : lang === 'en' ? 'en-ko' : 'vi-ko') as TranslationDirection,
      context:
        lang === 'ko'
          ? '친한 친구 또는 입사 동기 (반말/해요체)'
          : lang === 'en'
          ? 'Close friend or peer colleague (casual banmal/haeyo-che)'
          : 'Bạn thân bằng tuổi, nói chuyện thoải mái thân mật',
      style: 'spoken' as CommunicationStyle,
      level: 'beginner' as KoreanLevel,
    },
    {
      label:
        lang === 'ko'
          ? '팀장님께 연차 휴가 신청'
          : lang === 'en'
          ? 'Request annual leave to manager'
          : 'Xin nghỉ phép với cấp trên (trang trọng)',
      text:
        lang === 'ko'
          ? '팀장님, 개인적인 사유로 이번 주 금요일 연차 휴가를 사용하고자 합니다.'
          : lang === 'en'
          ? 'Manager, I would like to take annual leave this Friday due to personal matters.'
          : 'Thưa sếp, vì việc gia đình nên em xin phép được nghỉ phép vào thứ Sáu tuần này ạ.',
      dir: (lang === 'ko' ? 'ko-vi' : lang === 'en' ? 'en-ko' : 'vi-ko') as TranslationDirection,
      context:
        lang === 'ko'
          ? '직장 상사에게 공식 결재 및 보고'
          : lang === 'en'
          ? 'Formal request to team lead'
          : 'Báo cáo sếp/cấp trên trang trọng bằng email',
      style: 'written' as CommunicationStyle,
      level: 'advanced' as KoreanLevel,
    },
    {
      label:
        lang === 'ko'
          ? '인터뷰 지원 동기'
          : lang === 'en'
          ? 'Job interview motivation'
          : 'Trả lời phỏng vấn xin việc',
      text:
        lang === 'ko'
          ? '귀사의 혁신적인 비전과 저의 실무 역량이 부합한다고 확신하여 지원하게 되었습니다.'
          : lang === 'en'
          ? 'I applied with strong conviction that your company\'s innovative vision aligns with my practical competencies.'
          : 'Tôi nộp đơn vì tin chắc rằng định hướng đổi mới của Quý công ty hoàn toàn phù hợp với năng lực chuyên môn của tôi.',
      dir: (lang === 'ko' ? 'ko-vi' : lang === 'en' ? 'en-ko' : 'vi-ko') as TranslationDirection,
      context:
        lang === 'ko'
          ? '공식 채용 면접 (하십시오체)'
          : lang === 'en'
          ? 'Formal job interview'
          : 'Phỏng vấn tuyển dụng trang trọng',
      style: 'spoken' as CommunicationStyle,
      level: 'advanced' as KoreanLevel,
    },
  ];

  // Quick context chips with multi-language values
  const quickContextChips = [
    {
      id: 'daily',
      label: t.ctxDaily,
      valMap: {
        vi: 'Hội thoại thường ngày, lịch thiệp',
        ko: '일상 대화, 정중한 표현',
        en: 'Daily polite conversation',
      },
    },
    {
      id: 'friends',
      label: t.ctxFriends,
      valMap: {
        vi: 'Bạn bè thân mật (반말), nhắn tin Kakaotalk',
        ko: '친한 친구 (반말), 카카오톡 메시지',
        en: 'Close friends (banmal), casual chat',
      },
    },
    {
      id: 'elders',
      label: t.ctxElders,
      valMap: {
        vi: 'Kính trọng người lớn tuổi, thầy cô giáo (존댓말)',
        ko: '어르신 및 은사님 (존댓말·극존칭)',
        en: 'Elders and teachers (honorifics)',
      },
    },
    {
      id: 'business',
      label: t.ctxBusinessEmail,
      valMap: {
        vi: 'Email công vụ, liên hệ đối tác',
        ko: '비즈니스 업무 이메일, 파트너 연락',
        en: 'Business email, partner communication',
      },
    },
    {
      id: 'interview',
      label: t.ctxInterview,
      valMap: {
        vi: 'Phỏng vấn tuyển dụng, trả lời trang trọng',
        ko: '채용 면접, 격식 있는 답변',
        en: 'Job interview, formal answers',
      },
    },
    {
      id: 'service',
      label: t.ctxServiceShopping,
      valMap: {
        vi: 'Nhà hàng, quán ăn, mua sắm dịch vụ',
        ko: '식당, 매장 및 서비스 이용',
        en: 'Restaurant, shopping, service settings',
      },
    },
  ];

  // Keep quick context chip text synced with the active language
  useEffect(() => {
    if (selectedChipId) {
      const chip = quickContextChips.find((c) => c.id === selectedChipId);
      if (chip) {
        setCustomContext(chip.valMap[lang] || chip.valMap.vi);
      }
    }
  }, [lang, selectedChipId]);

  // Direction options with fully localized labels
  const directionOptions: { id: TranslationDirection; label: string; sub: string }[] = [
    {
      id: 'vi-ko',
      label: lang === 'ko' ? '베트남어 ➔ 한국어' : lang === 'en' ? 'Vietnamese ➔ 한국어' : 'Tiếng Việt ➔ 한국어',
      sub: lang === 'ko' ? '베트남어에서 한국어로' : lang === 'en' ? 'Vietnamese to Korean' : 'Việt sang Hàn',
    },
    {
      id: 'ko-vi',
      label: lang === 'ko' ? '한국어 ➔ 베트남어' : lang === 'en' ? '한국어 ➔ Vietnamese' : '한국어 ➔ Tiếng Việt',
      sub: lang === 'ko' ? '한국어에서 베트남어로' : lang === 'en' ? 'Korean to Vietnamese' : 'Hàn sang Việt',
    },
    {
      id: 'ko-en',
      label: lang === 'ko' ? '한국어 ➔ English' : lang === 'en' ? '한국어 ➔ English' : '한국어 ➔ English',
      sub: lang === 'ko' ? '한국어에서 영어로' : lang === 'en' ? 'Korean to English' : 'Hàn sang Anh',
    },
    {
      id: 'en-ko',
      label: lang === 'ko' ? 'English ➔ 한국어' : lang === 'en' ? 'English ➔ 한국어' : 'English ➔ 한국어',
      sub: lang === 'ko' ? '영어에서 한국어로' : lang === 'en' ? 'English to Korean' : 'Anh sang Hàn',
    },
    {
      id: 'auto',
      label: t.dirAuto,
      sub: lang === 'ko' ? '자동 감지' : lang === 'en' ? 'Auto Detect' : 'Tự động nhận diện',
    },
  ];

  // Learner level options
  const levelOptions: { id: KoreanLevel; label: string; desc: string }[] = [
    {
      id: 'beginner',
      label: lang === 'ko' ? '초급 (TOPIK 1-2)' : lang === 'en' ? 'Beginner (TOPIK 1-2)' : 'Sơ cấp (초급)',
      desc: lang === 'ko' ? '기초 문형·해요체' : lang === 'en' ? 'Basic polite' : 'TOPIK 1-2 • Câu đơn, đuôi 해요',
    },
    {
      id: 'intermediate',
      label: lang === 'ko' ? '중급 (TOPIK 3-4)' : lang === 'en' ? 'Intermediate (TOPIK 3-4)' : 'Trung cấp (중급)',
      desc: lang === 'ko' ? '자연스러운 연결형' : lang === 'en' ? 'Natural flow' : 'TOPIK 3-4 • Tự nhiên, linh hoạt',
    },
    {
      id: 'advanced',
      label: lang === 'ko' ? '고급 (TOPIK 5-6)' : lang === 'en' ? 'Advanced (TOPIK 5-6)' : 'Cao cấp (고급)',
      desc: lang === 'ko' ? '격식체·세련된 어휘' : lang === 'en' ? 'Formal & refined' : 'TOPIK 5-6 • Trang trọng, tinh tế',
    },
  ];

  // Usage style options
  const styleOptions: { id: CommunicationStyle; label: string; desc: string; icon: typeof MessageCircle }[] = [
    {
      id: 'spoken',
      label: t.styleSpoken,
      desc: lang === 'ko' ? '회화, 일상 대화, 메신저' : lang === 'en' ? 'Conversations, chats, daily speech' : 'Hội thoại, nhắn tin, nói chuyện hàng ngày',
      icon: MessageCircle,
    },
    {
      id: 'written',
      label: t.styleWritten,
      desc: lang === 'ko' ? '보고서, 이메일, 시험 쓰기' : lang === 'en' ? 'Reports, emails, formal writing' : 'Email công việc, bài luận, văn bản tài liệu',
      icon: FileText,
    },
  ];

  // Extra AI translation target options for variations
  const otherLanguages = [
    { id: 'ja', label: lang === 'ko' ? '🇯🇵 日本語 (일본어)' : lang === 'en' ? '🇯🇵 日本語 (Japanese)' : '🇯🇵 日本語 (Tiếng Nhật)' },
    { id: 'zh', label: lang === 'ko' ? '🇨🇳 中文 (중국어)' : lang === 'en' ? '🇨🇳 中文 (Chinese)' : '🇨🇳 中文 (Tiếng Trung)' },
    { id: 'fr', label: lang === 'ko' ? '🇫🇷 Français (프랑스어)' : lang === 'en' ? '🇫🇷 Français (French)' : '🇫🇷 Français (Tiếng Pháp)' },
    { id: 'de', label: lang === 'ko' ? '🇩🇪 Deutsch (독일어)' : lang === 'en' ? '🇩🇪 Deutsch (German)' : '🇩🇪 Deutsch (Tiếng Đức)' },
  ];

  const handleTranslate = async () => {
    const trimmedText = (inputText || '').trim();
    if (!trimmedText) {
      setErrorMsg(t.errorEmptyText);
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setTranslatedVariationsCache({});

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmedText,
          direction,
          context: (customContext || '').trim(),
          style,
          level,
          uiLanguage: lang,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: ContextualTranslationResult = await res.json();
      setResult(data);

      setTimeout(() => {
        const resultEl = document.getElementById('translation-result-view');
        if (resultEl) {
          resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Translation error:', err);
      setErrorMsg(
        lang === 'vi'
          ? 'Không thể hoàn tất dịch thuật AI. Vui lòng thử lại.'
          : lang === 'ko'
          ? 'AI 번역 처리에 실패했습니다. 다시 시도해 주세요.'
          : 'Failed to complete AI translation. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (textToCopy: string, key: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSpeak = (textToSpeak: string, key: string, languageCode = 'ko-KR') => {
    if (!textToSpeak.trim()) return;

    if (languageCode.startsWith('ko')) {
      playKoreanPronunciation(
        textToSpeak,
        () => setSpeakingKey(key),
        () => setSpeakingKey(null)
      );
      return;
    }

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = languageCode;
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeakingKey(key);
    utterance.onend = () => setSpeakingKey(null);
    utterance.onerror = () => setSpeakingKey(null);
    window.speechSynthesis.speak(utterance);
  };

  // Fast and responsive swap direction
  const swapDirection = () => {
    // If there is translated text available, smartly swap input and translation
    if (result?.primaryTranslation && inputText.trim()) {
      setInputText(result.primaryTranslation);
      setResult(null);
    }

    if (direction === 'vi-ko') setDirection('ko-vi');
    else if (direction === 'ko-vi') setDirection('vi-ko');
    else if (direction === 'ko-en') setDirection('en-ko');
    else if (direction === 'en-ko') setDirection('ko-en');
    else {
      // Auto: toggle based on text or current language
      setDirection(lang === 'ko' ? 'ko-vi' : 'vi-ko');
    }
  };

  // Handles changing target language for variations explanation
  const handleSelectVariationLanguage = async (targetLang: string) => {
    setVariationLang(targetLang);
    setShowOtherLangsDropdown(false);

    if (['vi', 'ko', 'en'].includes(targetLang)) {
      return;
    }

    if (translatedVariationsCache[targetLang]) {
      return;
    }

    if (!result?.variations || result.variations.length === 0) return;

    setIsTranslatingVariations(true);
    try {
      const res = await fetch('/api/translate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variations: result.variations,
          targetLanguage: targetLang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.variations) {
          setTranslatedVariationsCache((prev) => ({
            ...prev,
            [targetLang]: data.variations,
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to translate variations:', err);
    } finally {
      setIsTranslatingVariations(false);
    }
  };

  // Dynamic Localizers for Formality, Style, Vocab Types, and Variations
  const getLocalizedFormality = (rawLevel?: string) => {
    const lower = String(rawLevel || '').toLowerCase();
    if (lower.includes('하십시오') || lower.includes('trang trọng') || lower.includes('formal') || lower.includes('격식')) {
      return lang === 'ko' ? '격식 존댓말 (하십시오체)' : lang === 'en' ? 'Formal Honorific (하십시오체)' : 'Trang trọng công vụ (하십시오체)';
    }
    if (lower.includes('반말') || lower.includes('thân mật') || lower.includes('casual') || lower.includes('informal') || lower.includes('해체')) {
      return lang === 'ko' ? '친근한 반말체 (반말·해체)' : lang === 'en' ? 'Casual & Intimate (반말)' : 'Thân mật đời thường (반말)';
    }
    if (lower.includes('문어') || lower.includes('한다') || lower.includes('written')) {
      return lang === 'ko' ? '공식 문어체 (한다체)' : lang === 'en' ? 'Formal Written (한다체)' : 'Văn viết chuẩn mực (한다체)';
    }
    return lang === 'ko' ? '비격식 존댓말 (해요체)' : lang === 'en' ? 'Everyday Polite (해요체)' : 'Lịch sự đời thường (해요체)';
  };

  const getLocalizedStyle = (rawStyle?: string) => {
    const lower = String(rawStyle || '').toLowerCase();
    if (lower.includes('viết') || lower.includes('written') || lower.includes('문어')) {
      return lang === 'ko' ? '문어체 (공식 글쓰기)' : lang === 'en' ? 'Written Style' : 'Văn viết (문어체)';
    }
    return lang === 'ko' ? '구어체 (회화·소통)' : lang === 'en' ? 'Spoken & Conversational' : 'Giao tiếp (구어체)';
  };

  const getLocalizedVocabType = (rawType?: string) => {
    const lower = String(rawType || '').toLowerCase();
    if (lower.includes('hán') || lower.includes('sino') || lower.includes('한자')) {
      return lang === 'ko' ? '한자어' : lang === 'en' ? 'Sino-Korean' : 'Từ Hán-Hàn';
    }
    if (lower.includes('ngữ pháp') || lower.includes('grammar') || lower.includes('문법') || lower.includes('mẫu')) {
      return lang === 'ko' ? '핵심 문법' : lang === 'en' ? 'Grammar' : 'Ngữ pháp';
    }
    if (lower.includes('quán dụng') || lower.includes('idiom') || lower.includes('관용')) {
      return lang === 'ko' ? '관용 표현' : lang === 'en' ? 'Idiom' : 'Quán dụng ngữ';
    }
    if (lower.includes('kính ngữ') || lower.includes('honorific') || lower.includes('높임')) {
      return lang === 'ko' ? '존댓말' : lang === 'en' ? 'Honorific' : 'Kính ngữ';
    }
    return lang === 'ko' ? '핵심 어휘' : lang === 'en' ? 'Vocabulary' : 'Từ vựng';
  };

  const getLocalizedVariationFormality = (v: TranslationVariation) => {
    const lower = String(v.formality || v.label || '').toLowerCase();
    if (lower.includes('하십시오') || lower.includes('trang trọng') || lower.includes('formal') || lower.includes('격식')) {
      return lang === 'ko' ? '격식체 (하십시오체)' : lang === 'en' ? 'Formal (하십시오체)' : 'Trang trọng (하십시오체)';
    }
    if (lower.includes('반말') || lower.includes('thân mật') || lower.includes('casual') || lower.includes('informal') || lower.includes('해체')) {
      return lang === 'ko' ? '반말체 (친근한 사이)' : lang === 'en' ? 'Casual (반말체)' : 'Thân mật (반말)';
    }
    return lang === 'ko' ? '해요체 (정중한 일상)' : lang === 'en' ? 'Polite (해요체)' : 'Lịch sự (해요체)';
  };

  // Localizes variations based on active variationLang
  const getLocalizedVariation = (v: TranslationVariation, idx: number): TranslationVariation => {
    if (translatedVariationsCache[variationLang] && translatedVariationsCache[variationLang][idx]) {
      return translatedVariationsCache[variationLang][idx];
    }

    if (v.labelMap && v.labelMap[variationLang as 'vi' | 'ko' | 'en']) {
      return {
        ...v,
        label: v.labelMap[variationLang as 'vi' | 'ko' | 'en'] || v.label,
        meaning: v.meaningMap?.[variationLang as 'vi' | 'ko' | 'en'] || v.meaning || v.sentence,
        contextUsage: v.contextUsageMap?.[variationLang as 'vi' | 'ko' | 'en'] || v.contextUsage,
      };
    }

    const rawLabel = String(v.label || '').toLowerCase();
    const isCasual =
      rawLabel.includes('thân mật') ||
      rawLabel.includes('반말') ||
      rawLabel.includes('casual') ||
      rawLabel.includes('bạn bè');
    const isFormal =
      rawLabel.includes('trang trọng') ||
      rawLabel.includes('하십시오') ||
      rawLabel.includes('formal') ||
      rawLabel.includes('công vụ');

    if (variationLang === 'ko') {
      return {
        ...v,
        label: isCasual
          ? '친근한 반말체 (친구·후배)'
          : isFormal
          ? '격식 있는 하십시오체 (공식·상사)'
          : '정중한 해요체 (일상·동료)',
        meaning: v.meaningMap?.ko || v.meaning || v.sentence,
        contextUsage: v.contextUsageMap?.ko || (isCasual
          ? '친한 친구, 나이가 어린 사람과의 편안한 일상 대화나 메신저에서 사용합니다.'
          : isFormal
          ? '공식적인 업무 보고, 회의, 프레젠테이션, 면접 등 격식을 갖추어야 하는 상황에서 사용합니다.'
          : '일상적인 사회생활, 직장 동료와의 대화, 식당이나 상점에서 예의를 갖출 때 사용합니다.'),
      };
    }

    if (variationLang === 'en') {
      return {
        ...v,
        label: isCasual
          ? 'Casual & Intimate (반말)'
          : isFormal
          ? 'Formal & Professional (하십시오체)'
          : 'Polite & Everyday (해요체)',
        meaning: v.meaningMap?.en || v.meaning || v.sentence,
        contextUsage: v.contextUsageMap?.en || (isCasual
          ? 'Informal situations with close friends, peers, or younger people'
          : isFormal
          ? 'Official workplace communications, presentations, and formal interviews'
          : 'Standard polite speech for daily social interactions, dining, and colleagues'),
      };
    }

    // Default Vietnamese
    return {
      ...v,
      label: isCasual
        ? 'Thân mật bạn bè (반말)'
        : isFormal
        ? 'Trang trọng công vụ (하십시오체)'
        : 'Lịch sự đời thường (해요체)',
      meaning: v.meaningMap?.vi || v.meaning,
      contextUsage: v.contextUsageMap?.vi || v.contextUsage || 'Phù hợp giao tiếp tự nhiên chuẩn mực.',
    };
  };

  return (
    <div id="contextual-translator-section" className="space-y-4 sm:space-y-6">
      {/* SECTION 1: Workspace - Configuration & Input Area */}
      <div className="p-4 sm:p-6 rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-sm space-y-4 sm:space-y-5 transition-all">
        
        {/* Workspace Header: Title & Description */}
        <div className="border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {t.translatorSectionSetup}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {t.translatorTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
              {t.translatorSubtitle}
            </p>
          </div>
        </div>

        {/* =========================================================================
            NHÓM 1: HƯỚNG CHUYỂN ĐỔI NGÔN NGỮ (LANGUAGE DIRECTION)
            - Nền chữ màu xanh baby nhạt
            - Khung lựa chọn màu xám nhạt
           ========================================================================= */}
        <div className="space-y-2">
          {/* Header Nhãn: Nền chữ màu xanh baby nhạt */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-950 text-xs font-bold shadow-2xs">
              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>{t.directionSectionTitle}</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {t.directionSectionSubtitle}
            </span>
          </div>

          {/* Khung ô lựa chọn bên dưới: Màu xám nhạt */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 sm:p-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
              {directionOptions.map((item) => {
                const isSelected = direction === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDirection(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5 shrink-0 active:scale-95 border ${
                      isSelected
                        ? 'bg-blue-700 text-white font-bold border-blue-800 shadow-2xs ring-2 ring-blue-200/70'
                        : 'bg-white border-blue-200/70 text-blue-900/90 hover:bg-blue-50/80 hover:text-blue-950 font-medium'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            NHÓM 2: LEARNER LEVEL & USAGE MODE
            - Nền chữ màu xanh baby nhạt cho từng tiêu đề
            - Khung lựa chọn bên dưới màu xám nhạt
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          
          {/* KHỐI: LEARNER LEVEL (TRÌNH ĐỘ NGƯỜI HỌC) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-950 text-xs font-bold shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span>{t.learnerLevelSectionTitle}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t.learnerLevelBadge}
              </span>
            </div>

            {/* Ô chọn bên dưới: Màu xám nhạt với màu riêng biệt cho từng cấp độ */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 sm:p-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                {levelOptions.map((lvl) => {
                  const isSelected = level === lvl.id;
                  
                  // Màu sắc đặc trưng riêng biệt cho từng cấp độ:
                  // Sơ cấp: Emerald / Xanh ngọc
                  // Trung cấp: Amber / Vàng hổ phách
                  // Cao cấp: Purple / Tím hoàng gia
                  const levelTheme =
                    lvl.id === 'beginner'
                      ? isSelected
                        ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-2xs ring-2 ring-emerald-200/70'
                        : 'bg-white border-emerald-300/80 text-emerald-800 hover:bg-emerald-50/80 font-semibold'
                      : lvl.id === 'intermediate'
                      ? isSelected
                        ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-2xs ring-2 ring-amber-200/70'
                        : 'bg-white border-amber-300/80 text-amber-800 hover:bg-amber-50/80 font-semibold'
                      : isSelected
                      ? 'bg-purple-700 text-white font-bold border-purple-800 shadow-2xs ring-2 ring-purple-200/70'
                      : 'bg-white border-purple-300/80 text-purple-900 hover:bg-purple-50/80 font-semibold';

                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setLevel(lvl.id)}
                      className={`px-2 py-2 rounded-xl text-xs transition-all cursor-pointer min-h-[38px] flex items-center justify-center text-center active:scale-95 border ${levelTheme}`}
                    >
                      <span>{lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KHỐI: USAGE MODE (MỤC ĐÍCH SỬ DỤNG) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-950 text-xs font-bold shadow-2xs">
                <Target className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span>{t.usageModeSectionTitle}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t.usageModeBadge}
              </span>
            </div>

            {/* Ô chọn bên dưới: Màu xám nhạt */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 sm:p-2.5">
              <div className="grid grid-cols-2 gap-1.5">
                {styleOptions.map((opt) => {
                  const isSelected = style === opt.id;
                  const IconComponent = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStyle(opt.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer min-h-[38px] flex items-center justify-center gap-1.5 active:scale-95 border ${
                        isSelected
                          ? 'bg-[#0f172a] text-white font-bold border-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            NHÓM 3: USAGE CONTEXT & AUDIENCE (OPTIONAL)
            - Nền chữ màu xanh baby nhạt
            - Ô nhập liệu và gợi ý bên dưới màu xám nhạt
           ========================================================================= */}
        <div className="space-y-2">
          {/* Tiêu đề nhóm Bối cảnh: Nền chữ màu xanh baby nhạt */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label
              htmlFor="translator-context-input"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-950 text-xs font-bold shadow-2xs cursor-pointer self-start"
            >
              <Compass className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>{t.usageContextSectionTitle}</span>
            </label>
            <span className="text-[11px] font-medium text-slate-500">
              {t.usageContextSubtitle}
            </span>
          </div>

          {/* Ô nhập liệu & gợi ý bên dưới: Khung màu xám nhạt */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2.5 sm:p-3 space-y-2.5">
            {/* Ô nhập bối cảnh: Nền xám nhạt */}
            <input
              id="translator-context-input"
              type="text"
              value={customContext}
              onChange={(e) => {
                setCustomContext(e.target.value);
                setSelectedChipId(null);
              }}
              placeholder={t.translateContextPlaceholder}
              className="w-full text-sm sm:text-base px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-100/70 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-[#0f172a] transition shadow-2xs font-semibold"
            />

            {/* Thẻ gợi ý bối cảnh */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">
                  {t.contextSuggestionsLabel}
                </span>
                {customContext && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomContext('');
                      setSelectedChipId(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    {t.clearContextBtn}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none sm:flex-wrap">
                {quickContextChips.map((chip, idx) => {
                  const chipVal = chip.valMap[lang] || chip.valMap['vi'];
                  const isSelected = selectedChipId === chip.id || customContext === chipVal;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedChipId(chip.id);
                        setCustomContext(chipVal);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border whitespace-nowrap shrink-0 transition-all min-h-[32px] cursor-pointer flex items-center gap-1 active:scale-95 ${
                        isSelected
                          ? 'bg-[#0f172a] text-white font-bold border-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            NHÓM 4: NỘI DUNG CẦN CHUYỂN NGỮ TỰ NHIÊN (INPUT TEXTAREA)
            - Nền chữ màu xanh baby nhạt
            - Ô nhập liệu bên dưới màu xám nhạt
            - Nút "Chuyển đổi ngôn ngữ" dời xuống phía dưới ô nhập nội dung này
           ========================================================================= */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Header Nhãn: Nền chữ màu xanh baby nhạt */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="translator-input-text"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-950 text-xs font-bold cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>{t.inputContentSectionTitle}</span>
            </label>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono border border-slate-200">
              {inputText.length} {t.charsCountUnit}
            </span>
          </div>

          {/* Ô nhập liệu: Màu xám nhạt */}
          <div className="rounded-xl border border-slate-300 bg-slate-50/80 focus-within:bg-white focus-within:border-[#0f172a] focus-within:ring-2 focus-within:ring-slate-200 transition-all p-2.5 shadow-2xs">
            <textarea
              id="translator-input-text"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (!isLoading && inputText.trim()) {
                    handleTranslate();
                  }
                }
              }}
              placeholder={t.translateInputPlaceholder}
              className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none transition resize-y font-sans leading-relaxed min-h-[95px]"
            />
          </div>

          {/* NÚT "CHUYỂN ĐỔI NGÔN NGỮ" (MÀU TÍM ĐỎ) DỜI XUỐNG PHÍA DƯỚI Ô NHẬP NỘI DUNG */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <button
              type="button"
              id="btn-swap-language-direction"
              onClick={swapDirection}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#831843] bg-[#fdf2f8] hover:bg-[#fce7f3] active:bg-[#fbcfe8] rounded-xl border border-[#f472b6]/70 shadow-2xs transition-all cursor-pointer min-h-[38px] active:scale-95"
              title={t.switchDirectionBtn}
            >
              <ArrowRightLeft className="w-4 h-4 text-[#be185d] stroke-[2.5]" />
              <span>{t.switchDirectionBtn}</span>
            </button>

            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer px-2 py-1"
              >
                {t.clearBtn}
              </button>
            )}
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Lightbulb className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{t.translateSamplePromptsTitle}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(s.text);
                  setDirection(s.dir);
                  setCustomContext(s.context);
                  setStyle(s.style);
                  setLevel(s.level);
                }}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer group min-h-[44px] shadow-2xs active:scale-[0.99]"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#0f172a] transition">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  "{s.text}"
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Button Row - NAVY BRAND "DỊCH THUẬT" BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            id="btn-submit-translate"
            onClick={() => handleTranslate()}
            disabled={isLoading || !(inputText || '').trim()}
            className="w-full sm:w-auto px-9 py-3 rounded-xl text-base font-black text-white flex items-center justify-center gap-2.5 shadow-md shadow-slate-900/15 transition-all cursor-pointer disabled:opacity-50 min-h-[48px] active:scale-98 bg-[#0f172a] hover:bg-[#1e293b]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>{t.translatingBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-sky-300" />
                <span>{t.translateActionBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-in fade-in">
            {errorMsg}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: TRANSLATION RESULTS WORKSPACE
          - PHẦN 1: BẢN DỊCH CHUẨN BẢN XỨ (Primary Translation)
          - PHẦN 2: TỪ VỰNG & NGỮ PHÁP TRỌNG ĐIỂM (Key Vocabulary & Grammar)
          - PHẦN 3: CÁC BIẾN THỂ THEO ĐỐI TƯỢNG (Contextual Variations by Register)
          - PHẦN 4: THÔNG BÁO CAM KẾT CHẤT LƯỢNG
         ========================================================================= */}
      {result && (
        <div id="translation-result-view" className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
          
          {/* =========================================================================
              PHẦN 1: BẢN DỊCH NGỮ CẢNH CHUẨN XÁC NHẤT (HERO - ROYAL BLUE & SKY THEME)
             ========================================================================= */}
          <section
            aria-labelledby="section-primary-title"
            className="p-4 sm:p-6 rounded-2xl border border-sky-200/90 border-t-4 border-t-sky-600 bg-gradient-to-b from-sky-50/40 via-white to-white text-slate-950 shadow-sm space-y-4 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-sky-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-700 text-white text-[11px] font-black uppercase tracking-wider shadow-2xs mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-200 shrink-0" />
                  <span>{t.part1BestTranslation}</span>
                </div>
                <h3 id="section-primary-title" className="text-base sm:text-lg font-black text-sky-950 leading-snug">
                  {t.primaryTranslationTitle}
                </h3>
              </div>

              {/* Action Buttons: Audio & Copy */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSpeak(result.primaryTranslation, 'primary', 'ko-KR')}
                  className="p-2 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 transition-colors shadow-2xs cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                  title={t.listenBtn}
                >
                  <Volume2 className={`w-4 h-4 ${speakingKey === 'primary' ? 'text-sky-600 animate-pulse' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(result.primaryTranslation, 'primary')}
                  className="p-2 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 transition-colors shadow-2xs cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                  title={t.copyBtn}
                >
                  {copiedKey === 'primary' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSendToAnalyzer(result.primaryTranslation, customContext)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-800 hover:bg-[#0f172a] rounded-xl transition-all cursor-pointer shadow-2xs min-h-[36px] active:scale-95 ml-1"
                >
                  <span>{t.sendToAnalyzerBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Translated Sentence Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-sky-50/70 via-white to-blue-50/40 border-2 border-sky-200/90 text-lg sm:text-2xl font-black text-slate-900 leading-relaxed font-sans shadow-2xs">
              {result.primaryTranslation}
            </div>

            {/* Formality and Tone Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-500 mr-1">
                {t.formalityAndToneTitle}:
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0f172a] text-white shadow-2xs">
                {getLocalizedFormality(result.formalityLevel)}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-900 border border-sky-200">
                {getLocalizedStyle(result.speechStyle)}
              </span>
            </div>

            {/* Cultural Nuance Notice */}
            {result.culturalNuance && (
              <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200/90 bg-amber-50/80 text-amber-950 space-y-1 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t.culturalNuanceTitle}</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed font-medium">
                  {result.culturalNuance}
                </p>
              </div>
            )}
          </section>

          {/* =========================================================================
              PHẦN 2: TỪ VỰNG & NGỮ PHÁP TRỌNG ĐIỂM (EDUCATIONAL - EMERALD & TEAL THEME)
             ========================================================================= */}
          {result.keyVocabularyAndGrammar && result.keyVocabularyAndGrammar.length > 0 && (
            <section
              aria-labelledby="section-vocab-title"
              className="p-4 sm:p-6 rounded-2xl border border-emerald-200/90 border-t-4 border-t-emerald-600 bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-950 shadow-sm space-y-3.5 transition-all"
            >
              <div className="border-b border-emerald-100 pb-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider shadow-2xs mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span>{t.part2VocabAndGrammar}</span>
                </div>
                <h3 id="section-vocab-title" className="text-base sm:text-lg font-black text-emerald-950 leading-snug">
                  {t.keyVocabAndGrammarTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {result.keyVocabularyAndGrammar.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-emerald-200/80 bg-white hover:bg-emerald-50/40 hover:border-emerald-300 transition-all shadow-2xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-black text-emerald-950 group-hover:text-emerald-800 transition">
                          {item.term}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/90 text-emerald-800 border border-emerald-200/70 uppercase">
                          {getLocalizedVocabType(item.type)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {item.meaning}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================================
              PHẦN 3: CÁC BIẾN THỂ THEO ĐỐI TƯỢNG (SOCIAL REGISTERS - PURPLE & VIOLET THEME)
             ========================================================================= */}
          {result.variations && result.variations.length > 0 && (
            <section
              aria-labelledby="section-variations-title"
              className="p-4 sm:p-6 rounded-2xl border border-purple-200/90 border-t-4 border-t-purple-600 bg-gradient-to-b from-purple-50/40 via-white to-white text-slate-950 shadow-sm space-y-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-700 text-white text-[11px] font-black uppercase tracking-wider shadow-2xs mb-1">
                    <Users className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                    <span>{t.part3AudienceVariations}</span>
                  </div>
                  <h3 id="section-variations-title" className="text-base sm:text-lg font-black text-purple-950 leading-snug">
                    {t.variationsByRegisterTitle}
                  </h3>
                </div>

                {/* Multilingual Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">
                    {t.translateVariationsLangLabel}
                  </span>
                  <div className="flex items-center gap-1 bg-purple-100/80 p-1 rounded-xl border border-purple-200">
                    {[
                      { id: 'vi', label: '🇻🇳 Tiếng Việt' },
                      { id: 'ko', label: '🇰🇷 한국어' },
                      { id: 'en', label: '🇺🇸 English' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleSelectVariationLanguage(l.id)}
                        disabled={isTranslatingVariations}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer min-h-[28px] ${
                          variationLang === l.id
                            ? 'bg-purple-800 text-white shadow-2xs'
                            : 'text-purple-900 hover:text-purple-950 hover:bg-white/80'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Variations Grid - 3 distinct soft pastel colors for the 3 unfolded variations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.variations.map((v, idx) => {
                  const localized = getLocalizedVariation(v, idx);
                  
                  // 3 màu pastel khác nhau, trang nhã, dịu mắt, không quá nổi:
                  // Card 0 (Trang trọng/Kính ngữ): Xanh dương băng pastel (Ice Blue / Slate)
                  // Card 1 (Lịch sự/Đời thường): Tím oải hương pastel (Lavender / Soft Purple)
                  // Card 2 (Thân mật/Bạn bè): Hồng đào pastel (Warm Rose / Peach)
                  const registerTheme =
                    idx === 0
                      ? {
                          cardBg: 'bg-[#f0f6fc] border-[#cbe2f8] hover:border-[#aed2f5]',
                          badgeBg: 'bg-[#24527d] text-white',
                          formalityBg: 'bg-white/90 text-[#24527d] border border-[#bcdbf7]',
                          meaningBox: 'bg-white/90 text-slate-800 border-[#cfe2f6]',
                          meaningLabel: 'text-[#24527d]',
                          contextLabel: 'text-[#24527d]',
                          actionBtn: 'text-[#24527d] border-[#bcdbf7] bg-white/90 hover:bg-[#24527d] hover:text-white',
                        }
                      : idx === 1
                      ? {
                          cardBg: 'bg-[#f8f3fc] border-[#e7d8f8] hover:border-[#d9c0f4]',
                          badgeBg: 'bg-[#653a99] text-white',
                          formalityBg: 'bg-white/90 text-[#653a99] border border-[#d9c5f4]',
                          meaningBox: 'bg-white/90 text-slate-800 border-[#ebdcf9]',
                          meaningLabel: 'text-[#653a99]',
                          contextLabel: 'text-[#653a99]',
                          actionBtn: 'text-[#653a99] border-[#d9c5f4] bg-white/90 hover:bg-[#653a99] hover:text-white',
                        }
                      : {
                          cardBg: 'bg-[#fdf4f3] border-[#f9d6d1] hover:border-[#f6bcbb]',
                          badgeBg: 'bg-[#a63428] text-white',
                          formalityBg: 'bg-white/90 text-[#a63428] border border-[#f5c3bd]',
                          meaningBox: 'bg-white/90 text-slate-800 border-[#fbe2df]',
                          meaningLabel: 'text-[#a63428]',
                          contextLabel: 'text-[#a63428]',
                          actionBtn: 'text-[#a63428] border-[#f5c3bd] bg-white/90 hover:bg-[#a63428] hover:text-white',
                        };

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border ${registerTheme.cardBg} transition shadow-2xs flex flex-col justify-between space-y-3`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${registerTheme.badgeBg} shadow-2xs`}>
                            {localized.label}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${registerTheme.formalityBg}`}>
                            {getLocalizedVariationFormality(v)}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                          {v.sentence}
                        </p>

                        <div className={`text-xs ${registerTheme.meaningBox} p-2 rounded-lg border font-medium`}>
                          <span className={`font-bold ${registerTheme.meaningLabel}`}>{t.variationMeaningLabel} </span>
                          <span>{localized.meaning}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          <span className={`font-bold ${registerTheme.contextLabel}`}>{t.variationContextLabel} </span>
                          <span>{localized.contextUsage}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSpeak(v.sentence, `var-${idx}`, 'ko-KR')}
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 transition cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center shadow-2xs"
                            title={t.listenAudio}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(v.sentence, `var-${idx}`)}
                            className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 transition cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center shadow-2xs"
                            title={t.copyBtn}
                          >
                            {copiedKey === `var-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSendToAnalyzer(v.sentence, customContext)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer min-h-[30px] shadow-2xs ${registerTheme.actionBtn}`}
                        >
                          <span>{t.sendToAnalyzerBtn}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 4: Quality Commitment Footer Notice */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs text-center font-medium leading-relaxed">
            {t.naturalTranslationNotice}
          </div>
        </div>
      )}
    </div>
  );
};
