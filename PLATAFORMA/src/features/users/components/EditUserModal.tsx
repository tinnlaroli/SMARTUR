import { useEffect, useMemo, useState } from 'react';
import type { UpdateUserDTO } from '../types/types';
import { Save, X, Camera, User as UserIcon, AlertCircle, Building2, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { api } from '../../../shared/api/axiosClient';

interface Company { id: number; name: string; }

interface Props {
    user: {
        id: number;
        name: string;
        role_id: number;
        is_active: boolean;
        photo_url: string | null;
        id_company?: number | null;
    };
    onClose: () => void;
    onSubmit: (id: number, data: UpdateUserDTO) => Promise<boolean | undefined>;
}

export default function EditUserModal({ user, onClose, onSubmit }: Props) {
    const { lang } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);

    const [formData, setFormData] = useState({
        name: user.name,
        password: '',
        role_id: user.role_id,
        is_active: user.is_active,
        id_company: user.id_company ?? null as number | null,
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user.photo_url);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Companies list (only fetched when role 3 is selected)
    const [companies, setCompanies]   = useState<Company[]>([]);
    const [loadingCo, setLoadingCo]   = useState(false);

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
        if (!formData.name.trim()) e.name = 'El nombre es obligatorio.';
        else if (/\d/.test(formData.name)) e.name = 'El nombre no debe contener números.';
        if (formData.password && formData.password.length < 8) e.password = 'Mínimo 8 caracteres.';
        if (formData.role_id === 3 && !formData.id_company)
            e.id_company = 'Selecciona una empresa para este usuario.';
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
                name === 'role_id'   ? Number(value) :
                name === 'is_active' ? value === 'true' :
                name === 'id_company'? (value ? Number(value) : null) :
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
        if (formData.password.trim())               dataToSend.password  = formData.password;
        if (formData.role_id   !== user.role_id)   dataToSend.role_id   = formData.role_id;
        if (formData.is_active !== user.is_active) dataToSend.is_active = formData.is_active;
        if (selectedImage)                          dataToSend.image     = selectedImage;

        // id_company: send if role changed to/from 3, or if company changed
        const companyChanged = formData.id_company !== (user.id_company ?? null);
        const roleChanged    = formData.role_id !== user.role_id;
        if (companyChanged || roleChanged) {
            dataToSend.id_company = formData.role_id === 3 ? formData.id_company : null;
        }

        if (Object.keys(dataToSend).length === 0) { onClose(); return; }
        const success = await onSubmit(user.id, dataToSend);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md transform transition-all">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {mod.users.editTitle}
                    </h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 gap-y-5 flex flex-col max-h-[80vh] overflow-y-auto">
                    {/* Avatar */}
                    <div className="flex flex-col items-center justify-center gap-y-3 pb-2">
                        <div className="relative group">
                            <div className="size-20 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 transition-colors group-hover:border-violet-500">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                        <UserIcon className="size-8" />
                                    </div>
                                )}
                            </div>
                            <label htmlFor="edit-photo-upload" className="absolute bottom-0 right-0 flex size-7 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                                <Camera className="size-3.5" />
                                <input id="edit-photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">{mod.users.profilePhoto}</p>
                    </div>

                    <div className="gap-y-4 flex flex-col">
                        {/* Nombre */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{mod.users.name}</label>
                            <input
                                id="edit-user-name" name="name" value={formData.name} onChange={handleFieldChange}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-colors ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-700 focus:ring-violet-500/20 focus:border-violet-500'}`}
                                placeholder={mod.users.namePlaceholderShort}
                            />
                            {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.name}</p>}
                        </div>

                        {/* Contraseña */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {mod.users.newPassword}
                                <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500 ml-2">{mod.users.optionalHint}</span>
                            </label>
                            <input
                                id="edit-user-password" name="password" type="password" value={formData.password} onChange={handleFieldChange}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-colors ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-700 focus:ring-violet-500/20 focus:border-violet-500'}`}
                                placeholder={mod.users.passwordLeaveBlank}
                            />
                            {errors.password && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.password}</p>}
                        </div>

                        {/* Rol */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-role" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{mod.users.role}</label>
                            <select
                                id="edit-user-role" name="role_id" value={formData.role_id} onChange={handleFieldChange}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 cursor-pointer transition-colors"
                            >
                                <option value={1}>{mod.users.roleAdmin}</option>
                                <option value={2}>{mod.users.roleUser}</option>
                                <option value={3}>Empresa turística</option>
                            </select>
                        </div>

                        {/* Empresa (solo cuando role_id = 3) */}
                        {formData.role_id === 3 && (
                            <div className="gap-y-1.5 flex flex-col">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <Building2 className="size-3.5 text-violet-500" />
                                    Empresa vinculada
                                </label>
                                {loadingCo ? (
                                    <div className="flex items-center gap-2 py-2 text-sm text-zinc-400">
                                        <Loader2 className="size-4 animate-spin" /> Cargando empresas…
                                    </div>
                                ) : (
                                    <select
                                        name="id_company" value={formData.id_company ?? ''} onChange={handleFieldChange}
                                        className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 cursor-pointer transition-colors ${errors.id_company ? 'border-red-400 focus:ring-red-400' : 'border-zinc-200 dark:border-zinc-700 focus:ring-violet-500/20 focus:border-violet-500'}`}
                                    >
                                        <option value="">Selecciona una empresa…</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.id_company && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.id_company}</p>}
                                {companies.length === 0 && !loadingCo && (
                                    <p className="text-xs text-amber-500">No hay empresas registradas. Crea una primero en <strong>Compañías</strong>.</p>
                                )}
                            </div>
                        )}

                        {/* Estado */}
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-status" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{mod.users.status}</label>
                            <select
                                id="edit-user-status" name="is_active" value={String(formData.is_active)} onChange={handleFieldChange}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 cursor-pointer transition-colors"
                            >
                                <option value="true">{mod.users.statusActive}</option>
                                <option value="false">{mod.users.statusInactive}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <X className="size-4" /><span>{mod.common.cancel}</span>
                        </button>
                        <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-violet-600 dark:bg-violet-500 text-white hover:bg-violet-700 dark:hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors">
                            <Save className="size-4" /><span>{mod.common.save}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
