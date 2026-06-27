import { Waves, Mountain, Coffee, Car, Clock, Check, Share2, FileText, Navigation2, ChevronRight } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./tokens";
import { fadeIn, slideUp } from "../helpers/animations";

const STOPS = [
  {
    Icon: Waves,
    name: "Cascada de Texolo",
    city: "Xico, Veracruz",
    time: "09:00",
    dur: "2h",
    travel: "35 min · Carr. Federal 150",
    gradient: `linear-gradient(155deg, #164e63 0%, #0891b2 40%, #22d3ee 70%, #4ade80 100%)`,
    done: true,
  },
  {
    Icon: Mountain,
    name: "Sendero El Pico",
    city: "Orizaba, Veracruz",
    time: "11:35",
    dur: "3h",
    travel: "18 min · Av. Madero",
    gradient: `linear-gradient(155deg, #1e3a5f 0%, #2563eb 40%, #7dd3fc 75%, #e2e8f0 100%)`,
    done: false,
  },
  {
    Icon: Coffee,
    name: "Café Cencalli",
    city: "Córdoba, Veracruz",
    time: "14:50",
    dur: "1.5h",
    travel: null,
    gradient: `linear-gradient(155deg, #1c0a00 0%, #78350f 40%, #a16207 70%, #fbbf24 100%)`,
    done: false,
  },
];

function MiniMap() {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: 130,
      borderRadius: 20,
      overflow: "hidden",
      background: `linear-gradient(160deg, #e0f2fe 0%, #bae6fd 30%, #d1fae5 60%, #a7f3d0 100%)`,
      border: `1.5px solid ${C.border}`,
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    }}>
      {/* Grid lines simulate map tiles */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
        {[40, 80, 120, 160, 200, 240, 280, 320, 360].map(x => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={130} stroke="#0369a1" strokeWidth={0.5} />
        ))}
        {[30, 60, 90].map(y => (
          <line key={`h${y}`} x1={0} y1={y} x2={400} y2={y} stroke="#0369a1" strokeWidth={0.5} />
        ))}
        {/* Route path */}
        <path
          d="M 60 90 Q 100 70 160 65 Q 240 55 290 45 Q 330 38 360 30"
          fill="none"
          stroke={C.purple}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="8 4"
          opacity={0.9}
        />
        {/* Stop markers */}
        <circle cx={60} cy={90} r={7} fill={C.purple} />
        <circle cx={60} cy={90} r={4} fill="#fff" />
        <circle cx={210} cy={52} r={7} fill={C.purple} />
        <circle cx={210} cy={52} r={4} fill="#fff" />
        <circle cx={360} cy={30} r={7} fill={C.purple} />
        <circle cx={360} cy={30} r={4} fill="#fff" />
      </svg>

      {/* Location labels */}
      <div style={{ position: "absolute", top: 72, left: 35, fontSize: 8, fontWeight: 700, color: "#1e3a5f", background: "rgba(255,255,255,0.85)", borderRadius: 6, padding: "2px 5px" }}>Texolo</div>
      <div style={{ position: "absolute", top: 36, left: 180, fontSize: 8, fontWeight: 700, color: "#1e3a5f", background: "rgba(255,255,255,0.85)", borderRadius: 6, padding: "2px 5px" }}>El Pico</div>
      <div style={{ position: "absolute", top: 12, right: 18, fontSize: 8, fontWeight: 700, color: "#1e3a5f", background: "rgba(255,255,255,0.85)", borderRadius: 6, padding: "2px 5px" }}>Córdoba</div>

      {/* Map overlay chip */}
      <div style={{
        position: "absolute",
        bottom: 10, left: 10,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        borderRadius: 10,
        padding: "5px 10px",
        display: "flex", alignItems: "center", gap: 5,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <Navigation2 size={11} color={C.purple} />
        <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>~62 km · 1h 28min total</span>
      </div>
    </div>
  );
}

