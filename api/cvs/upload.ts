import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runCors } from '../_lib/cors.js';
import { getAuthenticatedUser } from '../_lib/middleware.js';
import { getSupabase } from '../_lib/db.js';
import { logActivity } from '../_lib/utils.js';
import { parseCVTextAndGenerateSummary } from '../../src/services/aiService.js';
import multer from 'multer';
import mammoth from 'mammoth';

// For ESM compatibility with CJS modules like pdf-parse
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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
        console.log('[CV Upload] Starting upload process...');
        const user = await getAuthenticatedUser(req, res);
        if (!user) {
            console.warn('[CV Upload] Authentication failed');
            return;
        }
        console.log(`[CV Upload] Authenticated user: ${user.email}`);

        const supabase = getSupabase();
        if (!supabase) {
            console.error('[CV Upload] Supabase configuration missing');
            return res.status(500).json({ success: false, error: "Supabase configuration missing" });
        }

        console.log('[CV Upload] Processing multipart form data...');
        await runMiddleware(req, res, upload.single('cvFile'));
        const file = (req as any).file;
        if (!file) {
            console.warn('[CV Upload] No file provided in request');
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }
        console.log(`[CV Upload] File received: ${file.originalname} (${file.size} bytes)`);

        let textContent = "";
        const fileName = file.originalname;

        console.log(`[CV Upload] Extracting text from ${file.mimetype}...`);
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
            console.warn('[CV Upload] Text extraction failed or content too short');
            return res.status(400).json({ success: false, error: "Could not extract enough text from file." });
        }
        console.log(`[CV Upload] Successfully extracted ${textContent.length} characters of text`);

        console.log('[CV Upload] Calling AI service for analysis...');
        const openaiPayload = await parseCVTextAndGenerateSummary(textContent);
        console.log('[CV Upload] AI analysis complete');
        
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

        console.log('[CV Upload] Saving to Supabase...');
        const { error: insertErr } = await supabase.from('cvs').insert([analyzedCV]);
        if (insertErr) {
            console.error('[CV Upload] Supabase insert error:', insertErr);
            throw insertErr;
        }
        
        console.log('[CV Upload] Logging activity...');
        await logActivity(user.id, user.tenantId, "analysis", `CV "${fileName}" analyzed.`);
        
        console.log('[CV Upload] Upload process finished successfully');
        return res.status(200).json({ success: true, data: analyzedCV });
    } catch (err: any) {
        console.error('[CV Upload Error]:', err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
