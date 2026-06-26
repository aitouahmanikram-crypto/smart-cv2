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
      { count: cvCount },
      { count: matchCount },
      { count: interviewCount }
    ] = await Promise.all([
      supabase.from('cvs').select('*', { count: 'exact', head: true }).eq('userId', user.id),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('userId', user.id),
      supabase.from('activities').select('*', { count: 'exact', head: true }).eq('userId', user.id).eq('type', 'interview')
    ]);

    const { data: recentActivity } = await supabase
      .from('activities')
      .select('*')
      .eq('userId', user.id)
      .order('timestamp', { ascending: false })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          cvs: cvCount || 0,
          matches: matchCount || 0,
          interviews: interviewCount || 0,
          score: 85 // Mock or calculate
        },
        recentActivity: recentActivity || []
      }
    });
  } catch (err: any) {
    console.error('[Dashboard Error]:', err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
