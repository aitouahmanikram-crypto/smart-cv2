-- ==========================================
-- SmartCV AI Row-Level Security (RLS) Migration
-- Script to enable and configure correct RLS policies on all requested tables.
-- ==========================================

-- Add language column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr';

-- 1. Create missing tables if they do not exist
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_matches (
  id TEXT PRIMARY KEY,
  "cvId" TEXT,
  "userId" TEXT,
  "matchScore" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_questions (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "cvId" TEXT NOT NULL,
  category TEXT NOT NULL,
  questions JSONB NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_advice (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "cvId" TEXT NOT NULL,
  career_paths JSONB NOT NULL,
  salary_estimation JSONB NOT NULL,
  skills_gap JSONB NOT NULL,
  roadmap JSONB NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Explicitly enable RLS on all audited tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_advice ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 3. Grant table permissions
GRANT ALL ON TABLE users TO anon, authenticated;
GRANT ALL ON TABLE cvs TO anon, authenticated;
GRANT ALL ON TABLE analyses TO anon, authenticated;
GRANT ALL ON TABLE cover_letters TO anon, authenticated;
GRANT ALL ON TABLE job_matches TO anon, authenticated;
GRANT ALL ON TABLE interview_questions TO anon, authenticated;
GRANT ALL ON TABLE career_advice TO anon, authenticated;
GRANT ALL ON TABLE matches TO anon, authenticated;
GRANT ALL ON TABLE activities TO anon, authenticated;
GRANT ALL ON TABLE jobs TO anon, authenticated;

-- 4. Clean up any existing conflicting policies
DROP POLICY IF EXISTS "Users SELECT policy" ON users;
DROP POLICY IF EXISTS "Users INSERT policy" ON users;
DROP POLICY IF EXISTS "Users UPDATE policy" ON users;
DROP POLICY IF EXISTS "Users DELETE policy" ON users;

DROP POLICY IF EXISTS "Cvs SELECT policy" ON cvs;
DROP POLICY IF EXISTS "Cvs INSERT policy" ON cvs;
DROP POLICY IF EXISTS "Cvs UPDATE policy" ON cvs;
DROP POLICY IF EXISTS "Cvs DELETE policy" ON cvs;

DROP POLICY IF EXISTS "Analyses SELECT policy" ON analyses;
DROP POLICY IF EXISTS "Analyses INSERT policy" ON analyses;
DROP POLICY IF EXISTS "Analyses UPDATE policy" ON analyses;
DROP POLICY IF EXISTS "Analyses DELETE policy" ON analyses;

DROP POLICY IF EXISTS "Cover letters SELECT policy" ON cover_letters;
DROP POLICY IF EXISTS "Cover letters INSERT policy" ON cover_letters;
DROP POLICY IF EXISTS "Cover letters UPDATE policy" ON cover_letters;
DROP POLICY IF EXISTS "Cover letters DELETE policy" ON cover_letters;

DROP POLICY IF EXISTS "Job matches SELECT policy" ON job_matches;
DROP POLICY IF EXISTS "Job matches INSERT policy" ON job_matches;
DROP POLICY IF EXISTS "Job matches UPDATE policy" ON job_matches;
DROP POLICY IF EXISTS "Job matches DELETE policy" ON job_matches;

DROP POLICY IF EXISTS "Interview questions SELECT policy" ON interview_questions;
DROP POLICY IF EXISTS "Interview questions INSERT policy" ON interview_questions;
DROP POLICY IF EXISTS "Interview questions UPDATE policy" ON interview_questions;
DROP POLICY IF EXISTS "Interview questions DELETE policy" ON interview_questions;

DROP POLICY IF EXISTS "Career advice SELECT policy" ON career_advice;
DROP POLICY IF EXISTS "Career advice INSERT policy" ON career_advice;
DROP POLICY IF EXISTS "Career advice UPDATE policy" ON career_advice;
DROP POLICY IF EXISTS "Career advice DELETE policy" ON career_advice;

DROP POLICY IF EXISTS "Matches SELECT policy" ON matches;
DROP POLICY IF EXISTS "Matches INSERT policy" ON matches;
DROP POLICY IF EXISTS "Matches UPDATE policy" ON matches;
DROP POLICY IF EXISTS "Matches DELETE policy" ON matches;

DROP POLICY IF EXISTS "Activities SELECT policy" ON activities;
DROP POLICY IF EXISTS "Activities INSERT policy" ON activities;
DROP POLICY IF EXISTS "Activities UPDATE policy" ON activities;
DROP POLICY IF EXISTS "Activities DELETE policy" ON activities;

DROP POLICY IF EXISTS "Jobs SELECT policy" ON jobs;
DROP POLICY IF EXISTS "Jobs INSERT/UPDATE/DELETE policy" ON jobs;

-- 5. Establish correct RLS policies matching application security requirements

-- --- users table policies ---
CREATE POLICY "Users SELECT policy" ON users FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND id = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Users INSERT policy" ON users FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND id = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Users UPDATE policy" ON users FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND id = auth.uid()::text) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND id = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Users DELETE policy" ON users FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND id = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- cvs table policies ---
CREATE POLICY "Cvs SELECT policy" ON cvs FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Cvs INSERT policy" ON cvs FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Cvs UPDATE policy" ON cvs FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Cvs DELETE policy" ON cvs FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- analyses table policies ---
CREATE POLICY "Analyses SELECT policy" ON analyses FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Analyses INSERT policy" ON analyses FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Analyses UPDATE policy" ON analyses FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Analyses DELETE policy" ON analyses FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- cover_letters table policies ---
CREATE POLICY "Cover letters SELECT policy" ON cover_letters FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Cover letters INSERT policy" ON cover_letters FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Cover letters UPDATE policy" ON cover_letters FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Cover letters DELETE policy" ON cover_letters FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- job_matches table policies ---
CREATE POLICY "Job matches SELECT policy" ON job_matches FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Job matches INSERT policy" ON job_matches FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Job matches UPDATE policy" ON job_matches FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Job matches DELETE policy" ON job_matches FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- interview_questions table policies ---
CREATE POLICY "Interview questions SELECT policy" ON interview_questions FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Interview questions INSERT policy" ON interview_questions FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Interview questions UPDATE policy" ON interview_questions FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Interview questions DELETE policy" ON interview_questions FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- career_advice table policies ---
CREATE POLICY "Career advice SELECT policy" ON career_advice FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Career advice INSERT policy" ON career_advice FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Career advice UPDATE policy" ON career_advice FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Career advice DELETE policy" ON career_advice FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- matches (real database table) policies ---
CREATE POLICY "Matches SELECT policy" ON matches FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "cvId" IN (SELECT id FROM cvs WHERE "userId" = auth.uid()::text)) OR (auth.role() = 'anon') );

