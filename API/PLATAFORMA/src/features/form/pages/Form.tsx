import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, ClipboardList, Info, LogOut } from 'lucide-react';
import { FormModal } from '../components/FormModal';
import { useLanguage, useUserPreferences } from '../../../contexts/LanguageContext';

export default function Form() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const { clearUser } = useUserPreferences();

    // Auth context or state from navigation
    const token = location.state?.tokenValide || localStorage.getItem('token');
    
    const [isModalOpen, setIsModalOpen] = useState(true);

    // Redirect if no token (protected route should handle this too)
    useEffect(() => {
        if (!token) {
            navigate('/');
        }
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        clearUser();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Logout Button (Top Right) */}
            <button 
                onClick={handleLogout}
                className="absolute top-8 right-8 z-20 flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 group"
            >
                <LogOut className="size-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-semibold">{t('header.logout')}</span>
            </button>

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="z-10 w-full max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mx-auto size-20 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 rotate-3">
                    <ClipboardList className="size-10 text-white" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
                    Personaliza tu <span className="text-violet-400">Experiencia</span>
                </h1>
                
                <p className="text-xl text-zinc-400 leading-relaxed max-w-lg mx-auto">
                    Completa nuestro formulario inteligente para recibir recomendaciones turísticas adaptadas perfectamente a tus gustos.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col items-center gap-2">
                        <LayoutGrid className="size-5 text-violet-400" />
                        <span className="text-sm font-medium text-zinc-300 italic">IA Adaptativa</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col items-center gap-2">
                        <Info className="size-5 text-blue-400" />
                        <span className="text-sm font-medium text-zinc-300 italic">4 Simples Pasos</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col items-center gap-2">
                        <ClipboardList className="size-5 text-emerald-400" />
                        <span className="text-sm font-medium text-zinc-300 italic">Resultados al instante</span>
                    </div>
                </div>

                <div className="pt-8">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="group relative px-12 py-4 bg-violet-600 font-semibold text-white rounded-2xl shadow-xl shadow-violet-500/25 transition-all hover:bg-violet-500 hover:scale-105 active:scale-95 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2 justify-center">
                            ¡Comenzar Formulario!
                            <div className="size-2 rounded-full bg-white animate-ping" />
                        </span>
                    </button>

                    
                </div>
            </div>

            <FormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
}

