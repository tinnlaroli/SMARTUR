import { useCurrentFrame, useVideoConfig, staticFile, Sequence } from "remotion";
import { Audio } from "@remotion/media";
import { Building2, Compass } from "lucide-react";
import { Intro } from "./scenes/Intro";
import { Bridge } from "./scenes/Bridge";
import { SectionTitle } from "./scenes/SectionTitle";
import { B2BFlow } from "./scenes/B2BFlow";
import { B2CFlow } from "./scenes/B2CFlow";
import { Outro } from "./scenes/Outro";
import { BeatCard } from "./components/motion/BeatCard";
import { T } from "./helpers/timing";

export function SmartURPromo() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <div style={{
      width, height,
      background: "#F7F5FF",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @font-face {
          font-family: 'Cal Sans';
          src: url('${staticFile("fonts/CalSans-Regular.ttf")}') format('truetype');
          font-weight: 700;
        }
        @font-face {
          font-family: 'Outfit';
          src: url('${staticFile("fonts/Outfit-VariableFont_wght.ttf")}') format('truetype');
          font-weight: 100 900;
        }
      `}</style>

      {/* ── AUDIO TRACK ─────────────────────────────────────────── */}
      {/* Each audio clip is scoped to its scene via durationInFrames */}

      <Sequence from={T.INTRO_IN} durationInFrames={T.INTRO_OUT - T.INTRO_IN} layout="none">
        <Audio src={staticFile("audio/intro.mp3")} />
      </Sequence>

      <Sequence from={T.BRIDGE_IN} durationInFrames={T.BRIDGE_OUT - T.BRIDGE_IN} layout="none">
        <Audio src={staticFile("audio/puente.mp3")} />
      </Sequence>

      <Sequence from={T.B2B_TITLE_IN} durationInFrames={T.B2B_TITLE_OUT - T.B2B_TITLE_IN} layout="none">
        <Audio src={staticFile("audio/b2b-title.mp3")} />
      </Sequence>

      <Sequence from={T.B2B_1_IN} durationInFrames={T.B2B_1_OUT - T.B2B_1_IN} layout="none">
        <Audio src={staticFile("audio/B2B-1.mp3")} />
      </Sequence>

      <Sequence from={T.B2B_2_IN} durationInFrames={T.B2B_2_OUT - T.B2B_2_IN} layout="none">
        <Audio src={staticFile("audio/B2B-2.mp3")} />
      </Sequence>

      <Sequence from={T.B2B_3_IN} durationInFrames={T.B2B_3_OUT - T.B2B_3_IN} layout="none">
        <Audio src={staticFile("audio/B2B-3.mp3")} />
      </Sequence>

      <Sequence from={T.B2B_4_IN} durationInFrames={T.B2B_4_OUT - T.B2B_4_IN} layout="none">
        <Audio src={staticFile("audio/B2B-4.mp3")} />
      </Sequence>

      <Sequence from={T.B2B_5_IN} durationInFrames={T.B2B_5_OUT - T.B2B_5_IN} layout="none">
        <Audio src={staticFile("audio/B2B-5.mp3")} />
      </Sequence>

      <Sequence from={T.B2B_6_IN} durationInFrames={T.B2B_6_OUT - T.B2B_6_IN} layout="none">
        <Audio src={staticFile("audio/B2B-6.mp3")} />
      </Sequence>

      <Sequence from={T.B2C_TITLE_IN} durationInFrames={T.B2C_TITLE_OUT - T.B2C_TITLE_IN} layout="none">
        <Audio src={staticFile("audio/b2c-title.mp3")} />
      </Sequence>

      <Sequence from={T.B2C_1_IN} durationInFrames={T.B2C_1_OUT - T.B2C_1_IN} layout="none">
        <Audio src={staticFile("audio/B2C-1.mp3")} />
      </Sequence>

      {/* B2C-2y3.mp3 spans visual scenes 2 AND 3 — continuous playback */}
      <Sequence from={T.B2C_2_IN} durationInFrames={T.B2C_3_OUT - T.B2C_2_IN} layout="none">
        <Audio src={staticFile("audio/B2C-2y3.mp3")} />
      </Sequence>

      {/* B2C-5.mp3 spans visual scenes 4 AND 5 — continuous playback */}
      <Sequence from={T.B2C_4_IN} durationInFrames={T.B2C_5_OUT - T.B2C_4_IN} layout="none">
        <Audio src={staticFile("audio/B2C-5.mp3")} />
      </Sequence>

      <Sequence from={T.OUTRO_IN} durationInFrames={T.OUTRO_OUT - T.OUTRO_IN} layout="none">
        <Audio src={staticFile("audio/OUTRO.mp3")} />
      </Sequence>

      {/* ── VISUAL SCENES ──────────────────────────────────────── */}

      {frame < T.INTRO_OUT + 15 && <Intro />}

      {frame >= T.BRIDGE_IN - 10 && frame < T.BRIDGE_OUT + 10 && <Bridge />}

      {frame >= T.B2B_TITLE_IN - 5 && frame < T.B2B_TITLE_OUT + 5 && (
        <SectionTitle
          label="Prestador de Servicio"
          sublabel="Regístrate · Publica · Crece"
          Icon={Building2}
          color="#984EFD"
          frameIn={T.B2B_TITLE_IN}
          frameOut={T.B2B_TITLE_OUT}
        />
      )}

      {frame >= T.B2B_1_IN - 5 && frame < T.B2B_6_OUT + 10 && <B2BFlow />}

      {/* ── Beat cards between B2B steps ──────────────────────────── */}
      {/* "En revisión…" — overlays start of B2B step 3 (OTP → Admin review) */}
      {frame >= T.B2B_2_OUT && frame < T.B2B_2_OUT + 60 && (
        <BeatCard
          frameIn={T.B2B_2_OUT}
          frameOut={T.B2B_2_OUT + 60}
          lines={["En revisión..."]}
          accentColor="#984EFD"
          bgColor="#F7F5FF"
          icon="⏳"
        />
      )}

      {/* "✓ Portal activado" — overlays start of B2B step 4 (approval confirmed) */}
      {frame >= T.B2B_3_OUT && frame < T.B2B_3_OUT + 45 && (
        <BeatCard
          frameIn={T.B2B_3_OUT}
          frameOut={T.B2B_3_OUT + 45}
          lines={["✓ Portal activado"]}
          accentColor="#10B981"
          bgColor="#F0FDF4"
        />
      )}

      {frame >= T.B2C_TITLE_IN - 5 && frame < T.B2C_TITLE_OUT + 5 && (
        <SectionTitle
          label="Turista"
          sublabel="Descubre · Explora · Reserva"
          Icon={Compass}
          color="#4DB9CA"
          frameIn={T.B2C_TITLE_IN}
          frameOut={T.B2C_TITLE_OUT}
        />
      )}

      {frame >= T.B2C_1_IN - 5 && frame < T.B2C_5_OUT + 10 && <B2CFlow />}

      {/* "98% de precisión." — after B2C step 9 (Home AI), overlays start of step 10 */}
      {frame >= T.B2C_3_OUT && frame < T.B2C_3_OUT + 45 && (
        <BeatCard
          frameIn={T.B2C_3_OUT}
          frameOut={T.B2C_3_OUT + 45}
          lines={["98% de precisión."]}
          accentColor="#4DB9CA"
          bgColor="#F0FAFC"
        />
      )}

      {frame >= T.OUTRO_IN - 5 && <Outro />}
    </div>
  );
}
