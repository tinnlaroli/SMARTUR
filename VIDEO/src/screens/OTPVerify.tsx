import { Mail, Clock } from "lucide-react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { C, F } from "./tokens";
import { fadeIn } from "../helpers/animations";

export function OTPVerify({ frameIn }: { frameIn: number }) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;
  const digits = ["3", "8", "4", "1", "9", "2"];

  return (
    <div style={{ background: C.bg, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      {/* Logo */}
      <Img src={staticFile("logo.png")} style={{ height: 26, width: "auto", marginBottom: 28 }} />

      <div style={{ width: "100%", maxWidth: 380, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
        {/* Icon */}
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${C.purple}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Mail size={26} style={{ color: C.purple }} />
        </div>

        <div style={{ fontFamily: F.heading, fontSize: 18, fontWeight: 700, color: C.text, textAlign: "center", marginBottom: 8 }}>
          Verifica tu correo
        </div>
        <div style={{ fontSize: 12, color: C.textAlt, textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
          Ingresa el código de 6 dígitos que enviamos a<br />
          <span style={{ color: C.text, fontWeight: 600 }}>info@cafelasmontanas.mx</span>
        </div>

        {/* OTP boxes */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {digits.map((d, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 52,
                border: `2px solid ${i < 4 ? C.purple : C.border}`,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.heading,
                fontWeight: 700,
                fontSize: 22,
                color: C.purple,
                background: i < 4 ? `${C.purple}08` : C.bgAlt,
                opacity: fadeIn(rel, 10 + i * 10, 8),
              }}
            >
              {i < 4 ? d : ""}
            </div>
          ))}
        </div>

        {/* Timer */}
        <div style={{ textAlign: "center", fontSize: 11, color: C.textAlt, marginBottom: 20 }}>
          El código expira en <span style={{ color: C.purple, fontWeight: 600 }}>4:32</span>
        </div>

        <div style={{ background: C.purple, color: "#fff", borderRadius: 12, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, opacity: fadeIn(rel, 70, 12) }}>
          Verificar identidad
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.textAlt }}>
          ¿No recibiste el código? <span style={{ color: C.purple, fontWeight: 600 }}>Reenviar</span>
        </div>
      </div>

      {/* Blocked notice */}
      <div style={{
        marginTop: 20,
        background: "#FEF3C7",
        border: "1.5px solid #F59E0B",
        borderRadius: 12,
        padding: "10px 16px",
        display: "flex",
        gap: 8,
        alignItems: "center",
        maxWidth: 380,
        opacity: fadeIn(rel, 80, 12),
      }}>
        <Clock size={16} style={{ color: "#92400E", flexShrink: 0 }} />
        <div style={{ fontSize: 11, color: "#92400E" }}>
          Tu portal estará disponible una vez que el administrador valide tu empresa.
        </div>
      </div>
    </div>
  );
}
