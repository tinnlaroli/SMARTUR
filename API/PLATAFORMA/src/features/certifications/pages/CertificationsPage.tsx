import { useMemo } from 'react';
import { useCertifications } from '../hooks/useCertifications';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../users/components/Pagination';
import { Award, ExternalLink, ToggleLeft, ToggleRight, ShieldCheck, ShieldOff } from 'lucide-react';
import { CardSkeleton } from '../../../components/ui/CardSkeleton';
import { motion } from 'framer-motion';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

export const CertificationsPage = () => {
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);
    const { certifications, isLoading, totalPages, updateStatus } = useCertifications();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'var(--color-orange)' }}>
                    <Award className="size-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {m.certifications.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {m.certifications.subtitle}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <CardSkeleton count={6} />
            ) : certifications.length === 0 ? (
                <div
                    className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <Award className="size-12" style={{ color: 'var(--color-border)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-alt)' }}>
                        {m.certifications.empty}
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {certifications.map((cert, i) => {
                        const isActive = cert.status === 'Activo';
                        return (
                            <motion.div
                                key={cert.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                                className="relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                            >
                                <div
                                    className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                                    style={{
                                        background: isActive ? 'var(--color-green)' : 'var(--color-border)',
                                    }}
                                />

                                <div className="mb-4 flex items-start justify-between pl-2">
                                    <div
                                        className="flex size-10 items-center justify-center rounded-xl"
                                        style={{
                                            background: isActive ? 'var(--color-green)' : 'var(--color-bg-alt)',
                                        }}
                                    >
                                        {isActive ? (
                                            <ShieldCheck className="size-5 text-white" />
                                        ) : (
                                            <ShieldOff className="size-5" style={{ color: 'var(--color-text-alt)' }} />
                                        )}
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                            isActive
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                        }`}
                                    >
                                        {cert.status}
                                    </span>
                                </div>

                                <div className="pl-2">
                                    <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>
                                        {cert.certificationType}
                                    </h3>
                                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                        <span className="font-medium">{m.certifications.org}</span> {cert.issuingOrganization}
                                    </p>
                                    <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                        <span className="font-medium">{m.certifications.expires}</span>{' '}
                                        {cert.expirationDate || m.certifications.noDate}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-2 border-t pt-4 pl-2" style={{ borderColor: 'var(--color-border)' }}>
                                    <button
                                        type="button"
                                        onClick={() => updateStatus(cert.id, isActive ? 'Vencido' : 'Activo')}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-colors"
                                        style={{
                                            background: 'var(--color-bg-alt)',
                                            color: 'var(--color-text)',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(var(--rgb-text),0.08)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
                                    >
                                        {isActive ? (
                                            <>
                                                <ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> {m.certifications.deactivate}
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="h-3.5 w-3.5" /> {m.certifications.activate}
                                            </>
                                        )}
                                    </button>
                                    {cert.evidenceUrl && (
                                        <a
                                            href={cert.evidenceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                                            style={{ color: 'var(--color-purple)' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(var(--rgb-purple-accent),0.1)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" /> {m.certifications.evidence}
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                    </div>
                </div>
            )}

            {certifications.length > 0 && (
                <Pagination page={page} limit={limit} totalPages={totalPages} setSearchParams={setSearchParams} />
            )}
        </div>
    );
};
