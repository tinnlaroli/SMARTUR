import {
  Wrench, MapPin, Leaf, Check, X, ShieldCheck,
  ClipboardList, Building2, DollarSign, Calendar, RefreshCw, Search,
} from "lucide-react";
import { useCurrentFrame } from "remotion";
import { AdminLayoutMock } from "./shared/AdminLayoutMock";
import { C, F, pill } from "./tokens";
import { fadeIn } from "../helpers/animations";
import { InScreenCursor } from "../components/motion/InScreenCursor";
import { InScreenHighlight } from "../components/motion/InScreenHighlight";

const TABS = [
  { Icon: Wrench,  label: "Actividades",       badge: 3, active: true  },
  { Icon: MapPin,  label: "Puntos de Interés", badge: 2, active: false },
  { Icon: Leaf,    label: "Bienestar",          badge: 1, active: false },
];

const SERVICES = [
  { name: "Tour Niebla y Café",    company: "Café Las Montañas",  location: "Orizaba",   status: "pending",  score: null,  price: "$250–$400",  sent: "18 jun 2026" },
  { name: "Sendero Bosque Nublado",company: "Aventuras Veracruz", location: "Orizaba",   status: "pending",  score: 8.5,   price: "$120–$200",  sent: "17 jun 2026" },
  { name: "Cata de Café Especial", company: "Café Las Montañas",  location: "Córdoba",   status: "active",   score: 9.2,   price: "$180",        sent: "10 jun 2026" },
  { name: "Rafting Río Pescados",  company: "Xalapa Extremo",     location: "Xalapa",    status: "rejected", score: 4.1,   price: "$350",        sent: "05 jun 2026" },
];

const STATUS_MAP: Record<string, [string, string, string]> = {
  pending:  ["En revisión", "#FEF3C7", "#D97706"],
  active:   ["Activo",      "#D1FAE5", "#059669"],
  rejected: ["Rechazado",   "#FEE2E2", "#DC2626"],
};

