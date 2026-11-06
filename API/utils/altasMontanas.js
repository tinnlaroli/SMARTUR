/**
 * Los 57 municipios de la región de las Altas Montañas (Veracruz), la misma lista que usa el
 * ETL del DENUE (MODELO/src/denue_etl.py). Sirve para limitar la recomendación WELLTUR a la
 * región cuando la persona no elige "todo México".
 */
const MUNICIPIOS_ALTAS_MONTANAS = [
    'Acultzingo', 'Alpatláhuac', 'Amatlán de los Reyes', 'Aquila', 'Astacinga', 'Atlahuilco', 'Atoyac',
    'Atzacan', 'Calcahualco', 'Camarón de Tejeda', 'Camerino Z. Mendoza', 'Carrillo Puerto', 'Chocamán',
    'Coetzala', 'Comapa', 'Córdoba', 'Coscomatepec', 'Cuichapa', 'Cuitláhuac', 'Fortín', 'Huatusco',
    'Huiloapan de Cuauhtémoc', 'Ixhuatlán del Café', 'Ixhuatlancillo', 'Ixtaczoquitlán', 'La Perla',
    'Los Reyes', 'Magdalena', 'Maltrata', 'Mariano Escobedo', 'Mixtla de Altamirano', 'Naranjal', 'Nogales',
    'Omealca', 'Orizaba', 'Paso del Macho', 'Rafael Delgado', 'Río Blanco', 'San Andrés Tenejapan',
    'Sochiapa', 'Soledad Atzompa', 'Tehuipango', 'Tenampa', 'Tepatlaxco', 'Tequila', 'Texhuacán', 'Tezonapa',
    'Tlacotepec de Mejía', 'Tlaltetela', 'Tlaquilpa', 'Tlilapan', 'Tomatlán', 'Totutla', 'Xoxocotla', 'Yanga',
    'Zentla', 'Zongolica',
];

const normalizar = (valor) => String(valor ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

const NORMALIZADOS = MUNICIPIOS_ALTAS_MONTANAS.map(normalizar);

/** ¿El lugar está en las Altas Montañas? "Coscomatepec de Bravo" cuenta como Coscomatepec. */
function enAltasMontanas(estado, municipio) {
    if (!normalizar(estado).startsWith('veracruz')) return false;
    const m = normalizar(municipio);
    return m !== '' && NORMALIZADOS.some((n) => m === n || m.startsWith(`${n} `));
}

export { MUNICIPIOS_ALTAS_MONTANAS, enAltasMontanas, normalizar };