export function AppRuta({ frameIn }: { frameIn: number }) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;

  const mapSlideY     = slideUp(frame, frameIn + 8,  45, 20);
  const bannerSlideY  = slideUp(frame, frameIn + 20, 35, 16);
  const stop1SlideY   = slideUp(frame, frameIn + 30, 30, 16);
  const stop2SlideY   = slideUp(frame, frameIn + 40, 30, 16);
  const stop3SlideY   = slideUp(frame, frameIn + 50, 30, 16);
  const stopSlides    = [stop1SlideY, stop2SlideY, stop3SlideY];

  return (
    <div style={{ background: "#F7F2FF", height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.purple} 0%, #6d28d9 100%)`,
        padding: "14px 18px 18px",
        borderRadius: "0 0 24px 24px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <Navigation2 size={16} color="#fff" />
          <div style={{ fontFamily: F.heading, fontSize: 16, fontWeight: 800, color: "#fff" }}>Mi Ruta del Día</div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>Sábado 21 jun · 3 paradas · Veracruz, Mex.</div>
      </div>

      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
        {/* Map visual */}
        <div style={{ opacity: fadeIn(rel, 6, 14), transform: `translateY(${mapSlideY}px)` }}>
          <MiniMap />
        </div>

        {/* Optimization banner */}
        <div style={{
          background: "#ecfdf5",
          border: `1.5px solid #10b981`,
          borderRadius: 14,
          padding: "9px 12px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          opacity: fadeIn(rel, 18, 10),
          transform: `translateY(${bannerSlideY}px)`,
          flexShrink: 0,
        }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#065f46" }}>Ruta optimizada por IA</div>
            <div style={{ fontSize: 9, color: "#047857", marginTop: 1 }}>Reordenamos tus paradas — ahorras 45 min de traslado</div>
          </div>
        </div>

        {/* Stops timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STOPS.map((stop, i) => (
            <div key={stop.name} style={{ opacity: fadeIn(rel, 28 + i * 12, 12), transform: `translateY(${stopSlides[i]}px)` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {/* Timeline line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 34, flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: stop.done ? "#10b981" : C.purple,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 3px 10px ${stop.done ? "#10b98140" : C.purple + "40"}`,
                  }}>
                    {stop.done ? <Check size={15} color="#fff" /> : <stop.Icon size={14} color="#fff" />}
                  </div>
                  {stop.travel && (
                    <div style={{ width: 2, height: 36, background: `${C.purple}22`, margin: "3px 0", borderRadius: 2 }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  {/* Place card */}
                  <div style={{
                    background: "#fff",
                    borderRadius: 14,
                    border: `1.5px solid ${stop.done ? "#10b981" : C.border}`,
                    overflow: "hidden",
                    marginBottom: stop.travel ? 4 : 0,
                    display: "flex",
                  }}>
                    {/* Mini gradient photo */}
                    <div style={{ width: 52, background: stop.gradient, flexShrink: 0 }} />
                    <div style={{ padding: "9px 11px", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: C.text, fontFamily: F.heading }}>{stop.name}</div>
                          <div style={{ fontSize: 9, color: C.textAlt }}>{stop.city}</div>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, flexShrink: 0 }}>{stop.time}</div>
                      </div>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span style={{ background: `${C.purple}12`, color: C.purple, fontSize: 8, fontWeight: 700, borderRadius: 999, padding: "2px 7px", display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={8} /> {stop.dur}
                        </span>
                        {stop.done && (
                          <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 8, fontWeight: 700, borderRadius: 999, padding: "2px 7px", display: "flex", alignItems: "center", gap: 3 }}>
                            <Check size={8} /> Reservado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transit info */}
                  {stop.travel && (
                    <div style={{ fontSize: 9, color: C.textAlt, padding: "2px 4px 6px", display: "flex", alignItems: "center", gap: 5 }}>
                      <Car size={10} color={C.textAlt} /> {stop.travel}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "0 16px 16px", display: "flex", gap: 10, flexShrink: 0, opacity: fadeIn(rel, 58, 12) }}>
        <div style={{
          flex: 1, background: `linear-gradient(135deg, ${C.purple}, #6d28d9)`,
          color: "#fff", borderRadius: 14, padding: "12px",
          textAlign: "center", fontSize: 12, fontWeight: 800, fontFamily: F.heading,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          boxShadow: `0 6px 20px ${C.purple}40`,
        }}>
          <Share2 size={14} /> Compartir
        </div>
        <div style={{
          flex: 1, border: `2px solid ${C.purple}`,
          color: C.purple, borderRadius: 14, padding: "12px",
          textAlign: "center", fontSize: 12, fontWeight: 800, fontFamily: F.heading,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          background: `${C.purple}08`,
        }}>
          <FileText size={14} /> PDF
        </div>
      </div>
    </div>
  );
}
