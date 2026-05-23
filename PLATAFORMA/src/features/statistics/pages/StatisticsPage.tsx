import { useState, useMemo, useEffect } from 'react';
import { useStatistics } from '../hooks/useStatistics';
import { DollarSign, Briefcase, Zap, BarChart3, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartURSpinner } from '../../../components/ui/SmartURSpinner';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { companyServices } from '../../companies/api/companyApi';
import type { Company } from '../../companies/types/types';

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

const kpiCardStyle: React.CSSProperties = {
    background: 'var(--color-bg-alt)',
    borderColor: 'var(--color-border)',
};

const SkeletonRow = () => (
    <tr>
        {[1, 2, 3, 4].map((i) => (
            <td key={i} className="px-3 py-2">
                <div className="h-3 rounded animate-pulse" style={{ background: 'var(--color-border)', width: `${60 + i * 10}%` }} />
            </td>
        ))}
    </tr>
);

export const StatisticsPage = () => {
    const {
        isLoading,
        expenditures, employments, inputs,
        loadingExpenditures, loadingEmployments, loadingInputs,
        fetchExpenditures, fetchEmployments, fetchInputs,
        recordExpenditure, recordEmployment, recordInput,
    } = useStatistics();

    const [activeTab, setActiveTab] = useState<TabKey>('expenditure');
    const { lang } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);

    // Companies for dropdowns
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoadingCompanies(true);
        companyServices.findAll(1, 200)
            .then((res) => { if (!cancelled) setCompanies(res.companies); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoadingCompanies(false); });
        return () => { cancelled = true; };
    }, []);

    // Fetch records when tab changes
    useEffect(() => {
        if (activeTab === 'expenditure') fetchExpenditures();
        if (activeTab === 'employment') fetchEmployments();
        if (activeTab === 'input') fetchInputs();
    }, [activeTab]);

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

    // KPI helpers
    const totalExpAmount = expenditures.reduce((s, r) => s + Number(r.amount), 0);
    const totalSalary = employments.reduce((s, r) => s + Number(r.salary), 0);
    const totalCO2 = inputs.reduce((s, r) => s + Number(r.carbon_footprint), 0);

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
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl border p-6 shadow-sm"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        {/* Panel title */}
                        <div className="mb-5 flex items-center gap-3">
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

                        {/* Split layout: form left, KPIs + table right */}
                        <div className="flex flex-col lg:flex-row gap-6">

                            {/* ── LEFT: Form ── */}
                            <div className="lg:w-80 shrink-0">
                                {activeTab === 'expenditure' && (
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            const ok = await recordExpenditure({
                                                id_tourist: Number(fd.get('tourist_id')),
                                                expenditure_type: fd.get('type') as string,
                                                amount: Number(fd.get('amount')),
                                                destination: fd.get('destination') as string,
                                            });
                                            if (ok) e.currentTarget.reset();
                                        }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <Label>ID del turista</Label>
                                            <input name="tourist_id" type="number" placeholder="ID del turista" min="1"
                                                className={inputCls} style={inputStyle} required />
                                        </div>
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
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            const ok = await recordEmployment({
                                                id_company: Number(fd.get('company_id')),
                                                position: fd.get('position') as string,
                                                contract_type: fd.get('contract') as string,
                                                gender: fd.get('gender') as string,
                                                salary: Number(fd.get('salary')),
                                                start_date: new Date().toISOString().split('T')[0],
                                            });
                                            if (ok) e.currentTarget.reset();
                                        }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <Label>Empresa</Label>
                                            {loadingCompanies ? (
                                                <div className="mt-1.5 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                    <Loader2 className="size-4 animate-spin" /> Cargando…
                                                </div>
                                            ) : (
                                                <select name="company_id" className={inputCls} style={inputStyle} required>
                                                    {companies.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
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
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            const ok = await recordInput({
                                                id_company: Number(fd.get('company_id')),
                                                input_type: fd.get('type') as string,
                                                cost: Number(fd.get('cost')),
                                                consumption: Number(fd.get('consumption')),
                                                carbon_footprint: Number(fd.get('carbon')),
                                            });
                                            if (ok) e.currentTarget.reset();
                                        }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <Label>Empresa</Label>
                                            {loadingCompanies ? (
                                                <div className="mt-1.5 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                    <Loader2 className="size-4 animate-spin" /> Cargando…
                                                </div>
                                            ) : (
                                                <select name="company_id" className={inputCls} style={inputStyle} required>
                                                    {companies.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
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
                            </div>

                            {/* ── RIGHT: KPIs + Table ── */}
                            <div className="flex-1 min-w-0">
                                {/* KPI chips */}
                                {activeTab === 'expenditure' && (
                                    <>
                                        <div className="flex gap-3 mb-4">
                                            <div className="rounded-xl border px-4 py-2.5 flex-1" style={kpiCardStyle}>
                                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Total registros</p>
                                                <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{expenditures.length}</p>
                                            </div>
                                            <div className="rounded-xl border px-4 py-2.5 flex-1" style={kpiCardStyle}>
                                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Monto total</p>
                                                <p className="text-lg font-bold" style={{ color: 'var(--color-purple)' }}>
                                                    ${totalExpAmount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr style={{ background: 'var(--color-bg-alt)' }}>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Tipo</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Monto</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Destino</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Turista ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loadingExpenditures ? (
                                                        [1,2,3].map((i) => <SkeletonRow key={i} />)
                                                    ) : expenditures.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-3 py-6 text-center text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                                Sin registros aún
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        expenditures.slice(-10).reverse().map((r) => (
                                                            <tr key={r.id_expenditure} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{r.expenditure_type}</td>
                                                                <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-purple)' }}>${Number(r.amount).toLocaleString('es-MX')}</td>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{r.destination}</td>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text-alt)' }}>{r.id_tourist}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'employment' && (
                                    <>
                                        <div className="flex gap-3 mb-4">
                                            <div className="rounded-xl border px-4 py-2.5 flex-1" style={kpiCardStyle}>
                                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Total registros</p>
                                                <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{employments.length}</p>
                                            </div>
                                            <div className="rounded-xl border px-4 py-2.5 flex-1" style={kpiCardStyle}>
                                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Salario promedio</p>
                                                <p className="text-lg font-bold" style={{ color: 'var(--color-cyan)' }}>
                                                    ${employments.length > 0 ? Math.round(totalSalary / employments.length).toLocaleString('es-MX') : 0}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr style={{ background: 'var(--color-bg-alt)' }}>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Puesto</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Contrato</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Género</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Salario</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Empresa ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loadingEmployments ? (
                                                        [1,2,3].map((i) => <SkeletonRow key={i} />)
                                                    ) : employments.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-3 py-6 text-center text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                                Sin registros aún
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        employments.slice(-10).reverse().map((r) => (
                                                            <tr key={r.id_employment} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{r.position}</td>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{r.contract_type}</td>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{r.gender}</td>
                                                                <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-cyan)' }}>${Number(r.salary).toLocaleString('es-MX')}</td>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text-alt)' }}>{r.id_company}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'input' && (
                                    <>
                                        <div className="flex gap-3 mb-4">
                                            <div className="rounded-xl border px-4 py-2.5 flex-1" style={kpiCardStyle}>
                                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>Total registros</p>
                                                <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{inputs.length}</p>
                                            </div>
                                            <div className="rounded-xl border px-4 py-2.5 flex-1" style={kpiCardStyle}>
                                                <p className="text-xs" style={{ color: 'var(--color-text-alt)' }}>CO₂ total (kg)</p>
                                                <p className="text-lg font-bold" style={{ color: 'var(--color-green)' }}>
                                                    {totalCO2.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr style={{ background: 'var(--color-bg-alt)' }}>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Tipo</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Consumo</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>CO₂</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Costo</th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>Empresa ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loadingInputs ? (
                                                        [1,2,3].map((i) => <SkeletonRow key={i} />)
                                                    ) : inputs.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-3 py-6 text-center text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                                Sin registros aún
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        inputs.slice(-10).reverse().map((r) => (
                                                            <tr key={r.id_input} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{r.input_type}</td>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{Number(r.consumption).toLocaleString('es-MX')}</td>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-green)' }}>{Number(r.carbon_footprint).toFixed(2)}</td>
                                                                <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-text)' }}>${Number(r.cost).toLocaleString('es-MX')}</td>
                                                                <td className="px-3 py-2" style={{ color: 'var(--color-text-alt)' }}>{r.id_company}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
