import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Save, Eye, EyeOff,
    ToggleLeft, ToggleRight, AlertCircle, Loader2, Check,
    Type, List, Star, CheckSquare, ChevronDown, ChevronUp, TriangleAlert,
} from 'lucide-react';
import { instrumentApi } from '../api/instrumentApi';
import type { FullRubric, Criterion, Subcriterion, FieldType, EvaluationStep } from '../types/types';
import { useToast } from '../../../shared/context/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import type { ComponentType } from 'react';

const STEP_REGEX = /^\[STEP:(\w+)\]\s*/;

const STEP_COLORS: Record<EvaluationStep, string> = {
    infraestructura: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    higiene: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    servicio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function parseDescriptionStep(desc: string): { evaluation_step?: EvaluationStep; description: string } {
    const match = desc.match(STEP_REGEX);
    if (match) {
        return { evaluation_step: match[1] as EvaluationStep, description: desc.slice(match[0].length) };
    }
    return { evaluation_step: undefined, description: desc };
}

function encodeDescriptionStep(step: EvaluationStep | undefined, desc: string): string {
    if (!step) return desc;
    return `[STEP:${step}] ${desc}`;
}

function parseCriteria(criteria: Criterion[]): Criterion[] {
    return criteria.map((c) => {
        const { evaluation_step, description } = parseDescriptionStep(c.description || '');
        return { ...c, evaluation_step, description };
    });
}

const LEVELS_FIELD_TYPES = new Set<FieldType>(['multiple_choice', 'scale', 'checkbox', 'select']);

const DEFAULT_SCALE_LEVELS: Subcriterion[] = [
    { id_subcriterion: 0, id_criterion: 0, description: 'Deficiente', score: 2, order_index: 0 },
    { id_subcriterion: 0, id_criterion: 0, description: 'Regular', score: 4, order_index: 1 },
    { id_subcriterion: 0, id_criterion: 0, description: 'Bueno', score: 6, order_index: 2 },
    { id_subcriterion: 0, id_criterion: 0, description: 'Muy bueno', score: 8, order_index: 3 },
    { id_subcriterion: 0, id_criterion: 0, description: 'Excelente', score: 10, order_index: 4 },
];

export const InstrumentEditorPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const { lang } = useLanguage();
    const ie = useMemo(() => getDashboardText(lang).modules.modals.instrumentEditor, [lang]);
    const evalStepsUi = useMemo(
        () =>
            [
                { value: 'infraestructura' as const, label: ie.stepInfra },
                { value: 'higiene' as const, label: ie.stepHigiene },
                { value: 'servicio' as const, label: ie.stepServicio },
            ] as { value: EvaluationStep; label: string }[],
        [ie],
    );
    const fieldTypesUi = useMemo(
        () =>
            [
                { value: 'text' as const, label: ie.fieldTypeText, icon: Type },
                { value: 'multiple_choice' as const, label: ie.fieldTypeMultiple, icon: List },
                { value: 'scale' as const, label: ie.fieldTypeScale, icon: Star },
                { value: 'checkbox' as const, label: ie.fieldTypeCheckbox, icon: CheckSquare },
                { value: 'select' as const, label: ie.fieldTypeSelect, icon: ChevronDown },
            ] as { value: FieldType; label: string; icon: ComponentType<{ className?: string }> }[],
        [ie],
    );
    const fieldTypeLabelMap = useMemo(() => new Map(fieldTypesUi.map((ft) => [ft.value, ft.label])), [fieldTypesUi]);

    const [rubric, setRubric] = useState<FullRubric | null>(null);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(false);

    const [templateName, setTemplateName] = useState('');
    const [templateVersion, setTemplateVersion] = useState('');
    const [templateServiceType, setTemplateServiceType] = useState('');
    const [templateActive, setTemplateActive] = useState(true);

    const fetchRubric = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const r = await instrumentApi.getRubric(Number(id));
            setRubric(r);
            setTemplateName(r.name);
            setTemplateVersion(r.version);
            setTemplateServiceType(r.service_type);
            setTemplateActive(r.active);
            setCriteria(parseCriteria(r.criteria || []));
        } catch {
            try {
                const [res, tpl] = await Promise.all([
                    instrumentApi.getCriteria(Number(id)),
                    instrumentApi.getTemplateById(Number(id)),
                ]);
                setCriteria(parseCriteria(res));
                setTemplateName(tpl.template.name);
                setTemplateVersion(tpl.template.version);
                setTemplateServiceType(tpl.template.servicio);
                setTemplateActive(tpl.template.estado);
            } catch {
                setError(ie.loadFailed);
            }
        } finally {
            setLoading(false);
        }
    }, [id, ie]);

    useEffect(() => {
        fetchRubric();
    }, [fetchRubric]);

    const handleSaveTemplate = async () => {
        if (!id) return;
        setSaving(true);
        try {
            await instrumentApi.updateTemplate(Number(id), {
                name: templateName,
                version: templateVersion,
                service_type: templateServiceType,
                active: templateActive,
            });
            toast.success(ie.toastMetaSavedTitle, ie.toastMetaSavedBody);
        } catch {
            toast.error(ie.toastMetaErrorTitle, ie.toastMetaErrorBody);
        } finally {
            setSaving(false);
        }
    };

    const addCriterion = () => {
        if (!id) return;
        const tempId = Date.now();
        const newCriterion: Criterion = {
            id_criterion: tempId,
            id_template: Number(id),
            name: '',
            description: '',
            weight: 1,
            order_index: criteria.length,
            active: true,
            field_type: 'scale',
            is_required: true,
            levels: DEFAULT_SCALE_LEVELS.map((l) => ({ ...l })),
        };
        setCriteria([...criteria, newCriterion]);
    };

    const updateCriterion = (index: number, updates: Partial<Criterion>) => {
        setCriteria(criteria.map((c, i) => (i === index ? { ...c, ...updates } : c)));
    };

    const removeCriterion = async (index: number) => {
        const criterion = criteria[index];
        const isTemp = criterion.id_criterion > 1000000;
        if (!isTemp) {
            try {
                await instrumentApi.deleteCriterion(criterion.id_criterion);
            } catch {
                // ignore
            }
        }
        setCriteria(criteria.filter((_, i) => i !== index));
    };

    const moveCriterion = (from: number, to: number) => {
        const next = [...criteria];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setCriteria(next.map((c, i) => ({ ...c, order_index: i })));
    };

    const addLevel = (criterionIndex: number) => {
        const level: Subcriterion = {
            id_subcriterion: 0,
            id_criterion: 0,
            description: '',
            score: 0,
            order_index: (criteria[criterionIndex].levels?.length || 0),
        };
        updateCriterion(criterionIndex, {
            levels: [...(criteria[criterionIndex].levels || []), level],
        });
    };

    const updateLevel = (criterionIndex: number, levelIndex: number, updates: Partial<Subcriterion>) => {
        const levels = [...(criteria[criterionIndex].levels || [])];
        levels[levelIndex] = { ...levels[levelIndex], ...updates };
        updateCriterion(criterionIndex, { levels });
    };

    const removeLevel = (criterionIndex: number, levelIndex: number) => {
        const levels = criteria[criterionIndex].levels?.filter((_, i) => i !== levelIndex) || [];
        updateCriterion(criterionIndex, { levels });
    };

    const saveAllCriteria = async () => {
        if (!id) return;
        setSaving(true);
        try {
            await criteria.reduce(async (chain, c, i) => {
                await chain;
                if (!c.name) return;

                let criterionId = c.id_criterion;
                const encodedDesc = encodeDescriptionStep(c.evaluation_step, c.description || '');
                if (criterionId > 1000000 || criterionId <= 0) {
                    const created = await instrumentApi.createCriterion({
                        id_template: Number(id),
                        name: c.name,
                        description: encodedDesc,
                        weight: c.weight || 1,
                        order_index: i,
                        active: c.active,
                        field_type: c.field_type || 'scale',
                        is_required: c.is_required,
                    });
                    criterionId = created.id_criterion;
                } else {
                    await instrumentApi.updateCriterion(criterionId, {
                        name: c.name,
                        description: encodedDesc,
                        weight: c.weight || 1,
                        order_index: i,
                        active: c.active,
                        field_type: c.field_type || 'scale',
                        is_required: c.is_required,
                    });
                }

                if (c.levels && c.levels.length > 0 && LEVELS_FIELD_TYPES.has(c.field_type)) {
                    await instrumentApi.batchUpdateSubcriteria(
                        criterionId,
                        c.levels.map((l) => ({ description: l.description, score: l.score }))
                    );
                }
            }, Promise.resolve());
            toast.success(ie.toastCriteriaSavedTitle, ie.toastCriteriaSavedBody);
            fetchRubric();
        } catch {
            toast.error(ie.toastCriteriaErrorTitle, ie.toastCriteriaErrorBody);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <AlertCircle className="mx-auto size-12 text-rose-400" />
                    <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">{error}</p>
                    <button onClick={fetchRubric} className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white">
                        {ie.retryLoad}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard/instrumentos')}
                        className="rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                            {ie.titlePrefix} {templateName || ie.unnamed}
                        </h1>
                        <p className="text-sm text-zinc-500">v{templateVersion} · {templateServiceType}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPreview(!preview)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            preview
                                ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-400'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                        }`}
                    >
                        {preview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {preview ? ie.editMode : ie.previewMode}
                    </button>
                </div>
            </div>

            <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500">{ie.metaName}</label>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            disabled={preview}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500">{ie.metaVersion}</label>
                        <input
                            type="text"
                            value={templateVersion}
                            onChange={(e) => setTemplateVersion(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            disabled={preview}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500">{ie.metaServiceType}</label>
                        <select
                            value={templateServiceType}
                            onChange={(e) => setTemplateServiceType(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            disabled={preview}
                        >
                            <option value="Hotel">Hotel</option>
                            <option value="Restaurante">Restaurante</option>
                            <option value="Tour">Tour</option>
                            <option value="Spa">Spa</option>
                            <option value="Transporte">Transporte</option>
                            <option value="Otro">{ie.serviceOtro}</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                        <button
                            onClick={() => setTemplateActive(!templateActive)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                templateActive
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                            disabled={preview}
                        >
                            {templateActive ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                            {templateActive ? ie.active : ie.inactive}
                        </button>
                        <button
                            onClick={handleSaveTemplate}
                            disabled={saving || preview}
                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            {ie.saveMetadata}
                        </button>
                    </div>
                </div>
            </div>

            {preview ? (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{ie.previewSection}</h2>
                    {criteria.reduce((n, c) => n + (c.active ? 1 : 0), 0) === 0 ? (
                        <p className="py-8 text-center text-sm text-zinc-500">{ie.noActiveQuestions}</p>
                    ) : (
                        criteria.filter((c) => c.active).map((c, i) => (
                            <div key={c.id_criterion} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                        {i + 1}. {c.name}
                                    </span>
                                    {c.is_required && <span className="text-rose-500">*</span>}
                                </div>
                                {c.description && (
                                    <p className="mb-3 text-sm text-zinc-500">{c.description}</p>
                                )}
                                {c.field_type === 'text' && (
                                    <input
                                        type="text"
                                        placeholder={ie.textAnswerPlaceholder}
                                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                                        disabled
                                    />
                                )}
                                {c.field_type === 'scale' && (
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button
                                                key={n}
                                                className="flex size-10 items-center justify-center rounded-full border border-zinc-200 text-sm dark:border-zinc-700"
                                                disabled
                                            >
                                                {n}
                                            </button>
                                        ))}
                                        <span className="ml-2 text-xs text-zinc-400">{ie.scaleHint}</span>
                                    </div>
                                )}
                                {c.field_type === 'multiple_choice' && (
                                    <div className="space-y-2">
                                        {(c.levels || []).map((l, li) => (
                                            <label key={li} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                <input type="radio" name={`preview-${c.id_criterion}`} disabled className="text-violet-600" />
                                                {l.description} {l.score > 0 && <span className="text-xs text-zinc-400">({l.score} {ie.ptsWord})</span>}
                                            </label>
                                        ))}
                                        {(c.levels || []).length === 0 && (
                                            <p className="text-xs text-zinc-400">{ie.noOptionsConfigured}</p>
                                        )}
                                    </div>
                                )}
                                {c.field_type === 'checkbox' && (
                                    <div className="space-y-2">
                                        {(c.levels || []).map((l, li) => (
                                            <label key={li} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                                <input type="checkbox" disabled className="rounded text-violet-600" />
                                                {l.description} {l.score > 0 && <span className="text-xs text-zinc-400">({l.score} {ie.ptsWord})</span>}
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {c.field_type === 'select' && (
                                    <select
                                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                                        disabled
                                    >
                                        <option>{ie.selectPlaceholder}</option>
                                        {(c.levels || []).map((l, li) => (
                                            <option key={li}>{l.description}</option>
                                        ))}
                                    </select>
                                )}
                                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                                    <span>{ie.weightLabel}: {c.weight}</span>
                                    <span>·</span>
                                    <span>{ie.typeColon} {fieldTypeLabelMap.get(c.field_type)}</span>
                                    {c.evaluation_step && (
                                        <>
                                            <span>·</span>
                                            <span className={`rounded-full px-2 py-0.5 font-semibold ${STEP_COLORS[c.evaluation_step]}`}>
                                                {evalStepsUi.find((s) => s.value === c.evaluation_step)?.label}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {ie.questions(criteria.length)}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={addCriterion}
                                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-violet-500 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus className="size-4" />
                                {ie.addQuestion}
                            </button>
                            <button
                                onClick={saveAllCriteria}
                                disabled={saving}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Check className="size-4" />
                                )}
                                {ie.saveAll}
                            </button>
                        </div>
                    </div>

                    {criteria.length === 0 ? (
                        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                            <Plus className="mb-4 size-12 text-zinc-300 dark:text-zinc-600" />
                            <p className="text-zinc-500 dark:text-zinc-400">
                                {ie.emptyQuestionsHint}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {criteria.map((c, i) => (
                                <div
                                    key={c.id_criterion}
                                    className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex flex-col gap-0.5 shrink-0">
                                            <button
                                                onClick={() => i > 0 && moveCriterion(i, i - 1)}
                                                disabled={i === 0}
                                                className="rounded p-0.5 text-zinc-300 hover:text-zinc-500 disabled:opacity-20 dark:text-zinc-600"
                                                title={ie.moveUpTitle}
                                            >
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => i < criteria.length - 1 && moveCriterion(i, i + 1)}
                                                disabled={i === criteria.length - 1}
                                                className="rounded p-0.5 text-zinc-300 hover:text-zinc-500 disabled:opacity-20 dark:text-zinc-600"
                                                title={ie.moveDownTitle}
                                            >
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <span className="flex size-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-sm shrink-0">
                                            {i + 1}
                                        </span>
                                        <input
                                            type="text"
                                            value={c.name}
                                            onChange={(e) => updateCriterion(i, { name: e.target.value })}
                                            placeholder={ie.questionNamePlaceholder}
                                            className="flex-1 border-0 border-b-2 border-transparent bg-transparent py-1 text-base font-medium text-zinc-900 placeholder:text-zinc-300 focus:border-violet-500 focus:ring-0 dark:text-white dark:placeholder:text-zinc-600"
                                        />
                                        {LEVELS_FIELD_TYPES.has(c.field_type) && (!c.levels || c.levels.length === 0) && (
                                            <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" title={ie.noLevelsTooltip}>
                                                <TriangleAlert className="size-3" />
                                                {ie.noLevelsShort}
                                            </span>
                                        )}
                                        {c.evaluation_step && (
                                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STEP_COLORS[c.evaluation_step]}`}>
                                                {evalStepsUi.find((s) => s.value === c.evaluation_step)?.label}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => updateCriterion(i, { active: !c.active })}
                                            className={`rounded-lg p-1.5 transition-colors ${
                                                c.active
                                                    ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                                    : 'text-zinc-300 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            {c.active ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}
                                        </button>
                                        <button
                                            onClick={() => removeCriterion(i)}
                                            className="rounded-lg p-1.5 text-rose-400 opacity-0 transition-all hover:bg-rose-50 group-hover:opacity-100 dark:hover:bg-rose-950/30"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    <div className="ml-10 space-y-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-zinc-500">{ie.fieldTypeColumn}</label>
                                                <select
                                                    value={c.field_type}
                                                    onChange={(e) => {
                                                        const newType = e.target.value as FieldType;
                                                        const updates: Partial<Criterion> = { field_type: newType };
                                                        if (LEVELS_FIELD_TYPES.has(newType) && (!c.levels || c.levels.length === 0)) {
                                                            updates.levels = newType === 'scale'
                                                                ? DEFAULT_SCALE_LEVELS.map((l) => ({ ...l }))
                                                                : [{ id_subcriterion: 0, id_criterion: 0, description: '', score: 0, order_index: 0 }];
                                                        }
                                                        updateCriterion(i, updates);
                                                    }}
                                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                                >
                                                    {fieldTypesUi.map((ft) => (
                                                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-zinc-500">{ie.evaluationStepColumn}</label>
                                                <select
                                                    value={c.evaluation_step || ''}
                                                    onChange={(e) => { const v = e.target.value; updateCriterion(i, { evaluation_step: v ? v as EvaluationStep : undefined }); }}
                                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                                >
                                                    <option value="">{ie.stepUnassigned}</option>
                                                    {evalStepsUi.map((s) => (
                                                        <option key={s.value} value={s.value}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-zinc-500">{ie.weightLabel}</label>
                                                <input
                                                    type="number"
                                                    value={c.weight}
                                                    onChange={(e) => updateCriterion(i, { weight: Number(e.target.value) })}
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                                />
                                            </div>
                                            <div className="flex items-end gap-2 pb-1">
                                                <input
                                                    type="checkbox"
                                                    id={`required-${i}`}
                                                    checked={c.is_required}
                                                    onChange={(e) => updateCriterion(i, { is_required: e.target.checked })}
                                                    className="rounded border-zinc-300 text-violet-600 dark:border-zinc-600"
                                                />
                                                <label htmlFor={`required-${i}`} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {ie.requiredFieldLabel}
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-zinc-500">{ie.optionalDescriptionLabel}</label>
                                            <input
                                                type="text"
                                                value={c.description || ''}
                                                onChange={(e) => updateCriterion(i, { description: e.target.value })}
                                                placeholder={ie.criterionInstructionPlaceholder}
                                                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                                            />
                                        </div>

                                        {LEVELS_FIELD_TYPES.has(c.field_type) && (
                                            <div>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <label className="text-xs font-medium text-zinc-500">
                                                        {ie.optionsLevelsLabel}
                                                        <span className="ml-1 text-zinc-400">({(c.levels || []).length})</span>
                                                    </label>
                                                    <button
                                                        onClick={() => addLevel(i)}
                                                        className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                                                    >
                                                        <Plus className="size-3" />
                                                        {ie.addOption}
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(c.levels || []).map((l, li) => (
                                                        <div key={li} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={l.description}
                                                                onChange={(e) => updateLevel(i, li, { description: e.target.value })}
                                                                placeholder={ie.levelDescriptionPlaceholder}
                                                                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                                            />
                                                            <input
                                                                type="number"
                                                                value={l.score}
                                                                onChange={(e) => updateLevel(i, li, { score: Number(e.target.value) })}
                                                                placeholder={ie.pointsShort}
                                                                min="0"
                                                                max="100"
                                                                className="w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                                            />
                                                            <button
                                                                onClick={() => removeLevel(i, li)}
                                                                className="text-rose-400 hover:text-rose-600"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
