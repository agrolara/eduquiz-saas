-- Supabase Database Schema for EdTech Realtime Quiz SaaS

-- 1. COLEGIOS (Schools)
CREATE TABLE public.colegios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CURSOS (Courses)
CREATE TABLE public.cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID REFERENCES public.colegios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    admin_email TEXT, -- Gmail of the Course Admin (Apoderado)
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(colegio_id, nombre)
);

-- 3. PERFILES USUARIOS (Profiles mapped to Auth Users)
CREATE TABLE public.perfiles_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT CHECK (rol IN ('super_admin', 'admin_curso', 'jugador')) NOT NULL DEFAULT 'jugador',
    curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. WHITELIST ALUMNOS (Allowed Students Whitelist)
CREATE TABLE public.whitelist_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(curso_id, email)
);

-- 5. SESIONES JUEGO (Game Sessions)
CREATE TABLE public.sesiones_juego (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    estado TEXT CHECK (estado IN ('esperando', 'preparacion', 'pregunta', 'respuesta', 'evaluacion', 'finalizado')) NOT NULL DEFAULT 'esperando',
    turno_actual_usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pregunta_actual_id UUID, -- Will point to preguntas(id)
    temporizador_fin TIMESTAMP WITH TIME ZONE, -- Synchronized time when response phase ends (now + 3 minutes)
    orden_turnos JSONB, -- Ordered array of user IDs or profiles
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    finalizado_en TIMESTAMP WITH TIME ZONE
);

-- 6. PREGUNTAS (Quiz Questions)
CREATE TABLE public.preguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID REFERENCES public.sesiones_juego(id) ON DELETE CASCADE,
    creador_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    url_imagen TEXT,
    respuesta_correcta TEXT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key to sesiones_juego for pregunta_actual_id
ALTER TABLE public.sesiones_juego 
ADD CONSTRAINT fk_pregunta_actual 
FOREIGN KEY (pregunta_actual_id) REFERENCES public.preguntas(id) ON DELETE SET NULL;

-- 7. RESPUESTAS (Student Answers)
CREATE TABLE public.respuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregunta_id UUID REFERENCES public.preguntas(id) ON DELETE CASCADE,
    alumno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    url_imagen TEXT,
    calificacion INTEGER CHECK (calificacion IN (0, 5, 10)), -- Mala=0, Mas o menos=5, Buena=10
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pregunta_id, alumno_id)
);

-- 8. RANKINGS (Global Course Rankings)
CREATE TABLE public.rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    puntaje_total INTEGER DEFAULT 0 NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(curso_id, usuario_id)
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelist_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_juego ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- TRIGGERS AND FUNCTIONS TO UPDATE ROLES DYNAMICALLY
-- ----------------------------------------------------

-- Function to handle new signups from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_rol TEXT := 'jugador';
  v_curso_id UUID := NULL;
