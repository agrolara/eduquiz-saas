-- SQL Script to update rankings RLS policy
-- This allows the student grading (the "drawer") to update other students' scores.

DROP POLICY IF EXISTS "Allow user and admins to update rankings" ON public.rankings;

CREATE POLICY "Allow user and admins to update rankings" 
ON public.rankings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.curso_id = rankings.curso_id
  )
);
