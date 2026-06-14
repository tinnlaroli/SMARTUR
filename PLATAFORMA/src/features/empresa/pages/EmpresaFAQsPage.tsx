import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Check, X, HelpCircle, Loader2, Lock } from 'lucide-react';
import { api } from '../../../shared/api/axiosClient';
import { empresaApi } from '../api/empresaApi';

interface FAQ {
    id_faq: number;
    question: string;
    answer: string;
    created_at: string;
}

type Draft = { question: string; answer: string };

function ModuleLocked() {
    const navigate = useNavigate();
    return (
        <div className="flex h-[calc(100vh-9rem)] items-center justify-center">
            <div
                className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border p-8 text-center shadow-sm"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
            >
                <div className="flex size-14 items-center justify-center rounded-full" style={{ background: '#F59E0B18' }}>
                    <Lock className="size-6" style={{ color: '#F59E0B' }} />
                </div>
                <div>
                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                        Empresa en revisión
                    </p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-alt)' }}>
                        Las Preguntas frecuentes se activan una vez que el equipo SMARTUR apruebe tu empresa. Normalmente tarda 24–48 horas.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/empresa/verificacion')}
                    className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#7c3aed' }}
                >
                    Ver verificación
                </button>
            </div>
        </div>
    );
}

export function EmpresaFAQsPage() {
    const [faqs, setFaqs]         = useState<FAQ[]>([]);
    const [loading, setLoading]   = useState(true);
    const [draft, setDraft]       = useState<Draft>({ question: '', answer: '' });
    const [adding, setAdding]     = useState(false);
    const [editId, setEditId]     = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState<Draft>({ question: '', answer: '' });
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [companyStatus, setCompanyStatus] = useState<string | null>(null);

    useEffect(() => {
        empresaApi.getKycStatus()
            .then(d => setCompanyStatus(d.status))
            .catch(() => setCompanyStatus('unknown'));
    }, []);

    useEffect(() => {
        api.get('/empresa/faqs')
            .then(r => setFaqs(r.data.faqs ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleAdd = async () => {
        if (!draft.question.trim() || !draft.answer.trim()) {
            setError('La pregunta y la respuesta son obligatorias.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const r = await api.post('/empresa/faqs', draft);
            setFaqs(prev => [r.data.faq, ...prev]);
            setDraft({ question: '', answer: '' });
            setAdding(false);
        } catch {
            setError('Error al guardar. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editDraft.question.trim() || !editDraft.answer.trim()) {
            setError('La pregunta y la respuesta son obligatorias.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const r = await api.patch(`/empresa/faqs/${id}`, editDraft);
            setFaqs(prev => prev.map(f => f.id_faq === id ? r.data.faq : f));
            setEditId(null);
        } catch {
            setError('Error al actualizar.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/empresa/faqs/${id}`);
            setFaqs(prev => prev.filter(f => f.id_faq !== id));
        } catch {
            setError('Error al eliminar.');
        }
    };

    const startEdit = (faq: FAQ) => {
        setEditId(faq.id_faq);
        setEditDraft({ question: faq.question, answer: faq.answer });
        setAdding(false);
        setError(null);
    };

    if (companyStatus !== null && companyStatus !== 'active') {
        return <ModuleLocked />;
    }

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HelpCircle size={22} style={{ color: '#7c3aed' }} />
                    Preguntas frecuentes
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 500 }}>
                    El asistente virtual usa estas preguntas para responder automáticamente a tus clientes en el chat.
                </p>
            </div>

            {/* Add button */}
            {!adding && (
                <button
                    onClick={() => { setAdding(true); setEditId(null); setError(null); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 16px', borderRadius: 8, marginBottom: 20,
                        background: '#7c3aed', color: '#fff', border: 'none',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    <Plus size={15} /> Nueva pregunta
                </button>
            )}

            {/* Add form */}
            {adding && (
                <div style={{
                    background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
                    borderRadius: 12, padding: 20, marginBottom: 20,
                }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                        Nueva pregunta frecuente
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <textarea
                            placeholder="¿Cuál es la pregunta? Ej: ¿Cuáles son sus horarios?"
                            value={draft.question}
                            onChange={e => setDraft(p => ({ ...p, question: e.target.value }))}
                            rows={2}
                            style={taStyle}
                        />
                        <textarea
                            placeholder="Respuesta completa…"
                            value={draft.answer}
                            onChange={e => setDraft(p => ({ ...p, answer: e.target.value }))}
                            rows={3}
                            style={taStyle}
                        />
                        {error && <p style={{ margin: 0, fontSize: 13, color: '#f43f5e' }}>{error}</p>}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleAdd} disabled={saving} style={btnPrimary}>
                                {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                                Guardar
                            </button>
                            <button onClick={() => { setAdding(false); setError(null); }} style={btnGhost}>
                                <X size={13} /> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAQ list */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', opacity: 0.4 }} />
                </div>
            ) : faqs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
                    <HelpCircle size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
                    <p style={{ margin: 0, fontSize: 14 }}>Sin preguntas aún. Agrega la primera.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {faqs.map((faq) => (
                        <div key={faq.id_faq} style={{
                            background: 'var(--color-bg-alt)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 12, padding: 16,
                        }}>
                            {editId === faq.id_faq ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <textarea
                                        value={editDraft.question}
                                        onChange={e => setEditDraft(p => ({ ...p, question: e.target.value }))}
                                        rows={2} style={taStyle}
                                    />
                                    <textarea
                                        value={editDraft.answer}
                                        onChange={e => setEditDraft(p => ({ ...p, answer: e.target.value }))}
                                        rows={3} style={taStyle}
                                    />
                                    {error && <p style={{ margin: 0, fontSize: 13, color: '#f43f5e' }}>{error}</p>}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleUpdate(faq.id_faq)} disabled={saving} style={btnPrimary}>
                                            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                                            Actualizar
                                        </button>
                                        <button onClick={() => setEditId(null)} style={btnGhost}>
                                            <X size={13} /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>
                                            {faq.question}
                                        </p>
                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                            <button onClick={() => startEdit(faq)} style={iconBtn}>
                                                <Pencil size={13} />
                                            </button>
                                            <button onClick={() => handleDelete(faq.id_faq)} style={{ ...iconBtn, color: '#f43f5e' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                        {faq.answer}
                                    </p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const taStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    fontSize: 13, resize: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
};

const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 7, border: 'none',
    background: '#7c3aed', color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 7,
    border: '1px solid var(--color-border)',
    background: 'transparent', color: 'var(--color-text)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
    background: 'none', border: 'none',
    color: 'var(--color-text-muted)', cursor: 'pointer',
    padding: 4, borderRadius: 4,
    display: 'flex', alignItems: 'center',
};
