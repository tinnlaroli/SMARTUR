import { useState } from 'react';
import { Bell, Send, Users, Building2, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import api from '../../../services/api';

type Target = 'all' | 'user' | 'empresa';

interface SendPayload {
    title: string;
    body: string;
    target: Target;
}

interface SendResult {
    message: string;
    successCount: number;
    failureCount: number;
}

const TARGET_OPTIONS: { value: Target; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'all',     label: 'Todos los usuarios',     description: 'Turistas + Empresas',       icon: Globe },
    { value: 'user',    label: 'Solo turistas',           description: 'Usuarios con role_id = 2', icon: Users },
    { value: 'empresa', label: 'Solo empresas',           description: 'Usuarios con role_id = 3', icon: Building2 },
];

export function NotificacionesPage() {
    const { locale } = useLanguage();
    const [title, setTitle]   = useState('');
    const [body, setBody]     = useState('');
    const [target, setTarget] = useState<Target>('all');
    const [loading, setLoading]   = useState(false);
    const [result, setResult]     = useState<SendResult | null>(null);
    const [error, setError]       = useState<string | null>(null);

    const _ = locale; // suppress unused-var lint

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            setError('El título y el mensaje son obligatorios.');
            return;
        }
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const payload: SendPayload = { title: title.trim(), body: body.trim(), target };
            const res = await api.post<SendResult>('/api/v2/admin/notifications/send', payload);
            setResult(res.data);
            setTitle('');
            setBody('');
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Error al enviar.')
                    : 'Error al enviar.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ background: 'var(--color-purple)1a' }}
                >
                    <Bell className="size-5" style={{ color: 'var(--color-purple)' }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                        Notificaciones Push
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        Envía notificaciones FCM a usuarios de la app SMARTUR
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* ── Formulario ── */}
                <div
                    className="rounded-2xl border p-6 space-y-5"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                        Redactar mensaje
                    </h2>

                    {/* Título */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            Título <span style={{ color: 'var(--color-pink)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={60}
                            placeholder="Ej: ¡Nueva ruta disponible en Orizaba!"
                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                        <p className="text-right text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                            {title.length}/60
                        </p>
                    </div>

                    {/* Cuerpo */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            Mensaje <span style={{ color: 'var(--color-pink)' }}>*</span>
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={4}
                            maxLength={200}
                            placeholder="Ej: Descubre los nuevos lugares registrados esta semana en la región de las Altas Montañas…"
                            className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                            style={{
                                background: 'var(--color-bg-alt)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                        <p className="text-right text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                            {body.length}/200
                        </p>
                    </div>

                    {/* Destinatarios */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            Destinatarios
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {TARGET_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = target === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setTarget(opt.value)}
                                        className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all"
                                        style={{
                                            background: isSelected ? 'var(--color-purple)14' : 'var(--color-bg-alt)',
                                            borderColor: isSelected ? 'var(--color-purple)' : 'var(--color-border)',
                                            color: 'var(--color-text)',
                                        }}
                                    >
                                        <Icon
                                            className="size-4 shrink-0"
                                            style={{ color: isSelected ? 'var(--color-purple)' : 'var(--color-text-alt)' }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">{opt.label}</p>
                                            <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                                                {opt.description}
                                            </p>
                                        </div>
                                        <div
                                            className="size-4 shrink-0 rounded-full border-2 flex items-center justify-center"
                                            style={{
                                                borderColor: isSelected ? 'var(--color-purple)' : 'var(--color-border)',
                                                background: isSelected ? 'var(--color-purple)' : 'transparent',
                                            }}
                                        >
                                            {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Botón enviar */}
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={loading || !title.trim() || !body.trim()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'var(--color-purple)' }}
                    >
                        {loading ? (
                            <><Loader2 className="size-4 animate-spin" /> Enviando…</>
                        ) : (
                            <><Send className="size-4" /> Enviar notificación</>
                        )}
                    </button>

                    {/* Feedback */}
                    {error && (
                        <div
                            className="flex items-start gap-2 rounded-xl border p-3 text-sm"
                            style={{ background: 'var(--color-pink)10', borderColor: 'var(--color-pink)40', color: 'var(--color-pink)' }}
                        >
                            <AlertCircle className="size-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {result && (
                        <div
                            className="rounded-xl border p-4 space-y-2"
                            style={{ background: '#10b98114', borderColor: '#10b98140' }}
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 shrink-0" style={{ color: '#10b981' }} />
                                <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                                    Notificación enviada
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                <div>
                                    <span className="font-semibold text-lg" style={{ color: '#10b981' }}>
                                        {result.successCount}
                                    </span>
                                    <span className="ml-1">enviados</span>
                                </div>
                                {result.failureCount > 0 && (
                                    <div>
                                        <span className="font-semibold text-lg" style={{ color: 'var(--color-pink)' }}>
                                            {result.failureCount}
                                        </span>
                                        <span className="ml-1">fallidos</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Panel de info / preview ── */}
                <div className="space-y-4">
                    {/* Preview */}
                    <div
                        className="rounded-2xl border p-6 space-y-3"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                            Vista previa
                        </h2>
                        <div
                            className="rounded-2xl border p-4 space-y-1.5"
                            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                        >
                            {/* Notification bar mockup */}
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex size-7 items-center justify-center rounded-lg shrink-0"
                                    style={{ background: 'var(--color-purple)' }}
                                >
                                    <Bell className="size-3.5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                        {title || 'Título de la notificación'}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                        SMARTUR · ahora
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs pl-9 line-clamp-2" style={{ color: 'var(--color-text-alt)' }}>
                                {body || 'Aquí aparecerá el cuerpo de tu mensaje…'}
                            </p>
                        </div>
                    </div>

                    {/* Info / advertencia */}
                    <div
                        className="rounded-2xl border p-6 space-y-3"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                            Cómo funciona
                        </h2>
                        <ul className="space-y-3 text-sm" style={{ color: 'var(--color-text)' }}>
                            {[
                                { step: '1', text: 'La notificación se envía a todos los dispositivos registrados del grupo seleccionado.' },
                                { step: '2', text: 'Los tokens FCM se obtienen de la tabla device_token de la base de datos.' },
                                { step: '3', text: 'Si un token es inválido, se registra como fallo pero no detiene el envío masivo.' },
                                { step: '4', text: 'Los usuarios deben haber iniciado sesión al menos una vez desde la app y haber aceptado los permisos de notificación.' },
                            ].map((item) => (
                                <li key={item.step} className="flex items-start gap-3">
                                    <span
                                        className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                        style={{ background: 'var(--color-purple)' }}
                                    >
                                        {item.step}
                                    </span>
                                    <span style={{ color: 'var(--color-text-alt)' }}>{item.text}</span>
                                </li>
                            ))}
                        </ul>

                        <div
                            className="mt-2 flex items-start gap-2 rounded-xl border p-3 text-xs"
                            style={{ background: '#f59e0b10', borderColor: '#f59e0b30', color: '#f59e0b' }}
                        >
                            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                            <span>
                                Para que FCM funcione en el servidor, la variable de entorno{' '}
                                <code className="font-mono">FIREBASE_SERVICE_ACCOUNT</code> debe estar
                                configurada en el VPS con el JSON de la cuenta de servicio en base64.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
