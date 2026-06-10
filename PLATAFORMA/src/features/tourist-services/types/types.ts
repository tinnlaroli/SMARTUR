import type { SetURLSearchParams } from 'react-router-dom';

export interface TouristService {
    id: number;
    name: string;
    description: string;
    id_company: number;
    id_location: number;
    service_type: string;
    active: boolean;
    id_evaluation?: number;
    total_score?: number;
    image_url?: string | null;
    price_from?: number | null;
    price_to?: number | null;
    currency?: string | null;
    created_at: string;
}

export interface CreateTouristServiceDTO {
    name: string;
    description?: string;
    id_company: number;
    id_location: number;
    service_type: string;
    active?: boolean;
    image?: File | null;
}

export interface UpdateTouristServiceDTO {
    name?: string;
    description?: string;
    id_company?: number;
    id_location?: number;
    service_type?: string;
    active?: boolean;
    price_from?: number | null;
    price_to?: number | null;
    currency?: string;
    image?: File | null;
}

export interface TouristServiceResponse {
    services: TouristService[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}

export interface TouristServiceDetailResponse {
    service: TouristService;
}

export interface PaginationProps {
    page: number;
    totalPages: number;
    limit: number;
    setSearchParams: SetURLSearchParams;
}
