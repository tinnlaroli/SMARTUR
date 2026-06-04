import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Edit3, Search, ListChecks, Loader2, AlertCircle, Download, X, ChevronRight, Hash, Star } from 'lucide-react';
import { instrumentApi } from '../api/instrumentApi';
import type { InstrumentTemplate, FullRubric } from '../types/types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { generateBlankEvaluationForm } from '../../evaluations/utils/pdfGenerator';
import { touristServiceApi } from '../../tourist-services/api/touristServiceApi';
import type { TouristService } from '../../tourist-services/types/types';
import type { EvaluationRubric } from '../../evaluations/types/types';

export const InstrumentBuilderPage = () => {
    const navigate = useNavigate();
    const { lang, t } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const [templates, setTemplates] = useState<InstrumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', version: '1.0.0', service_type: '', active: true });

    // Preview panel state
    const [previewTemplate, setPreviewTemplate] = useState<InstrumentTemplate | null>(null);
    const [previewRubric, setPreviewRubric] = useState<FullRubric | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const handleOpenPreview = async (tmpl: InstrumentTemplate) => {
        if (previewTemplate?.id === tmpl.id) {
            setPreviewTemplate(null);
            setPreviewRubric(null);
            return;
        }
        setPreviewTemplate(tmpl);
        setPreviewRubric(null);
        setPreviewLoading(true);
        try {
            const rubric = await instrumentApi.getRubric(tmpl.id);
            setPreviewRubric(rubric);
        } catch {
            // preview shows partial info without rubric
        } finally {
            setPreviewLoading(false);
        }
    };

    // PDF download modal state
    const [downloadModal, setDownloadModal] = useState<{ template: InstrumentTemplate } | null>(null);
    const [downloadSelectedService, setDownloadSelectedService] = useState<TouristService | null>(null);
    const [downloadServices, setDownloadServices] = useState<TouristService[]>([]);
    const [downloadServicesLoading, setDownloadServicesLoading] = useState(false);
    const [downloadDate, setDownloadDate] = useState(new Date().toISOString().split('T')[0]);
    const [downloadLoading, setDownloadLoading] = useState(false);

    const handleOpenDownloadModal = async (template: InstrumentTemplate) => {
        setDownloadSelectedService(null);
        setDownloadDate(new Date().toISOString().split('T')[0]);
        setDownloadModal({ template });
        setDownloadServicesLoading(true);
        try {
            // Map template service type to tourist-service type (templates use Spanish capitalized names)
            const typeMap: Record<string, string> = {
                hotel: 'hotel',
                restaurante: 'restaurant',
                restaurant: 'restaurant',
                tour: 'tour',
                spa: 'spa',
                transporte: 'transporte',
            };
            const mappedType = typeMap[template.servicio.toLowerCase()] ?? template.servicio.toLowerCase();
            const res = await touristServiceApi.findAll(1, 200, '', undefined, mappedType);
            setDownloadServices(res.services ?? []);
        } catch {
            setDownloadServices([]);
        } finally {
            setDownloadServicesLoading(false);
        }
    };

    const handleGeneratePdf = async () => {
        if (!downloadModal || !downloadSelectedService) return;
        setDownloadLoading(true);
        try {
            const rubric = await instrumentApi.getRubric(downloadModal.template.id);
            const dateFormatted = new Date(downloadDate + 'T12:00:00').toLocaleDateString('es-MX');
            generateBlankEvaluationForm(rubric as unknown as EvaluationRubric, downloadSelectedService.name, dateFormatted);
            setDownloadModal(null);
        } catch {
            setError('Error al generar el PDF. Intenta de nuevo.');
        } finally {
            setDownloadLoading(false);
        }
    };

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
        setTemplates((prev) =>
            prev.map((tmpl) => (tmpl.id === t.id ? { ...tmpl, estado: !t.estado } : tmpl))
        );
        try {
            await instrumentApi.updateTemplate(t.id, { active: !t.estado });
        } catch {
            setTemplates((prev) =>
                prev.map((tmpl) => (tmpl.id === t.id ? { ...tmpl, estado: t.estado } : tmpl))
            );
            setError(m.instruments.toggleError);
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
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>{t('instrumentBuilder.bannerTitle')}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>{t('instrumentBuilder.bannerDescription')}</p>
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
                <div className="flex gap-4 items-start">
                    {/* Cards grid — shrinks when preview is open */}
                    <div ref={gridRef} className={`flex-1 grid grid-cols-1 gap-4 transition-all duration-300 ${previewTemplate ? 'md:grid-cols-1 xl:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
                        {filtered.map((t) => {
                            const isSelected = previewTemplate?.id === t.id;
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => handleOpenPreview(t)}
                                    className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all cursor-pointer hover:shadow-md dark:bg-zinc-900 ${
                                        isSelected
                                            ? 'border-violet-400 ring-2 ring-violet-400/30 dark:border-violet-600'
                                            : 'border-zinc-200 dark:border-zinc-800'
                                    }`}
                                >
                                    {/* Card body */}
                                    <div className="flex-1 p-5">
                                        <div className="mb-4 flex items-start justify-between gap-2">
                                            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-colors ${isSelected ? 'bg-violet-700' : 'bg-violet-600'}`}>
                                                <FileText className="size-5" />
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                t.estado
                                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800'
                                                    : 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700'
                                            }`}>
                                                <span className={`size-1.5 rounded-full ${t.estado ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                                {t.estado ? m.instruments.active : m.instruments.inactive}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{t.name}</h3>
                                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t.servicio}</p>

                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                v{t.version}
                                            </span>
                                            <span className="text-[11px] text-zinc-400" suppressHydrationWarning>
                                                {new Date(t.register_at).toLocaleDateString(lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card footer */}
                                    <div className="flex items-center gap-1 border-t border-zinc-100 bg-zinc-50/70 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/30">
                                        {/* Edit */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/instrumentos/${t.id}`); }}
                                            title={m.instruments.edit}
                                            className="group/btn flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                        >
                                            <Edit3 className="size-3.5 text-zinc-400 transition-colors group-hover/btn:text-violet-600 dark:text-zinc-500 dark:group-hover/btn:text-violet-400" />
                                            <span className="text-zinc-400 transition-colors group-hover/btn:text-violet-600 dark:text-zinc-500 dark:group-hover/btn:text-violet-400">{m.instruments.edit}</span>
                                        </button>

                                        {/* PDF */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenDownloadModal(t); }}
                                            title="Descargar formulario PDF"
                                            className="group/btn flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                                        >
                                            <Download className="size-3.5 text-zinc-400 transition-colors group-hover/btn:text-cyan-600 dark:text-zinc-500 dark:group-hover/btn:text-cyan-400" />
                                            <span className="text-zinc-400 transition-colors group-hover/btn:text-cyan-600 dark:text-zinc-500 dark:group-hover/btn:text-cyan-400">PDF</span>
                                        </button>

                                        {/* Divider */}
                                        <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

                                        {/* Toggle switch */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleActive(t); }}
                                            title={t.estado ? m.instruments.toggleDeactivate : m.instruments.toggleActivate}
                                            className="group/toggle ml-auto flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                                        >
                                            <span className="text-[11px] font-medium text-zinc-400 transition-colors group-hover/toggle:text-zinc-700 dark:text-zinc-500 dark:group-hover/toggle:text-zinc-300">
                                                {t.estado ? m.instruments.toggleDeactivate : m.instruments.toggleActivate}
                                            </span>
                                            <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${t.estado ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                                                <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform duration-200 ${t.estado ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Preview panel */}
                    <AnimatePresence>
                        {previewTemplate && (
                            <motion.div
                                key="preview-panel"
                                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="w-80 xl:w-96 shrink-0 sticky top-4 rounded-2xl border border-violet-200 bg-white shadow-lg dark:border-violet-900/50 dark:bg-zinc-900 overflow-hidden flex flex-col"
                                style={{ height: gridRef.current ? Math.max(gridRef.current.offsetHeight, 480) : 520 }}
                            >
                                {/* Panel header — updates in place */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-violet-50 dark:bg-violet-950/20 shrink-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                                            <FileText className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{previewTemplate.name}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{previewTemplate.servicio} · v{previewTemplate.version}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setPreviewTemplate(null); setPreviewRubric(null); }}
                                        className="shrink-0 ml-2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>

                                {/* Panel body — content fades on template switch */}
                                <div className="flex-1 overflow-y-auto p-5 min-h-0">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={previewTemplate.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.12 }}
                                            className="space-y-4"
                                        >
                                            {/* Status + quick stats */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    previewTemplate.estado
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${previewTemplate.estado ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                                    {previewTemplate.estado ? m.instruments.active : m.instruments.inactive}
                                                </span>
                                                {previewRubric && (
                                                    <>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                            <Hash className="size-3" />{previewRubric.criteria.length} criterios
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-400">
                                                            <Star className="size-3" />
                                                            {previewRubric.criteria.reduce((sum, c) => sum + Math.max(...c.levels.map((l) => Number(l.score)), 0), 0)} pts máx
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Criteria list */}
                                            {previewLoading ? (
                                                <div className="flex items-center justify-center py-10">
                                                    <Loader2 className="size-6 animate-spin text-violet-500" />
                                                </div>
                                            ) : previewRubric ? (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Criterios de evaluación</p>
                                                    {previewRubric.criteria
                                                        .sort((a, b) => a.order_index - b.order_index)
                                                        .map((criterion, i) => {
                                                            const maxScore = Math.max(...criterion.levels.map((l) => Number(l.score)), 0);
                                                            return (
                                                                <div key={criterion.id_criterion} className="flex items-start gap-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2.5">
                                                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/40 text-[10px] font-bold text-violet-600 dark:text-violet-400 mt-0.5">
                                                                        {i + 1}
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-snug">{criterion.name}</p>
                                                                        {criterion.description && (
                                                                            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{criterion.description}</p>
                                                                        )}
                                                                        <p className="text-[10px] text-zinc-400 mt-1">{(criterion.levels ?? []).length} niveles · {maxScore} pts máx</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-zinc-400 text-center py-6">No se pudo cargar la rúbrica.</p>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Actions — always visible at bottom */}
                                <div className="shrink-0 px-5 py-4 flex flex-col gap-2 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                    <button
                                        onClick={() => navigate(`/dashboard/instrumentos/${previewTemplate.id}`)}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                                    >
                                        <Edit3 className="size-4" />
                                        Editar instrumento
                                        <ChevronRight className="size-4 ml-auto" />
                                    </button>
                                    <button
                                        onClick={() => handleOpenDownloadModal(previewTemplate)}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                    >
                                        <Download className="size-4" />
                                        Descargar formulario PDF
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                                    placeholder={t('instrumentBuilder.namePh')}
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
                                    <option value="Hotel">{t('instrumentBuilder.serviceType.hotel')}</option>
                                    <option value="Restaurante">{t('instrumentBuilder.serviceType.restaurant')}</option>
                                    <option value="Tour">{t('instrumentBuilder.serviceType.tour')}</option>
                                    <option value="Spa">{t('instrumentBuilder.serviceType.spa')}</option>
                                    <option value="Transporte">{t('instrumentBuilder.serviceType.transport')}</option>
                                    <option value="Otro">{t('instrumentBuilder.serviceType.other')}</option>
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
            {/* PDF Download Modal */}
            {downloadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-default" onClick={() => setDownloadModal(null)} />
                    <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Download className="size-5 text-emerald-600" />
                                Descargar formulario
                            </h2>
                            <button onClick={() => setDownloadModal(null)} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <X className="size-4" />
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 mb-5">
                            Plantilla: <span className="font-medium text-zinc-700 dark:text-zinc-300">{downloadModal.template.name}</span>
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Servicio <span className="text-rose-500">*</span>
                                </label>
                                {downloadServicesLoading ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                                        <Loader2 className="size-4 animate-spin text-zinc-400" />
                                        <span className="text-sm text-zinc-400">Cargando servicios...</span>
                                    </div>
                                ) : downloadServices.length === 0 ? (
                                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                                        No hay servicios registrados de tipo <strong>{downloadModal?.template.servicio}</strong>.
                                    </p>
                                ) : (
                                    <select
                                        value={downloadSelectedService?.id ?? ''}
                                        onChange={(e) => {
                                            const svc = downloadServices.find((s) => s.id === Number(e.target.value));
                                            setDownloadSelectedService(svc ?? null);
                                        }}
                                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                        autoFocus
                                    >
                                        <option value="">Selecciona un servicio...</option>
                                        {downloadServices.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Fecha de evaluación
                                </label>
                                <input
                                    type="date"
                                    value={downloadDate}
                                    onChange={(e) => setDownloadDate(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setDownloadModal(null)}
                                className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGeneratePdf}
                                disabled={!downloadSelectedService || downloadLoading || downloadServices.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {downloadLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Download className="size-4" />
                                )}
                                Generar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
