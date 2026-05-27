import { useState, useMemo, useEffect } from 'react';
import { useStatistics } from '../hooks/useStatistics';
import { statisticsApi } from '../api/statisticsApi';
import type { TouristOption, LocationOption } from '../types/types';
import {
    DollarSign, Briefcase, Zap, BarChart3, Loader2,
    Users, MapPin, TrendingUp, Leaf, ChevronDown, Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartURSpinner } from '../../../components/ui/SmartURSpinner';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getDashboardText } from '../../../shared/i18n/dashboardLocale';
import { companyServices } from '../../companies/api/companyApi';
import type { Company } from '../../companies/types/types';

type TabKey = 'expenditure' | 'employment' | 'input';

/* ── Shared styles ─────────────────────────────────────────────────────────── */
const inputCls =
    'mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/40';
const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg-alt)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text)',
};

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
        {children}
        {required && <span className="ml-1 text-pink-500">*</span>}
    </label>
);

/* ── KPI card ──────────────────────────────────────────────────────────────── */
const KpiCard = ({
    label,
    value,
    sub,
    color,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color: string;
    icon: React.ElementType;
}) => (
    <div
        className="flex items-start gap-3 rounded-2xl border p-4"
        style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
    >
        <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${color}1A` }}
        >
            <Icon className="size-4" style={{ color }} />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-alt)' }}>
                {label}
            </p>
            <p className="mt-0.5 truncate text-xl font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
                {value}
            </p>
            {sub && (
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                    {sub}
                </p>
            )}
        </div>
    </div>
);

/* ── Searchable select (for tourists) ─────────────────────────────────────── */
const SearchSelect = ({
    placeholder,
    options,
    value,
    onChange,
    loading,
    renderLabel,
    renderSub,
}: {
    placeholder: string;
    options: TouristOption[];
    value: number;
    onChange: (v: number) => void;
    loading: boolean;
    renderLabel: (o: TouristOption) => string;
    renderSub: (o: TouristOption) => string;
}) => {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = useMemo(
        () =>
            options.filter(
                (o) =>
                    renderLabel(o).toLowerCase().includes(search.toLowerCase()) ||
                    renderSub(o).toLowerCase().includes(search.toLowerCase()),
            ),
        [options, search],
    );

    const selected = options.find((o) => o.userId === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className={`${inputCls} flex items-center justify-between gap-2 text-left`}
                style={inputStyle}
            >
                {loading ? (
                    <span className="flex items-center gap-2" style={{ color: 'var(--color-text-alt)' }}>
                        <Loader2 className="size-4 animate-spin" /> Cargando…
                    </span>
                ) : selected ? (
                    <span className="flex flex-col leading-tight">
                        <span style={{ color: 'var(--color-text)' }}>{renderLabel(selected)}</span>
                        <span className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>{renderSub(selected)}</span>
                    </span>
                ) : (
                    <span style={{ color: 'var(--color-text-alt)' }}>{placeholder}</span>
                )}
                <ChevronDown className="size-4 shrink-0" style={{ color: 'var(--color-text-alt)' }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
                            <Search className="size-4 shrink-0" style={{ color: 'var(--color-text-alt)' }} />
                            <input
                                autoFocus
                                className="w-full bg-transparent text-sm outline-none"
                                style={{ color: 'var(--color-text)' }}
                                placeholder={t('statistics.searchPlaceholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <p className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-alt)' }}>{t('statistics.noResults')}</p>
                            ) : (
                                filtered.map((o) => (
                                    <button
                                        key={o.userId}
                                        type="button"
                                        className="flex w-full flex-col px-4 py-2.5 text-left transition-colors hover:bg-violet-500/10"
                                        onClick={() => { onChange(o.userId); setOpen(false); setSearch(''); }}
                                    >
                                        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                            {renderLabel(o)}
                                        </span>
                                        <span className="text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                            {renderSub(o)}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ── Skeleton row ──────────────────────────────────────────────────────────── */
const SkeletonRow = ({ cols }: { cols: number }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-3 py-2">
                <div className="h-3 rounded animate-pulse" style={{ background: 'var(--color-border)', width: `${55 + ((i * 17) % 40)}%` }} />
            </td>
        ))}
    </tr>
);

/* ── Table wrapper ─────────────────────────────────────────────────────────── */
const DataTable = ({ headers, loading, empty, colSpan, children }: {
    headers: string[];
    loading: boolean;
    empty: boolean;
    colSpan: number;
    children: React.ReactNode;
}) => (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ background: 'var(--color-bg-alt)' }}>
                        {headers.map((h) => (
                            <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--color-text-alt)' }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        [1, 2, 3].map((i) => <SkeletonRow key={i} cols={colSpan} />)
                    ) : empty ? (
                        <tr>
                            <td colSpan={colSpan} className="px-3 py-8 text-center text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                Sin registros aún — usa el formulario para añadir el primero
                            </td>
                        </tr>
                    ) : children}
                </tbody>
            </table>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */

export const StatisticsPage = () => {
    const {
        isLoading,
        expenditures, employments, inputs,
        loadingExpenditures, loadingEmployments, loadingInputs,
        fetchExpenditures, fetchEmployments, fetchInputs,
        recordExpenditure, recordEmployment, recordInput,
    } = useStatistics();

    const [activeTab, setActiveTab] = useState<TabKey>('expenditure');
    const { lang, t } = useLanguage();
    const m = useMemo(() => getDashboardText(lang).modules, [lang]);

    // ── Reference data ────────────────────────────────────────────────────
    const [companies, setCompanies] = useState<Company[]>([]);
    const [tourists, setTourists] = useState<TouristOption[]>([]);
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingTourists, setLoadingTourists] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(false);

    useEffect(() => {
        let alive = true;

        setLoadingCompanies(true);
        companyServices.findAll(1, 200)
            .then((r) => { if (alive) setCompanies(r.companies); })
            .catch(() => {})
            .finally(() => { if (alive) setLoadingCompanies(false); });

        setLoadingTourists(true);
        statisticsApi.getTourists()
            .then((r) => { if (alive) setTourists(r); })
            .catch(() => {})
            .finally(() => { if (alive) setLoadingTourists(false); });

        setLoadingLocations(true);
        statisticsApi.getLocations()
            .then((r) => { if (alive) setLocations(r); })
            .catch(() => {})
            .finally(() => { if (alive) setLoadingLocations(false); });

        return () => { alive = false; };
    }, []);

    // ── Fetch on tab change ───────────────────────────────────────────────
    useEffect(() => {
        if (activeTab === 'expenditure') fetchExpenditures();
        if (activeTab === 'employment') fetchEmployments();
        if (activeTab === 'input') fetchInputs();
    }, [activeTab]);

    // ── Tourist / company lookup helpers ─────────────────────────────────
    const companyMap = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);
    const touristMap = useMemo(
        () => new Map(tourists.map((t) => [t.userId, `${t.name} (${t.email})`])),
        [tourists],
    );

    // ── Form state ───────────────────────────────────────────────────────
    const [selTourist, setSelTourist] = useState<number>(0);

    // ── Tab definitions ──────────────────────────────────────────────────
    const tabs = useMemo(
        () => [
            { key: 'expenditure' as const, label: m.statistics.tabExpenditure, icon: DollarSign, color: 'var(--color-purple)' },
            { key: 'employment' as const, label: m.statistics.tabEmployment, icon: Briefcase, color: 'var(--color-cyan)' },
            { key: 'input' as const, label: m.statistics.tabCarbon, icon: Zap, color: 'var(--color-green)' },
        ] as const,
        [lang],
    );
    const activeTabData = tabs.find((t) => t.key === activeTab)!;

    // ── KPI derived ──────────────────────────────────────────────────────
    const totalExpAmount = expenditures.reduce((s, r) => s + Number(r.amount), 0);
    const avgExpAmount = expenditures.length > 0 ? totalExpAmount / expenditures.length : 0;
    const mostCommonExpType = useMemo(() => {
        if (!expenditures.length) return '—';
        const freq: Record<string, number> = {};
        expenditures.forEach((r) => { freq[r.expenditureType] = (freq[r.expenditureType] || 0) + 1; });
        return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    }, [expenditures]);

    const totalSalary = employments.reduce((s, r) => s + Number(r.salary), 0);
    const avgSalary = employments.length > 0 ? totalSalary / employments.length : 0;
    const fullTimeCount = employments.filter((r) => r.contractType === 'Tiempo Completo').length;

    const totalCO2 = inputs.reduce((s, r) => s + Number(r.carbonFootprint ?? 0), 0);
    const totalCost = inputs.reduce((s, r) => s + Number(r.cost), 0);
    const mostCommonInput = useMemo(() => {
        if (!inputs.length) return '—';
        const freq: Record<string, number> = {};
        inputs.forEach((r) => { freq[r.inputType] = (freq[r.inputType] || 0) + 1; });
        return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    }, [inputs]);

    /* ── Format helpers ─────────────────────────────────────────────────── */
    const mxn = (v: number) => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    return (
        <div className="relative flex h-[calc(100vh-9rem)] flex-col gap-4 overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'var(--color-purple)' }}>
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

            {/* Tabs */}
            <div className="flex gap-1 rounded-2xl p-1.5 shrink-0" style={{ background: 'var(--color-bg-alt)' }}>
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

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-2xl border p-5 shadow-sm"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                    >
                        {/* Panel header */}
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: activeTabData.color }}>
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

                        {/* 2-column: form left + data right */}
                        <div className="flex flex-col gap-6 lg:flex-row">

                            {/* ── LEFT: Form (fixed width) ────────────────────────────────── */}
                            <div className="w-full shrink-0 lg:w-72">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: activeTabData.color }}>
                                    Registrar nuevo
                                </p>

                                {/* ── GASTO TURÍSTICO ─────────────────────────────────────── */}
                                {activeTab === 'expenditure' && (
                                    <form
                                        key="exp-form"
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!selTourist) return;
                                            const fd = new FormData(e.currentTarget);
                                            const ok = await recordExpenditure({
                                                id_tourist: selTourist,
                                                expenditure_type: fd.get('type') as string,
                                                amount: Number(fd.get('amount')),
                                                destination: fd.get('destination') as string,
                                            });
                                            if (ok) { e.currentTarget.reset(); setSelTourist(0); }
                                        }}
                                        className="space-y-3"
                                    >
                                        {/* Turista */}
                                        <div>
                                            <Label required>{t('statistics.touristLabel')}</Label>
                                            <SearchSelect
                                                placeholder="Buscar turista…"
                                                options={tourists}
                                                value={selTourist}
                                                onChange={setSelTourist}
                                                loading={loadingTourists}
                                                renderLabel={(o) => o.name}
                                                renderSub={(o) => o.email}
                                            />
                                            {tourists.length === 0 && !loadingTourists && (
                                                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                    {m.statistics.noProfiles}
                                                </p>
                                            )}
                                        </div>

                                        {/* Tipo de gasto */}
                                        <div>
                                            <Label required>{m.statistics.expType}</Label>
                                            <select name="type" className={inputCls} style={inputStyle} required>
                                                <option value="">{m.statistics.selectType}</option>
                                                <option value="Alojamiento">🏨 Alojamiento</option>
                                                <option value="Gastronomía">🍽️ Gastronomía</option>
                                                <option value="Transporte">🚌 Transporte</option>
                                                <option value="Actividades recreativas">🎯 Actividades recreativas</option>
                                                <option value="Compras y artesanías">🛍️ Compras y artesanías</option>
                                                <option value="Servicios turísticos">🗺️ Servicios turísticos</option>
                                                <option value="Otros">📦 Otros</option>
                                            </select>
                                        </div>

                                        {/* Monto */}
                                        <div>
                                            <Label required>{m.statistics.amount}</Label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--color-text-alt)', marginTop: '2px' }}>$</span>
                                                <input name="amount" type="number" min="0" step="0.01" placeholder="0.00"
                                                    className={`${inputCls} pl-7`} style={inputStyle} required />
                                            </div>
                                        </div>

                                        {/* Destino — selector de ubicaciones */}
                                        <div>
                                            <Label required>{m.statistics.destination}</Label>
                                            {loadingLocations ? (
                                                <div className="mt-1.5 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                    <Loader2 className="size-4 animate-spin" /> {m.statistics.loadingLocations}
                                                </div>
                                            ) : (
                                                <select name="destination" className={inputCls} style={inputStyle} required>
                                                    <option value="">{m.statistics.selectDestination}</option>
                                                    {locations.map((loc) => (
                                                        <option key={loc.id} value={loc.name}>
                                                            {loc.name}{loc.municipality ? ` — ${loc.municipality}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <button type="submit" disabled={isLoading || !selTourist}
                                            className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                            style={{ background: activeTabData.color }}>
                                            {isLoading ? <><SmartURSpinner size={18} /> {m.statistics.saving}</> : m.statistics.btnSaveExpense}
                                        </button>
                                    </form>
                                )}

                                {/* ── EMPLEO ──────────────────────────────────────────────── */}
                                {activeTab === 'employment' && (
                                    <form
                                        key="emp-form"
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
                                        className="space-y-3"
                                    >
                                        <div>
                                            <Label required>{m.statistics.company}</Label>
                                            {loadingCompanies ? (
                                                <div className="mt-1.5 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                    <Loader2 className="size-4 animate-spin" /> {m.statistics.loadingCompanies}
                                                </div>
                                            ) : (
                                                <select name="company_id" className={inputCls} style={inputStyle} required>
                                                    <option value="">{m.statistics.selectCompany}</option>
                                                    {companies.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <Label required>{m.statistics.position}</Label>
                                            <input name="position" placeholder={m.statistics.positionPh}
                                                className={inputCls} style={inputStyle} required />
                                        </div>

                                        <div>
                                            <Label required>{m.statistics.contractType}</Label>
                                            <select name="contract" className={inputCls} style={inputStyle} required>
                                                <option value="Tiempo Completo">{m.statistics.contractFull}</option>
                                                <option value="Medio Tiempo">{m.statistics.contractHalf}</option>
                                                <option value="Temporal">{m.statistics.contractTemporal}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label required>{m.statistics.gender}</Label>
                                            <select name="gender" className={inputCls} style={inputStyle} required>
                                                <option value="Masculino">{m.statistics.genderMale}</option>
                                                <option value="Femenino">{m.statistics.genderFemale}</option>
                                                <option value="No binario">{m.statistics.genderNb}</option>
                                                <option value="Prefiero no decir">{m.statistics.genderPreferNot}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label required>{m.statistics.salary}</Label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--color-text-alt)', marginTop: '2px' }}>$</span>
                                                <input name="salary" type="number" min="0" placeholder="0.00"
                                                    className={`${inputCls} pl-7`} style={inputStyle} required />
                                            </div>
                                        </div>

                                        <button type="submit" disabled={isLoading}
                                            className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                            style={{ background: activeTabData.color }}>
                                            {isLoading ? <><SmartURSpinner size={18} /> {m.statistics.saving}</> : m.statistics.btnRegisterEmployee}
                                        </button>
                                    </form>
                                )}

                                {/* ── INSUMOS ─────────────────────────────────────────────── */}
                                {activeTab === 'input' && (
                                    <form
                                        key="inp-form"
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
                                        className="space-y-3"
                                    >
                                        <div>
                                            <Label required>{m.statistics.company}</Label>
                                            {loadingCompanies ? (
                                                <div className="mt-1.5 flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-alt)' }}>
                                                    <Loader2 className="size-4 animate-spin" /> {m.statistics.loadingCompanies}
                                                </div>
                                            ) : (
                                                <select name="company_id" className={inputCls} style={inputStyle} required>
                                                    <option value="">{m.statistics.selectCompany}</option>
                                                    {companies.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <Label required>{m.statistics.inputType}</Label>
                                            <select name="type" className={inputCls} style={inputStyle} required>
                                                <option value="Energía Eléctrica">⚡ {m.statistics.inputElectric}</option>
                                                <option value="Agua">💧 {m.statistics.inputWater}</option>
                                                <option value="Gas - Combustible">🔥 {m.statistics.inputGas}</option>
                                                <option value="Residuos sólidos">♻️ {m.statistics.inputSolidWaste}</option>
                                                <option value="Otros insumos">📦 {m.statistics.inputOther}</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label required>{m.statistics.consumption}</Label>
                                                <input name="consumption" type="number" min="0" step="0.01" placeholder={m.statistics.consumptionPh}
                                                    className={inputCls} style={inputStyle} required />
                                            </div>
                                            <div>
                                                <Label required>{m.statistics.co2kg}</Label>
                                                <input name="carbon" type="number" min="0" step="0.001" placeholder="0.000"
                                                    className={inputCls} style={inputStyle} required />
                                            </div>
                                        </div>

                                        <div>
                                            <Label required>{m.statistics.cost}</Label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--color-text-alt)', marginTop: '2px' }}>$</span>
                                                <input name="cost" type="number" min="0" step="0.01" placeholder="0.00"
                                                    className={`${inputCls} pl-7`} style={inputStyle} required />
                                            </div>
                                        </div>

                                        <button type="submit" disabled={isLoading}
                                            className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                            style={{ background: activeTabData.color }}>
                                            {isLoading ? <><SmartURSpinner size={18} /> {m.statistics.saving}</> : m.statistics.btnSaveIndicators}
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* ── RIGHT: KPIs + table ─────────────────────────────────────── */}
                            <div className="flex-1 min-w-0 space-y-4">

                                {/* KPI grid — 2×2 */}
                                {activeTab === 'expenditure' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                                            <KpiCard label={m.statistics.kpiRecords} value={expenditures.length} color="var(--color-purple)" icon={BarChart3} />
                                            <KpiCard label={m.statistics.kpiTotalAmount} value={mxn(totalExpAmount)} color="var(--color-purple)" icon={DollarSign} />
                                            <KpiCard label={m.statistics.kpiAvgPerRecord} value={mxn(avgExpAmount)} color="var(--color-purple)" icon={TrendingUp} />
                                            <KpiCard label={m.statistics.kpiMostFrequentType} value={mostCommonExpType} color="var(--color-purple)" icon={BarChart3} />
                                        </div>

                                        <DataTable
                                            headers={[m.statistics.tableTourist, m.statistics.tableExpType, m.statistics.tableAmount, m.statistics.tableDestination, m.statistics.tableDate]}
                                            loading={loadingExpenditures}
                                            empty={expenditures.length === 0}
                                            colSpan={5}
                                        >
                                            {expenditures.slice(-20).reverse().map((r) => (
                                                <tr key={r.id} className="border-t transition-colors hover:bg-violet-500/5" style={{ borderColor: 'var(--color-border)' }}>
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                                {touristMap.get(r.touristId)?.split(' (')[0] ?? `ID ${r.touristId}`}
                                                            </span>
                                                            <span className="text-[11px]" style={{ color: 'var(--color-text-alt)' }}>
                                                                {touristMap.get(r.touristId)?.match(/\((.+)\)/)?.[1] ?? ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium"
                                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                                            {r.expenditureType}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 font-semibold tabular-nums" style={{ color: 'var(--color-purple)' }}>
                                                        {mxn(Number(r.amount))}
                                                    </td>
                                                    <td className="px-3 py-2.5 flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                                                        <MapPin className="size-3.5 shrink-0 opacity-50" />
                                                        {r.destination}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>
                                                        {r.date ? new Date(r.date).toLocaleDateString('es-MX') : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </DataTable>
                                    </>
                                )}

                                {activeTab === 'employment' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                                            <KpiCard label={m.statistics.kpiRegisteredJobs} value={employments.length} color="var(--color-cyan)" icon={Users} />
                                            <KpiCard label={m.statistics.kpiAvgSalary} value={mxn(avgSalary)} color="var(--color-cyan)" icon={DollarSign} />
                                            <KpiCard label={m.statistics.kpiTotalPayroll} value={mxn(totalSalary)} color="var(--color-cyan)" icon={TrendingUp} />
                                            <KpiCard label={m.statistics.kpiFullTime} value={`${fullTimeCount} / ${employments.length}`} color="var(--color-cyan)" icon={Briefcase} sub={employments.length ? `${Math.round((fullTimeCount / employments.length) * 100)}%` : ''} />
                                        </div>

                                        <DataTable
                                            headers={[m.statistics.tableCompany, m.statistics.tablePosition, m.statistics.tableContract, m.statistics.tableGender, m.statistics.tableSalary]}
                                            loading={loadingEmployments}
                                            empty={employments.length === 0}
                                            colSpan={5}
                                        >
                                            {employments.slice(-20).reverse().map((r) => (
                                                <tr key={r.id} className="border-t transition-colors hover:bg-cyan-500/5" style={{ borderColor: 'var(--color-border)' }}>
                                                    <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--color-text)' }}>
                                                        {companyMap.get(r.companyId) ?? `Empresa ${r.companyId}`}
                                                    </td>
                                                    <td className="px-3 py-2.5" style={{ color: 'var(--color-text)' }}>{r.position}</td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium"
                                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                                            {r.contractType}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--color-text-alt)' }}>{r.gender}</td>
                                                    <td className="px-3 py-2.5 font-semibold tabular-nums" style={{ color: 'var(--color-cyan)' }}>
                                                        {mxn(Number(r.salary))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </DataTable>
                                    </>
                                )}

                                {activeTab === 'input' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                                            <KpiCard label={m.statistics.kpiRecords} value={inputs.length} color="var(--color-green)" icon={BarChart3} />
                                            <KpiCard label={m.statistics.kpiTotalCO2} value={totalCO2.toFixed(2)} color="var(--color-green)" icon={Leaf} />
                                            <KpiCard label={m.statistics.kpiTotalCost} value={mxn(totalCost)} color="var(--color-green)" icon={DollarSign} />
                                            <KpiCard label={m.statistics.kpiFrequentInput} value={mostCommonInput} color="var(--color-green)" icon={Zap} />
                                        </div>

                                        <DataTable
                                            headers={[m.statistics.tableCompany, m.statistics.tableInput, m.statistics.tableConsumption, m.statistics.tableCO2, m.statistics.tableCost]}
                                            loading={loadingInputs}
                                            empty={inputs.length === 0}
                                            colSpan={5}
                                        >
                                            {inputs.slice(-20).reverse().map((r) => (
                                                <tr key={r.id} className="border-t transition-colors hover:bg-green-500/5" style={{ borderColor: 'var(--color-border)' }}>
                                                    <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--color-text)' }}>
                                                        {companyMap.get(r.companyId) ?? `Empresa ${r.companyId}`}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium"
                                                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                                            {r.inputType}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 tabular-nums text-xs" style={{ color: 'var(--color-text)' }}>
                                                        {r.consumption != null ? Number(r.consumption).toLocaleString('es-MX') : '—'}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-semibold tabular-nums" style={{ color: 'var(--color-green)' }}>
                                                        {r.carbonFootprint != null ? Number(r.carbonFootprint).toFixed(3) : '—'}
                                                    </td>
                                                    <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--color-text)' }}>
                                                        {mxn(Number(r.cost))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </DataTable>
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
