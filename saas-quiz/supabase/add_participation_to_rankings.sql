-- Migration to add participation statistics and enable session deletions

-- 1. Add columns to track count of played sessions and detailed participation history
ALTER TABLE public.rankings ADD COLUMN IF NOT EXISTS sesiones_jugadas INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.rankings ADD COLUMN IF NOT EXISTS historial_participacion JSONB DEFAULT '[]'::jsonb NOT NULL;

-- 2. Add DELETE policy for game sessions to allow Course Admins and Super Admins to delete sessions
DROP POLICY IF EXISTS "Allow Course Admin and Super Admin to delete Sessions" ON public.sesiones_juego;

CREATE POLICY "Allow Course Admin and Super Admin to delete Sessions" 
ON public.sesiones_juego FOR DELETE USING (
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = sesiones_juego.curso_id
  )
);

-- 3. One-time script to recover and populate historical rankings from existing answers
WITH session_scores AS (
  SELECT 
    s.curso_id,
    r.alumno_id AS usuario_id,
    s.id AS sesion_id,
    s.nombre AS sesion_nombre,
    COALESCE(s.finalizado_en, r.creado_en)::date::text AS fecha,
    SUM(COALESCE(r.calificacion, 0)) AS puntaje_obtenido
  FROM public.respuestas r
  JOIN public.preguntas p ON p.id = r.pregunta_id
  JOIN public.sesiones_juego s ON s.id = p.sesion_id
  GROUP BY s.curso_id, r.alumno_id, s.id, s.nombre, COALESCE(s.finalizado_en, r.creado_en)
),
user_history AS (
  SELECT 
    curso_id,
    usuario_id,
    COUNT(*) AS total_sesiones,
    jsonb_agg(
      jsonb_build_object(
        'sesion_id', sesion_id,
        'sesion_nombre', sesion_nombre,
        'fecha', fecha,
        'puntaje_obtenido', puntaje_obtenido
      )
    ) AS historial
  FROM session_scores
  GROUP BY curso_id, usuario_id
)
UPDATE public.rankings r
SET 
  sesiones_jugadas = h.total_sesiones,
  historial_participacion = h.historial
FROM user_history h
WHERE r.curso_id = h.curso_id AND r.usuario_id = h.usuario_id;
