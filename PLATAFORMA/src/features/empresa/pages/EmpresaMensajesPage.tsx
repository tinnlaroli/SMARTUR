import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, RefreshCw, Lock } from 'lucide-react';
import { chatEmpresaApi, type EmpresaConversation, type ChatMessage } from '../api/chatApi';
import { empresaApi } from '../api/empresaApi';
import { useToast } from '../../../shared/context/ToastContext';
import { useBadges } from '../context/EmpresaBadgesContext';

const ACCENT = '#a855f7';
const POLL_INTERVAL_MS = 10_000;

function StatusBlocker({ status }: { status: 'pending' | 'suspended' }) {
    const isPending = status === 'pending';
    return (
        <div className="flex h-[calc(100vh-9rem)] items-center justify-center">
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
                            ? 'Los mensajes se activan una vez que el equipo WELLTUR apruebe tu empresa. Normalmente tarda 24–48 horas.'
                            : 'Tu cuenta ha sido suspendida. Contacta a soporte en soporte@smartur.online para más información.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(iso: string) {
    return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function formatRelative(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 60_000) return 'ahora';
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m`;
    if (diffMs < 86_400_000) return formatTime(iso);
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(d);
}

interface ConversationItemProps {
    conv: EmpresaConversation;
    isActive: boolean;
    onClick: () => void;
}

function ConversationItem({ conv, isActive, onClick }: ConversationItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
        >
            <div
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: ACCENT }}
            >
                {getInitials(conv.tourist_name)}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm font-semibold ${isActive ? '' : ''}`} style={{ color: 'var(--color-text)' }}>
                        {conv.tourist_name}
                    </span>
                    {conv.last_message_at && (
                        <span className="shrink-0 text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                            {formatRelative(conv.last_message_at)}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs" style={{ color: 'var(--color-text-alt)' }}>
                        {conv.last_message ?? conv.service_name ?? 'Nueva conversación'}
                    </span>
                    {conv.unread_count > 0 && (
                        <span
                            className="flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: ACCENT }}
                        >
                            {Math.min(conv.unread_count, 9)}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

interface MessageBubbleProps {
    msg: ChatMessage;
    isMine: boolean;
}

function MessageBubble({ msg, isMine }: MessageBubbleProps) {
    return (
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
            <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMine
                        ? 'rounded-br-sm text-white'
                        : 'rounded-bl-sm border'
                }`}
                style={
                    isMine
                        ? { background: ACCENT }
                        : { background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }
                }
            >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p className={`mt-0.5 text-right text-[10px] ${isMine ? 'text-white/70' : ''}`} style={!isMine ? { color: 'var(--color-text-alt)' } : undefined}>
                    {formatTime(msg.created_at)}
                </p>
            </div>
        </div>
    );
}

export function EmpresaMensajesPage() {
    const { error } = useToast();
    const { refresh: refreshBadges } = useBadges();

    const [conversations, setConversations] = useState<EmpresaConversation[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [content, setContent] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [companyStatus, setCompanyStatus] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        empresaApi.getProfile()
            .then(({ company }) => setCompanyStatus(company.status))
            .catch(() => {});
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const data = await chatEmpresaApi.conversations();
            void refreshBadges();
            setConversations(data);
        } catch {
            /* silent */
        } finally {
            setLoadingConvs(false);
        }
    }, []);

    const loadMessages = useCallback(async (id: number) => {
        try {
            const data = await chatEmpresaApi.messages(id);
            setMessages(data);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch {
            /* silent */
        } finally {
            setLoadingMsgs(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!activeId) return;
        setLoadingMsgs(true);
        loadMessages(activeId);

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
            loadMessages(activeId);
            loadConversations();
        }, POLL_INTERVAL_MS);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [activeId, loadMessages, loadConversations]);

    const handleSelectConversation = (id: number) => {
        setActiveId(id);
        setMessages([]);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !activeId || sending) return;
        setSending(true);
        try {
            const msg = await chatEmpresaApi.send(activeId, content.trim());
            setMessages((prev) => [...prev, msg]);
            setContent('');
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch {
            error('Error al enviar mensaje');
        } finally {
            setSending(false);
        }
    };

    const activeConv = conversations.find((c) => c.id_conversation === activeId);

    if (!loadingConvs && companyStatus && companyStatus !== 'active') {
        return <StatusBlocker status={companyStatus === 'suspended' ? 'suspended' : 'pending'} />;
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
            {/* ── Conversations list ─────────────────────────────────────────── */}
            <div
                className="flex w-72 shrink-0 flex-col border-r"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
                    <MessageSquare size={16} style={{ color: ACCENT }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Mensajes</span>
                    <button onClick={loadConversations} className="ml-auto rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <RefreshCw size={12} style={{ color: 'var(--color-text-alt)' }} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConvs ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="size-5 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                            <MessageSquare size={32} className="opacity-20" style={{ color: 'var(--color-text)' }} />
                            <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Sin conversaciones aún</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <ConversationItem
                                key={conv.id_conversation}
                                conv={conv}
                                isActive={conv.id_conversation === activeId}
                                onClick={() => handleSelectConversation(conv.id_conversation)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ── Chat panel ────────────────────────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col" style={{ background: 'var(--color-bg-alt)' }}>
                {!activeId ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <MessageSquare size={48} className="opacity-20" style={{ color: 'var(--color-text)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                            Selecciona una conversación para ver los mensajes
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div
                            className="flex items-center gap-3 border-b px-4 py-3"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            <div
                                className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ background: ACCENT }}
                            >
                                {activeConv ? getInitials(activeConv.tourist_name) : '?'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                    {activeConv?.tourist_name}
                                </p>
                                {activeConv?.service_name && (
                                    <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                        {activeConv.service_name}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            {loadingMsgs ? (
                                <div className="flex justify-center py-8">
                                    <div className="size-5 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
                                </div>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                    Sé el primero en escribir
                                </p>
                            ) : (
                                messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id_message}
                                        msg={msg}
                                        isMine={msg.sender_id !== activeConv?.tourist_id}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={handleSend}
                            className="flex items-center gap-2 border-t px-4 py-3"
                            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                        >
                            <input
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                                style={{
                                    background: 'var(--color-bg-alt)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text)',
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!content.trim() || sending}
                                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white transition-opacity disabled:opacity-40"
                                style={{ background: ACCENT }}
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default EmpresaMensajesPage;
