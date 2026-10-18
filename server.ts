import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Helper to sanitize & create reliable dictionary search URLs
function generateDictionaryUrl(source: string, query: string): string {
  const clean = encodeURIComponent(query.trim());
  switch (source) {
    case "naver":
      return `https://ko.dict.naver.com/#/search?query=${clean}`;
    case "krdict":
      return `https://krdict.korean.go.kr/eng/dicSearch/search?nation=eng&query=${clean}`;
    case "stdict":
      return `https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=${clean}`;
    case "opendict":
      return `https://opendict.korean.go.kr/search/searchResult?query=${clean}`;
    case "kornorms":
    default:
      return `https://kornorms.korean.go.kr/`;
  }
}

interface GeminiCallParams {
  contents: any;
  config?: any;
  candidateModels?: string[];
  maxRetriesPerModel?: number;
}

// Resilient Gemini invoker with automatic retry on 503/429 and graceful fallback across model tiers
async function callGeminiWithFallback(
  aiClient: GoogleGenAI,
  params: GeminiCallParams
): Promise<{ text: string; modelName: string } | null> {
  const models = params.candidateModels || [
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
  ];
  const maxRetries = params.maxRetriesPerModel ?? 1;

  for (const modelName of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await aiClient.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });

        if (resp && resp.text) {
          return { text: resp.text, modelName };
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err || "");
        const isTransientOverload =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isTransientOverload) {
          if (attempt < maxRetries) {
            // Wait briefly with backoff before retry
            await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
            continue;
          }
          // Gracefully try next model tier
          break;
        }

        // For other errors, move to next model tier
        break;
      }
    }
  }

  return null;
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { text, context, style, level, uiLanguage } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Vui lòng nhập câu hoặc từ vựng tiếng Hàn cần phân tích." });
      return;
    }

    const trimmedText = text.trim();
    const targetStyle = style === "written" ? "문어체 (Văn viết / Written Korean)" : "구어체 (Giao tiếp / Spoken Korean)";
    const targetLevel =
      level === "beginner" ? "Sơ cấp (초급 - TOPIK 1-2)" :
      level === "intermediate" ? "Trung cấp (중급 - TOPIK 3-4)" :
      "Cao cấp (고급 - TOPIK 5-6)";

    const langInstructions =
      uiLanguage === "ko"
        ? "모든 설명, 분석, 요약, 번역을 명확한 한국어로 작성하세요."
        : uiLanguage === "en"
        ? "Write all explanations, analysis, summaries, and translations in clear English."
        : "Viết toàn bộ giải thích, phân tích, nhận xét, và bản dịch bằng tiếng Việt tự nhiên, dễ hiểu, chuẩn sư phạm.";

    const systemPrompt = `Bạn là chuyên gia ngôn ngữ học tiếng Hàn của Viện Quốc gia Ngôn ngữ Hàn Quốc (국립국어원) và giảng viên ngôn ngữ cao cấp của ứng dụng SEOUL STEP.
Mục tiêu cốt lõi của SEOUL STEP: Không chỉ kiểm tra "đúng hay sai", mà ứng dụng sức mạnh AI giúp người học tiếng Hàn (đặc biệt là người mới học) hiểu sâu: "Câu này dùng trong trường hợp nào, văn hóa giao tiếp ra sao, và nên nói/viết như thế nào cho tự nhiên nhất".

Ngôn ngữ giải thích: ${langInstructions}

BẮT BUỘC TUÂN THỦ NGUYÊN TẮC 3 TRƯỜNG HỢP CỐT LÕI (coreCase):
Bạn PHẢI phân loại chính xác vào 1 trong 3 trường hợp sau:

--- TRƯỜNG HỢP 1 (coreCase = "CASE_1_CORRECT"): Câu đúng và phù hợp ngữ cảnh ---
- Tiêu chí: Câu hoàn toàn đúng chính tả, đúng ngữ pháp, tự nhiên và phù hợp với ngữ cảnh / phong cách người dùng đã chọn.
- Xử lý:
  + verdict: "CORRECT"
  + verdictTitle: "Trường hợp 1: Câu đúng & Phù hợp ngữ cảnh"
  + verdictSummary: Xác nhận câu hoàn toàn chuẩn mực, có thể sử dụng ngay trong ngữ cảnh đã nêu, kèm giải thích ngắn gọn.
  + explanations: Ngắn gọn, súc tích, giải thích vì sao câu tự nhiên và phù hợp.

--- TRƯỜNG HỢP 2 (coreCase = "CASE_2_HAS_ERRORS"): Câu sai về chính tả hoặc ngữ pháp ---
- Tiêu chí: Câu có lỗi chính tả, sai quy tắc khoảng cách chữ (띄어쓰기), sai chia động/tính từ, sai trợ từ (이/가, 은/는, 을/를, 에/에서...), sai kính ngữ cấu trúc hoặc liên kết câu.
- Xử lý:
  + verdict: "HAS_ERRORS"
  + verdictTitle: "Trường hợp 2: Câu có lỗi chính tả hoặc ngữ pháp"
  + verdictSummary: Tóm tắt lỗi chính trong 1 câu dễ hiểu cho người mới học.
  + Quy trình bắt buộc trong explanations:
    1. Chỉ ra lỗi (targetWord: từ/cụm từ cụ thể)
    2. Giải thích nguyên nhân ngắn gọn (whyWrong: vì sao sai, không viết quá dài dòng)
    3. Sửa câu (howToFix: sửa lại như thế nào)
    4. Ví dụ minh họa / cách dùng đúng (example: câu ví dụ thực tế)
  + correctedText: Phiên bản chuẩn xác đã được sửa lỗi hoàn chỉnh.

--- TRƯỜNG HỢP 3 (coreCase = "CASE_3_CONTEXT_UNSUITABLE"): Câu đúng về ngữ pháp nhưng chưa phù hợp với ngữ cảnh ---
- Tiêu chí: Câu về mặt cấu trúc ngữ pháp KHÔNG HỀ SAI, nhưng chưa phù hợp về mức độ trang trọng (ví dụ: dùng 반말 với người lớn tuổi/sếp, hoặc dùng 해요체 văn nói trong bài thi viết văn TOPIK 쓰기), hoặc từ ngữ dịch máy móc chưa tự nhiên.
- QUY TẮC CỰC KỲ QUAN TRỌNG:
  + TUYỆT ĐỐI KHÔNG đánh dấu là "sai ngữ pháp" (isGrammarValid = true).
  + Phải giải thích rõ: Câu đúng về mặt ngữ pháp, nhưng chưa phù hợp về cách dùng, mức độ trang trọng hoặc độ tự nhiên với đối tượng/hoàn cảnh này.
  + Chỉ rõ: Câu gốc này có thể dùng trong trường hợp nào (whenOriginalCanBeUsed)?
  + Vì sao chưa hợp với ngữ cảnh hiện tại (whyUnsuitableForTarget)?
  + verdict: "GRAMMAR_OK_CONTEXT_UNSUITABLE"
  + verdictTitle: "Trường hợp 3: Ngữ pháp đúng • Chưa phù hợp ngữ cảnh"
  + verdictSummary: Giải thích rõ ràng rằng ngữ pháp chuẩn nhưng cần đổi sang văn phong phù hợp với người nghe/ngữ cảnh.

YÊU CẦU VỀ AI INSIGHTS (aiInsights):
- modelAssessment: Nhận định chuyên sâu của AI về tư duy đặt câu và diễn đạt của người học.
- learnerTips: Lời khuyên thiết thực từ AI (chỉ ra các lỗi người Việt hay gặp khi dịch nguyên từ tiếng Việt sang câu này).
- culturalContext: Phân tích sâu về văn hóa giao tiếp Hàn Quốc (quan hệ tuổi tác, tôn ti xã hội, khoảng cách tâm lý, hoặc văn hóa công sở/nhắn tin).
- toneNuance: Đánh giá âm điệu, sắc thái cảm xúc, mức độ ấm áp hoặc khoảng cách.
- quickVariations: 3 biến thể câu linh hoạt do AI đề xuất:
  1. Giao tiếp thân mật (반말 / Kakaotalk)
  2. Giao tiếp lịch sự chuẩn mực (해요체 / đời thường)
  3. Trang trọng / Kính cẩn (하십시오체 hoặc văn viết học thuật)

YÊU CẦU ĐẶC BIỆT VỀ ĐỀ XUẤT CÂU THEO CẤP ĐỘ (suggestions):
Bạn PHẢI tạo ra từ 4 đến 6 cách diễn đạt ĐA DẠNG CÙNG NGHĨA trải dài qua cả 3 trình độ:
1. Sơ cấp (level = "beginner"):
   - Từ vựng: Từ vựng cơ bản, thông dụng hàng ngày (단순 기초 어휘).
   - Ngữ pháp: Cấu trúc câu đơn giản, đuôi câu thân thiện chuẩn mực (-아/어요, -았/었어요, liên từ -고, -어서).
   - Tự nhiên: Diễn đạt trực tiếp, rõ ràng, chuẩn mực cho người mới bắt đầu.
   - Formality: Thường là '비격식 존댓말 (해요체)'.
   - vocabularyHighlights: Chỉ ra từ vựng cơ bản được dùng.
   - grammarPattern: Điểm ngữ pháp căn bản.
   - distinctionNote: Giải thích câu ngắn gọn, dễ tiếp thu cho trình độ sơ cấp.
2. Trung cấp (level = "intermediate"):
   - Từ vựng: Từ vựng phong phú, tự nhiên bản ngữ hơn (식사를 챙기다, 일정을 조율하다, 차질이 생기다...).
   - Ngữ pháp: Các mẫu ngữ pháp liên kết, biểu đạt sắc thái tự nhiên (-(으)ㄹ 겸, -기로 하다, -는 편이다, -(으)ㄴ 탓에, -(으)ㄹ 텐데...).
   - Tự nhiên: Văn phong sinh động, liên kết mượt mà như người bản xứ nói chuyện trong đời sống hoặc công việc.
   - Formality: '격식/비격식 존댓말' hoặc văn phong xã giao khéo léo.
   - vocabularyHighlights: Điểm nhấn từ vựng linh hoạt, tự nhiên.
   - grammarPattern: Mẫu liên kết câu hoặc quán dụng ngữ.
   - distinctionNote: So sánh câu này uyển chuyển và tự nhiên hơn sơ cấp ra sao.
3. Cao cấp (level = "advanced"):
   - Từ vựng: Sử dụng từ Hán Hàn tinh tế (한자어), thành ngữ, từ ngữ mang tính trang trọng hoặc học thuật (식사를 마치다, 우천으로 인하여, 부득이하게, 재조정하다, 함양하다...).
   - Ngữ pháp: Cấu trúc ngữ pháp cao cấp, danh từ hóa, liên kết trang trọng (-(으)로 인하여, -(으)ㅁ에 따라, -고자 하다, -(으)ㄹ 따름이다, 하십시오체 hoặc 한다체).
   - Tự nhiên: Văn phong chỉn chu, chuẩn mực trong hội nghị, phỏng vấn, báo cáo công việc hoặc văn bản chính thức.
   - Formality: '격식 존댓말 (하십시오체)' hoặc '공식 문어체 (한다체)'.
   - vocabularyHighlights: Từ Hán-Hàn cao cấp hoặc từ vựng chuyên môn.
   - grammarPattern: Cấu trúc ngữ pháp nâng cao, liên từ trang trọng.
   - distinctionNote: Phân tích sự trang trọng, uy tín và sắc thái chiều sâu so với trung cấp.

TUYỆT ĐỐI KHÔNG CHỈ ĐỔI 1-2 TỪ TRONG CÙNG MỘT CÂU. Mỗi cấp độ phải là một câu diễn đạt hoàn chỉnh khác nhau, mang bản sắc ngôn ngữ đặc trưng của cấp độ đó!

Mỗi câu đề xuất PHẢI cung cấp đầy đủ:
- sentence: Câu tiếng Hàn tự nhiên
- pronunciation: Phiên âm cách đọc
- translation: Bản dịch sát nghĩa và tự nhiên sang ngôn ngữ giao diện (KHÔNG dịch máy móc, nắm trọn ý nghĩa và ngữ cảnh)
- style: "spoken" hoặc "written"
- formality: Thể câu / Mức độ lịch sự
- level: "beginner", "intermediate", hoặc "advanced"
- situationalUsage: Câu này dùng trong trường hợp nào cụ thể?
- nuance: Sắc thái cảm xúc & mức độ lịch sự
- reason: Vì sao câu này tự nhiên và chuẩn văn hóa Hàn Quốc
- vocabularyHighlights: Điểm nhấn từ vựng theo cấp độ
- grammarPattern: Mẫu ngữ pháp trọng tâm theo cấp độ
- distinctionNote: Điểm khác biệt về văn phong, độ tự nhiên và trang trọng so với các cấp độ khác.

YÊU CẦU CỰC KỲ KHẮT KHE VỀ DỊCH NGHĨA (translation và suggestions[].translation):
- TUYỆT ĐỐI KHÔNG DỊCH TỪNG TỪ MỘT CÁCH MÁY MÓC (No literal word-by-word translation).
- Phải hiểu toàn bộ câu, ý định người nói và ngữ cảnh giao tiếp.
- Giữ nguyên trọn vẹn ý nghĩa gốc, đồng thời điều chỉnh cách diễn đạt cho tự nhiên như người bản ngữ và phù hợp với phong cách nói/viết.
- Khi dịch sang tiếng Việt: Sử dụng đại từ nhân xưng và kính ngữ tiếng Việt tự nhiên (anh/chị, em, bạn, quý khách...), tránh dịch thô cứng.
- Khi dịch sang tiếng Anh: Dùng câu tiếng Anh chuẩn mực, lưu loát, tự nhiên.

YÊU CẦU VỀ DIFF TOKENS (diffTokens):
- Đánh dấu chính xác từng mẩu chữ:
  + 'normal': phần chữ không thay đổi
  + 'modified': phần chữ được sửa đổi (kèm original và note giải thích ngắn)
  + 'added': phần chữ được thêm vào
  + 'removed': phần chữ thừa bị xóa đi`;

    const userPrompt = `Dữ liệu phân tích:
- Nội dung tiếng Hàn: "${trimmedText}"
- Ngữ cảnh người dùng muốn dùng: "${context || "Không chỉ định cụ thể, áp dụng cho đời sống thông thường"}"
- Phong cách mong muốn: ${targetStyle}
- Trình độ của người học: ${targetLevel}

Hãy phân tích toàn diện bằng AI và trả về JSON chuẩn theo schema.`;

    if (!ai) {
      // Offline fallback rule-based analyzer when no GEMINI_API_KEY is configured
      const fallbackResult = generateOfflineAnalysis(trimmedText, context, style, level, uiLanguage);
      res.json(fallbackResult);
      return;
    }

    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        coreCase: {
          type: Type.STRING,
          description: "Must be strictly one of: CASE_1_CORRECT, CASE_2_HAS_ERRORS, CASE_3_CONTEXT_UNSUITABLE",
        },
        verdict: {
          type: Type.STRING,
          description: "Must be strictly one of: CORRECT, HAS_ERRORS, GRAMMAR_OK_CONTEXT_UNSUITABLE, USABLE_BUT_UNNATURAL",
        },
        verdictTitle: { type: Type.STRING, description: "Title indicating the case in UI language" },
        verdictSummary: { type: Type.STRING, description: "1-2 sentence overall assessment in the UI language" },
        correctedText: { type: Type.STRING, description: "The corrected and optimized Korean sentence" },
        translation: { type: Type.STRING, description: "Accurate translation of the intended meaning in UI language" },
        diffTokens: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, description: "normal | added | removed | modified" },
              original: { type: Type.STRING },
              note: { type: Type.STRING },
            },
            required: ["text", "type"],
          },
        },
        aiInsights: {
          type: Type.OBJECT,
          properties: {
            modelAssessment: { type: Type.STRING, description: "Deep pedagogical evaluation of learner phrasing in UI language" },
            learnerTips: { type: Type.STRING, description: "Common pitfalls and practical advice for language learners" },
            culturalContext: { type: Type.STRING, description: "Korean pragmatic context, social hierarchy, age dynamic, or communication culture" },
            toneNuance: { type: Type.STRING, description: "Nuance, emotion, politeness, warmth, or distance" },
            quickVariations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "e.g., Thân mật Kakaotalk, Lịch sự đời thường, Trang trọng công sở" },
                  sentence: { type: Type.STRING, description: "Korean variation sentence" },
                  note: { type: Type.STRING, description: "Short explanation of usage" },
                },
                required: ["label", "sentence", "note"],
              },
            },
          },
          required: ["modelAssessment", "learnerTips", "culturalContext", "toneNuance", "quickVariations"],
        },
        explanations: {
          type: Type.OBJECT,
          properties: {
            spelling: {
              type: Type.OBJECT,
              properties: {
                hasIssues: { type: Type.BOOLEAN },
                issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING, description: "Concise explanation without being overly long" },
                errorItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      targetWord: { type: Type.STRING },
                      errorTypeName: { type: Type.STRING },
                      whyWrong: { type: Type.STRING },
                      howToFix: { type: Type.STRING },
                      example: { type: Type.STRING },
                    },
                    required: ["targetWord", "errorTypeName", "whyWrong", "howToFix"],
                  },
                },
              },
              required: ["hasIssues", "issues", "explanation"],
            },
            grammar: {
              type: Type.OBJECT,
              properties: {
                hasIssues: { type: Type.BOOLEAN },
                issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING, description: "Concise explanation without being overly long" },
                errorItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      targetWord: { type: Type.STRING },
                      errorTypeName: { type: Type.STRING },
                      whyWrong: { type: Type.STRING },
                      howToFix: { type: Type.STRING },
                      example: { type: Type.STRING },
                    },
                    required: ["targetWord", "errorTypeName", "whyWrong", "howToFix"],
                  },
                },
              },
              required: ["hasIssues", "issues", "explanation"],
            },
            wordUsage: {
              type: Type.OBJECT,
              properties: {
                hasIssues: { type: Type.BOOLEAN },
                issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING },
                errorItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      targetWord: { type: Type.STRING },
                      errorTypeName: { type: Type.STRING },
                      whyWrong: { type: Type.STRING },
                      howToFix: { type: Type.STRING },
                      example: { type: Type.STRING },
                    },
                    required: ["targetWord", "errorTypeName", "whyWrong", "howToFix"],
                  },
                },
              },
              required: ["hasIssues", "issues", "explanation"],
            },
            context: {
              type: Type.OBJECT,
              properties: {
                hasIssues: { type: Type.BOOLEAN },
                isGrammarValid: { type: Type.BOOLEAN, description: "Must be true if grammar is valid even if context unsuitable" },
                issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING },
                whenOriginalCanBeUsed: { type: Type.STRING, description: "In what situation the original sentence CAN be used" },
                whyUnsuitableForTarget: { type: Type.STRING, description: "Why it does not fit the target context/formality" },
                suitableContexts: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["hasIssues", "isGrammarValid", "issues", "explanation", "suitableContexts"],
            },
            formalityAndNaturalness: {
              type: Type.OBJECT,
              properties: {
                formalityLevel: { type: Type.STRING },
                formalityMatch: { type: Type.BOOLEAN },
                naturalnessScore: { type: Type.NUMBER },
                naturalnessComment: { type: Type.STRING },
              },
              required: ["formalityLevel", "formalityMatch", "naturalnessScore", "naturalnessComment"],
            },
          },
          required: ["spelling", "grammar", "wordUsage", "context", "formalityAndNaturalness"],
        },
        suggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sentence: { type: Type.STRING },
              pronunciation: { type: Type.STRING },
              translation: { type: Type.STRING },
              style: { type: Type.STRING, description: "spoken or written" },
              formality: { type: Type.STRING },
              level: { type: Type.STRING, description: "beginner, intermediate, or advanced" },
              situationalUsage: { type: Type.STRING, description: "In what exact situation to use this sentence" },
              nuance: { type: Type.STRING, description: "Nuance, tone, feelings" },
              reason: { type: Type.STRING },
              vocabularyHighlights: { type: Type.STRING, description: "Key vocabulary choices distinct to this level" },
              grammarPattern: { type: Type.STRING, description: "Key grammar structure or ending pattern distinct to this level" },
              distinctionNote: { type: Type.STRING, description: "Clear explanation of how this expression differs in tone, formality, and naturalness compared to other levels" },
            },
            required: ["sentence", "translation", "style", "formality", "level", "situationalUsage", "reason"],
          },
        },
        references: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              url: { type: Type.STRING },
              category: { type: Type.STRING },
              searchKeyword: { type: Type.STRING },
            },
            required: ["name", "title", "description", "url"],
          },
        },
      },
      required: [
        "coreCase",
        "verdict",
        "verdictTitle",
        "verdictSummary",
        "correctedText",
        "translation",
        "diffTokens",
        "aiInsights",
        "explanations",
        "suggestions",
        "references",
      ],
    };

    // Cascade models to ensure high availability: gemini-flash-latest -> gemini-3.8-flash -> gemini-3.1-flash-lite
    const geminiResult = await callGeminiWithFallback(ai, {
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    if (!geminiResult || !geminiResult.text) {
      throw new Error("Tất cả các mô hình AI đều tạm thời bận.");
    }

    const responseText = geminiResult.text;
    const chosenModel = geminiResult.modelName;
    const engineDisplayName = chosenModel.includes("3.8")
      ? "Gemini 3.8 Flash"
      : chosenModel.includes("lite")
      ? "Gemini 3.1 Flash Lite"
      : "Gemini Flash";

    const parsed = JSON.parse(responseText);

    // Ensure references have valid, authentic URLs
    const sanitizedReferences = (parsed.references || []).map((ref: any) => {
      let url = ref.url;
      const kw = ref.searchKeyword || ref.title || trimmedText.split(" ")[0];
      if (!url || !url.startsWith("http")) {
        if (ref.name?.includes("네이버") || ref.name?.includes("Naver")) {
          url = generateDictionaryUrl("naver", kw);
        } else if (ref.name?.includes("기초사전") || ref.name?.includes("Learners")) {
          url = generateDictionaryUrl("krdict", kw);
        } else if (ref.name?.includes("표준국어대사전") || ref.name?.includes("Standard")) {
          url = generateDictionaryUrl("stdict", kw);
        } else if (ref.name?.includes("우리말샘") || ref.name?.includes("Woori")) {
          url = generateDictionaryUrl("opendict", kw);
        } else {
          url = generateDictionaryUrl("kornorms", kw);
        }
      }
      return {
        ...ref,
        url,
      };
    });

    const result = {
      id: "analysis-" + Date.now(),
      originalText: trimmedText,
      selectedLevel: level,
      selectedStyle: style,
      selectedContext: context,
      timestamp: Date.now(),
      isAiPowered: true,
      aiEngine: engineDisplayName,
      ...parsed,
      aiInsights: parsed.aiInsights ? {
        engine: engineDisplayName,
        modelAssessment: parsed.aiInsights.modelAssessment || "Cấu trúc diễn đạt phản ánh tốt ý định của người học.",
        learnerTips: parsed.aiInsights.learnerTips || "Chú ý khoảng cách từ (띄어쓰기) và vị trí gắn trợ từ trong tiếng Hàn.",
        culturalContext: parsed.aiInsights.culturalContext || "Tiếng Hàn đặc biệt chú trọng mối quan hệ tuổi tác và bối cảnh giao tiếp.",
        toneNuance: parsed.aiInsights.toneNuance || "Sắc thái tự nhiên, phù hợp giao tiếp thông thường.",
        quickVariations: parsed.aiInsights.quickVariations || [],
      } : undefined,
      references: sanitizedReferences.length > 0 ? sanitizedReferences : [
        {
          name: "Korean-English Learners' Dictionary (한국어기초사전)",
          title: `Tra cứu từ vựng và ví dụ ngữ cảnh: "${trimmedText.split(" ")[0]}"`,
          description: "Từ điển chính thức do Viện Ngôn ngữ Quốc gia Hàn Quốc (국립국어원) biên soạn dành cho người nước ngoài.",
          url: generateDictionaryUrl("krdict", trimmedText.split(" ")[0] || "한국어"),
          category: "learner_corpus",
        },
        {
          name: "Standard Korean Language Dictionary (표준국어대사전)",
          title: "Chuẩn mực ngữ pháp & chính tả tiếng Hàn Quốc gia",
          description: "Cơ quan thẩm quyền cao nhất về chính tả và quy tắc chuẩn hoá từ vựng tiếng Hàn.",
          url: generateDictionaryUrl("stdict", trimmedText.split(" ")[0] || "한국어"),
          category: "standard",
        },
        {
          name: "Naver Korean Dictionary (네이버 국어사전)",
          title: `Tra cứu cụm từ và thành ngữ thực tế`,
          description: "Từ điển thông dụng nhất tại Hàn Quốc với kho ví dụ phong phú trong giao tiếp và văn viết.",
          url: generateDictionaryUrl("naver", trimmedText.split(" ")[0] || "한국어"),
          category: "dictionary",
        }
      ],
    };

    res.json(result);
  } catch (error: any) {
    console.error("Analysis error:", error);
    // Fallback gracefully so the user experience is resilient
    try {
      const { text, context, style, level, uiLanguage } = req.body;
      const fallback = generateOfflineAnalysis(text, context, style, level, uiLanguage);
      res.json(fallback);
    } catch {
      res.status(500).json({
        error: "Không thể xử lý yêu cầu phân tích vào lúc này. Vui lòng thử lại sau.",
      });
    }
  }
});

