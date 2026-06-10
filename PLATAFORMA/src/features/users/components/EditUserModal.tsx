import { useEffect, useMemo, useState } from 'react';
import type { UpdateUserDTO } from '../types/types';
import { Save, X, Camera, User as UserIcon, AlertCircle, Building2, Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { api } from '../../../shared/api/axiosClient';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

function PasswordStrengthRow({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {ok
                ? <CheckCircle className="size-3.5 shrink-0 text-emerald-400" />
                : <XCircle className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-600" />
            }
            <span className={ok ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}>{label}</span>
        </div>
    );
}

const ROLE_LABELS: Record<number, Record<string, string>> = {
    1: { es: 'Administrador',     en: 'Administrator',   fr: 'Administrateur'         },
    2: { es: 'Turista',           en: 'Tourist',         fr: 'Touriste'               },
    3: { es: 'Empresa turística', en: 'Tourism company', fr: 'Entreprise touristique' },
    4: { es: 'Turismólogo',       en: 'Turismologist',   fr: 'Touristologue'          },
};

interface Company { id: number; name: string; }

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        role_id: number;
        is_active: boolean;
        photo_url: string | null;
        id_company?: number | null;
    };
    onClose: () => void;
    onSubmit: (id: number, data: UpdateUserDTO) => Promise<boolean | undefined>;
}


