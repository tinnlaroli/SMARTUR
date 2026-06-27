import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import axios from 'axios';
import { Wrench, Plus, Loader2, X, AlertCircle, Lock, Upload, Image as ImageIcon, Clock, DollarSign, Phone, CheckCircle, Leaf } from 'lucide-react';
import MapPicker from '../../../components/ui/MapPicker';
import {
    empresaApi,
    type EmpresaService,
    type ServiceCreatePayload,
    type ServiceUpdatePayload,
} from '../api/empresaApi';
import { DATA_TABLE_SHELL_CLASS } from '../../../components/ui/DataTable';
import { TableSkeleton } from '../../../components/ui/TableSkeleton';
import { SelectionBar } from '../../../components/ui/SelectionBar';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import SearchInput from '../../tourist-services/components/SearchInput';
import Pagination from '../../users/components/Pagination';
import EmpresaServiceTable from '../components/EmpresaServiceTable';
import { useEmpresaServices } from '../hooks/useEmpresaServices';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../shared/context/ToastContext';
import { EMPRESA_SERVICE_TYPE_OPTIONS } from '../utils/serviceTypes';
import { ServiceActivitiesPanel } from '../../tourist-services/components/ServiceActivitiesPanel';

interface ServiceModalProps {
    initial?: EmpresaService | null;
    defaultLocationId?: number | null;
    onClose: () => void;
    onSaved: (svc: EmpresaService) => void;
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    pending_review: { label: 'En revisión',  color: '#F59E0B', bg: '#F59E0B18' },
    active:         { label: 'Aprobado',     color: '#10B981', bg: '#10B98118' },
    rejected:       { label: 'Rechazado',    color: '#EF4444', bg: '#EF444418' },
};