BEGIN
  -- 1. Check if Super Admin
  IF new.email = 'materiales.integrity@gmail.com' THEN
    v_rol := 'super_admin';
  -- 2. Check if Course Admin
  ELSIF EXISTS (SELECT 1 FROM public.cursos WHERE admin_email = new.email) THEN
    v_rol := 'admin_curso';
    SELECT id INTO v_curso_id FROM public.cursos WHERE admin_email = new.email LIMIT 1;
  -- 3. Check if Alumno in Whitelist
  ELSIF EXISTS (SELECT 1 FROM public.whitelist_alumnos WHERE email = new.email) THEN
    v_rol := 'jugador';
    SELECT curso_id INTO v_curso_id FROM public.whitelist_alumnos WHERE email = new.email LIMIT 1;
  END IF;

  INSERT INTO public.perfiles_usuarios (id, email, nombre, rol, curso_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    v_rol, 
    v_curso_id
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email,
      rol = EXCLUDED.rol,
      curso_id = EXCLUDED.curso_id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check whitelist before allowing user creation
CREATE OR REPLACE FUNCTION public.check_user_whitelist()
RETURNS trigger AS $$
BEGIN
  -- 1. Check if Super Admin
  IF new.email = 'materiales.integrity@gmail.com' THEN
    RETURN new;
  END IF;

  -- 2. Check if Course Admin
  IF EXISTS (SELECT 1 FROM public.cursos WHERE admin_email = new.email) THEN
    RETURN new;
  END IF;

  -- 3. Check if Student in Whitelist
  IF EXISTS (SELECT 1 FROM public.whitelist_alumnos WHERE email = new.email) THEN
    RETURN new;
  END IF;

  -- Otherwise, block signup
  RAISE EXCEPTION 'Tu correo % no está en la lista de alumnos permitidos. Pide a tu profesor que te agregue a la whitelist.', new.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER before_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_user_whitelist();

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update user profiles when courses admin_email is set or updated
CREATE OR REPLACE FUNCTION public.handle_course_admin_update()
RETURNS trigger AS $$
BEGIN
  -- Demote old admin if needed
  IF (TG_OP = 'UPDATE' AND old.admin_email IS DISTINCT FROM new.admin_email AND old.admin_email IS NOT NULL) THEN
    UPDATE public.perfiles_usuarios
    SET rol = 'jugador', curso_id = NULL
    WHERE email = old.admin_email AND rol = 'admin_curso';
  END IF;

  -- Promote new admin
  IF (new.admin_email IS NOT NULL) THEN
    UPDATE public.perfiles_usuarios
    SET rol = 'admin_curso', curso_id = new.id
    WHERE email = new.admin_email;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_course_admin_updated
  AFTER INSERT OR UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.handle_course_admin_update();

-- Trigger to update user profiles when added to student whitelist
CREATE OR REPLACE FUNCTION public.handle_whitelist_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.perfiles_usuarios
  SET curso_id = new.curso_id, rol = 'jugador'
  WHERE email = new.email AND rol = 'jugador';
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_whitelist_added
  AFTER INSERT ON public.whitelist_alumnos
  FOR EACH ROW EXECUTE FUNCTION public.handle_whitelist_insert();


-- ----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

-- Check helper functions
CREATE OR REPLACE FUNCTION public.es_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles_usuarios
    WHERE id = p_user_id AND rol = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. COLEGIOS POLICIES
CREATE POLICY "Public read access for Colegios" 
ON public.colegios FOR SELECT USING (true);

CREATE POLICY "Super Admin write access for Colegios" 
ON public.colegios FOR ALL USING (public.es_super_admin(auth.uid()));

-- 2. CURSOS POLICIES
CREATE POLICY "Public read access for Cursos" 
ON public.cursos FOR SELECT USING (true);

CREATE POLICY "Super Admin write access for Cursos" 
ON public.cursos FOR ALL USING (public.es_super_admin(auth.uid()));

-- 3. PERFILES USUARIOS POLICIES
CREATE POLICY "Public read access for Profiles" 
ON public.perfiles_usuarios FOR SELECT USING (true);

CREATE POLICY "Users can edit own profile" 
ON public.perfiles_usuarios FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super Admin write access for Profiles" 
ON public.perfiles_usuarios FOR ALL USING (public.es_super_admin(auth.uid()));

-- 4. WHITELIST ALUMNOS POLICIES
CREATE POLICY "Course Admin / Super Admin can see Whitelist" 
ON public.whitelist_alumnos FOR SELECT USING (
  public.es_super_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = whitelist_alumnos.curso_id
  )
);

CREATE POLICY "Course Admin / Super Admin can edit Whitelist" 
ON public.whitelist_alumnos FOR ALL USING (
  public.es_super_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = whitelist_alumnos.curso_id
  )
);

-- 5. SESIONES JUEGO POLICIES
CREATE POLICY "Allow members and admins to view Sessions" 
ON public.sesiones_juego FOR SELECT USING (
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.curso_id = sesiones_juego.curso_id
  )
);

CREATE POLICY "Allow Course Admin and Super Admin to create Sessions" 
ON public.sesiones_juego FOR INSERT WITH CHECK (
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = curso_id
  )
);

CREATE POLICY "Allow members and admins to update Sessions" 
ON public.sesiones_juego FOR UPDATE USING (
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.curso_id = sesiones_juego.curso_id
  )
);

-- 6. PREGUNTAS POLICIES
CREATE POLICY "Allow members and admins to view Questions" 
ON public.preguntas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sesiones_juego
    WHERE id = sesion_id
  )
);

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

-- 7. RESPUESTAS POLICIES
CREATE POLICY "Allow members and admins to view Answers" 
ON public.respuestas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.preguntas
    JOIN public.sesiones_juego ON sesiones_juego.id = preguntas.sesion_id
    WHERE preguntas.id = pregunta_id
  )
);

CREATE POLICY "Allow students to insert Answers" 
ON public.respuestas FOR INSERT WITH CHECK (
  alumno_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.preguntas
    JOIN public.sesiones_juego ON sesiones_juego.id = preguntas.sesion_id
    WHERE preguntas.id = pregunta_id AND sesiones_juego.estado = 'respuesta'
  )
);

CREATE POLICY "Allow drawer and answerer to update Answers" 
ON public.respuestas FOR UPDATE USING (
  -- Answering student can update their answer, or the drawer (creator) can grade it
  alumno_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.preguntas
    WHERE preguntas.id = pregunta_id AND preguntas.creador_id = auth.uid()
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

-- 8. RANKINGS POLICIES
CREATE POLICY "Public read rankings" 
ON public.rankings FOR SELECT USING (true);

CREATE POLICY "Allow user and admins to update rankings" 
ON public.rankings FOR ALL USING (
  auth.uid() = usuario_id OR
  public.es_super_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.perfiles_usuarios p 
    WHERE p.id = auth.uid() AND p.rol = 'admin_curso' AND p.curso_id = rankings.curso_id
  )
);
