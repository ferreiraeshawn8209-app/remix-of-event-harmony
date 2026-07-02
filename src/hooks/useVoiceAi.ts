// React hook for voice-powered AI interaction - Phase 2
// Integrates STT/TTS with conversation flow

import { useCallback, useRef, useEffect, useState } from 'react';
import type { VoiceMode, VoiceSessionStatus } from '../shared-types/voice';

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

  /**
   * Initialize voice service
   */
  const initialize = useCallback(async () => {
    try {
      // Dynamically import the voice service to avoid issues in non-browser environments
      const { createVoiceService } = await import('../services/voice-service/voice-service');

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
    if (!voiceServiceRef.current) {
      setState((s) => ({ ...s, error: 'Voice service not initialized' }));
      return;
    }

    try {
      await voiceServiceRef.current.synthesizeSpeech(text, {
        speakingRate: 1.0,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to synthesize speech';
      setState((s) => ({ ...s, error: errorMsg }));
    }
  }, []);

  /**
   * Interrupt current operation
   */
  const interrupt = useCallback(() => {
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
