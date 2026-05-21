import { useState } from 'react';
import { X, Mail, Globe, Calendar } from 'lucide-react';
import type { ContactSubscription, ContactStatus } from '../types/types';

const STATUS_LABEL: Record<ContactStatus, string> = {
    pending: 'Pendiente',
    in_progress: 'En atención',
    done: 'Resuelto',
    dismissed: 'Descartado',
};

const STATUS_STYLE: Record<ContactStatus, { bg: string; color: string }> = {
    pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#d97706' },
    in_progress: { bg: 'rgba(6,182,212,0.12)',   color: '#0891b2' },
    done:        { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    dismissed:   { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
};

const REASON_COLOR: Record<string, string> = {
    download: 'rgba(239,68,68,0.12)',
    join: 'rgba(109,40,217,0.12)',
    tourist: 'rgba(16,185,129,0.12)',
    pricing: 'rgba(245,158,11,0.12)',
    evaluation: 'rgba(6,182,212,0.12)',
    suggestion: 'rgba(99,102,241,0.12)',
    other: 'rgba(107,114,128,0.12)',
};

const REASON_TEXT: Record<string, string> = {
    download: '#ef4444',
    join: '#7c3aed',
    tourist: '#10b981',
    pricing: '#d97706',
    evaluation: '#0891b2',
    suggestion: '#6366f1',
    other: '#6b7280',
};

const SOURCE_LABEL: Record<string, string> = {
    landing_b2b: 'Landing B2B',
    landing_turista: 'Landing Turista',
    plataforma_contact: 'Plataforma',
    dashboard: 'Dashboard',
};

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

interface Props {
    contact: ContactSubscription;
    onClose: () => void;
    onStatusChange: (id: number, status: ContactStatus) => Promise<void>;
}

export default function ContactDetailModal({ contact, onClose, onStatusChange }: Props) {
    const [status, setStatus] = useState<ContactStatus>(contact.status);
    const [saving, setSaving] = useState(false);

    const handleStatusChange = async (newStatus: ContactStatus) => {
        setStatus(newStatus);
        setSaving(true);
        await onStatusChange(contact.id, newStatus);
        setSaving(false);
    };

    const reasonKey = contact.reason ?? '';
    const statusStyle = STATUS_STYLE[status];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border shadow-2xl" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                {/* Header */}
                <div className="flex items-start justify-between border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: 'rgba(16,185,129,0.12)' }}>
                            <Mail className="size-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{contact.email}</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{SOURCE_LABEL[contact.source] ?? contact.source}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800" style={{ color: 'var(--color-text-alt)' }}>
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {contact.reason && (
                            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: REASON_COLOR[reasonKey] ?? 'rgba(107,114,128,0.1)', color: REASON_TEXT[reasonKey] ?? '#6b7280' }}>
                                {contact.reason}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            <Globe className="size-3.5" />
                            {SOURCE_LABEL[contact.source] ?? contact.source}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            <Calendar className="size-3.5" />
                            {formatDate(contact.created_at)}
                        </span>
                    </div>

                    {/* Message */}
                    {contact.message ? (
                        <div className="rounded-xl border p-4" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                            <p className="mb-1 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Mensaje</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                                {contact.message}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm italic" style={{ color: 'var(--color-text-alt)' }}>Sin mensaje adjunto.</p>
                    )}

                    {/* Status selector */}
                    <div>
                        <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>Estado de atención</p>
                        <div className="flex flex-wrap gap-2">
                            {(Object.entries(STATUS_LABEL) as [ContactStatus, string][]).map(([val, label]) => (
                                <button
                                    key={val}
                                    type="button"
                                    disabled={saving}
                                    onClick={() => handleStatusChange(val)}
                                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                                    style={status === val ? { background: statusStyle.bg, color: statusStyle.color, outline: `2px solid ${statusStyle.color}`, outlineOffset: '1px' } : { background: STATUS_STYLE[val].bg, color: STATUS_STYLE[val].color }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
                    <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
