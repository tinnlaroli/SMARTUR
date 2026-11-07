import { api } from '../../../shared/api/axiosClient';

export interface ConteoCodigo { codigo: string; n: number }

export interface CampanaWelltur {
    meta: number;
    sesiones: number;
    personas: number;
    sesiones_con_pss: number;
    personas_con_pss: number;
    completas: number;
    avance: number;
    etapa_b_lista: boolean;
    satisfaccion: { promedio: number | null; n: number; distribucion: { calificacion: number; n: number }[] };
    eventos: { impresiones: number; abiertos: number; elegidos: number; tasa_apertura: number | null };
    pss10_bloques: { desde: number; n: number }[];
    sesiones_por_dia: { dia: string; n: number }[];
    motivos: ConteoCodigo[];
    modalidades: ConteoCodigo[];
    reclamos_pendientes: number;
}

export interface EtapaB {
    estado: 'insuficiente' | 'evaluado';
    mensaje: string;
    meta: number;
    faltan: number;
    lista_para_promover: boolean;
    n_sesiones: number;
    n_personas: number;
    n_lugares_mostrados: number;
    tasa_interes: number | null;
    satisfaccion_promedio: number | null;
    pss10_media: number | null;
    rho_pss_satisfaccion: number | null;
    logloss_A?: number;
    logloss_B?: number;
    auc_A?: number;
    auc_B?: number;
    pliegues?: number;
    pliegues_mejor_B?: number;
    or_estres_por_modalidad?: Record<string, number>;
}

export interface ReclamoDenue {
    claim_id: number;
    status: 'pending' | 'approved' | 'rejected';
    evidencia: string;
    admin_notes: string | null;
    created_at: string;
    reviewed_at: string | null;
    poi_id: number;
    poi_nombre: string;
    denue_clee: string;
    poi_descripcion: string | null;
    municipio: string;
    estado: string;
    company_id: number;
    empresa: string;
    empresa_status: string | null;
    empresa_certificada: boolean | null;
    solicitante: string;
}

export const wellturApi = {
    campana: () => api.get<CampanaWelltur>('/ml/wellness/campaign-stats').then((r) => r.data),
    etapaB: () => api.post<EtapaB>('/ml/wellness/etapa-b').then((r) => r.data),
    reclamos: (status: 'pending' | 'approved' | 'rejected') =>
        api.get<ReclamoDenue[]>('/admin/denue/reclamos', { params: { status } }).then((r) => r.data),
    revisarReclamo: (id: number, decision: 'approved' | 'rejected', notas: string) =>
        api.patch(`/admin/denue/reclamos/${id}`, { decision, notas }).then((r) => r.data),
};

export const NOMBRES_MOTIVOS: Record<string, string> = {
    M1: 'Descansar', M2: 'Mantenerse activo', M3: 'Naturaleza', M4: 'Aprender', M5: 'Compartir',
    M6: 'Probar algo nuevo', M7: 'Autocuidado', M8: 'Comida y bebida', M9: 'Atención plena',
};
export const NOMBRES_MODALIDADES: Record<string, string> = {
    W1: 'Pausa y descanso', W2: 'Naturaleza', W3: 'Movimiento', W4: 'Mente-cuerpo',
    W5: 'Culinaria', W6: 'Aprendizaje y cultura', W7: 'Autocuidado',
};
