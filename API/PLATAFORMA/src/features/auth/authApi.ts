import { api } from '../../shared/api/axiosClient';
import type { LoginPayload, SignUpPayload, TwoFactorPayload, TwoFactorResponse, ForgotPasswordPayload, ResetPasswordPayload, LoginResponse } from './types';

export const authApi = {
    login: async (payload: LoginPayload) => {
        const { data } = await api.post<LoginResponse>('/login', payload);
        return data;
    },

    signUp: async (payload: SignUpPayload) => {
        const formData = new FormData();

        // Campos de texto — se convierten a string explícitamente
        if (payload.name) formData.append('name', payload.name);
        if (payload.email) formData.append('email', payload.email);
        if (payload.password) formData.append('password', payload.password);
        formData.append('role_id', String(payload.role_id));

        // Imagen — solo si el usuario seleccionó una
        if (payload.image instanceof File) {
            formData.append('image', payload.image);
        }

        const { data } = await api.post<SignUpPayload>('/register', formData);
        return data;
    },

    twoFactor: async (payload: TwoFactorPayload) => {
        const { data } = await api.post<TwoFactorResponse>('/two-factor', payload);
        return data;
    },

    forgotPassword: async (payload: ForgotPasswordPayload) => {
        const { data } = await api.post<ForgotPasswordPayload>('/forgot', payload);
        return data;
    },

    resetPassword: async (payload: ResetPasswordPayload) => {
        const { data } = await api.post<ResetPasswordPayload>('/reset', payload);
        return data;
    },
};
