/**
 * CounterAnimation — número que cuenta de 0 hasta `value` en `durationFrames`.
 * Empieza en `frameIn`. Usa easing anticipatorio para sentir "peso".
 */
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface Props {
  value: number;
  frameIn: number;
  durationFrames?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
  className?: string;
  decimals?: number;
}

export function CounterAnimation({
  value,
  frameIn,
  durationFrames = 55,
  prefix = "",
  suffix = "",
  style,
  className,
  decimals = 0,
}: Props) {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [frameIn, frameIn + durationFrames],
    [0, 1],
    {
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const current = value * progress;
  const formatted = decimals > 0
    ? current.toFixed(decimals)
    : Math.round(current).toLocaleString("es-MX");

  return (
    <span style={style} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