CREATE POLICY "Matches INSERT policy" ON matches FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "cvId" IN (SELECT id FROM cvs WHERE "userId" = auth.uid()::text)) OR (auth.role() = 'anon') );

CREATE POLICY "Matches UPDATE policy" ON matches FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND "cvId" IN (SELECT id FROM cvs WHERE "userId" = auth.uid()::text)) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND "cvId" IN (SELECT id FROM cvs WHERE "userId" = auth.uid()::text)) OR (auth.role() = 'anon') );

CREATE POLICY "Matches DELETE policy" ON matches FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND "cvId" IN (SELECT id FROM cvs WHERE "userId" = auth.uid()::text)) OR (auth.role() = 'anon') );

-- --- activities table policies ---
CREATE POLICY "Activities SELECT policy" ON activities FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Activities INSERT policy" ON activities FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Activities UPDATE policy" ON activities FOR UPDATE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') )
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "Activities DELETE policy" ON activities FOR DELETE TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- cv_versions table ---
CREATE TABLE IF NOT EXISTS cv_versions (
  id TEXT PRIMARY KEY,
  "cvId" TEXT NOT NULL REFERENCES cvs(id),
  "userId" TEXT NOT NULL REFERENCES users(id),
  "versionNumber" INTEGER NOT NULL,
  "cvContent" JSONB NOT NULL,
  "atsScore" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE cv_versions TO anon, authenticated;

-- Policies for cv_versions
CREATE POLICY "CV versions SELECT policy" ON cv_versions FOR SELECT TO public
  USING ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

CREATE POLICY "CV versions INSERT policy" ON cv_versions FOR INSERT TO public
  WITH CHECK ( (auth.role() = 'authenticated' AND "userId" = auth.uid()::text) OR (auth.role() = 'anon') );

-- --- jobs table policies ---
CREATE POLICY "Jobs SELECT policy" ON jobs FOR SELECT TO public USING (true);
CREATE POLICY "Jobs INSERT/UPDATE/DELETE policy" ON jobs FOR ALL TO public
  USING ( (auth.role() = 'authenticated') OR (auth.role() = 'anon') );
