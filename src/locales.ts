import { AppLanguage } from './types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  appDescription: string;
  
  // Levels
  levelLabel: string;
  levelBeginner: string;
  levelIntermediate: string;
  levelAdvanced: string;
  levelBeginnerDesc: string;
  levelIntermediateDesc: string;
  levelAdvancedDesc: string;

  // Styles
  styleLabel: string;
  styleSpoken: string;
  styleWritten: string;
  styleSpokenDesc: string;
  styleWrittenDesc: string;

  // Themes
  themeLabel: string;
  themeBlue: string;
  themeGray: string;
  themeWhite: string;
  themeYellow: string;
  themePurple: string;
  themePink: string;
  themeGreen: string;

  // Input
  inputTitle: string;
  inputPlaceholder: string;
  contextTitle: string;
  contextPlaceholder: string;
  contextSuggestionsLabel: string;
  quickSamplesBtn: string;
  clearBtn: string;
  analyzeBtn: string;
  analyzingBtn: string;

  // Context Presets
  ctxDaily: string;
  ctxFriends: string;
  ctxElders: string;
  ctxBusinessEmail: string;
  ctxInterview: string;
  ctxAcademicEssay: string;
  ctxServiceShopping: string;

  // Verdicts
  verdictCorrect: string;
  verdictHasErrors: string;
  verdictGrammarOkContextBad: string;
  verdictUsableNotNatural: string;

  // Sections
  correctedSentenceTitle: string;
  diffExplanation: string;
  translationTitle: string;
  copySuccess: string;
  listenAudio: string;

  analysisTitle: string;
  spellingTitle: string;
  grammarTitle: string;
  wordUsageTitle: string;
  contextTitleSection: string;
  formalityTitle: string;
  naturalnessTitle: string;

  suggestionsTitle: string;
  suggestionsSubtitle: string;
  
  referencesTitle: string;
  referencesSubtitle: string;
  visitSource: string;

  historyTitle: string;
  historyEmpty: string;
  clearHistory: string;

  // Cases
  case1Badge: string;
  case2Badge: string;
  case3Badge: string;
  grammarValidNotice: string;
  whenOriginalUsedLabel: string;
  whyUnsuitableLabel: string;
  errorTargetLabel: string;
  errorWhyLabel: string;
  errorFixLabel: string;
  errorExampleLabel: string;
  editSentenceBtn: string;
  situationalUsageLabel: string;
  nuanceLabel: string;
  useInInputBtn: string;

  // AI Specific
  aiBadge: string;
  aiInsightsTitle: string;
  aiLearnerTipsTitle: string;
  aiCulturalContextTitle: string;
  aiVariationsTitle: string;
  aiAskFollowupTitle: string;
  aiAskPlaceholder: string;
  aiAskSubmitBtn: string;
  aiAskingBtn: string;

  // AI Dynamic Language Switch & Level Suggestions
  translatingAnalysisBanner: string;
  translatingAnalysisSuccess: string;
  levelFilterAll: string;
  levelFilterBeginner: string;
  levelFilterIntermediate: string;
  levelFilterAdvanced: string;
  vocabHighlightsLabel: string;
  grammarPatternLabel: string;
  distinctionLabel: string;
  levelProgressionHint: string;

  // App Mode & Contextual AI Translation
  tabAnalyzer: string;
  tabAnalyzerShort: string;
  tabAnalyzerDesc: string;
  tabTranslator: string;
  tabTranslatorShort: string;
  tabTranslatorDesc: string;
  tabActiveBadge: string;
  inputKoreanLabel: string;
  inputContextLabel: string;
  inputContextCriticalBadge: string;
  quickContextPrompt: string;
  characterCountLabel: string;
  styleSectionLabel: string;
  macroSectionVerdict: string;
  macroSectionDiagnosis: string;
  macroSectionInsights: string;
  aiModelAssessmentTitle: string;
  aiAskInstantTitle: string;
  aiVariationsSectionTitle: string;
  diagnosisSectionTitle: string;
  diagnosisSectionSubtitle: string;
  countGood: string;
  countWarning: string;
  countError: string;
  expandAllText: string;
  collapseAllText: string;
  translatorTitle: string;
  translatorSubtitle: string;
  dirViKo: string;
  dirKoVi: string;
  dirKoEn: string;
  dirEnKo: string;
  dirAuto: string;
  switchDirectionBtn: string;
  translateInputPlaceholder: string;
  translateActionBtn: string;
  translatingBtn: string;
  primaryTranslationTitle: string;
  formalityAndToneTitle: string;
  culturalNuanceTitle: string;
  variationsByRegisterTitle: string;
  keyVocabAndGrammarTitle: string;
  sendToAnalyzerBtn: string;
  naturalTranslationNotice: string;
  detectedLangLabel: string;
  translateSamplePromptsTitle: string;
  translateContextLabel: string;
  translateContextPlaceholder: string;
  detectedVietnameseNotice: string;
  detectedEnglishNotice: string;
  switchToTranslateBtn: string;
  translateVariationsLangLabel: string;
  aiTranslatingVariations: string;
  variationMeaningLabel: string;
  variationContextLabel: string;
  otherLanguagesLabel: string;

  // Prominent Functional Sections & Variation Translations
  step1InputTitle: string;
  step1InputSubtitle: string;
  step2ContextTitle: string;
  step2ContextSubtitle: string;
  step3AnalysisTitle: string;
  step4SuggestionsTitle: string;
  variationLangLabel: string;
  useThisSentenceBtn: string;
  copiedBtn: string;
  copyBtn: string;
  listenBtn: string;

  // Contextual Translator Detailed Setup & Numbered Parts
  translatorSectionSetup: string;
  directionSectionTitle: string;
  directionSectionSubtitle: string;
  learnerLevelSectionTitle: string;
  learnerLevelBadge: string;
  usageModeSectionTitle: string;
  usageModeBadge: string;
  usageContextSectionTitle: string;
  usageContextSubtitle: string;
  clearContextBtn: string;
  inputContentSectionTitle: string;
  charsCountUnit: string;
  part1BestTranslation: string;
  part2VocabAndGrammar: string;
  part3AudienceVariations: string;

  originalLabel: string;
  polishedVersionLabel: string;
  tapToSeeReasonLabel: string;
  revisedBadge: string;
  originalOkBadge: string;
  grammarValidBadge: string;
  spokenBadge: string;
  writtenBadge: string;
  applyToInputLabel: string;
  whyNaturalLabel: string;
  recommendedContextsLabel: string;
  sentenceStyleLabel: string;
  naturalnessScoreLabel: string;
  vocabCategoryLabel: string;
  grammarCategoryLabel: string;
  allPassedNotice: string;
  noIssuesFoundNotice: string;
  mobileScrollTop: string;
  mobileNavHistory: string;
  replaceOriginalPrefix: string;
  addParticleNote: string;

  errorEmptyText: string;
}

