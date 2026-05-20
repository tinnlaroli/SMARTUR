export interface Certification {
    id: number;
    serviceId: number;
    certificationType: string;
    obtainmentDate: string;
    expirationDate?: string;
    issuingOrganization: string;
    evidenceUrl?: string;
    status: string;
}

export interface CreateCertificationDTO {
    id_service: number;
    certification_type: string;
    obtainment_date: string;
    expiration_date?: string;
    issuing_organization: string;
    evidence_url?: string;
    status: string;
}

export interface UpdateCertificationDTO {
    certification_type?: string;
    obtainment_date?: string;
    expiration_date?: string;
    issuing_organization?: string;
    evidence_url?: string;
    status?: string;
}

export interface CertificationResponse {
    certifications: Certification[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}
