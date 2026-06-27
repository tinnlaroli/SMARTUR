/**
 * BrowserMockup — ventana de navegador para pasos de plataforma web.
 * En formato 9:16 (1080px de ancho) se usa a 980px para llenar el canvas.
 */
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { SPRING_SMOOTH } from "../helpers/animations";

interface Props {
  children: React.ReactNode;
  frameIn: number;
  url?: string;
  width?: number;
  zoomAt?: number;
  zoomBack?: number;
  zoomScale?: number;
  zoomFocusX?: number;
  zoomFocusY?: number;
}

export function BrowserMockup({
  children,
  frameIn,
  url = "smartur.online",
  width = 980,
  zoomAt,
  zoomBack,
  zoomScale = 1.3,
  zoomFocusX = 0.5,
  zoomFocusY = 0.35,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const CHROME_H = 44;
  const height   = Math.round(width * 0.63);
  const ease     = Easing.bezier(0.4, 0, 0.2, 1);

  const s = spring({ frame: frame - frameIn, fps, config: SPRING_SMOOTH });
  const scale   = 0.90 + 0.10 * s;
  const opacity = Math.min(1, s * 2);

  // Ken Burns content zoom
  const zoomIn = zoomAt != null
    ? interpolate(frame, [zoomAt, zoomAt + 30], [1, zoomScale], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
      })
    : 1;
  const zoomOut = zoomBack != null
    ? interpolate(frame, [zoomBack, zoomBack + 22], [zoomIn, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
      })
    : zoomIn;
  const contentZoom = zoomBack != null && frame >= zoomBack ? zoomOut : zoomIn;

  const contentW = width;
  const contentH = height - CHROME_H;
  const tx = (0.5 - zoomFocusX) * contentW * (contentZoom - 1) / contentZoom;
  const ty = (0.5 - zoomFocusY) * contentH * (contentZoom - 1) / contentZoom;

  return (
    <div
      style={{
        width,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: [
          "0 32px 80px rgba(152,78,253,0.16)",
          "0 8px 24px rgba(0,0,0,0.10)",
          "inset 0 1px 0 rgba(255,255,255,0.9)",
        ].join(", "),
        transform: `scale(${scale})`,
        opacity,
        transformOrigin: "center center",
        border: "1px solid rgba(232,227,255,0.8)",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          height: CHROME_H,
          background: "#F0EEFF",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1.5px solid #E8E3FF",
          flexShrink: 0,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
          {["#EF4444", "#F59E0B", "#10B981"].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
          ))}
        </div>
        {/* URL bar */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: 8,
            padding: "5px 14px",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            color: "#50505A",
            border: "1px solid rgba(0,0,0,0.06)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#9CA3AF" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", marginRight: 4 }}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>{url}
        </div>
        {/* Tab dots */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#C4B5FD" }} />
          ))}
        </div>
      </div>

      {/* Page content */}
      <div
        style={{
          height: contentH,
          overflow: "hidden",
          background: "#F7F5FF",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: contentZoom !== 1
              ? `scale(${contentZoom}) translate(${tx}px, ${ty}px)`
              : undefined,
            transformOrigin: "center center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