export function AdminAprobacion({ frameIn }: { frameIn: number }) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;

  // Motion: cursor moves to "Aprobar" button at rel≈60, clicks at rel≈75
  // AdminLayoutMock inner content starts after 220px sidebar + 64px header
  // Approx screen coords (within the 720×490 BrowserMockup content area):
  //   sidebar=220, header=64, content area x=220–720, y=64–490
  //   "Aprobar" button (row 1, col 6): approx x=635, y=150
  const cursorPath = [
    { rel: 20, x: 400, y: 200 },
    { rel: 45, x: 540, y: 155 },
    { rel: 68, x: 625, y: 152 },
  ];

  // HighlightRing around the "Aprobar" button: x=610, y=143, w=58, h=22
  // HighlightRing around the first pending row: x=228, y=135, w=490, h=34

  return (
    <AdminLayoutMock activeId="aprobacion">
      <div style={{ padding: "0", height: "100%", boxSizing: "border-box", overflow: "hidden", position: "relative" }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "16px 20px 0" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#16a34a14", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardList size={18} style={{ color: "#16a34a" }} />
          </div>
          <div>
            <div style={{ fontFamily: F.heading, fontSize: 16, fontWeight: 700, color: C.text }}>Filtro de Aprobación</div>
            <div style={{ fontSize: 10, color: C.textAlt }}>Revisa actividades, puntos de interés y servicios de bienestar pendientes</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "0 20px 12px" }}>
          {TABS.map(({ Icon, label, badge, active }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: active ? "#16a34a" : C.bgAlt,
              color: active ? "#fff" : C.textAlt,
              border: active ? "none" : `1px solid ${C.border}`,
              borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 600,
              cursor: "pointer",
            }}>
              <Icon size={13} />
              {label}
              <span style={{
                background: active ? "rgba(255,255,255,0.3)" : "#22c55e",
                color: active ? "#fff" : "#fff",
                borderRadius: 999, padding: "0 6px", fontSize: 9, fontWeight: 700, lineHeight: "16px",
              }}>
                {badge}
              </span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textAlt }}>
              <Search size={12} /> Buscar servicio o empresa...
            </div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 8px", display: "flex", alignItems: "center" }}>
              <RefreshCw size={13} style={{ color: C.textAlt }} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: C.bg, margin: "0 20px", borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: "2.5fr 2fr 1.2fr 1fr 1fr 1.1fr",
            padding: "8px 16px", background: C.bgAlt, borderBottom: `1px solid ${C.border}`,
          }}>
            {[
              [Wrench,      "Servicio"],
              [Building2,   "Empresa"],
              [ShieldCheck, "Estado"],
              [ClipboardList,"Evaluación"],
              [DollarSign,  "Precio"],
              [Calendar,    "Enviado"],
            ].map(([IconComp, label]) => {
              const Ic = IconComp as React.FC<{ size: number; style: React.CSSProperties }>;
              return (
                <div key={String(label)} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Ic size={10} style={{ color: C.textAlt }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.textAlt, textTransform: "uppercase", letterSpacing: "0.07em" }}>{String(label)}</span>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {SERVICES.map((s, i) => {
            const [statusLabel, statusBg, statusClr] = STATUS_MAP[s.status];
            const hasScore = s.score !== null;
            const scorePassed = hasScore && (s.score ?? 0) >= 7;
            return (
              <div key={s.name} style={{
                display: "grid", gridTemplateColumns: "2.5fr 2fr 1.2fr 1fr 1fr 1.1fr",
                padding: "10px 16px", borderBottom: i < SERVICES.length - 1 ? `1px solid ${C.border}` : "none",
                alignItems: "center",
                opacity: fadeIn(rel, 16 + i * 10, 10),
              }}>
                {/* Servicio */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ background: "#BAE6FD40", color: "#0369a1", borderRadius: 999, padding: "1px 6px", fontSize: 8, fontWeight: 500, display: "inline-block", marginTop: 2 }}>Actividad</div>
                </div>
                {/* Empresa */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.text }}>{s.company}</div>
                  <div style={{ fontSize: 9, color: C.textAlt, opacity: 0.7 }}>{s.location}</div>
                </div>
                {/* Estado */}
                <div><span style={{ ...pill(statusBg, statusClr), fontSize: 9 }}>{statusLabel}</span></div>
                {/* Evaluación */}
                <div>
                  {hasScore ? (
                    <span style={{
                      background: scorePassed ? "#D1FAE5" : "#FEF3C7",
                      color: scorePassed ? "#059669" : "#D97706",
                      borderRadius: 999, padding: "2px 7px", fontSize: 9, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 3, width: "fit-content",
                    }}>
                      {scorePassed ? <Check size={9} /> : null} {(s.score ?? 0).toFixed(1)}/10
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, color: C.textAlt, opacity: 0.5 }}>Sin eval.</span>
                  )}
                </div>
                {/* Precio */}
                <div style={{ fontSize: 10, color: C.text }}>MXN {s.price}</div>
                {/* Enviado */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 10, color: C.textAlt }}>{s.sent}</div>
                  {s.status === "pending" && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <div style={{ background: "#10B98118", color: "#059669", border: "1px solid #10B981", borderRadius: 7, padding: "3px 7px", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                        <Check size={9} /> Aprobar
                      </div>
                      <div style={{ background: "#EF444418", color: "#DC2626", border: "1px solid #EF4444", borderRadius: 7, padding: "3px 6px", display: "flex", alignItems: "center" }}>
                        <X size={9} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Motion graphics overlay */}
        <InScreenHighlight
          frameIn={frameIn} relIn={55} relOut={200}
          x={226} y={134} width={494} height={36}
          color="#F59E0B" radius={8}
          label="Pendiente de validación"
          labelSide="top"
        />
        <InScreenHighlight
          frameIn={frameIn} relIn={72} relOut={200}
          x={610} y={142} width={56} height={22}
          color="#10B981" radius={6}
          label="Aprobar"
          labelSide="bottom"
        />
        <InScreenCursor
          frameIn={frameIn}
          keyframes={cursorPath}
          clicks={[{ rel: 75 }]}
          scale={0.85}
        />
      </div>
    </AdminLayoutMock>
  );
}
