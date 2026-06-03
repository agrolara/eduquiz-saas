-- Migration to add participation statistics to the rankings table

-- 1. Add column to track count of played sessions
ALTER TABLE public.rankings ADD COLUMN IF NOT EXISTS sesiones_jugadas INTEGER DEFAULT 0 NOT NULL;

-- 2. Add column to track details of each game played (session_id, session_name, points, date)
ALTER TABLE public.rankings ADD COLUMN IF NOT EXISTS historial_participacion JSONB DEFAULT '[]'::jsonb NOT NULL;

-- 3. Update existing policies if necessary to make sure the rankings update works
-- (The existing policies already grant write access for course members to write scores)
