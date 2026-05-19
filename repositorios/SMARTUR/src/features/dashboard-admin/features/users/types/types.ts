import type { SetURLSearchParams } from 'react-router-dom';

export interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role_id: number;
}

export interface UpdateUserDTO {
    name?: string;
    password?: string;
    role_id?: number;
    is_active?: boolean;
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
