import { useEffect, useState } from 'react';
import { useCommunity } from '../hooks/useCommunity';
import { MessageSquare, ImageIcon, Trash2, Store, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { useToast } from '../../../shared/context/ToastContext';
import { useConfirm } from '../../../components/ui/ConfirmModal';
import { MODULE_COLORS } from '../../../shared/config/moduleColors';

const LIMIT = 20;

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
    const { posts, isLoading, totalPages, totalRecords, fetchPosts, deletePost } = useCommunity();
    const [searchParams, setSearchParams] = useSearchParams();
    const toast = useToast();
    const { confirm, modal: confirmModal } = useConfirm();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const page = Number(searchParams.get('page')) || 1;

    useEffect(() => { fetchPosts(page, LIMIT); }, [page, fetchPosts]);

    const handleDelete = async (id: number, caption: string) => {
        const ok = await confirm({
            title: 'Eliminar publicación',
            message: `¿Eliminar "${caption.slice(0, 50) || '(sin texto)'}"? Esta acción es permanente.`,
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });
        if (!ok) return;
        setDeletingId(id);
        try {
            await deletePost(id);
            toast.success('Publicación eliminada', 'La publicación fue eliminada correctamente.');
        } catch {
            toast.error('Error', 'No se pudo eliminar la publicación.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6" id="comunidad-module">
            {confirmModal}
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        Comunidad Mobile
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Publicaciones creadas por usuarios desde la app móvil
                    </p>
                </div>
                <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--color-purple)' }}>
                    {totalRecords} publicaciones
                </span>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <MessageSquare className="size-5 mt-0.5 shrink-0" style={{ color: MODULE_COLORS.community }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>¿Qué son las publicaciones de comunidad?</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Los usuarios de la app móvil pueden publicar fotos y comentarios sobre los lugares que visitan (POIs y servicios turísticos).
                        Desde aquí puedes moderar y eliminar contenido inapropiado.
                    </p>
                </div>
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
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>No hay publicaciones todavía</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Las publicaciones de la app móvil aparecerán aquí</p>
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
                                            {post.author.name || 'Usuario anónimo'}
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
                                        {post.place_kind === 'svc' ? 'Servicio' : 'POI'}
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
                                    {deletingId === post.id ? 'Eliminando...' : 'Eliminar publicación'}
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
        </div>
    );
};
