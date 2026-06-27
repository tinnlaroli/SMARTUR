import { useCurrentFrame } from "remotion";
import { fadeIn, slideUp } from "../helpers/animations";

export function AnimatedText({
  text,
  frameIn,
  style,
  stagger = 0,
}: {
  text: string;
  frameIn: number;
  style?: React.CSSProperties;
  stagger?: number;
}) {
  const frame = useCurrentFrame();
  const start = frameIn + stagger;
  const opacity = fadeIn(frame, start, 18);
  const y = slideUp(frame, start, 30, 18);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
}
