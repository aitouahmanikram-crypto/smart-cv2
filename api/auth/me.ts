import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/db';
import { runCors } from '../_lib/cors';
import { getAuthenticatedUser } from '../_lib/middleware';
import { extendUserWithVirtualFields } from '../_lib/utils';

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
      route: '/api/auth/me', 
      allowedMethods: ['GET'] 
    });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Supabase configuration missing" });

    const user = await getAuthenticatedUser(req, res);
    if (!user) return; // Middleware already sent 401

    const { data: fullUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !fullUser) {
      return res.status(404).json({ success: false, error: "User profile not found" });
    }

    const userWithVirtuals = extendUserWithVirtualFields(fullUser);
    return res.status(200).json({ success: true, data: userWithVirtuals });
  } catch (err: any) {
    console.error('[Me Error]:', err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