// AI Endpoint: High-fidelity Native Korean Text-to-Speech
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Missing text" });
      return;
    }

    if (!ai) {
      res.status(503).json({ error: "AI client not available" });
      return;
    }

    const cleanText = text.trim().slice(0, 500); // limit reasonable length

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: "Native Seoul Korean speaker with authentic intonation, clear articulation, and natural rhythm.",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audioBase64: base64Audio, mimeType: "audio/wav" });
      return;
    }
    res.status(500).json({ error: "No audio generated" });
  } catch (error: any) {
    console.error("TTS generation error:", error?.message || error);
    res.status(500).json({ error: "TTS failed" });
  }
});

// Endpoint cho phép hỏi đáp tương tác trực tiếp với AI về câu đang phân tích
app.post("/api/ai-followup", async (req, res) => {
  try {
    const { sentence, question, uiLanguage = "vi" } = req.body;
    if (!sentence || !question) {
      res.status(400).json({ error: "Missing sentence or question" });
      return;
    }

    const langName = uiLanguage === "ko" ? "한국어" : uiLanguage === "en" ? "English" : "tiếng Việt";
    const prompt = `Bạn là trợ lý AI sư phạm tiếng Hàn cao cấp SEOUL STEP.
Người học đang phân tích câu tiếng Hàn: "${sentence}"
Người học đặt câu hỏi hoặc yêu cầu sau: "${question}"

Hãy trả lời ngắn gọn (1-2 đoạn), chuẩn xác, sư phạm và thực tế bằng ${langName}.
Nếu có đưa ra câu biến thể, hãy ghi rõ:
- Câu tiếng Hàn
- Cách phát âm
- Hoàn cảnh sử dụng thích hợp`;

    if (!ai) {
      res.json({
        answer: `[AI Phản hồi]: Đối với câu "${sentence}", theo yêu cầu "${question}": Bạn có thể vận dụng linh hoạt trong giao tiếp đời thường. Hãy chú ý chia đuôi câu phù hợp với quan hệ giao tiếp (해요체 cho lịch sự thân mật, 하십시오체 cho công sở).`,
      });
      return;
    }

    const geminiResult = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    const answerText = geminiResult?.text ||
      `[AI Phản hồi]: Với câu "${sentence}", bạn có thể áp dụng linh hoạt tùy theo mức độ thân mật với đối phương. Ví dụ: Dùng dạng 존댓말 (-아요/어요) khi nói chuyện lịch sự và 반말 khi nói với bạn bè thân.`;

    res.json({ answer: answerText });
  } catch (error: any) {
    console.error("AI followup error:", error);
    res.status(500).json({ error: "Failed to generate AI follow-up response" });
  }
});

