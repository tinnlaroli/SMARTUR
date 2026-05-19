import React, { useState, useRef } from "react";
import {
  FaMapMarkerAlt,
  FaTimes,
  FaStar,
  FaArrowRight,
  FaCheckCircle,
  FaShare,
  FaDownload,
} from "react-icons/fa";
import logoCostado from "../../assets/logo_costado.png";
import "../../features/form/FormStyles.css";

// Componente Toast personalizado
function Toast({ message, type = "success", onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[10000] animate-slideInRight">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
          type === "success"
            ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
            : "bg-gradient-to-r from-red-500 to-red-600 text-white"
        }`}
      >
        <div className="flex-shrink-0">
          {type === "success" ? (
            <FaCheckCircle className="text-xl" />
          ) : (
            <FaTimes className="text-xl" />
          )}
        </div>
        <p className="font-semibold text-sm md:text-base">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-80 transition-opacity"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    </div>
  );
}

// Componente oculto para generar la imagen tipo invitación
function InvitationCard({ recommendations, logoCostado }) {
  // Colores de la paleta oficial
  const colors = {
    purple: "#984efd",
    pink: "#ec4899",
    blue: "#4299e1",
    green: "#48bb78",
    orange: "#ed8936",
  };

  return (
    <div
      data-invitation-card
      style={{
        width: "1200px",
        minHeight: "800px",
        background: `linear-gradient(135deg, rgba(152, 78, 253, 0.12) 0%, rgba(236, 72, 153, 0.12) 50%, rgba(66, 153, 225, 0.12) 100%), #ffffff`,
        border: `4px solid ${colors.purple}`,
        borderRadius: "24px",
        padding: "48px",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Encabezado tipo invitación */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            marginBottom: "16px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.blue} 100%)`,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "700",
            marginBottom: "12px",
            background: `linear-gradient(90deg, ${colors.purple} 0%, ${colors.pink} 50%, ${colors.blue} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: "1.2",
          }}
        >
          ¡Tus Recomendaciones de Viaje!
        </h1>
        <p style={{ fontSize: "20px", color: "#374151", fontWeight: "500" }}>
          Personalizadas especialmente para ti por SMARTUR
        </p>
        <div
          style={{
            marginTop: "16px",
            height: "4px",
            width: "128px",
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: "9999px",
            background: `linear-gradient(90deg, ${colors.purple} 0%, ${colors.pink} 50%, ${colors.blue} 100%)`,
          }}
        />
      </div>

      {/* Lista de recomendaciones estilo invitación */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {recommendations.slice(0, 3).map((rec, index) => {
          const borderColors = [
            { start: colors.blue, end: colors.purple },
            { start: colors.green, end: colors.blue },
            { start: colors.orange, end: colors.pink },
          ];
          const currentColors = borderColors[index];

          return (
            <div
              key={rec.item_id}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
                border: `4px solid transparent`,
                background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${currentColors.start}, ${currentColors.end}) border-box`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "24px",
                }}
              >
                {/* Número del ranking - estilo medalla */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "32px",
                        fontWeight: "700",
                        color: "white",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                        background: `linear-gradient(135deg, ${currentColors.start}, ${currentColors.end})`,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        width: "24px",
                        height: "24px",
                        backgroundColor: "#fbbf24",
                        borderRadius: "50%",
                        border: "4px solid white",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="#d97706"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Información del lugar */}
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#1f2937",
                      marginBottom: "12px",
                    }}
                  >
                    {rec.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={colors.blue}
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span
                      style={{
                        color: "#4b5563",
                        fontWeight: "500",
                        fontSize: "16px",
                      }}
                    >
                      ID: {rec.item_id}
                    </span>
                  </div>

                  {/* Puntaje destacado */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: `linear-gradient(135deg, rgba(66, 153, 225, 0.2), rgba(152, 78, 253, 0.2))`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#4b5563",
                          fontWeight: "600",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Puntuación Total
                      </span>
                      <span
                        style={{
                          fontSize: "28px",
                          fontWeight: "700",
                          color: colors.blue,
                        }}
                      >
                        {rec.score.toFixed(3)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "white",
                          backgroundColor: colors.blue,
                        }}
                      >
                        CF: {rec.pred_cf.toFixed(3)}
                      </span>
                      <span
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "white",
                          backgroundColor: colors.green,
                        }}
                      >
                        RF: {rec.pred_rf.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Estrellas */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={i < 4 ? "#fbbf24" : "#d1d5db"}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logo al final */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <img
          src={logoCostado}
          alt="SMARTUR"
          style={{
            height: "50px",
            margin: "0 auto",
            filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))",
          }}
        />
      </div>
    </div>
  );
}

