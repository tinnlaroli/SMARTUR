export interface EvaluationLevel {
    id_subcriterion: number;
    description: string;
    score: number;
}

export interface EvaluationCriterion {
    id_criterion: number;
    name: string;
    description?: string;
    weight: number;
    order_index: number;
    field_type?: string;
    levels: EvaluationLevel[];
}

export interface EvaluationRubric {
    id_template: number;
    name: string;
    version: string;
    service_type: string;
    active: boolean;
    criteria: EvaluationCriterion[];
}

export interface RubricResponse {
    message: string;
    rubric: EvaluationRubric;
}

export interface EvaluationDetailDTO {
    id_criterion: number;
    assigned_score: number;
    id_selected_subcriterion: number;
    observations?: string;
    attached_evidences?: string;
}

export interface FullEvaluationRegisterDTO {
    id_service: number;
    id_template: number;
    evaluator_id: number;
    evaluation_time?: number;
    general_observations?: string;
    pdf_url?: string | null;
    details: EvaluationDetailDTO[];
}

export interface EvaluationSummary {
    id: number;
    serviceId: number;
    serviceName: string;
    restaurantName: string;
    restaurantAddress: string;
    templateId: number;
    evaluationDate: string;
    evaluatorId: number;
    status: string;
    totalScore: number;
    evaluationTime: number;
    generalObservations: string;
    pdfUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface EvaluationListResponse {
    message: string;
    count: number;
    evaluations: EvaluationSummary[];
}

export interface Template {
    id: number;
    name: string;
    version: string;
    servicio: string;
    estado: boolean;
    register_at: string;
}

export interface CreateTemplateDTO {
    name: string;
    version: string;
    service_type: string;
    active: boolean;
}

export interface UpdateTemplateDTO {
    name?: string;
    version?: string;
    service_type?: string;
    active?: boolean;
}

export interface TemplateResponse {
    templates: Template[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}

