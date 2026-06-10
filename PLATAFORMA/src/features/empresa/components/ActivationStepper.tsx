import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, AlertTriangle, Clock, Unlock } from 'lucide-react';
import type { EmpresaStatus } from '../api/empresaApi';

interface Step {
    label: string;
    description: string;
    route: string;
}

const STEPS: Step[] = [
    { label: 'Cuenta creada',    description: 'Registro completado exitosamente.',                                            route: '/empresa/perfil' },
    { label: 'Subir documentos', description: 'Proporciona datos del propietario y documentos de identidad.',                route: '/empresa/verificacion' },
    { label: 'En revisión',      description: 'El equipo de SMARTUR revisa tus documentos (1-3 días hábiles).',              route: '/empresa/verificacion' },
    { label: 'Cuenta activa',    description: 'Acceso completo a todos los servicios de SMARTUR.',                           route: '/empresa/servicios' },
];

function stepFromStatus(status: EmpresaStatus): number {
    switch (status) {
        case 'pending_docs':        return 1;
        case 'rejected':            return 1;
        case 'documents_submitted': return 2;
        case 'active':              return 3;
        case 'suspended':           return 3;
        default:                    return 1;
    }
}

interface Props {
    status: EmpresaStatus;
    rejectionReason?: string | null;
}

export function ActivationStepper({ status, rejectionReason }: Props) {
    const navigate = useNavigate();
    const currentStep = stepFromStatus(status);

    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Activa tu cuenta de empresa
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Completa la verificación para publicar tus servicios en SMARTUR.
                </p>
            </div>

            <ol className="relative">
                {STEPS.map((step, index) => {
                    const isDone     = index < currentStep;
                    const isActive   = index === currentStep;
                    const isRejected = index === 1 && status === 'rejected';

                    return (
                        <li key={index} className="flex gap-4 pb-5 last:pb-0">
                            {/* Bubble + connector */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                                        isRejected
                                            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                                            : isDone
                                            ? 'border-violet-500 bg-violet-500 text-white'
                                            : isActive
                                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-600'
                                            : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                    }`}
                                >
                                    {isDone && !isRejected ? (
                                        <Check className="size-4" />
                                    ) : isRejected ? (
                                        <AlertTriangle className="size-4" />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`mt-1 w-0.5 flex-1 min-h-[1.5rem] ${
                                            isDone ? 'bg-violet-400' : 'bg-zinc-200 dark:bg-zinc-700'
                                        }`}
                                    />
                                )}
                            </div>

                            {/* Row — clickable */}
                            <button
                                type="button"
                                onClick={() => navigate(step.route)}
                                className={`flex flex-1 items-start justify-between gap-2 pt-0.5 pb-2 text-left group transition-opacity ${
                                    !isDone && !isActive && !isRejected ? 'opacity-50 cursor-default pointer-events-none' : 'cursor-pointer'
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold ${
                                        isRejected
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : isDone
                                            ? 'text-violet-600 dark:text-violet-400'
                                            : isActive
                                            ? 'text-zinc-900 dark:text-white'
                                            : 'text-zinc-400 dark:text-zinc-600'
                                    }`}>
                                        {step.label}
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                        {step.description}
                                    </p>

                                    {/* Rejection reason */}
                                    {isRejected && rejectionReason && (
                                        <div className="mt-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3">
                                            <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Motivo de rechazo:</p>
                                            <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-300">{rejectionReason}</p>
                                        </div>
                                    )}

                                    {/* Waiting pill */}
                                    {isActive && status === 'documents_submitted' && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                            <Clock className="size-3.5" />
                                            <span>Documentos recibidos. En revisión.</span>
                                        </div>
                                    )}

                                    {/* Active pill */}
                                    {isDone && index === STEPS.length - 1 && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                            <Unlock className="size-3.5" />
                                            <span>Cuenta activa. Acceso completo habilitado.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Arrow */}
                                <ChevronRight className={`size-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 ${
                                    isRejected
                                        ? 'text-rose-400'
                                        : isDone
                                        ? 'text-violet-400'
                                        : isActive
                                        ? 'text-violet-500'
                                        : 'text-zinc-300 dark:text-zinc-600'
                                }`} />
                            </button>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
