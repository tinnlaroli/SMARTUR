import {
  TrendingUp, Star, BarChart3, Wrench, ArrowRight,
  RefreshCw, Zap,
} from "lucide-react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { EmpresaLayoutMock } from "./shared/EmpresaLayoutMock";
import { C, F } from "./tokens";
import { fadeIn } from "../helpers/animations";
import { InScreenCursor } from "../components/motion/InScreenCursor";
import { InScreenHighlight } from "../components/motion/InScreenHighlight";
import { CounterAnimation } from "../components/motion/CounterAnimation";

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const clamp   = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const KPIS = [
  {
    id: "recomendaciones", label: "Recomendaciones IA", value: 247,
    Icon: TrendingUp, color: "#9CCC44", helper: "El motor IA sugirió tus servicios",
    progress: 0.62,
    sparkline: [12, 28, 22, 45, 38, 62, 58, 80, 72, 102],
  },
  {
    id: "favoritos", label: "Favoritos", value: 38,
    Icon: Star, color: "#FF7D1F", helper: "Guardaron tus servicios",
    progress: 0.38,
    sparkline: [4, 8, 6, 14, 10, 18, 22, 28, 32, 38],
  },
  {
    id: "visitas", label: "Visitas", value: 512,
    Icon: BarChart3, color: C.cyan, helper: "Aperturas de detalle",
    progress: 0.80,
    sparkline: [35, 60, 50, 90, 80, 120, 110, 145, 130, 180],
    live: true,
  },
  {
    id: "servicios", label: "Servicios activos", value: 4,
    Icon: Wrench, color: C.purple, helper: "Publicados y visibles",
    progress: 0.40,
    sparkline: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4],
  },
];

const TOP_SERVICES = [
  { name: "Tour Niebla y Café",    visits: 198, favorites: 18, rating: 4.9, recomendaciones: 102 },
  { name: "Sendero Bosque Nublado", visits: 145, favorites: 12, rating: 4.7, recomendaciones: 83  },
  { name: "Cata de Café Especial",  visits: 98,  favorites: 8,  rating: 4.8, recomendaciones: 62  },
];

const QUICK_ACTIONS = [
  { label: "Mis Servicios",  color: "#FF7D1F" },
  { label: "Estadísticas",   color: C.cyan    },
  { label: "Perfil",         color: C.purple  },
];

/** Mini SVG sparkline that draws itself progressively */
function Sparkline({ data, color, rel, startRel, w = 60, h = 22 }: {
  data: number[]; color: string; rel: number; startRel: number; w?: number; h?: number;
}) {
  const drawProg = interpolate(rel, [startRel, startRel + 40], [0, 1], { easing: easeOut, ...clamp });
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const step = w / (data.length - 1);
  const points = data.map((v, i) => {
    const px = i * step;
    const py = h - ((v - min) / range) * h;
    return `${px},${py}`;
  });
  const polyline = points.join(" ");
  // Clip to drawProg
  const clipW = Math.round(w * drawProg);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={`sp-clip-${color.replace("#", "")}`}>
          <rect x="0" y="0" width={clipW} height={h + 10} />
        </clipPath>
        <linearGradient id={`sp-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,${h} ${polyline} ${clipW},${h}`}
        fill={`url(#sp-grad-${color.replace("#", "")})`}
        clipPath={`url(#sp-clip-${color.replace("#", "")})`}
      />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath={`url(#sp-clip-${color.replace("#", "")})`}
      />
      {/* Endpoint dot */}
      {drawProg > 0.9 && (
        <circle cx={w} cy={parseFloat(points[points.length - 1].split(",")[1])} r={2.5} fill={color} />
      )}
    </svg>
  );
}

