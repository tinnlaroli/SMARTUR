import { useEffect, useRef, useState } from 'react';

const SCREENS = [
    {
        id: 'home',
        label: 'Recomendaciones',
        bg: '#0F172A',
        render: () => (
            <div style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#FC478E' }}>WELLTUR</div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#984EFD22', border: '1.5px solid #984EFD55' }} />
                </div>
                <div style={{ fontSize: 6, color: '#aaa', marginBottom: 4 }}>Lugares para ti hoy ✨</div>
                {[
                    { name: 'Cascada Texolo', cat: 'Naturaleza', score: '96%', color: '#4DB9CA' },
                    { name: 'Café El Roble', cat: 'Gastronomía', score: '91%', color: '#FF7D1F' },
                    { name: 'Jardín Botánico', cat: 'Cultura', score: '88%', color: '#9CCC44' },
                ].map((p) => (
                    <div key={p.name} style={{ background: '#1E293B', borderRadius: 8, padding: '6px 7px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${p.color}33`, flexShrink: 0, border: `1.5px solid ${p.color}55` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 6.5, fontWeight: 700, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: 5.5, color: '#64748B', marginTop: 1 }}>{p.cat}</div>
                        </div>
                        <div style={{ fontSize: 6, fontWeight: 700, color: p.color, background: `${p.color}18`, padding: '2px 4px', borderRadius: 4 }}>{p.score}</div>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: 'diary',
        label: 'Mi Diario',
        bg: '#0F172A',
        render: () => (
            <div style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#F1F5F9', marginBottom: 2 }}>Mi Diario</div>
                <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
                    {['Favoritos', 'Historial'].map((t, i) => (
                        <div key={t} style={{ fontSize: 5.5, fontWeight: 700, color: i === 0 ? '#FC478E' : '#64748B', borderBottom: i === 0 ? '1.5px solid #FC478E' : 'none', paddingBottom: 2 }}>{t}</div>
                    ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {['#4DB9CA', '#FF7D1F', '#984EFD', '#9CCC44'].map((c, i) => (
                        <div key={i} style={{ height: 38, borderRadius: 8, background: `${c}22`, border: `1.5px solid ${c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: `${c}66` }} />
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 5.5, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FC478E' }} />
                    4 lugares guardados
                </div>
            </div>
        ),
    },
    {
        id: 'explore',
        label: 'Explorar',
        bg: '#0F172A',
        render: () => (
            <div style={{ padding: '10px 8px 0', display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#F1F5F9', marginBottom: 2 }}>Explorar</div>
                {/* Fake map */}
                <div style={{ flex: 1, background: '#1E293B', borderRadius: 10, position: 'relative', overflow: 'hidden', minHeight: 90 }}>
                    {/* Grid lines */}
                    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
                        {[20, 40, 60, 80].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#4DB9CA" strokeWidth="0.5" />)}
                        {[20, 40, 60, 80].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#4DB9CA" strokeWidth="0.5" />)}
                    </svg>
                    {/* Map pins */}
                    {[
                        { x: '25%', y: '30%', c: '#FC478E' },
                        { x: '55%', y: '50%', c: '#4DB9CA' },
                        { x: '70%', y: '25%', c: '#984EFD' },
                        { x: '40%', y: '65%', c: '#FF7D1F' },
                    ].map((p, i) => (
                        <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-50%)' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: p.c, border: '1.5px solid white' }} />
                        </div>
                    ))}
                </div>
                {/* Category chips */}
                <div style={{ display: 'flex', gap: 4, paddingBottom: 8, flexWrap: 'wrap' }}>
                    {['Todos', 'Naturaleza', 'Cafés'].map((chip, i) => (
                        <div key={chip} style={{ fontSize: 5.5, fontWeight: 600, padding: '2px 6px', borderRadius: 99, background: i === 0 ? '#FC478E' : '#1E293B', color: i === 0 ? 'white' : '#94A3B8', border: i === 0 ? 'none' : '1px solid #334155' }}>{chip}</div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: 'profile',
        label: 'Perfil',
        bg: '#0F172A',
        render: () => (
            <div style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#984EFD,#FC478E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 700 }}>M</div>
                    <div>
                        <div style={{ fontSize: 7, fontWeight: 700, color: '#F1F5F9' }}>Martín L.</div>
                        <div style={{ fontSize: 5.5, color: '#64748B' }}>Viajero frecuente</div>
                    </div>
                </div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
                    {[{ v: '24', l: 'Visitas' }, { v: '12', l: 'Favoritos' }, { v: '4.8★', l: 'Rating' }].map(s => (
                        <div key={s.l} style={{ background: '#1E293B', borderRadius: 8, padding: '5px 4px', textAlign: 'center' }}>
                            <div style={{ fontSize: 8, fontWeight: 700, color: '#984EFD' }}>{s.v}</div>
                            <div style={{ fontSize: 5, color: '#64748B', marginTop: 1 }}>{s.l}</div>
                        </div>
                    ))}
                </div>
                {/* Recent badges */}
                <div style={{ fontSize: 5.5, color: '#94A3B8', marginTop: 2 }}>Logros recientes</div>
                <div style={{ display: 'flex', gap: 5 }}>
                    {['🏔', '☕', '🗺'].map(e => (
                        <div key={e} style={{ width: 26, height: 26, borderRadius: 8, background: '#1E293B', border: '1.5px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{e}</div>
                    ))}
                </div>
            </div>
        ),
    },
];

const INTERVAL_MS = 3000;

export function PhoneMockup() {
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const advance = () => {
        setAnimating(true);
        setTimeout(() => {
            setCurrent(c => (c + 1) % SCREENS.length);
            setAnimating(false);
        }, 250);
    };

    useEffect(() => {
        timerRef.current = setInterval(advance, INTERVAL_MS);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const screen = SCREENS[current];

    return (
        <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {/* Phone frame */}
            <div style={{
                width: 140,
                height: 290,
                borderRadius: 28,
                background: '#1E293B',
                border: '2.5px solid #334155',
                boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px #0F172A, inset 0 1px 0 rgba(255,255,255,0.08)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Notch */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 56, height: 14, background: '#0F172A', borderRadius: '0 0 12px 12px', zIndex: 10 }} />

                {/* Screen content */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: screen.bg,
                    opacity: animating ? 0 : 1,
                    transition: 'opacity 0.25s ease',
                    paddingTop: 14,
                    overflow: 'hidden',
                }}>
                    {screen.render()}
                </div>

                {/* Bottom bar */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                    {['⌂', '♡', '⊕', '☰'].map((icon, i) => (
                        <span key={i} style={{ fontSize: 10, color: i === 0 ? '#FC478E' : '#334155' }}>{icon}</span>
                    ))}
                </div>
            </div>

            {/* Screen indicator dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {SCREENS.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => { setCurrent(i); if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = setInterval(advance, INTERVAL_MS); } }}
                        style={{
                            width: i === current ? 16 : 6,
                            height: 6,
                            borderRadius: 99,
                            background: i === current ? '#FC478E' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            padding: 0,
                        }}
                        title={s.label}
                    />
                ))}
            </div>

            {/* Screen label */}
            <div style={{ fontSize: 10, color: '#64748B', letterSpacing: '0.05em', minHeight: 14, transition: 'opacity 0.25s', opacity: animating ? 0 : 1 }}>
                {screen.label}
            </div>
        </div>
    );
}
