export interface POI {
    id: number;
    name: string;
    description?: string;
    typeId: number;
    locationId: number;
    sustainability: boolean;
}

export interface CreatePOIDTO {
    name: string;
    description?: string;
    id_type: number;
    id_location: number;
    sustainability: boolean;
}

export interface UpdatePOIDTO {
    name?: string;
    description?: string;
    id_type?: number;
    id_location?: number;
    sustainability?: boolean;
}

export interface POIResponse {
    points: POI[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}
