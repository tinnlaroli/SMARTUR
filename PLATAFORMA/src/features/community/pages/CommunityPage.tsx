import { useEffect, useState } from 'react';
import { useCommunity } from '../hooks/useCommunity';
import { useLanguage } from '../../../contexts/LanguageContext';
import { MessageSquare, ImageIcon, Trash2, Store, Star, Plus, Flag, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { useToast } from '../../../shared/context/ToastContext';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';
import CreatePostModal from '../components/CreatePostModal';
import type { PostReport } from '../types/types';

const LIMIT = 20;

type Tab = 'posts' | 'reports';

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function AuthorAvatar({ author }: { author: { name: string; photo_url: string | null } }) {
    if (author.photo_url) {
        return <img src={author.photo_url} alt={author.name} className="size-9 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800" />;
    }
    const initials = author.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div className="flex size-9 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white ring-2 ring-white dark:ring-zinc-800">
            {initials}
        </div>
    );
}

export const CommunityPage = () => {
    const {
        posts, isLoading, totalPages, totalRecords, fetchPosts, deletePost, createPost,
        reports, reportsLoading, totalReports, fetchReports, resolveReport,
    } = useCommunity();
    const [searchParams, setSearchParams] = useSearchParams();
    const { t } = useLanguage();

    const REASON_LABELS: Record<string, string> = {
        spam: t('community.reasonSpam'),
        inappropriate: t('community.reasonInappropriate'),
        false_info: t('community.reasonFalseInfo'),
        hateful: t('community.reasonHateful'),
    };

    const toast = useToast();
    const { confirm, modal: confirmModal } = useConfirm();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('posts');
    const [resolvingId, setResolvingId] = useState<number | null>(null);

    const page = Number(searchParams.get('page')) || 1;

    useEffect(() => { fetchPosts(page, LIMIT); }, [page, fetchPosts]);
    useEffect(() => { if (activeTab === 'reports') fetchReports(false); }, [activeTab, fetchReports]);

    const handleResolve = async (report: PostReport) => {
        setResolvingId(report.id);
        try {
            await resolveReport(report.id);
            toast.success(t('community.toast.resolveSuccess'), t('community.toast.resolveSuccessMsg'));
        } catch {
            toast.error(t('common.error'), t('community.toast.resolveError'));
        } finally {
            setResolvingId(null);
        }
    };

    const handleDeleteReported = async (report: PostReport) => {
        const ok = await confirm({
            title: t('community.deleteReportedTitle'),
            message: t('community.confirmDelete.title', { author: report.author_name }),
            confirmLabel: t('common.delete'),
            variant: 'danger',
        });
        if (!ok) return;
        setDeletingId(report.post_id);
        try {
            await deletePost(report.post_id);
            await resolveReport(report.id);
            toast.success(t('community.toast.deleteReportedSuccess'), t('community.toast.deleteReportedSuccessMsg'));
        } catch {
            toast.error(t('common.error'), t('community.toast.deleteReportedError'));
        } finally {
            setDeletingId(null);
        }
    };

    const handleDelete = async (id: number, caption: string) => {
        const ok = await confirm({
            title: t('community.deleteConfirmTitle'),
            message: `¿Eliminar "${caption.slice(0, 50) || '(sin texto)'}"? Esta acción es permanente.`,
            confirmLabel: t('common.delete'),
            variant: 'danger',
        });
        if (!ok) return;
        setDeletingId(id);
        try {
            await deletePost(id);
            toast.success(t('community.toast.deleteSuccess'), t('community.toast.deleteSuccessMsg'));
        } catch {
            toast.error(t('common.error'), t('community.toast.deleteReportedError'));
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6" id="comunidad-module">
            {confirmModal}
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {t('community.title')}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {t('community.description')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {totalReports > 0 && (
                        <span className="rounded-full px-3 py-1 text-sm font-semibold shrink-0" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                            {totalReports} reportes
                        </span>
                    )}
                    <span className="rounded-full px-3 py-1 text-sm font-semibold shrink-0" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--color-purple)' }}>
                        {totalRecords} publicaciones
                    </span>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'posts' ? 'text-white shadow-sm' : 'hover:opacity-80'}`}
                    style={activeTab === 'posts' ? { background: MODULE_COLORS.community, color: 'white' } : { color: 'var(--color-text-alt)' }}
                >
                    <MessageSquare className="size-4" />
                    {t('community.tabPosts')}
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'reports' ? 'text-white shadow-sm' : 'hover:opacity-80'}`}
                    style={activeTab === 'reports' ? { background: '#ef4444', color: 'white' } : { color: 'var(--color-text-alt)' }}
                >
                    <Flag className="size-4" />
                    {t('community.tabReports')}
                    {totalReports > 0 && (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: activeTab === 'reports' ? 'rgba(255,255,255,0.25)' : 'rgba(239,68,68,0.15)', color: activeTab === 'reports' ? 'white' : '#ef4444' }}>
                            {totalReports}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'posts' && (
            <>
            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <MessageSquare className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.community }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>{t('community.infoBannerTitle')}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {t('community.infoBannerDescription')}
                    </p>
                </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-end">
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                    style={{ background: MODULE_COLORS.community }}
                >
                    <Plus className="size-4" />
                    {t('community.newPost')}
                </button>
            </div>

            {/* Posts grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border animate-pulse h-64" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }} />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                    <MessageSquare className="size-12" style={{ color: 'var(--color-border)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>{t('community.noPosts')}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{t('community.noPostsHint')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-md"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            {post.image_url && (
                                <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                    <img src={post.image_url} alt="post" className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                </div>
                            )}
                            {!post.image_url && (
                                <div className="flex h-24 items-center justify-center" style={{ background: 'var(--color-bg-alt)' }}>
                                    <ImageIcon className="size-8" style={{ color: 'var(--color-border)' }} />
                                </div>
                            )}

                            <div className="flex flex-1 flex-col gap-3 p-4">
                                {/* Author */}
                                <div className="flex items-center gap-2">
                                    <AuthorAvatar author={post.author} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {post.author.name || t('community.authorAnonymous')}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{formatDate(post.created_at)}</p>
                                    </div>
                                </div>

                                {/* Caption */}
                                {post.caption && (
                                    <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--color-text)' }}>
                                        {post.caption}
                                    </p>
                                )}

                                {/* Place */}
                                <div className="flex items-center gap-1.5 mt-auto">
                                    {post.place_kind === 'svc' ? (
                                        <Store className="size-3.5 shrink-0" style={{ color: 'var(--color-purple)' }} />
                                    ) : (
                                        <Star className="size-3.5 shrink-0" style={{ color: 'var(--color-pink)' }} />
                                    )}
                                    <span className="text-xs truncate" style={{ color: 'var(--color-text-alt)' }}>
                                        {post.place_name}
                                    </span>
                                    <span
                                        className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                                        style={{
                                            background: post.place_kind === 'svc' ? 'rgba(139,92,246,0.12)' : 'rgba(236,72,153,0.12)',
                                            color: post.place_kind === 'svc' ? 'var(--color-purple)' : 'var(--color-pink)',
                                        }}
                                    >
                                        {post.place_kind === 'svc' ? t('community.badgeService') : t('community.badgePOI')}
                                    </span>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(post.id, post.caption)}
                                    disabled={deletingId === post.id}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:border-red-900/50 dark:hover:text-red-400 disabled:opacity-50"
                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                                >
                                    <Trash2 className="size-3.5" />
                                    {deletingId === post.id ? t('community.deleting') : t('community.deletePost')}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => setSearchParams({ page: String(p) })}
                />
            )}

            {isCreateOpen && (
                <CreatePostModal
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={async (fd) => {
                        const ok = await createPost(fd);
                        if (ok) {
                            toast.success(t('community.toast.postCreated'), t('community.toast.postCreatedMsg'));
                            fetchPosts(page, LIMIT);
                        } else {
                            toast.error(t('common.error'), t('community.toast.postCreateError'));
                        }
                        return ok;
                    }}
                />
            )}
            </> /* end activeTab === 'posts' */
            )}

            {/* ── Reports tab ──────────────────────────────────────── */}
            {activeTab === 'reports' && (
                <div className="flex flex-col gap-4">
                    <div className="rounded-xl border px-5 py-4 flex items-start gap-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                        <Flag className="size-5 mt-0.5 shrink-0 text-red-500" />
                        <div>
                            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>{t('community.reportsBannerTitle')}</p>
                            <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                {t('community.reportsBannerDescription')}
                            </p>
                        </div>
                    </div>

                    {reportsLoading ? (
                        <div className="flex flex-col gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border animate-pulse h-28" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }} />
                            ))}
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                            <CheckCircle className="size-12 text-emerald-500" />
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>{t('community.noReports')}</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{t('community.noReportsHint')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="rounded-2xl border p-4 flex flex-col sm:flex-row gap-4"
                                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                                >
                                    {/* Post preview */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                                                {REASON_LABELS[report.reason] ?? report.reason}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>{formatDate(report.created_at)}</span>
                                        </div>
                                        {report.post_caption && (
                                            <p className="text-sm line-clamp-2 mb-1" style={{ color: 'var(--color-text)' }}>
                                                {report.post_caption}
                                            </p>
                                        )}
                                        {report.post_image_url && (
                                            <img src={report.post_image_url} alt="post" className="h-20 w-auto rounded-lg object-cover mb-1" />
                                        )}
                                        <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                            Autor: <span className="font-semibold">{report.author_name}</span>
                                            {' · '}
                                            Reportado por: <span className="font-semibold">{report.reporter_name}</span>
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
                                        <button
                                            onClick={() => handleResolve(report)}
                                            disabled={resolvingId === report.id}
                                            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 dark:hover:bg-emerald-900/10 dark:hover:border-emerald-900/50 dark:hover:text-emerald-400 disabled:opacity-50"
                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                                        >
                                            <CheckCircle className="size-3.5" />
                                            {resolvingId === report.id ? t('community.resolving') : t('community.resolve')}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteReported(report)}
                                            disabled={deletingId === report.post_id}
                                            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:border-red-900/50 dark:hover:text-red-400 disabled:opacity-50"
                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-alt)' }}
                                        >
                                            <Trash2 className="size-3.5" />
                                            {deletingId === report.post_id ? t('community.deleting') : t('community.deleteReport')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
