import { useState } from 'react';
import { api } from '../../../shared/api/axiosClient';
import { useToast } from '../../../shared/context/ToastContext';
import type { EvaluationRubric } from '../types/types';

export interface ParsedResult {
    id_criterion: number;
    name: string;
    detected_score: number | null;
    confidence: 'high' | 'low' | 'none';
}

interface PdfParsingResponse {
    parsed: ParsedResult[];
    raw_text: string;
    pdf_url: string | null;
}

export interface PdfParseOutput {
    parsed: ParsedResult[];
    pdfUrl: string | null;
}

export function usePdfParsing() {
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const parsePdf = async (file: File, rubric: EvaluationRubric): Promise<PdfParseOutput | null> => {
        try {
            setIsLoading(true);

            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('rubric', JSON.stringify(rubric));

            const response = await api.post<PdfParsingResponse>('/service-evaluation/parse-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.parsed) {
                const total = response.data.parsed.length;
                const detected = response.data.parsed.filter((p) => p.detected_score !== null).length;
                toast.success(
                    'PDF procesado',
                    total === 0
                        ? 'No se encontraron criterios en la rúbrica.'
                        : detected === 0
                          ? `${total} criterios para revisar — asigna los puntajes manualmente.`
                          : `${detected} de ${total} criterios detectados. Valida los resultados.`
                );
                return {
                    parsed: response.data.parsed,
                    pdfUrl: response.data.pdf_url ?? null,
                };
            }

            return null;
        } catch (error) {
            console.error('Error parsing PDF:', error);
            toast.error('Error al procesar PDF', 'No se pudo leer el PDF. Asegúrate de que sea un formulario válido.');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { parsePdf, isLoading };
}
