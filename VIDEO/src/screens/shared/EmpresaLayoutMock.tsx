import {
  Home, Wrench, Calendar, BarChart3, MessageSquare,
  UserCircle, Settings, ShieldCheck, HelpCircle, LogOut,
  MessageSquareDiff, ChevronRight,
} from "lucide-react";
import { Img, staticFile } from "remotion";
import { C, F } from "../tokens";

const GROUPS = [
  {
    label: "Principal",
    items: [
      { id: "inicio",       label: "Inicio",             Icon: Home },
    ],
  },
  {
    label: "Gestión Comercial",
    items: [
      { id: "servicios",    label: "Mis Servicios",      Icon: Wrench },
      { id: "agenda",       label: "Agenda",             Icon: Calendar },
      { id: "mensajes",     label: "Mensajes",           Icon: MessageSquare },
      { id: "faqs",         label: "Preguntas Frecuentes",Icon: HelpCircle },
    ],
  },
  {
    label: "Analíticas",
    items: [
      { id: "estadisticas", label: "Estadísticas",       Icon: BarChart3 },
    ],
  },
  {
    label: "Estatus",
    items: [
      { id: "kyc",          label: "Oficio WELLTUR",     Icon: ShieldCheck },
      { id: "aclaraciones", label: "Aclaraciones",       Icon: MessageSquareDiff },
    ],
  },
  {
    label: "Mi Cuenta",
    items: [
      { id: "perfil",       label: "Perfil",             Icon: UserCircle },
      { id: "config",       label: "Configuración",      Icon: Settings },
    ],
  },
];

const SIDEBAR_W = 220;
const HEADER_H  = 64;

const itemStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderRadius: 12,
  padding: "7px 10px",
  margin: "1px 6px",
  background: active ? `${C.purple}12` : "transparent",
  color: active ? C.purple : C.textAlt,
  fontFamily: F.body,
  fontWeight: active ? 600 : 500,
  fontSize: 12,
  cursor: "pointer",
  position: "relative",
});

interface Props {
  activeId: string;
  badges?: Record<string, number>;
  children: React.ReactNode;
  companyName?: string;
}

export function EmpresaLayoutMock({
  activeId,
  badges = {},
  children,
  companyName = "Café Las Montañas",
}: Props) {
  const currentLabel = GROUPS.flatMap(g => g.items).find(i => i.id === activeId)?.label ?? "Inicio";

  return (
    <div style={{ display: "flex", height: "100%", background: C.bgAlt, overflow: "hidden", position: "relative" }}>
      {/* Sidebar */}
      <aside style={{
        width: SIDEBAR_W,
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          height: HEADER_H,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          flexShrink: 0,
        }}>
          <Img src={staticFile("logo.png")} style={{ height: 28, width: "auto" }} />
        </div>

        {/* Company name */}
        <div style={{ padding: "10px 16px 6px", flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.textAlt, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 1 }}>
            Portal Empresa
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {companyName}
          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: "hidden", padding: "4px 0" }}>
          {GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 2 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: C.textAlt,
                textTransform: "uppercase", letterSpacing: "0.1em",
                padding: "5px 16px 2px",
              }}>
                {group.label}
              </div>
              {group.items.map(({ id, label, Icon }) => {
                const active = id === activeId;
                const badge = badges[id] ?? 0;
                return (
                  <div key={id} style={itemStyle(active)}>
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                    {badge > 0 && (
                      <span style={{
                        background: "#EF4444", color: "#fff",
                        borderRadius: 999, padding: "1px 5px",
                        fontSize: 8, fontWeight: 700, lineHeight: 1,
                        minWidth: 14, textAlign: "center",
                      }}>
                        {Math.min(badge, 99)}
                      </span>
                    )}
                    {active && badge === 0 && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.bgAlt, borderRadius: 12,
            border: `1px solid ${C.border}`, padding: "6px 8px",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: C.purple, color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              CL
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Carlos López
              </div>
              <div style={{ fontSize: 8, color: C.textAlt }}>Prestador</div>
            </div>
            <LogOut size={12} style={{ color: C.pink, flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header style={{
          height: HEADER_H,
          borderBottom: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          flexShrink: 0,
        }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <span style={{ color: C.textAlt }}>Portal Empresa</span>
            <ChevronRight size={12} style={{ color: C.textAlt }} />
            <span style={{ fontWeight: 600, color: C.text }}>{currentLabel}</span>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HelpCircle size={16} style={{ color: C.purple }} />
            <div style={{ width: 1, height: 20, background: C.border }} />
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              border: `1px solid ${C.border}`, borderRadius: 10, padding: "4px 8px",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: C.purple, color: "#fff",
                fontSize: 8, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                CL
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.text, lineHeight: 1 }}>Carlos López</div>
                <div style={{ fontSize: 8, color: C.textAlt, marginTop: 1 }}>Prestador</div>
              </div>
            </div>
            <LogOut size={14} style={{ color: C.pink }} />
          </div>
        </header>

        <main style={{ flex: 1, overflow: "hidden", background: C.bgAlt, padding: "20px 24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
