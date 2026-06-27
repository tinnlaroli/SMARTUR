import { Bell, Search, Home, Compass, Calendar, User, BrainCircuit, Star, MapPin, ChevronRight } from "lucide-react";
import { useCurrentFrame, Img, staticFile } from "remotion";
import { C, F } from "./tokens";
import { fadeIn, slideUp } from "../helpers/animations";

// Gradient "landscape photos" — evoke real Veracruz / Altas Montañas scenery
const PLACE_GRADIENTS = [
  // Cascada de Texolo — water + forest
  `linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.62) 100%),
   linear-gradient(155deg, #164e63 0%, #0891b2 25%, #22d3ee 45%, #34d399 65%, #16a34a 85%, #14532d 100%)`,
  // Sendero El Pico de Orizaba — mountain + sky
  `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.60) 100%),
   linear-gradient(155deg, #1e3a5f 0%, #2563eb 20%, #60a5fa 40%, #f8fafc 58%, #94a3b8 70%, #334155 90%)`,
  // Café Cencalli — warm coffee tones
  `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.60) 100%),
   linear-gradient(155deg, #1c0a00 0%, #78350f 30%, #a16207 55%, #fbbf24 75%, #fef3c7 90%)`,
];

const PLACES = [
  {
    name: "Cascada de Texolo",
    cat: "Naturaleza",
    city: "Xico, Veracruz",
    match: 98,
    price: "$80",
    rating: "4.9",
    gradient: PLACE_GRADIENTS[0],
    featured: true,
  },
  {
    name: "Pico de Orizaba",
    cat: "Aventura",
    city: "Orizaba, Ver.",
    match: 95,
    price: "$350",
    rating: "5.0",
    gradient: PLACE_GRADIENTS[1],
    featured: false,
  },
  {
    name: "Café Cencalli",
    cat: "Gastronomía",
    city: "Córdoba, Ver.",
    match: 93,
    price: "$120",
    rating: "4.8",
    gradient: PLACE_GRADIENTS[2],
    featured: false,
  },
];

const CATS = ["Todos", "Naturaleza", "Café", "Aventura", "Cultura"];
const NAV = [
  { Icon: Home,     label: "Inicio",   active: true  },
  { Icon: Compass,  label: "Explorar", active: false },
  { Icon: Calendar, label: "Agenda",   active: false },
  { Icon: User,     label: "Perfil",   active: false },
];

