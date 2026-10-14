import { PresetSample } from '../types';

export const PRESET_SAMPLES: PresetSample[] = [
  {
    id: 'sample-case1-correct',
    caseType: 'CASE_1_CORRECT',
    title: {
      vi: 'Trường hợp 1: Câu đúng & Phù hợp ngữ cảnh',
      ko: '1단계: 문법과 맥락에 완벽한 문장',
      en: 'Case 1: Correct & Contextually Suitable',
    },
    korean: '선생님, 안녕하십니까? 이번 과제에 대해 여쭤보고 싶은 점이 있습니다.',
    context: 'Hỏi bài thầy cô giáo trong giờ học / 선생님께 질문',
    contextMap: {
      vi: 'Hỏi bài thầy cô giáo trong giờ học',
      ko: '수업 중 선생님께 과제에 대해 질문하기',
      en: 'Asking a teacher respectfully about an assignment during class',
    },
    style: 'spoken',
    level: 'intermediate',
    description: {
      vi: 'Mẫu câu chuẩn mực: Dùng kính ngữ "안녕하십니까", động từ khiêm nhường "여쭤보다", trợ từ và cách chữ hoàn hảo.',
      ko: '존댓말과 겸양어(여쭤보다)가 상황에 완벽히 부합하여 그대로 사용할 수 있는 모범 문장입니다.',
      en: 'Exemplary sentence using respectful honorifics and humble verbs suited to speaking with teachers.',
    },
  },
  {
    id: 'sample-case2-spacing',
    caseType: 'CASE_2_HAS_ERRORS',
    title: {
      vi: 'Trường hợp 2: Sai cách chữ (띄어쓰기)',
      ko: '2단계: 띄어쓰기 맞춤법 오류',
      en: 'Case 2: Spacing (띄어쓰기) Error',
    },
    korean: '밥을먹었어요.',
    context: 'Trò chuyện bạn bè sau giờ làm / 일상 대화',
    contextMap: {
      vi: 'Trò chuyện bạn bè sau giờ làm',
      ko: '퇴근 후 친구들과의 편안한 일상 대화',
      en: 'Casual everyday conversation with friends after work',
    },
    style: 'spoken',
    level: 'beginner',
    description: {
      vi: 'Câu thiếu khoảng cách giữa tân ngữ "밥을" và động từ "먹었어요". Tiếng Hàn bắt buộc cách chữ giữa các từ độc lập.',
      ko: '목적어 "밥을"과 서술어 "먹었어요" 사이의 띄어쓰기가 누락된 대표적인 초급 오류입니다.',
      en: 'Missing space between object particle and verb ("밥을" and "먹었어요").',
    },
  },
  {
    id: 'sample-case2-honorific',
    caseType: 'CASE_2_HAS_ERRORS',
    title: {
      vi: 'Trường hợp 2: Sai kính ngữ với bề trên',
      ko: '2단계: 어르신 대상 높임법 오류',
      en: 'Case 2: Incorrect Honorific for Elders',
    },
    korean: '할머니가 밥을 먹었어요.',
    context: 'Kể chuyện về bà ngoại với người lớn / 어르신께 말씀',
    contextMap: {
      vi: 'Kể chuyện về bà ngoại với người lớn',
      ko: '어르신 및 가족 어른들께 할머니에 대해 말씀드리기',
      en: 'Talking respectfully about grandmother to elders',
    },
    style: 'spoken',
    level: 'intermediate',
    description: {
      vi: 'Sai ngữ pháp kính ngữ: Chủ ngữ là người lớn tuổi cần dùng trợ từ "께서", danh từ "진지", và động từ "드셨어요".',
      ko: '주체 높임 조사 "께서", 높임 명사 "진지", 특수 높임 동사 "드시다"가 누락되어 문법상 교정이 필요합니다.',
      en: 'Requires subject honorific particle "께서", honorific noun "진지", and verb "드셨어요".',
    },
  },
  {
    id: 'sample-case3-written-vs-spoken',
    caseType: 'CASE_3_CONTEXT_UNSUITABLE',
    title: {
      vi: 'Trường hợp 3: Ngữ pháp đúng nhưng sai phong cách viết',
      ko: '3단계: 문법은 맞으나 문어체 맥락에 부적절',
      en: 'Case 3: Grammar Valid but Unsuitable for Written Essay',
    },
    korean: '저는 오늘 학교에 가요.',
    context: 'Bài luận học thuật / Viết bài thi TOPIK 쓰기',
    contextMap: {
      vi: 'Bài luận học thuật / Viết bài thi TOPIK 쓰기',
      ko: '학술 에세이 및 TOPIK 쓰기 작문 시험',
      en: 'Academic essay and TOPIK written exam (neutral written style)',
    },
    style: 'written',
    level: 'beginner',
    description: {
      vi: 'Ngữ pháp hoàn toàn đúng! Nhưng đuôi câu "-해요" chỉ dùng trong văn nói, bài thi viết TOPIK bắt buộc dùng đuôi "-ㄴ/는다" và xưng "나".',
      ko: '문법적으로는 틀리지 않았으나, 격식 학술 글쓰기(문어체)에서는 구어체 "가요" 대신 "간다"를 써야 합니다.',
      en: 'Grammatically sound, but conversational "-해요" must be replaced with neutral written "-한다" in formal essays.',
    },
  },
  {
    id: 'sample-case3-email-too-casual',
    caseType: 'CASE_3_CONTEXT_UNSUITABLE',
    title: {
      vi: 'Trường hợp 3: Ngữ pháp đúng nhưng quá suồng sã với đối tác',
      ko: '3단계: 문법은 맞으나 비즈니스 상대에게 지나치게 가벼움',
      en: 'Case 3: Grammar Valid but Too Casual for Business Partner',
    },
    korean: '내일 시간 있으면 회의 좀 해요.',
    context: 'Gửi email cho đối tác công ty / 비즈니스 파트너',
    contextMap: {
      vi: 'Gửi email cho đối tác công ty',
      ko: '외부 비즈니스 파트너사 대상 이메일 발송',
      en: 'Official business email correspondence to external partners',
    },
    style: 'written',
    level: 'intermediate',
    description: {
      vi: 'Ngữ pháp đúng khi nói chuyện thường ngày, nhưng quá thân mật với đối tác. Cần chuyển thành "시간이 허락되신다면 회의를 진행하고자 합니다".',
      ko: '친구 사이에는 자연스럽지만 거래처 비즈니스 상황에는 결례가 될 수 있는 표현입니다.',
      en: 'Grammatically fine for friends, but lacks the formal courtesy expected in business relations.',
    },
  },
];
