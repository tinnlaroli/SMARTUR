import type { EmpresaProfile, AnalyticsResponse } from '../../api/empresaApi';
import { DASHBOARD_COLORS } from '../../../home/utils/dashboard';

export const EMPRESA_DASHBOARD_STORAGE_KEY = 'smartur-empresa-dashboard-preferences';

export type EmpresaDensityMode = 'comfortable' | 'compact';

export interface EmpresaDashboardPreferences {
    density: EmpresaDensityMode;
}

export const DEFAULT_EMPRESA_DASHBOARD_PREFERENCES: EmpresaDashboardPreferences = {
    density: 'comfortable',
};

export interface EmpresaDashboardMetric {
    id: 'recomendaciones' | 'favoritos' | 'visitas' | 'serviciosActivos';
    label: string;
    value: string;
    numericValue: number;
    decimals: number;
    helper: string;
    tone: 'primary' | 'success' | 'warning' | 'neutral';
}

export interface EmpresaTrendPoint {
    date: string;
    label: string;
    interacciones: number;
}

export interface EmpresaTopServiceItem {
    id: number;
    name: string;
    favorites: number;
    visits: number;
    rating: number | null;
    recomendaciones: number;
}

export interface EmpresaDashboardViewModel {
    metrics: EmpresaDashboardMetric[];
    trendData: EmpresaTrendPoint[];
    trendSummary: string;
    trendInsights: Array<{ label: string; value: string }>;
    topServices: EmpresaTopServiceItem[];
    topServicesSummary: string;
    qualityScore: number | null;
    qualitySummary: string;
    showStatusBanner: boolean;
    statusMessage: string;
}

const formatCount = (value: number, locale: string) => value.toLocaleString(locale);

export const deriveEmpresaDashboardViewModel = (
    profile: EmpresaProfile,
    analytics: AnalyticsResponse,
    locale = 'es-MX',
): EmpresaDashboardViewModel => {
    const { summary, top_servicios, timeline_30d } = analytics;

    const metrics: EmpresaDashboardMetric[] = [
        {
            id: 'recomendaciones',
            label: 'Recomendaciones ML',
            value: formatCount(summary.total_recomendaciones, locale),
            numericValue: summary.total_recomendaciones,
            decimals: 0,
            helper: 'Veces que el motor IA sugirio tus servicios',
            tone: 'success',
        },
        {
            id: 'favoritos',
            label: 'Favoritos',
            value: formatCount(summary.total_favoritos, locale),
            numericValue: summary.total_favoritos,
            decimals: 0,
            helper: 'Usuarios que guardaron tus servicios',
            tone: 'warning',
        },
        {
            id: 'visitas',
            label: 'Visitas',
            value: formatCount(summary.total_visitas, locale),
            numericValue: summary.total_visitas,
            decimals: 0,
            helper: 'Aperturas de detalle en tus servicios',
            tone: 'neutral',
        },
        {
            id: 'serviciosActivos',
            label: 'Servicios activos',
            value: formatCount(summary.total_servicios_activos, locale),
            numericValue: summary.total_servicios_activos,
            decimals: 0,
            helper: 'Publicados y visibles en la plataforma',
            tone: 'primary',
        },
    ];

    const trendData: EmpresaTrendPoint[] = timeline_30d.map((point) => ({
        date: point.date,
        label: point.date.slice(5),
        interacciones: point.interacciones,
    }));

    const totalInteractions = trendData.reduce((sum, point) => sum + point.interacciones, 0);
    const peakDay = trendData.reduce(
        (best, current) => (current.interacciones > best.interacciones ? current : best),
        trendData[0] ?? { date: '', label: '', interacciones: 0 },
    );

    const trendSummary =
        trendData.length === 0
            ? 'Aun no hay interacciones registradas en los ultimos 30 dias.'
            : totalInteractions === 0
              ? 'Base de referencia a cero; los datos apareceran conforme haya actividad.'
              : `Pico de actividad el ${peakDay.label} con ${peakDay.interacciones} interacciones.`;

    const trendInsights = [
        {
            label: 'Total 30d',
            value: formatCount(totalInteractions, locale),
        },
        {
            label: 'Rating promedio',
            value: summary.avg_rating != null ? summary.avg_rating.toFixed(1) : '—',
        },
    ];

    const topServices: EmpresaTopServiceItem[] = top_servicios.map((service) => ({
        id: service.id_service,
        name: service.name,
        favorites: service.favorites,
        visits: service.visits,
        rating: service.rating,
        recomendaciones: service.recomendaciones,
    }));

    const topServicesSummary =
        topServices.length === 0
            ? 'Cuando haya engagement, el ranking de servicios aparecera aqui.'
            : `${topServices[0]?.name ?? 'Tu servicio'} lidera el engagement visible.`;

    const qualityScore = summary.evaluacion_score != null ? Number(summary.evaluacion_score) : null;

    return {
        metrics,
        trendData,
        trendSummary,
        trendInsights,
        topServices,
        topServicesSummary,
        qualityScore,
        qualitySummary:
            qualityScore != null
                ? `Calificacion SMARTUR: ${qualityScore}/100 para ${profile.name}.`
                : 'El equipo SMARTUR aun no ha asignado una evaluacion de calidad.',
        showStatusBanner: profile.status !== 'active',
        statusMessage:
            profile.status === 'suspended'
                ? 'Tu cuenta esta suspendida. Contacta al equipo SMARTUR para mas informacion.'
                : 'Empresa en revision. Puedes explorar el portal mientras verificamos tu informacion.',
    };
};

export const EMPRESA_METRIC_COLORS = {
    recomendaciones: DASHBOARD_COLORS.green,
    favoritos: DASHBOARD_COLORS.orange,
    visitas: DASHBOARD_COLORS.cyan,
    serviciosActivos: DASHBOARD_COLORS.purple,
} as const;
