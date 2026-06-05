import { useMemo, useState } from 'react';
import type { CreateUserDTO } from '../types/types';
import { Camera, User as UserIcon, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

interface Props {
    onClose: () => void;
    onSubmit: (data: CreateUserDTO) => Promise<boolean | undefined>;
}

export default function CreateUserModal({ onClose, onSubmit }: Props) {
    useEscapeKey(onClose);
    const { lang, t } = useLanguage();
    const mod = useMemo(() => getDashboardText(lang).modules.modals, [lang]);
    const [formData, setFormData] = useState<CreateUserDTO>({
        name: '',
        email: '',
        password: '',
        role_id: 2,
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = t('validation.nameRequired');
        else if (/\d/.test(formData.name)) newErrors.name = t('validation.nameNoNumbers');
        if (!formData.email.trim()) newErrors.email = t('validation.emailRequired');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('validation.emailValid');
        if (!formData.password) newErrors.password = t('validation.passwordRequired');
        else if (formData.password.length < 8) newErrors.password = t('validation.passwordMinLength');
        return newErrors;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'role_id' ? Number(value) : value,
        }));
        if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
        const success = await onSubmit(formData);
        if (success) onClose();
    };

    return (

        <><div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {mod.users.createTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                        <span className="sr-only">{mod.common.closeSr}</span>
                        <svg
                            className="size-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 gap-y-5 flex flex-col">
                    <div className="flex flex-col items-center justify-center gap-y-3 pb-2">
                        <div className="relative group">
                            <div className="size-20 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 transition-colors group-hover:border-violet-500">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                        <UserIcon className="size-8" />
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="create-photo-upload"
                                className="absolute bottom-0 right-0 flex size-7 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                            >
                                <Camera className="size-3.5" />
                                <input
                                    id="create-photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                            {mod.users.profilePhoto}
                        </p>
                    </div>

                    <div className="gap-y-4 flex flex-col">
                        <div className="gap-y-1 flex flex-col">
                            <label
                                htmlFor="create-user-name"
                                className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                {mod.users.fullName}
                            </label>
                            <input
                                id="create-user-name"
                                name="name"
                                value={formData.name}
                                onChange={handleFieldChange}
                                className={`w-full rounded-lg border px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:text-white dark:placeholder-zinc-500 dark:bg-zinc-800 bg-white ${errors.name ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-300 focus:border-violet-500 focus:ring-violet-500 dark:border-zinc-700'}`}
                                placeholder={mod.users.namePlaceholder} />
                            {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.name}</p>}
                        </div>

                        <div className="gap-y-1 flex flex-col">
                            <label
                                htmlFor="create-user-email"
                                className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                {mod.users.email}
                            </label>
                            <input
                                id="create-user-email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleFieldChange}
                                className={`w-full rounded-lg border px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:text-white dark:placeholder-zinc-500 dark:bg-zinc-800 bg-white ${errors.email ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-300 focus:border-violet-500 focus:ring-violet-500 dark:border-zinc-700'}`}
                                placeholder={mod.users.emailPlaceholder} />
                            {errors.email && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.email}</p>}
                        </div>

                        <div className="gap-y-1 flex flex-col">
                            <label
                                htmlFor="create-user-password"
                                className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                {mod.users.password}
                            </label>
                            <input
                                id="create-user-password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleFieldChange}
                                className={`w-full rounded-lg border px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:text-white dark:placeholder-zinc-500 dark:bg-zinc-800 bg-white ${errors.password ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-300 focus:border-violet-500 focus:ring-violet-500 dark:border-zinc-700'}`}
                                placeholder={mod.users.passwordPlaceholder} />
                            {errors.password && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.password}</p>}
                        </div>
                        <div className="gap-y-1 flex flex-col">
                            <label
                                htmlFor="create-user-role"
                                className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                                {mod.users.role}
                            </label>
                            <select
                                id="create-user-role"
                                name="role_id"
                                value={formData.role_id}
                                onChange={handleFieldChange}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            >
                                <option value={1}>{mod.users.roleAdmin}</option>
                                <option value={2}>{mod.users.roleUser}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                            {mod.common.cancel}
                        </button>

                        <button
                            type="submit"
                            className="transform rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.02] hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 active:scale-[0.98] dark:bg-violet-500 dark:hover:bg-violet-600"
                        >
                            {mod.users.createSubmit}
                        </button>
                    </div>
                </form>
            </div>
        </div></>
    );
}
