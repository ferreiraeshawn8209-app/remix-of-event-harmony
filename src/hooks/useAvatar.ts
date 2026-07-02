// useAvatar hook - React integration for Beatkulture avatar system
import { useEffect, useRef, useState } from "react";
import { AvatarRenderer } from "@/services/avatar-renderer/avatar-renderer";
import type {
  AvatarConfig,
  AvatarAnimation,
  AvatarCommand,
  AvatarEmotion,
  EyeGazeTarget,
  FacialExpression,
} from "@/packages/shared-types/avatar";

/**
 * Hook to manage avatar lifecycle and interactions
 */
export function useAvatar(
  containerRef: React.RefObject<HTMLDivElement>,
  config: AvatarConfig,
  enabled: boolean = true,
) {
  const rendererRef = useRef<AvatarRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize avatar on mount
  useEffect(() => {
    if (!enabled || !containerRef.current) {
      setIsLoading(false);
      return;
    }

    const initializeAvatar = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const renderer = new AvatarRenderer(containerRef.current!, config);
        rendererRef.current = renderer;

        await renderer.initialize();
        setIsReady(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize avatar";
        setError(message);
        console.error("Avatar initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAvatar();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [containerRef, config, enabled]);

  /**
   * Play animation
   */
  const playAnimation = async (animation: AvatarAnimation, duration?: number) => {
    if (!rendererRef.current) return;
    await rendererRef.current.playAnimation(animation, duration);
  };

  /**
   * Set emotion
   */
  const setEmotion = (emotion: AvatarEmotion) => {
    if (!rendererRef.current) return;
    rendererRef.current.setEmotion(emotion);
  };

  /**
   * Set facial expression
   */
  const setFacialExpression = (expression: Partial<FacialExpression>) => {
    if (!rendererRef.current) return;
    rendererRef.current.setFacialExpression(expression);
  };

  /**
   * Set eye gaze
   */
  const setEyeGaze = (target: EyeGazeTarget) => {
    if (!rendererRef.current) return;
    rendererRef.current.setEyeGaze(target);
  };

  /**
   * Execute command
   */
  const executeCommand = async (command: AvatarCommand) => {
    if (!rendererRef.current) return;
    await rendererRef.current.executeCommand(command);
  };

  /**
   * Make avatar speak (emotion + animation)
   */
  const speak = async () => {
    setEmotion("speaking");
    // Lip-sync would be handled separately with audio analysis
  };

  /**
   * Make avatar listen
   */
  const listen = async () => {
    setEmotion("listening");
  };

  /**
   * Celebrate milestone
   */
  const celebrate = async () => {
    setEmotion("celebrating");
    await playAnimation("celebrate", 2);
  };

  /**
   * Reset to idle
   */
  const idle = async () => {
    setEmotion("idle");
    await playAnimation("idle");
  };

  return {
    isReady,
    isLoading,
    error,
    renderer: rendererRef.current,
    playAnimation,
    setEmotion,
    setFacialExpression,
    setEyeGaze,
    executeCommand,
    speak,
    listen,
    celebrate,
    idle,
  };
}
