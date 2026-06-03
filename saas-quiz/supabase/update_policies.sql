-- SQL Script to update RLS Policies and remove auth.email() dependencies

-- 1. Whitelist Alumnos Policies
DROP POLICY IF EXISTS "Course Admin / Super Admin can see Whitelist" ON public.whitelist_alumnos;
CREATE POLICY "Course Admin / Super Admin can see Whitelist" 
ON public.whitelist_alumnos FOR SELECT USING (
  public.es_super_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = whitelist_alumnos.curso_id
  )
);

DROP POLICY IF EXISTS "Course Admin / Super Admin can edit Whitelist" ON public.whitelist_alumnos;
CREATE POLICY "Course Admin / Super Admin can edit Whitelist" 
ON public.whitelist_alumnos FOR ALL USING (
  public.es_super_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = whitelist_alumnos.curso_id
  )
);

-- 2. Sesiones Juego Policies
DROP POLICY IF EXISTS "Allow members and admins to view Sessions" ON public.sesiones_juego;
CREATE POLICY "Allow members and admins to view Sessions" 
ON public.sesiones_juego FOR SELECT USING (
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.curso_id = sesiones_juego.curso_id
  )
);

DROP POLICY IF EXISTS "Allow Course Admin and Super Admin to create Sessions" ON public.sesiones_juego;
CREATE POLICY "Allow Course Admin and Super Admin to create Sessions" 
ON public.sesiones_juego FOR INSERT WITH CHECK (
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = curso_id
  )
);

DROP POLICY IF EXISTS "Allow members and admins to update Sessions" ON public.sesiones_juego;
CREATE POLICY "Allow members and admins to update Sessions" 
ON public.sesiones_juego FOR UPDATE USING (
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.curso_id = sesiones_juego.curso_id
  )
);

-- 3. Preguntas Policies
DROP POLICY IF EXISTS "Allow current drawer and admins to insert Questions" ON public.preguntas;
CREATE POLICY "Allow current drawer and admins to insert Questions" 
ON public.preguntas FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sesiones_juego s
    WHERE s.id = sesion_id AND (
      s.turno_actual_usuario_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.perfiles_usuarios p
        WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = s.curso_id
      ) OR
      public.es_super_admin(auth.uid())
    )
  )
);

-- 4. Respuestas Policies
DROP POLICY IF EXISTS "Allow drawer and answerer to update Answers" ON public.respuestas;
CREATE POLICY "Allow drawer and answerer to update Answers" 
ON public.respuestas FOR UPDATE USING (
  alumno_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.preguntas pq
    WHERE pq.id = pregunta_id AND pq.creador_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.preguntas pq
    JOIN public.sesiones_juego s ON s.id = pq.sesion_id
    JOIN public.perfiles_usuarios p ON p.id = auth.uid()
    WHERE pq.id = pregunta_id AND (
      (p.rol = 'admin_curso' AND p.curso_id = s.curso_id) OR 
      p.rol = 'super_admin'
    )
  )
);

-- 5. Rankings Policies
DROP POLICY IF EXISTS "Allow user and admins to update rankings" ON public.rankings;
CREATE POLICY "Allow user and admins to update rankings" 
ON public.rankings FOR ALL USING (
  auth.uid() = usuario_id OR
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = rankings.curso_id
  )
);
