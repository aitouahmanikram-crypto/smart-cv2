import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getSupabase } from '../_lib/db.js';
import { generateToken } from '../_lib/auth.js';
import { runCors } from '../_lib/cors.js';
import { serializeUserBio } from '../_lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ success: true });
  }

  if (!runCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed', 
      method: req.method, 
      route: '/api/auth/register', 
      allowedMethods: ['POST'] 
    });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Supabase configuration missing" });

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid JSON body" });
      }
    }

    const { email, password, name } = body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required" });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: "An account with this email address already exists" });
    }

    const userId = `user-${Date.now()}`;
    const tenantId = `tenant-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const virtualBio = serializeUserBio("user", "active", "");

    const { error } = await supabase.from('users').insert([{
      id: userId,
      email: email.toLowerCase(),
      passwordHash: passwordHash,
      name,
      tenantId: tenantId,
      title: "",
      bio: virtualBio,
      createdAt: new Date().toISOString()
    }]);

    if (error) throw error;

    const token = generateToken(userId, tenantId);
    return res.status(201).json({ 
      success: true, 
      data: { 
        token, 
        user: { 
          id: userId, 
          email, 
          name, 
          tenantId: tenantId, 
          role: "user", 
          status: "active" 
        } 
      } 
    });
  } catch (err: any) {
    console.error('[Register Error]:', err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