export default function EditUserModal({ user, onClose, onSubmit }: Props) {
    useEscapeKey(onClose);
    const { lang, t } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const locale = lang === 'fr' ? 'fr' : lang === 'en' ? 'en' : 'es';

    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        password: '',
        role_id: user.role_id,
        is_active: user.is_active,
        id_company: user.id_company ?? null as number | null,
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user.photo_url);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);

    const pwChecks = {
        minLength:    formData.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasNumber:    /[0-9]/.test(formData.password),
        hasSpecial:   /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    };
    const pwScore = Object.values(pwChecks).filter(Boolean).length;

    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingCo, setLoadingCo]  = useState(false);

    useEffect(() => {
        if (formData.role_id !== 3) return;
        setLoadingCo(true);
        api.get('/companies', { params: { limit: 100 } })
            .then((r) => setCompanies(r.data?.companies ?? r.data ?? []))
            .catch(() => {})
            .finally(() => setLoadingCo(false));
    }, [formData.role_id]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name.trim()) e.name = mod.users.namePlaceholderShort + ' es obligatorio.';
        else if (/\d/.test(formData.name)) e.name = t('validation.nameNoNumbers');
        if (!formData.email.trim()) e.email = t('validation.emailRequired');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = t('validation.emailValid');
        if (formData.password && formData.password.length < 8) e.password = t('validation.passwordMinLength');
        if (formData.role_id === 3 && !formData.id_company) e.id_company = mod.users.companySelect;
        return e;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'role_id'    ? Number(value) :
                name === 'is_active'  ? value === 'true' :
                name === 'id_company' ? (value ? Number(value) : null) :
                value,
        }));
        if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        const dataToSend: UpdateUserDTO = {};
        if (formData.name      !== user.name)      dataToSend.name      = formData.name;
        if (formData.email     !== user.email)     dataToSend.email     = formData.email;
        if (formData.password.trim())               dataToSend.password  = formData.password;
        if (formData.role_id   !== user.role_id)   dataToSend.role_id   = formData.role_id;
        if (formData.is_active !== user.is_active) dataToSend.is_active = formData.is_active;
        if (selectedImage)                          dataToSend.image     = selectedImage;

        const companyChanged = formData.id_company !== (user.id_company ?? null);
        const roleChanged    = formData.role_id    !== user.role_id;
        if (companyChanged || roleChanged) {
            dataToSend.id_company = formData.role_id === 3 ? formData.id_company : null;
        }

        if (Object.keys(dataToSend).length === 0) { onClose(); return; }
        const success = await onSubmit(user.id, dataToSend);
        if (success) onClose();
    };

    // Shared style helpers
    const inputStyle: React.CSSProperties = { background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text)' };
    const inputFocusCls = 'focus:outline-none focus:ring-2 focus:ring-violet-500/20';

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
            <div className="rounded-xl shadow-xl w-full max-w-md" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                        {mod.users.editTitle}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 transition-colors"
                        style={{ color: 'var(--color-text-alt)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--rgb-text),0.07)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 gap-y-5 flex flex-col max-h-[80vh] overflow-y-auto">

                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-y-3 pb-2">
                        <div className="relative group">
                            <div
                                className="size-20 overflow-hidden rounded-full transition-colors group-hover:border-violet-500"
                                style={{ border: '2px solid var(--color-border)', background: 'var(--color-bg-alt)' }}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center" style={{ color: 'var(--color-text-alt)' }}>
                                        <UserIcon className="size-8" />
                                    </div>
                                )}
                            </div>
                            <label htmlFor="edit-photo-upload" className="absolute bottom-0 right-0 flex size-7 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                                <Camera className="size-3.5" />
                                <input id="edit-photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--color-text-alt)' }}>{mod.users.profilePhoto}</p>
                    </div>

                    <div className="gap-y-4 flex flex-col">
                        {/* Nombre */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-name" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{mod.users.name}</label>
                            <input
                                id="edit-user-name" name="name" value={formData.name} onChange={handleFieldChange}
                                className={`w-full rounded-lg px-4 py-2.5 text-sm ${inputFocusCls}`}
                                style={{ ...inputStyle, ...(errors.name ? { borderColor: '#f87171' } : {}) }}
                                placeholder={mod.users.namePlaceholderShort}
                            />
                            {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-email" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{mod.users.email}</label>
                            <input
                                id="edit-user-email" name="email" type="email" value={formData.email} onChange={handleFieldChange}
                                className={`w-full rounded-lg px-4 py-2.5 text-sm ${inputFocusCls}`}
                                style={{ ...inputStyle, ...(errors.email ? { borderColor: '#f87171' } : {}) }}
                                placeholder="correo@ejemplo.com"
                            />
                            {errors.email && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.email}</p>}
                        </div>

                        {/* Contraseña */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-password" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                {mod.users.newPassword}
                                <span className="text-xs font-normal ml-2" style={{ color: 'var(--color-text-alt)' }}>{mod.users.optionalHint}</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="edit-user-password" name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password} onChange={handleFieldChange}
                                    className={`w-full rounded-lg px-4 py-2.5 pr-11 text-sm ${inputFocusCls}`}
                                    style={{ ...inputStyle, ...(errors.password ? { borderColor: '#f87171' } : {}) }}
                                    placeholder={mod.users.passwordLeaveBlank}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                                    style={{ color: 'var(--color-text-alt)' }}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.password}</p>}

                            {formData.password && (
                                <div className="mt-1 space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3">
                                    <PasswordStrengthRow ok={pwChecks.minLength}    label={t('auth.password.min')} />
                                    <PasswordStrengthRow ok={pwChecks.hasUpperCase} label={t('auth.password.uppercase')} />
                                    <PasswordStrengthRow ok={pwChecks.hasNumber}    label={t('auth.password.number')} />
                                    <PasswordStrengthRow ok={pwChecks.hasSpecial}   label={t('auth.password.special')} />
                                    <div className="mt-2 flex gap-1">
                                        {[0, 1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="h-1 flex-1 rounded-full transition-colors duration-300"
                                                style={{
                                                    background: i < pwScore
                                                        ? pwScore <= 1 ? '#f87171'
                                                          : pwScore <= 2 ? '#fb923c'
                                                          : pwScore <= 3 ? '#facc15'
                                                          : '#34d399'
                                                        : 'rgb(212,212,216)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rol */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-role" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{mod.users.role}</label>
                            <select
                                id="edit-user-role" name="role_id" value={formData.role_id} onChange={handleFieldChange}
                                className={`w-full rounded-lg px-4 py-2.5 text-sm cursor-pointer ${inputFocusCls}`}
                                style={inputStyle}
                            >
                                {[1, 2, 3, 4].map(id => (
                                    <option key={id} value={id}>{ROLE_LABELS[id][locale]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Empresa (solo cuando role_id = 3) */}
                        {formData.role_id === 3 && (
                            <div className="gap-y-1.5 flex flex-col">
                                <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                                    <Building2 className="size-3.5" style={{ color: 'var(--color-purple)' }} />
                                    {mod.users.companyLinked}
                                </label>
                                {loadingCo ? (
                                    <div className="flex items-center gap-2 py-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                        <Loader2 className="size-4 animate-spin" /> {mod.users.loadingCompanies}
                                    </div>
                                ) : (
                                    <select
                                        name="id_company" value={formData.id_company ?? ''} onChange={handleFieldChange}
                                        className={`w-full rounded-lg px-4 py-2.5 text-sm cursor-pointer ${inputFocusCls}`}
                                        style={{ ...inputStyle, ...(errors.id_company ? { borderColor: '#f87171' } : {}) }}
                                    >
                                        <option value="">{mod.users.companySelect}</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.id_company && (
                                    <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.id_company}</p>
                                )}
                                {companies.length === 0 && !loadingCo && (
                                    <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
                                        {mod.users.noCompanies} {mod.users.noCompaniesHint}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Estado */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-status" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{mod.users.status}</label>
                            <select
                                id="edit-user-status" name="is_active" value={String(formData.is_active)} onChange={handleFieldChange}
                                className={`w-full rounded-lg px-4 py-2.5 text-sm cursor-pointer ${inputFocusCls}`}
                                style={inputStyle}
                            >
                                <option value="true">{mod.users.statusActive}</option>
                                <option value="false">{mod.users.statusInactive}</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                            type="button" onClick={onClose}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors"
                            style={{ color: 'var(--color-text-alt)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--rgb-text),0.07)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-alt)'; }}
                        >
                            <X className="size-4" /><span>{mod.common.cancel}</span>
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            style={{ background: 'var(--color-purple)' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            <Save className="size-4" /><span>{mod.common.save}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