function StatusBar() {
  return (
    <div style={{
      height: 28,
      padding: "0 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "transparent",
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: F.body }}>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {/* Signal bars */}
        <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end", height: 11 }}>
          {[4, 6, 8, 10, 11].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, background: i < 4 ? "#fff" : "rgba(255,255,255,0.35)", borderRadius: 1 }} />
          ))}
        </div>
        {/* Battery */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <div style={{
            width: 22, height: 11, borderRadius: 3, border: "1.5px solid rgba(255,255,255,0.7)",
            padding: "1.5px 2px", display: "flex", alignItems: "center",
          }}>
            <div style={{ width: "78%", height: "100%", background: "#4ade80", borderRadius: 1.5 }} />
          </div>
          <div style={{ width: 2, height: 5, background: "rgba(255,255,255,0.5)", borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

function PlaceCardFeatured({ place, opacity }: { place: typeof PLACES[0]; opacity: number }) {
  return (
    <div style={{
      width: "100%",
      height: 196,
      borderRadius: 20,
      background: place.gradient,
      overflow: "hidden",
      position: "relative",
      opacity,
      boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
      flexShrink: 0,
    }}>
      {/* AI badge */}
      <div style={{
        position: "absolute",
        top: 14,
        right: 14,
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(8px)",
        borderRadius: 999,
        padding: "5px 11px",
        display: "flex",
        alignItems: "center",
        gap: 5,
        border: "1px solid rgba(255,255,255,0.3)",
      }}>
        <BrainCircuit size={12} color="#fff" />
        <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>IA {place.match}%</span>
      </div>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: F.heading, marginBottom: 4 }}>
          {place.name}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} color="rgba(255,255,255,0.85)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontFamily: F.body }}>{place.city}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Star size={11} color="#fbbf24" fill="#fbbf24" />
              <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, fontFamily: F.body }}>{place.rating}</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 700, fontFamily: F.body }}>{place.price}/persona</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceCardSmall({ place, opacity }: { place: typeof PLACES[0]; opacity: number }) {
  return (
    <div style={{
      flex: 1,
      borderRadius: 16,
      background: "#fff",
      border: `1px solid ${C.border}`,
      overflow: "hidden",
      opacity,
      boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
    }}>
      <div style={{ height: 112, background: place.gradient, position: "relative" }}>
        <div style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(6px)",
          borderRadius: 999,
          padding: "3px 8px",
          fontSize: 9,
          fontWeight: 800,
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          IA {place.match}%
        </div>
      </div>
      <div style={{ padding: "9px 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 2, fontFamily: F.heading }}>{place.name}</div>
        <div style={{ fontSize: 9, color: C.textAlt, marginBottom: 5 }}>{place.cat}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.purple, fontFamily: F.body }}>{place.price}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Star size={9} color="#fbbf24" fill="#fbbf24" />
            <span style={{ fontSize: 9, color: "#92400e", fontWeight: 700 }}>{place.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppHome({ frameIn }: { frameIn: number }) {
  const frame = useCurrentFrame();
  const rel = frame - frameIn;

  // Slide-up animations for cards (absolute frame references)
  const featuredSlideY  = slideUp(frame, frameIn + 18, 50, 20);
  const smallCard1SlideY = slideUp(frame, frameIn + 32, 40, 18);
  const smallCard2SlideY = slideUp(frame, frameIn + 38, 40, 18);

  return (
    <div style={{ background: "#F7F2FF", height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Top header with gradient */}
      <div style={{
        background: `linear-gradient(160deg, ${C.purple} 0%, #6d28d9 60%, #4f46e5 100%)`,
        padding: "0 0 20px",
        borderRadius: "0 0 28px 28px",
        flexShrink: 0,
      }}>
        <StatusBar />
        {/* Greeting + notification */}
        <div style={{ padding: "8px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: F.body }}>Bienvenida</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: F.heading, lineHeight: 1.1 }}>Ana García 👋</div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            border: "1.5px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bell size={16} color="#fff" />
          </div>
        </div>

        {/* Search bar */}
        <div style={{ padding: "0 20px" }}>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            border: "1.5px solid rgba(255,255,255,0.22)",
            borderRadius: 16,
            padding: "11px 16px",
            display: "flex", gap: 10, alignItems: "center",
          }}>
            <Search size={15} color="rgba(255,255,255,0.75)" />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: F.body }}>Buscar destinos, actividades...</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, padding: "16px 16px 0", overflow: "hidden", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Category chips */}
        <div style={{ display: "flex", gap: 8, opacity: fadeIn(rel, 6, 10) }}>
          {CATS.map((cat, i) => (
            <div key={cat} style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: i === 0 ? C.purple : "#fff",
              color: i === 0 ? "#fff" : C.textAlt,
              border: i === 0 ? "none" : `1.5px solid ${C.border}`,
              boxShadow: i === 0 ? `0 4px 14px ${C.purple}40` : "none",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}>
              {cat}
            </div>
          ))}
        </div>

        {/* Section header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: fadeIn(rel, 10, 10) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <BrainCircuit size={15} color={C.purple} />
            <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: F.heading }}>Recomendados para ti</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, color: C.purple }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Ver todos</span>
            <ChevronRight size={13} color={C.purple} />
          </div>
        </div>

        {/* Featured place card */}
        <div style={{
          opacity: fadeIn(rel, 16, 14),
          transform: `translateY(${featuredSlideY}px)`,
        }}>
          <PlaceCardFeatured place={PLACES[0]} opacity={1} />
        </div>

        {/* 2 smaller cards side by side */}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, opacity: fadeIn(rel, 30, 14), transform: `translateY(${smallCard1SlideY}px)` }}>
            <PlaceCardSmall place={PLACES[1]} opacity={1} />
          </div>
          <div style={{ flex: 1, opacity: fadeIn(rel, 36, 14), transform: `translateY(${smallCard2SlideY}px)` }}>
            <PlaceCardSmall place={PLACES[2]} opacity={1} />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 8px 16px",
        background: "#fff",
        borderTop: `1px solid ${C.border}`,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        {NAV.map(({ Icon, label, active }) => (
          <div key={label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            flex: 1,
            opacity: active ? 1 : 0.55,
          }}>
            {active ? (
              <div style={{
                width: 40, height: 32, borderRadius: 999,
                background: `${C.purple}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={19} color={C.purple} />
              </div>
            ) : (
              <Icon size={19} color={C.textAlt} />
            )}
            <span style={{
              fontSize: 9, fontWeight: active ? 800 : 500,
              color: active ? C.purple : C.textAlt,
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
