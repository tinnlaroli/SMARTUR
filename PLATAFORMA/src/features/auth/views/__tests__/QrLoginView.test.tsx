import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QrLoginView } from '../QrLoginView';
import { ToastProvider } from '../../../../shared/context/ToastContext';
import { UserPreferencesProvider } from '../../../../contexts/UserPreferencesContext';
import { authApi } from '../../authApi';

vi.mock('../../authApi', () => ({
    authApi: {
        createQrChallenge: vi.fn(),
        getQrChallengeStatus: vi.fn(),
        exchangeQrChallenge: vi.fn(),
    },
}));

function renderView() {
    return render(
        <MemoryRouter>
            <UserPreferencesProvider>
                <ToastProvider>
                    <QrLoginView onSwitchStep={vi.fn()} />
                </ToastProvider>
            </UserPreferencesProvider>
        </MemoryRouter>,
    );
}

describe('QrLoginView', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('goes from pending to approved and exchanges the challenge', async () => {
        vi.mocked(authApi.createQrChallenge).mockResolvedValue({ challengeId: 1, token: 'tok', expiresAt: '' });
        vi.mocked(authApi.getQrChallengeStatus).mockResolvedValue({ status: 'approved' });
        vi.mocked(authApi.exchangeQrChallenge).mockResolvedValue({
            token: 'jwt',
            user: { id: 2, name: 'Ana', email: 'ana@example.com', role_id: 2 },
        });

        renderView();

        // Let the initial createQrChallenge promise resolve.
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        // Trigger the first poll tick, flushing microtasks in between so the
        // async status/exchange calls inside the interval callback settle.
        for (let i = 0; i < 5; i++) {
            await act(async () => {
                vi.advanceTimersByTime(2000);
                await Promise.resolve();
                await Promise.resolve();
            });
        }

        expect(authApi.exchangeQrChallenge).toHaveBeenCalledWith(1, 'tok');
    }, 10000);

    it('moves from pending to expired when the challenge TTL elapses, and shows a regenerate button', async () => {
        vi.mocked(authApi.createQrChallenge).mockResolvedValue({ challengeId: 1, token: 'tok', expiresAt: '' });
        vi.mocked(authApi.getQrChallengeStatus).mockResolvedValue({ status: 'pending' });

        renderView();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        await act(async () => {
            vi.advanceTimersByTime(2 * 60 * 1000);
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(screen.getByRole('button', { name: /generar nuevo código|generate new code/i })).toBeInTheDocument();
    }, 10000);
});
