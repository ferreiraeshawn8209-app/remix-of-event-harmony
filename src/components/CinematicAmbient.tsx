interface CinematicAmbientProps {
  intensity?: "soft" | "medium" | "high";
}

const particleSets = {
  soft: 8,
  medium: 14,
  high: 20,
} as const;

export function CinematicAmbient({ intensity = "medium" }: CinematicAmbientProps) {
  const particles = particleSets[intensity];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,hsl(280_95%_60%_/_0.22),transparent_42%),radial-gradient(circle_at_84%_14%,hsl(40_96%_58%_/_0.2),transparent_40%),radial-gradient(circle_at_72%_88%,hsl(28_98%_58%_/_0.16),transparent_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(155deg,hsl(250_46%_8%_/_0.35),hsl(252_42%_5%_/_0.7))]" />
      {Array.from({ length: particles }).map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-gradient-to-b from-primary/50 to-secondary/20 animate-float"
          style={{
            width: `${(index % 3) + 4}px`,
            height: `${(index % 3) + 4}px`,
            left: `${(index * 13) % 100}%`,
            top: `${(index * 17) % 100}%`,
            animationDelay: `${(index % 8) * 0.6}s`,
            animationDuration: `${5 + (index % 6)}s`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}

