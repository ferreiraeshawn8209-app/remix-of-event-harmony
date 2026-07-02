// Beatkulture Avatar Types - Phase 3

/**
 * Avatar emotional states
 */
export type AvatarEmotion = "idle" | "listening" | "thinking" | "speaking" | "happy" | "celebrating" | "confused" | "sad";

/**
 * Animation types the avatar can perform
 */
export type AvatarAnimation = "walk_forward" | "walk_backward" | "idle" | "wave" | "point" | "shrug" | "nod" | "celebrate";

/**
 * Gesture types with hand/body movement
 */
export type GestureType = "wave" | "point" | "thumbs_up" | "clap" | "shrug" | "nod" | "shake_head";

/**
 * Lip-sync phoneme for mouth animation
 */
export type Phoneme = "a" | "e" | "i" | "o" | "u" | "m" | "p" | "f" | "r" | "s" | "t" | "th" | "rest";

/**
 * Facial animation frame with mouth position
 */
export interface FacialFrame {
  phoneme: Phoneme;
  blendShapeValue: number; // 0-1
  timestamp: number; // milliseconds
}

/**
 * Lip-sync animation track
 */
export interface LipSyncTrack {
  audioUrl: string;
  frames: FacialFrame[];
  duration: number; // milliseconds
}

/**
 * Avatar configuration
 */
export interface AvatarConfig {
  vrmModelUrl: string;
  name: string;
  brandColor: "gold" | "purple" | "orange";
  scale: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  lookAtCamera: boolean;
}

/**
 * Avatar animation state
 */
export interface AnimationState {
  current: AvatarAnimation;
  emotion: AvatarEmotion;
  isTransitioning: boolean;
  transitionProgress: number; // 0-1
}

/**
 * Avatar control commands
 */
export interface AvatarCommand {
  type: "gesture" | "animation" | "emotion" | "speak" | "listen" | "move";
  gesture?: GestureType;
  animation?: AvatarAnimation;
  emotion?: AvatarEmotion;
  duration?: number;
  targetPosition?: { x: number; z: number };
}

/**
 * Avatar event emitted during interaction
 */
export interface AvatarEvent {
  type: "animation_start" | "animation_complete" | "gesture_complete" | "emotion_changed" | "speech_start" | "speech_end";
  animation?: AvatarAnimation;
  emotion?: AvatarEmotion;
  timestamp: number;
}

/**
 * Eye gaze target
 */
export interface EyeGazeTarget {
  x: number;
  y: number;
  z: number;
  duration?: number; // milliseconds to reach target
}

/**
 * Facial expression blend shape values
 */
export interface FacialExpression {
  blinkLeft?: number;
  blinkRight?: number;
  eyeWideLeft?: number;
  eyeWideRight?: number;
  eyeSquintLeft?: number;
  eyeSquintRight?: number;
  browRaiseLeft?: number;
  browRaiseRight?: number;
  mouthOpen?: number;
  mouthSmile?: number;
  mouthSad?: number;
  cheekPuff?: number;
}

/**
 * Avatar state snapshot
 */
export interface AvatarState {
  animation: AnimationState;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  facialExpression: FacialExpression;
  lipSync?: LipSyncTrack;
}
