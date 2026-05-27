import { useEffect, useState } from 'react';
import { Building2, Phone, MapPin, Save, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { empresaApi, type EmpresaProfile } from '../api/empresaApi';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';

export function EmpresaPerfilPage() {
    const [profile, setProfile] = useState<EmpresaProfile | null>(null);
    const [form, setForm] = useState({ name: '', address: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    useEffect(() => {
        empresaApi.getProfile()
            .then(({ company }) => {
                setProfile(company);
                setForm({ name: company.name, address: company.address ?? '', phone: company.phone ?? '' });
            })
            .catch(() => setError('Error al cargar el perfil de empresa.'))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await empresaApi.updateProfile(form);
            setMsg({ type: 'ok', text: 'Perfil actualizado correctamente.' });
        } catch {
            setMsg({ type: 'err', text: 'Error al guardar. Intenta de nuevo.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={`${DATA_TABLE_SHELL_CLASS} h-40`}>
                <TableSkeleton rows={3} colWidths={['flex-1', 'flex-1']} />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className={`${DATA_TABLE_SHELL_CLASS} flex h-full flex-col items-center justify-center gap-3`}>
                <AlertCircle className="size-8 text-rose-400" />
                <p className="text-sm font-medium text-rose-500">{error ?? 'No fue posible cargar el perfil.'}</p>
            </div>
        );
    }

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    Perfil de empresa
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    Gestiona la informacion oficial y de contacto que veran turistas y administradores.
                </p>
            </div>

            <div
                className="flex shrink-0 items-start gap-3 rounded-xl border px-5 py-4"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <ShieldCheck className="mt-0.5 size-5 shrink-0" style={{ color: MODULE_COLORS.services }} />
                <div>
                    <p className="mb-0.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Informacion empresarial
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Manten estos datos al dia para mejorar confianza, contacto y trazabilidad operativa.
                    </p>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-5">
                <div
                    className="rounded-2xl border p-5 text-sm xl:col-span-2"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Datos de registro
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                            <p className="mb-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>Sector</p>
                            <p style={{ color: 'var(--color-text)' }}>{profile.sector_name}</p>
                    </div>
                    <div>
                            <p className="mb-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>Municipio</p>
                            <p style={{ color: 'var(--color-text)' }}>{profile.location_name ?? '—'}</p>
                    </div>
                    <div>
                            <p className="mb-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>Fecha de registro</p>
                            <p style={{ color: 'var(--color-text)' }}>
                            {new Date(profile.registration_date).toLocaleDateString('es-MX')}
                        </p>
                    </div>
                    <div>
                            <p className="mb-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>Estado</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                            ${profile.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                            {profile.status === 'active' ? 'Activo' : 'En revisión'}
                        </span>
                    </div>
                </div>
                </div>

                <form
                    onSubmit={handleSave}
                    className="rounded-2xl border p-6 space-y-4 xl:col-span-3"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <Building2 size={15} style={{ color: MODULE_COLORS.services }} /> Datos editables
                </h2>

                {[
                    { name: 'name', label: 'Nombre de la empresa', icon: Building2, required: true },
                    { name: 'address', label: 'Dirección', icon: MapPin, required: false },
                    { name: 'phone', label: 'Teléfono', icon: Phone, required: false },
                ].map((f) => (
                    <div key={f.name}>
                            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-alt)' }}>{f.label}</label>
                        <div className="relative">
                                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--color-text-alt)' }} />
                            <input
                                name={f.name}
                                value={form[f.name as keyof typeof form]}
                                onChange={handleChange}
                                required={f.required}
                                    className="w-full rounded-xl border pl-9 pr-4 py-3 text-sm outline-none transition-colors"
                                    style={{
                                        background: 'var(--color-bg-alt)',
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text)',
                                    }}
                            />
                        </div>
                    </div>
                ))}

                {msg && (
                    <div className={`text-sm px-4 py-2 rounded-xl border ${msg.type === 'ok'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                        {msg.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving}
                        className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        style={{ background: MODULE_COLORS.services }}
                >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                </form>
            </div>
        </div>
    );
}
