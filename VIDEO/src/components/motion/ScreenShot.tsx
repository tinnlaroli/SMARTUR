/**
 * ScreenShot — displays a real screenshot inside the BrowserMockup or PhoneMockup.
 * Falls back to children if the screenshot file doesn't exist.
 *
 * For the video render, Remotion will request /screenshots/{id}.png from public/.
 * If the file is absent the <Img> will fail silently (we wrap in a try/error boundary).
 */
import { Img, staticFile } from "remotion";

interface Props {
  id: string;
  /** Render these children as fallback if screenshot not available */
  fallback?: React.ReactNode;
  style?: React.CSSProperties;
  /** 0–1 fraction: which part of the screenshot to show (for cropping tall pages) */
  offsetY?: number;
}

export function ScreenShot({ id, fallback, style, offsetY = 0 }: Props) {
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", ...style }}>
      <ScreenShotInner id={id} offsetY={offsetY} fallback={fallback} />
    </div>
  );
}

class ScreenShotInner extends React.Component<
  { id: string; offsetY: number; fallback?: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  componentDidCatch() { this.setState({ error: true }); }
  static getDerivedStateFromError() { return { error: true }; }

  render() {
    if (this.state.error) return <>{this.props.fallback ?? null}</>;
    return (
      <Img
        src={staticFile(`screenshots/${this.props.id}.png`)}
        style={{
          width: "100%",
          height: "auto",
          objectFit: "cover",
          objectPosition: `50% ${this.props.offsetY * 100}%`,
          display: "block",
        }}
        onError={() => this.setState({ error: true })}
      />
    );
  }
}

// React import needed for class component
import React from "react";
