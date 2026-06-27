import { Target, BarChart3, Calendar, Award } from "lucide-react";
import { Img, staticFile } from "remotion";
import { C, F } from "./tokens";

const benefits = [
  { Icon: Target,   title: "Clientes filtrados por IA",  desc: "Turistas que ya quieren tu servicio" },
  { Icon: BarChart3,title: "Reportes de demanda",         desc: "Qué buscan los viajeros en tu zona" },
  { Icon: Calendar, title: "Agenda integrada",            desc: "Gestiona reservas y visitas desde el portal" },
];

export function LandingEmpresa() {
  return (
    <div style={{ background: C.bg, height: "100%", fontFamily: F.body, overflow: "hidden" }}>
      {/* Navbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: `1px solid ${C.border}` }}>
        <Img src={staticFile("logo.png")} style={{ height: 22, width: "auto" }} />
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.textAlt }}>
          <span>Inicio</span><span>Empresas</span><span>Contacto</span>
        </div>
        <div style={{ background: C.purple, color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 700 }}>
          Registra tu negocio
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "26px 24px 0", background: "linear-gradient(135deg, #F7F2FF 0%, #EEF9FF 100%)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${C.purple}15`, borderRadius: 999, padding: "4px 12px", marginBottom: 14 }}>
          <Award size={12} style={{ color: C.purple }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: C.purple }}>Galardón Turístico Mi Veracruz 2024</span>
        </div>
        <div style={{ fontFamily: F.heading, fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2, marginBottom: 10, maxWidth: 340 }}>
          Impulsa tu negocio con <span style={{ color: C.purple }}>inteligencia artificial</span>
        </div>
        <div style={{ fontSize: 11, color: C.textAlt, marginBottom: 16, lineHeight: 1.5, maxWidth: 340 }}>
          Conecta tu servicio turístico con viajeros que buscan exactamente lo que ofreces. Sin comisiones. Sin intermediarios.
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ background: C.purple, color: "#fff", borderRadius: 10, padding: "9px 18px", fontSize: 12, fontWeight: 700 }}>
            Registrar empresa
          </div>
          <div style={{ border: `1.5px solid ${C.purple}`, color: C.purple, borderRadius: 10, padding: "9px 18px", fontSize: 12, fontWeight: 600 }}>
            Ver demo
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, paddingBottom: 20 }}>
          {[["100+", "MiPyMEs activas"], ["50k+", "Recomendaciones IA"], ["15+", "Municipios"]].map(([n, l]) => (
            <div key={l} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: F.heading, fontSize: 16, fontWeight: 700, color: C.purple }}>{n}</div>
              <div style={{ fontSize: 9, color: C.textAlt, lineHeight: 1.3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4 }}>¿Qué obtienes?</div>
        {benefits.map(({ Icon, title, desc }) => (
          <div key={title} style={{ display: "flex", gap: 10, alignItems: "center", background: C.bgAlt, borderRadius: 10, padding: "8px 12px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${C.purple}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={15} style={{ color: C.purple }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{title}</div>
              <div style={{ fontSize: 9, color: C.textAlt }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
