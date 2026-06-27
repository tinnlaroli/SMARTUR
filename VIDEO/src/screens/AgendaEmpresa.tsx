import {
  Calendar, Plus, RefreshCw, Clock, Check, X,
  Users, UserCircle2, Leaf, Coffee, Camera,
} from "lucide-react";
import { useCurrentFrame } from "remotion";
import { EmpresaLayoutMock } from "./shared/EmpresaLayoutMock";
import { C, F, pill } from "./tokens";
import { fadeIn } from "../helpers/animations";
import { InScreenCursor } from "../components/motion/InScreenCursor";
import { InScreenHighlight } from "../components/motion/InScreenHighlight";

const bookings = [
  { initials: "AG", name: "Ana García",  service: "Tour Niebla y Café",    date: "Vie 20 jun", time: "10:00", pax: 2, status: "confirmed" },
  { initials: "CM", name: "Carlos M.",   service: "Tour Niebla y Café",    date: "Sáb 21 jun", time: "09:00", pax: 1, status: "pending",   walkin: false },
  { initials: "W",  name: "Walk-in",     service: "Cata de Café Especial", date: "Dom 22 jun", time: "11:00", pax: 3, status: "confirmed",  walkin: true  },
];

const STATUS_COLORS: Record<string, [string, string, string]> = {
  confirmed: ["Confirmada", "#D1FAE5", "#059669"],
  pending:   ["Pendiente",  "#FEF3C7", "#D97706"],
  cancelled: ["Cancelada",  "#FEE2E2", "#DC2626"],
};

