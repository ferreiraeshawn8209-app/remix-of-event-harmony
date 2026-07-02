// AvatarConcierge component - Beatkulture AI avatar with emotional intelligence
import { useEffect, useRef, useState } from "react";
import { useAvatar } from "@/hooks/useAvatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { AvatarEmotion } from "@/packages/shared-types/avatar";

interface AvatarConciergeProps {
  enabled?: boolean;
  onReady?: () => void;
  currentEmotion?: AvatarEmotion;
}

export function AvatarConcierge({ enabled = true, onReady, currentEmotion = "idle" }: AvatarConciergeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusText, setStatusText] = useState<string>("");

  // Default avatar config - Beatkulture branded
  const avatarConfig = {
    vrmModelUrl: "/models/avatar-default.vrm", // Path to VRM model
    name: "Beatkulture AI Host",
    brandColor: "purple" as const,
    scale: 1,
    position: { x: 0, y: 0, z: 0 },
    lookAtCamera: true,
  };

  const { isReady, isLoading, error, setEmotion, playAnimation, celebrate, listen, speak, idle } = useAvatar(
    containerRef,
    avatarConfig,
    enabled,
  );

  // Update emotion when prop changes
  useEffect(() => {
    if (isReady && currentEmotion) {
      setEmotion(currentEmotion);
    }
  }, [currentEmotion, isReady, setEmotion]);

  // Setup event listeners
  useEffect(() => {
    if (isReady) {
      onReady?.();
      setStatusText("Ready to assist");
    }
  }, [isReady, onReady]);

  useEffect(() => {
    if (error) {
      setStatusText(`Error: ${error}`);
    }
  }, [error]);

  useEffect(() => {
    if (isLoading) {
      setStatusText("Loading avatar...");
    }
  }, [isLoading]);

  const emotionBadgeColor: Record<AvatarEmotion, string> = {
    idle: "bg-slate-500",
    listening: "bg-blue-500",
    thinking: "bg-purple-500",
    speaking: "bg-green-500",
    happy: "bg-yellow-500",
    celebrating: "bg-orange-500",
    confused: "bg-red-500",
    sad: "bg-gray-500",
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Card variant="glass" className="relative overflow-hidden bg-gradient-to-b from-slate-900/50 to-black/50 border-primary/20">
        {/* Avatar render container */}
        <div
          ref={containerRef}
          className="w-full aspect-square bg-black rounded-lg overflow-hidden relative"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur">
              <div className="text-center text-xs text-muted-foreground px-4">
                <p className="font-semibold text-destructive mb-1">Avatar Load Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status indicators */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <Badge variant="outline" className="bg-black/40">
            {isLoading ? (
              <>
                <Loader2 className="w-2 h-2 mr-1 animate-spin" /> Loading
              </>
            ) : isReady ? (
              <>
                <div className="w-2 h-2 mr-1 rounded-full bg-green-500" /> Online
              </>
            ) : (
              <>
                <div className="w-2 h-2 mr-1 rounded-full bg-red-500" /> Offline
              </>
            )}
          </Badge>

          {isReady && currentEmotion && (
            <Badge variant="outline" className={`bg-black/40 ${emotionBadgeColor[currentEmotion]}/20`}>
              <div className={`w-2 h-2 mr-1 rounded-full ${emotionBadgeColor[currentEmotion]}`} />
              {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
            </Badge>
          )}
        </div>

        {/* Bottom status text */}
        <div className="absolute bottom-3 left-3 right-3 text-[10px] text-muted-foreground text-center">{statusText}</div>
      </Card>

      {/* Quick action buttons */}
      {isReady && (
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => listen()}
            className="px-2 py-1 rounded text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition"
          >
            Listen
          </button>
          <button
            onClick={() => speak()}
            className="px-2 py-1 rounded text-[11px] bg-green-500/20 hover:bg-green-500/30 text-green-300 transition"
          >
            Speak
          </button>
          <button
            onClick={() => celebrate()}
            className="px-2 py-1 rounded text-[11px] bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 transition"
          >
            Celebrate
          </button>
          <button
            onClick={() => idle()}
            className="px-2 py-1 rounded text-[11px] bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 transition"
          >
            Idle
          </button>
        </div>
      )}
    </div>
  );
}
