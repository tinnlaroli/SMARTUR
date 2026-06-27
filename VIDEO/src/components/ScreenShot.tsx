import { Img, staticFile } from "remotion";

/**
 * Renders a real screenshot inside a mockup.
 * `src` must be relative to VIDEO/public/  e.g. "images/screens/b2b-01.png"
 * `fit` controls object-fit (default: cover so it fills the mockup area).
 */
export function ScreenShot({
  src,
  fit = "cover",
  style,
}: {
  src: string;
  fit?: "cover" | "contain" | "fill";
  style?: React.CSSProperties;
}) {
  return (
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: fit,
        objectPosition: "top center",
        display: "block",
        ...style,
      }}
    />
  );
}
