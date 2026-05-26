import { useEffect, useState } from 'react';
import { Building2, Phone, MapPin, Save, Loader2 } from 'lucide-react';
import { empresaApi, type EmpresaProfile } from '../api/empresaApi';

export function EmpresaPerfilPage() {
    const [profile, setProfile] = useState<EmpresaProfile | null>(null);
    const [form, setForm] = useState({ name: '', address: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    useEffect(() => {
        empresaApi.getProfile()
            .then(({ company }) => {
                setProfile(company);
                setForm({ name: company.name, address: company.address ?? '', phone: company.phone ?? '' });
            })
            .catch(console.error)
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
        return <div className="h-32 rounded-2xl bg-white/[0.04] animate-pulse" />;
    }

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Perfil de empresa</h1>
                <p className="text-zinc-400 text-sm mt-1">Actualiza los datos de tu empresa turística.</p>
            </div>

            {/* Read-only info */}
            {profile && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Sector</p>
                        <p className="text-white">{profile.sector_name}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Municipio</p>
                        <p className="text-white">{profile.location_name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Fecha de registro</p>
                        <p className="text-white">
                            {new Date(profile.registration_date).toLocaleDateString('es-MX')}
                        </p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs mb-0.5">Estado</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                            ${profile.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                            {profile.status === 'active' ? 'Activo' : 'En revisión'}
                        </span>
                    </div>
                </div>
            )}

            {/* Editable form */}
            <form onSubmit={handleSave} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-6 space-y-4">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Building2 size={15} className="text-orange-400" /> Datos editables
                </h2>

                {[
                    { name: 'name', label: 'Nombre de la empresa', icon: Building2, required: true },
                    { name: 'address', label: 'Dirección', icon: MapPin, required: false },
                    { name: 'phone', label: 'Teléfono', icon: Phone, required: false },
                ].map((f) => (
                    <div key={f.name}>
                        <label className="text-xs text-zinc-400 font-medium block mb-1">{f.label}</label>
                        <div className="relative">
                            <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                            <input
                                name={f.name}
                                value={form[f.name as keyof typeof form]}
                                onChange={handleChange}
                                required={f.required}
                                className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-sm"
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
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
            </form>
        </div>
    );
}
