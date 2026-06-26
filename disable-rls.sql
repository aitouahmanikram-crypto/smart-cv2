-- Run these commands in the Supabase SQL Editor to disable Row-Level Security (RLS) entirely
-- This will allow your backend (using the anon key) to read, insert, update, and delete data without restriction.

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cvs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches DISABLE ROW LEVEL SECURITY;

-- If you still encounter permission issues, you can explicitly grant access to the anon and authenticated roles:
GRANT ALL ON TABLE users TO anon, authenticated;
GRANT ALL ON TABLE cvs TO anon, authenticated;
GRANT ALL ON TABLE cover_letters TO anon, authenticated;
GRANT ALL ON TABLE jobs TO anon, authenticated;
GRANT ALL ON TABLE matches TO anon, authenticated;
GRANT ALL ON TABLE activities TO anon, authenticated;
GRANT ALL ON TABLE analyses TO anon, authenticated;
GRANT ALL ON TABLE job_matches TO anon, authenticated;
