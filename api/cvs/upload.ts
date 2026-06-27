import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedUser } from '../_lib/middleware.js';
import { getSupabase } from '../_lib/db.js';
import { parseCVTextAndGenerateSummary } from '../../src/services/aiService.js';
import multer from 'multer';
import pdfParse from 'pdf-parse';

// Use a unique name for the field in multipart form
const FILE_FIELD_NAME = 'cvFile';

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }
});

const runMiddleware = (req: any, res: any, fn: any) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }
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
    console.log(`[CV Upload] Incoming: ${req.method} ${req.url}`);
    console.log(`[CV Upload] Content-Type: ${req.headers['content-type']}`);
    
    // 1. CORS Headers (Always return JSON even on error)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Strict Method Check - Must return JSON
    if (req.method !== 'POST') {
        console.warn(`[CV Upload] Invalid Method: ${req.method}`);
        return res.status(405).json({ 
            success: false, 
            error: `Méthode ${req.method} non autorisée. Veuillez utiliser POST.`,
            allowedMethods: ['POST'],
            receivedMethod: req.method
        });
    }

    try {
        // 3. Authentication
        const user = await getAuthenticatedUser(req, res);
        
        // Mode Simulation pour AI Studio si l'utilisateur n'est pas connecté en dev
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev && !user) {
            console.log('[CV Upload] Developer simulation mode active');
            // We still want to see if a file was sent even if mock
        }

        if (!user && !isDev) {
            return res.status(401).json({ success: false, error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
        }

        // 4. Process Multipart Form
        try {
            await runMiddleware(req, res, upload.single(FILE_FIELD_NAME));
        } catch (multerErr: any) {
            console.error('[CV Upload] Multer Error:', multerErr);
            return res.status(400).json({ success: false, error: `Erreur lors du téléchargement du fichier: ${multerErr.message}` });
        }

        const file = (req as any).file;
        if (!file) {
            console.warn('[CV Upload] No file found in request');
            return res.status(400).json({ success: false, error: 'Aucun fichier reçu. Assurez-vous d\'envoyer un fichier avec la clé "cvFile".' });
        }

        console.log(`[CV Upload] File received: ${file.originalname} (${file.size} bytes)`);

        // 5. Parse Content
        let text = '';
        try {
            if (file.mimetype === 'application/pdf') {
                const data = await pdfParse(file.buffer);
                text = data.text;
            } else {
                text = file.buffer.toString('utf-8');
            }
        } catch (parseErr: any) {
            console.error('[CV Upload] Extraction Error:', parseErr);
            text = `Impossible d'extraire le texte du fichier ${file.originalname}.`;
        }

        // 6. AI Analysis
        console.log('[CV Upload] Starting AI analysis...');
        const analysis = await parseCVTextAndGenerateSummary(text);

        // 7. Store in DB (If authenticated)
        if (user) {
            const supabase = getSupabase();
            if (supabase) {
                const { data: dbData, error: dbError } = await supabase
                    .from('cvs')
                    .insert([{
                        user_id: user.id,
                        filename: file.originalname,
                        full_text: text,
                        analysis: analysis,
                        status: 'processed'
                    }])
                    .select()
                    .single();

                if (dbError) {
                    console.error('[CV Upload] Database Error:', dbError);
                    // Still return analysis even if DB fails
                }
                
                return res.status(200).json({
                    success: true,
                    data: {
                        id: dbData?.id || 'temp-' + Date.now(),
                        ...analysis
                    }
                });
            }
        }

        // Simulation response if not authenticated but in dev
        return res.status(200).json({
            success: true,
            data: {
                id: 'sim-' + Date.now(),
                ...analysis
            }
        });

    } catch (error: any) {
        console.error('[CV Upload] Fatal Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: `Erreur serveur: ${error.message || 'Une erreur inconnue est survenue'}`
        });
    }
}
