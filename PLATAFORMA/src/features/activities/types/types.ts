export interface Activity {
    id: number;
    company: number;
    production_value: number;
    environmental_impact?: string;
    social_impact?: string;
}

export interface CreateActivityDTO {
    id_company: number;
    production_value: number;
    environmental_impact?: string;
    social_impact?: string;
}

export interface UpdateActivityDTO {
    production_value?: number;
    environmental_impact?: string;
    social_impact?: string;
}

export interface ActivityResponse {
    touristActivities: Activity[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}
