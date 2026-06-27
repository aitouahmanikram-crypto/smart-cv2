import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  return res.status(200).json({
    success: true,
    message: "GET /api/matches/saved reached",
    data: []
  });
}
