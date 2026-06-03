import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true); // Default to true so it works out of the box without DB keys!

  // Check if real keys are supplied
  const hasKeys = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!hasKeys) {
      setDemoMode(true);
      // Setup default mock user (Mauricio Lara - Super Admin) for testing
      setUser({ id: 'demo-super-admin', email: 'materiales.integrity@gmail.com' });
      setProfile({
        id: 'demo-super-admin',
        email: 'materiales.integrity@gmail.com',
        nombre: 'Mauricio Lara (Demo)',
        rol: 'super_admin',
        curso_id: null
      });
      setLoading(false);
      return;
    }

    setDemoMode(false);

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [hasKeys]);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select('*, cursos(*)')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (demoMode) {
      alert("Iniciando sesión en Modo Demo. Puedes cambiar de rol en la barra superior.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error("Error signing in with Google:", error);
  };

  const signInWithEmail = async (email, password) => {
    if (demoMode) {
      alert(`Iniciando sesión como ${email} en Modo Demo.`);
      setUser({ id: `demo-user-${email}`, email });
      setProfile({
        id: `demo-user-${email}`,
        email,
        nombre: email.split('@')[0],
        rol: email === 'materiales.integrity@gmail.com' ? 'super_admin' : 'jugador',
        curso_id: 'demo-curso-1a'
      });
      return { error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signUpWithEmail = async (email, password, name) => {
    if (demoMode) {
      alert("Registro simulado en Modo Demo. El correo debe estar en la whitelist.");
      return { error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    return { data, error };
  };

  const changePassword = async (newPassword) => {
    if (demoMode) {
      alert("Contraseña actualizada en el simulador.");
      return { error: null };
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  };

  const signOut = async () => {
    if (demoMode) {
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const selectDemoUser = (role, email = '') => {
    setDemoMode(true);
    if (role === 'super_admin') {
      setUser({ id: 'demo-super-admin', email: 'materiales.integrity@gmail.com' });
      setProfile({
        id: 'demo-super-admin',
        email: 'materiales.integrity@gmail.com',
        nombre: 'Mauricio Lara (Super Admin)',
        rol: 'super_admin',
        curso_id: null
      });
    } else if (role === 'admin_curso') {
      setUser({ id: 'demo-course-admin', email: 'profesora.teresa@gmail.com' });
      setProfile({
        id: 'demo-course-admin',
        email: 'profesora.teresa@gmail.com',
        nombre: 'Profesora Teresa (Apoderado)',
        rol: 'admin_curso',
        curso_id: 'demo-curso-1a'
      });
    } else {
      const studentEmail = email || 'alumno.benjamin@gmail.com';
      setUser({ id: `demo-student-${studentEmail}`, email: studentEmail });
      setProfile({
        id: `demo-student-${studentEmail}`,
        email: studentEmail,
        nombre: studentEmail.split('.')[1]?.split('@')[0] || 'Estudiante',
        rol: 'jugador',
        curso_id: 'demo-curso-1a'
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      changePassword,
      signOut, 
      demoMode, 
      setDemoMode, 
      selectDemoUser, 
      hasKeys 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
