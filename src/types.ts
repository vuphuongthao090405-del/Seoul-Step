export type KoreanLevel = 'beginner' | 'intermediate' | 'advanced';
export type CommunicationStyle = 'spoken' | 'written';
export type AppLanguage = 'vi' | 'ko' | 'en';
export type AppMode = 'analyzer' | 'translator';

export type TranslationDirection = 'vi-ko' | 'ko-vi' | 'ko-en' | 'en-ko' | 'auto';

export interface TranslationVariation {
  label: string; // e.g., "Thân mật đời thường (반말)", "Lịch sự thân thiện (해요체)", "Trang trọng công vụ (하십시오체/공식)"
  sentence: string; // Câu dịch tiếng Hàn / Việt / Anh
  meaning?: string; // Bản dịch nghĩa của câu biến thể
  pronunciation?: string;
  formality: string;
  contextUsage: string;
  labelMap?: {
    vi?: string;
    ko?: string;
    en?: string;
    [lang: string]: string | undefined;
  };
  contextUsageMap?: {
    vi?: string;
    ko?: string;
    en?: string;
    [lang: string]: string | undefined;
  };
  meaningMap?: {
    vi?: string;
    ko?: string;
    en?: string;
    [lang: string]: string | undefined;
  };
}

export interface TranslationWordItem {
  term: string; // Từ vựng then chốt / Mẫu ngữ pháp
  meaning: string; // Ý nghĩa chi tiết
  type: string; // "Từ vựng then chốt", "Từ Hán-Hàn", "Quán dụng ngữ", "Mẫu ngữ pháp", "Kính ngữ"
}

export interface ContextualTranslationResult {
  id: string;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  primaryTranslation: string; // Bản dịch tự nhiên bản ngữ nhất, không dịch từng từ
  pronunciation?: string; // Phiên âm (khi dịch sang tiếng Hàn)
  formalityLevel: string; // Mức độ lịch sự & đuôi câu
  toneAndNuance: string; // Sắc thái & cảm xúc truyền tải
  culturalAndContextNote: string; // Lưu ý ngữ cảnh văn hóa & cách dùng tự nhiên tránh dịch máy móc
  variations: TranslationVariation[]; // Các cách diễn đạt khác theo từng mức độ
  keyVocabularyAndGrammar: TranslationWordItem[]; // Từ vựng & ngữ pháp trọng điểm
  timestamp: number;
}

export type PastelTheme =
  | 'blue'
  | 'gray'
  | 'white'
  | 'yellow'
  | 'purple'
  | 'pink'
  | 'green';

// Ba trường hợp cốt lõi của SEOUL STEP:
// Case 1: Câu đúng và phù hợp ngữ cảnh
// Case 2: Câu sai về chính tả hoặc ngữ pháp
// Case 3: Câu đúng về ngữ pháp nhưng chưa phù hợp với ngữ cảnh
export type CoreCaseType =
  | 'CASE_1_CORRECT'
  | 'CASE_2_HAS_ERRORS'
  | 'CASE_3_CONTEXT_UNSUITABLE';

export type VerdictType =
  | 'CORRECT'
  | 'HAS_ERRORS'
  | 'GRAMMAR_OK_CONTEXT_UNSUITABLE'
  | 'USABLE_BUT_UNNATURAL';

export interface DiffToken {
  text: string;
  type: 'normal' | 'added' | 'removed' | 'modified';
  original?: string;
  note?: string;
}

// Cấu trúc phân tích lỗi rõ ràng cho người mới học (không phải đoạn văn dài)
export interface StructuredErrorItem {
  targetWord: string; // Từ/cụm từ cần lưu ý
  errorType: 'spelling' | 'spacing' | 'grammar' | 'particle' | 'honorific' | 'word_choice' | 'formality';
  errorTypeName: string; // Tên ngắn gọn (vd: "Khoảng cách từ (띄어쓰기)", "Trợ từ", "Kính ngữ")
  whyWrong: string; // Giải thích ngắn gọn nguyên nhân vì sao chưa chuẩn
  howToFix: string; // Cách sửa cụ thể
  example?: string; // Ví dụ minh họa cách dùng đúng trong thực tế
}

