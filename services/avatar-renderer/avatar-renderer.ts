// Avatar Renderer - Three.js based VRM avatar rendering for Beatkulture AI Concierge
import * as THREE from "three";
import { VRM, VRMUtils } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import type {
  AvatarConfig,
  AvatarAnimation,
  AvatarEmotion,
  AnimationState,
  AvatarCommand,
  AvatarEvent,
  EyeGazeTarget,
  FacialExpression,
  GestureType,
} from "@/packages/shared-types/avatar";
import { EventEmitter } from "events";

/**
 * AvatarRenderer handles VRM model loading, animation, and rendering
 */
export class AvatarRenderer extends EventEmitter {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private vrm: VRM | null = null;
  private container: HTMLDivElement;
  private config: AvatarConfig;
  private animationState: AnimationState;
  private mixer: THREE.AnimationMixer | null = null;
  private animationClips: Map<string, THREE.AnimationClip> = new Map();
  private currentAction: THREE.Action | null = null;
  private blinkTimer: NodeJS.Timeout | null = null;
  private facialExpressionTarget: Partial<FacialExpression> = {};
  private eyeGazeTarget: EyeGazeTarget | null = null;
  private isInitialized = false;

  constructor(container: HTMLDivElement, config: AvatarConfig) {
    super();
    this.container = container;
    this.config = config;
    this.animationState = {
      current: "idle",
      emotion: "idle",
      isTransitioning: false,
      transitionProgress: 0,
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 1.5, 2);
    this.camera.lookAt(0, 1.2, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupResizeListener();
    this.startAnimationLoop();
  }

  private setupLighting() {
    // Key light (main)
    const keyLight = new THREE.DirectionalLight(0xffd700, 1.2); // Gold
    keyLight.position.set(3, 4, 2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xa855f7, 0.6); // Purple
    fillLight.position.set(-3, 2, 2);
    this.scene.add(fillLight);

    // Accent light
    const accentLight = new THREE.DirectionalLight(0xff7a00, 0.4); // Orange
    accentLight.position.set(0, 3, -3);
    this.scene.add(accentLight);

    // Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  private setupResizeListener() {
    window.addEventListener("resize", () => this.onWindowResize());
  }

  private onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const camera = this.camera as THREE.PerspectiveCamera;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startAnimationLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.mixer) {
        this.mixer.update(0.016); // 60fps
      }

      if (this.vrm) {
        this.vrm.update(0.016);

        // Update blinking
        this.updateBlinking();

        // Update eye gaze
        if (this.eyeGazeTarget && this.config.lookAtCamera) {
          this.updateEyeGaze();
        }

        // Smooth facial expression transitions
        this.updateFacialExpressions();
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Load and initialize VRM avatar model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const loader = new GLTFLoader();
    loader.register((parser) => new THREE.GLTFDracoExtension(parser));

    try {
      const gltf = await loader.loadAsync(this.config.vrmModelUrl);
      const vrm = await VRM.from(gltf);

      vrm.scene.scale.set(this.config.scale, this.config.scale, this.config.scale);
      vrm.scene.position.set(this.config.position.x, this.config.position.y, this.config.position.z);

      this.scene.add(vrm.scene);
      this.vrm = vrm;

      this.mixer = new THREE.AnimationMixer(vrm.scene);

      // Load animations from the model
      gltf.animations.forEach((clip) => {
        this.animationClips.set(clip.name, clip);
      });

      // Setup initial blinking
      this.startBlinking();

      this.isInitialized = true;
      this.emit("initialized");
    } catch (error) {
      console.error("Failed to load VRM avatar:", error);
      throw error;
    }
  }

  /**
   * Play an animation
   */
  async playAnimation(animation: AvatarAnimation, duration: number = 1): Promise<void> {
    if (!this.vrm || !this.mixer) return;

    // Stop current animation
    if (this.currentAction) {
      this.currentAction.stop();
    }

    // Try to find animation in loaded clips
    let clip = this.animationClips.get(animation);

    if (!clip) {
      // Fallback: create simple animation
      clip = this.createFallbackAnimation(animation, duration);
    }

    if (clip) {
      this.currentAction = this.mixer.clipAction(clip);
      this.currentAction.play();
      this.animationState.current = animation;
      this.emit("animation_start", { animation, timestamp: Date.now() });
    }
  }

  /**
   * Create fallback animations if not in model
   */
  private createFallbackAnimation(animationType: AvatarAnimation, duration: number): THREE.AnimationClip {
    const tracks: THREE.KeyframeTrack[] = [];

    switch (animationType) {
      case "nod":
        tracks.push(
          new THREE.QuaternionKeyframeTrack(".quaternion", [0, duration / 2, duration], [
            0, 0, 0, 1, 0.1, 0, 0.98, 0.1, 0, 0, 0, 1,
          ]),
        );
        break;

      case "wave":
        if (this.vrm?.humanoid?.getRawBoneNode("rightUpperArm")) {
          const arm = this.vrm.humanoid.getRawBoneNode("rightUpperArm");
          if (arm) {
            tracks.push(
              new THREE.QuaternionKeyframeTrack(
                "Armature|Arm_R.quaternion",
                [0, duration / 2, duration],
                [0, 0, 0, 1, 0.2, 0.8, 0, 0.6, 0, 0, 0, 1],
              ),
            );
          }
        }
        break;

      case "point":
        // Point forward with right arm
        tracks.push(
          new THREE.PositionKeyframeTrack(".position", [0, duration], [0, 0, 0, 0.5, 0, 1.5]),
        );
        break;
    }

    return new THREE.AnimationClip(animationType, duration, tracks);
  }

