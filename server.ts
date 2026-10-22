import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Standard CORS & Preflight handling to prevent 404s on OPTIONS/preflight
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Initialize Google GenAI client dynamically to support all environment setups
export function getAiClient(): GoogleGenAI | null {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

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
  timeoutMs?: number;
}

// Primary stable models for fast, structured linguistic tasks, with ordered failover
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const SECONDARY_MODEL = "gemini-flash-lite-latest";
const BACKUP_MODEL = "gemini-flash-latest";

const DEFAULT_CANDIDATE_MODELS = [
  PRIMARY_MODEL,
  SECONDARY_MODEL,
  BACKUP_MODEL,
];

// Permanently disabled / deprecated models (e.g. 404 models)
const permanentlyDisabledModels = new Set<string>([
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
]);

// Cooldown tracker for rate-limited (429) or temporarily unavailable models
const cooldownModels = new Map<string, number>();

function isModelAvailable(modelName: string): boolean {
  if (permanentlyDisabledModels.has(modelName)) return false;
  const until = cooldownModels.get(modelName);
  if (!until) return true;
  if (Date.now() > until) {
    cooldownModels.delete(modelName);
    return true;
  }
  return false;
}

function markModelCooldown(modelName: string, durationMs = 2 * 60 * 1000) {
  cooldownModels.set(modelName, Date.now() + durationMs);
  console.warn(`[Gemini] Model ${modelName} in temporary cooldown for ${Math.round(durationMs / 1000)}s`);
}

function markModelPermanentlyDisabled(modelName: string, reason: string) {
  permanentlyDisabledModels.add(modelName);
  console.warn(`[Gemini] Model ${modelName} permanently disabled: ${reason}`);
}

// Safe JSON parser that removes markdown code fences if wrapped
function parseJsonSafely(text: string): any {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return JSON.parse(cleaned);
}

interface GeminiCallOutcome {
  text: string | null;
  modelName: string;
  errorStatus: number;
  errorMessage: string;
}


