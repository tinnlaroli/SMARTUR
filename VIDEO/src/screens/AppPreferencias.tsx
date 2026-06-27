import { Leaf, UtensilsCrossed, Mountain, Landmark, Coffee, Camera, Heart, Waves, Check, BrainCircuit } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./tokens";
import { fadeIn } from "../helpers/animations";

const CATS = [
  { Icon: Leaf,            label: "Naturaleza",     active: true,  color: "#16a34a", bg: "#dcfce7" },
  { Icon: UtensilsCrossed, label: "Gastronomía",    active: true,  color: "#92400e", bg: "#fef3c7" },
  { Icon: Mountain,        label: "Aventura",        active: false, color: "#6d28d9", bg: "#ede9fe" },
  { Icon: Landmark,        label: "Cultura",         active: false, color: "#b91c1c", bg: "#fee2e2" },
  { Icon: Coffee,          label: "Café de Altura",  active: true,  color: "#78350f", bg: "#fef3c7" },
  { Icon: Camera,          label: "Fotografía",      active: false, color: "#0369a1", bg: "#e0f2fe" },
  { Icon: Heart,           label: "Bienestar",       active: true,  color: "#be185d", bg: "#fce7f3" },
  { Icon: Waves,           label: "Ecoturismo",      active: false, color: "#0e7490", bg: "#cffafe" },
];

export function AppPreferencias({ frameIn }: { frameIn: number }) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;

  const activeCount = CATS.filter(c => c.active).length;

  return (
    <div style={{
      background: "#F7F2FF",
      height: "100%",
      fontFamily: F.body,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Status bar placeholder */}
      <div style={{ height: 6, background: "transparent" }} />

      {/* Progress bar */}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: i <= 2 ? C.purple : "rgba(152,78,253,0.18)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: C.purple, fontWeight: 700 }}>Paso 2 de 4</span>
          <span style={{ fontSize: 10, color: C.textAlt }}>{activeCount} seleccionados</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: "16px 20px 14px", opacity: fadeIn(rel, 6, 12) }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: `${C.purple}12`,
          borderRadius: 999,
          padding: "4px 12px",
          marginBottom: 10,
        }}>
          <BrainCircuit size={12} color={C.purple} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.purple }}>La IA personalizará tu experiencia</span>
        </div>
        <div style={{ fontFamily: F.heading, fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4, lineHeight: 1.2 }}>
          ¿Qué tipo de viajero eres?
        </div>
        <div style={{ fontSize: 12, color: C.textAlt, lineHeight: 1.4 }}>
          Selecciona todo lo que te interese para recibir recomendaciones exactas.
        </div>
      </div>

      {/* Category chips */}
      <div style={{ flex: 1, padding: "0 20px", display: "flex", flexWrap: "wrap", gap: 10, alignContent: "flex-start" }}>
        {CATS.map(({ Icon, label, active, color, bg }, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: active ? "9px 14px" : "8px 13px",
              borderRadius: 999,
              background: active ? color : "#fff",
              border: `2px solid ${active ? color : C.border}`,
              color: active ? "#fff" : C.textAlt,
              fontSize: 12,
              fontWeight: 700,
              opacity: fadeIn(rel, 16 + i * 5, 10),
              boxShadow: active ? `0 4px 16px ${color}35` : "0 2px 6px rgba(0,0,0,0.05)",
              transform: active ? "scale(1.03)" : "scale(1)",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: active ? "rgba(255,255,255,0.2)" : bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={12} color={active ? "#fff" : color} />
            </div>
            {label}
            {active && (
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Check size={10} color="#fff" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "16px 20px 20px", opacity: fadeIn(rel, 62, 14) }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.purple} 0%, #6d28d9 100%)`,
          color: "#fff",
          borderRadius: 16,
          padding: "15px",
          textAlign: "center",
          fontSize: 15,
          fontWeight: 800,
          fontFamily: F.heading,
          boxShadow: `0 10px 30px ${C.purple}45`,
          letterSpacing: "0.01em",
        }}>
          Ver mis recomendaciones →
        </div>
        <div style={{ textAlign: "center", marginTop: 9, fontSize: 10, color: C.textAlt }}>
          Puedes cambiar esto después en tu perfil
        </div>
      </div>
    </div>
  );
}
