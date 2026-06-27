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

    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error('[Cover Letters Index Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
