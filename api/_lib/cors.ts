import type { VercelRequest, VercelResponse } from '@vercel/node';

export function runCors(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).json({ success: true });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
