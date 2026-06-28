import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: any): Promise<{ fields: any, files: any }> => {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { files } = await parseForm(req);
    const cvFile = Array.isArray(files.cvFile) ? files.cvFile[0] : files.cvFile;

    if (!cvFile) {
      return res.status(400).json({ success: false, error: 'No file received' });
    }

    const buffer = fs.readFileSync(cvFile.filepath);
    const originalName = cvFile.originalFilename || 'unknown.file';
    const mimetype = cvFile.mimetype || '';

    let text = '';
    if (mimetype === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || originalName.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString('utf8');
    }

    // Cleanup
    try { fs.unlinkSync(cvFile.filepath); } catch(e) {}

    return res.status(200).json({
      success: true,
      fileName: originalName,
      fileSize: buffer.length,
      extractedTextPreview: text.substring(0, 1000) + (text.length > 1000 ? '...' : '')
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
