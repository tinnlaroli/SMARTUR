import jsPDF from 'jspdf';
import type { EvaluationRubric, EvaluationCriterion } from '../types/types';

export function generateBlankEvaluationForm(
    rubric: EvaluationRubric,
    serviceName: string,
    evaluationDate?: string
): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - 2 * margin;
    const dateStr = evaluationDate || new Date().toLocaleDateString('es-MX');

    let y = 0;
    let pageNum = 1;

    const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - 18) {
            drawFooter();
            doc.addPage();
            pageNum++;
            y = margin;
        }
    };

    const drawFooter = () => {
        const fy = pageHeight - 10;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 160);
        doc.text('WELLTUR — Sistema de Evaluación Turística', margin, fy);
        doc.text(`Página ${pageNum}`, pageWidth - margin, fy, { align: 'right' });
        doc.setTextColor(0, 0, 0);
    };

    // ── HEADER BAND ──────────────────────────────────────────────────────────
    doc.setFillColor(79, 70, 229); // violet-600
    doc.rect(0, 0, pageWidth, 38, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FORMULARIO DE EVALUACIÓN', pageWidth / 2, 13, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 220, 255);
    doc.text(`Servicio: ${serviceName}`, margin, 22);
    doc.text(`Plantilla: ${rubric.name} v${rubric.version}`, margin, 29);
    doc.text(`Fecha: ${dateStr}`, pageWidth - margin, 22, { align: 'right' });
    doc.text('Evaluador: _________________________', pageWidth - margin, 29, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    y = 46;

    // ── INSTRUCTIONS ─────────────────────────────────────────────────────────
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('INSTRUCCIONES', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 100);
    doc.text(
        'Marque con ✓ o X la casilla del puntaje asignado a cada criterio. La marca debe estar clara y dentro del cuadro.',
        margin + 4, y + 10,
        { maxWidth: contentWidth - 8 }
    );
    doc.setTextColor(0, 0, 0);
    y += 20;

    // ── CRITERIA ─────────────────────────────────────────────────────────────
    const criteriaByStep = groupCriteriaByStep(rubric.criteria);
    const stepLabels: Record<string, string> = {
        infraestructura: 'INFRAESTRUCTURA',
        higiene: 'HIGIENE Y LIMPIEZA',
        servicio: 'CALIDAD DE SERVICIO',
    };

    for (const [step, criteria] of Object.entries(criteriaByStep)) {
        if (criteria.length === 0) continue;

        const stepLabel = stepLabels[step as keyof typeof stepLabels] || step.toUpperCase();

        // Section divider
        checkPageBreak(12);
        doc.setFillColor(236, 234, 254); // violet-100
        doc.rect(margin, y, contentWidth, 9, 'F');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text(`▸  ${stepLabel}`, margin + 4, y + 6);
        doc.setTextColor(0, 0, 0);
        y += 13;

        for (const criterion of criteria) {
            const levelsNeeded = criterion.levels.length * 7 + 28;
            checkPageBreak(levelsNeeded);

            // Criterion header
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 50);
            const criterionLabel = `${criterion.order_index}. ${criterion.name}`;
            const labelLines = doc.splitTextToSize(criterionLabel, contentWidth - 4);
            doc.text(labelLines, margin + 2, y);
            y += labelLines.length * 5 + 2;

            // Scoring levels table
            for (let i = 0; i < criterion.levels.length; i++) {
                const level = criterion.levels[i];
                checkPageBreak(8);

                const rowY = y;
                const isLast = i === criterion.levels.length - 1;

                // Alternating row bg
                if (i % 2 === 0) {
                    doc.setFillColor(250, 250, 252);
                    doc.rect(margin + 2, rowY - 4, contentWidth - 4, 7, 'F');
                }

                // Checkbox square
                doc.setDrawColor(100, 100, 140);
                doc.setLineWidth(0.5);
                doc.rect(margin + 4, rowY - 3.5, 4.5, 4.5);

                // Score badge
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(79, 70, 229);
                doc.text(`${level.score}`, margin + 12, rowY);

                // Description
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 80);
                const descLines = doc.splitTextToSize(level.description, contentWidth - 26);
                doc.text(descLines, margin + 18, rowY);

                y += isLast ? 6 : 7;
            }

            // Observations line
            checkPageBreak(8);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(130, 130, 150);
            doc.text('Observaciones:', margin + 2, y);
            doc.setDrawColor(180, 180, 200);
            doc.setLineWidth(0.3);
            doc.line(margin + 28, y, margin + contentWidth - 2, y);
            y += 6;

            // Separator line between criteria
            doc.setDrawColor(230, 230, 240);
            doc.setLineWidth(0.2);
            doc.line(margin, y, margin + contentWidth, y);
            y += 5;
        }
    }

    // ── GENERAL OBSERVATIONS ─────────────────────────────────────────────────
    checkPageBreak(32);
    y += 4;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 50);
    doc.text('OBSERVACIONES GENERALES', margin, y);
    y += 6;

    doc.setDrawColor(180, 180, 200);
    doc.setLineWidth(0.3);
    for (let i = 0; i < 4; i++) {
        checkPageBreak(7);
        doc.line(margin, y, margin + contentWidth, y);
        y += 7;
    }

    // ── SIGNATURE BLOCK ───────────────────────────────────────────────────────
    checkPageBreak(22);
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 100);

    const sigX1 = margin + 4;
    const sigX2 = pageWidth / 2 + 10;

    doc.line(sigX1, y, sigX1 + 65, y);
    doc.line(sigX2, y, sigX2 + 65, y);
    y += 4;
    doc.text('Firma del Evaluador', sigX1, y);
    doc.text(`Fecha: ${dateStr}`, sigX2, y);

    drawFooter();

    const safeService = serviceName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const safeDate = (evaluationDate || new Date().toISOString().split('T')[0]);
    doc.save(`Evaluacion_${safeService}_${safeDate}.pdf`);
}

function groupCriteriaByStep(
    criteria: EvaluationCriterion[]
): Record<string, EvaluationCriterion[]> {
    const result: Record<string, EvaluationCriterion[]> = {
        infraestructura: [],
        higiene: [],
        servicio: [],
    };

    const stepPattern = /\[STEP:(\w+)\]/i;
    const steps = ['infraestructura', 'higiene', 'servicio'];

    for (const criterion of criteria) {
        const match = criterion.description?.match(stepPattern);
        if (match) {
            const step = match[1].toLowerCase();
            if (step in result) {
                result[step].push(criterion);
            }
        } else {
            const stepIndex = criterion.order_index % 3;
            result[steps[stepIndex]].push(criterion);
        }
    }

    return result;
}
