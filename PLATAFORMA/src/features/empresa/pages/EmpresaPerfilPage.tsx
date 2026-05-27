import { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, Phone, MapPin, Save, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { empresaApi, type EmpresaProfile } from '../api/empresaApi';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../shared/context/ToastContext';

export function EmpresaPerfilPage() {
    const toast = useToast();
    const { t } = useLanguage();
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
            .catch(() => setError(t('empresa.perfil.errorLoading')))
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
            setProfile((prev) => (prev ? { ...prev, ...form } : prev));
            setMsg({ type: 'ok', text: t('empresa.perfil.profileUpdatedMsg') });
            toast.success(t('empresa.perfil.profileUpdated'));
        } catch (err) {
            const message = axios.isAxiosError(err)
                ? (err.response?.data as { message?: string } | undefined)?.message
                    ?? t('empresa.perfil.errorSaving')
                : t('empresa.perfil.errorSaving');
            setMsg({ type: 'err', text: message });
            toast.error(message);
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
                <p className="text-sm font-medium text-rose-500">{error ?? t('empresa.perfil.notLoaded')}</p>
            </div>
        );
    }

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="shrink-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                    {t('empresa.perfil.title')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                    {t('empresa.perfil.description')}
                </p>
            </div>

            <div
                className="flex shrink-0 items-start gap-3 rounded-xl border px-5 py-4"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                <ShieldCheck className="mt-0.5 size-5 shrink-0" style={{ color: MODULE_COLORS.services }} />
                <div>
                    <p className="mb-0.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {t('empresa.perfil.infoTitle')}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {t('empresa.perfil.infoDescription')}
                    </p>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-5">
                <div
                    className="rounded-2xl border p-5 text-sm xl:col-span-2"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {t('empresa.perfil.registrationData')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                            <p className="mb-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>{t('empresa.perfil.sector')}</p>
                            <p style={{ color: 'var(--color-text)' }}>{profile.sector_name}</p>
                    </div>
                    <div>
                            <p className="mb-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>{t('empresa.perfil.municipality')}</p>
                            <p style={{ color: 'var(--color-text)' }}>{profile.location_name ?? '—'}</p>
                    </div>
                    <div>
                            <p className="mb-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>{t('empresa.perfil.registrationDate')}</p>
                            <p style={{ color: 'var(--color-text)' }}>
                            {new Date(profile.registration_date).toLocaleDateString('es-MX')}
                        </p>
                    </div>
                    <div>
                            <p className="mb-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>{t('empresa.perfil.status')}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                            ${profile.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                            {profile.status === 'active' ? t('empresa.perfil.active') : t('empresa.perfil.pendingReview')}
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
                    <Building2 size={15} style={{ color: MODULE_COLORS.services }} /> {t('empresa.perfil.editableData')}
                </h2>

                {[
                    { name: 'name', label: t('empresa.perfil.companyName'), icon: Building2, required: true },
                    { name: 'address', label: t('empresa.perfil.address'), icon: MapPin, required: false },
                    { name: 'phone', label: t('empresa.perfil.phone'), icon: Phone, required: false },
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
                    {saving ? t('empresa.perfil.saving') : t('empresa.perfil.saveChanges')}
                </button>
                </form>
            </div>
        </div>
    );
}
