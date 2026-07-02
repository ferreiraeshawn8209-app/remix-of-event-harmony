// Voice Service - Speech-to-text and text-to-speech orchestration
// Supports Faster-Whisper (STT) and Piper TTS (local or remote)

import type {
  VoiceServiceConfig,
  SttResult,
  TtsOptions,
  AudioConfig,
  VoiceSessionStatus,
  VoiceMode,
} from '../../shared-types/voice';
import { VoiceEventEmitter } from '../../shared-types/voice';

export class VoiceService {
  private config: VoiceServiceConfig;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioChunks: Blob[] = [];
  private eventEmitter: VoiceEventEmitter;
  private currentSessionStatus: VoiceSessionStatus = 'idle';
  private silenceTimeout: NodeJS.Timeout | null = null;
  private silenceThreshold = 0.02;
  private silenceDuration = 1000; // ms

  constructor(config: VoiceServiceConfig) {
    this.config = {
      audioConfig: {},
      ...config,
    };
    this.eventEmitter = new VoiceEventEmitter();
  }

  /**
   * Initialize audio context and check permissions
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.config.audioConfig.echoCancellation ?? true,
          noiseSuppression: this.config.audioConfig.noiseSuppression ?? true,
          sampleRate: this.config.audioConfig.sampleRate ?? 16000,
        },
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        await this.processAudio();
      };

      this.setSessionStatus('idle');
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  /**
   * Start listening for voice input
   */
  startListening(): void {
    if (!this.mediaRecorder) {
      throw new Error('Voice service not initialized');
    }

    this.audioChunks = [];
    this.mediaRecorder.start();
    this.setSessionStatus('listening');
    this.eventEmitter.emit('stt-start', undefined);

    // Clear silence timeout
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }

    // In continuous mode, auto-stop after silence
    if (this.config.mode === 'continuous') {
      this.silenceTimeout = setTimeout(() => {
        this.stopListening();
      }, this.silenceDuration);
    }
  }

  /**
   * Stop listening and process audio
   */
  stopListening(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return;
    }

    this.mediaRecorder.stop();
    this.setSessionStatus('processing');

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
  }

  /**
   * Interrupt current speech or playback
   */
  interrupt(): void {
    this.stopListening();
    this.eventEmitter.emit('interrupt', undefined);
    this.setSessionStatus('interrupted');
  }

  /**
   * Send audio to speech-to-text API
   */
  private async processAudio(): Promise<void> {
    if (this.audioChunks.length === 0) {
      this.setSessionStatus('idle');
      return;
    }

    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      const response = await fetch(this.config.sttApiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`STT API error: ${response.statusText}`);
      }

      const result = await response.json();

      const sttResult: SttResult = {
        text: result.text || '',
        confidence: result.confidence ?? 0.9,
        isFinal: true,
        startTime: Date.now(),
        endTime: Date.now(),
      };

      this.eventEmitter.emit('stt-final', sttResult);
      this.setSessionStatus('idle');
    } catch (error) {
      console.error('STT processing error:', error);
      this.eventEmitter.emit('stt-error', error as Error);
      this.setSessionStatus('idle');
    }
  }

  /**
   * Synthesize speech from text
   */
  async synthesizeSpeech(text: string, options: Partial<TtsOptions> = {}): Promise<void> {
    const ttsOptions: TtsOptions = {
      voice: options.voice ?? 'default',
      speakingRate: options.speakingRate ?? 1.0,
      ...options,
    };

    try {
      this.setSessionStatus('speaking');
      this.eventEmitter.emit('tts-start', text);

      const response = await fetch(this.config.ttsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({
          text,
          voice: ttsOptions.voice,
          speed: ttsOptions.speakingRate,
          pitch: ttsOptions.pitch ?? 1.0,
          volume_gain_db: ttsOptions.volumeGain ?? 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      await this.playAudio(audioBlob);

      this.eventEmitter.emit('tts-complete', undefined);
      this.setSessionStatus('idle');
    } catch (error) {
      console.error('TTS synthesis error:', error);
      this.eventEmitter.emit('tts-error', error as Error);
      this.setSessionStatus('idle');
    }
  }

  /**
   * Play audio blob
   */
  private playAudio(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio();

      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Audio playback failed'));
      };

      audio.src = url;
      audio.play().catch(reject);
    });
  }

  /**
   * Update session status
   */
  private setSessionStatus(status: VoiceSessionStatus): void {
    this.currentSessionStatus = status;
    this.eventEmitter.emit('session-status-change', status);
  }

  /**
   * Get current session status
   */
  getSessionStatus(): VoiceSessionStatus {
    return this.currentSessionStatus;
  }

  /**
   * Subscribe to voice events
   */
  on<K extends keyof import('../../shared-types/voice').VoiceEventMap>(
    event: K,
    callback: (data: any) => void
  ): () => void {
    return this.eventEmitter.on(event, callback);
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }

    if (this.audioContext) {
      await this.audioContext.close();
    }

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }

    this.audioChunks = [];
  }
}

export function createVoiceService(config: VoiceServiceConfig): VoiceService {
  return new VoiceService(config);
}
