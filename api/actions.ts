import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './_lib/db.js';
import { runCors } from './_lib/cors.js';
import { getAuthenticatedUser } from './_lib/middleware.js';
import { analyzeJobMatch, generateCareerAdvice, generateCoverLetter, rewriteCVContent } from '../src/services/aiService.js';
import { logActivity } from './_lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ success: true });
  }

  if (!runCors(req, res)) return;

  const { action, type, id, cvId, versionId } = req.query;

  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ success: false, error: "Supabase configuration missing" });

    // Matches
    if (action === 'list_matches') {
      const { data: userCvs, error: cvsError } = await supabase.from('cvs').select('id').eq('userId', user.id);
      if (cvsError) throw cvsError;
      if (!userCvs || userCvs.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }
      const cvIds = userCvs.map((cv: any) => cv.id);
      const { data, error } = await supabase.from('matches').select('*').in('cvId', cvIds);
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }
    if (action === 'analyze_match') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { cvId: bodyCvId, jobId } = body;
      const { data: cv } = await supabase.from('cvs').select('*').eq('id', bodyCvId).maybeSingle();
      const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
      if (!cv || !job) return res.status(404).json({ success: false, error: "CV or Job not found" });
      const analysis = await analyzeJobMatch(cv.summary, job.description);
      const matchResult = {
        id: `match-${Date.now()}`,
        cvId: bodyCvId,
        jobId,
        matchScore: analysis.matchScore,
        fitSummary: analysis.fitSummary,
        strengths: analysis.strengths || [],
        gaps: analysis.gaps || [],
        applicationStrategy: analysis.applicationStrategy,
        createdAt: new Date().toISOString()
      };
      await supabase.from('matches').insert([matchResult]);
      return res.status(200).json({ success: true, data: matchResult });
    }
    if (action === 'custom_match') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { cvId: bodyCvId, jobTitle, jobDescription } = body;
      const { data: cv } = await supabase.from('cvs').select('*').eq('id', bodyCvId).maybeSingle();
      if (!cv) return res.status(404).json({ success: false, error: "CV not found" });
      const analysis = await analyzeJobMatch(cv.summary, jobDescription);
      const matchResult = {
        id: `match-c-${Date.now()}`,
        cvId: bodyCvId,
        jobId: 'custom',
        customJob: { title: jobTitle },
        matchScore: analysis.matchScore,
        fitSummary: analysis.fitSummary,
        strengths: analysis.strengths || [],
        gaps: analysis.gaps || [],
        applicationStrategy: analysis.applicationStrategy,
        createdAt: new Date().toISOString()
      };
      await supabase.from('matches').insert([matchResult]);
      return res.status(200).json({ success: true, data: matchResult });
    }
    if (action === 'saved_matches') {
      const { data: savedActivities } = await supabase.from('activities').select('*').eq('userId', user.id).eq('type', 'saved_job');
      if (!savedActivities || savedActivities.length === 0) return res.status(200).json({ success: true, data: [] });
      const matchIds = savedActivities.map((act: any) => act.message);
      const { data: matches } = await supabase.from('matches').select('*').in('id', matchIds);
      return res.status(200).json({ success: true, data: matches || [] });
    }
    if (action === 'toggle_save_match') {
      if (req.method === 'POST') {
        await supabase.from('activities').insert([{ id: `save-${Date.now()}`, userId: user.id, tenantId: user.tenantId, type: 'saved_job', message: id, timestamp: new Date().toISOString() }]);
        return res.status(200).json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('activities').delete().eq('type', 'saved_job').eq('message', id).eq('userId', user.id);
        return res.status(200).json({ success: true });
      }
    }

    // Career Advice
    if (action === 'list_career_advice') {
      const { data, error } = await supabase.from('career_advice').select('*').eq('userId', user.id).order('createdAt', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }
    if (action === 'generate_career_advice') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { cvId: bodyCvId } = body;
      const { data: cv } = await supabase.from('cvs').select('*').eq('id', bodyCvId).maybeSingle();
      if (!cv) return res.status(404).json({ success: false, error: "CV not found" });
      const advice = await generateCareerAdvice(cv.summary);
      const adviceResult = {
        id: `advice-${Date.now()}`,
        userId: user.id,
        cvId: bodyCvId,
        career_paths: advice.careerPaths || [],
        salary_estimation: advice.salaryEstimation || {},
        skills_gap: advice.skillsGap || {},
        roadmap: advice.roadmap || {},
        createdAt: new Date().toISOString()
      };
      await supabase.from('career_advice').insert([adviceResult]);
      return res.status(200).json({ success: true, data: adviceResult });
    }
    if (action === 'get_career_advice') {
      let { data, error } = await supabase.from('career_advice').select('*').eq('cvId', cvId).maybeSingle();
      if (error) throw error;

      if (!data) {
        console.log(`[get_career_advice] Advice not found for cvId: ${cvId}. Generating on the fly.`);
        const { data: cv } = await supabase.from('cvs').select('*').eq('id', cvId).maybeSingle();
        if (!cv) {
          return res.status(404).json({ success: false, error: "CV not found" });
        }
        const advice = await generateCareerAdvice(cv.summary);
        const adviceResult = {
          id: `advice-${Date.now()}`,
          userId: user.id,
          cvId: String(cvId),
          career_paths: advice.careerPaths || [],
          salary_estimation: advice.salaryEstimation || {},
          skills_gap: advice.skillsGap || {},
          roadmap: advice.roadmap || {},
          createdAt: new Date().toISOString()
        };
        const { error: insertError } = await supabase.from('career_advice').insert([adviceResult]);
        if (insertError) {
          console.error('[get_career_advice] Insert error:', insertError);
        }
        data = adviceResult;
      }
      return res.status(200).json({ success: true, data });
    }

    // Cover Letters
    if (action === 'list_cover_letters') {
      const { data, error } = await supabase.from('cover_letters').select('*').eq('userId', user.id).order('createdAt', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }
    if (action === 'generate_cover_letter') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { cvId: bodyCvId, jobTitle, jobDescription, companyName, experienceLevel, skills, recipientName } = body;
      const { data: cv } = await supabase.from('cvs').select('*').eq('id', bodyCvId).maybeSingle();
      if (!cv) return res.status(404).json({ success: false, error: "CV not found" });
      const letter = await generateCoverLetter({
        parsedCvText: cv.summary,
        jobTitle,
        jobDescription,
        companyName: companyName || "the company",
        experienceLevel,
        skills,
        recipientName
      });
      const letterResult = { id: `letter-${Date.now()}`, userId: user.id, cvId: bodyCvId, jobTitle, content: letter, createdAt: new Date().toISOString() };
      await supabase.from('cover_letters').insert([letterResult]);
      return res.status(200).json({ success: true, data: letterResult });
    }

    // History
    if (action === 'list_history') {
      const [{ data: cvs }, { data: letters }] = await Promise.all([
        supabase.from('cvs').select('*').eq('userId', user.id).order('updatedAt', { ascending: false }),
        supabase.from('cover_letters').select('*').eq('userId', user.id).order('createdAt', { ascending: false })
      ]);

      let matches: any[] = [];
      if (cvs && cvs.length > 0) {
        const cvIds = cvs.map((cv: any) => cv.id);
        const { data: matchesData } = await supabase
          .from('matches')
          .select('*')
          .in('cvId', cvIds)
          .order('createdAt', { ascending: false });
        matches = matchesData || [];
      }

      const interviewQuestions: any[] = [];
      if (cvs && Array.isArray(cvs)) {
        cvs.forEach((cv: any) => {
          const details = typeof cv.parsedDetails === 'string' ? JSON.parse(cv.parsedDetails) : cv.parsedDetails || {};
          if (details.hrQuestions && details.hrQuestions.length > 0) {
            interviewQuestions.push({
              id: `${cv.id}-hr`,
              category: 'HR / General',
              questions: details.hrQuestions,
              createdAt: cv.updatedAt
            });
          }
          if (details.technicalQuestions && details.technicalQuestions.length > 0) {
            interviewQuestions.push({
              id: `${cv.id}-tech`,
              category: 'Technical',
              questions: details.technicalQuestions,
              createdAt: cv.updatedAt
            });
          }
          if (details.behavioralQuestions && details.behavioralQuestions.length > 0) {
            interviewQuestions.push({
              id: `${cv.id}-behavioral`,
              category: 'Behavioral',
              questions: details.behavioralQuestions,
              createdAt: cv.updatedAt
            });
          }
          if (details.situationalQuestions && details.situationalQuestions.length > 0) {
            interviewQuestions.push({
              id: `${cv.id}-situational`,
              category: 'Situational',
              questions: details.situationalQuestions,
              createdAt: cv.updatedAt
            });
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          analyses: cvs || [],
          coverLetters: letters || [],
          matches: matches || [],
          interviewQuestions
        }
      });
    }
    if (action === 'delete_history_item') {
      const tableMap: any = { 
        analysis: 'cvs', 
        analyses: 'cvs', 
        cvs: 'cvs', 
        coverLetter: 'cover_letters', 
        letters: 'cover_letters', 
        coverLetters: 'cover_letters', 
        match: 'matches', 
        matches: 'matches' 
      };
      const table = tableMap[String(type)];
      if (!table) return res.status(400).json({ success: false, error: "Invalid type for deletion" });
      await supabase.from(table).delete().eq('id', id).eq('userId', user.id);
      return res.status(200).json({ success: true });
    }

    // CV actions
    if (action === 'rewrite_cv') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { cvId: bodyCvId, prompt, targetJob } = body;
      const { data: existing } = await supabase.from('cvs').select('*').eq('id', bodyCvId).maybeSingle();
      if (!existing) return res.status(404).json({ success: false, error: "CV not found" });
      const rewrittenText = await rewriteCVContent({ originalContent: existing.summary, prompt, targetJob });
      const { data } = await supabase.from('cvs').update({ summary: rewrittenText, updatedAt: new Date().toISOString() }).eq('id', bodyCvId).select();
      return res.status(200).json({ success: true, data: data ? data[0] : null });
    }
    if (action === 'cv_versions') {
      const { data } = await supabase.from('cv_versions').select('*').eq('cvId', cvId).order('versionNumber', { ascending: false });
      return res.status(200).json({ success: true, data: data || [] });
    }
    if (action === 'restore_cv_version') {
      return res.status(200).json({ success: true, message: "Version restored" });
    }

    // Settings
    if (action === 'get_settings') {
      return res.status(200).json({ success: true, data: { language: "en" } });
    }
    if (action === 'update_settings') {
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, error: "Invalid action", action });
  } catch (err: any) {
    console.error('[Actions Error]:', err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
