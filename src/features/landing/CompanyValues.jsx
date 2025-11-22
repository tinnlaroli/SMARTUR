import React from 'react'

const CompanyValuesGrid = () => {
    const values = [
        { name: 'Imparcialidad', color: 'orange' },
        { name: 'Seguridad', color: 'green' },
        { name: 'Equidad', color: 'blue' },
        { name: 'Honestidad', color: 'purple' },
        { name: 'Respeto', color: 'pink' },
        { name: 'Responsabilidad', color: 'yellow' },
        { name: 'Inclusión', color: 'teal' },
        { name: 'Empatía', color: 'indigo' },
        { name: 'Fidelidad', color: 'orange' },
        { name: 'Ética', color: 'green' },
    ]

    const getColorClass = (color) => {
        const colorMap = {
            orange: 'bg-orange text-white',
            green: 'bg-green text-white',
            blue: 'bg-blue text-white',
            purple: 'bg-purple text-white',
            pink: 'bg-pink text-white',
            yellow: 'bg-yellow text-gray-800',
            teal: 'bg-teal text-white',
            indigo: 'bg-indigo text-white',
        }
        return colorMap[color] || 'bg-gray-200 text-gray-800'
    }

    return (
        <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-6xl mx-auto">
                {/* Encabezado */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 font-sans">
                        Nuestros <span className="text-orange">Valores</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        En SMARTUR, creemos en un turismo que beneficia a todos,
                        conectando tecnología y cultura para un desarrollo
                        sostenible.
                    </p>
                </div>

                {/* Grid superior: Misión, Visión, Compromiso, Historia en 2x2 */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Misión */}
                    <div className="bg-white p-6 rounded-xl shadow-xl border-l-4 border-orange hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                        <h2 className="text-2xl font-bold mb-3 font-sans text-orange">
                            MISIÓN
                        </h2>
                        <p className="text-gray-700 leading-relaxed flex-grow">
                            Conectamos a turistas con experiencias auténticas y
                            personalizadas de la región de Las Altas Montañas.
                            Usamos inteligencia artificial para promover un
                            turismo local y responsable, impulsando la economía
                            y brindando información útil.
                        </p>
                    </div>

                    {/* Visión */}
                    <div className="bg-white p-6 rounded-xl shadow-xl border-l-4 border-green hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                        <h2 className="text-2xl font-bold mb-3 font-sans text-green">
                            VISIÓN
                        </h2>
                        <p className="text-gray-700 leading-relaxed flex-grow">
                            Plataforma líder en recomendaciones turísticas de
                            Las Altas Montañas, reconocido por nuestra
                            innovación tecnológica, el impacto positivo en las
                            economías locales y un turismo sostenible e
                            inclusivo.
                        </p>
                    </div>

                    {/* Compromiso */}
                    <div className="bg-white p-6 rounded-xl shadow-xl border-l-4 border-blue hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                        <h2 className="text-2xl font-bold mb-3 font-sans text-blue">
                            COMPROMISO
                        </h2>
                        <p className="text-gray-700 leading-relaxed flex-grow">
                            En SMARTUR, creemos en un turismo que beneficia a
                            todos. Nuestro proyecto está directamente alineado
                            con las Objetivas de Desarrollo Sostenible (ODS) de
                            la ONU.
                        </p>
                    </div>

                    {/* Historia */}
                    <div className="bg-white p-6 rounded-xl shadow-xl border-l-4 border-purple hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                        <h2 className="text-2xl font-bold mb-3 font-sans text-purple">
                            HISTORIA
                        </h2>
                        <p className="text-gray-700 leading-relaxed flex-grow">
                            En 2024, el manual de procedimientos de SMARTUR ganó
                            el "Galardón Turístico Mi Veracruz". Inspirados por
                            este premio, creamos SMARTUR para conectar la
                            tecnología y la cultura, beneficiando a las
                            comunidades locales. Nuestro objetivo es impulsar el
                            turismo y el desarrollo sostenible en la región de
                            Las Altas Montañas.
                        </p>
                    </div>
                </div>

                {/* Sección de Valores con distribución aleatoria y efectos de desvanecimiento */}
                <div>
                    <h2 className="text-3xl font-bold text-center mb-8 mt-12 font-sans text-gray-800">
                        Valores que nos Guían
                    </h2>

                    {/* Contenedor con valores moviéndose de derecha a izquierda */}
                    <div className="relative w-full h-[400px] overflow-hidden">
                        {values.map((value, index) => {
                            // Posiciones verticales variadas
                            const topPositions = [
                                '8%',
                                '15%',
                                '25%',
                                '35%',
                                '45%',
                                '55%',
                                '65%',
                                '75%',
                                '85%',
                                '20%',
                                '30%',
                                '40%',
                                '50%',
                                '60%',
                                '70%',
                                '80%',
                            ]
                            const top =
                                topPositions[index % topPositions.length]
                            const delay = index * 0.5
                            const duration = 15 + (index % 5) * 2 // Duración variada entre 15-25 segundos

                            return (
                                <div
                                    key={`value-${index}`}
                                    className={`absolute px-4 py-2 rounded-full shadow-md text-sm font-medium ${getColorClass(
                                        value.color
                                    )} value-slide`}
                                    style={{
                                        top: top,
                                        left: '110%',
                                        animationDelay: `${delay}s`,
                                        animationDuration: `${duration}s`,
                                    }}
                                >
                                    {value.name}
                                </div>
                            )
                        })}

                        {/* Valores adicionales para más densidad */}
                        {values.slice(0, 8).map((value, index) => {
                            const topPositions = [
                                '12%',
                                '22%',
                                '32%',
                                '42%',
                                '52%',
                                '62%',
                                '72%',
                                '82%',
                            ]
                            const top =
                                topPositions[index % topPositions.length]
                            const delay = (index + values.length) * 0.4
                            const duration = 18 + (index % 4) * 2

                            return (
                                <div
                                    key={`extra-value-${index}`}
                                    className={`absolute px-4 py-2 rounded-full shadow-md text-sm font-medium ${getColorClass(
                                        value.color
                                    )} value-slide`}
                                    style={{
                                        top: top,
                                        left: '110%',
                                        animationDelay: `${delay}s`,
                                        animationDuration: `${duration}s`,
                                    }}
                                >
                                    {value.name}
                                </div>
                            )
                        })}
                    </div>

                    <style>{`
            @keyframes slideLeft {
              0% {
                left: 110%;
                opacity: 0;
                transform: translateY(-50%) scale(0.8);
              }
              8% {
                opacity: 1;
                transform: translateY(-50%) scale(1);
              }
              85% {
                opacity: 1;
                transform: translateY(-50%) scale(1);
              }
              92% {
                opacity: 0.5;
                transform: translateY(-50%) scale(0.95);
              }
              100% {
                left: -10%;
                opacity: 0;
                transform: translateY(-50%) scale(0.8);
              }
            }
            
            .value-slide {
              animation: slideLeft linear infinite;
              transform: translateY(-50%);
              will-change: left, opacity, transform;
              white-space: nowrap;
            }
            
            .value-slide:hover {
              animation-play-state: paused;
              transform: translateY(-50%) scale(1.2) !important;
              opacity: 1 !important;
              z-index: 10;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3) !important;
            }
          `}</style>
                </div>
            </div>
        </section>
    )
}

export default CompanyValuesGrid
