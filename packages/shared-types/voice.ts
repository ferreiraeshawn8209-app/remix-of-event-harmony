// Voice Service Types - Phase 2
// Speech-to-text, text-to-speech, and voice session management

export type VoiceMode = 'continuous' | 'push-to-talk';
export type VoiceSessionStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'interrupted';

export interface VoiceSettings {
  id: string;
  event_id: string;
  stt_model: string;
  tts_voice: string;
  speaking_rate: number;
  interruption_mode: VoiceMode;
  created_at: string;
  updated_at: string;
}

export interface VoiceSession {
  id: string;
  conversation_id: string;
  status: VoiceSessionStatus;
  started_at: string;
  last_activity_at: string;
  mode: VoiceMode;
  audio_chunks: number;
}

export interface SttResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  startTime: number;
  endTime: number;
}

export interface TtsOptions {
  voice: string;
  speakingRate: number;
  pitch?: number;
  volumeGain?: number;
}

export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  sampleFormat: 'float32' | 'int16';
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channelCount: 1,
  sampleFormat: 'float32',
  echoCancellation: true,
  noiseSuppression: true,
};

export interface VoiceEventMap {
  'stt-start': void;
  'stt-partial': SttResult;
  'stt-final': SttResult;
  'stt-error': Error;
  'tts-start': string;
  'tts-complete': void;
  'tts-error': Error;
  'session-status-change': VoiceSessionStatus;
  'interrupt': void;
}

export class VoiceEventEmitter {
  private listeners: Map<keyof VoiceEventMap, Set<Function>> = new Map();

  on<K extends keyof VoiceEventMap>(
    event: K,
    callback: (data: VoiceEventMap[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit<K extends keyof VoiceEventMap>(
    event: K,
    data: VoiceEventMap[K]
  ): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        (callback as Function)(data);
      } catch (error) {
        console.error(`Error in ${String(event)} listener:`, error);
      }
    });
  }
}

export interface VoiceServiceConfig {
  sttApiUrl: string;
  ttsApiUrl: string;
  apiKey?: string;
  mode: VoiceMode;
  audioConfig: Partial<AudioConfig>;
}

export interface RecognitionResult {
  isFinal: boolean;
  transcript: string;
  confidence: number;
  alternatives?: {
    transcript: string;
    confidence: number;
  }[];
}