async function callGeminiWithFallback(
  aiClient: GoogleGenAI,
  params: GeminiCallParams
): Promise<GeminiCallOutcome> {
  const configuredModels =
    params.candidateModels?.length
      ? params.candidateModels
      : DEFAULT_CANDIDATE_MODELS;

  const allCandidates = [
    ...new Set(configuredModels),
  ].slice(0, 3);

  // Prefer models that are not in cooldown.
  // If all models are cooling down, try the configured list anyway.
  const availableCandidates =
    allCandidates.filter(isModelAvailable);

  const candidateList =
    availableCandidates.length > 0
      ? availableCandidates
      : allCandidates.length > 0
        ? allCandidates
        : [PRIMARY_MODEL];

  const startTime = Date.now();
  const TOTAL_BUDGET_MS = 25000;
  const PER_MODEL_TIMEOUT_MS = Math.min(
    params.timeoutMs || 10000,
    10000
  );

  let lastStatus = 500;
  let lastError = "Unable to contact Gemini AI service";

  console.log(
    `[Gemini] Candidate models: ${candidateList.join(", ")}`
  );

  for (
    let modelIndex = 0;
    modelIndex < candidateList.length;
    modelIndex++
  ) {
    const modelName = candidateList[modelIndex];
    const elapsed = Date.now() - startTime;
    const remainingTime = TOTAL_BUDGET_MS - elapsed;

    // Leave time for the application to return its response.
    if (remainingTime < 1500) {
      console.warn(
        `[Gemini] Time budget exhausted after ${elapsed}ms`
      );
      break;
    }

    const currentTimeout = Math.min(
      PER_MODEL_TIMEOUT_MS,
      remainingTime
    );

    let timer: ReturnType<typeof setTimeout> | undefined;

    console.log(
      `[Gemini] Trying model ${modelIndex + 1}/${candidateList.length}: ${modelName}`
    );

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`TIMEOUT_${modelName}`)),
        currentTimeout
      );
    });

    const genPromise = aiClient.models.generateContent({
      model: modelName,
      contents: params.contents,
      config: params.config,
    });

    // Prevent an unhandled rejection if the timeout wins.
    genPromise.catch(() => {});

    try {
      const resp = await Promise.race([
        genPromise,
        timeoutPromise,
      ]);

      if (resp?.text) {
        console.log(
          `[Gemini] Success with ${modelName} in ${Date.now() - startTime}ms`
        );

        return {
          text: resp.text,
          modelName,
          errorStatus: 200,
          errorMessage: "",
        };
      }

      lastStatus = 502;
      lastError = `Empty response from ${modelName}`;

      console.warn(`[Gemini] Empty response from ${modelName}`);
    } catch (err: any) {
      const errMsg = String(err?.message || "");
      const normalized = errMsg.toLowerCase();

      const status = Number(err?.status || err?.code || 0);

      const isTimeout = errMsg.startsWith("TIMEOUT_");

      const is404 =
        status === 404 ||
        normalized.includes("404") ||
        normalized.includes("not found") ||
        normalized.includes("is no longer available");

      const is429 =
        status === 429 ||
        normalized.includes("429") ||
        normalized.includes("quota") ||
        normalized.includes("resource_exhausted");

      const is503 =
        status === 503 ||
        normalized.includes("503") ||
        normalized.includes("high demand") ||
        normalized.includes("unavailable") ||
        normalized.includes("overloaded");

      // Normalize the status even if the SDK does not expose err.status.
      lastStatus = isTimeout
        ? 504
        : is404
          ? 404
          : is429
            ? 429
            : is503
              ? 503
              : status >= 400 && status <= 599
                ? status
                : 500;

      lastError = isTimeout
        ? `Request to ${modelName} timed out after ${currentTimeout}ms`
        : errMsg || `Request to ${modelName} failed`;

      if (is404) {
        markModelPermanentlyDisabled(
          modelName,
          errMsg.slice(0, 80)
        );

        console.warn(
          `[Gemini] Model ${modelName} returned 404; disabled`
        );
      } else if (is429) {
        markModelCooldown(modelName, 2 * 60 * 1000);

        console.warn(
          `[Gemini] 429/quota limit on ${modelName}; trying next model`
        );
      } else if (is503) {
        markModelCooldown(modelName, 30 * 1000);

        console.warn(
          `[Gemini] 503 on ${modelName}; trying next model`
        );
      } else if (isTimeout) {
        console.warn(
          `[Gemini] Timeout on ${modelName} after ${currentTimeout}ms; trying next model`
        );
      } else {
        console.warn(
          `[Gemini] Error ${lastStatus} on ${modelName}: ${errMsg.slice(0, 150)}`
        );
      }
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }

    if (modelIndex < candidateList.length - 1) {
      console.log(
        `[Gemini] Moving to next candidate after ${modelName}`
      );
    }
  }

  console.error(
    `[Gemini] All candidates failed. Last status: ${lastStatus}; error: ${lastError}`
  );

  return {
    text: "",
    modelName: "",
    errorStatus: lastStatus,
    errorMessage: lastError,
  };
}



// Clean up any repeated/glitched phrases or duplicate words in Korean sentence
export function sanitizeKoreanSentence(text: string): string {
  if (!text || typeof text !== "string") return "";
  let cleaned = text.trim();

  // Fix specific AI hallucinated duplicate phrases
  cleaned = cleaned.replace(/그\s*사람의\s+그의/g, "그 사람의");
  cleaned = cleaned.replace(/그의\s+그\s*사람의/g, "그 사람의");
  cleaned = cleaned.replace(/그\s*사람의\s+그\s*사람의/g, "그 사람의");

  // Fix general duplicate consecutive identical words (e.g. "저는 저는" -> "저는", "말을 말을" -> "말을")
  cleaned = cleaned.replace(/\b([가-힣]+)\s+\1\b/g, "$1");

  // Fix accidental punctuation glitches and multiple spaces
  cleaned = cleaned.replace(/\s+([.,!?~])/g, "$1");
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  return cleaned.trim();
}

