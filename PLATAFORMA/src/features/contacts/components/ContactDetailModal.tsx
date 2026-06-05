import { useState, useMemo } from 'react';
import { X, Mail, Globe, Calendar } from 'lucide-react';
import type { ContactSubscription, ContactStatus } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey';

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

function formatDate(iso: string, locale: string) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

interface Props {
    contact: ContactSubscription;
    onClose: () => void;
    onStatusChange: (id: number, status: ContactStatus) => Promise<void>;
}

export default function ContactDetailModal({ contact, onClose, onStatusChange }: Props) {
    useEscapeKey(onClose);
    const { lang } = useLanguage();
    const copy = useMemo(() => getDashboardText(lang).modules.contacts, [lang]);
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
    const sourceLabel = copy.sourceLabels[contact.source] ?? contact.source;
    const reasonLabel = copy.reasonLabels[reasonKey] ?? contact.reason;

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
                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{sourceLabel}</p>
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
                                {reasonLabel}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            <Globe className="size-3.5" />
                            {sourceLabel}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                            <Calendar className="size-3.5" />
                            {formatDate(contact.created_at, getDashboardText(lang).locale)}
                        </span>
                    </div>

                    {/* Message */}
                    {contact.message ? (
                        <div className="rounded-xl border p-4" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                            <p className="mb-1 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>{copy.detailMessageLabel}</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                                {contact.message}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm italic" style={{ color: 'var(--color-text-alt)' }}>{copy.detailNoMessage}</p>
                    )}

                    {/* Status selector */}
                    <div>
                        <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--color-text-alt)' }}>{copy.detailStatusLabel}</p>
                        <div className="flex flex-wrap gap-2">
                            {(Object.entries(copy.statusLabels) as [ContactStatus, string][]).map(([val, label]) => (
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
                        {copy.detailClose}
                    </button>
                </div>
            </div>
        </div>
    );
}
