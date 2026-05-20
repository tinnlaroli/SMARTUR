export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    requiresVerification: boolean;
    userId: number;
    email: string;
    token?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        role_id: number;
    };
}

export interface TwoFactorPayload {
    email: string;
    token: string;
}

export interface TwoFactorResponse {
    message: string;
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        role_id: number;
    };
}

export interface SignUpPayload {
    name: string;
    email: string;
    password: string;
    role_id: number;
    photo_url?: string | null;
    image?: File;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    email: string;
    token: string;
    newPassword: string;
}
