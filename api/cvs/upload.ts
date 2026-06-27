import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { getAuthenticatedUser } from '../_lib/middleware.js';
import { getSupabase } from '../_lib/db.js';
import { parseCVTextAndGenerateSummary } from '../../src/services/aiService.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: any): Promise<{ fields: any, files: any }> => {
  const form = formidable({ 
    maxFileSize: 5 * 1024 * 1024,
    keepExtensions: true,
  });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      receivedMethod: req.method
    });
  }

  try {
    // 1. Authenticate (optional check for dev)
    const user = await getAuthenticatedUser(req, res);
    const isDev = process.env.NODE_ENV !== 'production';

    if (!user && !isDev) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // 2. Parse Multipart
    const { files } = await parseForm(req);
    const cvFile = Array.isArray(files.cvFile) ? files.cvFile[0] : files.cvFile;

    if (!cvFile) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Use field name "cvFile".' });
    }

    // 3. Read Buffer
    const buffer = fs.readFileSync(cvFile.filepath);
    const originalFilename = cvFile.originalFilename || 'cv.pdf';
    const mimetype = cvFile.mimetype || '';

    console.log(`[CV Upload] Processing: ${originalFilename} (${buffer.length} bytes)`);

    // 4. Extract Text
    let text = '';
    if (mimetype === 'application/pdf' || originalFilename.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || originalFilename.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString('utf8');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Empty text extracted from CV');
    }

    // 5. AI Analysis
    console.log('[CV Upload] Analyzing with AI...');
    const analysis = await parseCVTextAndGenerateSummary(text);

    // 6. Database Storage
    let dbId = 'temp-' + Date.now();
    const now = new Date().toISOString();

    if (user) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: dbData, error: dbError } = await supabase
          .from('cvs')
          .insert([{
            userId: user.id,
            fileName: originalFilename,
            fullText: text,
            summary: analysis.summary,
            score: analysis.score,
            parsedDetails: analysis.parsedDetails,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.recommendations,
            skills: analysis.skills,
            status: 'processed',
            updatedAt: now,
            createdAt: now
          }])
          .select()
          .single();

        if (dbError) {
          console.error('[CV Upload] DB Error:', dbError);
        } else {
          dbId = dbData.id;
        }
      }
    }

    // 7. Cleanup temp file
    try {
      fs.unlinkSync(cvFile.filepath);
    } catch (e) {
      console.error('[CV Upload] Cleanup error:', e);
    }

    return res.status(200).json({
      success: true,
      data: {
        id: dbId,
        fileName: originalFilename,
        updatedAt: now,
        ...analysis
      }
    });

  } catch (error: any) {
    console.error('[CV Upload] Error:', error);
    return res.status(500).json({
      success: false,
      error: `Processing failed: ${error.message}`
    });
  }
}
