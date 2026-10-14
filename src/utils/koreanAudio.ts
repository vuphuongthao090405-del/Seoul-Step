// Utility for authentic native Korean pronunciation across the app
// Combines Gemini 3.8 Native TTS with enhanced Web Speech API fallback

// Audio cache to avoid repeated network calls
const audioCache = new Map<string, string>();
let currentAudioElement: HTMLAudioElement | null = null;

// Preload Korean voices for browser speech synthesis
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      // ignore
    }
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Finds the highest-fidelity Korean voice available on the user's device
 */
function getBestKoreanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();

  // 1. Check for premium/natural/neural Korean voices
  const premiumKeywords = ['natural', 'neural', 'google 한국', 'yuna', 'sora', 'heami', 'sunhi', 'injoon'];
  for (const kw of premiumKeywords) {
    const found = voices.find(
      (v) =>
        (v.lang.toLowerCase().startsWith('ko') || v.lang.toLowerCase().includes('kr')) &&
        v.name.toLowerCase().includes(kw)
    );
    if (found) return found;
  }

  // 2. Check for any standard Korean voice
  const standardKorean = voices.find(
    (v) => v.lang.toLowerCase() === 'ko-kr' || v.lang.toLowerCase().startsWith('ko')
  );
  if (standardKorean) return standardKorean;

  return null;
}

/**
 * Enhanced Web Speech API fallback with natural pitch, pacing, and prosody
 */
function speakViaWebSpeech(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return () => {};
  }

  try {
    window.speechSynthesis.cancel();

    // Prepare prosodically balanced text
    const cleanText = text.replace(/[\n\r]+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.lang = 'ko-KR';

    // Best natural voice
    const bestVoice = getBestKoreanVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Natural Seoul conversational pacing:
    // Rate 0.92 is slightly relaxed for clear pedagogical articulation
    // Pitch 1.02 offers a bright, warm polite intonation typical of Seoul Korean
    utterance.rate = 0.92;
    utterance.pitch = 1.02;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      onEnd?.();
    };
  } catch (e) {
    console.warn('Web speech synthesis failed:', e);
    onEnd?.();
    return () => {};
  }
}

/**
 * Plays authentic native Korean pronunciation.
 * Priority 1: High-fidelity Studio Native Voice via /api/tts (Gemini 3.8 TTS).
 * Priority 2: Enhanced browser Web Speech Synthesis with natural intonation.
 */
export function playKoreanPronunciation(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    onEnd?.();
    return () => {};
  }

  // Stop any currently playing audio
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  let isCancelled = false;

  const cancelPlayback = () => {
    isCancelled = true;
    if (currentAudioElement) {
      try {
        currentAudioElement.pause();
        currentAudioElement.currentTime = 0;
      } catch {
        // ignore
      }
      currentAudioElement = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    onEnd?.();
  };

  // Check cache first
  const cachedAudio = audioCache.get(cleanText);
  if (cachedAudio) {
    try {
      const audio = new Audio(`data:audio/wav;base64,${cachedAudio}`);
      currentAudioElement = audio;
      onStart?.();

      audio.onended = () => {
        currentAudioElement = null;
        onEnd?.();
      };
      audio.onerror = () => {
        currentAudioElement = null;
        speakViaWebSpeech(cleanText, onStart, onEnd);
      };

      audio.play().catch(() => {
        speakViaWebSpeech(cleanText, onStart, onEnd);
      });

      return cancelPlayback;
    } catch {
      return speakViaWebSpeech(cleanText, onStart, onEnd);
    }
  }

  // Set timeout to fallback if API takes longer than 2.8 seconds
  let hasFallbackTriggered = false;
  const timeoutId = setTimeout(() => {
    if (!isCancelled && !hasFallbackTriggered) {
      hasFallbackTriggered = true;
      speakViaWebSpeech(cleanText, onStart, onEnd);
    }
  }, 2800);

  // Attempt server-side high-fidelity TTS
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleanText }),
  })
    .then(async (res) => {
      clearTimeout(timeoutId);
      if (!res.ok || isCancelled || hasFallbackTriggered) {
        throw new Error('TTS server error or fallback already active');
      }
      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error('No audio in response');
      }

      // Cache for future instant replay
      audioCache.set(cleanText, data.audioBase64);

      if (isCancelled) return;

      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      currentAudioElement = audio;
      onStart?.();

      audio.onended = () => {
        currentAudioElement = null;
        onEnd?.();
      };
      audio.onerror = () => {
        currentAudioElement = null;
        speakViaWebSpeech(cleanText, onStart, onEnd);
      };

      audio.play().catch(() => {
        speakViaWebSpeech(cleanText, onStart, onEnd);
      });
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      if (!isCancelled && !hasFallbackTriggered) {
        speakViaWebSpeech(cleanText, onStart, onEnd);
      }
    });

  return cancelPlayback;
}
