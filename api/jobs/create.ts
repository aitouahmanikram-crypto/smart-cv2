import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/db';
import { runCors } from '../_lib/cors';
import { getAuthenticatedUser } from '../_lib/middleware';

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
      route: '/api/jobs/create', 
      allowedMethods: ['POST'] 
    });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Supabase configuration missing" });

    // Only admins or specific users can create jobs (check logic)
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

    const { title, company, location, category, type, salary, description, requirements } = body || {};

    if (!title || !company) {
      return res.status(400).json({ success: false, error: "Title and company are required" });
    }

    const jobData = {
      id: `job-${Date.now()}`,
      title,
      company,
      location: location || "Remote",
      category: category || "Other",
      type: type || "Full-Time",
      salary: salary || "Not specified",
      description: description || "",
      requirements: requirements || [],
      postedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .maybeSingle();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    console.error('[Job Create Error]:', err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
