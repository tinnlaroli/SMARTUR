import type { SetURLSearchParams } from 'react-router-dom';

export type CompanyStatus = 'pending' | 'active' | 'suspended';

export interface Company {
    id: number;
    name: string;
    address: string;
    phone: string;
    id_sector: number;
    id_location: number;
    registration_date: string;
    status: CompanyStatus;
    owner_user_id: number | null;
}

export interface CreateCompanyDTO {
    name: string;
    address?: string;
    phone?: string;
    id_sector: number;
    id_location?: number;
}

export interface UpdateCompanyDTO {
    name?: string;
    address?: string;
    phone?: string;
    id_sector?: number;
    id_location?: number;
    status?: CompanyStatus;
}

export interface CompanyResponse {
    companies: Company[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}

export interface CompanyDetailResponse {
    company: Company;
}

export interface PaginationProps {
    page: number;
    totalPages: number;
    limit: number;
    setSearchParams: SetURLSearchParams;
}
