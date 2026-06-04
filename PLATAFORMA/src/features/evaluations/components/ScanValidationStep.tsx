import React, { useState, useMemo } from 'react';
import { Check, AlertCircle, AlertTriangle, Loader2, X, ScanLine, Pencil, ChevronDown } from 'lucide-react';
import type { EvaluationCriterion } from '../types/types';

interface ParsedResult {
    id_criterion: number;
    name: string;
    detected_score: number | null;
    detected_text?: string | null;
    confidence: 'high' | 'low' | 'none';
}

interface ScanValidationStepProps {
    parsed: ParsedResult[];
    rubric: { criteria: EvaluationCriterion[] };
    onConfirm: (validated: Record<number, number>, texts: Record<number, string>) => void;
    onCancel: () => void;
    isSaving?: boolean;
}

export const ScanValidationStep: React.FC<ScanValidationStepProps> = ({
    parsed,
    rubric,
    onConfirm,
    onCancel,
    isSaving = false,
}) => {
    const detectionMap = useMemo(
        () => Object.fromEntries(parsed.map((p) => [p.id_criterion, p])),
        [parsed]
    );

    // Scores for numeric criteria — pre-fill with detected values
    const [scores, setScores] = useState<Record<number, number>>(() => {
        const init: Record<number, number> = {};
        for (const d of parsed) {
            if (d.detected_score !== null) init[d.id_criterion] = Number(d.detected_score);
        }
        return init;
    });

    // Text values for text-type criteria
    const [texts, setTexts] = useState<Record<number, string>>(() => {
        const init: Record<number, string> = {};
        for (const d of parsed) {
            if (d.detected_text) init[d.id_criterion] = d.detected_text;
        }
        return init;
    });

    // Which criteria are in "editing" mode (score picker expanded)
    const [editing, setEditing] = useState<Set<number>>(new Set());

    const [validationError, setValidationError] = useState<string | null>(null);

    const numericCriteria = rubric.criteria.filter((c) => c.field_type !== 'text');
    const allValidated = numericCriteria.every((c) => scores[c.id_criterion] !== undefined);

    const toggleEdit = (id: number) => {
        setEditing((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectScore = (criterionId: number, score: number) => {
        setScores((prev) => ({ ...prev, [criterionId]: Number(score) }));
        setEditing((prev) => { const n = new Set(prev); n.delete(criterionId); return n; });
        setValidationError(null);
    };

    const handleConfirm = () => {
        const missing = numericCriteria.filter((c) => scores[c.id_criterion] === undefined);
        if (missing.length > 0) {
            setValidationError(`Asigna puntaje a: ${missing.map((c) => c.name).join(', ')}`);
            return;
        }
        onConfirm(scores, texts);
    };

    const highCount = parsed.filter((p) => p.confidence === 'high').length;
    const lowCount  = parsed.filter((p) => p.confidence === 'low').length;
    const noneCount = parsed.filter((p) => p.confidence === 'none').length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="rounded-2xl border border-violet-200 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-950/20 p-4 flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                    <ScanLine className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-violet-900 dark:text-violet-300 text-sm">Validación de resultados</p>
                    <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
                        Revisa los valores detectados. Toca el lápiz para corregir.
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {highCount > 0 && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"><Check className="size-3" />{highCount} detectados</span>}
                        {lowCount  > 0 && <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400"><AlertTriangle className="size-3" />{lowCount} parciales</span>}
                        {noneCount > 0 && <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400"><AlertCircle className="size-3" />{noneCount} sin detectar</span>}
                    </div>
                </div>
            </div>

            {/* Criteria rows */}
            <div className="space-y-2">
                {rubric.criteria.map((criterion) => {
                    const detection = detectionMap[criterion.id_criterion];
                    const isText = criterion.field_type === 'text';
                    const isEditingThis = editing.has(criterion.id_criterion);
                    const currentScore = scores[criterion.id_criterion];
                    const currentText  = texts[criterion.id_criterion] ?? '';
                    const confidence   = detection?.confidence ?? 'none';

                    const badgeClass = {
                        high: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                        low:  'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400',
                        none: 'bg-zinc-100   dark:bg-zinc-800      text-zinc-500   dark:text-zinc-400',
                    }[confidence];

                    const badgeLabel = {
                        high: '✓ Detectado',
                        low:  '~ Parcial',
                        none: '— Sin detectar',
                    }[confidence];

                    // Find level description for current score
                    const selectedLevel = criterion.levels.find(
                        (l) => Number(l.score) === currentScore
                    );

                    return (
                        <div key={criterion.id_criterion}
                            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden"
                        >
                            {/* Main row */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{criterion.name}</p>
                                    <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                                        {badgeLabel}
                                    </span>
                                </div>

                                {/* Current value display */}
                                {!isText ? (
                                    <div className="flex items-center gap-2 shrink-0">
                                        {currentScore !== undefined ? (
                                            <div className="text-right">
                                                <p className="text-xl font-black text-violet-600 dark:text-violet-400 leading-none">{currentScore}</p>
                                                {selectedLevel && (
                                                    <p className="text-[10px] text-zinc-400 max-w-[120px] truncate">{selectedLevel.description}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-zinc-400 italic">Sin valor</p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => toggleEdit(criterion.id_criterion)}
                                            disabled={isSaving}
                                            title={isEditingThis ? 'Cerrar' : 'Editar puntaje'}
                                            className="flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                        >
                                            {isEditingThis
                                                ? <ChevronDown className="size-4 rotate-180 transition-transform" />
                                                : <Pencil className="size-4" />
                                            }
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => toggleEdit(criterion.id_criterion)}
                                        disabled={isSaving}
                                        title="Editar texto"
                                        className="flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 shrink-0"
                                    >
                                        {isEditingThis
                                            ? <ChevronDown className="size-4 rotate-180 transition-transform" />
                                            : <Pencil className="size-4" />
                                        }
                                    </button>
                                )}
                            </div>

                            {/* Expanded editor */}
                            {isEditingThis && (
                                <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/60">
                                    {isText ? (
                                        <textarea
                                            value={currentText}
                                            onChange={(e) => setTexts((prev) => ({ ...prev, [criterion.id_criterion]: e.target.value }))}
                                            rows={3}
                                            placeholder="Escribe la observación..."
                                            disabled={isSaving}
                                            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                        />
                                    ) : (
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {criterion.levels.sort((a, b) => Number(a.score) - Number(b.score)).map((level) => {
                                                const isSelected = currentScore === Number(level.score);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={level.id_subcriterion}
                                                        onClick={() => selectScore(criterion.id_criterion, Number(level.score))}
                                                        disabled={isSaving}
                                                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                                                            isSelected
                                                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500'
                                                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700'
                                                        }`}
                                                    >
                                                        <div className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                            isSelected ? 'border-violet-600 bg-violet-600' : 'border-zinc-300 dark:border-zinc-600'
                                                        }`}>
                                                            {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className={`font-bold text-sm w-5 shrink-0 ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                            {Number(level.score)}
                                                        </span>
                                                        <span className={`text-xs ${isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                            {level.description}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Validation error */}
            {validationError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 px-4 py-3">
                    <AlertTriangle className="size-4 shrink-0 text-rose-500 mt-0.5" />
                    <p className="text-sm text-rose-700 dark:text-rose-400 flex-1">{validationError}</p>
                    <button type="button" onClick={() => setValidationError(null)} className="text-rose-400 hover:text-rose-600">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!allValidated || isSaving}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    {isSaving
                        ? <><Loader2 className="size-4 animate-spin" />Guardando...</>
                        : <><Check className="size-4" />Confirmar y guardar</>
                    }
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};
