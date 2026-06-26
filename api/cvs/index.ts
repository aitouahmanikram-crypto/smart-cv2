import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../_lib/db';
import { runCors } from '../_lib/cors';
import { getAuthenticatedUser } from '../_lib/middleware';

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
            route: '/api/cvs/index', 
            allowedMethods: ['GET'] 
        });
    }

    try {
        const supabase = getSupabase();
        if (!supabase) return res.status(500).json({ success: false, error: "Supabase configuration missing" });

        const user = await getAuthenticatedUser(req, res);
        if (!user) return;

        const { data: cvs, error } = await supabase
            .from('cvs')
            .select('*')
            .eq('userId', user.id)
            .order('updatedAt', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ success: true, data: cvs || [] });
    } catch (err: any) {
        console.error('[CVS Index Error]:', err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