export default function RecommendationsResultModal({
  recommendations,
  onClose,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toast, setToast] = useState(null);
  const invitationRef = useRef(null);
  const recommendationsRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareText = generateShareText();

      if (navigator.share) {
        await navigator.share({
          title: "¡Mis Recomendaciones SMARTUR!",
          text: shareText,
        });
        showToast("¡Compartido exitosamente!", "success");
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast("¡Texto copiado al portapapeles!", "success");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Error al compartir", "error");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);

    try {
      // Importar html2canvas dinámicamente
      const html2canvas = (await import("html2canvas")).default;

      if (!invitationRef.current) {
        throw new Error("Referencia no encontrada");
      }

      // Hacer el elemento temporalmente visible PERO fuera de la vista
      const element = invitationRef.current;
      element.style.position = "fixed";
      element.style.left = "0";
      element.style.top = "0";
      element.style.zIndex = "-9999";
      element.style.opacity = "1";
      element.style.visibility = "visible";

      // Esperar un momento para que se renderice
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capturar el canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 1200,
        height: element.scrollHeight,
        windowWidth: 1200,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(
            "[data-invitation-card]",
          );
          if (clonedElement) {
            clonedElement.style.position = "relative";
            clonedElement.style.left = "0";
            clonedElement.style.top = "0";
            clonedElement.style.opacity = "1";
            clonedElement.style.visibility = "visible";
            clonedElement.style.display = "block";
          }
        },
      });

      // Volver a ocultar el elemento
      element.style.position = "fixed";
      element.style.left = "-9999px";
      element.style.top = "0";
      element.style.zIndex = "-9999";
      element.style.opacity = "0";
      element.style.visibility = "hidden";

      // Convertir canvas a blob y descargar
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `smartur-recomendaciones-${new Date().getTime()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("¡Imagen descargada exitosamente!", "success");
          } else {
            showToast("Error al generar la imagen", "error");
          }
          setIsDownloading(false);
        },
        "image/png",
        1.0,
      );
    } catch (error) {
      console.error("Error al descargar imagen:", error);
      showToast("Error al descargar la imagen", "error");
      setIsDownloading(false);
    }
  };

  const generateShareText = () => {
    const topRecommendations = recommendations.slice(0, 3);
    let text =
      "¡Mira mis recomendaciones de viaje personalizadas de SMARTUR!\n\n";

    topRecommendations.forEach((rec, index) => {
      text += `${index + 1}. ${rec.title}\n`;
      text += `   Score: ${rec.score.toFixed(3)}\n`;
    });

    text += `\nDescubre tus propias recomendaciones en SMARTUR`;
    return text;
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-8 animate-fadeIn overflow-y-auto">
        <div className="relative w-full max-w-4xl mx-auto my-auto animate-slideUp">
          {/* Botón cerrar flotante fuera de la tarjeta para no ensuciar la captura */}
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 bg-white text-gray-500 hover:text-red-500 transition-all duration-300 shadow-xl rounded-full w-12 h-12 flex items-center justify-center border border-gray-100 hover:scale-110 z-50"
          >
            <FaTimes className="text-xl" />
          </button>

          {/* El contenido que se va a capturar */}
          <div
            ref={invitationRef}
            className="bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-purple relative"
          >
            {/* Fondo de tarjeta tipo invitación */}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(152,78,253,0.05)_0%,rgba(236,72,153,0.05)_50%,rgba(66,153,225,0.05)_100%)] z-0 pointer-events-none"></div>

            <div className="relative z-10 p-8 sm:p-12">
              {/* Encabezado */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green to-blue shadow-lg mb-6">
                  <FaMapMarkerAlt className="text-white text-3xl" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple via-pink to-blue leading-tight pb-1">
                  ¡Tus Recomendaciones!
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 font-medium font-outfit">
                  Personalizadas especialmente para ti por SMARTUR
                </p>
                <div className="mt-6 h-1 w-24 mx-auto rounded-full bg-gradient-to-r from-purple via-pink to-blue"></div>
              </div>

              {/* Lista de Recomendaciones */}
              <div className="space-y-6">
                {recommendations.slice(0, 3).map((rec, index) => {
                  const borderColors = [
                    "from-blue to-purple",
                    "from-green to-blue",
                    "from-orange to-pink",
                  ];
                  const medalColors = [
                    "bg-gradient-to-br from-blue to-purple",
                    "bg-gradient-to-br from-green to-blue",
                    "bg-gradient-to-br from-orange to-pink",
                  ];

                  return (
                    <div
                      key={rec.item_id}
                      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden group"
                    >
                      <div
                        className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${borderColors[index]}`}
                      ></div>

                      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center pl-2">
                        {/* Medalla */}
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                          <div
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg ${medalColors[index]}`}
                          >
                            {index + 1}
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                            <FaStar className="text-yellow-700 text-[10px]" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                            {rec.title}
                          </h3>
                          <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mb-4 font-outfit">
                            <FaMapMarkerAlt className="text-blue" />
                            <span className="text-sm font-medium">
                              ID: {rec.item_id}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                Score
                              </span>
                              <span className="text-xl font-bold text-blue">
                                {rec.score.toFixed(3)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="px-3 py-1.5 bg-blue text-white text-sm font-semibold rounded-lg shadow-sm">
                                CF: {rec.pred_cf.toFixed(3)}
                              </span>
                              <span className="px-3 py-1.5 bg-green text-white text-sm font-semibold rounded-lg shadow-sm">
                                RF: {rec.pred_rf.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Logo Footer Captura */}
              <div className="mt-12 text-center">
                <img
                  src={logoCostado}
                  alt="SMARTUR"
                  className="h-10 sm:h-12 mx-auto drop-shadow-sm opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción debajo de la tarjeta (no se capturarán si html2canvas apunta a invitationRef) */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-purple border-2 border-purple font-semibold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl hover:bg-purple hover:text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaDownload />
              <span>{isDownloading ? "Generando..." : "Descargar Imagen"}</span>
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-green border-2 border-green font-semibold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl hover:bg-green hover:text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaShare />
              <span>{isSharing ? "Compartiendo..." : "Compartir Viaje"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-10 py-3.5 bg-blue text-white border-2 border-blue font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl hover:bg-blue/90 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <span>Finalizar</span>
              <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
