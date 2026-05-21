import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Edit3, ToggleLeft, ToggleRight, Trash2, Search, ListChecks, Loader2, AlertCircle } from 'lucide-react';
import { instrumentApi } from '../api/instrumentApi';
import type { InstrumentTemplate } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

export const InstrumentBuilderPage = () => {
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const [templates, setTemplates] = useState<InstrumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', version: '1.0.0', service_type: '', active: true });

    const fetchTemplates = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await instrumentApi.getTemplates(1, 100);
            setTemplates(res.templates);
        } catch {
            setError(m.instruments.loadError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleCreate = async () => {
        if (!newTemplate.name || !newTemplate.service_type) return;
        try {
            await instrumentApi.createTemplate({
                name: newTemplate.name,
                version: newTemplate.version,
                service_type: newTemplate.service_type,
                active: newTemplate.active,
            });
            setShowCreate(false);
            setNewTemplate((prev) => ({ ...prev, name: '', version: '1.0.0', service_type: '', active: true }));
            fetchTemplates();
        } catch {
            setError(m.instruments.createError);
        }
    };

    const handleToggleActive = async (t: InstrumentTemplate) => {
        try {
            await instrumentApi.updateTemplate(t.id, { active: !t.estado });
            fetchTemplates();
        } catch {
            setError(m.instruments.toggleError);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(m.common.confirmDeleteInstrument)) return;
        try {
            await instrumentApi.deleteTemplate(id);
            fetchTemplates();
        } catch {
            setError(m.instruments.deleteError);
        }
    };

    const filtered = templates.filter(
        (t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.servicio.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-full" suppressHydrationWarning>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                        {m.instruments.builderTitle}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {m.instruments.builderSubtitle}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] hover:bg-violet-500 hover:shadow-xl active:scale-[0.98]"
                >
                    <Plus className="size-4" />
                    {m.instruments.newButton}
                </button>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 mb-2" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <FileText className="size-5 mt-0.5 shrink-0" style={{ color: 'var(--color-purple)' }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Instrumentos de evaluación</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Crea y edita las rúbricas que se usan para evaluar la calidad de los servicios turísticos. Define criterios, pesos y niveles de calificación para cada tipo de servicio.</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
                    <AlertCircle className="size-5 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700">X</button>
                </div>
            )}

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                    type="text"
                    placeholder={m.instruments.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
            </div>

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-violet-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <ListChecks className="mb-4 size-16 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
                        {search ? m.instruments.emptyNoResults : m.instruments.emptyDefaultTitle}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                        {search ? m.instruments.emptyHintNoResults : m.instruments.emptyDefaultHint}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((t) => (
                        <div
                            key={t.id}
                            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                                    <FileText className="size-5" />
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                        t.estado
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                            t.estado ? 'bg-emerald-500' : 'bg-zinc-400'
                                        }`}
                                    />
                                    {t.estado ? m.instruments.active : m.instruments.inactive}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {t.name}
                            </h3>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {t.servicio}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">v{t.version}</p>

                            <p className="mt-2 text-xs text-zinc-400" suppressHydrationWarning>
                                {m.instruments.createdPrefix}{' '}
                                {new Date(t.register_at).toLocaleDateString(lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US')}
                            </p>

                            <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                <button
                                    onClick={() => navigate(`/dashboard/instrumentos/${t.id}`)}
                                    className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50"
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    {m.instruments.edit}
                                </button>
                                <button
                                    onClick={() => handleToggleActive(t)}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                >
                                    {t.estado ? (
                                        <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <ToggleLeft className="h-3.5 w-3.5" />
                                    )}
                                    {t.estado ? m.instruments.toggleDeactivate : m.instruments.toggleActivate}
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" aria-label={m.instruments.closeAria} className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-default" onClick={() => setShowCreate(false)} />
                    <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{m.instruments.modalNewTitle}</h2>
                        <p className="mt-1 text-sm text-zinc-500">{m.instruments.modalNewSubtitle}</p>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{m.instruments.fieldName}</label>
                                <input
                                    type="text"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ej: Evaluación Hotelera 2024"
                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{m.instruments.fieldVersion}</label>
                                <input
                                    type="text"
                                    value={newTemplate.version}
                                    onChange={(e) => setNewTemplate((prev) => ({ ...prev, version: e.target.value }))}
                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{m.instruments.fieldService}</label>
                                <select
                                    value={newTemplate.service_type}
                                    onChange={(e) => setNewTemplate((prev) => ({ ...prev, service_type: e.target.value }))}
                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="">{m.instruments.selectPlaceholder}</option>
                                    <option value="Hotel">Hotel</option>
                                    <option value="Restaurante">Restaurante</option>
                                    <option value="Tour">Tour</option>
                                    <option value="Spa">Spa</option>
                                    <option value="Transporte">Transporte</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="new-active"
                                    checked={newTemplate.active}
                                    onChange={(e) => setNewTemplate((prev) => ({ ...prev, active: e.target.checked }))}
                                    className="rounded border-zinc-300 text-violet-600 dark:border-zinc-600"
                                />
                                <label htmlFor="new-active" className="text-sm text-zinc-700 dark:text-zinc-300">{m.instruments.checkboxActive}</label>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setShowCreate(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                                {m.instruments.cancel}
                            </button>
                            <button onClick={handleCreate} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500">
                                {m.instruments.create}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
