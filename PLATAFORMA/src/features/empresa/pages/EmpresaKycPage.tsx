import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Upload, FileText, X, Loader2, CheckCircle,
    User, MapPin, CreditCard, Clock, AlertTriangle, ShieldCheck,
    RefreshCw, RotateCcw,
} from 'lucide-react';
import { empresaApi, type KycStatusResponse } from '../api/empresaApi';

const PURPLE  = '#984EFD';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER  = '#EF4444';

const CURP_RE = /^[A-Z]{4}\d{6}[HM][A-ZÁÉÍÓÚÜÑ]{5}[A-Z\d]{2}$/;
const RFC_RE  = /^[A-Z]{3,4}\d{6}[A-Z\d]{3}$/;
const ZIP_RE  = /^\d{5}$/;


// -- File upload field ---------------------------------------------------------

function FileUploadField({
    label, hint, value, onChange,
}: { label: string; hint: string; value: File | null; onChange: (f: File | null) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onChange(file);
    };

    return (
        <div>
            <span
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-2 transition-colors"
                style={{ color: value ? SUCCESS : 'var(--color-text-alt)' }}
            >
                {label}
                {value && <CheckCircle className="size-3.5 shrink-0" style={{ color: SUCCESS }} />}
            </span>
            {value ? (
                <div
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                    style={{ background: `${SUCCESS}12`, borderColor: `${SUCCESS}40` }}
                >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${SUCCESS}20` }}>
                        <FileText className="size-4" style={{ color: SUCCESS }} />
                    </div>
                    <span className="flex-1 min-w-0 truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {value.name}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: 'var(--color-text-alt)' }}>
                        {(value.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="rounded-lg p-1 hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--color-text-alt)' }}
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-4 text-left transition-all duration-200"
                    style={{
                        borderColor: dragging ? PURPLE : 'var(--color-border)',
                        background: dragging ? `${PURPLE}08` : 'var(--color-bg-alt)',
                    }}
                >
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors"
                        style={{ background: dragging ? `${PURPLE}20` : 'var(--color-bg)' }}
                    >
                        <Upload className="size-4" style={{ color: dragging ? PURPLE : 'var(--color-text-alt)' }} />
                    </div>
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            Seleccionar o arrastrar archivo
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>{hint}</p>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-alt)', opacity: 0.7 }}>
                            JPG, PNG o PDF · Máx. 10 MB
                        </p>
                    </div>
                </button>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={e => onChange(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}

// -- Status banner -------------------------------------------------------------

function StatusBanner({ kyc }: { kyc: KycStatusResponse }) {
    const status = kyc.status;

    if (status === 'active') {
        const CERT = '#984EFD';
        return (
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-4 rounded-2xl border px-5 py-4"
                    style={{ background: `${SUCCESS}10`, borderColor: `${SUCCESS}30` }}>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${SUCCESS}20` }}>
                        <ShieldCheck className="size-5" style={{ color: SUCCESS }} />
                    </div>
                    <div>
                        <p className="font-semibold text-sm" style={{ color: SUCCESS }}>Empresa verificada</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                            Tu identidad ha sido validada. Tienes acceso completo a la plataforma.
                        </p>
                    </div>
                </div>
                {kyc.is_certified && (
                    <div className="flex items-center gap-4 rounded-2xl border px-5 py-4"
                        style={{ background: `${CERT}0D`, borderColor: `${CERT}40` }}>
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${CERT}20` }}>
                            <ShieldCheck className="size-5" style={{ color: CERT }} />
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: CERT }}>Certificada por SMARTUR</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                                {kyc.certified_at
                                    ? `Certificación otorgada el ${new Date(kyc.certified_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                                    : 'Tu empresa cuenta con la certificación oficial SMARTUR.'
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (status === 'documents_submitted') {
        return (
            <div className="flex items-center gap-4 rounded-2xl border px-5 py-4 mb-6"
                style={{ background: `${WARNING}10`, borderColor: `${WARNING}30` }}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${WARNING}20` }}>
                    <Clock className="size-5" style={{ color: WARNING }} />
                </div>
                <div>
                    <p className="font-semibold text-sm" style={{ color: WARNING }}>Documentos en revisión</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                        Recibimos tus documentos{kyc.verification?.submitted_at
                            ? ` el ${new Date(kyc.verification.submitted_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}`
                            : ''}. Si necesitas actualizar algún archivo, puedes reenviarlos abajo.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'rejected' && kyc.verification?.rejection_reason) {
        return (
            <div className="flex items-start gap-4 rounded-2xl border px-5 py-4 mb-6"
                style={{ background: `${DANGER}08`, borderColor: `${DANGER}30` }}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl mt-0.5" style={{ background: `${DANGER}18` }}>
                    <AlertTriangle className="size-5" style={{ color: DANGER }} />
                </div>
                <div>
                    <p className="font-semibold text-sm" style={{ color: DANGER }}>Documentos rechazados</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>Motivo: </span>
                        {kyc.verification.rejection_reason}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-alt)' }}>
                        Corrige la información y vuelve a enviar.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

// -- Progress steps ------------------------------------------------------------

const STEPS = ['Datos personales', 'Domicilio', 'Documentos'];

function ProgressSteps({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-0 mb-8">
            {STEPS.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={i} className="flex flex-1 items-center">
                        <div className="flex items-center gap-2 shrink-0">
                            <div
                                className="flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all"
                                style={{
                                    background: done ? PURPLE : active ? `${PURPLE}20` : 'var(--color-bg-alt)',
                                    color: done ? '#fff' : active ? PURPLE : 'var(--color-text-alt)',
                                    border: `2px solid ${done || active ? PURPLE : 'var(--color-border)'}`,
                                }}
                            >
                                {done ? <CheckCircle className="size-3.5" /> : i + 1}
                            </div>
                            <span
                                className="hidden sm:block text-xs font-semibold whitespace-nowrap"
                                style={{ color: active ? 'var(--color-text)' : 'var(--color-text-alt)' }}
                            >
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div
                                className="flex-1 h-px mx-3 transition-colors"
                                style={{ background: i < current ? PURPLE : 'var(--color-border)' }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// -- Text input ----------------------------------------------------------------

function Field({
    label, name, value, onChange, onBlur, type = 'text', placeholder = '', required = false,
    full = false, hint, status, min, max,
}: {
    label: string; name: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    type?: string; placeholder?: string; required?: boolean; full?: boolean;
    hint?: string; status?: 'valid' | 'invalid' | null;
    min?: string; max?: string;
}) {
    const borderColor = status === 'valid' ? SUCCESS : status === 'invalid' ? DANGER : 'var(--color-border)';
    const ringColor   = status === 'valid' ? SUCCESS : status === 'invalid' ? DANGER : PURPLE;

    return (
        <div className={full ? 'col-span-2' : ''}>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                {label}{required && <span className="ml-0.5 text-rose-400">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                required={required}
                min={min}
                max={max}
                className="w-full rounded-2xl px-4 py-2.5 text-sm placeholder:opacity-30 focus:outline-none focus:ring-2 transition"
                style={{
                    background: 'var(--color-bg-alt)',
                    border: `1px solid ${borderColor}`,
                    color: 'var(--color-text)',
                    ['--tw-ring-color' as string]: ringColor,
                }}
            />
            {hint && <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>{hint}</p>}
        </div>
    );
}

// -- Select for municipalities -------------------------------------------------

function MunicipioSelect({
    value, onChange, required = false, locations, status, onBlur,
}: {
    value: string; onChange: (v: string) => void;
    required?: boolean; locations: { id_location: number; name: string }[];
    status?: 'valid' | 'invalid' | null; onBlur?: () => void;
}) {
    const borderColor = status === 'valid' ? SUCCESS : status === 'invalid' ? DANGER : 'var(--color-border)';
    return (
        <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-alt)' }}>
                Municipio{required && <span className="ml-0.5 text-rose-400">*</span>}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                required={required}
                className="w-full rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition appearance-none"
                style={{
                    background: 'var(--color-bg-alt)',
                    border: `1px solid ${borderColor}`,
                    color: value ? 'var(--color-text)' : 'var(--color-text-alt)',
                    ['--tw-ring-color' as string]: PURPLE,
                }}
            >
                <option value="">Seleccionar municipio…</option>
                {locations.map(loc => (
                    <option key={loc.id_location} value={loc.name}>{loc.name}</option>
                ))}
            </select>
        </div>
    );
}

// -- Section card --------------------------------------------------------------

function SectionCard({
    icon: Icon, title, subtitle, children,
}: {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    title: string; subtitle?: string; children: React.ReactNode;
}) {
    return (
        <div className="rounded-[28px] border p-6" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-3 mb-5">
                <div className="flex size-9 items-center justify-center rounded-xl shrink-0" style={{ background: `${PURPLE}15` }}>
                    <Icon className="size-4" style={{ color: PURPLE }} />
                </div>
                <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{title}</p>
                    {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

// -- Success screen ------------------------------------------------------------

function SuccessScreen({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
            <div className="flex size-20 items-center justify-center rounded-full mb-6" style={{ background: `${SUCCESS}18` }}>
                <CheckCircle className="size-10" style={{ color: SUCCESS }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Documentos enviados</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-text-alt)' }}>
                El equipo de SMARTUR revisará tu información en{' '}
                <strong style={{ color: 'var(--color-text)' }}>1–3 días hábiles</strong>.
                Te notificaremos por correo cuando tu cuenta esté activa.
            </p>
            <button
                type="button"
                onClick={onBack}
                className="rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: PURPLE }}
            >
                Ir al dashboard
            </button>
        </div>
    );
}

// -- Main page -----------------------------------------------------------------

const MUNICIPIOS: { id_location: number; name: string }[] = [
    { id_location:  9, name: 'Amatlán de los Reyes' },
    { id_location: 11, name: 'Atoyac' },
    { id_location:  2, name: 'Coatepec' },
    { id_location:  3, name: 'Córdoba' },
    { id_location:  8, name: 'Cuitláhuac' },
    { id_location:  5, name: 'Fortín de las Flores' },
    { id_location:  7, name: 'Ixtaczoquitlán' },
    { id_location:  4, name: 'Orizaba' },
    { id_location:  1, name: 'Xalapa' },
    { id_location:  6, name: 'Xico' },
    { id_location: 10, name: 'Yanga' },
];

// CP prefix ? municipio (4-digit checked before 3-digit for overlap resolution)
const CP_MAP: { prefix: string; name: string }[] = [
    { prefix: '9124', name: 'Xico' },
    { prefix: '9447', name: 'Fortín de las Flores' },
    { prefix: '9445', name: 'Ixtaczoquitlán' },
    { prefix: '9446', name: 'Ixtaczoquitlán' },
    { prefix: '9494', name: 'Amatlán de los Reyes' },
    { prefix: '9495', name: 'Atoyac' },
    { prefix: '9496', name: 'Yanga' },
    { prefix: '9498', name: 'Cuitláhuac' },
    { prefix: '943',  name: 'Orizaba' },
    { prefix: '945',  name: 'Córdoba' },
    { prefix: '915',  name: 'Coatepec' },
    { prefix: '910',  name: 'Xalapa' },
    { prefix: '911',  name: 'Xalapa' },
    { prefix: '912',  name: 'Xalapa' },
    { prefix: '913',  name: 'Xalapa' },
    { prefix: '914',  name: 'Xalapa' },
];

function getMunicipioFromZip(zip: string): string | null {
    if (zip.length !== 5) return null;
    return (
        CP_MAP.find(e => e.prefix === zip.slice(0, 4))?.name ??
        CP_MAP.find(e => e.prefix === zip.slice(0, 3))?.name ??
        null
    );
}

const today = new Date();
const MAX_DATE = new Date(today.getFullYear() - 18,  today.getMonth(), today.getDate()).toISOString().split('T')[0];
const MIN_DATE = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()).toISOString().split('T')[0];

export function EmpresaKycPage() {
    const navigate = useNavigate();
    const [kycData, setKycData]             = useState<KycStatusResponse | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [step, setStep]                   = useState(0);
    const [submitting, setSubmitting]       = useState(false);
    const [success, setSuccess]             = useState(false);
    const [error, setError]                 = useState<string | null>(null);
    const [touched, setTouched]             = useState<Record<string, boolean>>({});

    const [form, setForm] = useState({
        owner_full_name: '',
        owner_birth_date: '',
        owner_curp: '',
        owner_rfc: '',
        owner_street: '',
        owner_colonia: '',
        owner_municipio: '',
        owner_zip: '',
    });

    const [ineFront, setIneFront]         = useState<File | null>(null);
    const [ineBack, setIneBack]           = useState<File | null>(null);
    const [addressProof, setAddressProof] = useState<File | null>(null);

    const markTouched = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

    const fieldStatus = (name: string, value: string): 'valid' | 'invalid' | null => {
        if (!touched[name]) return null;
        switch (name) {
            case 'owner_full_name': return value.trim().length > 0 ? 'valid' : 'invalid';
            case 'owner_curp':      return CURP_RE.test(value) ? 'valid' : 'invalid';
            case 'owner_rfc':       return RFC_RE.test(value) ? 'valid' : 'invalid';
            case 'owner_birth_date': {
                if (!value) return 'invalid';
                return value >= MIN_DATE && value <= MAX_DATE ? 'valid' : 'invalid';
            }
            case 'owner_street':   return value.trim().length > 0 ? 'valid' : 'invalid';
            case 'owner_colonia':  return value.trim().length > 0 ? 'valid' : 'invalid';
            case 'owner_municipio': return value.trim().length > 0 ? 'valid' : 'invalid';
            case 'owner_zip':      return ZIP_RE.test(value) ? 'valid' : 'invalid';
            default:               return null;
        }
    };

    const loadStatus = useCallback(async () => {
        try {
            const data = await empresaApi.getKycStatus();
            setKycData(data);
            if (data.verification) {
                const v = data.verification;
                setForm({
                    owner_full_name:  v.owner_full_name  ?? '',
                    owner_birth_date: v.owner_birth_date ?? '',
                    owner_curp:       v.owner_curp       ?? '',
                    owner_rfc:        v.owner_rfc        ?? '',
                    owner_street:     v.owner_street     ?? '',
                    owner_colonia:    v.owner_colonia    ?? '',
                    owner_municipio:  v.owner_municipio  ?? '',
                    owner_zip:        v.owner_zip        ?? '',
                });
            }
        } catch {
            /* no-op */
        } finally {
            setLoadingStatus(false);
        }
    }, []);

    useEffect(() => {
        void loadStatus();
    }, [loadStatus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name;
        let val = e.target.value;
        if (name === 'owner_full_name') {
            val = val.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s''.-]/g, '');
        } else if (name === 'owner_curp') {
            val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
        } else if (name === 'owner_rfc') {
            val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 13);
        } else if (name === 'owner_zip') {
            val = val.replace(/\D/g, '').slice(0, 5);
            const muni = getMunicipioFromZip(val);
            if (muni) {
                setForm(prev => ({ ...prev, owner_zip: val, owner_municipio: muni }));
                markTouched('owner_zip');
                markTouched('owner_municipio');
                return;
            }
        }
        setForm(prev => ({ ...prev, [name]: val }));
    };

    const validateStep = (): string | null => {
        if (step === 0 && !form.owner_full_name.trim())
            return 'El nombre completo es requerido.';
        if (step === 1 && !form.owner_street.trim())
            return 'La calle y número son requeridos.';
        if (step === 2) {
            const hasFront = ineFront !== null || !!kycData?.verification?.ine_front_url;
            const hasBack  = ineBack  !== null || !!kycData?.verification?.ine_back_url;
            if (!hasFront || !hasBack)
                return 'Sube el INE frente y reverso para enviar tu solicitud.';
        }
        return null;
    };

    const handleNext = () => {
        const err = validateStep();
        if (err) { setError(err); return; }
        setError(null);
        setStep(s => s + 1);
    };

    const handleBack = () => {
        setError(null);
        if (step === 0) navigate(-1);
        else setStep(s => s - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 2) { handleNext(); return; }
        const err = validateStep();
        if (err) { setError(err); return; }
        setError(null);

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        if (ineFront)     fd.append('ine_front',     ineFront);
        if (ineBack)      fd.append('ine_back',      ineBack);
        if (addressProof) fd.append('address_proof', addressProof);

        setSubmitting(true);
        try {
            await empresaApi.submitKyc(fd);
            setSuccess(true);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Error al enviar documentos. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingStatus) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin" style={{ color: PURPLE }} />
            </div>
        );
    }

    if (success) {
        return <SuccessScreen onBack={() => navigate('/empresa/dashboard')} />;
    }

    const isReadOnly = kycData?.status === 'active';

    return (
        <div className="max-w-2xl mx-auto pb-10">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center justify-center size-9 rounded-xl border transition-colors hover:opacity-80"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                >
                    <ArrowLeft className="size-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                        Verificación de identidad
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                        Completa tu información para activar tu cuenta
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void loadStatus()}
                    className="flex items-center justify-center size-9 rounded-xl border transition-colors hover:opacity-80"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    title="Actualizar estado"
                >
                    <RefreshCw className="size-4" />
                </button>
            </div>

            {/* Status banner */}
            {kycData && <StatusBanner kyc={kycData} />}

            {/* Progress */}
            {!isReadOnly && <ProgressSteps current={step} />}

            {/* Content */}
            {isReadOnly ? (

                /* -- Read-only (verified) ----------------------------------- */
                <div className="space-y-4">
                    <SectionCard icon={User} title="Datos del propietario">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {[
                                { label: 'Nombre', value: form.owner_full_name },
                                { label: 'Fecha nacimiento', value: form.owner_birth_date
                                    ? new Date(form.owner_birth_date + 'T00:00:00').toLocaleDateString('es-MX')
                                    : '' },
                                { label: 'CURP', value: form.owner_curp },
                                { label: 'RFC', value: form.owner_rfc },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-xs uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                                    <p className="text-sm font-medium" style={{ color: value ? 'var(--color-text)' : 'var(--color-text-alt)', opacity: value ? 1 : 0.4 }}>
                                        {value || '—'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard icon={MapPin} title="Domicilio">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {[
                                { label: 'Calle y número', value: form.owner_street },
                                { label: 'Colonia', value: form.owner_colonia },
                                { label: 'Municipio', value: form.owner_municipio },
                                { label: 'Estado', value: 'Veracruz' },
                                { label: 'CP', value: form.owner_zip },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-xs uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                                    <p className="text-sm font-medium" style={{ color: value ? 'var(--color-text)' : 'var(--color-text-alt)', opacity: value ? 1 : 0.4 }}>
                                        {value || '—'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard icon={CreditCard} title="Documentos">
                        <div className="flex gap-3">
                            {[
                                { label: 'INE frente', url: kycData?.verification?.ine_front_url },
                                { label: 'INE reverso', url: kycData?.verification?.ine_back_url },
                                { label: 'Comprobante', url: kycData?.verification?.address_proof_url },
                            ].map(({ label, url }) => (
                                <div key={label} className="flex-1 rounded-xl border px-3 py-2.5 text-center text-xs"
                                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-alt)' }}>
                                    <p className="font-semibold mb-1" style={{ color: 'var(--color-text-alt)' }}>{label}</p>
                                    {url
                                        ? <a href={url} target="_blank" rel="noreferrer" className="font-medium hover:underline" style={{ color: PURPLE }}>Ver archivo</a>
                                        : <span style={{ color: 'var(--color-text-alt)', opacity: 0.4 }}>No subido</span>
                                    }
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

            ) : (

                /* -- Editable form (pending / submitted / rejected) ------- */
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Step 0 — Datos personales */}
                    {step === 0 && (
                        <SectionCard icon={User} title="Datos del propietario" subtitle="Ingresa los datos tal como aparecen en tu INE">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Nombre completo" name="owner_full_name" value={form.owner_full_name}
                                    onChange={handleChange}
                                    onBlur={() => markTouched('owner_full_name')}
                                    status={fieldStatus('owner_full_name', form.owner_full_name)}
                                    placeholder="Como aparece en tu INE" required full />
                                <Field label="Fecha de nacimiento" name="owner_birth_date" value={form.owner_birth_date}
                                    onChange={handleChange}
                                    onBlur={() => markTouched('owner_birth_date')}
                                    status={fieldStatus('owner_birth_date', form.owner_birth_date)}
                                    type="date" min={MIN_DATE} max={MAX_DATE} />
                                <Field label="CURP" name="owner_curp" value={form.owner_curp}
                                    onChange={handleChange}
                                    onBlur={() => markTouched('owner_curp')}
                                    status={fieldStatus('owner_curp', form.owner_curp)}
                                    placeholder="AAAA000000HXXXXX00" />
                                <Field label="RFC" name="owner_rfc" value={form.owner_rfc}
                                    onChange={handleChange}
                                    onBlur={() => markTouched('owner_rfc')}
                                    status={fieldStatus('owner_rfc', form.owner_rfc)}
                                    placeholder="XXXX000000XXX" />
                            </div>
                        </SectionCard>
                    )}

                    {/* Step 1 — Domicilio */}
                    {step === 1 && (
                        <SectionCard icon={MapPin} title="Domicilio del propietario" subtitle="Debe coincidir con el comprobante de domicilio">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Calle y número" name="owner_street" value={form.owner_street}
                                    onChange={handleChange}
                                    onBlur={() => markTouched('owner_street')}
                                    status={fieldStatus('owner_street', form.owner_street)}
                                    placeholder="Av. Juárez 123 int. 4" required full />
                                <Field label="Colonia" name="owner_colonia" value={form.owner_colonia}
                                    onChange={handleChange}
                                    onBlur={() => markTouched('owner_colonia')}
                                    status={fieldStatus('owner_colonia', form.owner_colonia)}
                                    placeholder="Centro Histórico" />
                                <Field label="Código postal" name="owner_zip" value={form.owner_zip}
                                    onChange={handleChange}
                                    onBlur={() => markTouched('owner_zip')}
                                    status={fieldStatus('owner_zip', form.owner_zip)}
                                    placeholder="91000" />
                                <MunicipioSelect value={form.owner_municipio}
                                    onChange={v => { setForm(f => ({ ...f, owner_municipio: v })); markTouched('owner_municipio'); }}
                                    onBlur={() => markTouched('owner_municipio')}
                                    status={fieldStatus('owner_municipio', form.owner_municipio)}
                                    required locations={MUNICIPIOS} />
                                {/* Estado is always Veracruz — shown read-only */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                                        style={{ color: 'var(--color-text-alt)' }}>Estado</label>
                                    <div className="rounded-2xl px-4 py-2.5 text-sm cursor-not-allowed"
                                        style={{
                                            background: 'var(--color-bg-alt)',
                                            border: '1px solid var(--color-border)',
                                            color: 'var(--color-text-alt)',
                                            opacity: 0.65,
                                        }}>
                                        Veracruz
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* Step 2 — Documentos */}
                    {step === 2 && (
                        <SectionCard icon={CreditCard} title="Documentos de identidad"
                            subtitle="Imágenes claras sin reflejos">

                            {kycData?.verification && (kycData.verification.ine_front_url || kycData.verification.ine_back_url || kycData.verification.address_proof_url) && (
                                <div className="mb-4 rounded-2xl border px-4 py-3"
                                    style={{ background: `${WARNING}08`, borderColor: `${WARNING}25` }}>
                                    <p className="text-xs font-semibold mb-2" style={{ color: WARNING }}>
                                        Documentos actuales — puedes reemplazar los que necesites
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { label: 'INE frente', url: kycData.verification.ine_front_url },
                                            { label: 'INE reverso', url: kycData.verification.ine_back_url },
                                            { label: 'Comprobante', url: kycData.verification.address_proof_url },
                                        ].map(({ label, url }) => url ? (
                                            <a key={label} href={url} target="_blank" rel="noreferrer"
                                                className="text-xs font-medium rounded-xl border px-3 py-1 hover:underline"
                                                style={{ borderColor: 'var(--color-border)', color: PURPLE, background: 'var(--color-bg)' }}>
                                                {label} ?
                                            </a>
                                        ) : null)}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <FileUploadField label={`INE — Frente${kycData?.verification?.ine_front_url ? ' (opcional: reemplazar)' : ''}`}
                                    hint="Cara con fotografía y nombre completo" value={ineFront} onChange={setIneFront} />
                                <FileUploadField label={`INE — Reverso${kycData?.verification?.ine_back_url ? ' (opcional: reemplazar)' : ''}`}
                                    hint="Cara con firma, huella y código QR" value={ineBack} onChange={setIneBack} />
                                <FileUploadField label={`Comprobante de domicilio${kycData?.verification?.address_proof_url ? ' (opcional: reemplazar)' : ''}`}
                                    hint="No mayor a 3 meses · CFE, agua, teléfono o estado de cuenta bancario"
                                    value={addressProof} onChange={setAddressProof} />
                            </div>
                        </SectionCard>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
                            style={{ background: `${DANGER}08`, borderColor: `${DANGER}30`, color: DANGER }}>
                            <AlertTriangle className="size-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors hover:opacity-80"
                            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-alt)', background: 'var(--color-bg)' }}
                        >
                            {step === 0 ? 'Cancelar' : '? Anterior'}
                        </button>

                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: PURPLE }}
                            >
                                Siguiente ?
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={submitting || (
                                    (ineFront === null && !kycData?.verification?.ine_front_url) ||
                                    (ineBack  === null && !kycData?.verification?.ine_back_url)
                                )}
                                className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ backgroundColor: PURPLE }}
                            >
                                {submitting && <Loader2 className="size-4 animate-spin" />}
                                {submitting
                                    ? 'Enviando...'
                                    : kycData?.verification
                                        ? <><RotateCcw className="size-4" /> Actualizar y reenviar</>
                                        : 'Enviar para revisión'
                                }
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
