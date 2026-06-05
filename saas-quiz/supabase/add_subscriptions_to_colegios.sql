-- Migration: Add SaaS subscription management columns to colegios table
-- Run this migration in the Supabase SQL Editor

-- 1. Add plan type column
ALTER TABLE public.colegios 
ADD COLUMN IF NOT EXISTS plan_tipo TEXT DEFAULT 'trial' 
CHECK (plan_tipo IN ('trial', 'gratuito', 'activo', 'suspendido', 'cancelado'));

-- 2. Add monthly fee column (in CLP or local currency, integer for simplicity)
ALTER TABLE public.colegios 
ADD COLUMN IF NOT EXISTS plan_valor_mensual INTEGER DEFAULT 0;

-- 3. Add plan start date
ALTER TABLE public.colegios 
ADD COLUMN IF NOT EXISTS plan_fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Add plan expiration date (NULL = no expiration, e.g. for 'gratuito' or indefinite 'activo')
ALTER TABLE public.colegios 
ADD COLUMN IF NOT EXISTS plan_fecha_vencimiento TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 5. Add internal notes field for the super admin
ALTER TABLE public.colegios 
ADD COLUMN IF NOT EXISTS plan_notas TEXT DEFAULT NULL;

-- 6. Set all existing schools to 'trial' with a 30-day trial starting now
UPDATE public.colegios
SET 
  plan_tipo = 'trial',
  plan_valor_mensual = 0,
  plan_fecha_inicio = NOW(),
  plan_fecha_vencimiento = NOW() + INTERVAL '30 days'
WHERE plan_tipo IS NULL OR plan_tipo = 'trial';