export const translations: Record<AppLanguage, Translations> = {
  vi: {
    appName: "SEOUL STEP",
    appSubtitle: "Trợ lý phân tích ngữ cảnh, chính tả & ngữ pháp tiếng Hàn",
    appDescription: "Kiểm tra và hoàn thiện cách dùng câu tiếng Hàn theo 3 cấp độ (Sơ cấp, Trung cấp, Cao cấp), phân biệt chuẩn xác giữa giao tiếp thường ngày và văn viết trang trọng.",

    step1InputTitle: "1. Ô NHẬP NỘI DUNG TIẾNG HÀN",
    step1InputSubtitle: "Nhập câu, từ vựng hoặc đoạn hội thoại bạn muốn kiểm tra chính tả & ngữ pháp",
    step2ContextTitle: "2. THIẾT LẬP NGỮ CẢNH & ĐỐI TƯỢNG (QUAN TRỌNG)",
    step2ContextSubtitle: "Ngữ cảnh giúp AI chẩn đoán chính xác mức độ lịch sự (kính ngữ) và độ tự nhiên",
    step3AnalysisTitle: "3. KẾT QUẢ PHÂN TÍCH & BẮT BỆNH CÂU CHUẨN MỰC",
    step4SuggestionsTitle: "ĐỀ XUẤT CÁCH DIỄN ĐẠT THEO 3 CẤP ĐỘ (SƠ CẤP · TRUNG CẤP · CAO CẤP)",
    variationLangLabel: "Ngôn ngữ giải thích biến thể:",
    useThisSentenceBtn: "Dùng câu này",
    copiedBtn: "Đã chép",
    copyBtn: "Sao chép",
    listenBtn: "Nghe đọc",

    levelLabel: "Trình độ người học",
    levelBeginner: "Sơ cấp (초급)",
    levelIntermediate: "Trung cấp (중급)",
    levelAdvanced: "Cao cấp (고급)",
    levelBeginnerDesc: "TOPIK 1-2 • Câu đơn giản, đuôi câu 해요, trợ từ cơ bản & khoảng cách từ 띄어쓰기",
    levelIntermediateDesc: "TOPIK 3-4 • Liên kết câu, kính ngữ thông dụng, phân biệt giao tiếp và văn viết",
    levelAdvancedDesc: "TOPIK 5-6 • Văn phong học thuật, kính ngữ chuẩn mực, từ vựng Hán-Hàn tinh tế",

    styleLabel: "Mục đích sử dụng",
    styleSpoken: "Giao tiếp (구어체)",
    styleWritten: "Văn viết (문어체)",
    styleSpokenDesc: "Hội thoại, nhắn tin, giao tiếp lịch sự hàng ngày",
    styleWrittenDesc: "Bài thi viết, bài luận học thuật, email, báo cáo",

    themeLabel: "Màu Pastel",
    themeBlue: "Xanh dương (하늘)",
    themeGray: "Xám (슬레이트)",
    themeWhite: "Trắng kem (크림)",
    themeYellow: "Vàng bơ (버터)",
    themePurple: "Tím oải hương (라벤더)",
    themePink: "Hồng đào (로즈)",
    themeGreen: "Xanh lá bạc hà (세이지)",

    inputTitle: "Nội dung tiếng Hàn cần kiểm tra",
    inputPlaceholder: "Nhập câu hoặc từ vựng tiếng Hàn bạn muốn kiểm tra (ví dụ: 밥을먹었어요, 저는 학교에 가요, 내일 시간 되세요?)...",
    contextTitle: "Ngữ cảnh & hoàn cảnh sử dụng",
    contextPlaceholder: "Mô tả hoàn cảnh (ví dụ: Nói chuyện với sếp, nhắn tin với bạn thân, viết bài luận văn...)",
    contextSuggestionsLabel: "Ngữ cảnh gợi ý nhanh:",
    quickSamplesBtn: "Câu mẫu thực tế",
    clearBtn: "Xóa",
    analyzeBtn: "AI Phân tích câu",
    analyzingBtn: "AI đang phân tích ngữ cảnh...",

    ctxDaily: "Hội thoại đời thường",
    ctxFriends: "Nói với bạn bè thân (반말)",
    ctxElders: "Nói với thầy cô / người lớn (존댓말)",
    ctxBusinessEmail: "Viết email công việc",
    ctxInterview: "Phỏng vấn tuyển dụng",
    ctxAcademicEssay: "Bài luận / Viết bài thi TOPIK (한다체)",
    ctxServiceShopping: "Nhà hàng & mua sắm",

    verdictCorrect: "Đúng và chuẩn mực",
    verdictHasErrors: "Có lỗi sai",
    verdictGrammarOkContextBad: "Đúng ngữ pháp nhưng chưa phù hợp ngữ cảnh",
    verdictUsableNotNatural: "Có thể sử dụng nhưng có cách diễn đạt tự nhiên hơn",

    case1Badge: "Trường hợp 1: Câu đúng & Phù hợp ngữ cảnh",
    case2Badge: "Trường hợp 2: Sai chính tả hoặc ngữ pháp",
    case3Badge: "Trường hợp 3: Ngữ pháp đúng • Chưa phù hợp ngữ cảnh",
    grammarValidNotice: "Lưu ý quan trọng: Câu này KHÔNG SAI ngữ pháp! Cấu trúc câu đúng chuẩn nhưng chưa phù hợp với hoàn cảnh/người nghe này.",
    whenOriginalUsedLabel: "Trường hợp câu gốc này có thể dùng:",
    whyUnsuitableLabel: "Vì sao chưa phù hợp với ngữ cảnh đã chọn:",
    errorTargetLabel: "Vị trí có lỗi:",
    errorWhyLabel: "Nguyên nhân:",
    errorFixLabel: "Cách sửa chuẩn:",
    errorExampleLabel: "Ví dụ minh họa:",
    editSentenceBtn: "Quay lại chỉnh sửa câu",
    situationalUsageLabel: "Dùng trong trường hợp nào?",
    nuanceLabel: "Sắc thái & cảm xúc:",
    useInInputBtn: "Sử dụng câu này",

    aiBadge: "✨ Phân tích bởi Gemini AI",
    aiInsightsTitle: "AI Phân tích chuyên sâu & Góc nhìn văn hóa",
    aiLearnerTipsTitle: "Lời khuyên sư phạm cho người học",
    aiCulturalContextTitle: "Văn hóa giao tiếp & Ứng xử Hàn Quốc",
    aiVariationsTitle: "Tham khảo các cách diễn đạt tự nhiên do AI gợi ý",
    aiAskFollowupTitle: "Hỏi thêm AI về câu này",
    aiAskPlaceholder: "Ví dụ: Đổi sang cách nói khi nhắn tin KakaoTalk, kính ngữ tối cao...",
    aiAskSubmitBtn: "Gửi câu hỏi",
    aiAskingBtn: "AI đang giải đáp...",

    correctedSentenceTitle: "Câu đã chỉnh sửa & Hoàn thiện",
    diffExplanation: "Phần tô sáng đánh dấu các từ đã được sửa đổi, thêm mới hoặc điều chỉnh chính tả/ngữ pháp.",
    translationTitle: "Ý nghĩa truyền đạt",
    copySuccess: "Đã sao chép vào bộ nhớ tạm!",
    listenAudio: "Nghe phát âm chuẩn",

    analysisTitle: "Chi tiết phân tích & giải thích",
    spellingTitle: "Chính tả & Khoảng cách (띄어쓰기)",
    grammarTitle: "Ngữ pháp & Chia đuôi câu",
    wordUsageTitle: "Cách dùng từ & Sắc thái",
    contextTitleSection: "Ngữ cảnh & Độ trang trọng",
    formalityTitle: "Mức độ lịch sự / Thể câu",
    naturalnessTitle: "Độ tự nhiên bản xứ",

    suggestionsTitle: "Đề xuất các cách diễn đạt phù hợp ngữ cảnh",
    suggestionsSubtitle: "Các câu được thiết kế đúng theo hoàn cảnh thực tế, không thay thế từ máy móc:",

    referencesTitle: "Nguồn tham khảo tiếng Hàn chính thống",
    referencesSubtitle: "Thông tin được đối chiếu và trích dẫn trực tiếp từ các từ điển chuẩn quốc gia Hàn Quốc:",
    visitSource: "Kiểm tra tại nguồn",

    historyTitle: "Lịch sử phân tích",
    historyEmpty: "Chưa có câu nào được phân tích.",
    clearHistory: "Xóa lịch sử",

    translatingAnalysisBanner: "AI đang tự động chuyển đổi toàn bộ phân tích sang Tiếng Việt...",
    translatingAnalysisSuccess: "Toàn bộ nội dung phân tích đã được AI chuyển sang Tiếng Việt",
    levelFilterAll: "Tất cả các cấp độ",
    levelFilterBeginner: "Sơ cấp (초급)",
    levelFilterIntermediate: "Trung cấp (중급)",
    levelFilterAdvanced: "Cao cấp (고급)",
    vocabHighlightsLabel: "Từ vựng trọng tâm theo cấp độ:",
    grammarPatternLabel: "Mẫu ngữ pháp đặc trưng:",
    distinctionLabel: "Khác biệt văn phong & sắc thái:",
    levelProgressionHint: "Nấc thang nâng cấp: Sơ cấp diễn đạt trực tiếp ➔ Trung cấp tự nhiên, linh hoạt ➔ Cao cấp trang trọng, tinh tế",

    // App Mode & Contextual AI Translation
    tabAnalyzer: "PHÂN TÍCH & HIỆU ĐÍNH",
    tabAnalyzerShort: "Phân tích",
    tabAnalyzerDesc: "Chẩn đoán chính tả, ngữ pháp, độ tự nhiên & ngữ cảnh câu",
    tabTranslator: "DỊCH THUẬT NGỮ CẢNH AI",
    tabTranslatorShort: "Dịch AI",
    tabTranslatorDesc: "Dịch chuẩn bản xứ Việt ↔ Hàn ↔ Anh theo đối tượng & văn hóa",
    tabActiveBadge: "Đang chọn",
    inputKoreanLabel: "Câu hoặc đoạn văn tiếng Hàn cần kiểm tra:",
    inputContextLabel: "Ngữ cảnh & Hoàn cảnh giao tiếp:",
    inputContextCriticalBadge: "Quyết định chuẩn mực",
    quickContextPrompt: "Gợi ý nhanh:",
    characterCountLabel: "ký tự",
    styleSectionLabel: "Văn phong:",
    macroSectionVerdict: "TỔNG QUAN ĐÁNH GIÁ",
    macroSectionDiagnosis: "BẮT BỆNH CÂU CHUẨN MỰC",
    macroSectionInsights: "CHUYÊN SÂU & VĂN HÓA",
    aiModelAssessmentTitle: "Đánh giá sư phạm tổng quan của AI",
    aiAskInstantTitle: "Hỏi đáp ngôn ngữ tức thì",
    aiVariationsSectionTitle: "Biến đổi câu linh hoạt",
    diagnosisSectionTitle: "KẾT QUẢ PHÂN TÍCH & BẮT BỆNH",
    diagnosisSectionSubtitle: "Đánh giá đồng bộ 5 hạng mục ngôn ngữ học chuẩn mực",
    countGood: "tốt",
    countWarning: "lưu ý",
    countError: "lỗi",
    expandAllText: "Mở rộng",
    collapseAllText: "Thu gọn",
    translatorTitle: "Dịch thuật Ngữ cảnh Chuẩn Bản xứ bằng AI",
    translatorSubtitle: "Dịch Việt ↔ Hàn và Hàn ↔ Anh chuẩn xác ý định, ngữ pháp và ngữ cảnh. Không dịch từng từ máy móc mà hiểu sâu sắc thái văn hóa và lối diễn đạt tự nhiên.",
    dirViKo: "Tiếng Việt ➔ 한국어",
    dirKoVi: "한국어 ➔ Tiếng Việt",
    dirKoEn: "한국어 ➔ English",
    dirEnKo: "English ➔ 한국어",
    dirAuto: "Tự động nhận diện",
    switchDirectionBtn: "Đổi chiều ngôn ngữ",
    translateInputPlaceholder: "Nhập câu tiếng Việt, Hàn hoặc Anh... AI sẽ nắm bắt trọn vẹn ý định, đối tượng giao tiếp và diễn đạt tự nhiên như người bản xứ",
    translateActionBtn: "DỊCH THUẬT",
    translatingBtn: "AI đang phân tích ngữ cảnh & chuyển ngữ...",
    primaryTranslationTitle: "Bản dịch tự nhiên chuẩn bản xứ",
    formalityAndToneTitle: "Mức độ lịch sự & Sắc thái biểu đạt",
    culturalNuanceTitle: "Lưu ý ngữ cảnh & Văn hóa giao tiếp (Tránh dịch máy móc)",
    variationsByRegisterTitle: "Các biến thể linh hoạt theo hoàn cảnh",
    keyVocabAndGrammarTitle: "Từ vựng then chốt & Mẫu ngữ pháp",
    sendToAnalyzerBtn: "Đưa sang trình Phân tích sâu câu Hàn",
    naturalTranslationNotice: "Bản dịch AI hiểu sâu sắc thái ngôn ngữ: Tuyệt đối không dịch word-by-word máy móc mà chuyển hóa hoàn hảo lối nói của người Seoul theo đúng đối tượng và hoàn cảnh.",
    detectedLangLabel: "Phát hiện ngôn ngữ:",
    translateSamplePromptsTitle: "Gợi ý câu dịch thực tế:",
    translateContextLabel: "Bối cảnh sử dụng (Tùy chọn):",
    translateContextPlaceholder: "Ví dụ: Gửi email cho sếp, nhắn tin rủ bạn thân, nhờ vả đối tác, phỏng vấn...",
    detectedVietnameseNotice: "Phát hiện bạn vừa nhập câu Tiếng Việt!",
    detectedEnglishNotice: "Detected English input!",
    switchToTranslateBtn: "Chuyển sang Dịch tự nhiên sang tiếng Hàn",
    translateVariationsLangLabel: "Ngôn ngữ giải thích biến thể:",
    aiTranslatingVariations: "AI đang chuyển ngữ biến thể...",
    variationMeaningLabel: "Bản dịch nghĩa:",
    variationContextLabel: "Bối cảnh sử dụng:",
    otherLanguagesLabel: "Dịch thêm ngôn ngữ khác...",

    translatorSectionSetup: "THIẾT LẬP CHUYỂN NGỮ",
    directionSectionTitle: "HƯỚNG CHUYỂN ĐỔI NGÔN NGỮ",
    directionSectionSubtitle: "Chọn chiều dịch thuật",
    learnerLevelSectionTitle: "Trình độ người học (Learner Level)",
    learnerLevelBadge: "Cấp độ TOPIK",
    usageModeSectionTitle: "Mục đích sử dụng (Usage Mode)",
    usageModeBadge: "Văn phong",
    usageContextSectionTitle: "Bối cảnh sử dụng & Người nghe (Usage Context & Audience)",
    usageContextSubtitle: "Quyết định xưng hô, kính ngữ & mức độ thân mật",
    clearContextBtn: "Xóa bối cảnh",
    inputContentSectionTitle: "Nội dung cần chuyển ngữ tự nhiên",
    charsCountUnit: "ký tự",
    part1BestTranslation: "PHẦN 1 • BẢN DỊCH CHUẨN BẢN XỨ",
    part2VocabAndGrammar: "PHẦN 2 • TỪ VỰNG & NGỮ PHÁP TRỌNG ĐIỂM",
    part3AudienceVariations: "PHẦN 3 • CÁC BIẾN THỂ THEO ĐỐI TƯỢNG",

    originalLabel: "Câu gốc:",
    polishedVersionLabel: "Phiên bản hoàn thiện tối ưu:",
    tapToSeeReasonLabel: "Chạm vào từ để xem lý do sửa",
    revisedBadge: "Đã sửa lỗi",
    originalOkBadge: "Chuẩn gốc",
    grammarValidBadge: "✓ Ngữ pháp chuẩn xác",
    spokenBadge: "Giao tiếp",
    writtenBadge: "Văn viết",
    applyToInputLabel: "Áp dụng vào khung nhập",
    whyNaturalLabel: "Lý do tự nhiên:",
    recommendedContextsLabel: "Ngữ cảnh sử dụng câu này tự nhiên nhất:",
    sentenceStyleLabel: "Thể câu:",
    naturalnessScoreLabel: "Độ tự nhiên:",
    vocabCategoryLabel: "Từ vựng",
    grammarCategoryLabel: "Ngữ pháp",
    allPassedNotice: "Câu đạt chuẩn toàn diện về chính tả, ngữ pháp và ngữ cảnh giao tiếp.",
    noIssuesFoundNotice: "Không phát hiện bất thường. Câu chuẩn mực.",
    mobileScrollTop: "Lên đầu trang",
    mobileNavHistory: "Lịch sử",
    replaceOriginalPrefix: "Thay thế cho từ gốc:",
    addParticleNote: "Bổ sung trợ từ/từ mới phù hợp ngữ cảnh",

    errorEmptyText: "Vui lòng nhập câu tiếng Hàn cần kiểm tra.",
  },

  ko: {
    appName: "SEOUL STEP",
    appSubtitle: "한국어 맞춤법·문법·맥락 정밀 분석기",
    appDescription: "초급부터 고급까지, 구어체와 문어체의 차이를 명확히 구분하여 상황에 가장 알맞은 올바른 한국어 표현을 안내합니다.",

    step1InputTitle: "1. 한국어 문장 입력창",
    step1InputSubtitle: "맞춤법, 띄어쓰기, 문법을 검사할 한국어 문장이나 단어를 입력하세요",
    step2ContextTitle: "2. 사용 맥락 및 상대방 설정 (핵심)",
    step2ContextSubtitle: "정확한 존댓말/반말 및 상황 적합도 분석을 위해 사용 맥락을 지정하세요",
    step3AnalysisTitle: "3. 정밀 분석 및 진단 결과",
    step4SuggestionsTitle: "3단계 수준별 추천 표현 (초급 · 중급 · 고급)",
    variationLangLabel: "변형 설명 언어:",
    useThisSentenceBtn: "이 문장 사용",
    copiedBtn: "복사됨",
    copyBtn: "복사",
    listenBtn: "발음 듣기",

    levelLabel: "학습자 레벨",
    levelBeginner: "초급 (TOPIK 1-2)",
    levelIntermediate: "중급 (TOPIK 3-4)",
    levelAdvanced: "고급 (TOPIK 5-6)",
    levelBeginnerDesc: "기초 문장, 해요체, 기본 조사 및 띄어쓰기 교정",
    levelIntermediateDesc: "연결 어미, 상황별 존댓말, 구어체/문어체 구분",
    levelAdvancedDesc: "학술 및 격식 보고서, 고급 한자어, 세련된 문체",

    styleLabel: "사용 목적",
    styleSpoken: "구어체 (회화·일상)",
    styleWritten: "문어체 (글쓰기·공식)",
    styleSpokenDesc: "일상 대화, 메시지, 친근하거나 정중한 구두 소통",
    styleWrittenDesc: "TOPIK 쓰기, 보고서, 논문, 공문서 등 공식 문서",

    themeLabel: "파스텔 테마",
    themeBlue: "스카이 블루 (하늘)",
    themeGray: "슬레이트 그레이 (회색)",
    themeWhite: "소프트 크림 (백색)",
    themeYellow: "버터 옐로우 (노랑)",
    themePurple: "라벤더 퍼플 (보라)",
    themePink: "베이비 로즈 (분홍)",
    themeGreen: "세이지 민트 (초록)",

    inputTitle: "확인할 한국어 문장/단어 입력",
    inputPlaceholder: "교정받고 싶은 한국어 문장이나 어휘를 입력하세요 (예: 밥을먹었어요, 저는 학교에 가요, 내일 시간 되세요?)...",
    contextTitle: "사용할 상황 및 맥락",
    contextPlaceholder: "어떤 상황에서 쓰실 건가요? (예: 직장 상사와 대화, 친구에게 문자, 대학 과제 리포트...)",
    contextSuggestionsLabel: "자주 쓰는 맥락 선택:",
    quickSamplesBtn: "학습 예시 문장",
    clearBtn: "지우기",
    analyzeBtn: "문장 분석하기",
    analyzingBtn: "정밀 분석 중...",

    ctxDaily: "일상 대화",
    ctxFriends: "친한 친구와 대화 (반말)",
    ctxElders: "선생님/어르신께 말씀 (존댓말)",
    ctxBusinessEmail: "비즈니스 업무 이메일",
    ctxInterview: "취업 및 면접 상황",
    ctxAcademicEssay: "학술 에세이 / TOPIK 쓰기 (한다체)",
    ctxServiceShopping: "식당 및 쇼핑 응대",

    verdictCorrect: "올바르고 자연스러움",
    verdictHasErrors: "오류 있음",
    verdictGrammarOkContextBad: "문법은 맞으나 맥락에 부적절",
    verdictUsableNotNatural: "사용 가능하나 더 자연스러운 표현 있음",

    case1Badge: "1단계: 문법과 맥락에 완벽한 문장",
    case2Badge: "2단계: 맞춤법 또는 문법 오류",
    case3Badge: "3단계: 문법은 맞으나 맥락에 부적절",
    grammarValidNotice: "중요 안내: 문법적으로 틀린 문장이 아닙니다! 문장 구조는 맞지만 현재 대화 상황이나 상대방에게 어울리지 않습니다.",
    whenOriginalUsedLabel: "원문이 자연스럽게 쓰이는 상황:",
    whyUnsuitableLabel: "선택한 맥락에 맞지 않는 이유:",
    errorTargetLabel: "오류 위치:",
    errorWhyLabel: "오류 원인:",
    errorFixLabel: "올바른 수정안:",
    errorExampleLabel: "활용 예문:",
    editSentenceBtn: "문장 다시 수정하기",
    situationalUsageLabel: "어떤 상황에서 쓰는 표현인가요?",
    nuanceLabel: "뉘앙스 및 어조:",
    useInInputBtn: "이 문장으로 입력창 채우기",

    aiBadge: "✨ Gemini AI 정밀 분석",
    aiInsightsTitle: "AI 심층 분석 및 문화적 맥락",
    aiLearnerTipsTitle: "외국인 학습자를 위한 AI 조언",
    aiCulturalContextTitle: "한국 소통 문화 및 화용론적 배경",
    aiVariationsTitle: "상황별 AI 추천 유연한 변형 문장",
    aiAskFollowupTitle: "이 문장에 대해 AI에게 추가 질문하기",
    aiAskPlaceholder: "예: 카카오톡 말투로 변경해 줘, 하십시오체로 바꿔 줘...",
    aiAskSubmitBtn: "질문하기",
    aiAskingBtn: "AI 답변 생성 중...",

    correctedSentenceTitle: "수정 및 최적화된 문장",
    diffExplanation: "하이라이트된 부분은 맞춤법, 띄어쓰기 또는 문법 교정이 이루어진 부분입니다.",
    translationTitle: "전달하려는 의미",
    copySuccess: "클립보드에 복사되었습니다!",
    listenAudio: "원어민 발음 듣기",

    analysisTitle: "정밀 분석 및 교정 이유",
    spellingTitle: "맞춤법 및 띄어쓰기",
    grammarTitle: "문법 및 어미 활용",
    wordUsageTitle: "어휘 선택 및 뉘앙스",
    contextTitleSection: "맥락 및 격식도",
    formalityTitle: "격식 수준 / 종결 어미",
    naturalnessTitle: "원어민 자연스러움 점수",

    suggestionsTitle: "맥락 맞춤형 추천 표현",
    suggestionsSubtitle: "단순 동의어 치환이 아닌, 실제 상황에 가장 잘 어울리는 표현들입니다:",

    referencesTitle: "신뢰할 수 있는 공인 한국어 출처",
    referencesSubtitle: "국립국어원 표준국어대사전 및 공인 한국어 어문 규범을 바탕으로 제공됩니다:",
    visitSource: "공식 사전에서 확인",

    historyTitle: "분석 기록",
    historyEmpty: "아직 분석한 문장이 없습니다.",
    clearHistory: "기록 삭제",

    translatingAnalysisBanner: "AI가 전체 분석 내용을 한국어로 자동 변환하는 중입니다...",
    translatingAnalysisSuccess: "전체 분석 내용이 AI를 통해 한국어로 전환되었습니다",
    levelFilterAll: "전체 등급",
    levelFilterBeginner: "초급 (TOPIK 1-2)",
    levelFilterIntermediate: "중급 (TOPIK 3-4)",
    levelFilterAdvanced: "고급 (TOPIK 5-6)",
    vocabHighlightsLabel: "등급별 핵심 어휘 비교:",
    grammarPatternLabel: "핵심 문법 및 종결형:",
    distinctionLabel: "문체 및 뉘앙스 차이점:",
    levelProgressionHint: "표현 확장 단계: 초급의 직접 전달 ➔ 중급의 자연스럽고 유연한 표현 ➔ 고급의 격식 있고 세련된 문체",

    // App Mode & Contextual AI Translation
    tabAnalyzer: "문장 정밀 분석 및 교정",
    tabAnalyzerShort: "정밀 분석",
    tabAnalyzerDesc: "맞춤법, 띄어쓰기, 문법, 자연스러움 및 맥락 정밀 진단",
    tabTranslator: "AI 맥락 번역기",
    tabTranslatorShort: "AI 번역",
    tabTranslatorDesc: "상황 및 대화 상대에 맞춘 원어민 한국어·베트남어·영어 번역",
    tabActiveBadge: "선택됨",
    inputKoreanLabel: "검사할 한국어 문장 또는 단락:",
    inputContextLabel: "사용 맥락 및 대화 상대:",
    inputContextCriticalBadge: "적합도 판단 기준",
    quickContextPrompt: "추천 맥락:",
    characterCountLabel: "자",
    styleSectionLabel: "문체:",
    macroSectionVerdict: "종합 평가 개요",
    macroSectionDiagnosis: "표준 문장 정밀 진단",
    macroSectionInsights: "심층 분석 및 문화",
    aiModelAssessmentTitle: "AI 교육적 종합 평가",
    aiAskInstantTitle: "실시간 AI 언어 질의응답",
    aiVariationsSectionTitle: "상황별 유연한 문장 변형",
    diagnosisSectionTitle: "문장 정밀 진단 결과",
    diagnosisSectionSubtitle: "5대 표준 언어학 항목 종합 평가",
    countGood: "우수",
    countWarning: "주의",
    countError: "오류",
    expandAllText: "모두 펼치기",
    collapseAllText: "모두 접기",
    translatorTitle: "AI 맥락 및 뉘앙스 정밀 번역기",
    translatorSubtitle: "한국어 ↔ 베트남어, 한국어 ↔ 영어 간의 단순 직역을 탈피하여 화자의 의도와 상황에 꼭 맞는 자연스러운 원어민 표현으로 번역합니다.",
    dirViKo: "베트남어 ➔ 한국어",
    dirKoVi: "한국어 ➔ 베트남어",
    dirKoEn: "한국어 ➔ 영어",
    dirEnKo: "영어 ➔ 한국어",
    dirAuto: "언어 자동 감지",
    switchDirectionBtn: "언어 방향 전환",
    translateInputPlaceholder: "베트남어, 한국어, 또는 영어 문장을 입력하세요. AI가 화자의 의도와 맥락을 파악하여 가장 자연스러운 원어민 표현으로 전환합니다...",
    translateActionBtn: "AI 맥락 번역 실행",
    translatingBtn: "AI가 맥락을 분석하여 번역 중...",
    primaryTranslationTitle: "자연스러운 원어민 표현",
    formalityAndToneTitle: "격식 수준 및 뉘앙스",
    culturalNuanceTitle: "맥락 및 문화적 주의사항 (직역 방지)",
    variationsByRegisterTitle: "상황별 맞춤 표현 변형",
    keyVocabAndGrammarTitle: "핵심 어휘 및 문법 패턴",
    sendToAnalyzerBtn: "정밀 문장 분석기로 보내기",
    naturalTranslationNotice: "단어 대 단어의 기계적 직역을 배제하고, 한국어 원어민의 실제 언어 감각과 문화적 맥락에 최적화된 번역을 제공합니다.",
    detectedLangLabel: "감지된 언어:",
    translateSamplePromptsTitle: "상황별 추천 예문:",
    translateContextLabel: "사용 상황 및 대상 (선택):",
    translateContextPlaceholder: "예: 직장 상사에게 이메일, 친구에게 캐주얼하게 말하기, 정중한 부탁, 인터뷰...",
    detectedVietnameseNotice: "베트남어 문장이 감지되었습니다!",
    detectedEnglishNotice: "영어 문장이 감지되었습니다!",
    switchToTranslateBtn: "한국어 자연스러운 번역기로 전환하기",
    translateVariationsLangLabel: "변형 설명 언어:",
    aiTranslatingVariations: "AI가 변형을 번역 중입니다...",
    variationMeaningLabel: "의미 / 해석:",
    variationContextLabel: "사용 맥락:",
    otherLanguagesLabel: "다른 언어로 AI 번역...",

    translatorSectionSetup: "번역 환경 설정",
    directionSectionTitle: "언어 번역 방향",
    directionSectionSubtitle: "번역할 언어 방향을 선택하세요",
    learnerLevelSectionTitle: "학습자 수준 (TOPIK 레벨)",
    learnerLevelBadge: "TOPIK 등급",
    usageModeSectionTitle: "활용 목적 (문체 스타일)",
    usageModeBadge: "어조 스타일",
    usageContextSectionTitle: "사용 맥락 및 대화 상대 (선택)",
    usageContextSubtitle: "호칭, 높임말 및 친밀도를 결정합니다",
    clearContextBtn: "맥락 지우기",
    inputContentSectionTitle: "자연스럽게 번역할 원문 내용",
    charsCountUnit: "자",
    part1BestTranslation: "1부 • 자연스러운 원어민 표준 번역",
    part2VocabAndGrammar: "2부 • 핵심 어휘 및 주요 문법",
    part3AudienceVariations: "3부 • 상황 및 대상별 맞춤 표현",

    originalLabel: "수정 전 원문:",
    polishedVersionLabel: "최적 완성본:",
    tapToSeeReasonLabel: "터치하여 수정 이유 확인",
    revisedBadge: "수정 완료",
    originalOkBadge: "원문 유지",
    grammarValidBadge: "✓ 문법 정상",
    spokenBadge: "구어체",
    writtenBadge: "문어체",
    applyToInputLabel: "입력창에 적용",
    whyNaturalLabel: "추천 이유:",
    recommendedContextsLabel: "가장 자연스러운 추천 맥락:",
    sentenceStyleLabel: "문체 / 종결형:",
    naturalnessScoreLabel: "원어민 자연스러움:",
    vocabCategoryLabel: "어휘",
    grammarCategoryLabel: "문법",
    allPassedNotice: "맞춤법, 문법, 사용 맥락 전반에서 완벽하게 표준을 충족합니다.",
    noIssuesFoundNotice: "특이사항 없음. 표준 문장 규범에 부합합니다.",
    mobileScrollTop: "맨 위로",
    mobileNavHistory: "기록",
    replaceOriginalPrefix: "원문 대체 교정:",
    addParticleNote: "문맥에 맞는 조사/어휘 보완",

    errorEmptyText: "분석할 한국어 문장을 입력해 주세요.",
  },

  en: {
    appName: "SEOUL STEP",
    appSubtitle: "Korean Context, Orthography & Grammar Assistant",
    appDescription: "Assists Korean language learners to use Korean vocabulary and sentences accurately in context, with precise spelling, spacing, and grammar across Beginner, Intermediate, and Advanced levels.",

    step1InputTitle: "1. KOREAN SENTENCE INPUT",
    step1InputSubtitle: "Enter the Korean sentence, vocabulary, or dialogue to analyze spelling & grammar",
    step2ContextTitle: "2. COMMUNICATION CONTEXT & AUDIENCE (KEY)",
    step2ContextSubtitle: "Specifying context allows AI to accurately evaluate honorifics, politeness, and naturalness",
    step3AnalysisTitle: "3. DETAILED ANALYSIS & LINGUISTIC DIAGNOSIS",
    step4SuggestionsTitle: "3-TIER LEVEL EXPRESSION SUGGESTIONS (BEGINNER · INTERMEDIATE · ADVANCED)",
    variationLangLabel: "Variation explanation language:",
    useThisSentenceBtn: "Use this sentence",
    copiedBtn: "Copied",
    copyBtn: "Copy",
    listenBtn: "Listen",

    levelLabel: "Learner Level",
    levelBeginner: "Beginner (초급)",
    levelIntermediate: "Intermediate (중급)",
    levelAdvanced: "Advanced (고급)",
    levelBeginnerDesc: "TOPIK 1-2 • Basic clauses, polite -해요 endings, core particles & spacing (띄어쓰기)",
    levelIntermediateDesc: "TOPIK 3-4 • Connective endings, contextual honorifics, spoken vs written nuance",
    levelAdvancedDesc: "TOPIK 5-6 • Academic writing, formal standard grammar, sophisticated Sino-Korean terms",

    styleLabel: "Usage Mode",
    styleSpoken: "Spoken (구어체)",
    styleWritten: "Written (문어체)",
    styleSpokenDesc: "Conversations, daily messaging, polite spoken communication",
    styleWrittenDesc: "Academic essays, TOPIK writing exams, formal emails & reports",

    themeLabel: "Pastel Theme",
    themeBlue: "Pastel Sky Blue",
    themeGray: "Pastel Slate Gray",
    themeWhite: "Pastel Warm Cream",
    themeYellow: "Pastel Lemon Butter",
    themePurple: "Pastel Lavender",
    themePink: "Pastel Rose Pink",
    themeGreen: "Pastel Sage Green",

    inputTitle: "Korean Content to Analyze",
    inputPlaceholder: "Enter the Korean sentence or phrase you want to verify (e.g., 밥을먹었어요, 저는 학교에 가요, 내일 시간 되세요?)...",
    contextTitle: "Context & Situation",
    contextPlaceholder: "Describe your context (e.g., Speaking to senior manager, texting a close friend, writing an essay...)",
    contextSuggestionsLabel: "Quick Context Presets:",
    quickSamplesBtn: "Sample Cases",
    clearBtn: "Clear",
    analyzeBtn: "Analyze Sentence",
    analyzingBtn: "Analyzing in detail...",

    ctxDaily: "Everyday Conversation",
    ctxFriends: "Chatting with Close Friends (반말)",
    ctxElders: "Talking to Teachers / Elders (존댓말)",
    ctxBusinessEmail: "Business Workplace Email",
    ctxInterview: "Job Interview & Formal QA",
    ctxAcademicEssay: "Academic Paper / TOPIK Writing (한다체)",
    ctxServiceShopping: "Dining & Customer Service",

    verdictCorrect: "Correct and Natural",
    verdictHasErrors: "Contains Errors",
    verdictGrammarOkContextBad: "Grammatically Correct but Contextually Unsuitable",
    verdictUsableNotNatural: "Acceptable but More Natural Expressions Exist",

    case1Badge: "Case 1: Correct & Contextually Suitable",
    case2Badge: "Case 2: Spelling or Grammar Error",
    case3Badge: "Case 3: Grammar Valid • Context Unsuitable",
    grammarValidNotice: "Important Note: This sentence is NOT grammatically incorrect! The structure is valid, but the tone or register does not match your target audience or context.",
    whenOriginalUsedLabel: "When the original sentence can be used:",
    whyUnsuitableLabel: "Why it does not fit the current context:",
    errorTargetLabel: "Error location:",
    errorWhyLabel: "Why it's wrong:",
    errorFixLabel: "How to fix:",
    errorExampleLabel: "Example:",
    editSentenceBtn: "Back to Edit Sentence",
    situationalUsageLabel: "When should you use this sentence?",
    nuanceLabel: "Nuance & Tone:",
    useInInputBtn: "Use in Input Box",

    aiBadge: "✨ Powered by Gemini AI",
    aiInsightsTitle: "AI Deep Insights & Cultural Context",
    aiLearnerTipsTitle: "Pedagogical Tips for Korean Learners",
    aiCulturalContextTitle: "Korean Pragmatics & Cultural Etiquette",
    aiVariationsTitle: "Situational Variations Suggested by AI",
    aiAskFollowupTitle: "Ask AI More About This Sentence",
    aiAskPlaceholder: "e.g., How to say this casually on KakaoTalk, or in formal business honorifics...",
    aiAskSubmitBtn: "Ask AI",
    aiAskingBtn: "AI is answering...",

    correctedSentenceTitle: "Corrected & Polished Sentence",
    diffExplanation: "Highlighted segments mark words where spelling, spacing, or grammatical revisions were applied.",
    translationTitle: "Intended Meaning",
    copySuccess: "Copied to clipboard!",
    listenAudio: "Listen to pronunciation",

    analysisTitle: "In-depth Analysis & Explanations",
    spellingTitle: "Spelling & Spacing (띄어쓰기)",
    grammarTitle: "Grammar & Conjugation",
    wordUsageTitle: "Word Choice & Nuance",
    contextTitleSection: "Context & Formality Fit",
    formalityTitle: "Formality Register",
    naturalnessTitle: "Native Naturalness Rating",

    suggestionsTitle: "Context-Aware Alternative Expressions",
    suggestionsSubtitle: "Tailored to genuine real-world situations, avoiding mechanical word substitution:",

    referencesTitle: "Authoritative Korean Reference Sources",
    referencesSubtitle: "Cross-referenced directly with certified Korean linguistic dictionaries and grammar institutes:",
    visitSource: "Verify at Official Source",

    historyTitle: "Analysis History",
    historyEmpty: "No sentences analyzed yet.",
    clearHistory: "Clear History",

    translatingAnalysisBanner: "AI is automatically translating the entire analysis into English...",
    translatingAnalysisSuccess: "Entire analysis content has been translated into English by AI",
    levelFilterAll: "All Proficiency Levels",
    levelFilterBeginner: "Beginner (초급)",
    levelFilterIntermediate: "Intermediate (중급)",
    levelFilterAdvanced: "Advanced (고급)",
    vocabHighlightsLabel: "Key Vocabulary by Level:",
    grammarPatternLabel: "Focal Grammar & Endings:",
    distinctionLabel: "Style, Nuance & Formality Shifts:",
    levelProgressionHint: "Progression Ladder: Beginner directness ➔ Intermediate natural fluency ➔ Advanced formal polish",

    // App Mode & Contextual AI Translation
    tabAnalyzer: "ANALYSIS & POLISHING",
    tabAnalyzerShort: "Analyze",
    tabAnalyzerDesc: "Diagnose spelling, grammar, naturalness & situational suitability",
    tabTranslator: "AI CONTEXTUAL TRANSLATOR",
    tabTranslatorShort: "Translate",
    tabTranslatorDesc: "Native Vietnamese ↔ Korean ↔ English translation tailored to audience & culture",
    tabActiveBadge: "Active",
    inputKoreanLabel: "Korean sentence or paragraph to verify:",
    inputContextLabel: "Context & Audience Situation:",
    inputContextCriticalBadge: "Determines standard",
    quickContextPrompt: "Quick Presets:",
    characterCountLabel: "chars",
    styleSectionLabel: "Style:",
    macroSectionVerdict: "EVALUATION OVERVIEW",
    macroSectionDiagnosis: "STANDARD SENTENCE DIAGNOSIS",
    macroSectionInsights: "IN-DEPTH & CULTURE",
    aiModelAssessmentTitle: "AI Pedagogical Overall Assessment",
    aiAskInstantTitle: "Instant AI Language Q&A",
    aiVariationsSectionTitle: "Flexible Sentence Variations",
    diagnosisSectionTitle: "SENTENCE DIAGNOSTIC RESULTS",
    diagnosisSectionSubtitle: "Synchronized 5-point standard linguistic evaluation",
    countGood: "good",
    countWarning: "attention",
    countError: "error",
    expandAllText: "Expand all",
    collapseAllText: "Collapse all",
    translatorTitle: "AI Context & Pragmatics Natural Translator",
    translatorSubtitle: "Bidirectional translation across Vietnamese, Korean, and English. Understands whole sentences and communicative intent without mechanical word-by-word literal phrasing.",
    dirViKo: "Vietnamese ➔ 한국어",
    dirKoVi: "한국어 ➔ Vietnamese",
    dirKoEn: "한국어 ➔ English",
    dirEnKo: "English ➔ 한국어",
    dirAuto: "Auto-Detect Language",
    switchDirectionBtn: "Switch Language Direction",
    translateInputPlaceholder: "Type in Vietnamese, Korean, or English... AI will interpret the full intention, social hierarchy, and express it like a native Seoul speaker...",
    translateActionBtn: "AI CONTEXTUAL TRANSLATE",
    translatingBtn: "AI analyzing context & translating...",
    primaryTranslationTitle: "Native Idiomatic Translation",
    formalityAndToneTitle: "Politeness Level & Nuance",
    culturalNuanceTitle: "Cultural & Pragmatic Insights (Anti-Literal)",
    variationsByRegisterTitle: "Situational Register Variations",
    keyVocabAndGrammarTitle: "Key Vocabulary & Grammar Patterns",
    sendToAnalyzerBtn: "Send to Korean Sentence Analyzer",
    naturalTranslationNotice: "Entirely generated by AI trained on authentic native Korean pragmatics: avoids mechanical translation traps and uses authentic Seoul speech tailored to your specific audience.",
    detectedLangLabel: "Detected Language:",
    translateSamplePromptsTitle: "Try these situational prompts:",
    translateContextLabel: "Usage Context & Audience (Optional):",
    translateContextPlaceholder: "e.g., Email to senior manager, friendly text to friend, formal job interview, restaurant order...",
    detectedVietnameseNotice: "Detected Vietnamese sentence input!",
    detectedEnglishNotice: "Detected English sentence input!",
    switchToTranslateBtn: "Switch to Natural Korean Translator",
    translateVariationsLangLabel: "Variation language:",
    aiTranslatingVariations: "AI is translating variations...",
    variationMeaningLabel: "Meaning / Translation:",
    variationContextLabel: "Context & Usage:",
    otherLanguagesLabel: "AI translate into more languages...",

    translatorSectionSetup: "TRANSLATION SETUP",
    directionSectionTitle: "LANGUAGE TRANSLATION DIRECTION",
    directionSectionSubtitle: "Select translation direction",
    learnerLevelSectionTitle: "Learner Level (TOPIK)",
    learnerLevelBadge: "TOPIK Level",
    usageModeSectionTitle: "Usage Mode (Speech Style)",
    usageModeBadge: "Speech Style",
    usageContextSectionTitle: "Usage Context & Audience (Optional)",
    usageContextSubtitle: "Determines honorifics, register, and social etiquette",
    clearContextBtn: "Clear context",
    inputContentSectionTitle: "Content to Translate Naturally",
    charsCountUnit: "chars",
    part1BestTranslation: "PART 1 • NATIVE ACCURATE TRANSLATION",
    part2VocabAndGrammar: "PART 2 • KEY VOCABULARY & GRAMMAR",
    part3AudienceVariations: "PART 3 • REGISTER & AUDIENCE VARIATIONS",

    originalLabel: "Original sentence:",
    polishedVersionLabel: "Polished optimal version:",
    tapToSeeReasonLabel: "Tap highlighted words to view correction reason",
    revisedBadge: "Revised",
    originalOkBadge: "Original OK",
    grammarValidBadge: "✓ Grammar Valid",
    spokenBadge: "Spoken",
    writtenBadge: "Written",
    applyToInputLabel: "Apply to input",
    whyNaturalLabel: "Why natural:",
    recommendedContextsLabel: "Recommended authentic contexts:",
    sentenceStyleLabel: "Sentence style:",
    naturalnessScoreLabel: "Naturalness:",
    vocabCategoryLabel: "Vocab",
    grammarCategoryLabel: "Grammar",
    allPassedNotice: "Sentence fully satisfies all orthographic, grammatical, and contextual standards.",
    noIssuesFoundNotice: "No irregularities found. Standard and accurate.",
    mobileScrollTop: "Scroll to top",
    mobileNavHistory: "History",
    replaceOriginalPrefix: "Replaced original:",
    addParticleNote: "Added appropriate particle/word for context",

    errorEmptyText: "Please enter a Korean sentence to analyze.",
  }
};

