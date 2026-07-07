import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginView } from '../LoginView';
import { ToastProvider } from '../../../../shared/context/ToastContext';
import { UserPreferencesProvider } from '../../../../contexts/UserPreferencesContext';
import { AuthModalProvider } from '../../context/AuthModalContext';
import { authApi } from '../../authApi';

vi.mock('../../authApi', () => ({
    authApi: {
        login: vi.fn(),
    },
}));

function renderView() {
    return render(
        <MemoryRouter>
            <UserPreferencesProvider>
                <ToastProvider>
                    <AuthModalProvider>
                        <LoginView onSwitchStep={vi.fn()} />
                    </AuthModalProvider>
                </ToastProvider>
            </UserPreferencesProvider>
        </MemoryRouter>,
    );
}

describe('LoginView', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('shows a social-account specific message when login fails with SOCIAL_ACCOUNT', async () => {
        const user = userEvent.setup();
        vi.mocked(authApi.login).mockRejectedValue({
            response: {
                data: {
                    code: 'SOCIAL_ACCOUNT',
                    provider: 'google',
                    message: 'Esta cuenta usa Google para iniciar sesión.',
                },
            },
        });

        renderView();

        await user.type(screen.getByLabelText(/correo electrónico|email address/i), 'user@example.com');
        await user.type(screen.getByLabelText(/contraseña|password/i), 'secret123');
        await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

        await waitFor(() => {
            expect(authApi.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret123' });
        });

        expect(await screen.findByText('Esta cuenta usa Google para iniciar sesión.')).toBeInTheDocument();
    });

    it('shows a generic error message for non-social-account failures', async () => {
        const user = userEvent.setup();
        vi.mocked(authApi.login).mockRejectedValue(new Error('network down'));

        renderView();

        await user.type(screen.getByLabelText(/correo electrónico|email address/i), 'user@example.com');
        await user.type(screen.getByLabelText(/contraseña|password/i), 'secret123');
        await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

        expect(await screen.findByText('No se pudo iniciar sesión')).toBeInTheDocument();
    });
});