function MiniCal() {
  const days: (number | null)[] = [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  const booked = [10, 14, 20, 21, 22];
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>Junio 2026</span>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 14, color: C.textAlt, cursor: "pointer" }}>‹</span>
          <span style={{ fontSize: 14, color: C.textAlt, cursor: "pointer" }}>›</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 7, fontWeight: 700, color: C.textAlt, paddingBottom: 2 }}>{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} style={{
            textAlign: "center", fontSize: 9, padding: "4px 0", borderRadius: 6,
            background: d === 20 ? C.purple : booked.includes(d ?? 0) ? `${C.purple}14` : "transparent",
            color: d === 20 ? "#fff" : booked.includes(d ?? 0) ? C.purple : C.textAlt,
            fontWeight: booked.includes(d ?? 0) ? 700 : 400,
          }}>{d}</div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {[["#F59E0B", "Pendiente"], ["#10B981", "Confirmada"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 8, color: C.textAlt }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgendaEmpresa({ frameIn }: { frameIn: number }) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;

  // EmpresaLayoutMock: sidebar=220, header=64
  // Booking table starts at approx y=140 within the 720×490 space
  // Row 1 (Ana García): y≈155, Row 2 (Carlos M.): y≈185
  // Tourist profile column (last): x≈640
  const cursorPath = [
    { rel: 12, x: 420, y: 220 },
    { rel: 36, x: 480, y: 160 },  // hover row 1
    { rel: 60, x: 420, y: 185 },  // hover row 2
    { rel: 82, x: 640, y: 162 },  // tourist profile chip area
  ];

  return (
    <EmpresaLayoutMock
      activeId="agenda"
      badges={{ agenda: 1, mensajes: 1 }}
      companyName="Café Las Montañas"
    >
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ background: `${C.purple}18`, borderRadius: 10, padding: 6 }}>
              <Calendar size={18} style={{ color: C.purple }} />
            </div>
            <div style={{ fontFamily: F.heading, fontSize: 18, fontWeight: 700, color: C.text }}>Agenda</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ ...pill("#FEF3C7", "#D97706"), display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} /> 1 pendiente(s)
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 5 }}>
            <Plus size={13} /> Visita directa
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 8px", display: "flex", alignItems: "center" }}>
            <RefreshCw size={13} style={{ color: C.textAlt }} />
          </div>
        </div>
      </div>

      {/* 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, height: "calc(100% - 80px)" }}>
        {/* Left: calendar + table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {[["Todas", true], ["Pendientes", false], ["Confirmadas", false], ["Canceladas", false]].map(([l, a]) => (
              <div key={String(l)} style={{
                padding: "5px 12px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                background: a ? C.purple : C.bg, color: a ? "#fff" : C.textAlt,
                border: a ? "none" : `1px solid ${C.border}`,
              }}>{l}</div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: C.bg, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 0.6fr 1fr auto",
              padding: "8px 16px", background: C.bgAlt, borderBottom: `1px solid ${C.border}`,
            }}>
              {["Turista","Servicio","Fecha","Pax","Estado","Acciones"].map((h) => (
                <div key={h} style={{ fontSize: 9, fontWeight: 700, color: C.textAlt, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
              ))}
            </div>
            {bookings.map((b, i) => {
              const [label, bg, clr] = STATUS_COLORS[b.status];
              return (
                <div key={b.name} style={{
                  display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 0.6fr 1fr auto",
                  padding: "10px 16px", borderBottom: i < bookings.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                  background: i === 1 ? `${C.bgAlt}80` : "transparent",
                  opacity: fadeIn(rel, 14 + i * 12, 10),
                }}>
                  {/* Turista */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: (b as any).walkin ? "#F59E0B" : C.purple,
                      color: "#fff", fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {b.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: C.text }}>{b.name}</div>
                      {(b as any).walkin && <div style={{ fontSize: 8, fontWeight: 600, color: "#D97706" }}>Walk-in</div>}
                    </div>
                  </div>
                  {/* Servicio */}
                  <div style={{ fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{b.service}</div>
                  {/* Fecha */}
                  <div>
                    <div style={{ fontSize: 11, color: C.text }}>{b.date}</div>
                    <div style={{ fontSize: 9, color: C.textAlt, display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                      <Clock size={9} /> {b.time}
                    </div>
                  </div>
                  {/* Pax */}
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.text, textAlign: "center" }}>{b.pax}</div>
                  {/* Estado */}
                  <div>
                    <span style={{ ...pill(bg, clr), fontSize: 9 }}>{label}</span>
                  </div>
                  {/* Acciones */}
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {b.status === "pending" ? (
                      <>
                        <div style={{ background: "#10B98118", color: "#059669", border: "1px solid #10B981", borderRadius: 8, padding: "4px 8px", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                          <Check size={10} /> OK
                        </div>
                        <div style={{ background: "#EF444418", color: "#DC2626", border: "1px solid #EF4444", borderRadius: 8, padding: "4px 6px", display: "flex", alignItems: "center" }}>
                          <X size={10} />
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: C.textAlt }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: calendar + tourist profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <MiniCal />

          {/* Tourist profile (selected booking) */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px", opacity: fadeIn(rel, 45, 12) }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, marginBottom: 8 }}>Perfil del turista</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.purple, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                AG
              </div>
              <div>
                <div style={{ fontFamily: F.heading, fontSize: 12, fontWeight: 700, color: C.text }}>Ana García</div>
                <div style={{ fontSize: 9, color: C.textAlt }}>CDMX · Viajera frecuente</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
              {[
                { Icon: Leaf,   label: "Naturaleza" },
                { Icon: Coffee, label: "Café" },
                { Icon: Camera, label: "Fotografía" },
              ].map(({ Icon, label }) => (
                <span key={label} style={{ background: `${C.purple}12`, color: C.purple, fontSize: 8, fontWeight: 600, borderRadius: 999, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon size={8} /> {label}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 8, color: C.textAlt, lineHeight: 1.5 }}>
              Prefiere experiencias auténticas y tranquilas. Sin gluten.
            </div>
          </div>
        </div>
      </div>

      {/* Motion graphics overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Highlight first booking row */}
        <InScreenHighlight
          frameIn={frameIn} relIn={30} relOut={80}
          x={226} y={148} width={494} height={34}
          color={C.cyan} radius={8}
          label="Ana García — confirmada"
          labelSide="top"
        />
        {/* Highlight tourist profile card */}
        <InScreenHighlight
          frameIn={frameIn} relIn={78} relOut={140}
          x={226} y={195} width={494} height={80}
          color="#984EFD" radius={12}
          label="Perfil del turista — personaliza la visita"
          labelSide="bottom"
        />
        <InScreenCursor
          frameIn={frameIn}
          keyframes={cursorPath}
          clicks={[{ rel: 38 }, { rel: 62 }]}
          scale={0.85}
        />
      </div>
    </EmpresaLayoutMock>
  );
}
