import { useMemo, useState } from 'react';
import type { UpdateUserDTO } from '../types/types';
import { Save, X, Camera, User as UserIcon, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

interface Props {
    user: {
        id: number;
        name: string;
        role_id: number;
        is_active: boolean;
        photo_url: string | null;
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
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user.photo_url);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name.trim()) e.name = 'El nombre es obligatorio.';
        else if (/\d/.test(formData.name)) e.name = 'El nombre no debe contener números.';
        if (formData.password && formData.password.length < 8) e.password = 'Mínimo 8 caracteres.';
        return e;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
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
            [name]:
                name === 'role_id'
                    ? Number(value)
                    : name === 'is_active'
                      ? value === 'true'
                      : value,
        }));
        if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        const dataToSend: UpdateUserDTO = {};

        if (formData.name !== user.name) {
            dataToSend.name = formData.name;
        }

        if (formData.password.trim() !== '') {
            dataToSend.password = formData.password;
        }

        if (formData.role_id !== user.role_id) {
            dataToSend.role_id = formData.role_id;
        }

        if (formData.is_active !== user.is_active) {
            dataToSend.is_active = formData.is_active;
        }

        if (selectedImage) {
            dataToSend.image = selectedImage;
        }

        if (Object.keys(dataToSend).length === 0) {
            onClose();
            return;
        }

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
                                htmlFor="edit-photo-upload"
                                className="absolute bottom-0 right-0 flex size-7 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                            >
                                <Camera className="size-3.5" />
                                <input
                                    id="edit-photo-upload"
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
                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {mod.users.name}
                            </label>
                            <input
                                id="edit-user-name"
                                name="name"
                                value={formData.name}
                                onChange={handleFieldChange}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors ${errors.name ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:ring-violet-400/20 dark:focus:border-violet-400'}`}
                                placeholder={mod.users.namePlaceholderShort}
                            />
                            {errors.name && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.name}</p>}
                        </div>

                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {mod.users.newPassword}
                                <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500 ml-2">
                                    {mod.users.optionalHint}
                                </span>
                            </label>
                            <input
                                id="edit-user-password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleFieldChange}
                                className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors ${errors.password ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:ring-violet-400/20 dark:focus:border-violet-400'}`}
                                placeholder={mod.users.passwordLeaveBlank}
                            />
                            {errors.password && <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5"><AlertCircle className="size-3" />{errors.password}</p>}
                        </div>

                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-role" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {mod.users.role}
                            </label>
                            <select
                                id="edit-user-role"
                                name="role_id"
                                value={formData.role_id}
                                onChange={handleFieldChange}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm
                                     bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                                     focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                                     dark:focus:ring-violet-400/20 dark:focus:border-violet-400
                                     cursor-pointer transition-colors"
                            >
                                <option value={1} className="py-2">
                                    {mod.users.roleAdmin}
                                </option>
                                <option value={2} className="py-2">
                                    {mod.users.roleUser}
                                </option>
                            </select>
                        </div>

                        <div className="gap-y-1.5 flex flex-col">
                            <label htmlFor="edit-user-status" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {mod.users.status}
                            </label>
                            <select
                                id="edit-user-status"
                                name="is_active"
                                value={String(formData.is_active)}
                                onChange={handleFieldChange}
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm 
                                     bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                                     focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                                     dark:focus:ring-violet-400/20 dark:focus:border-violet-400
                                     cursor-pointer transition-colors"
                            >
                                <option value="true" className="py-2">
                                    {mod.users.statusActive}
                                </option>
                                <option value="false" className="py-2">
                                    {mod.users.statusInactive}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 
                   px-3 py-2 text-sm font-medium 
                   rounded-md text-zinc-600 dark:text-zinc-400
                   hover:text-zinc-900 dark:hover:text-zinc-100 
                   hover:bg-zinc-100 dark:hover:bg-zinc-800
                   transition-colors"
                        >
                            <X className="size-4" />
                            <span>{mod.common.cancel}</span>
                        </button>

                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 
                   px-3 py-2 text-sm font-medium 
                   rounded-md bg-violet-600 dark:bg-violet-500
                   text-white
                   hover:bg-violet-700 dark:hover:bg-violet-600
                   focus:outline-none focus:ring-2 focus:ring-violet-500/20
                   transition-colors"
                        >
                            <Save className="size-4" />
                            <span>{mod.common.save}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
