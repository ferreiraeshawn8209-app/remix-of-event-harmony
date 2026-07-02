import { useEffect, useMemo, useRef, useState } from "react";
import { decompressFrames, parseGIF } from "gifuct-js";

interface LoopingGifImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
}

interface GifFrame {
  delay: number;
  dims: { top: number; left: number; width: number; height: number };
  patch: Uint8ClampedArray;
}

function isGifSource(url: string) {
  return /\.gif($|[?#])/i.test(url);
}

export function LoopingGifImage({ src, alt, className, loading = "lazy" }: LoopingGifImageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [useCanvas, setUseCanvas] = useState(true);
  const [ready, setReady] = useState(false);
  const isGif = useMemo(() => isGifSource(src), [src]);

  useEffect(() => {
    if (!isGif) return;

    let cancelled = false;
    let rafId = 0;

    const run = async () => {
      try {
        const response = await fetch(src, { mode: "cors" });
        if (!response.ok) throw new Error(`Failed GIF fetch: ${response.status}`);

        const gifBuffer = await response.arrayBuffer();
        const parsed: any = parseGIF(gifBuffer);
        const frames = decompressFrames(parsed, true) as GifFrame[];

        if (!frames.length || cancelled) throw new Error("No GIF frames");

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) throw new Error("Canvas unavailable");

        const width = parsed?.lsd?.width || frames[0].dims.width;
        const height = parsed?.lsd?.height || frames[0].dims.height;

        canvas.width = width;
        canvas.height = height;

        let frameIndex = 0;
        let lastTick = 0;
        const minFrameMs = 1000 / 24;
        const maxFrameMs = 1000 / 12;
        const playbackSpeed = 1.08;

        const getFrameDelayMs = (frame: GifFrame) => {
          const sourceDelay = (frame.delay || 10) * 10;
          const adjusted = sourceDelay / playbackSpeed;
          return Math.min(maxFrameMs, Math.max(minFrameMs, adjusted));
        };

        const drawFrame = (frame: GifFrame) => {
          const imageData = new ImageData(frame.patch, frame.dims.width, frame.dims.height);
          ctx.putImageData(imageData, frame.dims.left, frame.dims.top);
        };

        drawFrame(frames[0]);
        setReady(true);

        const tick = (time: number) => {
          if (cancelled) return;
          if (!lastTick) lastTick = time;

          const currentFrame = frames[frameIndex];
          const frameDelayMs = getFrameDelayMs(currentFrame);

          if (time - lastTick >= frameDelayMs) {
            drawFrame(currentFrame);
            frameIndex = (frameIndex + 1) % frames.length;
            lastTick = time;
          }

          rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) {
          setUseCanvas(false);
          setReady(true);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isGif, src]);

  if (!isGif || !useCanvas) {
    return <img src={src} alt={alt} className={className} loading={loading} />;
  }

  return (
    <>
      {!ready && <img src={src} alt={alt} className={className} loading={loading} />}
      <canvas
        ref={canvasRef}
        aria-label={alt}
        className={`${className || ""} ${ready ? "block" : "hidden"}`.trim()}
      />
    </>
  );
}
