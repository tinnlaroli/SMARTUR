import cloudinary from '../config/cloudinary.js';

class EvaluationPdfController {
    static async parsePdf(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No PDF file provided' });
            }

            const rubric = req.body.rubric ? JSON.parse(req.body.rubric) : null;
            if (!rubric || !rubric.criteria) {
                return res.status(400).json({ message: 'Invalid rubric provided' });
            }

            console.log('[PDF] Processing PDF');
            console.log(`[PDF] File size: ${req.file.size} bytes, criteria: ${rubric.criteria.length}`);

            // Simulate OCR delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock OCR results
            const parsed = rubric.criteria.map((criterion, idx) => {
                if (idx < 2) {
                    return {
                        id_criterion: criterion.id_criterion,
                        name: criterion.name,
                        detected_score: Math.floor(Math.random() * 5) + 1,
                        confidence: 'high',
                    };
                } else if (idx === 2 && rubric.criteria.length > 3) {
                    return {
                        id_criterion: criterion.id_criterion,
                        name: criterion.name,
                        detected_score: Math.floor(Math.random() * 5) + 1,
                        confidence: 'low',
                    };
                } else {
                    return {
                        id_criterion: criterion.id_criterion,
                        name: criterion.name,
                        detected_score: null,
                        confidence: 'none',
                    };
                }
            });

            // Upload PDF to Cloudinary
            let pdf_url = null;
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'smartur/evaluations/pdfs',
                            resource_type: 'auto',
                            public_id: `eval_${Date.now()}`,
                        },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        }
                    ).end(req.file.buffer);
                });
                pdf_url = uploadResult.secure_url;
                console.log(`[PDF] Uploaded to Cloudinary: ${pdf_url}`);
            } catch (uploadError) {
                console.error('[PDF] Cloudinary upload failed (non-fatal):', uploadError.message);
            }

            return res.json({
                parsed,
                raw_text: `FORMULARIO DE EVALUACIÓN\n${rubric.criteria.map((c, i) => `${i + 1}. ${c.name}: ${parsed[i].detected_score || 'N/A'}`).join('\n')}`,
                pdf_url,
            });
        } catch (error) {
            console.error('[PDF] Error parsing PDF:', error);
            return res.status(500).json({
                message: 'Error parsing PDF',
                error: error.message,
            });
        }
    }
}

export default EvaluationPdfController;