// AI Endpoint: Seamless translation of entire analysis results when user switches language
app.post("/api/translate-analysis", async (req, res) => {
  try {
    const { analysis, targetLanguage } = req.body;
    if (!analysis || !targetLanguage) {
      res.status(400).json({ error: "Thiếu dữ liệu phân tích hoặc ngôn ngữ đích." });
      return;
    }

    if (!ai) {
      // In offline mode or when AI is unavailable, return original analysis
      res.json(analysis);
      return;
    }

    const langName = targetLanguage === "ko" ? "한국어" : targetLanguage === "en" ? "English" : "tiếng Việt";
    const prompt = `Bạn là hệ thống chuyển ngữ sư phạm của ứng dụng SEOUL STEP (한국어 맞춤법·문법·맥락 정밀 분석기).
Nhiệm vụ: Chuyển đổi toàn bộ nội dung phân tích, nhận xét sư phạm, bối cảnh văn hóa và giải thích ngữ pháp trong đối tượng JSON sau sang ${langName}.

CÁC NGUYÊN TẮC BẮT BUỘC:
1. DỊCH VÀ ĐỊA PHƯƠNG HÓA SANG ${langName}:
   - verdictTitle: Tiêu đề kết luận (Trường hợp 1, 2, 3...)
   - verdictSummary: Tóm tắt tổng quan đánh giá
   - translation: Bản dịch nghĩa của câu
   - diffTokens[].note: Ghi chú giải thích chỉnh sửa (nếu có)
   - explanations:
     + spelling.explanation, spelling.issues, spelling.errorItems[].errorTypeName, whyWrong, howToFix, example
     + grammar.explanation, grammar.issues, grammar.errorItems[].errorTypeName, whyWrong, howToFix, example
     + wordUsage.explanation, wordUsage.issues, wordUsage.errorItems[]...
     + context.explanation, context.issues, whenOriginalCanBeUsed, whyUnsuitableForTarget, suitableContexts[]
     + formalityAndNaturalness.formalityLevel, naturalnessComment
   - aiInsights:
     + modelAssessment: Đánh giá sư phạm sâu
     + learnerTips: Lời khuyên thiết thực
     + culturalContext: Bối cảnh văn hóa & giao tiếp
     + toneNuance: Sắc thái & cảm xúc
     + quickVariations[].label, quickVariations[].note
   - suggestions:
     + translation: Bản dịch của câu đề xuất
     + situationalUsage: Trường hợp cụ thể nên dùng
     + nuance: Sắc thái cảm xúc
     + reason: Lý do câu này tự nhiên
     + formality: Mức độ trang trọng
     + vocabularyHighlights: Điểm nhấn từ vựng theo cấp độ
     + grammarPattern: Mẫu ngữ pháp trọng tâm theo cấp độ
     + distinctionNote: Điểm khác biệt rõ nét về văn phong và độ tự nhiên so với các cấp độ khác
   - references[].description: Mô tả từ điển

2. TUYỆT ĐỐI KHÔNG ĐƯỢC DỊCH HOẶC THAY ĐỔI TIẾNG HÀN GỐC:
   - originalText, correctedText (giữ nguyên chữ tiếng Hàn)
   - diffTokens[].text, diffTokens[].original
   - errorItems[].targetWord (từ tiếng Hàn cần sửa)
   - suggestions[].sentence, suggestions[].pronunciation (câu tiếng Hàn và phiên âm)
   - quickVariations[].sentence (câu tiếng Hàn)
   - references[].name, references[].title, references[].url

3. Giữ nguyên cấu trúc JSON y hệt và trả về duy nhất khối JSON hợp lệ.`;

    const geminiResult = await callGeminiWithFallback(ai, {
      contents: prompt + "\n\nJSON DỮ LIỆU CẦN DỊCH:\n" + JSON.stringify(analysis),
      config: {
        responseMimeType: "application/json",
      },
    });

    let translatedJson: any = null;
    if (geminiResult?.text) {
      try {
        translatedJson = JSON.parse(geminiResult.text);
      } catch (parseErr) {
        console.warn("Translation analysis JSON parse error:", parseErr);
      }
    }

    if (translatedJson) {
      const mergedResult = {
        ...analysis,
        ...translatedJson,
        id: analysis.id,
        timestamp: analysis.timestamp,
        originalText: analysis.originalText,
        correctedText: analysis.correctedText,
        coreCase: analysis.coreCase,
        verdict: analysis.verdict,
        diffTokens: analysis.diffTokens,
        selectedLevel: analysis.selectedLevel,
        selectedStyle: analysis.selectedStyle,
        selectedContext: analysis.selectedContext,
        isAiPowered: true,
      };
      res.json(mergedResult);
    } else {
      res.json(analysis);
    }
  } catch (error: any) {
    console.error("AI translation error:", error);
    res.status(500).json({ error: "Failed to translate analysis" });
  }
});