/** Animated progress bar */
function AnimatedBar({ progress, color, rel, startRel }: { progress: number; color: string; rel: number; startRel: number }) {
  const w = interpolate(rel, [startRel, startRel + 45], [0, progress * 100], { easing: easeOut, ...clamp });
  return (
    <div style={{ marginTop: 8, height: 4, borderRadius: 999, background: C.bgAlt, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${w}%`,
        background: `linear-gradient(90deg, ${color}CC, ${color})`,
        borderRadius: 999,
        boxShadow: `0 0 6px ${color}60`,
      }} />
    </div>
  );
}

/** Live indicator dot */
function LiveDot({ rel }: { rel: number }) {
  const pulse = 0.5 + 0.5 * Math.sin(rel * 0.22);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <div style={{ position: "relative", width: 6, height: 6 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "#10B981",
          boxShadow: `0 0 ${4 + pulse * 6}px #10B981`,
          opacity: 0.85 + pulse * 0.15,
        }} />
      </div>
      <span style={{ fontFamily: F.body, fontSize: 7, color: "#10B981", fontWeight: 700 }}>LIVE</span>
    </div>
  );
}

export function PortalActivo({ frameIn }: { frameIn: number }) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;

  // Camera arrives at KPIs at rel≈28 — cursor and highlight timeline
  const cursorPath = [
    { rel: 10,  x: 420, y: 220 },
    { rel: 34,  x: 260, y: 148 }, // center of KPI1 card
    { rel: 60,  x: 498, y: 148 }, // center of KPI3 (Visitas)
    { rel: 88,  x: 300, y: 380 }, // Quick Actions
    { rel: 115, x: 300, y: 380 },
  ];

  return (
    <EmpresaLayoutMock
      activeId="inicio"
      badges={{ agenda: 3, mensajes: 1 }}
      companyName="Café Las Montañas"
    >
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: F.heading, fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1 }}>
            Bienvenido, Carlos
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <div style={{ fontSize: 10, color: C.textAlt }}>
              Café Las Montañas · Orizaba, Veracruz
            </div>
            <LiveDot rel={rel} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "#10B98112", border: "1px solid #10B98130",
            borderRadius: 999, padding: "3px 9px",
            fontSize: 8, fontWeight: 700, color: "#10B981",
          }}>
            <Zap size={9} color="#10B981" /> Negocio activo
          </div>
          <RefreshCw size={13} style={{ color: C.textAlt }} />
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
        {KPIS.map((k, i) => {
          const cardRel = 6 + i * 6;
          const cardOp  = fadeIn(rel, cardRel, 10);
          const cardY   = interpolate(rel, [cardRel, cardRel + 18], [14, 0], { easing: easeOut, ...clamp });
          const counterStart = 34 + i * 8;
          const barStart     = 36 + i * 8;

          return (
            <div key={k.id} style={{
              background: C.bg,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              padding: "12px 12px 10px",
              boxShadow: `0 4px 18px rgba(15,23,42,0.06), 0 0 0 0px ${k.color}`,
              opacity: cardOp,
              transform: `translateY(${cardY}px)`,
            }}>
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 700, color: C.textAlt, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                    {k.live ? <LiveDot rel={rel} /> : "KPI"}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: C.text, marginTop: 2, lineHeight: 1.3 }}>{k.label}</div>
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: 9,
                  background: k.color + "18", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 2px 8px ${k.color}20`,
                }}>
                  <k.Icon size={13} style={{ color: k.color }} />
                </div>
              </div>

              {/* Value counter */}
              <div style={{ fontFamily: F.heading, fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                <CounterAnimation value={k.value} frameIn={frameIn + counterStart} durationFrames={52} />
              </div>

              {/* Helper */}
              <div style={{ fontSize: 8, color: C.textAlt, marginTop: 4, lineHeight: 1.4 }}>{k.helper}</div>

              {/* Sparkline */}
              <div style={{ marginTop: 6 }}>
                <Sparkline data={k.sparkline} color={k.color} rel={rel} startRel={barStart} />
              </div>

              {/* Animated progress bar */}
              <AnimatedBar progress={k.progress} color={k.color} rel={rel} startRel={barStart} />
            </div>
          );
        })}
      </div>

      {/* Motion overlays */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <InScreenHighlight
          frameIn={frameIn} relIn={28} relOut={95}
          x={232} y={90} width={490} height={108}
          color="#984EFD" radius={16}
          label="IA recomendó tus servicios 247×"
          labelSide="top"
        />
        <InScreenHighlight
          frameIn={frameIn} relIn={34} relOut={58}
          x={232} y={90} width={114} height={108}
          color="#9CCC44" radius={14}
          label="247 rec. ML"
          labelSide="bottom"
        />
        <InScreenHighlight
          frameIn={frameIn} relIn={60} relOut={84}
          x={480} y={90} width={114} height={108}
          color={C.cyan} radius={14}
          label="512 visitas"
          labelSide="bottom"
        />
        <InScreenHighlight
          frameIn={frameIn} relIn={88} relOut={140}
          x={232} y={348} width={238} height={72}
          color="#FF7D1F" radius={10}
          label="Acciones rápidas"
          labelSide="bottom"
        />
        <InScreenCursor
          frameIn={frameIn}
          keyframes={cursorPath}
          clicks={[{ rel: 37 }, { rel: 62 }, { rel: 90 }]}
          scale={0.85}
        />
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Top services */}
        <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, padding: "12px", opacity: fadeIn(rel, 28, 12) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Servicios · Mejor Engagement</div>
            <div style={{ fontSize: 8, color: C.textAlt }}>Últimos 30 días</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TOP_SERVICES.map((s, i) => {
              const barW = interpolate(rel, [38 + i * 8, 70 + i * 8], [0, (s.rating / 5) * 100], { easing: easeOut, ...clamp });
              return (
                <div key={s.name} style={{
                  background: C.bgAlt, borderRadius: 10, border: `1px solid ${C.border}`,
                  padding: "7px 9px",
                  opacity: fadeIn(rel, 32 + i * 6, 10),
                  transform: `translateX(${interpolate(rel, [32 + i * 6, 48 + i * 6], [-8, 0], { easing: easeOut, ...clamp })}px)`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7, background: C.purple,
                      color: "#fff", fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ fontSize: 8, color: C.textAlt, marginTop: 1 }}>{s.visits} vis · {s.favorites} fav · {s.recomendaciones} rec.</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CCC44" }}>{s.rating.toFixed(1)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 5, height: 3, borderRadius: 999, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${barW}%`, background: "linear-gradient(90deg, #9CCC4488, #9CCC44)", borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions + quality score */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, padding: "12px", opacity: fadeIn(rel, 36, 12) }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 8 }}>Acciones rápidas</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
              {QUICK_ACTIONS.map(({ label, color }, i) => (
                <div key={label} style={{
                  background: color + "0F", border: `1px solid ${color}28`,
                  borderRadius: 9, padding: "9px 6px", textAlign: "center",
                  opacity: fadeIn(rel, 44 + i * 5, 10),
                  transform: `scale(${interpolate(rel, [44 + i * 5, 56 + i * 5], [0.88, 1], { easing: easeOut, ...clamp })})`,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color, lineHeight: 1.3 }}>{label}</div>
                  <ArrowRight size={9} style={{ color, marginTop: 3 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Quality score */}
          <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.border}`, padding: "12px", opacity: fadeIn(rel, 42, 12) }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Calidad de Perfil</div>
              <div style={{ background: "#FF7D1F14", color: "#FF7D1F", fontSize: 7, fontWeight: 700, borderRadius: 999, padding: "2px 7px" }}>
                EVALUACIÓN
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <div style={{ fontFamily: F.heading, fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                <CounterAnimation value={7} frameIn={frameIn + 42} durationFrames={40} />
                <span style={{ fontSize: 14, color: C.textAlt }}>/10</span>
              </div>
              <div style={{ fontSize: 8, color: "#FF7D1F", fontWeight: 700, marginBottom: 3 }}>
                ↑ 2 puntos este mes
              </div>
            </div>
            <div style={{ marginTop: 8, height: 5, borderRadius: 999, background: C.bgAlt, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${interpolate(rel, [48, 82], [0, 70], { easing: easeOut, ...clamp })}%`,
                background: "linear-gradient(90deg, #FF7D1F88, #FF7D1F)",
                borderRadius: 999,
              }} />
            </div>
          </div>
        </div>
      </div>
    </EmpresaLayoutMock>
  );
}
