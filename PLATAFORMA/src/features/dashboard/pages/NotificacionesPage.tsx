import { useState, useRef } from 'react';
import {
    Bell, Send, Users, Building2, Globe,
    CheckCircle2, AlertCircle, Loader2,
    Clock, Trash2, WifiOff,
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { api } from '../../../shared/api/axiosClient';

// ── Types ────────────────────────────────────────────────────────────────────

type Target = 'all' | 'user' | 'empresa';

interface SendPayload  { title: string; body: string; target: Target; }
interface SendResult   { message: string; successCount: number; failureCount: number; }

interface HistoryEntry {
    id:           number;
    sentAt:       Date;
    title:        string;
    body:         string;
    target:       Target;
    successCount: number;
    failureCount: number;
    status:       'ok' | 'partial' | 'error';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date, justNowText = 'hace un momento'): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)  return justNowText;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function entryStatus(s: number, f: number): HistoryEntry['status'] {
    if (f === 0) return 'ok';
    if (s === 0) return 'error';
    return 'partial';
}

// ── Component ────────────────────────────────────────────────────────────────

export function NotificacionesPage() {
    const { t } = useLanguage();

    const [title,   setTitle]   = useState('');
    const [body,    setBody]    = useState('');
    const [target,  setTarget]  = useState<Target>('all');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const nextIdRef = useRef(0);

    const TARGET_OPTIONS: {
        value:       Target;
        label:       string;
        description: string;
        icon:        React.ComponentType<{ className?: string }>;
    }[] = [
        { value: 'all',     label: t('notifications.allUsers'), description: t('notifications.touristsAndCompanies'), icon: Globe     },
        { value: 'user',    label: t('notifications.onlyTourists'),       description: t('notifications.touristDesc'),  icon: Users     },
        { value: 'empresa', label: t('notifications.onlyCompanies'),       description: t('notifications.companyDesc'), icon: Building2 },
    ];

    const TARGET_LABEL: Record<Target, string> = {
        all:     t('filter.all'),
        user:    t('notifications.tourists'),
        empresa: t('notifications.companies'),
    };

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            setError(t('notifications.requiredFields'));
            return;
        }
        setLoading(true);
        setError(null);

        const sentTitle  = title.trim();
        const sentBody   = body.trim();
        const sentTarget = target;

        try {
            const payload: SendPayload = { title: sentTitle, body: sentBody, target: sentTarget };
            const res = await api.post<SendResult>('/admin/notifications/send', payload);
            const { successCount, failureCount } = res.data;

            setHistory(prev => [{
                id:    Date.now() + nextIdRef.current++,
                sentAt: new Date(),
                title:  sentTitle,
                body:   sentBody,
                target: sentTarget,
                successCount,
                failureCount,
                status: entryStatus(successCount, failureCount),
            }, ...prev].slice(0, 50));

            setTitle('');
            setBody('');
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('notifications.sendError'))
                    : t('notifications.sendError');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ background: 'color-mix(in srgb, var(--color-purple) 15%, transparent)' }}
                >
                    <Bell className="size-5" style={{ color: 'var(--color-purple)' }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                        {t('notifications.title')}
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {t('notifications.description')}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

                {/* ── Columna izquierda: formulario ───────────────────────── */}
                <div className="space-y-4">
                    <div
                        className="rounded-2xl border p-6 space-y-5"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                            {t('notifications.composeTitle')}
                        </h2>

                        {/* Título */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                                {t('notifications.titleLabel')} <span style={{ color: 'var(--color-pink)' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={60}
                                placeholder={t('notifications.titlePh')}
                                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                                style={{
                                    background:   'var(--color-bg-alt)',
                                    borderColor:  'var(--color-border)',
                                    color:        'var(--color-text)',
                                }}
                            />
                            <p className="text-right text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                                {title.length}/60
                            </p>
                        </div>

                        {/* Cuerpo */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                                {t('notifications.messageLabel')} <span style={{ color: 'var(--color-pink)' }}>*</span>
                            </label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={4}
                                maxLength={200}
                                placeholder={t('notifications.messagePh')}
                                className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                                style={{
                                    background:  'var(--color-bg-alt)',
                                    borderColor: 'var(--color-border)',
                                    color:       'var(--color-text)',
                                }}
                            />
                            <p className="text-right text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                                {body.length}/200
                            </p>
                        </div>

                        {/* Destinatarios */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                                {t('notifications.recipientsLabel')}
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {TARGET_OPTIONS.map((opt) => {
                                    const Icon       = opt.icon;
                                    const isSelected = target === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setTarget(opt.value)}
                                            className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all"
                                            style={{
                                                background:  isSelected
                                                    ? 'color-mix(in srgb, var(--color-purple) 8%, transparent)'
                                                    : 'var(--color-bg-alt)',
                                                borderColor: isSelected ? 'var(--color-purple)' : 'var(--color-border)',
                                                color:       'var(--color-text)',
                                            }}
                                        >
                                            <span style={{ color: isSelected ? 'var(--color-purple)' : 'var(--color-text-alt)' }}>
                                                <Icon className="size-4 shrink-0" />
                                            </span>
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
                                                    background:  isSelected ? 'var(--color-purple)'  : 'transparent',
                                                }}
                                            >
                                                {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Botón */}
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={loading || !title.trim() || !body.trim()}
                            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'var(--color-purple)' }}
                        >
                            {loading
                                ? <><Loader2 className="size-4 animate-spin" /> {t('notifications.sending')}</>
                                : <><Send className="size-4" /> {t('notifications.send')}</>}
                        </button>

                        {/* Error */}
                        {error && (
                            <div
                                className="flex items-start gap-2 rounded-xl border p-3 text-sm"
                                style={{
                                    background:  'color-mix(in srgb, var(--color-pink) 8%, transparent)',
                                    borderColor: 'color-mix(in srgb, var(--color-pink) 30%, transparent)',
                                    color:       'var(--color-pink)',
                                }}
                            >
                                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                </div>

                {/* ── Columna derecha: vista previa + historial ───────────── */}
                <div className="flex flex-col gap-4">

                    {/* Vista previa */}
                    <div
                        className="rounded-2xl border p-5 space-y-3"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                            {t('notifications.preview')}
                        </h2>
                        <div
                            className="rounded-2xl border p-4 space-y-1.5"
                            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex size-7 items-center justify-center rounded-lg shrink-0"
                                    style={{ background: 'var(--color-purple)' }}
                                >
                                    <Bell className="size-3.5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                        {title || t('notifications.previewTitle')}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                        WELLTUR · {t('notifications.now')}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs pl-9 line-clamp-2" style={{ color: 'var(--color-text-alt)' }}>
                                {body || t('notifications.previewBody')}
                            </p>
                        </div>
                    </div>

                {/* Historial */}
                <div
                    className="rounded-2xl border flex flex-col flex-1"
                    style={{
                        background:  'var(--color-bg)',
                        borderColor: 'var(--color-border)',
                        minHeight:   '360px',
                    }}
                >
                    {/* Cabecera historial */}
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="size-4" style={{ color: 'var(--color-text-alt)' }} />
                            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-alt)' }}>
                                {t('notifications.history')}
                            </h2>
                            {history.length > 0 && (
                                <span
                                    className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    style={{ background: 'var(--color-purple)' }}
                                >
                                    {history.length}
                                </span>
                            )}
                        </div>
                        {history.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setHistory([])}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-70"
                                style={{ color: 'var(--color-text-alt)' }}
                            >
                                <Trash2 className="size-3" />
                                {t('notifications.clear')}
                            </button>
                        )}
                    </div>

                    {/* Lista */}
                    <div className="flex-1 overflow-y-auto">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center" style={{ color: 'var(--color-text-alt)' }}>
                                <Bell className="size-8 opacity-20" />
                                <p className="text-sm">{t('notifications.historyEmpty')}</p>
                                <p className="text-xs opacity-60">{t('notifications.historyHint')}</p>
                            </div>
                        ) : (
                            <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                                {history.map((entry) => {
                                    const total       = entry.successCount + entry.failureCount;
                                    const deliveryPct = total > 0 ? Math.round((entry.successCount / total) * 100) : 0;
                                    const TargetIcon  = TARGET_OPTIONS.find(o => o.value === entry.target)?.icon ?? Globe;

                                    const statusColor =
                                        entry.status === 'ok'      ? '#10b981' :
                                        entry.status === 'partial'  ? '#f59e0b' : 'var(--color-pink)';

                                    const StatusIcon =
                                        entry.status === 'ok'     ? CheckCircle2 :
                                        entry.status === 'partial' ? AlertCircle  : WifiOff;

                                    return (
                                        <li key={entry.id} className="px-6 py-4 space-y-2.5">
                                            {/* Fila superior: ícono estado + título + hora */}
                                            <div className="flex items-start gap-2.5">
                                                <StatusIcon
                                                    className="size-4 mt-0.5 shrink-0"
                                                    style={{ color: statusColor }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium leading-snug truncate" style={{ color: 'var(--color-text)' }}>
                                                        {entry.title}
                                                    </p>
                                                    <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: 'var(--color-text-alt)' }}>
                                                        {entry.body}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-alt)' }}>
                                                    {timeAgo(entry.sentAt, t('notifications.justNow'))}
                                                </span>
                                            </div>

                                            {/* Barra de entrega */}
                                            {total > 0 && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                                                        <div className="flex items-center gap-1">
                                                            <TargetIcon className="size-3" />
                                                            <span>{TARGET_LABEL[entry.target]}</span>
                                                        </div>
                                                        <span style={{ color: statusColor }} className="font-semibold">
                                                            {entry.successCount}/{total} {t('notifications.delivered')}
                                                        </span>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div
                                                        className="h-1.5 w-full rounded-full overflow-hidden"
                                                        style={{ background: 'var(--color-border)' }}
                                                    >
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width:      `${deliveryPct}%`,
                                                                background: statusColor,
                                                            }}
                                                        />
                                                    </div>
                                                    {entry.failureCount > 0 && (
                                                        <p className="text-[10px]" style={{ color: 'var(--color-text-alt)' }}>
                                                            {entry.failureCount} {entry.failureCount !== 1 ? t('notifications.devicesNotReached') : t('notifications.deviceNotReached')}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Footer con nota */}
                    <div
                        className="px-6 py-3 border-t flex items-center gap-2 text-[10px]"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                    >
                        <CheckCircle2 className="size-3 shrink-0" style={{ color: '#10b981' }} />
                        <span>{t('notifications.footerNote')}</span>
                    </div>
                </div>{/* fin historial */}

                </div>{/* fin columna derecha */}

            </div>
        </div>
    );
}