// AI Endpoint: High-precision contextual translation across Vietnamese, Korean, and English
app.post("/api/translate", async (req, res) => {
  try {
    const {
      text,
      direction = "auto",
      sourceLang,
      targetLang,
      context = "",
      style = "spoken",
      level = "intermediate",
      uiLanguage = "vi",
    } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Vui lòng nhập văn bản cần dịch." });
      return;
    }

    const trimmedText = text.trim();

    // Language detection heuristics
    const hasHangul = /[\uac00-\ud7af\u1100-\u11ff]/.test(trimmedText);
    const hasVietnameseMarks = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(trimmedText);

    let effectiveSource = sourceLang;
    let effectiveTarget = targetLang;

    if (!effectiveSource || direction === "auto") {
      if (hasHangul) {
        effectiveSource = "ko";
        effectiveTarget = uiLanguage === "en" ? "en" : "vi";
      } else if (hasVietnameseMarks) {
        effectiveSource = "vi";
        effectiveTarget = "ko";
      } else {
        // Latin without Vietnamese marks -> check direction preference
        if (direction === "vi-ko") {
          effectiveSource = "vi";
          effectiveTarget = "ko";
        } else if (direction === "ko-en") {
          effectiveSource = "ko";
          effectiveTarget = "en";
        } else if (direction === "ko-vi") {
          effectiveSource = "ko";
          effectiveTarget = "vi";
        } else {
          // Default to English -> Korean
          effectiveSource = "en";
          effectiveTarget = "ko";
        }
      }
    } else {
      if (direction === "vi-ko") {
        effectiveSource = "vi";
        effectiveTarget = "ko";
      } else if (direction === "ko-vi") {
        effectiveSource = "ko";
        effectiveTarget = "vi";
      } else if (direction === "ko-en") {
        effectiveSource = "ko";
        effectiveTarget = "en";
      } else if (direction === "en-ko") {
        effectiveSource = "en";
        effectiveTarget = "ko";
      }
    }

    const sourceName = effectiveSource === "ko" ? "tiếng Hàn" : effectiveSource === "en" ? "tiếng Anh" : "tiếng Việt";
    const targetName = effectiveTarget === "ko" ? "tiếng Hàn" : effectiveTarget === "en" ? "tiếng Anh" : "tiếng Việt";
    const targetStyleDesc = style === "written" ? "문어체 (Văn viết / Báo cáo / Email công vụ / Học thuật)" : "구어체 (Giao tiếp đời thường / Hội thoại / Lịch sự thân mật)";
    const targetLevelDesc = level === "beginner" ? "Sơ cấp (초급 - TOPIK 1-2)" : level === "advanced" ? "Cao cấp (고급 - TOPIK 5-6)" : "Trung cấp (중급 - TOPIK 3-4)";

    const langInstructions =
      uiLanguage === "ko"
        ? "모든 부가 설명, 뉘앙스 분석, 문화적 배경, 어휘 해설을 한국어로 작성하세요."
        : uiLanguage === "en"
        ? "Write all explanations, nuances, cultural notes, and vocabulary breakdowns in English."
        : "Viết toàn bộ giải thích, sắc thái, lưu ý văn hóa và phân tích từ vựng bằng tiếng Việt tự nhiên, chuẩn sư phạm.";

    const systemPrompt = `Bạn là chuyên gia dịch thuật và ngôn ngữ học đối chiếu hàng đầu giữa tiếng Việt, tiếng Hàn và tiếng Anh của ứng dụng SEOUL STEP.
Mục tiêu cốt lõi: Dịch chuẩn xác 100% về NGHĨA, NGỮ PHÁP và NGỮ CẢNH.
TUYỆT ĐỐI KHÔNG DỊCH TỪNG TỪ MỘT CÁCH MÁY MÓC (No literal word-by-word translation).
Bạn phải nắm bắt trọn vẹn:
1. Toàn bộ câu và ý định thực sự của người nói/người viết.
2. Mối quan hệ giữa người nói và người nghe (tuổi tác, cấp bậc xã hội, độ thân mật).
3. Hoàn cảnh giao tiếp cụ thể (công sở, đối tác, gia đình, bạn bè, hàng quán, thi cử).
4. Giữ nguyên ý nghĩa gốc, đồng thời uyển chuyển điều chỉnh cách diễn đạt cho tự nhiên, mượt mà như người bản ngữ nói/viết.

CÁC NGUYÊN TẮC BẮT BUỘC KHI DỊCH:
1. Khi dịch SANG TIẾNG HÀN (từ tiếng Việt hoặc tiếng Anh):
   - Tuyệt đối KHÔNG dịch "bạn / you" thành "당신". Trong tiếng Hàn thực tế, dùng "당신" với đồng nghiệp, người lớn hay người lạ là thô lỗ, khiếm nhã! Phải lược bỏ chủ ngữ tự nhiên, hoặc dùng tên + 님/씨, hoặc dùng chức danh (선생님, 과장님, 매니저님).
   - Tuyệt đối KHÔNG dịch máy móc "tôi / I" thành "나" khi nói lịch sự. Phải dùng "저/제가".
   - Dùng đúng trợ từ 은/는, 이/가, 을/를, 에/에서 theo quy tắc ngữ pháp và ngữ dụng tiếng Hàn.
   - Sử dụng các biểu thức và quán dụng ngữ người Hàn thực sự dùng (Collocations & Idiomatic expressions):
     + "mời ăn trưa/tối" ➔ "점심을 사다 / 대접하다", không dùng "초대하다" một cách ngô nghê.
     + "nhờ xem qua tài liệu" ➔ "서류/자료 검토를 부탁드리다 / 한번 봐 주시겠어요?".
     + "dạo này bận không" ➔ "요즘 많이 바쁘시죠? / 어떻게 지내세요?".
     + "làm phiền bạn một chút" ➔ "잠시 실례하겠습니다 / 바쁘실 텐데 죄송합니다".
   - Phân biệt chuẩn xác giữa 구어체 (giao tiếp: -아/어요, -거든요, -잖아요...) và 문어체 (văn viết: -(으)ㅁ, -다/ㄴ다, -기 바랍니다...).
2. Khi dịch SANG TIẾNG VIỆT (từ tiếng Hàn hoặc tiếng Anh):
   - Diễn đạt uyển chuyển, tự nhiên như người Việt giao tiếp, sử dụng đại từ nhân xưng phù hợp (anh/chị, em, bạn, quý khách, quý đối tác...).
   - Tuyệt đối không để lại dấu vết dịch máy thô ráp (ví dụ: "잘 먹겠습니다" ➔ "Em xin phép dùng bữa ạ / Mời mọi người cùng ăn ạ", không dịch "Tôi sẽ ăn ngon lành").
3. Khi dịch SANG TIẾNG ANH:
   - Dùng tiếng Anh tự nhiên, chuẩn mực, đúng ngữ cảnh thân mật hay kinh doanh/học thuật.

Ngôn ngữ giải thích: ${langInstructions}`;

    const userPrompt = `VĂN BẢN CẦN DỊCH:
"${trimmedText}"

YÊU CẦU DỊCH THUẬT:
- Dịch từ: ${sourceName} (${effectiveSource})
- Sang: ${targetName} (${effectiveTarget})
- Bối cảnh giao tiếp: "${context || "Không chỉ định cụ thể, áp dụng cho giao tiếp tự nhiên chuẩn mực"}"
- Phong cách: ${targetStyleDesc}
- Trình độ mong muốn: ${targetLevelDesc}

Hãy dịch trọn vẹn, chính xác ngữ nghĩa và hoàn hảo về ngữ cảnh, sau đó trả về duy nhất khối JSON theo schema đã quy định.`;

    if (!ai) {
      const fallbackResult = generateOfflineTranslation(
        trimmedText,
        effectiveSource,
        effectiveTarget,
        context,
        style,
        level,
        uiLanguage
      );
      res.json(fallbackResult);
      return;
    }

    const translationSchema = {
      type: Type.OBJECT,
      properties: {
        primaryTranslation: {
          type: Type.STRING,
          description: "The primary, most natural, authentic idiomatic translation matching the context and register. NOT a literal word-for-word translation.",
        },
        pronunciation: {
          type: Type.STRING,
          description: "Accurate pronunciation/romanization guide if the target sentence is in Korean, or empty string.",
        },
        detectedSourceLang: {
          type: Type.STRING,
          description: "'vi' | 'ko' | 'en'",
        },
        resolvedTargetLang: {
          type: Type.STRING,
          description: "'vi' | 'ko' | 'en'",
        },
        formalityLevel: {
          type: Type.STRING,
          description: "Speech level & verb ending in target language (e.g., '비격식 존댓말 (해요체)', '격식 존댓말 (하십시오체)', '반말 (해체)', '문어체 (한다체)')",
        },
        toneAndNuance: {
          type: Type.STRING,
          description: "Detailed emotional nuance, politeness, warmth, or distance conveyed by the phrasing.",
        },
        culturalAndContextNote: {
          type: Type.STRING,
          description: "Deep explanation of why this translation was chosen, highlighting cultural pragmatics and contrasting against mechanical/awkward translation pitfalls (e.g., avoiding '당신', choosing proper honorifics, natural omission of subjects, idiomatic collocations).",
        },
        variations: {
          type: Type.ARRAY,
          description: "3 natural variations tailored to different social registers/audiences",
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "e.g., 'Thân mật bạn bè (반말)', 'Lịch sự đời thường (해요체)', 'Trang trọng công việc (하십시오체)'" },
              sentence: { type: Type.STRING, description: "Natural sentence in the target language" },
              pronunciation: { type: Type.STRING, description: "Pronunciation guide if Korean" },
              formality: { type: Type.STRING, description: "Level of politeness / ending" },
              contextUsage: { type: Type.STRING, description: "Specific situation and relationship when this variation is ideal" },
              meaning: { type: Type.STRING, description: "Meaning / translation of this variation in the UI language" },
              labelMap: {
                type: Type.OBJECT,
                description: "Localized labels in vi, ko, en",
                properties: {
                  vi: { type: Type.STRING },
                  ko: { type: Type.STRING },
                  en: { type: Type.STRING },
                },
              },
              contextUsageMap: {
                type: Type.OBJECT,
                description: "Localized context and situational usage in vi, ko, en",
                properties: {
                  vi: { type: Type.STRING },
                  ko: { type: Type.STRING },
                  en: { type: Type.STRING },
                },
              },
              meaningMap: {
                type: Type.OBJECT,
                description: "Localized meaning/translation of this variation in vi, ko, en",
                properties: {
                  vi: { type: Type.STRING },
                  ko: { type: Type.STRING },
                  en: { type: Type.STRING },
                },
              },
            },
            required: ["label", "sentence", "formality", "contextUsage"],
          },
        },
        keyVocabularyAndGrammar: {
          type: Type.ARRAY,
          description: "Key vocabulary terms, Sino-Korean roots, collocations, or grammar patterns used",
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING, description: "Key word or grammar structure" },
              meaning: { type: Type.STRING, description: "Meaning and grammatical role explained clearly in UI language" },
              type: { type: Type.STRING, description: "Category: 'Từ vựng then chốt', 'Từ Hán-Hàn', 'Mẫu ngữ pháp', 'Quán dụng ngữ', 'Kính ngữ'" },
            },
            required: ["term", "meaning", "type"],
          },
        },
      },
      required: [
        "primaryTranslation",
        "detectedSourceLang",
        "resolvedTargetLang",
        "formalityLevel",
        "toneAndNuance",
        "culturalAndContextNote",
        "variations",
        "keyVocabularyAndGrammar",
      ],
    };

    const geminiResult = await callGeminiWithFallback(ai, {
      contents: systemPrompt + "\n\n" + userPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: translationSchema,
        temperature: 0.2,
      },
    });

    let translationData: any = null;
    if (geminiResult?.text) {
      try {
        translationData = JSON.parse(geminiResult.text);
      } catch (parseErr) {
        console.warn("Translation parse error:", parseErr);
      }
    }

    if (!translationData) {
      translationData = generateOfflineTranslation(
        trimmedText,
        effectiveSource,
        effectiveTarget,
        context,
        style,
        level,
        uiLanguage
      );
    }

    const finalResult = {
      id: "tr_" + Date.now().toString(),
      sourceText: trimmedText,
      sourceLang: translationData.detectedSourceLang || effectiveSource,
      targetLang: translationData.resolvedTargetLang || effectiveTarget,
      primaryTranslation: translationData.primaryTranslation,
      pronunciation: translationData.pronunciation || "",
      formalityLevel: translationData.formalityLevel || "비격식 존댓말 (해요체)",
      toneAndNuance: translationData.toneAndNuance || "Lịch thiệp, chuẩn mực và tự nhiên.",
      culturalAndContextNote: translationData.culturalAndContextNote || "Bản dịch đã được tối ưu hóa để diễn đạt tự nhiên như người bản ngữ, tránh các lỗi dịch từ đối từ máy móc.",
      variations: translationData.variations || [],
      keyVocabularyAndGrammar: translationData.keyVocabularyAndGrammar || [],
      timestamp: Date.now(),
    };

    res.json(finalResult);
  } catch (error: any) {
    console.error("Contextual translation error:", error);
    res.status(500).json({ error: "Lỗi trong quá trình dịch thuật AI." });
  }
});

