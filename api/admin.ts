import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './_lib/db';
import { runCors } from './_lib/cors';
import { getAuthenticatedAdmin } from './_lib/middleware';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ success: true });
  }

  if (!runCors(req, res)) return;

  const { action } = req.query;

  try {
    const admin = await getAuthenticatedAdmin(req, res);
    if (!admin) return;

    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Supabase environment variables are missing" });

    if (action === 'stats') {
      if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed', method: req.method, route: '/api/admin', action, allowedMethods: ['GET'] });
      const [
        { count: totalUsers }, { count: totalCvs }, { count: totalLetters },
        { count: totalMatches }, { count: totalInterviewsActs }, { count: totalJobs }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('cvs').select('*', { count: 'exact', head: true }),
        supabase.from('cover_letters').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('activities').select('*', { count: 'exact', head: true }).eq('type', 'interview_questions'),
        supabase.from('jobs').select('*', { count: 'exact', head: true })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalUsers: totalUsers || 0, totalCvs: totalCvs || 0, totalCoverLetters: totalLetters || 0,
            totalJobOffers: totalJobs || 0, totalMatches: totalMatches || 0,
            totalInterviews: totalInterviewsActs || 0, averageScore: 74
          },
          charts: {
            newUsers: [{ month: 'Jun', count: totalUsers || 0 }],
            atsDistribution: [{ range: '61-80', count: 45 }],
            mostUsedFeatures: [
              { feature: 'CV Analysis', count: totalCvs || 0 },
              { feature: 'Job Match', count: totalMatches || 0 },
              { feature: 'Cover Letter', count: totalLetters || 0 }
            ]
          }
        }
      });
    }

    if (action === 'jobs') {
      const { id } = req.query;
      if (req.method === 'GET') {
        const { q } = req.query;
        const { data: jobs, error } = await supabase.from('jobs').select('*').order('postedAt', { ascending: false });
        if (error) throw error;
        let filtered = jobs || [];
        if (q) {
          const searchLower = String(q).toLowerCase();
          filtered = filtered.filter((j: any) =>
            (j.title && j.title.toLowerCase().includes(searchLower)) ||
            (j.company && j.company.toLowerCase().includes(searchLower))
          );
        }
        return res.status(200).json({ success: true, data: filtered });
      }
      if (req.method === 'POST') {
        const { title, company, location, category, type, description, requirements, salary } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        if (!title || !company || !description) return res.status(400).json({ success: false, error: "Title, company, and description are required fields" });
        const newJob = {
          id: `job-${Date.now()}`, title, company, location: location || "", category: category || "Other", type: type || "Full-Time",
          description, requirements: Array.isArray(requirements) ? requirements : [], salary: salary || "", postedAt: new Date().toISOString()
        };
        const { error } = await supabase.from('jobs').insert([newJob]);
        if (error) throw error;
        return res.status(201).json({ success: true, data: newJob });
      }
      if (req.method === 'PUT' && id) {
        const updates = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { error } = await supabase.from('jobs').update(updates).eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }
      if (req.method === 'DELETE' && id) {
        const { error } = await supabase.from('jobs').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ success: false, error: 'Method not allowed', method: req.method, route: '/api/admin', action, allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'] });
    }

    if (action === 'users') {
      const { id } = req.query;
      if (req.method === 'GET') {
        const { data: users, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return res.status(200).json({ success: true, data: users || [] });
      }
      if (req.method === 'PUT' && id) {
        const updates = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { error } = await supabase.from('users').update(updates).eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }
      if (req.method === 'DELETE' && id) {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ success: false, error: 'Method not allowed', method: req.method, route: '/api/admin', action, allowedMethods: ['GET', 'PUT', 'DELETE'] });
    }

    if (action === 'reset-password') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed', method: req.method, route: '/api/admin', action, allowedMethods: ['POST'] });
      const { id } = req.query;
      const { password } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (!id || !password) return res.status(400).json({ success: false, error: "id and password are required" });
      const { error } = await supabase.from('users').update({ passwordHash: bcrypt.hashSync(password, 10) }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (action === 'settings') {
      const settingsPath = './system_settings.json';
      if (req.method === 'GET') {
        if (!fs.existsSync(settingsPath)) return res.status(200).json({ success: true, data: { appName: "SmartCV AI", logo: "Zap", maintenanceMode: false } });
        const data = fs.readFileSync(settingsPath, 'utf8');
        return res.status(200).json({ success: true, data: JSON.parse(data) });
      }
      if (req.method === 'PUT' || req.method === 'POST') {
        const settings = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return res.status(200).json({ success: true, data: settings });
      }
      return res.status(405).json({ success: false, error: 'Method not allowed', method: req.method, route: '/api/admin', action, allowedMethods: ['GET', 'PUT', 'POST'] });
    }

    if (action === 'seed') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed', method: req.method, route: '/api/admin', action, allowedMethods: ['POST'] });
      const demoJobs = [
        { id: `job-demo-1`, title: "Senior Full Stack Engineer", company: "TechFlow Systems", location: "San Francisco, CA", category: "Software Engineering", type: "Full-Time", salary: "$150k - $200k", description: "Demo job description", requirements: ["React", "Node.js"], postedAt: new Date().toISOString() }
      ];
      const { error } = await supabase.from('jobs').upsert(demoJobs);
      if (error) throw error;
      return res.status(200).json({ success: true, message: "Demo data seeded successfully." });
    }

    return res.status(400).json({ success: false, error: "Invalid action" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
