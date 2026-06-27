import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
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
    console.log(`[Upload Test] Received ${req.method} request`);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.',
            received: req.method
        });
    }

    try {
        await runMiddleware(req, res, upload.single('cvFile'));
        
        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({ success: false, error: 'No file received' });
        }

        let text = '';
        const mimetype = file.mimetype || '';
        const originalName = file.originalname || 'unknown.file';
        
        console.log(`[Upload Test] Parsing file: ${originalName} (Mime: ${mimetype})`);

        if (mimetype === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
            const data = await pdfParse(file.buffer);
            text = data.text;
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || originalName.toLowerCase().endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            text = result.value;
        } else {
            text = file.buffer.toString('utf8');
        }

        if (!text || text.trim().length === 0) {
            throw new Error('Extraction resulted in empty text. Please check the file content.');
        }

        return res.status(200).json({
            success: true,
            fileName: originalName,
            fileType: mimetype,
            fileSize: file.size,
            extractedTextPreview: text.substring(0, 800) + (text.length > 800 ? '...' : '')
        });

    } catch (error: any) {
        console.error('[Upload Test] Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Server error during upload test'
        });
    }
}
