import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './auth.js';
import { getSupabase } from './db.js';
import { extendUserWithVirtualFields } from './utils.js';

export async function getAuthenticatedUser(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  if (!supabase) {
    res.status(500).json({ error: "Supabase environment variables are missing." });
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization token" });
    return null;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Session expired or invalid token" });
    return null;
  }
  
  try {
    const { data: rawUser, error } = await supabase.from('users').select('*').eq('id', decoded.userId).maybeSingle();
    if (error || !rawUser) {
      res.status(401).json({ error: "User session is invalid" });
      return null;
    }
    
    const user = extendUserWithVirtualFields(rawUser);
    if (user.status === 'suspended') {
      res.status(403).json({ error: "Your account has been suspended." });
      return null;
    }

    return user;
  } catch (err) {
    res.status(500).json({ error: "Authentication system failure" });
    return null;
  }
}

export async function getAuthenticatedAdmin(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return null;

  // Admin check: email or virtual role
  if (user.email === "admin@smartcvai.com" || user.role === 'super_admin') {
    return user;
  }

  res.status(403).json({ error: "Unauthorized. Super Admin access only." });
  return null;
}
