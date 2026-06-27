import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  console.log(`[CV Upload Proof] Received ${req.method} request at ${new Date().toISOString()}`);

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      receivedMethod: req.method,
      allowedMethods: ["POST"]
    });
  }

  return res.status(200).json({
    success: true,
    message: "POST upload route reached successfully on deployed Vercel",
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
}
