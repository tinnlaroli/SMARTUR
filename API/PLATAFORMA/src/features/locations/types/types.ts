import type { SetURLSearchParams } from 'react-router-dom';

export interface Location {
    id: number;
    name: string;
    state: string;
    municipality: string;
    latitude: string;
    longitude: string;
}

export interface CreateLocationDTO {
    name: string;
    state: string;
    municipality?: string;
    latitude?: string;
    longitude?: string;
}

export interface UpdateLocationDTO {
    name?: string;
    state?: string;
    municipality?: string;
    latitude?: string;
    longitude?: string;
}

export interface LocationResponse {
    locations: Location[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}

export interface LocationDetailResponse {
    location: Location;
}

export interface PaginationProps {
    page: number;
    totalPages: number;
    limit: number;
    setSearchParams: SetURLSearchParams;
}
