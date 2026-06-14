import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, Clock, DollarSign, Users, Loader2, Layers } from 'lucide-react';
import { api } from '../../../shared/api/axiosClient';

interface Activity {
    id_activity: number;
    id_service: number;
    name: string;
    description: string | null;
    duration_minutes: number | null;
    price: number | null;
    max_capacity: number | null;
    is_active: boolean;
}

type ActivityDraft = {
    name: string;
    description: string;
    duration_minutes: string;
    price: string;
    max_capacity: string;
};

const emptyDraft = (): ActivityDraft => ({
    name: '', description: '', duration_minutes: '', price: '', max_capacity: '',
});

function parseDraft(d: ActivityDraft) {
    return {
        name: d.name.trim(),
        description: d.description.trim() || null,
        duration_minutes: d.duration_minutes ? parseInt(d.duration_minutes) : null,
        price: d.price ? parseFloat(d.price) : null,
        max_capacity: d.max_capacity ? parseInt(d.max_capacity) : null,
    };
}

interface Props {
    serviceId: number;
}

export function ServiceActivitiesPanel({ serviceId }: Props) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading]       = useState(true);
    const [adding, setAdding]         = useState(false);
    const [draft, setDraft]           = useState<ActivityDraft>(emptyDraft());
    const [editId, setEditId]         = useState<number | null>(null);
    const [editDraft, setEditDraft]   = useState<ActivityDraft>(emptyDraft());
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState<string | null>(null);

    useEffect(() => {
        api.get(`/tourist-services/${serviceId}/activities`)
            .then(r => setActivities(r.data.activities ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [serviceId]);

    const handleAdd = async () => {
        if (!draft.name.trim()) { setError('El nombre es obligatorio.'); return; }
        setSaving(true); setError(null);
        try {
            const r = await api.post(`/tourist-services/${serviceId}/activities`, parseDraft(draft));
            setActivities(prev => [...prev, r.data.activity]);
            setDraft(emptyDraft());
            setAdding(false);
        } catch { setError('Error al guardar.'); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (id: number) => {
        if (!editDraft.name.trim()) { setError('El nombre es obligatorio.'); return; }
        setSaving(true); setError(null);
        try {
            const r = await api.patch(`/tourist-services/${serviceId}/activities/${id}`, parseDraft(editDraft));
            setActivities(prev => prev.map(a => a.id_activity === id ? r.data.activity : a));
            setEditId(null);
        } catch { setError('Error al actualizar.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/tourist-services/${serviceId}/activities/${id}`);
            setActivities(prev => prev.filter(a => a.id_activity !== id));
        } catch { setError('Error al eliminar.'); }
    };

    const startEdit = (a: Activity) => {
        setEditId(a.id_activity);
        setEditDraft({
            name: a.name,
            description: a.description ?? '',
            duration_minutes: a.duration_minutes != null ? String(a.duration_minutes) : '',
            price: a.price != null ? String(a.price) : '',
            max_capacity: a.max_capacity != null ? String(a.max_capacity) : '',
        });
        setAdding(false);
        setError(null);
    };

    return (
        <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={16} style={{ color: '#7c3aed' }} /> Actividades / paquetes
                </h3>
                {!adding && (
                    <button
                        onClick={() => { setAdding(true); setEditId(null); setError(null); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 7, border: 'none',
                            background: '#7c3aed', color: '#fff',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        <Plus size={13} /> Agregar
                    </button>
                )}
            </div>

            {adding && (
                <ActivityForm
                    draft={draft}
                    onChange={setDraft}
                    onSave={handleAdd}
                    onCancel={() => { setAdding(false); setError(null); }}
                    saving={saving}
                    error={error}
                    label="Nueva actividad"
                />
            )}

            {loading ? (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', opacity: 0.4 }} />
                </div>
            ) : activities.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                    Sin actividades. Agrega la primera.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activities.map(a => (
                        <div key={a.id_activity} style={{
                            background: 'var(--color-bg-alt)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 10, padding: '12px 14px',
                        }}>
                            {editId === a.id_activity ? (
                                <ActivityForm
                                    draft={editDraft}
                                    onChange={setEditDraft}
                                    onSave={() => handleUpdate(a.id_activity)}
                                    onCancel={() => setEditId(null)}
                                    saving={saving}
                                    error={error}
                                    label="Actualizar actividad"
                                />
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                                            {a.name}
                                        </p>
                                        {a.description && (
                                            <p style={{ margin: '3px 0 6px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                {a.description}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            {a.duration_minutes != null && (
                                                <Chip icon={<Clock size={11} />} text={`${a.duration_minutes} min`} />
                                            )}
                                            {a.price != null && (
                                                <Chip icon={<DollarSign size={11} />} text={`$${Number(a.price).toFixed(2)}`} />
                                            )}
                                            {a.max_capacity != null && (
                                                <Chip icon={<Users size={11} />} text={`Máx ${a.max_capacity}`} />
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                        <button onClick={() => startEdit(a)} style={iconBtn}>
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(a.id_activity)} style={{ ...iconBtn, color: '#f43f5e' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, color: 'var(--color-text-muted)',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            padding: '2px 7px', borderRadius: 999,
        }}>
            {icon} {text}
        </span>
    );
}

interface FormProps {
    draft: ActivityDraft;
    onChange: (d: ActivityDraft) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    error: string | null;
    label: string;
}

function ActivityForm({ draft, onChange, onSave, onCancel, saving, error, label }: FormProps) {
    const set = (key: keyof ActivityDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...draft, [key]: e.target.value });

    return (
        <div style={{
            background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
            borderRadius: 10, padding: 14, marginBottom: 10,
        }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input placeholder="Nombre de la actividad *" value={draft.name} onChange={set('name')} style={inputStyle} />
                <textarea placeholder="Descripción (opcional)" value={draft.description} onChange={set('description')} rows={2} style={{ ...inputStyle, resize: 'none' } as React.CSSProperties} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <input placeholder="Duración (min)" type="number" value={draft.duration_minutes} onChange={set('duration_minutes')} style={inputStyle} />
                    <input placeholder="Precio ($)" type="number" step="0.01" value={draft.price} onChange={set('price')} style={inputStyle} />
                    <input placeholder="Capacidad máx." type="number" value={draft.max_capacity} onChange={set('max_capacity')} style={inputStyle} />
                </div>
                {error && <p style={{ margin: 0, fontSize: 12, color: '#f43f5e' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onSave} disabled={saving} style={btnPrimary}>
                        {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                        Guardar
                    </button>
                    <button onClick={onCancel} style={btnGhost}>
                        <X size={12} /> Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit',
};

const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 12px', borderRadius: 7, border: 'none',
    background: '#7c3aed', color: '#fff', fontSize: 12,
    fontWeight: 600, cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 12px', borderRadius: 7,
    border: '1px solid var(--color-border)',
    background: 'transparent', color: 'var(--color-text)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
    borderRadius: 4, color: 'var(--color-text-muted)',
    display: 'flex', alignItems: 'center',
};
