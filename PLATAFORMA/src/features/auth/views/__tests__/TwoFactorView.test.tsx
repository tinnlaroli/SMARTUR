import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TwoFactorView } from '../TwoFactorView';
import { ToastProvider } from '../../../../shared/context/ToastContext';
import { UserPreferencesProvider } from '../../../../contexts/UserPreferencesContext';

vi.mock('../../authApi', () => ({
    authApi: {
        resendOtp: vi.fn().mockResolvedValue({ message: 'ok' }),
        twoFactor: vi.fn(),
    },
}));

function renderView() {
    return render(
        <MemoryRouter>
            <UserPreferencesProvider>
                <ToastProvider>
                    <TwoFactorView email="user@example.com" onSwitchStep={vi.fn()} />
                </ToastProvider>
            </UserPreferencesProvider>
        </MemoryRouter>,
    );
}

describe('TwoFactorView', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('shows the resend button disabled during the initial cooldown', () => {
        renderView();
        const resendButton = screen.getByRole('button', { name: /30s/i });
        expect(resendButton).toBeDisabled();
    });

    it('counts down the resend cooldown each second and enables the button once it reaches zero', () => {
        renderView();

        act(() => {
            vi.advanceTimersByTime(29_000);
        });
        expect(screen.getByRole('button', { name: /1s/i })).toBeDisabled();

        act(() => {
            vi.advanceTimersByTime(1_000);
        });

        const resendButton = screen.getByRole('button', { name: /reenviar|resend/i });
        expect(resendButton).not.toBeDisabled();
    });

    it('counts down the OTP expiry timer', () => {
        renderView();
        expect(screen.getByText(/5:00/)).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(60_000);
        });

        expect(screen.getByText(/4:00/)).toBeInTheDocument();
    });
});
