import pool from '../config/db.js';
import cloudinary from '../config/cloudinary.js';

async function uploadToCloudinary(buffer, folder) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => { if (error) return reject(error); resolve(result); }
        ).end(buffer);
    });
}

class KycController {
    /**
     * POST /api/v2/empresa/verification
     * Crea o actualiza el formulario KYC de la empresa autenticada.
     * Body: owner_full_name, owner_birth_date, owner_curp, owner_rfc,
     *       owner_street, owner_colonia, owner_municipio, owner_state, owner_zip
     * Files (multipart): ine_front, ine_back, address_proof
     */
    static async submitVerification(req, res) {
        const id_company = req.user.id_company;
        if (!id_company) {
            return res.status(400).json({ message: 'Sin empresa asociada.' });
        }

        const {
            owner_full_name, owner_birth_date, owner_curp, owner_rfc,
            owner_street, owner_colonia, owner_municipio, owner_zip
        } = req.body;

        // Normalize: always Veracruz; CURP/RFC uppercase stripped
        const owner_state = 'Veracruz';
        const normalizedCurp = owner_curp
            ? owner_curp.trim().toUpperCase().replace(/\s+/g, '').slice(0, 18)
            : null;
        const normalizedRfc = owner_rfc
            ? owner_rfc.trim().toUpperCase().replace(/[\s-]/g, '').slice(0, 13)
            : null;

        try {
            const files = req.files || {};

            // Primera solicitud: INE frente y reverso son obligatorios
            const preCheck = await pool.query(
                'SELECT id_verification FROM company_verification WHERE id_company = $1',
                [id_company]
            );
            if (preCheck.rows.length === 0 && (!files.ine_front?.[0] || !files.ine_back?.[0])) {
                return res.status(400).json({
                    message: 'El INE frente y reverso son obligatorios para la primera verificación.'
                });
            }

            // Subir documentos a Cloudinary si se enviaron
            let ine_front_url = null;
            let ine_back_url = null;
            let address_proof_url = null;

            const folder = `smartur/kyc/${id_company}`;
            if (files.ine_front?.[0]) {
                const result = await uploadToCloudinary(files.ine_front[0].buffer, folder);
                ine_front_url = result.secure_url;
            }
            if (files.ine_back?.[0]) {
                const result = await uploadToCloudinary(files.ine_back[0].buffer, folder);
                ine_back_url = result.secure_url;
            }
            if (files.address_proof?.[0]) {
                const result = await uploadToCloudinary(files.address_proof[0].buffer, folder);
                address_proof_url = result.secure_url;
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Upsert en company_verification
                const existingResult = await client.query(
                    'SELECT id_verification, resubmission_count FROM company_verification WHERE id_company = $1',
                    [id_company]
                );

                let verification;
                if (existingResult.rows.length > 0) {
                    const prev = existingResult.rows[0];
                    verification = await client.query(
                        `UPDATE company_verification SET
                            owner_full_name    = COALESCE($1, owner_full_name),
                            owner_birth_date   = COALESCE($2, owner_birth_date),
                            owner_curp         = COALESCE($3, owner_curp),
                            owner_rfc          = COALESCE($4, owner_rfc),
                            owner_street       = COALESCE($5, owner_street),
                            owner_colonia      = COALESCE($6, owner_colonia),
                            owner_municipio    = COALESCE($7, owner_municipio),
                            owner_state        = COALESCE($8, owner_state),
                            owner_zip          = COALESCE($9, owner_zip),
                            ine_front_url      = COALESCE($10, ine_front_url),
                            ine_back_url       = COALESCE($11, ine_back_url),
                            address_proof_url  = COALESCE($12, address_proof_url),
                            submitted_at       = NOW(),
                            reviewed_at        = NULL,
                            rejection_reason   = NULL,
                            resubmission_count = $13
                         WHERE id_company = $14
                         RETURNING *`,
                        [
                            owner_full_name || null, owner_birth_date || null,
                            normalizedCurp, normalizedRfc,
                            owner_street || null, owner_colonia || null,
                            owner_municipio || null, owner_state, owner_zip || null,
                            ine_front_url, ine_back_url, address_proof_url,
                            prev.resubmission_count + 1, id_company
                        ]
                    );
                } else {
                    verification = await client.query(
                        `INSERT INTO company_verification
                            (id_company, owner_full_name, owner_birth_date, owner_curp, owner_rfc,
                             owner_street, owner_colonia, owner_municipio, owner_state, owner_zip,
                             ine_front_url, ine_back_url, address_proof_url, submitted_at)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
                         RETURNING *`,
                        [
                            id_company, owner_full_name || null, owner_birth_date || null,
                            normalizedCurp, normalizedRfc,
                            owner_street || null, owner_colonia || null,
                            owner_municipio || null, owner_state, owner_zip || null,
                            ine_front_url, ine_back_url, address_proof_url
                        ]
                    );
                }

                // Cambiar status de empresa a documents_submitted
                await client.query(
                    `UPDATE company SET status = 'documents_submitted' WHERE id_company = $1`,
                    [id_company]
                );

                // Sincronizar id_location en company si el municipio enviado coincide con un registro
                if (owner_municipio) {
                    const locResult = await client.query(
                        'SELECT id_location FROM location WHERE LOWER(name) = LOWER($1) LIMIT 1',
                        [owner_municipio]
                    );
                    if (locResult.rows[0]) {
                        await client.query(
                            'UPDATE company SET id_location = $1 WHERE id_company = $2',
                            [locResult.rows[0].id_location, id_company]
                        );
                    }
                }

                await client.query('COMMIT');
                return res.status(200).json({
                    message: 'Documentos enviados. Pendiente de revisión.',
                    verification: verification.rows[0]
                });
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error en submitVerification:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }

    /**
     * GET /api/v2/empresa/verification
     * Devuelve el estado de verificación KYC de la empresa autenticada.
     */
    static async getVerification(req, res) {
        const id_company = req.user.id_company;
        if (!id_company) {
            return res.status(400).json({ message: 'Sin empresa asociada.' });
        }

        try {
            const [companyResult, verResult] = await Promise.all([
                pool.query('SELECT status, name, is_certified, certified_at FROM company WHERE id_company = $1', [id_company]),
                pool.query('SELECT * FROM company_verification WHERE id_company = $1', [id_company])
            ]);

            const company = companyResult.rows[0];
            const verification = verResult.rows[0] || null;

            return res.json({
                status: company.status,
                company_name: company.name,
                is_certified: company.is_certified,
                certified_at: company.certified_at,
                verification,
            });
        } catch (error) {
            console.error('Error en getVerification:', error);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }
}

export default KycController;
