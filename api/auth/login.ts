import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getSupabase } from '../_lib/db.js';
import { generateToken } from '../_lib/auth.js';
import { runCors } from '../_lib/cors.js';

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
      route: '/api/auth/login', 
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

    const { email, password } = body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error || !user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const token = generateToken(user.id, user.tenantId);
    return res.status(200).json({ 
      success: true, 
      data: { 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          tenantId: user.tenantId 
        } 
      } 
    });
  } catch (err: any) {
    console.error('[Login Error]:', err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
