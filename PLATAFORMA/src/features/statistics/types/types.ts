export interface Expenditure {
    id_expenditure: number;
    id_tourist: number;
    expenditure_type: string;
    amount: number;
    destination: string;
    created_at: string;
}

export interface CreateExpenditureDTO {
    id_tourist: number;
    expenditure_type: string;
    amount: number;
    destination: string;
}

export interface Employment {
    id_employment: number;
    id_company: number;
    position: string;
    contract_type: string;
    gender: string;
    salary: number;
    start_date: string;
}

export interface CreateEmploymentDTO {
    id_company: number;
    position: string;
    contract_type: string;
    gender: string;
    salary: number;
    start_date: string;
}

export interface Input {
    id_input: number;
    id_company: number;
    input_type: string;
    cost: number;
    consumption: number;
    carbon_footprint: number;
}

export interface CreateInputDTO {
    id_company: number;
    input_type: string;
    cost: number;
    consumption: number;
    carbon_footprint: number;
}