function ServiceModal({ initial, defaultLocationId, onClose, onSaved }: ServiceModalProps) {
    const toast = useToast();
    const { t } = useLanguage();
    const isEdit = !!initial;
    const imgInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        name:             initial?.name            ?? '',
        description:      initial?.description     ?? '',
        service_type:     initial?.service_type    ?? '',
        active:           initial?.active          ?? true,
        price_from:       initial?.price_from      != null ? String(initial.price_from) : '',
        price_to:         initial?.price_to        != null ? String(initial.price_to)   : '',
        currency:         initial?.currency        ?? 'MXN',
        duration_minutes: initial?.duration_minutes != null ? String(initial.duration_minutes) : '',
        contact_phone:    initial?.contact_phone   ?? '',
    });
    const [lat, setLat] = useState(0);
    const [lng, setLng] = useState(0);
    const [imageFile, setImageFile]       = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null);
    const [errors, setErrors]             = useState<Record<string, string>>({});
    const [saving, setSaving]             = useState(false);
    const [error, setError]               = useState<string | null>(null);

    // Wellness section
    const [isWellness, setIsWellness]               = useState<boolean>((initial as unknown as Record<string,unknown>)?.is_wellness as boolean ?? false);
    const [wellnessCategoria, setWellnessCategoria] = useState<string>((initial as unknown as Record<string,unknown>)?.categoria_wellness as string ?? '');
    const [wellnessDesc, setWellnessDesc]           = useState<string>((initial as unknown as Record<string,unknown>)?.descripcion_bienestar as string ?? '');
    const [wellnessAisl, setWellnessAisl]           = useState<number>(((initial as unknown as Record<string,unknown>)?.nivel_aislamiento as number) ?? 0.5);
    const [wellnessRest, setWellnessRest]           = useState<number>(((initial as unknown as Record<string,unknown>)?.restauracion_pasiva as number) ?? 0.5);
    const [wellnessDemanda, setWellnessDemanda]     = useState<number>(((initial as unknown as Record<string,unknown>)?.demanda_fisica as number) ?? 0.3);

    const typeOptions = useMemo(() => {
        const known = EMPRESA_SERVICE_TYPE_OPTIONS.map((o) => o.value);
        if (form.service_type && !known.includes(form.service_type as typeof known[number])) {
            return [{ value: form.service_type, label: form.service_type }, ...EMPRESA_SERVICE_TYPE_OPTIONS];
        }
        return EMPRESA_SERVICE_TYPE_OPTIONS;
    }, [form.service_type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === 'active' ? value === 'true' : value }));
        if (errors[name]) setErrors(prev => { const next = {...prev}; delete next[name]; return next; });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'El nombre es requerido';
        if (!form.service_type) e.service_type = 'Selecciona un tipo';
        if (form.contact_phone && !/^\d{1,10}$/.test(form.contact_phone.replace(/[\s\-]/g, '')))
            e.contact_phone = 'Solo dígitos, máximo 10';
        if (form.price_from !== '' && isNaN(parseFloat(form.price_from)))
            e.price_from = 'Solo números';
        if (form.price_to !== '' && isNaN(parseFloat(form.price_to)))
            e.price_to = 'Solo números';
        if (!isEdit && lat === 0 && lng === 0)
            e.location = 'Marca la ubicación en el mapa';
        return e;
    };

    const borderStyle = (name: string) => ({
        borderColor: errors[name] ? '#f43f5e' : form[name as keyof typeof form] ? '#10b981' : 'var(--color-border)',
    });

    const handleImage = (file: File) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        if (!isEdit && !defaultLocationId) {
            setError(t('empresa.servicios.modal.errorNoLocation'));
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const base = {
                name:             form.name.trim(),
                description:      form.description?.trim() || undefined,
                service_type:     form.service_type,
                price_from:       form.price_from  ? parseFloat(form.price_from)  : null,
                price_to:         form.price_to    ? parseFloat(form.price_to)    : null,
                currency:         form.currency    || 'MXN',
                duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
                contact_phone:    form.contact_phone?.trim() || undefined,
                image:            imageFile,
                // Wellness fields
                is_wellness:          isWellness || undefined,
                wellness_status:      isWellness ? 'pending' : undefined,
                categoria_wellness:   isWellness && wellnessCategoria ? wellnessCategoria : undefined,
                descripcion_bienestar: isWellness && wellnessDesc ? wellnessDesc.trim() : undefined,
                nivel_aislamiento:    isWellness ? wellnessAisl : undefined,
                restauracion_pasiva:  isWellness ? wellnessRest : undefined,
                demanda_fisica:       isWellness ? wellnessDemanda : undefined,
            };

            if (isEdit && initial) {
                const { service } = await empresaApi.updateService(initial.id_service, {
                    ...base, active: form.active,
                } as ServiceUpdatePayload);
                toast.success(t('empresa.servicios.toast.updated'));
                onSaved(service);
            } else {
                const { service } = await empresaApi.createService({
                    ...base,
                    id_location: defaultLocationId ?? undefined,
                    active: false,
                    latitude: lat || undefined,
                    longitude: lng || undefined,
                } as ServiceCreatePayload);
                toast.success(t('empresa.servicios.toast.created'));
                onSaved(service);
            }
        } catch (err) {
            const message = axios.isAxiosError(err)
                ? (err.response?.data as { message?: string } | undefined)?.message ?? 'Error al guardar el servicio.'
                : 'Error al guardar el servicio.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 transition";
    const inputStyle = {
        background: 'var(--color-bg-alt)',
        color: 'var(--color-text)',
        ['--tw-ring-color' as string]: 'var(--color-purple)',
    };
    const labelCls = "block text-xs font-semibold uppercase tracking-wider mb-1.5";
    const labelStyle = { color: 'var(--color-text-alt)' };

    const approvalBadge = isEdit && initial?.status ? STATUS_BADGE[initial.status] : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-2xl rounded-2xl border flex flex-col max-h-[92vh]"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                        <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                            {isEdit ? t('empresa.servicios.modal.editTitle') : t('empresa.servicios.modal.createTitle')}
                        </h2>
                        {!isEdit && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                                El servicio será revisado por el equipo SMARTUR antes de publicarse.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {approvalBadge && (
                            <span className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold"
                                style={{ color: approvalBadge.color, background: approvalBadge.bg, borderColor: `${approvalBadge.color}30` }}>
                                {initial?.status === 'active' && <CheckCircle className="size-3" />}
                                {approvalBadge.label}
                            </span>
                        )}
                        <button type="button" onClick={onClose}
                            className="rounded-lg p-1.5 hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--color-text-alt)' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body — scrollable */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 space-y-5">

                        {/* Basic info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className={labelCls} style={labelStyle}>
                                    Nombre del servicio <span className="text-rose-400">*</span>
                                </label>
                                <input name="name" value={form.name} onChange={handleChange}
                                    maxLength={120} placeholder="Ej. Tour por la zona cafetalera"
                                    className={inputCls} style={{ ...inputStyle, ...borderStyle('name') }} />
                                {errors.name && <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="size-3" />{errors.name}</p>}
                            </div>

                            <div>
                                <label className={labelCls} style={labelStyle}>
                                    Tipo <span className="text-rose-400">*</span>
                                </label>
                                <select name="service_type" value={form.service_type} onChange={handleChange}
                                    className={`${inputCls} appearance-none`} style={{ ...inputStyle, ...borderStyle('service_type') }}>
                                    <option value="">Seleccionar…</option>
                                    {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                {errors.service_type && <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="size-3" />{errors.service_type}</p>}
                            </div>

                            {isEdit && (
                                <div>
                                    <label className={labelCls} style={labelStyle}>Visibilidad</label>
                                    <select name="active" value={form.active ? 'true' : 'false'} onChange={handleChange}
                                        className={`${inputCls} appearance-none`} style={{ ...inputStyle, borderColor: 'var(--color-border)' }}>
                                        <option value="true">Activo — visible en la app</option>
                                        <option value="false">Inactivo — oculto</option>
                                    </select>
                                </div>
                            )}

                            <div className={isEdit ? '' : 'sm:col-span-2'}>
                                <label className={labelCls} style={labelStyle}>
                                    <span className="flex items-center gap-1.5"><Phone className="size-3" /> Teléfono de contacto</span>
                                </label>
                                <input name="contact_phone" value={form.contact_phone} onChange={handleChange}
                                    placeholder="2281234567" inputMode="numeric" maxLength={10}
                                    className={inputCls} style={{ ...inputStyle, ...borderStyle('contact_phone') }} />
                                {errors.contact_phone && <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="size-3" />{errors.contact_phone}</p>}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelCls} style={labelStyle}>Descripción</label>
                            <textarea name="description" value={form.description ?? ''} onChange={handleChange}
                                rows={3} maxLength={500} placeholder="Describe brevemente tu servicio…"
                                className={`${inputCls} resize-none`} style={{ ...inputStyle, borderColor: 'var(--color-border)' }} />
                        </div>

                        {/* Pricing */}
                        <div>
                            <label className={`${labelCls} flex items-center gap-1.5`} style={labelStyle}>
                                <DollarSign className="size-3" /> Precio
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <p className="text-[10px] mb-1" style={{ color: 'var(--color-text-alt)' }}>Desde (MXN)</p>
                                    <input name="price_from" inputMode="numeric"
                                        value={form.price_from} onChange={handleChange}
                                        placeholder="0.00"
                                        className={inputCls} style={{ ...inputStyle, ...borderStyle('price_from') }} />
                                    {errors.price_from && <p className="text-xs text-rose-400 mt-1">{errors.price_from}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] mb-1" style={{ color: 'var(--color-text-alt)' }}>Hasta (MXN)</p>
                                    <input name="price_to" inputMode="numeric"
                                        value={form.price_to} onChange={handleChange}
                                        placeholder="0.00"
                                        className={inputCls} style={{ ...inputStyle, ...borderStyle('price_to') }} />
                                    {errors.price_to && <p className="text-xs text-rose-400 mt-1">{errors.price_to}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] mb-1" style={{ color: 'var(--color-text-alt)' }}>Moneda</p>
                                    <select name="currency" value={form.currency} onChange={handleChange}
                                        className={`${inputCls} appearance-none`} style={{ ...inputStyle, borderColor: 'var(--color-border)' }}>
                                        <option value="MXN">MXN</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className={`${labelCls} flex items-center gap-1.5`} style={labelStyle}>
                                <Clock className="size-3" /> Duración (minutos)
                            </label>
                            <input name="duration_minutes" inputMode="numeric" min="0" step="5"
                                value={form.duration_minutes} onChange={handleChange}
                                placeholder="Ej. 120 = 2 horas"
                                className={`${inputCls} max-w-xs`} style={{ ...inputStyle, borderColor: 'var(--color-border)' }} />
                        </div>

                        {/* Map — only for new services, mandatory */}
                        {!isEdit && (
                            <div>
                                <label className={labelCls} style={labelStyle}>
                                    Ubicación en mapa <span className="text-rose-400">*</span>
                                </label>
                                <MapPicker lat={lat} lng={lng} onChange={(la, lo) => {
                                    setLat(la); setLng(lo);
                                    if (errors.location) setErrors(prev => { const next = {...prev}; delete next.location; return next; });
                                }} />
                                {(lat !== 0 || lng !== 0) && (
                                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                        {lat.toFixed(6)}, {lng.toFixed(6)}
                                    </p>
                                )}
                                {errors.location && <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="size-3" />{errors.location}</p>}
                            </div>
                        )}

                        {/* Image upload — at the end */}
                        <div>
                            <label className={labelCls} style={labelStyle}>
                                <span className="flex items-center gap-1.5"><ImageIcon className="size-3" /> Foto del servicio</span>
                            </label>
                            {imagePreview ? (
                                <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                                    <img src={imagePreview} alt="preview" className="w-full h-44 object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                        className="absolute top-2 right-2 rounded-xl p-1.5 text-white"
                                        style={{ background: 'rgba(0,0,0,0.55)' }}
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => imgInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                                        style={{ background: 'rgba(0,0,0,0.55)' }}
                                    >
                                        <Upload className="size-3" /> Cambiar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => imgInputRef.current?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImage(f); }}
                                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-5 transition-colors hover:border-purple-400"
                                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}
                                >
                                    <Upload className="size-5 shrink-0" style={{ color: 'var(--color-text-alt)' }} />
                                    <div className="text-left">
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                            Seleccionar o arrastrar imagen
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                            JPG, PNG, WebP · máx. 10 MB · recomendado 16:9
                                        </p>
                                    </div>
                                </button>
                            )}
                            <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); }} />
                        </div>

                        {/* -- Wellness Section ------------------------------------ */}
                        <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                            {/* Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsWellness(p => !p)}
                                className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors"
                                style={{
                                    background: isWellness ? 'rgba(34,197,94,0.08)' : 'var(--color-bg-alt)',
                                    borderColor: isWellness ? '#22c55e40' : 'var(--color-border)',
                                }}
                            >
                                <span className="flex items-center gap-2 font-semibold" style={{ color: isWellness ? '#22c55e' : 'var(--color-text)' }}>
                                    <Leaf className="size-4" />
                                    Servicio de Bienestar (opcional)
                                </span>
                                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${isWellness ? 'text-white' : ''}`}
                                    style={{ background: isWellness ? '#22c55e' : 'var(--color-border)', color: isWellness ? 'white' : 'var(--color-text-alt)' }}>
                                    {isWellness ? 'Activado' : 'Desactivado'}
                                </span>
                            </button>

                            {isWellness && (
                                <div className="mt-3 space-y-4">
                                    <div className="rounded-xl border px-4 py-3"
                                        style={{ background: 'rgba(34,197,94,0.04)', borderColor: '#22c55e30' }}>
                                        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                            Al marcar este servicio como de bienestar, quedará en revisión por el equipo SMARTUR
                                            antes de aparecer en las recomendaciones wellness de la app. No afecta tu listado regular.
                                        </p>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className={labelCls} style={labelStyle}>Categoría wellness</label>
                                        <select
                                            value={wellnessCategoria}
                                            onChange={e => setWellnessCategoria(e.target.value)}
                                            className={`${inputCls} appearance-none`}
                                            style={{ ...inputStyle, borderColor: 'var(--color-border)' }}
                                        >
                                            <option value="">Seleccionar categoría…</option>
                                            {['Termal', 'Spa', 'Bosque', 'Montaña', 'Lago', 'Retiro_Silencio', 'Ecoturismo_Activo', 'Parque'].map(c => (
                                                <option key={c} value={c}>{c.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className={labelCls} style={labelStyle}>¿Qué experiencia de bienestar ofrece?</label>
                                        <textarea
                                            rows={2} maxLength={300}
                                            value={wellnessDesc}
                                            onChange={e => setWellnessDesc(e.target.value)}
                                            placeholder="Ej. Aguas termales con propiedades relajantes en entorno natural…"
                                            className={`${inputCls} resize-none`}
                                            style={{ ...inputStyle, borderColor: 'var(--color-border)' }}
                                        />
                                    </div>

                                    {/* Sliders */}
                                    <div className="space-y-3">
                                        {[
                                            {
                                                label: 'Nivel de aislamiento', hint: '0 = centro urbano · 10 = muy aislado',
                                                value: wellnessAisl, onChange: setWellnessAisl,
                                            },
                                            {
                                                label: 'Relajación / Restauración', hint: '0 = activo · 10 = muy relajante',
                                                value: wellnessRest, onChange: setWellnessRest,
                                            },
                                            {
                                                label: 'Demanda física', hint: '0 = sin esfuerzo · 10 = alta exigencia física',
                                                value: wellnessDemanda, onChange: setWellnessDemanda,
                                            },
                                        ].map(({ label, hint, value, onChange }) => (
                                            <div key={label}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`${labelCls} mb-0`} style={labelStyle}>{label}</span>
                                                    <span className="text-sm font-bold tabular-nums" style={{ color: '#22c55e' }}>
                                                        {(value * 10).toFixed(0)}/10
                                                    </span>
                                                </div>
                                                <input
                                                    type="range" min={0} max={1} step={0.05}
                                                    value={value}
                                                    onChange={e => onChange(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 cursor-pointer accent-green-500"
                                                />
                                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-alt)' }}>{hint}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Approval notice for new services */}
                        {!isEdit && (
                            <div className="flex items-start gap-3 rounded-xl border px-4 py-3"
                                style={{ background: '#F59E0B0D', borderColor: '#F59E0B30' }}>
                                <AlertCircle className="size-4 shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                                    Tu servicio iniciará como <strong style={{ color: 'var(--color-text)' }}>En revisión</strong> y
                                    será publicado en la app una vez que el equipo SMARTUR lo apruebe (1–2 días hábiles).
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl border p-3 text-xs"
                                style={{ background: '#EF444410', borderColor: '#EF444440', color: '#EF4444' }}>
                                <AlertCircle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {isEdit && initial?.id_service && (
                            <div className="mt-2 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                                <ServiceActivitiesPanel serviceId={initial.id_service} />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 pb-5">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}>
                            {t('empresa.servicios.modal.cancel')}
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                            style={{ background: 'var(--color-purple)' }}>
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            {saving ? t('empresa.servicios.modal.saving') : isEdit ? t('empresa.servicios.modal.saveChanges') : t('empresa.servicios.modal.createService')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function StatusBlocker({ status }: { status: 'pending' | 'suspended' }) {
    const isPending = status === 'pending';
    return (
        <div className="flex flex-1 items-center justify-center">
            <div
                className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border p-8 text-center shadow-sm"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div className="flex size-14 items-center justify-center rounded-full"
                    style={{ background: isPending ? '#F59E0B18' : '#EF444418' }}>
                    <Lock className="size-6" style={{ color: isPending ? '#F59E0B' : '#EF4444' }} />
                </div>
                <div>
                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {isPending ? 'Empresa en revisión' : 'Empresa suspendida'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        {isPending
                            ? 'Los servicios se activan una vez que el equipo SMARTUR apruebe tu empresa. Normalmente tarda 24–48 horas.'
                            : 'Tu cuenta ha sido suspendida. Contacta a soporte en soporte@smartur.online para más información.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

type ModalState = { isCreateOpen: boolean; editTarget: EmpresaService | null };
type ModalAction =
    | { type: 'OPEN_CREATE' }
    | { type: 'CLOSE_CREATE' }
    | { type: 'OPEN_EDIT'; service: EmpresaService }
    | { type: 'CLOSE_EDIT' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'OPEN_CREATE':
            return { isCreateOpen: true, editTarget: null };
        case 'CLOSE_CREATE':
            return { ...state, isCreateOpen: false };
        case 'OPEN_EDIT':
            return { isCreateOpen: false, editTarget: action.service };
        case 'CLOSE_EDIT':
            return { ...state, editTarget: null };
        default:
            return state;
    }
};

// -- Página principal --------------------------------------------------------
export function EmpresaServiciosPage() {
    const toast = useToast();
    const { t } = useLanguage();
    const {
        services,
        setServices,
        isLoading,
        error,
        total,
        totalPages,
        page,
        limit,
        search: urlSearch,
        setSearch: setUrlSearch,
        setSearchParams,
        fetchServices,
    } = useEmpresaServices();

    const [companyLocationId, setCompanyLocationId] = useState<number | null>(null);
    const [companyStatus, setCompanyStatus] = useState<string | null>(null);

    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const toggleService = (id: number) =>
        setSelectedServices((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
        );
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const [modalState, dispatchModal] = useReducer(modalReducer, {
        isCreateOpen: false,
        editTarget: null,
    });
    const { confirm, modal: confirmModal } = useConfirm();

    useEffect(() => {
        empresaApi.getProfile()
            .then(({ company }) => {
                setCompanyLocationId(company.id_location);
                setCompanyStatus(company.status);
            })
            .catch(() => setCompanyLocationId(null));
    }, []);

    useEffect(() => {
        if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    }, [urlSearch, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== urlSearch) setUrlSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, urlSearch, setUrlSearch]);

    useEffect(() => {
        if (page > totalPages) {
            setSearchParams((prev) => {
                prev.set('page', String(totalPages));
                return prev;
            });
        }
    }, [page, totalPages, setSearchParams]);

    const openEditById = (id: number) => {
        const service = services.find((s) => s.id_service === id);
        if (service) dispatchModal({ type: 'OPEN_EDIT', service });
    };

    const handleSaved = (svc: EmpresaService) => {
        setServices((prev) => {
            const idx = prev.findIndex((s) => s.id_service === svc.id_service);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = svc;
                return updated;
            }
            return [svc, ...prev];
        });
        dispatchModal({ type: 'CLOSE_CREATE' });
        dispatchModal({ type: 'CLOSE_EDIT' });
        void fetchServices();
    };

    const handleDeleteSelected = async () => {
        const targets = services.filter(
            (s) => selectedServices.includes(s.id_service) && s.active,
        );
        if (targets.length === 0) return;

        const ok = await confirm({
            title: t('empresa.servicios.deleteConfirm.title', { count: targets.length }),
            message: t('empresa.servicios.deleteConfirm.message'),
            confirmLabel: t('empresa.servicios.deleteConfirm.confirmLabel'),
            variant: 'danger',
        });
        if (!ok) return;

        for (const svc of targets) {
            try {
                await empresaApi.deleteService(svc.id_service);
            } catch {
                toast.error(t('empresa.servicios.toast.deleteError', { name: svc.name }));
            }
        }

        await fetchServices();
        setSelectedServices([]);
    };

    if (!isLoading && companyStatus && companyStatus !== 'active') {
        return (
            <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4">
                <div className="shrink-0">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {t('empresa.servicios.title')}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {t('empresa.servicios.description')}
                    </p>
                </div>
                <StatusBlocker status={companyStatus === 'suspended' ? 'suspended' : 'pending'} />
            </div>
        );
    }

    return (
        <>
            <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
                {confirmModal}

                <div className="shrink-0">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {t('empresa.servicios.title')}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {t('empresa.servicios.description')}
                    </p>
                </div>

                <div
                    className="flex shrink-0 items-start gap-3 rounded-xl border px-5 py-4"
                    style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                >
                    <Wrench className="mt-0.5 size-5 shrink-0" style={{ color: MODULE_COLORS.services }} />
                    <div>
                        <p className="mb-0.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            {t('empresa.servicios.badgeTitle')}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            {t('empresa.servicios.badgeDescription')}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <SelectionBar
                        count={selectedServices.length}
                        onDelete={handleDeleteSelected}
                        onEdit={() => {
                            const id = selectedServices[0];
                            if (id) openEditById(id);
                        }}
                        onClear={() => setSelectedServices([])}
                        deleteLabel={t('empresa.servicios.deleteLabel')}
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <SearchInput
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder={t('empresa.servicios.searchPlaceholder')}
                        />
                        <button
                            type="button"
                            onClick={() => dispatchModal({ type: 'OPEN_CREATE' })}
                            disabled={companyStatus !== null && companyStatus !== 'active'}
                            title={companyStatus === 'pending' ? 'Tu empresa está en revisión' : companyStatus === 'suspended' ? 'Tu empresa está suspendida' : undefined}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ background: MODULE_COLORS.services }}
                        >
                            <Plus className="size-4" />
                            {t('empresa.servicios.newService')}
                        </button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                    {isLoading && (
                        <div className={`${DATA_TABLE_SHELL_CLASS} flex-1`}>
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <TableSkeleton
                                    rows={10}
                                    colWidths={['w-8', 'flex-1', 'w-40', 'w-28', 'w-24']}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className={`${DATA_TABLE_SHELL_CLASS} flex flex-1 flex-col items-center justify-center gap-3`}>
                            <AlertCircle className="size-8 text-rose-400" />
                            <p className="text-sm font-medium text-rose-500">{error}</p>
                        </div>
                    )}

                    {!isLoading && !error && (
                        <EmpresaServiceTable
                            services={services}
                            selectedServices={selectedServices}
                            onToggle={toggleService}
                            onViewDetail={openEditById}
                            serviceTypes={EMPRESA_SERVICE_TYPE_OPTIONS.map((option) => option.value)}
                        />
                    )}
                </div>

                {!isLoading && !error && total > 0 && (
                    <div className="shrink-0">
                        <Pagination
                            page={page}
                            limit={limit}
                            totalPages={totalPages}
                            totalItems={total}
                            setSearchParams={setSearchParams}
                        />
                    </div>
                )}
            </div>

            {modalState.isCreateOpen && (
                <ServiceModal
                    defaultLocationId={companyLocationId}
                    onClose={() => dispatchModal({ type: 'CLOSE_CREATE' })}
                    onSaved={handleSaved}
                />
            )}
            {modalState.editTarget && (
                <ServiceModal
                    initial={modalState.editTarget}
                    onClose={() => dispatchModal({ type: 'CLOSE_EDIT' })}
                    onSaved={handleSaved}
                />
            )}
        </>
    );
}
