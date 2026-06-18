# Guía de Prueba: Evaluación en PDF + OCR Local

## Estado Actual

He implementado la infraestructura completa para:
1. ✅ Descarga de PDF en blanco con formulario de evaluación
2. ✅ Carga y OCR automático de PDFs escaneados
3. ✅ Validación de resultados extraídos

**Lo que queda integrar en el modal:** Agregar los nuevos componentes en el paso final del wizard.

---

## Archivos Creados

### Frontend (PLATAFORMA)
- `src/features/evaluations/utils/pdfGenerator.ts` — Genera PDF en blanco con jsPDF
- `src/features/evaluations/components/PdfUploadSection.tsx` — UI para descargar/subir PDF
- `src/features/evaluations/components/ScanValidationStep.tsx` — UI para validar resultados OCR
- `src/features/evaluations/hooks/usePdfParsing.ts` — Hook para enviar PDF al backend

### Backend (API)
- `controllers/evaluationPdfController.js` — Lee PDF, ejecuta Tesseract, parsea texto
- `routes/evaluationPdfRoutes.js` — Endpoint POST `/service-evaluation/parse-pdf`
- Registrado en `index.js`

---

## Cómo Integrar en el Modal (Manual)

### Paso 1: Importar en `EvaluationWizardModal.tsx`

Agregar al inicio del archivo:

```tsx
import { PdfUploadSection } from './PdfUploadSection';
import { ScanValidationStep } from './ScanValidationStep';
import { usePdfParsing } from '../hooks/usePdfParsing';
```

### Paso 2: Agregar estado de PDF validation

En la función `EvaluationWizardModal`, agregar:

```tsx
const [showScanValidation, setShowScanValidation] = useState(false);
const [scannedResults, setScannedResults] = useState(null);
const { parsePdf, isLoading: isPdfLoading } = usePdfParsing();

const handlePdfSelected = async (file: File) => {
    const results = await parsePdf(file, rubric);
    if (results) {
        setScannedResults(results);
        setShowScanValidation(true);
    }
};

const handleScanValidationConfirm = (validatedScores: Record<number, number>) => {
    // Mapear scores validados al estado del wizard
    for (const [criterionId, score] of Object.entries(validatedScores)) {
        const criterion = rubric.criteria.find((c) => c.id_criterion === parseInt(criterionId, 10));
        if (criterion) {
            const level = criterion.levels.find((l) => l.score === score);
            if (level) {
                dispatch({
                    type: 'SET_SCORE',
                    criterionId: parseInt(criterionId, 10),
                    subcriterionId: level.id_subcriterion,
                    score: level.score,
                });
            }
        }
    }
    setShowScanValidation(false);
    setScannedResults(null);
    // Ir al paso final
    dispatch({ type: 'SET_STEP', step: 3 });
};
```

### Paso 3: Mostrar componentes en el paso 3 (evidencias)

En la sección `currentStep === 3`, **ANTES** del textarea de observaciones generales, agregar:

```tsx
{!showScanValidation ? (
    <PdfUploadSection
        rubric={rubric}
        serviceName={serviceName}
        onPdfSelected={handlePdfSelected}
        isLoading={isPdfLoading}
    />
) : (
    <ScanValidationStep
        parsed={scannedResults}
        rubric={rubric}
        onConfirm={handleScanValidationConfirm}
        onCancel={() => {
            setShowScanValidation(false);
            setScannedResults(null);
        }}
        isSaving={false}
    />
)}
```

---

## Prueba Local Paso a Paso

### 1. Instala dependencias (ya hecho)

```bash
cd PLATAFORMA
npm install jspdf pdfjs-dist

cd ../API
npm install tesseract.js canvas pdfjs-dist
```

### 2. Inicia el API

```bash
cd API
npm run dev
```

Verifica que el endpoint esté disponible: `POST http://localhost:4000/api/v2/service-evaluation/parse-pdf`

### 3. Inicia PLATAFORMA

```bash
cd PLATAFORMA
npm run dev
```

Abre `http://localhost:5173`

### 4. Abre una evaluación

1. Ve a Dashboard → Servicios Turísticos
2. Selecciona un servicio
3. Haz clic en "Evaluar"
4. Avanza hasta el paso 3 (Evidencias)

### 5. Prueba descarga de PDF

1. Haz clic en "Descargar formulario PDF"
2. Se descargará un PDF con todos los criterios y casillas

### 6. Prueba carga y OCR

**Para una prueba rápida sin escanear físicamente:**

1. Abre el PDF descargado en Acrobat Reader o similar
2. Marca manualmente las casillas `[X]` junto a los scores que quieras (ej. `[X] 4`)
3. Guarda el PDF editado
4. En el wizard, carga el PDF editado en "Sube la evaluación escaneada"
5. Espera el spinner ~5-10 segundos (tesseract procesa)
6. Deberías ver los scores detectados en la sección de validación
7. Valida los scores y haz clic en "Confirmar y guardar"

---

## Troubleshooting

### El PDF descargado está vacío

- Verifica que `jsPDF` esté importado correctamente en `pdfGenerator.ts`
- Revisa la consola de PLATAFORMA para errores de PDF

### El endpoint `/service-evaluation/parse-pdf` retorna 404

- Verifica que `evaluationPdfRouter` esté importado y registrado en `index.js`
- Reinicia el API (`npm run dev`)

### El OCR tarda mucho

- Tesseract.js usa WASM y es lento en primera carga (~30-40 segundos)
- Después de la primera, está cacheado y es más rápido (~5-10 segundos)
- Si tarda más de 60 segundos, verifica memoria disponible

### El OCR detecta scores incorrectos

- El matching usa fuzzy logic (`Levenshtein`) con threshold 0.7
- Si el nombre del criterio en el PDF no es exactamente igual al de la rúbrica, puede fallar
- El formato esperado es: `[X] score` o `X score` o `x) score`
- Valida manualmente en la sección de validación

### Error "No PDF file provided"

- Verifica que `multer.js` esté configurado con `memoryStorage()`
- El frontend debe enviar `FormData` con campo `pdf`

---

## Próximos Pasos (No en Scope Actual)

1. Refinar OCR para ser más robusto con manuscrita
2. Agregar preview del PDF en el browser antes de parsear
3. Agregar opción de re-upload si OCR no es preciso
4. Guardar el PDF escaneado en el registro de evaluación (para auditoría)
5. Testear en móvil con imágenes desde cámara (no PDF)
