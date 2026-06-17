export interface POI {
    id: number;
    name: string;
    description?: string;
    typeId: number;
    locationId: number;
    sustainability: boolean;
    image_url?: string | null;
    is_wellness?: boolean;
    wellness_status?: string;
    categoria_wellness?: string;
    nivel_aislamiento?: number;
    restauracion_pasiva?: number;
    demanda_fisica?: number;
    descripcion_bienestar?: string;
}

export interface CreatePOIDTO {
    name: string;
    description?: string;
    id_type: number;
    id_location: number;
    sustainability: boolean;
    image?: File | null;
}

export interface UpdatePOIDTO {
    name?: string;
    description?: string;
    id_type?: number;
    id_location?: number;
    sustainability?: boolean;
    image?: File | null;
    is_wellness?: boolean;
    categoria_wellness?: string;
    nivel_aislamiento?: number;
    restauracion_pasiva?: number;
    demanda_fisica?: number;
    descripcion_bienestar?: string;
}

export interface POIResponse {
    points: POI[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}
