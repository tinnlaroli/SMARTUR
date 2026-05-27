import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { empresaApi } from '../api/empresaApi';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';

export function RegisterEmpresaPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { setUser } = useUserPreferences();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        companyName: '',
        phone: '',
        id_sector: '1',
        id_location: '1',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await empresaApi.register({
                name: form.name,
                email: form.email,
                password: form.password,
                companyName: form.companyName,
                phone: form.phone || undefined,
                id_sector: Number(form.id_sector),
                id_location: form.id_location ? Number(form.id_location) : undefined,
            });
            localStorage.setItem('token', res.token);
            setUser(res.user);
            setDone(true);
            redirectTimerRef.current = setTimeout(() => navigate('/empresa/dashboard', { replace: true }), 1800);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? t('empresa.register.errorGeneric');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1117] via-[#1a1f2e] to-[#0f1117] px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                            <Building2 className="text-white" size={20} />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">SMARTUR</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('empresa.register.title')}</h1>
                    <p className="text-zinc-400 text-sm">
                        {t('empresa.register.description')}
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 space-y-5 backdrop-blur-sm"
                >
                    {done ? (
                        <div className="flex flex-col items-center py-8 gap-4">
                            <CheckCircle2 className="text-green-400" size={48} />
                            <p className="text-white font-semibold text-lg">{t('empresa.register.success')}</p>
                            <p className="text-zinc-400 text-sm text-center">
                                {t('empresa.register.pendingVerification')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Datos de empresa */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    {t('empresa.register.company')}
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                    <input
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={handleChange}
                                        required
                                        placeholder={t('empresa.register.companyName')}
                                        className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('empresa.register.sector')}</label>
                                    <select
                                        name="id_sector"
                                        value={form.id_sector}
                                        onChange={handleChange}
                                        className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
                                    >
                                        <option value="1">{t('empresa.register.hoteleria')}</option>
                                        <option value="2">{t('empresa.register.restaurantes')}</option>
                                        <option value="3">{t('empresa.register.aventura')}</option>
                                        <option value="4">{t('empresa.register.cultura')}</option>
                                        <option value="5">{t('empresa.register.transporte')}</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('empresa.register.municipality')}</label>
                                    <select
                                        name="id_location"
                                        value={form.id_location}
                                        onChange={handleChange}
                                        className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-orange-500 text-sm"
                                    >
                                        <option value="1">{t('empresa.register.xalapa')}</option>
                                        <option value="2">{t('empresa.register.coatepec')}</option>
                                        <option value="3">{t('empresa.register.cordoba')}</option>
                                        <option value="4">{t('empresa.register.orizaba')}</option>
                                        <option value="5">{t('empresa.register.fortin')}</option>
                                        <option value="6">{t('empresa.register.xico')}</option>
                                        <option value="7">{t('empresa.register.ixtaczoquitlan')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder={t('empresa.register.phone')}
                                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
                                />
                            </div>

                            <hr className="border-white/10" />

                            {/* Datos de usuario */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    {t('empresa.register.representative')}
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        placeholder={t('empresa.register.fullName')}
                                        className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('empresa.register.email')}
                                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('empresa.register.password')}
                                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin" size={18} /> {t('empresa.register.registering')}</>
                                ) : (
                                    <><Building2 size={18} /> {t('empresa.register.registerBtn')}</>
                                )}
                            </button>

                            <p className="text-center text-zinc-500 text-sm">
                                {t('empresa.register.alreadyAccount')}{' '}
                                <Link to="/" className="text-orange-400 hover:text-orange-300 font-medium">
                                    {t('empresa.register.login')}
                                </Link>
                            </p>
                        </>
                    )}
                </form>

                <p className="text-center text-zinc-600 text-xs mt-6">
                    <MapPin size={12} className="inline mr-1" />
                    {t('empresa.register.subtitle')}
                </p>
            </div>
        </div>
    );
}
