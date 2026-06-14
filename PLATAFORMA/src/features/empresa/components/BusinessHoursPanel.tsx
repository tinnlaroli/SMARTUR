import { Clock, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { empresaApi, type EmpresaService } from '../api/empresaApi';

interface Props {
    services: EmpresaService[];
    onUpdate?: (serviceId: number, hours: Record<string, string>) => void;
}

const DAYS = [
    { key: 'lun', label: 'Lun' },
    { key: 'mar', label: 'Mar' },
    { key: 'mie', label: 'Mié' },
    { key: 'jue', label: 'Jue' },
    { key: 'vie', label: 'Vie' },
    { key: 'sab', label: 'Sáb' },
    { key: 'dom', label: 'Dom' },
];

function parseHours(value: string | undefined): { open: string; close: string; closed: boolean } {
    if (!value || value.toLowerCase() === 'closed') return { open: '09:00', close: '18:00', closed: true };
    const [open, close] = value.split('-');
    return { open: open ?? '09:00', close: close ?? '18:00', closed: false };
}

interface ServiceRowProps {
    service: EmpresaService;
    onUpdate?: (serviceId: number, hours: Record<string, string>) => void;
}

function ServiceHoursRow({ service, onUpdate }: ServiceRowProps) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hours, setHours] = useState<Record<string, string>>(service.operating_hours ?? {});
    const [error, setError] = useState<string | null>(null);

    const getVal = (day: string) => hours[day] ?? '';
    const parsed = (day: string) => parseHours(getVal(day));

    const toggleClosed = (day: string) => {
        const current = getVal(day);
        setHours(prev => ({
            ...prev,
            [day]: current.toLowerCase() === 'closed' || !current ? '09:00-18:00' : 'closed',
        }));
    };

    const setTime = (day: string, type: 'open' | 'close', value: string) => {
        const p = parsed(day);
        const newVal = type === 'open' ? `${value}-${p.close}` : `${p.open}-${value}`;
        setHours(prev => ({ ...prev, [day]: newVal }));
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            await empresaApi.updateOperatingHours(service.id_service, hours);
            onUpdate?.(service.id_service, hours);
            setEditing(false);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setHours(service.operating_hours ?? {});
        setEditing(false);
        setError(null);
    };

    return (
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
            {/* Service header */}
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="size-3.5" style={{ color: 'var(--color-purple)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {service.name}
                    </span>
                </div>
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        style={{ color: 'var(--color-purple)' }}
                    >
                        <Edit2 className="size-3" /> Editar
                    </button>
                ) : (
                    <div className="flex gap-1">
                        <button
                            onClick={save}
                            disabled={saving}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-white transition-colors"
                            style={{ background: 'var(--color-green)' }}
                        >
                            <Check className="size-3" /> {saving ? '...' : 'Guardar'}
                        </button>
                        <button
                            onClick={cancel}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            style={{ color: 'var(--color-pink)' }}
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
                {DAYS.map(({ key, label }) => {
                    const p = parsed(key);
                    if (!editing) {
                        return (
                            <div key={key} className="text-center">
                                <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                                {p.closed || !getVal(key) ? (
                                    <p className="text-[9px]" style={{ color: 'var(--color-text-alt)' }}>—</p>
                                ) : (
                                    <div>
                                        <p className="text-[9px] font-medium" style={{ color: 'var(--color-text)' }}>{p.open}</p>
                                        <p className="text-[9px]" style={{ color: 'var(--color-text-alt)' }}>{p.close}</p>
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return (
                        <div key={key} className="text-center">
                            <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                            <button
                                onClick={() => toggleClosed(key)}
                                className={`mb-1 w-full rounded text-[9px] font-semibold py-0.5 transition-colors ${
                                    p.closed || !getVal(key) ? 'opacity-50' : ''
                                }`}
                                style={{
                                    background: p.closed || !getVal(key) ? 'var(--color-bg-alt)' : 'rgba(168,85,247,0.12)',
                                    color: p.closed || !getVal(key) ? 'var(--color-text-alt)' : 'var(--color-purple)',
                                }}
                            >
                                {p.closed || !getVal(key) ? 'Cerr.' : 'Abie.'}
                            </button>
                            {!p.closed && getVal(key) && (
                                <>
                                    <input
                                        type="time"
                                        value={p.open}
                                        onChange={e => setTime(key, 'open', e.target.value)}
                                        className="w-full rounded border p-0.5 text-[9px]"
                                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                                    />
                                    <input
                                        type="time"
                                        value={p.close}
                                        onChange={e => setTime(key, 'close', e.target.value)}
                                        className="mt-0.5 w-full rounded border p-0.5 text-[9px]"
                                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                                    />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
        </div>
    );
}

export function BusinessHoursPanel({ services, onUpdate }: Props) {
    if (services.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-6 text-center"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <Clock className="size-6 opacity-20" style={{ color: 'var(--color-text-alt)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>No hay servicios disponibles</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>
                Horarios de atención
            </p>
            <div className="space-y-3">
                {services.map(svc => (
                    <ServiceHoursRow key={svc.id_service} service={svc} onUpdate={onUpdate} />
                ))}
            </div>
        </div>
    );
}
