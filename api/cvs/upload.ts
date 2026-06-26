import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runCors } from '../_lib/cors';
import { getAuthenticatedUser } from '../_lib/middleware';
import { getSupabase } from '../_lib/db';
import { logActivity } from '../_lib/utils';
import { parseCVTextAndGenerateSummary } from '../../src/services/aiService';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const runMiddleware = (req: any, res: any, fn: any) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
};

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).json({ success: true });
    }

    if (!runCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed', 
            method: req.method, 
            route: '/api/cvs/upload', 
            allowedMethods: ['POST'] 
        });
    }

    try {
        const user = await getAuthenticatedUser(req, res);
        if (!user) return;

        const supabase = getSupabase();
        if (!supabase) return res.status(500).json({ success: false, error: "Supabase configuration missing" });

        await runMiddleware(req, res, upload.single('cvFile'));
        const file = (req as any).file;
        if (!file) return res.status(400).json({ success: false, error: "No file uploaded" });

        let textContent = "";
        const fileName = file.originalname;

        if (file.mimetype === "application/pdf") {
            const pdfData = await pdfParse(file.buffer);
            textContent = pdfData.text;
        } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.endsWith(".docx")) {
            const docResult = await mammoth.extractRawText({ buffer: file.buffer });
            textContent = docResult.value;
        } else {
            textContent = file.buffer.toString("utf-8");
        }

        if (!textContent || textContent.trim().length < 50) {
            return res.status(400).json({ success: false, error: "Could not extract enough text from file." });
        }

        const openaiPayload = await parseCVTextAndGenerateSummary(textContent);
        const score = openaiPayload.score || 72;
        const cvId = `cv-${Date.now()}`;
        const status = score >= 80 ? "VALIDATED" : (score >= 60 ? "ANALYSED" : "REJECTED");

        const analyzedCV = {
            id: cvId, userId: user.id, fileName: fileName || "Resume", status, score,
            grammarScore: openaiPayload.grammarScore || 70, impactScore: openaiPayload.impactScore || 65, skillsScore: openaiPayload.skillsScore || 75,
            summary: openaiPayload.summary || "Parsed Resume", suggestions: openaiPayload.recommendations || [],
            strengths: openaiPayload.strengths || [], weaknesses: openaiPayload.weaknesses || [], atsOptimizations: openaiPayload.atsOptimizations || [],
            grammarImprovements: openaiPayload.grammarImprovements || [], recommendations: openaiPayload.recommendations || [],
            skillsMatched: openaiPayload.skillsMatched || [], skillsMissing: openaiPayload.skillsMissing || [],
            parsedDetails: { ...(openaiPayload.parsedDetails || {}), keywordMatching: openaiPayload.keywordMatching || 70 }, 
            updatedAt: new Date().toISOString()
        };

        const { error: insertErr } = await supabase.from('cvs').insert([analyzedCV]);
        if (insertErr) throw insertErr;
        await logActivity(user.id, user.tenantId, "analysis", `CV "${fileName}" analyzed.`);
        
        return res.status(200).json({ success: true, data: analyzedCV });
    } catch (err: any) {
        console.error('[CV Upload Error]:', err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
