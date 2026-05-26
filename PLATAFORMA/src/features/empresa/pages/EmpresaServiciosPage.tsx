import { useEffect, useState } from 'react';
import { Wrench, CheckCircle2, XCircle, MapPin } from 'lucide-react';
import { empresaApi, type EmpresaService } from '../api/empresaApi';

export function EmpresaServiciosPage() {
    const [services, setServices] = useState<EmpresaService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        empresaApi.getServices()
            .then(({ services: svcs }) => setServices(svcs))
            .catch(() => setError('Error al cargar servicios.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.04] h-20 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-white">Mis Servicios</h1>
                <p className="text-zinc-400 text-sm mt-1">
                    {services.length > 0
                        ? `${services.length} servicio${services.length !== 1 ? 's' : ''} registrado${services.length !== 1 ? 's' : ''}`
                        : 'Aún no tienes servicios registrados.'}
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {services.length === 0 && !error && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-10 text-center">
                    <Wrench className="mx-auto text-zinc-600 mb-3" size={32} />
                    <p className="text-zinc-400 text-sm">
                        No tienes servicios registrados. Contacta al administrador de SMARTUR para agregar servicios.
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {services.map((svc) => (
                    <div
                        key={svc.id_service}
                        className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4"
                    >
                        {/* Thumbnail */}
                        {svc.image_url ? (
                            <img
                                src={svc.image_url}
                                alt={svc.name}
                                className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
                                <Wrench className="text-zinc-500" size={20} />
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-white font-semibold text-sm truncate">{svc.name}</p>
                                {svc.active ? (
                                    <CheckCircle2 className="text-green-400 shrink-0" size={14} />
                                ) : (
                                    <XCircle className="text-red-400 shrink-0" size={14} />
                                )}
                            </div>
                            {svc.service_type && (
                                <p className="text-xs text-orange-400 font-medium mb-1">{svc.service_type}</p>
                            )}
                            {svc.description && (
                                <p className="text-zinc-400 text-xs line-clamp-2">{svc.description}</p>
                            )}
                        </div>

                        {/* Status chip */}
                        <div className="shrink-0">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                                ${svc.active
                                    ? 'bg-green-500/15 text-green-400 border-green-500/25'
                                    : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25'}`}>
                                {svc.active ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
