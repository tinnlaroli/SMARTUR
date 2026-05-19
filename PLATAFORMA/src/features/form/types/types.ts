export interface FormContext {
    edad?: number;
    edad_range?: string;
    presupuesto_daily?: number;
    presupuesto_bucket?: string;
    duracion_dias?: number;
    duracion_dias_range?: string;
    tiposTurismo: string[];
    actividad_level: number;
    preferencia_lugar: string;
    pref_outdoor: boolean;
    group_type?: string;
    services: string[];
    needs_hotel: boolean;
    needs_transport: boolean;
    pref_food: boolean;
    wants_tours: boolean;
    accesibilidad: string; // 'si' | 'no' in UI
    requiere_accesibilidad?: boolean; // mapping for AI
    detalleAcc: string;
    visitado: string;
}

export interface AIRecommendationContext {
    presupuesto_bucket?: string;
    edad_range?: string;
    tiposTurismo: string[];
    group_type?: string;
    wants_tours: boolean;
    needs_hotel: boolean;
    pref_food: boolean;
    requiere_accesibilidad: boolean;
    pref_outdoor: boolean;
}

export interface Recommendation {
    item_id: string;
    title: string;
    description?: string;
    category?: string;
    score: number;
    pred_cf: number;
    pred_rf: number;
    kind?: string;
    image_url?: string | null;
}

export interface RecommendationsResponse {
    recommendations: Recommendation[];
    user_id: string | number;
    message?: string;
}

export interface GetRecommendationsParams {
    userId: string;
    alpha?: number;
    top_n?: number;
    context: AIRecommendationContext;
    token?: string | null;
}
