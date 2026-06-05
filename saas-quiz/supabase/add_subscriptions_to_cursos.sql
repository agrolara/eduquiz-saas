-- Migration: Move subscription columns from colegios to cursos
-- The SaaS billing model is PER COURSE, not per school.
-- Run this migration in the Supabase SQL Editor.

-- 1. Add plan type column to cursos
ALTER TABLE public.cursos 
ADD COLUMN IF NOT EXISTS plan_tipo TEXT DEFAULT 'trial' 
CHECK (plan_tipo IN ('trial', 'gratuito', 'activo', 'suspendido', 'cancelado'));

-- 2. Add monthly fee column (in CLP or local currency)
ALTER TABLE public.cursos 
ADD COLUMN IF NOT EXISTS plan_valor_mensual INTEGER DEFAULT 0;

-- 3. Add plan start date
ALTER TABLE public.cursos 
ADD COLUMN IF NOT EXISTS plan_fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Add plan expiration date (NULL = no expiration)
ALTER TABLE public.cursos 
ADD COLUMN IF NOT EXISTS plan_fecha_vencimiento TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 5. Add internal notes field
ALTER TABLE public.cursos 
ADD COLUMN IF NOT EXISTS plan_notas TEXT DEFAULT NULL;

-- 6. Set all existing courses to 'trial' with a 30-day trial starting now
UPDATE public.cursos
SET 
  plan_tipo = 'trial',
  plan_valor_mensual = 0,
  plan_fecha_inicio = NOW(),
  plan_fecha_vencimiento = NOW() + INTERVAL '30 days'
WHERE plan_tipo IS NULL OR plan_tipo = 'trial';

-- 7. (Optional) Remove subscription columns from colegios if they were added previously
-- Uncomment these lines if you already ran the previous migration:
-- ALTER TABLE public.colegios DROP COLUMN IF EXISTS plan_tipo;
-- ALTER TABLE public.colegios DROP COLUMN IF EXISTS plan_valor_mensual;
-- ALTER TABLE public.colegios DROP COLUMN IF EXISTS plan_fecha_inicio;
-- ALTER TABLE public.colegios DROP COLUMN IF EXISTS plan_fecha_vencimiento;
-- ALTER TABLE public.colegios DROP COLUMN IF EXISTS plan_notas;
