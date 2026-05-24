import type { SetURLSearchParams } from 'react-router-dom';

export interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    is_active: boolean;
    photo_url: string | null;
    avatar_icon_key: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role_id: number;
    photo_url?: string | null;
    avatar_icon_key?: string | null;
    image?: File;
}

export interface UpdateUserDTO {
    name?: string;
    password?: string;
    role_id?: number;
    is_active?: boolean;
    photo_url?: string | null;
    image?: File;
}

export interface UserResponse {
    users: User[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}

export interface UserDetailResponse {
    user: User;
}

export interface PaginationProps {
    page: number;
    totalPages: number;
    limit: number;
    setSearchParams: SetURLSearchParams;
}

export interface UserSession {
    id: number;
    device_hint: string | null;
    ip: string | null;
    created_at: string;
    expires_at: string;
    last_seen: string | null;
    revoked: boolean;
}

export interface RecommendationFeedbackItem {
    item_id: string;
    rank_pos: number;
    clicked: boolean;
    clicked_at: string | null;
}

export interface UserRecommendationSession {
    id: number;
    created_at: string;
    context_snapshot: Record<string, unknown> | null;
    feedback: RecommendationFeedbackItem[];
}
