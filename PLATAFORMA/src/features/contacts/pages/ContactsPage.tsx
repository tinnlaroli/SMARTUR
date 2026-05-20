import { useEffect, useState } from 'react';
import { useContacts } from '../hooks/useContacts';
import { Mail, Trash2, Globe, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { useToast } from '../../../shared/context/ToastContext';

const LIMIT = 20;

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

const SOURCE_LABEL: Record<string, string> = {
    landing_b2b: 'Landing B2B',
    landing_turista: 'Landing Turista',
    dashboard: 'Dashboard',
};

export const ContactsPage = () => {
    const { subscriptions, isLoading, totalPages, totalRecords, fetchSubscriptions, deleteSubscription } = useContacts();
    const [searchParams, setSearchParams] = useSearchParams();
    const toast = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const page = Number(searchParams.get('page')) || 1;

    useEffect(() => { fetchSubscriptions(page, LIMIT); }, [page, fetchSubscriptions]);

    const handleDelete = async (id: number, email: string) => {
        if (!window.confirm(`¿Eliminar la suscripción de "${email}"?`)) return;
        setDeletingId(id);
        try {
            await deleteSubscription(id);
            toast.success('Suscripción eliminada', `${email} fue eliminado de la lista.`);
        } catch {
            toast.error('Error', 'No se pudo eliminar la suscripción.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6" id="contactos-module">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600">
                        <Mail className="size-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                            Contactos & Suscripciones
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            Correos capturados desde los formularios de contacto
                        </p>
                    </div>
                </div>
                <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                    {totalRecords} registros
                </span>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <Globe className="size-5 mt-0.5 shrink-0 text-emerald-500" />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>¿De dónde vienen estos registros?</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Los correos se capturan cuando un visitante envía el formulario de contacto desde la landing B2B
                        o la landing turista. Puedes usarlos para campañas de email marketing o seguimiento.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(['landing_b2b', 'landing_turista', 'dashboard'] as const).map((src) => {
                    const count = subscriptions.filter((s) => s.source === src).length;
                    return (
                        <div key={src} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
                            <LayoutGrid className="size-4 text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{count}</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{SOURCE_LABEL[src]}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Table */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>Correo</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>Fuente</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-alt)' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b animate-pulse" style={{ borderColor: 'var(--color-border)' }}>
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 rounded" style={{ background: 'var(--color-border)', width: j === 1 ? '60%' : '40%' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Mail className="size-10 mx-auto mb-3" style={{ color: 'var(--color-border)' }} />
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>Sin suscripciones todavía</p>
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.map((sub, i) => (
                                    <tr
                                        key={sub.id}
                                        className="border-b transition-colors"
                                        style={{ borderColor: 'var(--color-border)' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                    >
                                        <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-text-alt)' }}>
                                            {(page - 1) * LIMIT + i + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Mail className="size-4 shrink-0" style={{ color: 'var(--color-text-alt)' }} />
                                                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{sub.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                                                {SOURCE_LABEL[sub.source] ?? sub.source}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                            {formatDate(sub.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDelete(sub.id, sub.email)}
                                                disabled={deletingId === sub.id}
                                                className="rounded-lg p-1.5 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 disabled:opacity-40"
                                                style={{ color: 'var(--color-text-alt)' }}
                                                title="Eliminar"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => setSearchParams({ page: String(p) })}
                />
            )}
        </div>
    );
};
