import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './_lib/db.js';
import { runCors } from './_lib/cors.js';
import { getAuthenticatedUser } from './_lib/middleware.js';
import { analyzeJobMatch, generateCareerAdvice, generateCoverLetter, rewriteCVContent } from '../src/services/aiService.js';
import { logActivity } from './_lib/utils.js';
import { localDb } from './_lib/localDb.js';

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
      const analysis = await analyzeJobMatch(cv, job);
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
      const { cvId: bodyCvId, jobTitle, companyName, jobDescription } = body;
      const { data: cv } = await supabase.from('cvs').select('*').eq('id', bodyCvId).maybeSingle();
      if (!cv) return res.status(404).json({ success: false, error: "CV not found" });
      const analysis = await analyzeJobMatch(cv, { title: jobTitle, company: companyName, description: jobDescription });
      const generatedJobId = `job-custom-${Date.now()}`;
      const matchResult = {
        id: `match-c-${Date.now()}`,
        cvId: bodyCvId,
        jobId: generatedJobId,
        customJob: {
          id: generatedJobId,
          title: jobTitle,
          company: companyName || "Custom Analysis",
          location: "Remote",
          salary: "Undisclosed",
          type: "Custom",
          description: jobDescription
        },
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
      try {
        const { data, error } = await supabase.from('career_advice').select('*').eq('userId', user.id).order('createdAt', { ascending: false });
        if (error) {
          if (error.message?.includes('Could not find') || error.message?.includes('does not exist')) {
            console.log('[list_career_advice] Table career_advice does not exist, falling back to localDb.');
            const list = localDb.get('career_advice', (item) => item.userId === user.id);
            list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return res.status(200).json({ success: true, data: list });
          }
          throw error;
        }
        return res.status(200).json({ success: true, data: data || [] });
      } catch (err: any) {
        if (err.message?.includes('Could not find') || err.message?.includes('does not exist')) {
          console.log('[list_career_advice] Caught error, falling back to localDb:', err.message);
          const list = localDb.get('career_advice', (item) => item.userId === user.id);
          list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return res.status(200).json({ success: true, data: list });
        }
        throw err;
      }
    }
    if (action === 'generate_career_advice') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { cvId: bodyCvId } = body;
      const { data: cv } = await supabase.from('cvs').select('*').eq('id', bodyCvId).maybeSingle();
      if (!cv) return res.status(404).json({ success: false, error: "CV not found" });
      const advice = await generateCareerAdvice(cv);
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
      
      try {
        const { error: insertError } = await supabase.from('career_advice').insert([adviceResult]);
        if (insertError) {
          if (insertError.message?.includes('Could not find') || insertError.message?.includes('does not exist')) {
            console.log('[generate_career_advice] Table career_advice does not exist, falling back to localDb.');
            localDb.insert('career_advice', adviceResult);
          } else {
            throw insertError;
          }
        }
      } catch (err: any) {
        if (err.message?.includes('Could not find') || err.message?.includes('does not exist')) {
          console.log('[generate_career_advice] Caught error, falling back to localDb:', err.message);
          localDb.insert('career_advice', adviceResult);
        } else {
          throw err;
        }
      }
      return res.status(200).json({ success: true, data: adviceResult });
    }
    if (action === 'get_career_advice') {
      let data: any = null;
      let hasTable = true;
      try {
        let { data: dbData, error } = await supabase.from('career_advice').select('*').eq('cvId', cvId).maybeSingle();
        if (error) {
          if (error.message?.includes('Could not find') || error.message?.includes('does not exist')) {
            hasTable = false;
            data = localDb.getOne('career_advice', (item) => item.cvId === cvId);
          } else {
            throw error;
          }
        } else {
          data = dbData;
        }
      } catch (err: any) {
        if (err.message?.includes('Could not find') || err.message?.includes('does not exist')) {
          hasTable = false;
          data = localDb.getOne('career_advice', (item) => item.cvId === cvId);
        } else {
          throw err;
        }
      }

      if (!data) {
        console.log(`[get_career_advice] Advice not found for cvId: ${cvId}. Generating on the fly.`);
        const { data: cv } = await supabase.from('cvs').select('*').eq('id', cvId).maybeSingle();
        if (!cv) {
          return res.status(404).json({ success: false, error: "CV not found" });
        }
        const advice = await generateCareerAdvice(cv);
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
        
        if (hasTable) {
          try {
            const { error: insertError } = await supabase.from('career_advice').insert([adviceResult]);
            if (insertError) {
              if (insertError.message?.includes('Could not find') || insertError.message?.includes('does not exist')) {
                localDb.insert('career_advice', adviceResult);
              } else {
                console.error('[get_career_advice] Insert error:', insertError);
              }
            }
          } catch (err: any) {
            if (err.message?.includes('Could not find') || err.message?.includes('does not exist')) {
              localDb.insert('career_advice', adviceResult);
            } else {
              console.error('[get_career_advice] Catch insert error:', err);
            }
          }
        } else {
          localDb.insert('career_advice', adviceResult);
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
      if (type === 'interview') {
        const parts = String(id).split('-');
        const cvId = parts.slice(0, -1).join('-');
        const categorySuffix = parts[parts.length - 1];

        // 1. Update CV's parsedDetails if present
        try {
          const { data: cv } = await supabase.from('cvs').select('*').eq('id', cvId).eq('userId', user.id).maybeSingle();
          if (cv) {
            const details = typeof cv.parsedDetails === 'string' ? JSON.parse(cv.parsedDetails) : cv.parsedDetails || {};
            if (categorySuffix === 'hr') delete details.hrQuestions;
            else if (categorySuffix === 'tech') delete details.technicalQuestions;
            else if (categorySuffix === 'behavioral') delete details.behavioralQuestions;
            else if (categorySuffix === 'situational') delete details.situationalQuestions;

            await supabase.from('cvs').update({ parsedDetails: details }).eq('id', cvId).eq('userId', user.id);
          }
        } catch (err) {
          console.error('[delete_history_item] error updating cv details:', err);
        }

        // 2. Delete from interview_questions
        try {
          await supabase.from('interview_questions').delete().eq('cvId', cvId).eq('userId', user.id);
        } catch (err) {
          console.error('[delete_history_item] error deleting from interview_questions:', err);
        }

        // 3. Delete from activities with type="interview_questions"
        try {
          const { data: acts } = await supabase.from('activities').select('id, message').eq('userId', user.id).eq('type', 'interview_questions');
          if (acts && acts.length > 0) {
            for (const act of acts) {
              if (act.message && String(act.message).includes(cvId)) {
                await supabase.from('activities').delete().eq('id', act.id);
              }
            }
          }
        } catch (err) {
          console.error('[delete_history_item] error deleting from activities for interview_questions:', err);
        }

        return res.status(200).json({ success: true });
      }

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

      if (table === 'cvs') {
        // Cascade delete dependents to avoid foreign key violation constraint
        const dependents = [
          'cv_versions',
          'career_advice',
          'interview_questions',
          'matches',
          'job_matches',
          'cover_letters'
        ];
        for (const depTable of dependents) {
          try {
            await supabase.from(depTable).delete().eq('cvId', id);
          } catch (err) {
            console.log(`[delete_history_item] Soft fail on deleting from ${depTable}:`, err);
          }
        }
      }

      await supabase.from(table).delete().eq('id', id).eq('userId', user.id);
      return res.status(200).json({ success: true });
    }

    // CV actions
    if (action === 'rewrite_cv') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { cvId: bodyCvId, prompt, targetJob, type, text } = body;

      if (text !== undefined) {
        // Snippet rewrite mode from Rewrite.tsx!
        const improvedText = await rewriteCVContent({ 
          originalContent: text, 
          prompt: prompt || `Optimize this ${type || 'section'} section for a professional resume/CV, making it highly impactful and ATS-friendly.` 
        });
        return res.status(200).json({ success: true, result: improvedText });
      }

      const { data: existing } = await supabase.from('cvs').select('*').eq('id', bodyCvId).maybeSingle();
      if (!existing) return res.status(404).json({ success: false, error: "CV not found" });
      const rewrittenText = await rewriteCVContent({ originalContent: existing.summary, prompt, targetJob });
      const { data } = await supabase.from('cvs').update({ summary: rewrittenText, updatedAt: new Date().toISOString() }).eq('id', bodyCvId).select();
      return res.status(200).json({ success: true, data: data ? data[0] : null, result: rewrittenText });
    }
    if (action === 'cv_versions') {
      try {
        const { data, error } = await supabase.from('cv_versions').select('*').eq('cvId', cvId).order('versionNumber', { ascending: false });
        if (error) {
          if (error.message?.includes('Could not find') || error.message?.includes('does not exist')) {
            console.log('[cv_versions] Table cv_versions does not exist, falling back to localDb.');
            const list = localDb.get('cv_versions', (item) => item.cvId === cvId);
            list.sort((a: any, b: any) => b.versionNumber - a.versionNumber);
            return res.status(200).json({ success: true, data: list });
          }
          throw error;
        }
        return res.status(200).json({ success: true, data: data || [] });
      } catch (err: any) {
        if (err.message?.includes('Could not find') || err.message?.includes('does not exist')) {
          console.log('[cv_versions] Caught error, falling back to localDb:', err.message);
          const list = localDb.get('cv_versions', (item) => item.cvId === cvId);
          list.sort((a: any, b: any) => b.versionNumber - a.versionNumber);
          return res.status(200).json({ success: true, data: list });
        }
        throw err;
      }
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
    return res.status(500).json({ 
      success: false, 
      error: err?.message || String(err),
      details: err?.details || null,
      stack: err?.stack || null
    });
  }
}
