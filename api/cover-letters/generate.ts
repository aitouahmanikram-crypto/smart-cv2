import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/db.js';
import { getAuthenticatedUser } from '../_lib/middleware.js';
import { generateCoverLetter } from '../../src/services/aiService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });

    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Database configuration missing" });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { cvId, jobTitle, jobDescription, companyName, experienceLevel, skills, recipientName } = body;

    let cvText = "";
    if (cvId && cvId !== "none") {
      const { data: cv } = await supabase.from('cvs').select('*').eq('id', cvId).maybeSingle();
      if (cv) cvText = cv.fullText || cv.summary;
    }

    const letterContent = await generateCoverLetter({
      parsedCvText: cvText,
      jobTitle,
      jobDescription,
      companyName: companyName || "the company",
      experienceLevel,
      skills,
      recipientName
    });

    const letterResult = {
      id: `letter-${Date.now()}`,
      userId: user.id,
      cvId: cvId === "none" ? null : cvId,
      jobTitle,
      companyName,
      generatedText: letterContent,
      createdAt: new Date().toISOString()
    };

    const { error: dbError } = await supabase.from('cover_letters').insert([letterResult]);
    if (dbError) console.error('[Cover Letter Generate] DB Insert Error:', dbError);

    return res.status(200).json({ success: true, data: letterResult });
  } catch (err: any) {
    console.error('[Cover Letter Generate Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
