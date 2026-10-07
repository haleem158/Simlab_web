import { LOGO_PATH, LOGO_VIEWBOX } from "./logo-path";

const [, , W, H] = LOGO_VIEWBOX.split(" ").map(Number);

/** The Simlab mark. White by default; pass `color` to recolor. */
export function Logo({
  height = 32,
  color = "#ffffff",
}: {
  height?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      width={(height * W) / H}
      height={height}
      role="img"
      aria-label="Simlab"
      style={{ flex: "none", display: "block" }}
    >
      <path d={LOGO_PATH} fill={color} fillRule="evenodd" />
    </svg>
  );
}
