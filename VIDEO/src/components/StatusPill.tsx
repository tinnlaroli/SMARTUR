import { Lock, Clock, CheckCircle, Globe, type LucideIcon } from "lucide-react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { SPRING_BOUNCE } from "../helpers/animations";

type Status = "blocked" | "pending" | "approved" | "visible";

const CONFIGS: Record<Status, { label: string; bg: string; text: string; glow: string; Icon: LucideIcon }> = {
  blocked:  { label: "Portal Bloqueado",      bg: "#FEE2E2", text: "#DC2626", glow: "#EF444480", Icon: Lock         },
  pending:  { label: "Pendiente Validación",  bg: "#FEF3C7", text: "#D97706", glow: "#F59E0B80", Icon: Clock        },
  approved: { label: "Aprobado",              bg: "#D1FAE5", text: "#059669", glow: "#10B98180", Icon: CheckCircle  },
  visible:  { label: "Visible para Turistas", bg: "#DBEAFE", text: "#2563EB", glow: "#3B82F680", Icon: Globe        },
};

export function StatusPill({ status, frameIn }: { status: Status; frameIn: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cfg = CONFIGS[status];
  const rel = frame - frameIn;

  // Entry spring — starts from 0, bounces to 1
  const s     = spring({ frame: rel, fps, config: { damping: 11, stiffness: 210, mass: 0.75 } });
  const scale = s;
  const opacity = interpolate(rel, [0, 6], [0, 1], { extrapolateRight: "clamp" as const });

  // Glow pulse — continuous ping after entry (every 90 frames)
  const pingRel   = Math.max(0, rel - 18);
  const pingCycle = pingRel % 90;
  const pingProg  = interpolate(pingCycle, [0, 60], [0, 1], { extrapolateRight: "clamp" as const });
  const pingScale = 1 + pingProg * 1.8;
  const pingOp    = interpolate(pingCycle, [0, 10, 55, 60], [0, 0.50, 0.12, 0], { extrapolateRight: "clamp" as const });

  // Secondary delayed ping
  const ping2Rel   = Math.max(0, rel - 18 - 30);
  const ping2Cycle = ping2Rel % 90;
  const ping2Prog  = interpolate(ping2Cycle, [0, 55], [0, 1], { extrapolateRight: "clamp" as const });
  const ping2Scale = 1 + ping2Prog * 1.4;
  const ping2Op    = interpolate(ping2Cycle, [0, 10, 50, 55], [0, 0.28, 0.06, 0], { extrapolateRight: "clamp" as const });

  return (
    <div style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      transform: `scale(${scale})`,
      opacity,
      transformOrigin: "center center",
    }}>
      {/* Ping ring 1 */}
      {pingOp > 0 && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 999,
          border: `2px solid ${cfg.glow}`,
          scale: String(pingScale),
          opacity: pingOp,
          pointerEvents: "none",
        }} />
      )}
      {/* Ping ring 2 */}
      {ping2Op > 0 && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 999,
          border: `1.5px solid ${cfg.glow}`,
          scale: String(ping2Scale),
          opacity: ping2Op,
          pointerEvents: "none",
        }} />
      )}

      {/* Pill body */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        paddingTop: 14, paddingBottom: 14, paddingLeft: 24, paddingRight: 24,
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.text,
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700, fontSize: 28,
        boxShadow: `0 4px 24px ${cfg.glow}, 0 0 0 1px ${cfg.glow}30`,
      }}>
        <cfg.Icon size={30} />
        {cfg.label}
      </div>
    </div>
  );
}