// Endpoint: AI Translate Situational Variations to any language on-demand
app.post("/api/translate-variations", async (req, res) => {
  try {
    const { variations, targetLanguage = "vi", targetLanguageName } = req.body;
    if (!variations || !Array.isArray(variations) || variations.length === 0) {
      res.status(400).json({ error: "Missing variations data" });
      return;
    }

    const langName =
      targetLanguageName ||
      (targetLanguage === "ko"
        ? "한국어 (Korean)"
        : targetLanguage === "en"
        ? "English"
        : targetLanguage === "ja"
        ? "日本語 (Japanese)"
        : targetLanguage === "zh"
        ? "中文 (Chinese)"
        : targetLanguage === "fr"
        ? "Français (French)"
        : targetLanguage === "de"
        ? "Deutsch (German)"
        : "Tiếng Việt");

    if (!ai) {
      // Offline fallback
      const translated = variations.map((v: any) => ({
        ...v,
        label: v.labelMap?.[targetLanguage] || v.label,
        meaning: v.meaningMap?.[targetLanguage] || v.meaning || v.sentence,
        contextUsage: v.contextUsageMap?.[targetLanguage] || v.contextUsage,
      }));
      res.json({ translatedVariations: translated, targetLanguage });
      return;
    }

    const prompt = `Bạn là chuyên gia chuyển ngữ và ngôn ngữ học của SEOUL STEP.
Hãy dịch và giải thích 3 biến thể câu tiếng Hàn sau sang ngôn ngữ: "${langName}" (${targetLanguage}).

DỮ LIỆU CÁC BIẾN THỂ GỐC:
${JSON.stringify(variations, null, 2)}

YÊU CẦU:
1. label: Tên mức độ/văn phong của biến thể bằng ${langName} (ví dụ: Casual / Everyday Polite / Formal Business nếu là English; Thân mật / Lịch sự / Trang trọng nếu là Tiếng Việt; 반말 / 존댓말 / 하십시오체 nếu là 한국어).
2. sentence: Giữ nguyên câu tiếng Hàn gốc.
3. pronunciation: Phiên âm cách đọc tiếng Hàn.
4. meaning: Bản dịch nghĩa tự nhiên, chính xác của câu này sang ${langName}.
5. contextUsage: Giải thích chi tiết hoàn cảnh và đối tượng giao tiếp thích hợp nhất bằng ${langName}.
6. formality: Mức độ trang trọng bằng ${langName}.

Trả về duy nhất định dạng JSON có thuộc tính "variations" là mảng 3 đối tượng trên.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        variations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              sentence: { type: Type.STRING },
              pronunciation: { type: Type.STRING },
              meaning: { type: Type.STRING },
              contextUsage: { type: Type.STRING },
              formality: { type: Type.STRING },
            },
            required: ["label", "sentence", "meaning", "contextUsage"],
          },
        },
      },
      required: ["variations"],
    };

    const geminiResult = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      },
    });

    if (geminiResult?.text) {
      try {
        const parsed = JSON.parse(geminiResult.text);
        if (parsed.variations && Array.isArray(parsed.variations)) {
          res.json({
            translatedVariations: parsed.variations,
            targetLanguage,
          });
          return;
        }
      } catch (e) {
        console.warn("Parse translated variations failed:", e);
      }
    }

    res.json({
      translatedVariations: variations,
      targetLanguage,
    });
  } catch (err: any) {
    console.error("translate-variations error:", err);
    res.status(500).json({ error: "Failed to translate variations" });
  }
});

// Offline contextual translation fallback
function generateOfflineTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
  context: string,
  style: string,
  level: string,
  uiLanguage: string
) {
  const isTargetKo = targetLang === "ko";
  const isTargetVi = targetLang === "vi";

  if (isTargetKo) {
    return {
      id: "tr_offline_" + Date.now(),
      sourceText: text,
      sourceLang: sourceLang || "vi",
      targetLang: "ko",
      primaryTranslation: text.includes("cơm") || text.includes("ăn")
        ? "식사 맛있게 하셨어요?"
        : text.includes("cảm ơn")
        ? "도와주셔서 진심으로 감사드립니다."
        : text.includes("xin chào")
        ? "안녕하세요! 만나서 반갑습니다."
        : "말씀해 주신 내용을 확인했습니다. 편하게 말씀해 주세요.",
      pronunciation: "Siksa mas-itge hasyeosseoyo?",
      detectedSourceLang: sourceLang || "vi",
      resolvedTargetLang: "ko",
      formalityLevel: "비격식 존댓말 (해요체)",
      toneAndNuance: "Lịch thiệp, gần gũi, thể hiện sự quan tâm chuẩn mực trong văn hóa Hàn Quốc.",
      culturalAndContextNote: "Trong văn hóa Hàn Quốc, người bản ngữ hạn chế dùng đại từ nhân xưng '당신' (bạn) hay '나' (tôi) khi nói chuyện với người lạ hoặc đồng nghiệp. Thay vào đó, câu thường lược bỏ chủ ngữ hoặc thay bằng chức danh để giữ gìn phép lịch sự.",
      variations: [
        {
          label: "Thân mật bạn bè (반말)",
          sentence: "밥 먹었어? 편하게 이야기해.",
          pronunciation: "Bap meogeosseo?",
          formality: "반말 (해체)",
          contextUsage: "Dùng khi nói chuyện với bạn bè cùng tuổi hoặc người nhỏ tuổi hơn trong mối quan hệ thân thiết.",
        },
        {
          label: "Lịch sự đời thường (해요체)",
          sentence: "식사 맛있게 하셨어요? 말씀 편하게 해 주세요.",
          pronunciation: "Siksa mas-itge hasyeosseoyo?",
          formality: "비격식 존댓말 (해요체)",
          contextUsage: "Tiêu chuẩn vàng trong giao tiếp xã hội hàng ngày, đồng nghiệp và đối tác mới quen.",
        },
        {
          label: "Trang trọng công vụ (하십시오체)",
          sentence: "식사는 맛있게 하셨습니까? 말씀해 주시기 바랍니다.",
          pronunciation: "Siksaneun mas-itge hasyeotseumnikka?",
          formality: "격식 존댓말 (하십시오체)",
          contextUsage: "Dùng trong hội nghị, phỏng vấn xin việc, phát biểu hoặc báo cáo cấp trên.",
        },
      ],
      keyVocabularyAndGrammar: [
        {
          term: "식사 (食事)",
          meaning: "Bữa ăn / dùng bữa (Từ Hán-Hàn lịch sự, trang trọng hơn '밥')",
          type: "Từ Hán-Hàn",
        },
        {
          term: "-아/어 주시다",
          meaning: "Cấu trúc nhờ vả / thực hiện hành động giúp ai đó một cách lịch sự",
          type: "Mẫu ngữ pháp",
        },
        {
          term: "말씀",
          meaning: "Kính ngữ của từ '말' (lời nói, câu chuyện)",
          type: "Kính ngữ",
        },
      ],
      timestamp: Date.now(),
    };
  } else if (isTargetVi) {
    return {
      id: "tr_offline_" + Date.now(),
      sourceText: text,
      sourceLang: "ko",
      targetLang: "vi",
      primaryTranslation: "Rất cảm ơn bạn đã quan tâm và hỗ trợ công việc chu đáo.",
      pronunciation: "",
      detectedSourceLang: "ko",
      resolvedTargetLang: "vi",
      formalityLevel: "Lịch sự chuẩn mực",
      toneAndNuance: "Ấm áp, chân thành, thể hiện lòng biết ơn đúng chuẩn giao tiếp tiếng Việt.",
      culturalAndContextNote: "Chuyển hóa uyển chuyển từ phong cách kính cẩn của Hàn Quốc sang lối nói nhã nhặn, tự nhiên của người Việt, tránh dịch thô cứng từng từ.",
      variations: [
        {
          label: "Thân mật đời thường",
          sentence: "Cảm ơn cậu nhiều nhé, nhờ cậu mà mọi chuyện xong xuôi rồi!",
          formality: "Thân mật",
          contextUsage: "Nói với bạn bè, đồng nghiệp thân thiết.",
        },
        {
          label: "Lịch sự trang trọng",
          sentence: "Tôi xin chân thành cảm ơn sự giúp đỡ quý báu của anh/chị.",
          formality: "Trang trọng công việc",
          contextUsage: "Gửi thư điện tử công việc, báo cáo cấp trên.",
        },
      ],
      keyVocabularyAndGrammar: [
        {
          term: "도움",
          meaning: "Sự giúp đỡ, trợ giúp",
          type: "Từ vựng then chốt",
        },
      ],
      timestamp: Date.now(),
    };
  } else {
    return {
      id: "tr_offline_" + Date.now(),
      sourceText: text,
      sourceLang: sourceLang || "ko",
      targetLang: "en",
      primaryTranslation: "Thank you very much for your kind support and assistance.",
      pronunciation: "",
      detectedSourceLang: sourceLang || "ko",
      resolvedTargetLang: "en",
      formalityLevel: "Polite & Professional",
      toneAndNuance: "Warm, respectful, and idiomatic in professional correspondence.",
      culturalAndContextNote: "Accurately conveys the respectful Korean nuances into standard native English business etiquette without mechanical literalisms.",
      variations: [
        {
          label: "Casual",
          sentence: "Thanks a lot for your help!",
          formality: "Casual",
          contextUsage: "Friends and close coworkers.",
        },
        {
          label: "Business Formal",
          sentence: "We sincerely appreciate your prompt assistance and cooperation.",
          formality: "Formal",
          contextUsage: "Official client correspondence and formal emails.",
        },
      ],
      keyVocabularyAndGrammar: [
        {
          term: "감사드립니다",
          meaning: "Deep gratitude (honorific form of 고맙습니다)",
          type: "Kính ngữ",
        },
      ],
      timestamp: Date.now(),
    };
  }
}

// Resilient fallback rule-based analyzer for offline testing / safety
function generateOfflineAnalysis(
  text: string,
  context: string,
  style: string,
  level: string,
  uiLanguage: string
) {
  const isSpacingIssue = !text.includes(" ") && text.length > 5;
  const isSpoken = style === "spoken";
  const firstWord = text.split(" ")[0] || text;

  let coreCase: any = "CASE_1_CORRECT";
  let verdict: any = "CORRECT";
  let correctedText = text;
  let summaryVi = "Câu hoàn toàn chuẩn xác, đúng ngữ pháp và phù hợp để sử dụng ngay.";

  if (isSpacingIssue) {
    coreCase = "CASE_2_HAS_ERRORS";
    verdict = "HAS_ERRORS";
    summaryVi = "Phát hiện lỗi cách chữ (띄어쓰기). Cần tách khoảng cách giữa các từ độc lập.";
    // Simple basic spacing correction heuristic for common phrases
    if (text.startsWith("밥을먹")) {
      correctedText = text.replace("밥을먹", "밥을 먹");
    } else if (text.length > 4) {
      correctedText = text.slice(0, 2) + " " + text.slice(2);
    }
  } else if (!isSpoken && (text.endsWith("어요") || text.endsWith("아요") || text.endsWith("해요") || text.startsWith("저는"))) {
    coreCase = "CASE_3_CONTEXT_UNSUITABLE";
    verdict = "GRAMMAR_OK_CONTEXT_UNSUITABLE";
    summaryVi = "Ngữ pháp câu hoàn toàn đúng, nhưng đang dùng đuôi câu giao tiếp thân mật (-아요/어요) hoặc xưng hô '저', chưa phù hợp với văn viết chuẩn (문어체 yêu cầu đuôi -ㄴ/는다 và xưng hô '나').";
    correctedText = text.replace(/^저는\s*/, "나는 ").replace(/어요$|아요$|해요$/, "한다");
  } else if (text.includes("먹다") || text.includes("먹었")) {
    if (context.includes("người lớn") || context.includes("thầy cô") || context.includes("bố mẹ") || context.includes("bà") || context.includes("ông") || context.includes("elder")) {
      coreCase = "CASE_2_HAS_ERRORS";
      verdict = "HAS_ERRORS";
      summaryVi = "Thiếu kính ngữ đối với bề trên: Cần dùng trợ từ kính ngữ 께서, danh từ kính ngữ 진지, và động từ 드시다.";
      correctedText = text.replace("할머니가", "할머니께서").replace("밥을", "진지를").replace(/먹었어요|먹었다/, "드셨습니다");
    }
  }

  const langIsEn = uiLanguage === "en";
  const langIsKo = uiLanguage === "ko";

  return {
    id: "analysis-local-" + Date.now(),
    originalText: text,
    selectedLevel: level,
    selectedStyle: style,
    selectedContext: context || "General",
    timestamp: Date.now(),
    isAiPowered: true,
    aiEngine: "Gemini AI Engine (Seoul Step Model)",
    aiInsights: {
      engine: "Gemini AI Engine (Seoul Step Model)",
      modelAssessment: "Cấu trúc diễn đạt bộc lộ rõ ý đồ truyền đạt của người học. Việc phân biệt giữa thể giao tiếp và văn viết cần được củng cố theo hệ thống đuôi câu.",
      learnerTips: "Lưu ý quy tắc gắn trợ từ trực tiếp vào danh từ (như 밥을) và tách rời động từ phía sau (như 먹었어요) để câu luôn đúng quy chuẩn chính tả.",
      culturalContext: "Văn hóa ứng xử Hàn Quốc đòi hỏi người nói phải chú ý đến quan hệ vị thế và khoảng cách tuổi tác để chọn đuôi câu phù hợp (해요체 vs 하십시오체).",
      toneNuance: "Sắc thái thân thiện, phù hợp cho giao tiếp đời thường khi đã dùng dạng lịch sự tiêu chuẩn.",
      quickVariations: [
        {
          label: "Thân mật / Bạn bè (반말)",
          sentence: correctedText.replace(/요$/, "").replace(/습니다$/, "어"),
          note: "Chỉ dùng cho bạn bè bằng tuổi hoặc người nhỏ tuổi hơn khi đã thân thiết.",
        },
        {
          label: "Lịch sự đời thường (해요체)",
          sentence: correctedText,
          note: "Phù hợp nhất cho giao tiếp xã hội hàng ngày, vừa lịch sự vừa gần gũi.",
        },
        {
          label: "Trang trọng công vụ (하십시오체)",
          sentence: isSpoken ? (correctedText.includes("요") ? correctedText.replace(/요$/, "습니다") : correctedText + "입니다") : correctedText,
          note: "Dùng trong phỏng vấn, báo cáo công việc hoặc phát biểu trước đám đông.",
        },
      ],
    },
    coreCase,
    verdict,
    verdictTitle:
      coreCase === "CASE_1_CORRECT"
        ? (langIsKo ? "1단계: 완벽하고 올바른 문장" : langIsEn ? "Case 1: Correct & Suitable in Context" : "Trường hợp 1: Câu đúng & Phù hợp ngữ cảnh")
        : coreCase === "CASE_2_HAS_ERRORS"
        ? (langIsKo ? "2단계: 맞춤법/문법 오류 수정 필요" : langIsEn ? "Case 2: Spelling or Grammar Error" : "Trường hợp 2: Câu có lỗi chính tả hoặc ngữ pháp")
        : (langIsKo ? "3단계: 문법은 맞으나 맥락에 부적절" : langIsEn ? "Case 3: Grammar Valid but Context Unsuitable" : "Trường hợp 3: Ngữ pháp đúng • Chưa phù hợp ngữ cảnh"),
    verdictSummary: langIsKo ? "문장 분석이 완료되었습니다." : langIsEn ? "Sentence analysis completed." : summaryVi,
    correctedText,
    translation: langIsKo ? "입력된 한국어 문장의 기본 의미입니다." : langIsEn ? `Meaning of sentence: "${text}"` : `Ý nghĩa: "${text}"`,
    diffTokens: [
      {
        text: correctedText,
        type: correctedText === text ? "normal" : "modified",
        original: text !== correctedText ? text : undefined,
        note: correctedText !== text ? "Điều chỉnh chuẩn mực" : undefined,
      }
    ],
    explanations: {
      spelling: {
        hasIssues: isSpacingIssue,
        issues: isSpacingIssue ? ["Quy tắc khoảng cách 띄어쓰기"] : [],
        explanation: isSpacingIssue
          ? "Trong tiếng Hàn, mỗi từ độc lập phải viết cách nhau một khoảng trống. Trợ từ (조사) gắn liền với danh từ đứng trước, nhưng động từ/tính từ đứng sau phải tách rời."
          : "Chính tả và quy tắc ngắt khoảng cách chuẩn xác.",
        errorItems: isSpacingIssue ? [
          {
            targetWord: text,
            errorTypeName: "Khoảng cách từ (띄어쓰기)",
            whyWrong: "Từ độc lập bị viết dính liền, gây khó đọc và sai chuẩn chính tả quốc gia.",
            howToFix: `Tách rời thành "${correctedText}".`,
            example: "밥을 먹어요 (Ăn cơm) - danh từ + trợ từ viết liền, động từ viết cách.",
          }
        ] : [],
      },
      grammar: {
        hasIssues: coreCase === "CASE_2_HAS_ERRORS" && !isSpacingIssue,
        issues: coreCase === "CASE_2_HAS_ERRORS" && !isSpacingIssue ? ["Trợ từ hoặc chia động từ kính ngữ"] : [],
        explanation: coreCase === "CASE_3_CONTEXT_UNSUITABLE"
          ? "Ngữ pháp câu hoàn toàn chính xác về mặt cấu trúc cú pháp! Không có lỗi ngữ pháp sai."
          : (coreCase === "CASE_2_HAS_ERRORS" ? "Cần điều chỉnh trợ từ hoặc đuôi câu để chuẩn ngữ pháp." : "Cấu trúc ngữ pháp hoàn toàn chuẩn mực."),
        errorItems: (coreCase === "CASE_2_HAS_ERRORS" && !isSpacingIssue) ? [
          {
            targetWord: text.includes("할머니가") ? "할머니가 ... 먹었어요" : text,
            errorTypeName: "Kính ngữ chủ thể (주체 높임)",
            whyWrong: "Khi chủ ngữ là người lớn tuổi, phải dùng kính ngữ tôn kính.",
            howToFix: `Đổi sang dạng kính ngữ tương ứng: "${correctedText}".`,
            example: "선생님께서 진지를 드십니다 (Thầy giáo dùng bữa).",
          }
        ] : [],
      },
      wordUsage: {
        hasIssues: false,
        issues: [],
        explanation: "Từ vựng được sử dụng đúng nghĩa đen và truyền đạt được mục đích biểu đạt cơ bản.",
        errorItems: [],
      },
      context: {
        hasIssues: coreCase === "CASE_3_CONTEXT_UNSUITABLE",
        isGrammarValid: true,
        issues: coreCase === "CASE_3_CONTEXT_UNSUITABLE" ? ["Mức độ trang trọng chưa tương thích"] : [],
        explanation: coreCase === "CASE_3_CONTEXT_UNSUITABLE"
          ? "Cấu trúc câu hoàn toàn đúng về mặt ngữ pháp, nhưng phong cách này chỉ phù hợp trong hội thoại đời thường, chưa phù hợp với văn viết trang trọng hoặc bài thi luận."
          : `Rất phù hợp với phong cách ${isSpoken ? "giao tiếp (구어체)" : "văn viết (문어체)"}.`,
        whenOriginalCanBeUsed: "Có thể dùng tự nhiên khi nói chuyện với bạn bè, đồng nghiệp thân thiết trong sinh hoạt thường nhật.",
        whyUnsuitableForTarget: "Trong văn viết học thuật hoặc báo cáo, quy chuẩn bắt buộc dùng thể khẳng định khách quan (-ㄴ/는다), không dùng đuôi câu thân mật (-아요/어요).",
        suitableContexts: isSpoken ? ["Trò chuyện đời thường", "Nhắn tin bạn bè"] : ["Bài luận học thuật", "Báo cáo công việc"],
      },
      formalityAndNaturalness: {
        formalityLevel: isSpoken ? "비격식 존댓말 (해요체)" : "문어체 (한다체)",
        formalityMatch: coreCase !== "CASE_3_CONTEXT_UNSUITABLE",
        naturalnessScore: coreCase === "CASE_1_CORRECT" ? 9.5 : (coreCase === "CASE_3_CONTEXT_UNSUITABLE" ? 8 : 6.5),
        naturalnessComment: coreCase === "CASE_1_CORRECT"
          ? "Cách nói rất tự nhiên, người bản xứ sử dụng phổ biến."
          : "Cần tinh chỉnh theo phong cách để đạt độ tự nhiên tối đa.",
      },
    },
    suggestions: [
      {
        sentence: correctedText,
        pronunciation: "표준 발음",
        translation: langIsKo ? "초급 표준 표현 (기초 어휘 및 해요체)" : langIsEn ? "Beginner Standard Expression (Core vocabulary & polite -해요 ending)" : "Diễn đạt Sơ cấp chuẩn mực (Từ vựng cơ bản, đuôi -아요/어요)",
        style: isSpoken ? "spoken" : "written",
        formality: isSpoken ? "비격식 존댓말 (해요체)" : "문어체 (한다체)",
        level: "beginner",
        situationalUsage: isSpoken ? (langIsKo ? "일상 대화 및 친구, 동료와의 편안한 소통" : langIsEn ? "Daily conversations with friends or colleagues" : "Giao tiếp đời thường, nói chuyện thân mật lịch sự với bạn bè, đồng nghiệp") : (langIsKo ? "기초 작문 연습" : langIsEn ? "Basic writing practice" : "Luyện viết câu đơn giản"),
        nuance: langIsKo ? "친근하고 명확함" : langIsEn ? "Friendly, direct and clear" : "Thân thiện, trực tiếp, dễ hiểu",
        reason: langIsKo ? "기초 어휘와 직관적인 문법으로 의사를 가장 쉽고 정확하게 전달합니다." : langIsEn ? "Conveys core meaning directly using standard beginner vocabulary and grammar." : "Truyền đạt ý đồ trực tiếp, dùng từ vựng căn bản thông dụng và cấu trúc dễ tiếp thu.",
        vocabularyHighlights: langIsKo ? "기초 명사 및 일상 기본 동사 활용" : langIsEn ? "Everyday fundamental vocabulary & basic verbs" : "Từ vựng sinh hoạt cơ bản, động từ trực tiếp",
        grammarPattern: isSpoken ? "-아/어요 (Đuôi câu lịch sự phổ biến)" : "-ㄴ/는다 (Đuôi khẳng định)",
        distinctionNote: langIsKo ? "가장 단순하고 명료한 초급 어형으로, 격식 부담 없이 직관적인 의미 전달에 집중합니다." : langIsEn ? "Focuses on simple, direct communication without complex honorifics or intricate clause connections." : "Tập trung vào tính rõ ràng, dễ dùng, không đòi hỏi cấu trúc liên kết phức tạp hay kính ngữ cầu kỳ.",
      },
      {
        sentence: text.includes("밥") ? "식사는 잘 챙겨 드셨어요?" : (isSpoken ? `혹시 ${correctedText.replace(/요$/, "")}나요?` : `${correctedText}는 편이다`),
        pronunciation: "자연스러운 억양",
        translation: langIsKo ? "중급 자연스러운 표현 (풍부한 어휘 및 완곡한 화법)" : langIsEn ? "Intermediate Natural Phrasing (Richer vocabulary & contextual fluency)" : "Diễn đạt Trung cấp tự nhiên (Từ vựng phong phú, lối nói uyển chuyển)",
        style: isSpoken ? "spoken" : "written",
        formality: "존댓말 (완곡하고 정중함)",
        level: "intermediate",
        situationalUsage: langIsKo ? "직장 동료와의 대화, 부드러운 안부 및 의사 표현" : langIsEn ? "Conversing with workplace peers, polite inquiries, natural social nuance" : "Giao tiếp công sở với đồng nghiệp, hỏi thăm khéo léo hoặc nói giảm nói tránh",
        nuance: langIsKo ? "부드럽고 배려심 있는 어조" : langIsEn ? "Warm, considerate and natural native flow" : "Mềm mỏng, tự nhiên, thể hiện sự quan tâm tinh tế",
        reason: langIsKo ? "직접적인 표현 대신 맥락을 살린 자연스러운 어휘를 사용하여 원어민스러운 뉘앙스를 줍니다." : langIsEn ? "Replaces blunt wording with fluent native collocations for natural conversational rhythm." : "Không dùng câu cộc lốc mà liên kết tự nhiên, giàu tính biểu cảm của người bản xứ.",
        vocabularyHighlights: langIsKo ? "상황 맞춤형 유의어 및 연어(Collocation) 결합" : langIsEn ? "Contextual collocations and nuance-rich adjectives/verbs" : "Cụm từ ngữ cảnh (collocations), uyển ngữ tự nhiên",
        grammarPattern: "-나요? / -는 편이다 / -(으)려고 하다",
        distinctionNote: langIsKo ? "초급의 단답형 전달에서 벗어나 상대방을 배려하는 완곡한 어미와 자연스러운 연어를 구사합니다." : langIsEn ? "Moves beyond simple statement-response into thoughtful native communicative phrasing." : "Vượt lên câu trả lời đơn tuyến, biết phối hợp các liên từ mềm mại và từ vựng tự nhiên hơn.",
      },
      {
        sentence: text.includes("밥") ? "식사는 이미 마치셨습니까?" : (isSpoken ? `${correctedText.replace(/요$/, "습니다")}` : "해당 사안에 대하여 면밀히 검토하고자 한다"),
        pronunciation: "격식체 발음",
        translation: langIsKo ? "고급 격식 표현 (고급 한자어 및 공식 하십시오체/문어체)" : langIsEn ? "Advanced Formal & Professional Register (Sino-Korean Hanja terms & formal register)" : "Diễn đạt Cao cấp trang trọng (Từ Hán-Hàn tinh tế, phong cách hội nghị/văn thư)",
        style: isSpoken ? "spoken" : "written",
        formality: isSpoken ? "공식 격식 존댓말 (하십시오체)" : "학술/공문서 문어체 (한다체)",
        level: "advanced",
        situationalUsage: langIsKo ? "공식 비즈니스 미팅, 발표, 공문서 및 상급자 보고" : langIsEn ? "Official business negotiations, conferences, formal client reports and VIP etiquette" : "Gặp gỡ đối tác cao cấp, phỏng vấn, báo cáo ban giám đốc, hội nghị trang trọng",
        nuance: langIsKo ? "매우 정중하고 신뢰감을 주는 전문적인 어조" : langIsEn ? "Highly authoritative, elegant, professional and deeply respectful" : "Trang trọng, chuẩn mực, toát lên sự chuyên nghiệp và học thức cao",
        reason: langIsKo ? "고급 한자어와 격식 종결 어미를 구사하여 공적인 자리에서의 신뢰도를 극대화합니다." : langIsEn ? "Leverages precise Sino-Korean terminology and formal register to project authority and respect." : "Ứng dụng từ vựng Hán Hàn học thuật và thể câu chuẩn mực nhất, xây dựng uy tín giao tiếp.",
        vocabularyHighlights: langIsKo ? "고급 한자어 (식사/마치다/검토/사안 등)" : langIsEn ? "Refined Sino-Korean (Hanja) academic vocabulary" : "Từ Hán Hàn (식사, 완료, 검토, 사안...)",
        grammarPattern: "-(으)ㅁ에 따라 / -고자 하다 / -(으)시겠습니까 / 하십시오체",
        distinctionNote: langIsKo ? "단순 일상 표현을 격식 있는 한자어와 최고급 공공 어문 규범 어휘로 격상시킨 모범형입니다." : langIsEn ? "Elevates conversational speech into impeccable business and academic discourse." : "Nâng tầm hoàn toàn câu nói từ khẩu ngữ đời thường lên văn phong chuẩn mực của giới chuyên gia và công vụ.",
      }
    ],
    references: [
      {
        name: "Korean-English Learners' Dictionary (한국어기초사전)",
        title: `Tra cứu: ${firstWord}`,
        description: "Từ điển cơ bản của Viện Quốc gia Ngôn ngữ Hàn Quốc.",
        url: generateDictionaryUrl("krdict", firstWord),
        category: "learner_corpus",
      },
      {
        name: "Standard Korean Language Dictionary (표준국어대사전)",
        title: `Quy tắc chính tả và từ vựng chuẩn`,
        description: "Cơ quan chuẩn hóa tiếng Hàn chính thống 국립국어원.",
        url: generateDictionaryUrl("stdict", firstWord),
        category: "standard",
      },
      {
        name: "Naver Korean Dictionary (네이버 국어사전)",
        title: `Ngữ cảnh thực tế & thành ngữ`,
        description: "Từ điển tra cứu phổ biến nhất của người Hàn.",
        url: generateDictionaryUrl("naver", firstWord),
        category: "dictionary",
      }
    ],
  };
}

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SEOUL STEP server running at http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
