import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, Phone, MapPin, Loader2, CheckCircle2, Eye, EyeOff, X, Check, ArrowLeft } from 'lucide-react';
import { empresaApi } from '../api/empresaApi';
import { useLanguage } from '../../../contexts/LanguageContext';

const PASSWORD_RULES = [
    { key: 'min', test: (pw: string) => pw.length >= 8 },
    { key: 'uppercase', test: (pw: string) => /[A-Z]/.test(pw) },
    { key: 'number', test: (pw: string) => /[0-9]/.test(pw) },
    { key: 'special', test: (pw: string) => /[!@#$%^&*(),.?":{}|<>_]/.test(pw) },
] as const;

export function RegisterEmpresaPage() {
    const { t } = useLanguage();

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
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordTouched, setPasswordTouched] = useState(false);

    const passwordRules = useCallback(() => {
        return PASSWORD_RULES.map((rule) => ({
            key: rule.key,
            passed: rule.test(form.password),
            label: t(`auth.password.${rule.key}`),
        }));
    }, [form.password, t]);

    const passwordStrength = useCallback(() => {
        const passed = PASSWORD_RULES.filter((r) => r.test(form.password)).length;
        if (passed === 0) return { level: 0, label: '', color: '' };
        if (passed <= 2) return { level: 1, label: t('auth.password.weak'), color: 'bg-red-500' };
        if (passed === 3) return { level: 2, label: t('auth.password.medium'), color: 'bg-yellow-500' };
        return { level: 3, label: t('auth.password.strong'), color: 'bg-green-500' };
    }, [form.password, t]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (name === 'email') setEmailError(null);
        if (name === 'password') {
            setPasswordTouched(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setEmailError(null);

        const rules = passwordRules();
        const allPassed = rules.every((r) => r.passed);
        if (!allPassed) {
            setPasswordTouched(true);
            return;
        }

        setLoading(true);
        try {
            await empresaApi.register({
                name: form.name,
                email: form.email,
                password: form.password,
                companyName: form.companyName,
                phone: form.phone || undefined,
                id_sector: Number(form.id_sector),
                id_location: form.id_location ? Number(form.id_location) : undefined,
            });
            setSubmittedEmail(form.email.trim());
            setDone(true);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? '';
            if (/email/i.test(msg)) {
                setEmailError('Correo electrónico no válido');
            } else {
                setError(msg || t('empresa.register.errorGeneric'));
            }
        } finally {
            setLoading(false);
        }
    };

    const strength = passwordStrength();
    const rules = passwordTouched ? passwordRules() : [];

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
                        <div className="flex flex-col items-center py-8 gap-5">
                            <CheckCircle2 className="text-green-400" size={48} />
                            <div className="text-center space-y-2">
                                <p className="text-white font-semibold text-lg">{t('empresa.register.success')}</p>
                                <p className="text-zinc-400 text-sm">
                                    Enviamos el código de verificación a:
                                </p>
                                <p className="text-orange-400 font-semibold text-sm break-all">
                                    {submittedEmail}
                                </p>
                                <p className="text-zinc-500 text-xs pt-1">
                                    {t('empresa.register.pendingVerification')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDone(false)}
                                className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors mt-2"
                            >
                                <ArrowLeft size={15} />
                                ¿El correo es incorrecto? Volver y corregir datos
                            </button>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                    className={`w-full bg-white/[0.06] border rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none text-sm ${
                                        emailError ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-orange-500'
                                    }`}
                                />
                                {emailError && (
                                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                        <X className="size-3" /> {emailError}
                                    </p>
                                )}
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={handleChange}
                                    onFocus={() => setPasswordTouched(true)}
                                    required
                                    placeholder={t('empresa.register.password')}
                                    className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>

                            {passwordTouched && form.password.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                                                style={{ width: `${(strength.level / 3) * 100}%` }}
                                            />
                                        </div>
                                        {strength.label && (
                                            <span className="text-xs font-medium text-zinc-400 min-w-[3rem] text-right">
                                                {strength.label}
                                            </span>
                                        )}
                                    </div>
                                    <ul className="space-y-1">
                                        {rules.map((rule) => (
                                            <li key={rule.key} className="flex items-center gap-2 text-xs">
                                                {rule.passed ? (
                                                    <Check className="size-3 text-green-400 shrink-0" />
                                                ) : (
                                                    <X className="size-3 text-zinc-600 shrink-0" />
                                                )}
                                                <span className={rule.passed ? 'text-green-400' : 'text-zinc-500'}>
                                                    {rule.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

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
