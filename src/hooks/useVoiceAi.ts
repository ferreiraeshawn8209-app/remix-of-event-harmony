// React hook for voice-powered AI interaction - Phase 2
// Integrates STT/TTS with conversation flow

import { useCallback, useRef, useEffect, useState } from 'react';
import type { VoiceMode, VoiceSessionStatus } from '../../packages/shared-types/voice';

export interface UseVoiceAiState {
  isInitialized: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
  mode: VoiceMode;
  sessionStatus: VoiceSessionStatus;
}

export interface UseVoiceAiOptions {
  sttApiUrl?: string;
  ttsApiUrl?: string;
  apiKey?: string;
  mode?: VoiceMode;
  autoStartListening?: boolean;
  onTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
  voiceEnabled?: boolean;
  voiceName?: string;
  speakingRate?: number;
  onSpeechProgress?: (progress: { energy: number; viseme: string }) => void;
}

const visemeMap: Array<{ regex: RegExp; viseme: string }> = [
  { regex: /[ae]/i, viseme: "a" },
  { regex: /[i]/i, viseme: "i" },
  { regex: /[ou]/i, viseme: "o" },
  { regex: /[mbp]/i, viseme: "m" },
  { regex: /[fv]/i, viseme: "f" },
  { regex: /[st]/i, viseme: "s" },
  { regex: /th/i, viseme: "th" },
];

function inferViseme(input: string): string {
  for (const entry of visemeMap) {
    if (entry.regex.test(input)) return entry.viseme;
  }
  return "rest";
}

export function useVoiceAi(conversationId: string, options: UseVoiceAiOptions = {}) {
  const [state, setState] = useState<UseVoiceAiState>({
    isInitialized: false,
    isListening: false,
    isSpeaking: false,
    transcript: '',
    error: null,
    mode: options.mode ?? 'push-to-talk',
    sessionStatus: 'idle',
  });

  const voiceServiceRef = useRef<any>(null);
  const unsubscribeRef = useRef<Array<() => void>>([]);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * Initialize voice service
   */
  const initialize = useCallback(async () => {
    try {
      // Dynamically import the voice service to avoid issues in non-browser environments
      const { createVoiceService } = await import('../../services/voice-service/voice-service');

      const voiceService = createVoiceService({
        sttApiUrl: options.sttApiUrl ?? '/api/v1/voice/stt',
        ttsApiUrl: options.ttsApiUrl ?? '/api/v1/voice/tts',
        apiKey: options.apiKey,
        mode: options.mode ?? 'push-to-talk',
        audioConfig: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      await voiceService.initialize();
      voiceServiceRef.current = voiceService;

      // Subscribe to voice events
      const unsubscribes = [
        voiceService.on('stt-start', () => {
          setState((s) => ({ ...s, isListening: true, transcript: '' }));
        }),

        voiceService.on('stt-final', (result: any) => {
          setState((s) => ({ ...s, isListening: false, transcript: result.text }));
          options.onTranscript?.(result.text);
        }),

        voiceService.on('stt-error', (error: Error) => {
          setState((s) => ({ ...s, isListening: false, error: error.message }));
          options.onError?.(error);
        }),

        voiceService.on('tts-start', () => {
          setState((s) => ({ ...s, isSpeaking: true }));
        }),

        voiceService.on('tts-complete', () => {
          setState((s) => ({ ...s, isSpeaking: false }));
        }),

        voiceService.on('tts-error', (error: Error) => {
          setState((s) => ({ ...s, isSpeaking: false, error: error.message }));
          options.onError?.(error);
        }),

        voiceService.on('session-status-change', (status: VoiceSessionStatus) => {
          setState((s) => ({ ...s, sessionStatus: status }));
        }),
      ];

      unsubscribeRef.current = unsubscribes;

      setState((s) => ({ ...s, isInitialized: true }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize voice';
      setState((s) => ({ ...s, error: errorMsg }));
      options.onError?.(new Error(errorMsg));
    }
  }, [options]);

  /**
   * Start listening
   */
  const startListening = useCallback(() => {
    if (!voiceServiceRef.current) {
      setState((s) => ({ ...s, error: 'Voice service not initialized' }));
      return;
    }

    try {
      voiceServiceRef.current.startListening();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start listening';
      setState((s) => ({ ...s, error: errorMsg }));
    }
  }, []);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (!voiceServiceRef.current) return;
    voiceServiceRef.current.stopListening();
  }, []);

  /**
   * Synthesize speech
   */
  const speak = useCallback(async (text: string) => {
    if (options.voiceEnabled === false) {
      return;
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      setState((s) => ({ ...s, error: "Speech synthesis is not available in this browser." }));
      return;
    }

    if (!text.trim()) return;

    try {
      if (activeUtteranceRef.current) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;
      const voices = window.speechSynthesis.getVoices();
      const namedVoice = options.voiceName
        ? voices.find((voice) => voice.name.toLowerCase() === options.voiceName?.toLowerCase())
        : undefined;
      if (namedVoice) utterance.voice = namedVoice;
      utterance.rate = options.speakingRate ?? 1.0;
      utterance.pitch = 1.02;

      utterance.onstart = () => {
        setState((s) => ({ ...s, isSpeaking: true, sessionStatus: "speaking", error: null }));
      };
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        const word = text.slice(event.charIndex, Math.min(text.length, event.charIndex + 6));
        const viseme = inferViseme(word);
        const energy = Math.min(1, 0.2 + word.length / 7);
        options.onSpeechProgress?.({ energy, viseme });
      };
      utterance.onend = () => {
        setState((s) => ({ ...s, isSpeaking: false, sessionStatus: "idle" }));
        options.onSpeechProgress?.({ energy: 0, viseme: "rest" });
        activeUtteranceRef.current = null;
      };
      utterance.onerror = () => {
        setState((s) => ({ ...s, isSpeaking: false, sessionStatus: "idle", error: "Voice playback failed." }));
        options.onSpeechProgress?.({ energy: 0, viseme: "rest" });
        activeUtteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to synthesize speech';
      setState((s) => ({ ...s, error: errorMsg, isSpeaking: false, sessionStatus: "idle" }));
      options.onSpeechProgress?.({ energy: 0, viseme: "rest" });
    }
  }, [options.voiceEnabled, options.voiceName, options.speakingRate, options.onSpeechProgress]);

  /**
   * Interrupt current operation
   */
  const interrupt = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }
    if (!voiceServiceRef.current) return;
    voiceServiceRef.current.interrupt();
  }, []);

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    setState((s) => ({ ...s, transcript: '' }));
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initialize();

    return () => {
      // Cleanup
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
      }
      if (voiceServiceRef.current) {
        voiceServiceRef.current.dispose();
      }
      unsubscribeRef.current.forEach((unsub) => unsub());
    };
  }, [initialize]);

  return {
    ...state,
    startListening,
    stopListening,
    speak,
    interrupt,
    clearTranscript,
    toggleListening: state.isListening ? stopListening : startListening,
  };
}
