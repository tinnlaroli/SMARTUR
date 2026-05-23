// ─── Response shapes (camelCase — match API controller output) ──────────────

export interface Expenditure {
    id: number;
    touristId: number;
    touristEmail?: string;  // enriched client-side
    touristName?: string;   // enriched client-side
    expenditureType: string;
    amount: number;
    destination: string;
    date: string;
}

export interface Employment {
    id: number;
    companyId: number;
    companyName?: string;  // enriched client-side
    position: string;
    contractType: string;
    gender: string;
    salary: number;
    startDate: string;
}

export interface Input {
    id: number;
    companyId: number;
    companyName?: string;  // enriched client-side
    inputType: string;
    cost: number;
    consumption: number | null;
    carbonFootprint: number | null;
}

// ─── POST request bodies (snake_case — match API controller expectations) ───

export interface CreateExpenditureDTO {
    id_tourist: number;
    expenditure_type: string;
    amount: number;
    destination: string;
}

export interface CreateEmploymentDTO {
    id_company: number;
    position: string;
    contract_type: string;
    gender: string;
    salary: number;
    start_date: string;
}

export interface CreateInputDTO {
    id_company: number;
    input_type: string;
    cost: number;
    consumption: number;
    carbon_footprint: number;
}

// ─── Lightweight selector types ──────────────────────────────────────────────

export interface TouristOption {
    userId: number;
    name: string;
    email: string;
}

export interface LocationOption {
    id: number;
    name: string;
    state: string;
    municipality?: string;
}