export interface ErrorCategoryDetail {
  hasIssues: boolean;
  issues: string[];
  explanation: string; // Giải thích súc tích, dễ hiểu cho người mới học
  errorItems?: StructuredErrorItem[]; // Danh sách từng điểm cần lưu ý cụ thể
}

export interface ContextDetail extends ErrorCategoryDetail {
  isGrammarValid: boolean; // Khẳng định: cấu trúc ngữ pháp có đúng không?
  suitableContexts: string[];
  whenOriginalCanBeUsed?: string; // Câu gốc có thể dùng trong trường hợp nào?
  whyUnsuitableForTarget?: string; // Vì sao chưa phù hợp với ngữ cảnh mục tiêu?
  recommendedTone?: string;
}

export interface FormalityAndNaturalness {
  formalityLevel: string; // e.g., "비격식 존댓말 (해요체)", "격식 존댓말 (하십시오체)", "반말 (해체)", "문어체 (한다체)"
  formalityMatch: boolean;
  naturalnessScore: number; // 1 to 10
  naturalnessComment: string;
}

export interface ExpressionSuggestion {
  sentence: string;
  pronunciation?: string;
  translation: string;
  style: CommunicationStyle;
  formality: string;
  level: KoreanLevel;
  situationalUsage: string; // "Câu này dùng trong trường hợp nào?"
  nuance?: string; // Sắc thái & cảm xúc truyền tải
  reason: string;
  vocabularyHighlights?: string; // Từ vựng đặc trưng theo cấp độ (vd: Từ vựng cơ bản vs Hán-Hàn tinh tế)
  grammarPattern?: string; // Mẫu ngữ pháp trọng tâm theo cấp độ
  distinctionNote?: string; // Điểm khác biệt rõ rệt so với các cấp độ khác về văn phong, độ tự nhiên và trang trọng
}

export interface ReferenceSource {
  name: string;
  title: string;
  description: string;
  url: string;
  category: 'dictionary' | 'grammar_rules' | 'learner_corpus' | 'standard';
}

export interface AiQuickVariation {
  label: string;
  sentence: string;
  note: string;
  pronunciation?: string;
  labelMap?: {
    vi?: string;
    ko?: string;
    en?: string;
  };
  noteMap?: {
    vi?: string;
    ko?: string;
    en?: string;
  };
}

export interface AiInsights {
  engine: string;
  modelAssessment: string;
  learnerTips: string;
  culturalContext: string;
  toneNuance: string;
  quickVariations: AiQuickVariation[];
}

export interface AnalysisResult {
  id: string;
  originalText: string;
  correctedText: string;
  translation: string;
  coreCase: CoreCaseType; // Phân định rõ 3 trường hợp
  verdict: VerdictType;
  verdictTitle: string;
  verdictSummary: string;
  selectedLevel: KoreanLevel;
  selectedStyle: CommunicationStyle;
  selectedContext: string;
  isAiPowered?: boolean;
  aiEngine?: string;
  isFallbackMode?: boolean;
  fallbackReason?: string;
  aiInsights?: AiInsights;
  diffTokens: DiffToken[];
  explanations: {
    spelling: ErrorCategoryDetail; // Chính tả & khoảng cách từ 띄어쓰기
    grammar: ErrorCategoryDetail; // Ngữ pháp & chia đuôi câu
    wordUsage: ErrorCategoryDetail; // Cách dùng từ & từ vựng
    context: ContextDetail; // Ngữ cảnh & mức độ phù hợp
    formalityAndNaturalness: FormalityAndNaturalness;
  };
  suggestions: ExpressionSuggestion[];
  references: ReferenceSource[];
  timestamp: number;
}

export interface AnalysisRequest {
  text: string;
  context: string;
  style: CommunicationStyle;
  level: KoreanLevel;
  uiLanguage: AppLanguage;
}

export interface PresetSample {
  id: string;
  caseType: CoreCaseType;
  title: Record<AppLanguage, string>;
  korean: string;
  context: string;
  contextMap?: Record<AppLanguage, string>;
  style: CommunicationStyle;
  level: KoreanLevel;
  description: Record<AppLanguage, string>;
}
