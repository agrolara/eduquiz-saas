-- 1. Añadir columna codigo a la tabla cursos
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS codigo TEXT UNIQUE;

-- 2. Generar códigos para cursos existentes (NombreColegio-NombreCurso-2026)
UPDATE public.cursos c
SET codigo = REPLACE(co.nombre, ' ', '') || '-' || REPLACE(c.nombre, ' ', '') || '-2026'
FROM public.colegios co
WHERE c.colegio_id = co.id AND c.codigo IS NULL;

-- 3. Añadir columna codigo a la tabla sesiones_juego
ALTER TABLE public.sesiones_juego ADD COLUMN IF NOT EXISTS codigo TEXT UNIQUE;

-- 4. Generar códigos para sesiones existentes (NombreSesion-Fecha)
UPDATE public.sesiones_juego
SET codigo = REPLACE(nombre, ' ', '') || '-' || to_char(creado_en, 'DDMMYYYY')
WHERE codigo IS NULL;

-- 5. Modificar la función check_user_whitelist para permitir alumnos virtuales
CREATE OR REPLACE FUNCTION public.check_user_whitelist()
RETURNS trigger AS $$
BEGIN
  -- 1. Permitir Super Admin
  IF new.email = 'materiales.integrity@gmail.com' THEN
    RETURN new;
  END IF;

  -- 2. Permitir Administradores de Curso
  IF EXISTS (SELECT 1 FROM public.cursos WHERE admin_email = new.email) THEN
    RETURN new;
  END IF;

  -- 3. Permitir Alumnos Whitelisted
  IF EXISTS (SELECT 1 FROM public.whitelist_alumnos WHERE email = new.email) THEN
    RETURN new;
  END IF;

  -- 4. Permitir alumnos virtuales creados mediante código de sesión
  IF new.email LIKE '%@virtual.eduquiz.com' THEN
    RETURN new;
  END IF;

  -- De lo contrario, bloquear
  RAISE EXCEPTION 'Tu correo % no está en la lista de alumnos permitidos. Pide a tu profesor que te agregue a la whitelist.', new.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
