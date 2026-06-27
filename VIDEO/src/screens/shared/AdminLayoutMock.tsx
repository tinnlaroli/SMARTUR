import {
  Home, Users, Building2, Wrench, Map, MapPin, ShieldCheck,
  ClipboardCheck, MessageSquare, Route, Mail, FileText,
  BarChart3, BrainCircuit, Bell, Settings, LogOut, HelpCircle,
  MessageSquareDiff, Award, UserCircle,
} from "lucide-react";
import { Img, staticFile } from "remotion";
import { C, F } from "../tokens";

const GROUPS = [
  {
    label: "General",
    items: [
      { id: "home",           label: "Inicio",                  Icon: Home },
    ],
  },
  {
    label: "Gestión",
    items: [
      { id: "users",          label: "Usuarios",                Icon: Users },
      { id: "companies",      label: "Prestadores",             Icon: Building2 },
      { id: "poi",            label: "Puntos de Interés",       Icon: MapPin },
      { id: "servicios",      label: "Actividades",             Icon: Wrench },
      { id: "ubicaciones",    label: "Ubicaciones",             Icon: Map },
    ],
  },
  {
    label: "Monitoreo y Control",
    items: [
      { id: "company-verification", label: "Cédulas de Empresa",      Icon: ShieldCheck, badge: 2 },
      { id: "aprobacion",           label: "Aprobación de Contenido", Icon: ClipboardCheck, badge: 3 },
      { id: "aclaraciones",         label: "Aclaraciones",            Icon: MessageSquareDiff },
    ],
  },
  {
    label: "Móvil y Comunidad",
    items: [
      { id: "community",      label: "Comunidad",               Icon: MessageSquare },
      { id: "itinerarios",    label: "Itinerarios",             Icon: Route },
      { id: "contactos",      label: "Correos de Contacto",     Icon: Mail, badge: 1 },
      { id: "perfiles",       label: "Perfiles de Viajero",     Icon: UserCircle },
    ],
  },
  {
    label: "Análisis",
    items: [
      { id: "certificaciones",label: "Modelos Operativos",      Icon: Award },
      { id: "instrumentos",   label: "Métricas",                Icon: FileText },
      { id: "estadisticas",   label: "Estadísticas",            Icon: BarChart3 },
      { id: "modelo",         label: "Modelo Predictivo",       Icon: BrainCircuit },
    ],
  },
];

const SIDEBAR_W = 220;
const HEADER_H  = 52;

const itemStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderRadius: 12,
  padding: "6px 10px",
  margin: "1px 6px",
  background: active ? `${C.purple}12` : "transparent",
  color: active ? C.purple : C.textAlt,
  fontFamily: F.body,
  fontWeight: active ? 600 : 500,
  fontSize: 11,
  cursor: "pointer",
  position: "relative",
});

export function AdminLayoutMock({
  activeId,
  children,
}: {
  activeId: string;
  children: React.ReactNode;
}) {
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
          padding: "0 14px",
          flexShrink: 0,
        }}>
          <Img src={staticFile("logo.png")} style={{ height: 22, width: "auto" }} />
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: "hidden", padding: "6px 0" }}>
          {GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: C.textAlt,
                textTransform: "uppercase", letterSpacing: "0.1em",
                padding: "4px 16px 2px",
              }}>
                {group.label}
              </div>
              {group.items.map(({ id, label, Icon, badge }) => {
                const active = id === activeId;
                const badgeCount = badge ?? 0;
                return (
                  <div key={id} style={itemStyle(active)}>
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 11 }}>
                      {label}
                    </span>
                    {badgeCount > 0 && (
                      <span style={{
                        background: "#EF4444", color: "#fff",
                        borderRadius: 999, padding: "1px 5px",
                        fontSize: 8, fontWeight: 700, lineHeight: 1,
                        minWidth: 14, textAlign: "center",
                      }}>
                        {badgeCount}
                      </span>
                    )}
                    {active && badgeCount === 0 && (
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.purple, flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "6px", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: C.bgAlt, borderRadius: 10,
            border: `1px solid ${C.border}`, padding: "5px 7px",
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: C.purple, color: "#fff",
              fontSize: 8, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              TL
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: C.text }}>tinnlaroli</div>
              <div style={{ fontSize: 8, color: C.textAlt }}>Administrador</div>
            </div>
            <LogOut size={11} style={{ color: C.pink, flexShrink: 0 }} />
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
          padding: "0 18px",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, color: C.textAlt }}>
            Dashboard <span style={{ color: "rgba(0,0,0,0.2)", margin: "0 4px" }}>›</span>
            <span style={{ fontWeight: 600, color: C.text }}>
              {GROUPS.flatMap(g => g.items).find(i => i.id === activeId)?.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Bell size={15} style={{ color: C.purple }} />
            <div style={{ width: 1, height: 18, background: C.border }} />
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              border: `1px solid ${C.border}`, borderRadius: 8, padding: "3px 7px",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5,
                background: C.purple, color: "#fff",
                fontSize: 7, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                TL
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: C.text, lineHeight: 1 }}>tinnlaroli</div>
                <div style={{ fontSize: 7, color: C.textAlt }}>Admin</div>
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflow: "hidden", background: C.bgAlt }}>
          {children}
        </main>
      </div>
    </div>
  );
}
