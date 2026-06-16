import { useState } from 'react';
import { ClipboardCheck, Wrench, MapPin, Leaf } from 'lucide-react';
import { AdminServicesApprovalPage } from '../../tourist-services/pages/AdminServicesApprovalPage';
import AdminPOIsApprovalPage from '../../points-of-interest/pages/AdminPOIsApprovalPage';
import AdminWellnessApprovalPage from './AdminWellnessApprovalPage';
import { useAdminBadges } from '../../dashboard/context/AdminBadgesContext';

const TABS = [
    { id: 'services',  label: 'Actividades',        icon: Wrench },
    { id: 'pois',      label: 'Puntos de Interés',  icon: MapPin  },
    { id: 'wellness',  label: 'Bienestar',           icon: Leaf    },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function AdminApprovalPage() {
    const [activeTab, setActiveTab] = useState<TabId>('services');
    const badges = useAdminBadges();

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}
                >
                    <ClipboardCheck className="size-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                        Filtro de Aprobación
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-alt)' }}>
                        Revisa y aprueba actividades, puntos de interés y servicios de bienestar pendientes
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div
                className="flex gap-1 rounded-xl border p-1 w-fit"
                style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
            >
                {TABS.map(({ id, label, icon: Icon }) => {
                    const badge = id === 'wellness' ? badges.wellness : undefined;
                    return (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                activeTab === id ? 'shadow-sm text-white' : 'hover:opacity-80'
                            }`}
                            style={
                                activeTab === id
                                    ? { background: id === 'wellness' ? '#22c55e' : '#16a34a' }
                                    : { color: 'var(--color-text-alt)', background: 'transparent' }
                            }
                        >
                            <Icon className="size-4" />
                            {label}
                            {badge != null && badge > 0 && (
                                <span
                                    className="ml-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    style={{ background: activeTab === id ? 'rgba(255,255,255,0.35)' : '#22c55e' }}
                                >
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div>
                {activeTab === 'services' && <AdminServicesApprovalPage />}
                {activeTab === 'pois' && <AdminPOIsApprovalPage />}
                {activeTab === 'wellness' && <AdminWellnessApprovalPage />}
            </div>
        </div>
    );
}
