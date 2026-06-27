import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/db.js';
import { getAuthenticatedUser } from '../_lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });

    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Database configuration missing" });

    // Handle DELETE for /api/matches/save/:id
    if (req.method === 'DELETE') {
      const id = req.query.id || req.url?.split('/').pop();
      if (!id) return res.status(400).json({ success: false, error: "Match ID required" });

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('userId', user.id)
        .eq('type', 'saved_job')
        .eq('message', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: "Job removed from saved" });
    }

    // Handle GET (listing)
    const { data: savedActivities } = await supabase
      .from('activities')
      .select('*')
      .eq('userId', user.id)
      .eq('type', 'saved_job');

    if (!savedActivities || savedActivities.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const matchIds = savedActivities.map((act: any) => act.message);
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .in('id', matchIds);

    if (error) throw error;

    return res.status(200).json({ success: true, data: matches || [] });
  } catch (err: any) {
    console.error('[Matches Saved Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
