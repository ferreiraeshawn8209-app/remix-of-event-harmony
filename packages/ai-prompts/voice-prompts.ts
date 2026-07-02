// Voice Service API - STT/TTS integration
// Handles speech-to-text and text-to-speech operations

export const VOICE_PROMPTS = {
  voiceWelcome: `You are a voice-first event planning assistant. Keep responses concise (1-2 sentences), friendly, and action-oriented. Pause naturally between thoughts.`,

  confirmationBefore: `Before I proceed, let me confirm: `,

  followUpQuestion: `Great! Now, `,

  recommendation: `Based on what you've told me, I'd suggest: `,

  error: `Sorry, I didn't quite catch that. Could you please repeat?`,

  interruptAcknowledge: `Got it, no problem. `,
};

export function estimateSpeechDuration(text: string): number {
  // Average speech rate: 150 words per minute = 2.5 words per second
  const wordCount = text.trim().split(/\s+/).length;
  const secondsPerWord = 0.4;
  return Math.ceil(wordCount * secondsPerWord);
}

export function formatTranscriptForDisplay(text: string): string {
  return text.trim().charAt(0).toUpperCase() + text.trim().slice(1);
}

export function extractNumberFromSpeech(text: string): number | null {
  const match = text.match(/\b(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
}

export function extractDateFromSpeech(text: string): string | null {
  const patterns = [
    /(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)/i,
    /(?:on\s+)?(\w+)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export const VOICE_COMMAND_PATTERNS = {
  repeat: /(?:say that again|repeat|what did you say)/i,
  goBack: /(?:go back|previous|undo)/i,
  help: /(?:help|what can you do)/i,
  pause: /(?:pause|hold on|wait)/i,
  resume: /(?:resume|continue|go on)/i,
};

export function detectVoiceCommand(
  text: string
): keyof typeof VOICE_COMMAND_PATTERNS | null {
  for (const [command, pattern] of Object.entries(VOICE_COMMAND_PATTERNS)) {
    if (pattern.test(text)) {
      return command as keyof typeof VOICE_COMMAND_PATTERNS;
    }
  }
  return null;
}
