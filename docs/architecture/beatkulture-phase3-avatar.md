# PHASE 3: AI AVATAR CONCIERGE - Architecture Summary

## Overview
Phase 3 introduces the AI Avatar system that replaces traditional chat with an emotionally-intelligent 3D avatar. The avatar guides users through the event planning experience with natural animations, gestures, and emotional responses.

## Key Components

### 1. Avatar Types (`packages/shared-types/avatar.ts`)
- **AvatarEmotion**: idle, listening, thinking, speaking, happy, celebrating, confused, sad
- **AvatarAnimation**: walk, idle, gestures (wave, point, nod, celebrate)
- **Phoneme**: For lip-sync animation (a, e, i, o, u, m, p, f, r, s, t, th, rest)
- **FacialExpression**: Blend shape controls for eyes, brows, mouth, cheeks

### 2. Avatar Renderer Service (`services/avatar-renderer/avatar-renderer.ts`)
- Three.js + VRM model loading
- Animation mixer with fallback generation
- Facial expression system
- Blinking and eye gaze
- Gesture performance
- Position animation

#### Key Methods:
- `initialize()` - Load VRM model
- `playAnimation(animation, duration)` - Play avatar animations
- `setEmotion(emotion)` - Apply emotional state
- `setFacialExpression(expression)` - Control blend shapes
- `setEyeGaze(target)` - Look at position
- `executeCommand(command)` - Execute avatar action

#### Lighting Setup:
- Key light: Gold (0xffd700) at 1.2 intensity
- Fill light: Purple (0xa855f7) at 0.6 intensity
- Accent light: Orange (0xff7a00) at 0.4 intensity
- Ambient: 0.5 intensity

### 3. Avatar Hook (`src/hooks/useAvatar.ts`)
React hook for managing avatar lifecycle:
- Initialization and cleanup
- Animation control
- Emotion management
- Gesture performance
- Helper methods: `speak()`, `listen()`, `celebrate()`, `idle()`

### 4. Avatar UI Component (`src/components/avatar/AvatarConcierge.tsx`)
- Rendered canvas for avatar
- Loading and error states
- Status indicators (Online/Offline)
- Emotion badge display
- Quick action buttons (Listen, Speak, Celebrate, Idle)

### 5. Lip-Sync Service (`services/lip-sync/lip-sync-service.ts`)
Real-time audio analysis for mouth animation:
- FFT-based frequency analysis
- Phoneme detection from audio frames
- Zero-crossing analysis for consonants
- Phoneme estimation from text (for TTS)
- Blend shape value calculation

#### Methods:
- `initialize(audioContext, source)` - Setup audio analysis
- `analyzeAudio(audioBuffer)` - Generate phoneme frames
- `generateLipSyncTrack(audioUrl)` - Create lip-sync from audio file
- `generatePhonemeEstimate(text, duration)` - Estimate phonemes from text

## Integration Points

### With Phase 1 (AI Planner)
- Avatar reflects conversation state
- Shows thinking/listening emotions during planner interactions
- Celebrates when user completes event profile

### With Phase 2 (Voice AI)
- Avatar speaks during voice synthesis
- Lip-syncs with generated audio
- Shows listening emotion during microphone input
- Responds to interruptions

### Future Phases
- Phase 4: Avatar generates timeline visualizations while speaking
- Phase 5: Avatar narrates event visualizations
- Phase 6: Avatar hosts virtual rehearsal experience

## VRM Model Requirements
Expected avatar model at `/public/models/avatar-default.vrm` should include:
- Humanoid rig (humanoid-compatible)
- Blend shapes for expressions (mouthOpen, mouthSmile, eyeWide, etc.)
- Walk/idle/gesture animations (optional, fallback generated)
- Lip-sync blend shapes (a, e, i, o, u blend shapes)

## Configuration
```typescript
const avatarConfig = {
  vrmModelUrl: "/models/avatar-default.vrm",
  name: "Beatkulture AI Host",
  brandColor: "purple", // gold | purple | orange
  scale: 1,
  position: { x: 0, y: 0, z: 0 },
  lookAtCamera: true,
};
```

## Emotion State Machine
| State | Expression | Use Case |
|-------|-----------|----------|
| idle | Neutral mouth, normal eyes | Default state |
| listening | Wide eyes, slight mouth open | During voice input |
| thinking | Raised brows, neutral mouth | Processing information |
| speaking | Open mouth | During avatar speech |
| happy | Smile, wide eyes | Positive interactions |
| celebrating | Full smile, very wide eyes | Milestone achieved |
| confused | Raised brows, open mouth | Unclear user input |
| sad | Frown, narrowed eyes | Error state |

## Next Steps
1. Obtain/create VRM avatar model
2. Integrate with Phase 1 AI Planner (avatar reacts to conversation)
3. Add lip-sync to Phase 2 voice output
4. Build combined interface (Avatar + Chat + Voice)
5. Test emotion transitions and animations
