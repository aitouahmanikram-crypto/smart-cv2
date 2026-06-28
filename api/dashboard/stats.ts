import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/db.js';
import { runCors } from '../_lib/cors.js';
import { getAuthenticatedUser } from '../_lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ success: true });
  }

  if (!runCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed', 
      method: req.method, 
      route: '/api/dashboard/stats', 
      allowedMethods: ['GET'] 
    });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Supabase configuration missing" });

    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const [
      { data: cvs },
      { data: letters },
      { data: recentActivity }
    ] = await Promise.all([
      supabase.from('cvs').select('*').eq('userId', user.id).order('updatedAt', { ascending: false }),
      supabase.from('cover_letters').select('*').eq('userId', user.id).order('createdAt', { ascending: false }),
      supabase.from('activities').select('*').eq('userId', user.id).order('timestamp', { ascending: false }).limit(10)
    ]);

    let matches: any[] = [];
    if (cvs && cvs.length > 0) {
      const cvIds = cvs.map((cv: any) => cv.id);
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .in('cvId', cvIds)
        .order('createdAt', { ascending: false });
      matches = matchesData || [];
    }

    return res.status(200).json({
      success: true,
      data: {
        cvs: cvs || [],
        matches: matches || [],
        letters: letters || [],
        cvsCount: cvs?.length || 0,
        matchesCount: matches?.length || 0,
        lettersCount: letters?.length || 0,
        recentActivity: recentActivity || [],
        averageScore: cvs?.length ? Math.round(cvs.reduce((acc, c) => acc + (c.score || 0), 0) / cvs.length) : 0
      }
    });
  } catch (err: any) {
    console.error('[Dashboard Error]:', err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
