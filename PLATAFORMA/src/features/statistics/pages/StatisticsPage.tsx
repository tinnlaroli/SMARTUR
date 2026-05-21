import { useState, useMemo } from 'react';
import { useStatistics } from '../hooks/useStatistics';
import { DollarSign, Briefcase, Zap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartURSpinner } from '../../../components/ui/SmartURSpinner';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';

type TabKey = 'expenditure' | 'employment' | 'input';

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
        {children}
    </label>
);

const inputCls = "mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2";
const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg-alt)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
};

export const StatisticsPage = () => {
    const { isLoading, recordExpenditure, recordEmployment, recordInput } = useStatistics();
    const [activeTab, setActiveTab] = useState<TabKey>('expenditure');
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);

    const tabs = useMemo(
        () =>
            [
                { key: 'expenditure' as const, label: m.statistics.tabExpenditure, icon: DollarSign, color: 'var(--color-purple)' },
                { key: 'employment' as const, label: m.statistics.tabEmployment, icon: Briefcase, color: 'var(--color-cyan)' },
                { key: 'input' as const, label: m.statistics.tabCarbon, icon: Zap, color: 'var(--color-green)' },
            ] as const,
        [lang],
    );

    const activeTabData = tabs.find((t) => t.key === activeTab)!;

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex size-10 items-center justify-center rounded-xl"
                    style={{ background: 'var(--color-purple)' }}>
                    <BarChart3 className="size-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                        {m.statistics.title}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        {m.statistics.subtitle}
                    </p>
                </div>
            </div>

            {/* Info banner */}
            <div className="rounded-xl border px-5 py-4 flex items-start gap-3 shrink-0" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
                <BarChart3 className="size-5 mt-0.5 shrink-0" style={{ color: 'var(--color-purple)' }} />
                <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text)' }}>Estadísticas del sistema</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>Panel de reportes con métricas de evaluaciones, actividad de usuarios, servicios más visitados y tendencias por período. Útil para tomar decisiones operativas y de calidad.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-2xl p-1.5" style={{ background: 'var(--color-bg-alt)' }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                            style={{ color: isActive ? 'white' : 'var(--color-text-alt)' }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="tab-bg"
                                    className="absolute inset-0 rounded-xl"
                                    style={{ background: tab.color }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                />
                            )}
                            <tab.icon className="relative size-4" />
                            <span className="relative">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Form panel */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border p-8 shadow-sm"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                >
                    {/* Panel title */}
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl"
                            style={{ background: activeTabData.color }}>
                            <activeTabData.icon className="size-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                {activeTab === 'expenditure' && m.statistics.panelExpenditure}
                                {activeTab === 'employment' && m.statistics.panelEmployment}
                                {activeTab === 'input' && m.statistics.panelCarbon}
                            </h2>
                            <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                {m.statistics.formHint}
                            </p>
                        </div>
                    </div>

                    {activeTab === 'expenditure' && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                recordExpenditure({
                                    id_tourist: 1,
                                    expenditure_type: fd.get('type') as string,
                                    amount: Number(fd.get('amount')),
                                    destination: fd.get('destination') as string,
                                });
                                e.currentTarget.reset();
                            }}
                            className="max-w-md space-y-4"
                        >
                            <div>
                                <Label>{m.statistics.expType}</Label>
                                <input name="type" placeholder={m.statistics.expTypePh}
                                    className={inputCls} style={inputStyle} required />
                            </div>
                            <div>
                                <Label>{m.statistics.amount}</Label>
                                <input name="amount" type="number" placeholder={m.statistics.amountPh}
                                    className={inputCls} style={inputStyle} required />
                            </div>
                            <div>
                                <Label>{m.statistics.destination}</Label>
                                <input name="destination" placeholder={m.statistics.destinationPh}
                                    className={inputCls} style={inputStyle} required />
                            </div>
                            <button type="submit" disabled={isLoading}
                                className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: activeTabData.color }}>
                                {isLoading ? <><SmartURSpinner size={22} /> {m.statistics.saving}</> : m.statistics.btnSaveExpense}
                            </button>
                        </form>
                    )}

                    {activeTab === 'employment' && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                recordEmployment({
                                    id_company: 1,
                                    position: fd.get('position') as string,
                                    contract_type: fd.get('contract') as string,
                                    gender: fd.get('gender') as string,
                                    salary: Number(fd.get('salary')),
                                    start_date: new Date().toISOString().split('T')[0],
                                });
                                e.currentTarget.reset();
                            }}
                            className="max-w-md space-y-4"
                        >
                            <div>
                                <Label>{m.statistics.position}</Label>
                                <input name="position" placeholder={m.statistics.positionPh}
                                    className={inputCls} style={inputStyle} required />
                            </div>
                            <div>
                                <Label>{m.statistics.contractType}</Label>
                                <select name="contract" className={inputCls} style={inputStyle}>
                                    <option value="Tiempo Completo">{m.statistics.contractFull}</option>
                                    <option value="Medio Tiempo">{m.statistics.contractHalf}</option>
                                    <option value="Temporal">{m.statistics.contractTemporal}</option>
                                </select>
                            </div>
                            <div>
                                <Label>{m.statistics.gender}</Label>
                                <select name="gender" className={inputCls} style={inputStyle}>
                                    <option value="Masculino">{m.statistics.genderMale}</option>
                                    <option value="Femenino">{m.statistics.genderFemale}</option>
                                    <option value="No binario">{m.statistics.genderNb}</option>
                                    <option value="Prefiero no decir">{m.statistics.genderPreferNot}</option>
                                </select>
                            </div>
                            <div>
                                <Label>{m.statistics.salary}</Label>
                                <input name="salary" type="number" placeholder={m.statistics.salaryPh}
                                    className={inputCls} style={inputStyle} required />
                            </div>
                            <button type="submit" disabled={isLoading}
                                className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: activeTabData.color }}>
                                {isLoading ? <><SmartURSpinner size={22} /> {m.statistics.saving}</> : m.statistics.btnRegisterEmployee}
                            </button>
                        </form>
                    )}

                    {activeTab === 'input' && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                recordInput({
                                    id_company: 1,
                                    input_type: fd.get('type') as string,
                                    cost: Number(fd.get('cost')),
                                    consumption: Number(fd.get('consumption')),
                                    carbon_footprint: Number(fd.get('carbon')),
                                });
                                e.currentTarget.reset();
                            }}
                            className="max-w-md space-y-4"
                        >
                            <div>
                                <Label>{m.statistics.inputType}</Label>
                                <select name="type" className={inputCls} style={inputStyle}>
                                    <option value="Energía Eléctrica">{m.statistics.inputElectric}</option>
                                    <option value="Agua">{m.statistics.inputWater}</option>
                                    <option value="Gas - Combustible">{m.statistics.inputGas}</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>{m.statistics.consumption}</Label>
                                    <input name="consumption" type="number" placeholder={m.statistics.consumptionPh}
                                        className={inputCls} style={inputStyle} required />
                                </div>
                                <div>
                                    <Label>{m.statistics.carbon}</Label>
                                    <input name="carbon" type="number" step="0.01" placeholder={m.statistics.carbonPh}
                                        className={inputCls} style={inputStyle} required />
                                </div>
                            </div>
                            <div>
                                <Label>{m.statistics.cost}</Label>
                                <input name="cost" type="number" placeholder={m.statistics.costPh}
                                    className={inputCls} style={inputStyle} required />
                            </div>
                            <button type="submit" disabled={isLoading}
                                className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: activeTabData.color }}>
                                {isLoading ? <><SmartURSpinner size={22} /> {m.statistics.saving}</> : m.statistics.btnSaveIndicators}
                            </button>
                        </form>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
