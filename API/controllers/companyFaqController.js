import * as FaqModel from '../models/companyFaqModel.js';

function getCompanyId(req) {
    return req.user?.id_company ?? null;
}

/** GET /api/v2/empresa/faqs */
export async function list(req, res) {
    try {
        const idCompany = getCompanyId(req);
        if (!idCompany) return res.status(403).json({ message: 'Sin empresa asociada.' });
        const faqs = await FaqModel.getAllFAQs(idCompany);
        return res.json({ faqs });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

/** POST /api/v2/empresa/faqs */
export async function create(req, res) {
    try {
        const idCompany = getCompanyId(req);
        if (!idCompany) return res.status(403).json({ message: 'Sin empresa asociada.' });
        const { question, answer } = req.body;
        if (!question?.trim() || !answer?.trim()) {
            return res.status(400).json({ message: 'question y answer son requeridos.' });
        }
        const faq = await FaqModel.createFAQ(idCompany, question.trim(), answer.trim());
        return res.status(201).json({ faq });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

/** PATCH /api/v2/empresa/faqs/:id */
export async function update(req, res) {
    try {
        const idCompany = getCompanyId(req);
        if (!idCompany) return res.status(403).json({ message: 'Sin empresa asociada.' });
        const idFaq = parseInt(req.params.id, 10);
        const { question, answer } = req.body;
        if (!question?.trim() || !answer?.trim()) {
            return res.status(400).json({ message: 'question y answer son requeridos.' });
        }
        const faq = await FaqModel.updateFAQ(idFaq, idCompany, question.trim(), answer.trim());
        if (!faq) return res.status(404).json({ message: 'FAQ no encontrada.' });
        return res.json({ faq });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

/** DELETE /api/v2/empresa/faqs/:id */
export async function remove(req, res) {
    try {
        const idCompany = getCompanyId(req);
        if (!idCompany) return res.status(403).json({ message: 'Sin empresa asociada.' });
        const idFaq = parseInt(req.params.id, 10);
        const deleted = await FaqModel.deleteFAQ(idFaq, idCompany);
        if (!deleted) return res.status(404).json({ message: 'FAQ no encontrada.' });
        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}
