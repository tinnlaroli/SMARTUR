// Exact values from PLATAFORMA/src/styles/tokens.css — light mode
export const C = {
  bg:       "#FFFFFF",
  bgAlt:    "#F5F5FA",
  text:     "#1E1E23",
  textAlt:  "#50505A",
  border:   "rgba(0,0,0,0.08)",
  purple:   "#984EFD",
  pink:     "#FC478E",
  cyan:     "#4DB9CA",
  green:    "#9CCC44",
  orange:   "#FF7D1F",
  // semantic
  amber:    "#F59E0B",
  emerald:  "#10B981",
  rose:     "#EF4444",
} as const;

export const F = {
  heading: "'Cal Sans', 'Outfit', sans-serif",
  body:    "'Outfit', sans-serif",
} as const;

// Shared card style
export const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  ...extra,
});

export const pill = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 10px",
  borderRadius: 999,
  background: bg,
  color,
  fontFamily: F.body,
  fontWeight: 600,
  fontSize: 11,
  whiteSpace: "nowrap" as const,
});
