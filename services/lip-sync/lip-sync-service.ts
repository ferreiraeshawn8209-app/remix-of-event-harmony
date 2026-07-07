// Lip-Sync Service - Real-time audio analysis for mouth animation
import type { Phoneme, FacialFrame, LipSyncTrack } from "@/packages/shared-types/avatar";

/**
 * Maps frequency analysis to phonemes for natural lip-sync
 */
export class LipSyncService {
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private dataArray: Uint8Array | null = null;

  /**
   * Initialize audio analysis
   */
  async initialize(audioContext: AudioContext, source: AudioNode) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  /**
   * Analyze audio and generate phoneme frames
   */
  analyzeAudio(audioBuffer: AudioBuffer, timeOffset: number = 0): FacialFrame[] {
    const frames: FacialFrame[] = [];
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const frameDuration = 100; // milliseconds per frame
    const samplesPerFrame = (sampleRate * frameDuration) / 1000;

    for (let i = 0; i < channelData.length; i += samplesPerFrame) {
      const frameData = channelData.slice(i, i + samplesPerFrame);
      const phoneme = this.detectPhoneme(frameData);
      const blendValue = this.calculateBlendValue(frameData, phoneme);

      frames.push({
        phoneme,
        blendShapeValue: blendValue,
        timestamp: timeOffset + (i / sampleRate) * 1000,
      });
    }

    return frames;
  }

  /**
   * Detect dominant phoneme from audio frame
   */
  private detectPhoneme(frameData: Float32Array): Phoneme {
    if (frameData.length === 0) return "rest";

    // Calculate RMS for voice energy
    let sum = 0;
    for (const sample of frameData) {
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / frameData.length);
    const energyLevel = Math.min(rms * 10, 1); // Normalize to 0-1

    if (energyLevel < 0.1) return "rest";

    // Analyze frequency content for vowel/consonant distinction
    const frequencies = this.getFrequencySpectrum(frameData);
    const dominantFreq = this.findDominantFrequency(frequencies);

    // Phoneme mapping based on dominant frequency
    if (dominantFreq < 500) return "o"; // Low frequency
    if (dominantFreq < 1000) return "a";
    if (dominantFreq < 1500) return "e";
    if (dominantFreq < 2000) return "i";
    if (dominantFreq < 3000) return "u";

    // High-frequency consonants
    return this.detectConsonant(frameData, frequencies);
  }

  /**
   * Detect consonant sounds
   */
  private detectConsonant(frameData: Float32Array, frequencies: number[]): Phoneme {
    // Analyze zero-crossing rate for fricative detection
    let zeroCrossings = 0;
    for (let i = 1; i < frameData.length; i++) {
      if ((frameData[i] >= 0 && frameData[i - 1] < 0) || (frameData[i] < 0 && frameData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }

    const zcRate = zeroCrossings / frameData.length;

    if (zcRate > 0.3) return "s"; // Fricative (high zero-crossing rate)
    if (zcRate > 0.15) return "f";
    return "m"; // Default to neutral
  }

  /**
   * Get frequency spectrum using FFT-like analysis
   */
  private getFrequencySpectrum(frameData: Float32Array): number[] {
    const spectrum: number[] = [];
    const length = Math.min(frameData.length, 256);

    // Simple FFT approximation using energy bands
    for (let band = 0; band < 8; band++) {
      const bandStart = (band * length) / 8;
      const bandEnd = ((band + 1) * length) / 8;
      let energy = 0;

      for (let i = Math.floor(bandStart); i < Math.floor(bandEnd); i++) {
        energy += Math.abs(frameData[i]);
      }

      spectrum.push(energy / (bandEnd - bandStart));
    }

    return spectrum;
  }

  /**
   * Find dominant frequency band
   */
  private findDominantFrequency(frequencies: number[]): number {
    let maxEnergy = 0;
    let dominantBand = 0;

    frequencies.forEach((energy, i) => {
      if (energy > maxEnergy) {
        maxEnergy = energy;
        dominantBand = i;
      }
    });

    // Map band to frequency (simplified)
    return (dominantBand + 1) * 500; // 500Hz per band
  }

  /**
   * Calculate blend shape value for phoneme
   */
  private calculateBlendValue(frameData: Float32Array, phoneme: Phoneme): number {
    let sum = 0;
    for (const sample of frameData) {
      sum += Math.abs(sample);
    }
    const amplitude = sum / frameData.length;

    // Normalize amplitude to 0-1 blend shape range
    return Math.min(amplitude * 5, 1);
  }

  /**
   * Generate lip-sync track from audio file URL
   */
  async generateLipSyncTrack(audioUrl: string, duration: number): Promise<LipSyncTrack> {
    if (!this.audioContext) {
      throw new Error("Audio context not initialized");
    }

    // Fetch and decode audio
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Analyze audio
    const frames = this.analyzeAudio(audioBuffer);

    return {
      audioUrl,
      frames,
      duration: audioBuffer.duration * 1000,
    };
  }

  /**
   * Simplified phoneme timing (for TTS without pre-analyzed data)
   */
  generatePhonemeEstimate(text: string, duration: number): FacialFrame[] {
    const frames: FacialFrame[] = [];
    const frameDuration = 100; // milliseconds
    const totalFrames = Math.ceil(duration / frameDuration);

    // Simple phoneme mapping for common English sounds
    const phonemeMap: Record<string, Phoneme> = {
      a: "a", e: "e", i: "i", o: "o", u: "u",
      m: "m", p: "p", f: "f", r: "r", s: "s", t: "t",
      th: "th",
    };

    for (let i = 0; i < totalFrames; i++) {
      const progress = i / totalFrames;
      const textPosition = Math.floor(text.length * progress);

      let phoneme: Phoneme = "rest";
      if (textPosition < text.length) {
        const char = text[textPosition].toLowerCase();
        phoneme = phonemeMap[char] || "rest";
      }

      frames.push({
        phoneme,
        blendShapeValue: phoneme === "rest" ? 0 : 0.5,
        timestamp: i * frameDuration,
      });
    }

    return frames;
  }
}

/**
 * Global lip-sync service instance
 */
export const lipSyncService = new LipSyncService();