  /**
   * Set facial expression
   */
  setFacialExpression(expression: Partial<FacialExpression>) {
    if (!this.vrm) return;

    this.facialExpressionTarget = expression;

    // Apply to VRM blend shapes
    Object.entries(expression).forEach(([key, value]) => {
      if (value !== undefined && this.vrm) {
        const blendShapeName = this.mapExpressionToBlendShape(key);
        if (blendShapeName && this.vrm.blendShapeProxy) {
          this.vrm.blendShapeProxy.setValue(blendShapeName, value);
        }
      }
    });
  }

  /**
   * Map expression property to VRM blend shape name
   */
  private mapExpressionToBlendShape(expressionKey: string): string {
    const map: Record<string, string> = {
      mouthOpen: "mouthOpen",
      mouthSmile: "mouthSmile",
      mouthSad: "mouthSad",
      eyeWideLeft: "eyeWideLeft",
      eyeWideRight: "eyeWideRight",
      eyeSquintLeft: "eyeSquintLeft",
      eyeSquintRight: "eyeSquintRight",
      blinkLeft: "blinkLeft",
      blinkRight: "blinkRight",
      browRaiseLeft: "browRaiseLeft",
      browRaiseRight: "browRaiseRight",
      cheekPuff: "cheekPuff",
    };
    return map[expressionKey] || expressionKey;
  }

  /**
   * Start automatic blinking
   */
  private startBlinking() {
    const blink = () => {
      this.setFacialExpression({
        blinkLeft: 1,
        blinkRight: 1,
      });

      setTimeout(() => {
        this.setFacialExpression({
          blinkLeft: 0,
          blinkRight: 0,
        });

        this.blinkTimer = setTimeout(blink, 3000 + Math.random() * 2000);
      }, 150);
    };

    this.blinkTimer = setTimeout(blink, 2000);
  }

  /**
   * Update blinking
   */
  private updateBlinking() {
    // Blinking handled by timer
  }

  /**
   * Apply emotion state
   */
  setEmotion(emotion: AvatarEmotion) {
    if (this.animationState.emotion === emotion) return;

    this.animationState.emotion = emotion;
    this.emit("emotion_changed", { emotion, timestamp: Date.now() });

    // Map emotions to facial expressions
    const expressionMap: Record<AvatarEmotion, Partial<FacialExpression>> = {
      idle: { mouthOpen: 0, mouthSmile: 0 },
      listening: { eyeWideLeft: 0.3, eyeWideRight: 0.3, mouthOpen: 0.1 },
      thinking: { browRaiseLeft: 0.3, browRaiseRight: 0.3, mouthOpen: 0 },
      speaking: { mouthOpen: 0.5 },
      happy: { mouthSmile: 0.8, eyeWideLeft: 0.2, eyeWideRight: 0.2 },
      celebrating: { mouthSmile: 1, eyeWideLeft: 0.5, eyeWideRight: 0.5 },
      confused: { browRaiseLeft: 0.5, browRaiseRight: 0.5, mouthOpen: 0.2 },
      sad: { mouthSad: 0.8, eyeSquintLeft: 0.2, eyeSquintRight: 0.2 },
    };

    this.setFacialExpression(expressionMap[emotion]);
  }

  /**
   * Set eye gaze target
   */
  setEyeGaze(target: EyeGazeTarget) {
    this.eyeGazeTarget = target;
  }

  /**
   * Update eye gaze
   */
  private updateEyeGaze() {
    if (!this.eyeGazeTarget || !this.vrm) return;

    // Smooth look at target
    if (this.vrm.lookAt) {
      const target = new THREE.Vector3(this.eyeGazeTarget.x, this.eyeGazeTarget.y, this.eyeGazeTarget.z);
      this.vrm.lookAt?.target?.setFromMatrixPosition(new THREE.Matrix4().setPosition(target));
    }
  }

  /**
   * Update facial expressions smoothly
   */
  private updateFacialExpressions() {
    // Smooth transitions can be added here
  }

  /**
   * Execute a command
   */
  async executeCommand(command: AvatarCommand): Promise<void> {
    switch (command.type) {
      case "gesture":
        if (command.gesture) {
          await this.performGesture(command.gesture, command.duration || 1);
        }
        break;

      case "animation":
        if (command.animation) {
          await this.playAnimation(command.animation, command.duration || 1);
        }
        break;

      case "emotion":
        if (command.emotion) {
          this.setEmotion(command.emotion);
        }
        break;

      case "listen":
        this.setEmotion("listening");
        break;

      case "speak":
        this.setEmotion("speaking");
        break;

      case "move":
        if (command.targetPosition && this.vrm) {
          // Animate position change
          this.animateToPosition(command.targetPosition, command.duration || 2);
        }
        break;
    }
  }

  /**
   * Perform gesture
   */
  private async performGesture(gesture: GestureType, duration: number): Promise<void> {
    const gestureAnimations: Record<GestureType, AvatarAnimation> = {
      wave: "wave",
      point: "point",
      thumbs_up: "wave", // Fallback
      clap: "wave",
      shrug: "wave",
      nod: "nod",
      shake_head: "wave",
    };

    await this.playAnimation(gestureAnimations[gesture], duration);
  }

  /**
   * Animate to target position
   */
  private animateToPosition(target: { x: number; z: number }, duration: number) {
    if (!this.vrm) return;

    const start = { x: this.vrm.scene.position.x, z: this.vrm.scene.position.z };
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      if (this.vrm) {
        this.vrm.scene.position.x = start.x + (target.x - start.x) * progress;
        this.vrm.scene.position.z = start.z + (target.z - start.z) * progress;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    if (this.renderer) this.renderer.dispose();
    if (this.vrm) VRMUtils.deepDispose(this.vrm.scene);
    this.container.removeChild(this.renderer.domElement);
  }
}
