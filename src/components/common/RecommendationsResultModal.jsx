import React from "react";
import {
FaMapMarkerAlt,
FaTimes,
FaStar,
FaArrowRight,
} from "react-icons/fa";

export default function RecommendationsResultModal({
recommendations = [],
userId,
onClose,
}) {
return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999] p-4 animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-slideUp">

        {/* Botón cerrar */}
        <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white text-gray-600 hover:text-red-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-full w-12 h-12 flex items-center justify-center border-0 hover:bg-red-50 hover:scale-105"
        >
        <FaTimes className="text-xl" />
        </button>

        {/* Encabezado */}
        <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Tus Recomendaciones</h2>
        <p className="text-gray-500 mt-1">
            Basado en tu perfil (ID: {userId})
        </p>
        </div>

        {/* Lista de recomendaciones */}
        <div className="space-y-6">
        {recommendations.slice(0, 3).map((rec, index) => (
            <div
            key={rec.item_id}
            className="p-5 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                {/* Número del ranking */}
                <div className="text-3xl font-bold text-purple">
                    {index + 1}
                </div>

                {/* Información del lugar */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                    {rec.title}
                    </h3>

                    <p className="text-gray-500 flex items-center gap-2 text-sm">
                    <FaMapMarkerAlt /> ID: {rec.item_id}
                    </p>
                </div>
                </div>

                {/* Puntaje combinado */}
                <div className="text-right">
                <p className="font-semibold text-gray-700">
                    Score híbrido:
                    <span className="text-purple ml-1">
                    {rec.score.toFixed(3)}
                    </span>
                </p>

                <p className="text-xs text-gray-400 mt-1">
                    CF: {rec.pred_cf.toFixed(3)}  
                    <span className="mx-1">|</span>
                    RF: {rec.pred_rf.toFixed(3)}
                </p>

                {/* Estrellitas visuales */}
                <div className="flex justify-end mt-2">
                    {[...Array(5)].map((_, i) => (
                    <FaStar
                        key={i}
                        className={`${
                        i < 4 ? "text-yellow-400" : "text-gray-300"
                        } text-lg`}
                    />
                    ))}
                </div>
                </div>
            </div>
            </div>
        ))}
        </div>

        {/* Botón finalizar */}
        <div className="mt-10 text-center">
        <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-purple to-blue text-white font-semibold rounded-xl shadow-md hover:scale-105 hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
        >
            Continuar <FaArrowRight />
        </button>
        </div>
    </div>
    </div>
);
}
