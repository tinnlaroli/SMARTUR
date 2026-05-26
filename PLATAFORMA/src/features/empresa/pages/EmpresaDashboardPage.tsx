import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Star, Wrench, BarChart3, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { empresaApi, type EmpresaProfile, type AnalyticsSummary } from '../api/empresaApi';
import { useUserPreferences } from '../../../contexts/LanguageContext';

export function EmpresaDashboardPage() {
    const { user } = useUserPreferences();
    const [profile, setProfile] = useState<EmpresaProfile | null>(null);
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([empresaApi.getProfile(), empresaApi.getAnalytics()])
            .then(([p, a]) => {
                setProfile(p.company);
                setSummary(a.summary);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const kpis = [
        { label: 'Recomendaciones ML', value: summary?.total_recomendaciones ?? '—', icon: TrendingUp, color: '#9CCC44' },
        { label: 'Favoritos',          value: summary?.total_favoritos ?? '—',         icon: Star,      color: '#FF7D1F' },
        { label: 'Visitas',            value: summary?.total_visitas ?? '—',            icon: BarChart3, color: '#4DB9CA' },
        { label: 'Servicios activos',  value: summary?.total_servicios_activos ?? '—', icon: Wrench,    color: '#984EFD' },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] h-24 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Bienvenido, {user?.name?.split(' ')[0] ?? 'Empresa'} 👋
                </h1>
                <p className="text-zinc-400 text-sm mt-1">
                    {profile?.name ?? 'Tu empresa'} · {profile?.location_name ?? ''}
                </p>
            </div>

            {/* Status banner */}
            {profile?.status !== 'active' && (
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-4">
                    <AlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-yellow-300 font-semibold text-sm">Empresa en revisión</p>
                        <p className="text-yellow-400/70 text-xs mt-0.5">
                            El equipo SMARTUR verificará tu información pronto. Mientras tanto puedes explorar el portal.
                        </p>
                    </div>
                </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 flex items-center gap-4"
                    >
                        <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: `${kpi.color}1a` }}
                        >
                            <kpi.icon className="size-5" style={{ color: kpi.color }} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{String(kpi.value)}</p>
                            <p className="text-xs text-zinc-400">{kpi.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Ver mis servicios', to: '/empresa/servicios', color: '#FF7D1F' },
                    { label: 'Analytics completo', to: '/empresa/analytics', color: '#4DB9CA' },
                    { label: 'Editar perfil', to: '/empresa/perfil', color: '#984EFD' },
                ].map((action) => (
                    <Link
                        key={action.to}
                        to={action.to}
                        className="flex items-center justify-between px-5 py-4 rounded-2xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.08] transition-colors group"
                    >
                        <span className="text-white font-medium text-sm">{action.label}</span>
                        <ArrowRight className="text-zinc-500 group-hover:text-white transition-colors" size={16} />
                    </Link>
                ))}
            </div>

            {/* Info panel */}
            {profile && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
                    <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Building2 size={16} className="text-orange-400" /> Datos de la empresa
                    </h2>
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        {[
                            ['Nombre', profile.name],
                            ['Sector', profile.sector_name],
                            ['Municipio', profile.location_name ?? '—'],
                            ['Teléfono', profile.phone ?? '—'],
                            ['Dirección', profile.address ?? '—'],
                            ['Registro', new Date(profile.registration_date).toLocaleDateString('es-MX')],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-zinc-500 text-xs">{k}</dt>
                                <dd className="text-white">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
        </div>
    );
}