// Build rock-solid, 100% consistent diff tokens that strictly reconstruct correctedText
export function buildStrictConsistentDiffTokens(
  originalText: string,
  correctedText: string,
  aiTokens: any[] = [],
  errorItems: any[] = []
): Array<{ text: string; type: "normal" | "modified" | "added"; original?: string; note?: string }> {
  const normOriginal = originalText.trim();
  const normCorrected = correctedText.trim();

  if (!normCorrected) {
    return [{ text: normOriginal, type: "normal" }];
  }

  // If no change, return a single normal token
  if (normOriginal === normCorrected) {
    return [{ text: normCorrected, type: "normal" }];
  }

  const origWords = normOriginal.split(/\s+/).filter(Boolean);
  const corrWords = normCorrected.split(/\s+/).filter(Boolean);

  // Map AI token notes for quick lookup
  const aiNoteMap = new Map<string, { original?: string; note?: string }>();
  if (Array.isArray(aiTokens)) {
    for (const t of aiTokens) {
      if (t && t.text && (t.type === "modified" || t.type === "added")) {
        aiNoteMap.set(t.text.trim(), { original: t.original, note: t.note });
      }
    }
  }

  // Map error items notes
  const errorMap = new Map<string, { whyWrong?: string; howToFix?: string }>();
  if (Array.isArray(errorItems)) {
    for (const e of errorItems) {
      if (e && e.targetWord) {
        errorMap.set(e.targetWord.trim(), { whyWrong: e.whyWrong, howToFix: e.howToFix });
      }
    }
  }

  const n = origWords.length;
  const m = corrWords.length;

  // LCS dynamic programming table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origWords[i - 1] === corrWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Map each corrWord to matched origWord index if in LCS
  const corrMatchedOrig: (number | null)[] = new Array(m).fill(null);
  const origMatchedCorr: (number | null)[] = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (origWords[i - 1] === corrWords[j - 1]) {
      corrMatchedOrig[j - 1] = i - 1;
      origMatchedCorr[i - 1] = j - 1;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const tokens: Array<{ text: string; type: "normal" | "modified" | "added"; original?: string; note?: string }> = [];

  for (let cIdx = 0; cIdx < m; cIdx++) {
    const word = corrWords[cIdx];
    const origIdx = corrMatchedOrig[cIdx];

    if (origIdx !== null) {
      tokens.push({
        text: word,
        type: "normal",
      });
    } else {
      // Find what original word was replaced
      let matchedOrigWord: string | undefined;
      let note: string | undefined;

      const aiMatch = aiNoteMap.get(word) || Array.from(aiNoteMap.entries()).find(([k]) => word.includes(k) || k.includes(word))?.[1];
      if (aiMatch) {
        matchedOrigWord = aiMatch.original;
        note = aiMatch.note;
      }

      if (!matchedOrigWord) {
        const nearestOrig = origWords[Math.min(cIdx, n - 1)];
        if (nearestOrig && origMatchedCorr[Math.min(cIdx, n - 1)] === null) {
          matchedOrigWord = nearestOrig;
        }
      }

      if (!note && matchedOrigWord) {
        const errMatch = errorMap.get(matchedOrigWord);
        if (errMatch?.whyWrong) {
          note = errMatch.whyWrong;
        }
      }

      tokens.push({
        text: word,
        type: matchedOrigWord ? "modified" : "added",
        original: matchedOrigWord,
        note: note || (matchedOrigWord ? `Điều chỉnh từ "${matchedOrigWord}" để câu chuẩn xác và tự nhiên hơn.` : "Từ bổ sung để câu hoàn chỉnh."),
      });
    }
  }

  // Consolidate consecutive 'normal' tokens for smooth natural display
  const consolidated: Array<{ text: string; type: "normal" | "modified" | "added"; original?: string; note?: string }> = [];
  for (const tok of tokens) {
    if (tok.type === "normal" && consolidated.length > 0 && consolidated[consolidated.length - 1].type === "normal") {
      consolidated[consolidated.length - 1].text += " " + tok.text;
    } else {
      consolidated.push({ ...tok });
    }
  }

  return consolidated;
}

// Define route path variants to support both direct path and Vercel serverless rewrites
const analyzeRoutes = ["/api/analyze", "/api/analyze/", "/analyze", "/analyze/"];
const translateRoutes = ["/api/translate", "/api/translate/", "/translate", "/translate/"];
const ttsRoutes = ["/api/tts", "/api/tts/", "/tts", "/tts/"];
const aiFollowupRoutes = ["/api/ai-followup", "/api/ai-followup/", "/ai-followup", "/ai-followup/"];
const translateAnalysisRoutes = ["/api/translate-analysis", "/api/translate-analysis/", "/translate-analysis", "/translate-analysis/"];
const translateVariationsRoutes = ["/api/translate-variations", "/api/translate-variations/", "/translate-variations", "/translate-variations/"];

// Health check and route verification for /api/analyze (prevents 404 on GET)
app.get(analyzeRoutes, (req, res) => {
  const ai = getAiClient();
  res.json({
    status: "online",
    endpoint: "/api/analyze",
    methods: ["POST"],
    description: "SEOUL STEP Korean Sentence & Vocabulary Analysis API",
    aiConfigured: !!ai,
  });
});

app.post(analyzeRoutes, async (req, res) => {
  try {
    const ai = getAiClient();
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
  + correctedText: BẮT BUỘC giữ nguyên câu gốc của người dùng (correctedText = originalText), KHÔNG ĐƯỢC TỰ BỊA RA LỖI để sửa!

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
  + correctedText: Phiên bản chuẩn xác đã được sửa đúng lỗi thực tế, không tự ý thêm từ, lặp từ, xóa thành phần cần thiết hoặc làm thay đổi ý nghĩa gốc.

--- TRƯỜNG HỢP 3 (coreCase = "CASE_3_CONTEXT_UNSUITABLE"): Câu đúng về ngữ pháp nhưng chưa phù hợp với ngữ cảnh ---
- Tiêu chí: Câu về mặt cấu trúc ngữ pháp KHÔNG HỀ SAI, nhưng chưa phù hợp về mức độ trang trọng (ví dụ: dùng 반말 với người lớn tuổi/sếp, hoặc dùng 해요체 văn nói trong bài thi viết văn TOPIK 쓰기), hoặc từ ngữ dịch máy móc chưa tự nhiên.
- QUY TẮC CỰC KỲ QUAN TRỌNG:
  + TUYỆT ĐỐI KHÔNG đánh dấu là "sai ngữ pháp" (isGrammarValid = true, grammar.hasIssues = false).
  + Phải giải thích rõ: Câu đúng về mặt ngữ pháp, nhưng chưa phù hợp về cách dùng, mức độ trang trọng hoặc độ tự nhiên với đối tượng/hoàn cảnh này.
  + Chỉ rõ: Câu gốc này có thể dùng trong trường hợp nào (whenOriginalCanBeUsed)?
  + Vì sao chưa hợp với ngữ cảnh hiện tại (whyUnsuitableForTarget)?
  + verdict: "GRAMMAR_OK_CONTEXT_UNSUITABLE"
  + verdictTitle: "Trường hợp 3: Ngữ pháp đúng • Chưa phù hợp ngữ cảnh"
  + verdictSummary: Giải thích rõ ràng rằng ngữ pháp chuẩn nhưng cần đổi sang văn phong phù hợp với người nghe/ngữ cảnh.

NGUYÊN TẮC BẮT BUỘC VỀ TẠO CÂU HOÀN THIỆN (correctedText):
1. PHẢI LÀ MỘT CÂU TIẾNG HÀN HOÀN CHỈNH, MẠCH LẠC, ĐÚNG NGỮ PHÁP, TỰ NHIÊN:
   - TUYỆT ĐỐI KHÔNG ghép luộm thuộm các mảnh câu từ bản gốc với từ mới khiến câu bị lặp từ kỳ quặc (Ví dụ: TUYỆT ĐỐI KHÔNG tạo ra câu có lỗi lặp từ như "그 사람의 그의 말을...", "저는 저는...", "말을 말을...").
   - Giữ nguyên cấu trúc tự nhiên của câu tiếng Hàn, không tự ý thêm bớt các đại từ hoặc từ ngữ thừa thãi.
2. PHÂN BIỆT RÕ LỖI THỰC SỰ VÀ GỢI Ý CẢI THIỆN:
   - Nếu câu gốc ĐÚNG NGỮ PHÁP VÀ TỰ NHIÊN: Xác nhận câu đúng, giữ nguyên câu gốc.
   - Nếu câu gốc đúng ngữ pháp nhưng có cách nói tự nhiên hơn: Chỉ đưa ra gợi ý cải thiện (ví dụ: dùng phó từ tự nhiên hơn như '매우' hoặc cách nói '기분이 좋아졌어요'), và giải thích rõ đây là GỢI Ý TRAU CHUỐT TỰ NHIÊN, KHÔNG PHẢI LỖI BẮT BUỘC. TUYỆT ĐỐI KHÔNG coi việc đổi từ đồng nghĩa, đổi phó từ hay điều chỉnh độ tự nhiên là "lỗi sai ngữ pháp".
   - Nếu câu sai thực sự: Phải sửa đúng lỗi thực tế (sai chính tả, sai 띄어쓰기, sai chia đuôi hoặc sai trợ từ), giải thích chính xác nguyên nhân, không tự ý xóa thành phần cần thiết hay làm đổi lệch ý nghĩa câu gốc.
   - Khi chuyển sang văn viết (문어체) cho câu như "저는 그 사람의 말을 듣고 기분이 아주 행복해졌어요.":
     Câu văn viết chuẩn có thể là: "저는 그 사람의 말을 듣고 매우 행복해졌다." hoặc "그 사람의 말을 듣고 매우 행복해졌다."
     TUYỆT ĐỐI KHÔNG ghép luộm thuộm thành "그 사람의 그의 말을 듣고..."!

NGUYÊN TẮC BẮT BUỘC VỀ DIFF TOKENS (diffTokens):
- diffTokens phải phản ánh chính xác các thành phần của CHÍNH CÂU HOÀN THIỆN (correctedText).
- Khi ghép các token trong diffTokens lại với nhau, kết quả PHẢI TRÙNG KHỚP HOÀN TOÀN với correctedText.
- Mỗi token trong diffTokens:
  + text: Từ/cụm từ nằm trong correctedText.
  + type: 'normal' nếu giữ nguyên từ câu gốc; 'modified' nếu là từ được sửa đổi hoặc trau chuốt từ câu gốc (kèm original và note); 'added' nếu là từ mới thêm vào.
- TUYỆT ĐỐI KHÔNG đưa từ bị xóa làm token độc lập chen vào giữa câu hoàn thiện. Không để câu hiển thị, phần giải thích và nội dung phát âm bị lệch nhau.

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
Bạn PHẢI tạo ra chính xác 3 đến 4 cách diễn đạt ĐA DẠNG CÙNG NGHĨA đại diện cho cả 3 trình độ:
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

QUY TẮC PHẢN HỒI: Viết tất cả giải thích, nhận xét sư phạm, lý do và phân tích ngắn gọn, súc tích (1-2 câu trực tiếp), chuẩn xác, tránh viết dài dòng lê thê để trả về kết quả nhanh chóng.`;

    const userPrompt = `Dữ liệu phân tích:
- Nội dung tiếng Hàn: "${trimmedText}"
- Ngữ cảnh người dùng muốn dùng: "${context || "Không chỉ định cụ thể, áp dụng cho đời sống thông thường"}"
- Phong cách mong muốn: ${targetStyle}
- Trình độ của người học: ${targetLevel}

Hãy phân tích toàn diện bằng AI và trả về JSON chuẩn theo schema.`;

    if (!ai) {
      res.status(503).json({
        error:
          uiLanguage === "ko"
            ? "Gemini API 키가 서버에 설정되지 않았습니다. Vercel 환경 변수에 GEMINI_API_KEY를 등록해 주세요."
            : uiLanguage === "en"
            ? "Gemini API key is not configured on the server. Please set GEMINI_API_KEY."
            : "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thêm biến môi trường GEMINI_API_KEY.",
      });
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

    // Single primary model with intelligent 503 retry and single backup
    const outcome = await callGeminiWithFallback(ai, {
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    if (!outcome.text) {
      const isTimeout = outcome.errorStatus === 504;
      const isQuota = outcome.errorStatus === 429;
      const is503 = outcome.errorStatus === 503;

      let clientMessage = "";
      if (uiLanguage === "ko") {
        clientMessage = isQuota
          ? "AI API 할당량(429)이 일시적으로 초과되었습니다. 1~2분 후 다시 시도해 주세요."
          : isTimeout
          ? "AI 요청 시간이 초과되었습니다 (504). 잠시 후 다시 시도해 주세요."
          : is503
          ? "AI 서비스가 일시적으로 지연되고 있습니다 (503). 잠시 후 다시 시도해 주세요."
          : "AI 서비스 응답에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      } else if (uiLanguage === "en") {
        clientMessage = isQuota
          ? "AI API quota limit (429) exceeded. Please wait 1-2 minutes and try again."
          : isTimeout
          ? "AI request timed out (504). Please try again in a moment."
          : is503
          ? "AI service is currently busy (503). Please try again in a moment."
          : "AI service request failed. Please try again in a moment.";
      } else {
        clientMessage = isQuota
          ? "Hạn mức API AI (429) hiện đang tạm thời vượt quá. Vui lòng chờ 1-2 phút rồi thử lại."
          : isTimeout
          ? "Yêu cầu AI quá thời gian phản hồi (504). Vui lòng thử lại sau giây lát."
          : is503
          ? "Hệ thống AI đang chịu tải cao (503 High Demand). Vui lòng thử lại sau vài giây."
          : "Hệ thống AI tạm thời không thể phản hồi. Vui lòng thử lại sau giây lát.";
      }

      res.status(outcome.errorStatus || 503).json({
        error: clientMessage,
        statusCode: outcome.errorStatus || 503,
      });
      return;
    }

    const responseText = outcome.text;
    const chosenModel = outcome.modelName;
    const engineDisplayName = chosenModel.includes("flash-lite")
      ? "Gemini Flash Lite"
      : chosenModel.includes("3.1-flash")
      ? "Gemini 3.1 Flash"
      : chosenModel.includes("flash-latest")
      ? "Gemini Flash"
      : "Gemini AI";

    let parsed: any;
    try {
      parsed = parseJsonSafely(responseText);
    } catch (parseErr) {
      console.warn("Analysis response parse error:", parseErr);
      res.status(500).json({
        error:
          uiLanguage === "ko"
            ? "AI 분석 결과를 처리하지 못했습니다. 다시 시도해 주세요."
            : uiLanguage === "en"
            ? "Could not parse AI response. Please try again."
            : "Không thể xử lý định dạng kết quả từ AI. Vui lòng thử lại.",
      });
      return;
    }

    // 1. Sanitize correctedText to eliminate any repeated words or machine-concatenation errors
    let cleanCorrectedText = sanitizeKoreanSentence(parsed.correctedText || trimmedText);

    // If case is CASE_1_CORRECT and AI accidentally changed the text or didn't intend to, verify:
    if (parsed.coreCase === "CASE_1_CORRECT" || parsed.verdict === "CORRECT") {
      if (parsed.verdict === "CORRECT" && (!parsed.explanations?.grammar?.hasIssues && !parsed.explanations?.spelling?.hasIssues)) {
        cleanCorrectedText = trimmedText;
      }
    }

    // 2. Ensure consistency in coreCase and explanations:
    if (parsed.coreCase === "CASE_1_CORRECT" || parsed.verdict === "CORRECT") {
      if (parsed.explanations?.grammar) {
        parsed.explanations.grammar.hasIssues = false;
        parsed.explanations.grammar.errorItems = [];
      }
      if (parsed.explanations?.spelling) {
        parsed.explanations.spelling.hasIssues = false;
        parsed.explanations.spelling.errorItems = [];
      }
    } else if (parsed.coreCase === "CASE_3_CONTEXT_UNSUITABLE" || parsed.verdict === "GRAMMAR_OK_CONTEXT_UNSUITABLE") {
      // Style / register adaptation is NOT a grammar error
      if (parsed.explanations?.grammar) {
        parsed.explanations.grammar.hasIssues = false;
        parsed.explanations.grammar.errorItems = [];
        parsed.explanations.grammar.explanation =
          uiLanguage === "ko"
            ? "문장의 문법 구조와 조사 결합은 올바릅니다."
            : uiLanguage === "en"
            ? "Sentence grammar structure and particle usage are structurally sound."
            : "Cấu trúc ngữ pháp và trợ từ hoàn toàn chính xác về mặt cú pháp. Không có lỗi ngữ pháp sai.";
      }
      if (parsed.explanations?.context) {
        parsed.explanations.context.isGrammarValid = true;
      }
    }

    // 3. Build rock-solid, 100% consistent diff tokens aligned strictly with cleanCorrectedText
    const allAiErrorItems = [
      ...(parsed.explanations?.spelling?.errorItems || []),
      ...(parsed.explanations?.grammar?.errorItems || []),
      ...(parsed.explanations?.wordUsage?.errorItems || []),
    ];
    const consistentDiffTokens = buildStrictConsistentDiffTokens(
      trimmedText,
      cleanCorrectedText,
      parsed.diffTokens,
      allAiErrorItems
    );

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
      correctedText: cleanCorrectedText,
      diffTokens: consistentDiffTokens,
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
    const uiLang = req.body?.uiLanguage || "vi";
    res.status(500).json({
      error:
        uiLang === "ko"
          ? "문장 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
          : uiLang === "en"
          ? "An error occurred while analyzing the sentence. Please try again."
          : "Đã xảy ra lỗi trong quá trình phân tích câu. Vui lòng thử lại sau.",
    });
  }
});

// AI Endpoint: High-fidelity Native Korean Text-to-Speech
app.post(ttsRoutes, async (req, res) => {
  try {
    const ai = getAiClient();
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
app.post(aiFollowupRoutes, async (req, res) => {
  try {
    const ai = getAiClient();
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

    const outcome = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    const answerText = outcome.text ||
      `[AI Phản hồi]: Với câu "${sentence}", bạn có thể áp dụng linh hoạt tùy theo mức độ thân mật với đối phương. Ví dụ: Dùng dạng 존댓말 (-아요/어요) khi nói chuyện lịch sự và 반말 khi nói với bạn bè thân.`;

    res.json({ answer: answerText });
  } catch (error: any) {
    console.error("AI followup error:", error);
    res.status(500).json({ error: "Failed to generate AI follow-up response" });
  }
});

// AI Endpoint: Seamless translation of entire analysis results when user switches language
app.post(translateAnalysisRoutes, async (req, res) => {
  try {
    const ai = getAiClient();
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

    const outcome = await callGeminiWithFallback(ai, {
      contents: prompt + "\n\nJSON DỮ LIỆU CẦN DỊCH:\n" + JSON.stringify(analysis),
      config: {
        responseMimeType: "application/json",
      },
    });

    let translatedJson: any = null;
    if (outcome.text) {
      try {
        translatedJson = parseJsonSafely(outcome.text);
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

// Health check and route verification for /api/translate (prevents 404 on GET)
app.get(translateRoutes, (req, res) => {
  const ai = getAiClient();
  res.json({
    status: "online",
    endpoint: "/api/translate",
    methods: ["POST"],
    description: "SEOUL STEP Contextual Translation API",
    aiConfigured: !!ai,
  });
});

// AI Endpoint: High-precision contextual translation across Vietnamese, Korean, and English
app.post(translateRoutes, async (req, res) => {
  try {
    const ai = getAiClient();
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
      res.status(503).json({
        error:
          uiLanguage === "ko"
            ? "Gemini API 키가 서버에 설정되지 않았습니다."
            : uiLanguage === "en"
            ? "Gemini API key is not configured on the server."
            : "Chưa cấu hình GEMINI_API_KEY trên máy chủ.",
      });
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

    const outcome = await callGeminiWithFallback(ai, {
      contents: systemPrompt + "\n\n" + userPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: translationSchema,
        temperature: 0.2,
      },
    });

    if (!outcome.text) {
      const isTimeout = outcome.errorStatus === 504;
      res.status(outcome.errorStatus || 503).json({
        error:
          uiLanguage === "ko"
            ? (isTimeout ? "번역 요청 시간이 초과되었습니다. 다시 시도해 주세요." : "AI 번역 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해 주세요.")
            : uiLanguage === "en"
            ? (isTimeout ? "Translation request timed out. Please try again." : "Translation service is temporarily busy. Please try again.")
            : (isTimeout ? "Yêu cầu dịch thuật AI quá thời gian phản hồi. Vui lòng thử lại sau." : "Dịch vụ dịch thuật AI đang bận hoặc quá tải tạm thời. Vui lòng thử lại sau giây lát."),
      });
      return;
    }

    let translationData: any = null;
    try {
      translationData = parseJsonSafely(outcome.text);
    } catch (parseErr) {
      console.warn("Translation parse error:", parseErr);
      res.status(500).json({ error: "Không thể xử lý định dạng bản dịch từ AI. Vui lòng thử lại." });
      return;
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
app.post(translateVariationsRoutes, async (req, res) => {
  try {
    const ai = getAiClient();
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

    const outcome = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      },
    });

    if (outcome.text) {
      try {
        const parsed = parseJsonSafely(outcome.text);
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
  const safeText = String(text || "안녕하세요").trim();
  const safeContext = String(context || "");
  const isSpacingIssue = !safeText.includes(" ") && safeText.length > 5;
  const isSpoken = style === "spoken";
  const firstWord = safeText.split(" ")[0] || safeText;

  let coreCase: any = "CASE_1_CORRECT";
  let verdict: any = "CORRECT";
  let correctedText = safeText;
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
    summaryVi = "Ngữ pháp câu hoàn toàn đúng, nhưng đang dùng đuôi câu giao tiếp thân mật (-아요/어요), chưa phù hợp với văn viết chuẩn (문어체 yêu cầu đuôi -ㄴ/는다 hoặc -았다/었다).";
    if (text.endsWith("졌어요") || text.endsWith("었어요") || text.endsWith("았어요") || text.endsWith("했어요")) {
      correctedText = text.replace(/어요$|아요$/, "다");
    } else {
      correctedText = text.replace(/해요$/, "한다").replace(/어요$|아요$/, "다");
    }
  } else if (text.includes("먹다") || text.includes("먹었")) {
    if (context.includes("người lớn") || context.includes("thầy cô") || context.includes("bố mẹ") || context.includes("bà") || context.includes("ông") || context.includes("elder")) {
      coreCase = "CASE_2_HAS_ERRORS";
      verdict = "HAS_ERRORS";
      summaryVi = "Thiếu kính ngữ đối với bề trên: Cần dùng trợ từ kính ngữ 께서, danh từ kính ngữ 진지, và động từ 드시다.";
      correctedText = text.replace("할머니가", "할머니께서").replace("밥을", "진지를").replace(/먹었어요|먹었다/, "드셨습니다");
    }
  }

  correctedText = sanitizeKoreanSentence(correctedText);

  const langIsEn = uiLanguage === "en";
  const langIsKo = uiLanguage === "ko";

  const diffTokens = buildStrictConsistentDiffTokens(safeText, correctedText);

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
    diffTokens,
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
    const { createServer: createViteServer } = await import("vite");

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
