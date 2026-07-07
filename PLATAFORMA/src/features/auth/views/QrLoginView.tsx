import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, RefreshCcw, Smartphone } from 'lucide-react';
import { setAccessToken, setStoredRefreshToken } from '../../../shared/api/axiosClient';
import { authApi } from '../authApi';
import { useToast } from '../../../shared/context/ToastContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';
import type { AuthStep } from '../context/AuthModalContext';

interface QrLoginViewProps {
    onSwitchStep: (step: AuthStep) => void;
    onClose?: () => void;
}

// El reto expira a los 2 min en el servidor (qrLoginController.js) — se
// refresca automáticamente el QR cuando eso pasa, sin que el usuario tenga
// que hacer nada.
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;

export const QrLoginView = ({ onSwitchStep, onClose }: QrLoginViewProps) => {
    const navigate = useNavigate();
    const toast = useToast();
    const { t } = useLanguage();
    const { setUser } = useUserPreferences();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [challenge, setChallenge] = useState<{ challengeId: number; token: string } | null>(null);
    const [status, setStatus] = useState<'pending' | 'expired' | 'denied' | 'error'>('pending');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (expiryRef.current) clearTimeout(expiryRef.current);
    };

    const startChallenge = async () => {
        clearTimers();
        setStatus('pending');
        try {
            const res = await authApi.createQrChallenge();
            setChallenge({ challengeId: res.challengeId, token: res.token });

            pollRef.current = setInterval(async () => {
                try {
                    const { status: current } = await authApi.getQrChallengeStatus(res.challengeId);
                    if (current === 'approved') {
                        clearTimers();
                        const exchanged = await authApi.exchangeQrChallenge(res.challengeId, res.token);
                        setAccessToken(exchanged.token);
                        if (exchanged.refreshToken) setStoredRefreshToken(exchanged.refreshToken, false);
                        setUser(exchanged.user);
                        toast.success(t('auth.qrLogin.success.title'), t('auth.qrLogin.success.body'));

                        const userRole = exchanged.user.role_id;
                        if (userRole === 1) navigate('/dashboard');
                        else if (userRole === 3) navigate('/empresa/dashboard');
                        else navigate('/', { state: { openForm: true } });
                        if (onClose) onClose();
                    } else if (current === 'denied') {
                        clearTimers();
                        setStatus('denied');
                    } else if (current === 'expired') {
                        clearTimers();
                        setStatus('expired');
                    }
                } catch {
                    // Un error puntual de polling no debe tumbar el flujo — se reintenta en el próximo tick.
                }
            }, POLL_INTERVAL_MS);

            expiryRef.current = setTimeout(() => {
                clearTimers();
                setStatus((s) => (s === 'pending' ? 'expired' : s));
            }, CHALLENGE_TTL_MS);
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => {
        startChallenge();
        return clearTimers;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const qrValue = challenge ? `${challenge.challengeId}:${challenge.token}` : '';

    return (
        <div className="w-full">
            <div className="mb-6 flex justify-center">
                <div className="rounded-full p-3" style={{ background: 'rgba(var(--rgb-purple-accent),0.1)' }}>
                    <Smartphone className="size-8" style={{ color: 'var(--color-purple)' }} />
                </div>
            </div>

            <div className="mb-6 text-center">
                <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {t('auth.qrLogin.title')}
                </h2>
                <p className={`mt-2 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {t('auth.qrLogin.subtitle')}
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                {status === 'pending' && challenge && (
                    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: '#ffffff' }}>
                        <QRCodeSVG value={qrValue} size={200} />
                    </div>
                )}

                {status === 'expired' && (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t('auth.qrLogin.expired')}</p>
                        <button
                            type="button"
                            onClick={startChallenge}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                            style={{ background: 'var(--color-purple)' }}
                        >
                            <RefreshCcw className="size-4" />
                            {t('auth.qrLogin.regenerate')}
                        </button>
                    </div>
                )}

                {status === 'denied' && (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t('auth.qrLogin.denied')}</p>
                        <button
                            type="button"
                            onClick={startChallenge}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                            style={{ background: 'var(--color-purple)' }}
                        >
                            <RefreshCcw className="size-4" />
                            {t('auth.qrLogin.regenerate')}
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <p className="py-8 text-sm text-red-500">{t('auth.qrLogin.error')}</p>
                )}

                <ol className={`w-full space-y-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    <li>1. {t('auth.qrLogin.step1')}</li>
                    <li>2. {t('auth.qrLogin.step2')}</li>
                    <li>3. {t('auth.qrLogin.step3')}</li>
                </ol>
            </div>

            <div className="mt-8 text-center">
                <button
                    type="button"
                    onClick={() => onSwitchStep('login')}
                    className="mx-auto flex items-center justify-center gap-2 text-xs transition-colors nav-item-idle"
                >
                    <ArrowLeft className="size-3" />
                    {t('auth.twoFactor.back')}
                </button>
            </div>
        </div>
    );
};
