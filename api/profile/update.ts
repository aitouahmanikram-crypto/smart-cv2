import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/db.js';
import { runCors } from '../_lib/cors.js';
import { getAuthenticatedUser } from '../_lib/middleware.js';
import { extendUserWithVirtualFields, serializeUserBio } from '../_lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ success: true });
  }

  if (!runCors(req, res)) return;

  const allowedMethods = ['POST', 'PUT', 'PATCH'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed', 
      method: req.method, 
      route: '/api/profile/update', 
      allowedMethods 
    });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Supabase configuration missing" });

    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid JSON body" });
      }
    }

    const { name, title, bio } = body || {};

    const { data: rawUser, error: uErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (uErr || !rawUser) return res.status(404).json({ success: false, error: "User not found" });

    const existingVirtuals = extendUserWithVirtualFields(rawUser);
    const newBio = serializeUserBio(
      existingVirtuals.role || "user",
      existingVirtuals.status || "active",
      bio !== undefined ? bio : (existingVirtuals.bioContent || "")
    );

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title;
    if (bio !== undefined) updateData.bio = newBio;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json({ success: true, data: extendUserWithVirtualFields(updated) });
  } catch (err: any) {
    console.error('[Profile Update Error]:', err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
