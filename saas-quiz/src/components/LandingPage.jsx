import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Sparkle, GameController, ShieldCheck, Trophy, Play, EnvelopeSimple, Lock, User, WhatsappLogo } from '@phosphor-icons/react';

export default function LandingPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, selectDemoUser, demoMode } = useAuth();
  
  // New split layout form states
  const [showSuperAdminForm, setShowSuperAdminForm] = useState(false);
  const [showRoomsForm, setShowRoomsForm] = useState(false);

  // Code-based connection states
  const [inputCode, setInputCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [courseTeacherEmail, setCourseTeacherEmail] = useState('');
  const [courseTeacherPassword, setCourseTeacherPassword] = useState('');
  const [courseTeacherName, setCourseTeacherName] = useState('');
  const [isCourseRegister, setIsCourseRegister] = useState(false);

  // Validated objects
  const [validatedCourse, setValidatedCourse] = useState(null);
  const [validatedSession, setValidatedSession] = useState(null);

  // Common authentication feedback
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuperAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (email !== 'materiales.integrity@gmail.com' && !demoMode) {
      setErrorMsg("Acceso exclusivo para Super Administrador. Si eres alumno o profesor, usa el Ingreso de Salas o Cursos.");
      setLoading(false);
      return;
    }

    const { error } = await signInWithEmail(email, password);
    if (error) {
      setErrorMsg(error.message);
    }
    setLoading(false);
  };

  const handleValidateCode = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setValidatedCourse(null);
    setValidatedSession(null);

    const code = inputCode.trim();
    if (!code) return;

    if (demoMode) {
      // Mock validation in demo mode
      if (code.toLowerCase().includes('2026') || code.toLowerCase().includes('-')) {
        // Course Code (hyphenated or has year)
        const mockCourse = {
          id: 'demo-curso-1a',
          nombre: 'Tercero Yellow',
          codigo: code,
          colegio_id: 'school-1',
          admin_email: code.toLowerCase().includes('claimed') ? 'profesora.teresa@gmail.com' : null
        };
        setValidatedCourse(mockCourse);
        setSuccessMsg("Código de Curso validado con éxito. Iniciando sesión...");
        handleTeacherAutoLogin(mockCourse);
      } else {
        // Session Code
        setValidatedSession({
          id: 'demo-session-active',
          nombre: 'Ciencias',
          codigo: code,
          curso_id: 'demo-curso-1a',
          estado: 'esperando'
        });
        setSuccessMsg("Código de Sala válido. Escribe tu nombre para entrar a la trivia.");
      }
      return;
    }

    try {
      setLoading(true);
      // Try validating as Session Code first (students)
      const { data: sess, error: sErr } = await supabase
        .from('sesiones_juego')
        .select('*, cursos(*)')
        .eq('codigo', code)
        .single();

      if (!sErr && sess) {
        setValidatedSession(sess);
        setSuccessMsg(`Código de Sala válido: "${sess.nombre}".`);
        setLoading(false);
        return;
      }

      // Try validating as Course Code (teachers)
      const { data: course, error: cErr } = await supabase
        .from('cursos')
        .select('*, colegios(*)')
        .eq('codigo', code)
        .single();

      if (!cErr && course) {
        setValidatedCourse(course);
        setSuccessMsg(`Código de Curso válido. Colegio: ${course.colegios?.nombre || '—'}. Curso: ${course.nombre}.`);
        await handleTeacherAutoLogin(course);
        setLoading(false);
        return;
      }

      setErrorMsg("Código inválido. Verifica que esté bien escrito (ej: Ciencias-08072026 o ColegioPalmares-TerceroYellow-2026).");
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherAutoLogin = async (course) => {
    setErrorMsg('');
    setLoading(true);

    const virtualEmail = `teacher_${course.id.substring(0, 8)}@virtual.eduquiz.com`;
    const virtualPassword = `teacher_pass_${course.codigo}`;

    if (demoMode) {
      alert(`Simulación: Acceso Docente exitoso para el curso ${course.nombre} sin contraseña.`);
      selectDemoUser('admin_curso');
      setLoading(false);
      return;
    }

    try {
      // 1. Attempt to sign in
      const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: virtualPassword
      });

      if (!loginErr && authData.user) {
        setLoading(false);
        return;
      }

      // 2. If login fails, sign up
      const { data: signupData, error: signupErr } = await supabase.auth.signUp({
        email: virtualEmail,
        password: virtualPassword,
        options: {
          data: {
            name: `Profesor ${course.nombre}`,
            full_name: `Profesor ${course.nombre}`
          }
        }
      });

      if (signupErr) {
        setErrorMsg("Error al registrar docente: " + signupErr.message);
        setLoading(false);
        return;
      }

      if (signupData.user) {
        // Link course admin email
        await supabase
          .from('cursos')
          .update({ admin_email: virtualEmail })
          .eq('id', course.id);

        // Update profile
        await supabase
          .from('perfiles_usuarios')
          .update({
            rol: 'admin_curso',
            curso_id: course.id,
            nombre: `Profesor ${course.nombre}`
          })
          .eq('id', signupData.user.id);

        // Explicitly sign in to establish the session (in case email confirmation is enabled)
        await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: virtualPassword
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al conectar con la plataforma.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentJoin = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !validatedSession) return;
    setErrorMsg('');
    setLoading(true);

    const cleanName = studentName.trim();
    // Deterministic slug for name
    const nameSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const virtualEmail = `std_${validatedSession.id.substring(0, 8)}_${nameSlug}@virtual.eduquiz.com`;
    const virtualPassword = `student_${validatedSession.codigo}`;

    if (demoMode) {
      alert(`Simulación: Iniciando sesión como ${cleanName}`);
      selectDemoUser('jugador', virtualEmail);
      setLoading(false);
      return;
    }

    try {
      // 1. Attempt to sign in
      const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: virtualPassword
      });

      if (!loginErr && authData.user) {
        // Save auto-join variables to redirect directly to GameRoom on reload/auth update
        localStorage.setItem('autoJoinSessionId', validatedSession.id);
        localStorage.setItem('autoJoinSessionName', validatedSession.nombre);
        setLoading(false);
        return;
      }

      // 2. If login fails, attempt to sign up
      const { data: signupData, error: signupErr } = await supabase.auth.signUp({
        email: virtualEmail,
        password: virtualPassword,
        options: {
          data: {
            name: cleanName,
            full_name: cleanName
          }
        }
      });

      if (signupErr) {
        setErrorMsg("Error al ingresar a la sesión: " + signupErr.message);
        setLoading(false);
        return;
      }

      if (signupData.user) {
        localStorage.setItem('autoJoinSessionId', validatedSession.id);
        localStorage.setItem('autoJoinSessionName', validatedSession.nombre);

        // Explicitly sign in FIRST to establish the session (needed for RLS)
        await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: virtualPassword
        });

        // NOW update the profile with curso_id and nombre (session is active, RLS allows it)
        await supabase
          .from('perfiles_usuarios')
          .update({
            curso_id: validatedSession.curso_id,
            nombre: cleanName
          })
          .eq('id', signupData.user.id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error inesperado al unirse a la sala.");
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="premium-landing-container">
      {/* Dynamic Inject Style Tag for Playful Cosmic & High-Legibility UI */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono:wght@700&display=swap');

        /* Force dark background on body and layout parents only when LandingPage is mounted */
        body, html, #root, .app-root, .app-body {
          background-color: #0c1020 !important;
          color: #f8fafc !important;
          transition: background-color 0.5s ease;
        }

        .premium-landing-container {
          background-color: #0c1020 !important; /* Deep Cosmic Blue */
          color: #f8fafc !important;
          position: relative;
          overflow-x: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
        }

        /* Override existing stylesheet backgrounds to prevent clashing white sections */
        .landing-hero {
          background: transparent !important;
        }
        .stats-section {
          background: transparent !important;
        }
        .how-it-works-section {
          background: rgba(21, 28, 48, 0.45) !important;
          border-top: 1.5px solid rgba(255, 255, 255, 0.08) !important;
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.08) !important;
        }
        .features-section {
          background: transparent !important;
        }
        .testimonials-section {
          background: rgba(21, 28, 48, 0.45) !important;
          border-top: 1.5px solid rgba(255, 255, 255, 0.08) !important;
        }
        .landing-cta-section {
          background: transparent !important;
        }
        .landing-footer {
          background: #070a14 !important;
          border-top: 1.5px solid rgba(255, 255, 255, 0.08) !important;
        }

        /* Animated Floating Emojis (Cosmic & Playful) */
        .cosmic-floating-item {
          position: absolute;
          font-size: 38px;
          user-select: none;
          pointer-events: none;
          z-index: 1;
          opacity: 0.85;
          filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.2));
        }

        @keyframes float-cosmic-1 {
          0% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-20px) rotate(15deg) scale(1.1); }
          100% { transform: translateY(0px) rotate(0deg) scale(1); }
        }
        @keyframes float-cosmic-2 {
          0% { transform: translateY(0px) rotate(0deg) scale(1.1); }
          50% { transform: translateY(20px) rotate(-10deg) scale(0.95); }
          100% { transform: translateY(0px) rotate(0deg) scale(1.1); }
        }

        .float-fast { animation: float-cosmic-1 6s ease-in-out infinite; }
        .float-slow { animation: float-cosmic-2 8s ease-in-out infinite; }

        /* Background grid */
        .cyber-grid {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px);
          background-size: 40px 40px;
          background-position: center;
          pointer-events: none;
          z-index: 0;
          mask-image: radial-gradient(circle at 50% 50%, black 20%, transparent 90%);
          opacity: 0.7;
        }

        /* Ambient Cosmic Orbs with float animation (Nebula dust effect) */
        .glowing-orb-mesh {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.45;
        }

        @keyframes float-nebula-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(80px, -50px) scale(1.15); }
          100% { transform: translate(-40px, 60px) scale(0.85); }
        }
        @keyframes float-nebula-2 {
          0% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-60px, 70px) scale(0.9); }
          100% { transform: translate(50px, -40px) scale(1.2); }
        }
        @keyframes float-nebula-3 {
          0% { transform: translate(0px, 0px) scale(0.9); }
          50% { transform: translate(50px, 40px) scale(1.1); }
          100% { transform: translate(-70px, -50px) scale(0.95); }
        }

        .orb-1 { animation: float-nebula-1 25s infinite alternate ease-in-out; }
        .orb-2 { animation: float-nebula-2 30s infinite alternate ease-in-out; }
        .orb-3 { animation: float-nebula-3 22s infinite alternate ease-in-out; }

        /* SVG Cosmic Background Decorations */
        .cosmic-svg-decorations {
          position: absolute;
          inset: -100px;
          pointer-events: none;
          z-index: 0;
          overflow: visible;
        }

        .orbit-line {
          stroke: rgba(99, 102, 241, 0.16);
          stroke-width: 1.5;
          stroke-dasharray: 6 8;
          fill: none;
          transform-origin: center;
        }

        .orbit-line-slow {
          animation: rotate-orbit 60s linear infinite;
        }

        .orbit-line-fast {
          animation: rotate-orbit 40s linear infinite reverse;
        }

        @keyframes rotate-orbit {
          100% { transform: rotate(360deg); }
        }

        .vector-planet-1 {
          fill: url(#planetGrad1);
          filter: drop-shadow(0 0 8px rgba(129, 140, 248, 0.5));
        }

        .vector-planet-2 {
          fill: url(#planetGrad2);
          filter: drop-shadow(0 0 10px rgba(251, 146, 60, 0.4));
        }

        .twinkle-star {
          fill: #ffffff;
          animation: twinkle 4s infinite ease-in-out;
          transform-origin: center;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Left Column Academic SVG Decorations */
        .cosmic-left-svg {
          position: absolute;
          inset: -100px;
          pointer-events: none;
          z-index: -1;
          overflow: visible;
        }

        .academic-shape {
          fill: none;
          stroke: rgba(255, 255, 255, 0.08);
          stroke-width: 1.5;
          transform-origin: center;
          animation: drift-academic 14s infinite alternate ease-in-out;
        }

        .academic-shape-dashed {
          stroke-dasharray: 4 4;
        }

        .academic-text {
          fill: rgba(255, 255, 255, 0.09);
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 20px;
          transform-origin: center;
          animation: drift-academic 18s infinite alternate ease-in-out;
        }

        @keyframes drift-academic {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          100% { transform: translate(25px, -20px) rotate(15deg) scale(1.08); }
        }

        .shape-slow { animation-duration: 22s; }
        .shape-fast { animation-duration: 10s; }
        .shape-reverse { animation-direction: alternate-reverse; }

        /* Section Background SVGs */
        .section-svg-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          opacity: 0.16;
        }

        /* Physics Theme Styles */
        .physics-wave {
          stroke: rgba(129, 140, 248, 0.35);
          stroke-width: 1.5;
          fill: none;
          animation: wave-slide 10s linear infinite;
          stroke-dasharray: 20 20;
        }

        @keyframes wave-slide {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -100; }
        }

        /* Chemistry Theme Styles */
        .chemistry-bubble {
          fill: rgba(251, 146, 60, 0.4);
          animation: bubble-rise 6s infinite ease-in;
          transform-origin: center;
        }

        @keyframes bubble-rise {
          0% { transform: translateY(120px) scale(0.6); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-80px) scale(1.1); opacity: 0; }
        }

        /* Biology Theme Styles */
        .dna-helix {
          stroke: rgba(52, 211, 153, 0.3);
          stroke-width: 1.5;
          fill: none;
          animation: dna-rotate 12s linear infinite;
          transform-origin: center;
        }

        @keyframes dna-rotate {
          0% { transform: rotate(0deg) scaleY(1); }
          50% { transform: rotate(180deg) scaleY(0.1); }
          100% { transform: rotate(360deg) scaleY(1); }
        }

        /* Literature Theme Styles */
        .book-float {
          fill: none;
          stroke: rgba(167, 139, 250, 0.35);
          stroke-width: 1.5;
          transform-origin: center;
          animation: book-drift 8s infinite alternate ease-in-out;
        }

        @keyframes book-drift {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-12px) rotate(8deg); }
        }

        /* Engineering Theme Styles */
        .gear-rotate {
          fill: none;
          stroke: rgba(96, 165, 250, 0.35);
          stroke-width: 2;
          transform-origin: center;
          animation: gear-spin 20s linear infinite;
        }

        .gear-rotate-reverse {
          animation-direction: reverse;
        }

        @keyframes gear-spin {
          100% { transform: rotate(360deg); }
        }

        /* Playful Large Typography - High Contrast */
        .headline-massive {
          font-family: 'Fredoka', sans-serif;
          font-size: 64px;
          line-height: 1.1;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #ffffff !important;
          margin-bottom: 24px;
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
          position: relative;
          z-index: 2;
        }

        .headline-massive span {
          display: inline-block;
          background: linear-gradient(135deg, #818cf8 0%, #34d399 50%, #fb923c 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          text-shadow: none;
        }

        .landing-subtitle {
          color: #f1f5f9 !important; /* Extremely high contrast light slate */
          font-size: 20px;
          line-height: 1.6;
          margin-bottom: 48px;
          max-width: 600px;
          font-weight: 600;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
          position: relative;
          z-index: 2;
        }

        /* Gamified Bento Glass Cards (Rounded & Cute) */
        .bento-glass-card {
          background: rgba(22, 30, 58, 0.95) !important; /* Darker, high-contrast container */
          backdrop-filter: blur(20px);
          border: 3px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 32px; /* Super rounded corners */
          padding: 38px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 10;
        }

        .bento-glass-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: #6366f1 !important; /* Glowing indigo border on hover */
          box-shadow: 0 24px 48px rgba(99, 102, 241, 0.3);
        }

        .stat-highlight {
          font-size: 64px;
          font-weight: 700;
          font-family: 'Fredoka', sans-serif;
          line-height: 1;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #a5b4fc, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Playful Buttons (Nintendo-Switch style feel) */
        .pulse-primary-btn {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
          color: white !important;
          border: 3px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 20px !important;
          font-family: 'Fredoka', sans-serif;
          font-weight: 700;
          padding: 18px 42px !important;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5);
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 5;
        }

        .pulse-primary-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.7);
          border-color: rgba(255, 255, 255, 0.4) !important;
        }

        .pulse-primary-btn:active {
          transform: translateY(0);
        }

        .form-input {
          width: 100%;
          padding: 16px 20px;
          border-radius: 16px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          outline: none;
          background-color: rgba(15, 23, 42, 0.8);
          color: #ffffff;
          transition: all 0.3s ease;
          font-size: 15px;
          font-weight: 600;
        }

        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.35);
          background-color: rgba(15, 23, 42, 0.95);
        }

        /* Floating WhatsApp Action Button */
        .whatsapp-pulse-btn {
          position: fixed;
          bottom: 32px;
          right: 32px;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background-color: #22c55e;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          box-shadow: 0 12px 36px rgba(34, 197, 94, 0.4);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .whatsapp-pulse-btn:hover {
          transform: scale(1.15) rotate(10deg);
          box-shadow: 0 16px 48px rgba(34, 197, 94, 0.6);
        }

        .interactive-video-panel {
          transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.15);
          transform: perspective(1200px) rotateY(-8deg) rotateX(4deg) scale(0.98);
        }

        .interactive-video-panel:hover {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1.03);
        }
      `}</style>

      {/* Playful Floating Cosmic Icons */}
      <span className="cosmic-floating-item float-fast" style={{ top: '15%', left: '10%' }}>🚀</span>
      <span className="cosmic-floating-item float-slow" style={{ top: '65%', left: '5%' }}>🎮</span>
      <span className="cosmic-floating-item float-fast" style={{ top: '25%', right: '8%' }}>👾</span>
      <span className="cosmic-floating-item float-slow" style={{ bottom: '15%', right: '12%' }}>🏆</span>
      <span className="cosmic-floating-item float-fast" style={{ top: '50%', left: '42%' }}>🧠</span>

      {/* Cyber Grid Pattern */}
      <div className="cyber-grid"></div>

      {/* Ambient Cosmic Orbs (Animated Nebula Effect) */}
      <div className="glowing-orb-mesh orb-1" style={{ top: '-10%', left: '-10%', width: '45vw', height: '45vw', background: 'radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%)' }}></div>
      <div className="glowing-orb-mesh orb-2" style={{ bottom: '20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%)' }}></div>
      <div className="glowing-orb-mesh orb-3" style={{ top: '30%', left: '20%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }}></div>

      {/* HERO SECTION */}
      <section className="landing-hero" style={{ padding: '140px 0 80px', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '56px', alignItems: 'center' }}>
            
            {/* Left Content Column */}
            <div style={{ zIndex: 20, position: 'relative' }}>
              {/* Left Column SVG Academic/Geometric Decorations */}
              <svg className="cosmic-left-svg" viewBox="0 0 600 500">
                {/* Trigonometric Triangle */}
                <polygon points="50,150 150,150 150,50" className="academic-shape shape-slow" />
                <line x1="50" y1="150" x2="150" y2="50" className="academic-shape shape-slow" style={{ strokeDasharray: '3 3' }} />
                
                {/* Circle with angle slice (Geometry) */}
                <circle cx="450" cy="100" r="35" className="academic-shape shape-reverse" />
                <line x1="450" y1="100" x2="480" y2="80" className="academic-shape shape-reverse" />
                <line x1="450" y1="100" x2="485" y2="100" className="academic-shape shape-reverse" />
                <path d="M470,100 A20,20 0 0,0 467,90" className="academic-shape shape-reverse" />

                {/* Coordinate axis with points */}
                <line x1="50" y1="400" x2="180" y2="400" className="academic-shape academic-shape-dashed" />
                <line x1="50" y1="400" x2="50" y2="280" className="academic-shape academic-shape-dashed" />
                <circle cx="90" cy="350" r="4" style={{ fill: 'rgba(99,102,241,0.35)' }} className="academic-shape shape-fast" />
                <circle cx="130" cy="310" r="4" style={{ fill: 'rgba(52,211,153,0.35)' }} className="academic-shape shape-fast shape-reverse" />

                {/* Math Formulas and Symbols */}
                <text x="380" y="380" className="academic-text shape-slow shape-reverse">E = mc²</text>
                <text x="60" y="80" className="academic-text shape-fast">π ≈ 3.14</text>
                <text x="320" y="60" className="academic-text shape-slow">a² + b² = c²</text>
                <text x="490" y="260" className="academic-text shape-slow shape-reverse">∑</text>
                <text x="240" y="440" className="academic-text shape-fast">√x + y</text>
                <text x="440" y="430" className="academic-text shape-slow">f(x)</text>

                {/* Floating Constellation Stars */}
                <circle cx="280" cy="180" r="1.5" className="twinkle-star" style={{ fill: 'rgba(255,255,255,0.35)', animationDelay: '0.2s' }} />
                <circle cx="340" cy="220" r="2" className="twinkle-star" style={{ fill: 'rgba(255,255,255,0.4)', animationDelay: '1.4s' }} />
                <line x1="280" y1="180" x2="340" y2="220" style={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              </svg>

              <span className="landing-badge" style={{ 
                background: 'rgba(99, 102, 241, 0.18)', 
                color: '#c7d2fe', 
                border: '2px solid rgba(99, 102, 241, 0.4)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: '800',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '28px'
              }}>
                <Sparkle weight="fill" style={{ color: '#fb923c' }} />
                Plataforma EdTech SaaS Interactiva
              </span>
              
              <h1 className="headline-massive">
                El juego de preguntas que transforma el <span>aula</span>
              </h1>
              
              <p className="landing-subtitle">
                Crea salas en tiempo real, fomenta el aprendizaje colaborativo con evaluación por pares y mantén a tus alumnos motivados con dinámicas gamificadas y seguras.
              </p>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button 
                  className="pulse-primary-btn"
                  onClick={() => {
                    setShowRoomsForm(!showRoomsForm);
                    setShowSuperAdminForm(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                    setValidatedCourse(null);
                    setValidatedSession(null);
                    setInputCode('');
                    setStudentName('');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <GameController weight="bold" size={26} />
                  {showRoomsForm ? 'Ocultar Ingreso' : 'Ingreso a Salas o Cursos'}
                </button>

                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowSuperAdminForm(!showSuperAdminForm);
                    setShowRoomsForm(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                    setEmail('');
                    setPassword('');
                  }}
                  style={{
                    padding: '14px 24px',
                    fontSize: '15px',
                    fontWeight: '800',
                    borderRadius: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ShieldCheck weight="bold" size={22} />
                  {showSuperAdminForm ? 'Ocultar Super Admin' : 'Acceso Super Administrador'}
                </button>
              </div>

              <div>
                {/* Glassmorphic Super Admin Form */}
                {showSuperAdminForm && (
                  <div className="bento-glass-card animate-slide-in" style={{ maxWidth: '440px', marginTop: '16px', border: '3px solid #f59e0b' }}>
                    <h3 style={{ fontSize: '22px', marginBottom: '20px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Fredoka, sans-serif' }}>
                      <Lock weight="bold" style={{ color: '#f59e0b' }} />
                      Acceso Super Administrador
                    </h3>
                    
                    {errorMsg && (
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', marginBottom: '20px', border: '2px solid rgba(239, 68, 68, 0.3)' }}>
                        ✕ {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleSuperAdminSubmit}>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label" style={{ color: '#cbd5e1', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Correo del Super Administrador</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          placeholder="superadmin@eduquiz.cl"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label" style={{ color: '#cbd5e1', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Contraseña</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>

                      <button className="pulse-primary-btn" type="submit" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#f59e0b', borderColor: '#d97706', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)' }} disabled={loading}>
                        {loading ? 'Validando...' : 'Ingresar al Panel'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Glassmorphic Rooms and Courses Code Form */}
                {showRoomsForm && (
                  <div className="bento-glass-card animate-slide-in" style={{ maxWidth: '440px', marginTop: '16px', border: '3px solid #6366f1' }}>
                    
                    {errorMsg && (
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', marginBottom: '20px', border: '2px solid rgba(239, 68, 68, 0.3)' }}>
                        ✕ {errorMsg}
                      </div>
                    )}

                    {successMsg && (
                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', marginBottom: '20px', border: '2px solid rgba(16, 185, 129, 0.3)' }}>
                        ✓ {successMsg}
                      </div>
                    )}

                    {/* Step 1: Enter Code */}
                    {!validatedCourse && !validatedSession && (
                      <form onSubmit={handleValidateCode}>
                        <h3 style={{ fontSize: '22px', marginBottom: '20px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Fredoka, sans-serif' }}>
                          <GameController weight="bold" style={{ color: '#818cf8' }} />
                          Ingresar Código
                        </h3>
                        
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                          <label className="form-label" style={{ color: '#cbd5e1', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Código de Curso o Código de Sala</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Ej: Ciencias-08072026"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            required
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', letterSpacing: '0.5px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                            Los alumnos ingresan con el código de sala y los docentes con el código de curso.
                          </span>
                        </div>

                        <button className="pulse-primary-btn" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                          {loading ? 'Validando...' : 'Verificar Código'}
                        </button>
                      </form>
                    )}

                    {/* Step 2A: Validated Session (Student access) */}
                    {validatedSession && (
                      <form onSubmit={handleStudentJoin}>
                        <h3 style={{ fontSize: '22px', marginBottom: '8px', fontWeight: '800', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>
                          🎮 Unirse a la Sala
                        </h3>
                        <p style={{ color: '#a5b4fc', fontSize: '14px', marginBottom: '24px', fontWeight: '600' }}>
                          Sala activa: <span style={{ textDecoration: 'underline' }}>{validatedSession.nombre}</span>
                        </p>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                          <label className="form-label" style={{ color: '#cbd5e1', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ingresa tu Nombre y Apellido</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Ej: Ignacio Silva"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            className="btn btn-secondary" 
                            type="button" 
                            onClick={() => { setValidatedSession(null); setErrorMsg(''); setSuccessMsg(''); }}
                            style={{ padding: '12px 18px', fontSize: '14px' }}
                          >
                            Volver
                          </button>
                          <button className="pulse-primary-btn" type="submit" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                            {loading ? 'Ingresando...' : 'Entrar a Jugar'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Step 2B: Validated Course (Teacher auto-login loading) */}
                    {validatedCourse && (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div className="user-avatar animate-spin" style={{ width: '40px', height: '40px', fontSize: '18px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '8px', fontFamily: 'Fredoka, sans-serif' }}>
                          Ingresando al Aula Docente
                        </h4>
                        <p style={{ color: '#a5b4fc', fontSize: '13px', lineHeight: '1.6' }}>
                          Colegio: {validatedCourse.colegios?.nombre || '—'}<br />
                          Curso: {validatedCourse.nombre}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Asset Column: Glowing 3D perspective video player container */}
            <div className="interactive-video-panel" style={{ zIndex: 10, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* SVG Space Graphics */}
              <svg className="cosmic-svg-decorations" viewBox="0 0 600 600">
                <defs>
                  <linearGradient id="planetGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <linearGradient id="planetGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="planetGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Orbit Lines */}
                <circle cx="300" cy="300" r="230" className="orbit-line orbit-line-slow" />
                <circle cx="300" cy="300" r="170" className="orbit-line orbit-line-fast" />

                {/* Animated Planets along orbits */}
                {/* Planet 1 (indigo) */}
                <g transform="translate(300, 300)">
                  <g className="orbit-line-slow">
                    <circle cx="230" cy="0" r="14" className="vector-planet-1" />
                    {/* Ring around planet 1 */}
                    <ellipse cx="230" cy="0" rx="22" ry="4" style={{ fill: 'none', stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.5, transform: 'rotate(15deg)' }} />
                  </g>
                </g>

                {/* Planet 2 (orange/red) */}
                <g transform="translate(300, 300)">
                  <g className="orbit-line-fast">
                    <circle cx="-170" cy="0" r="10" className="vector-planet-2" />
                  </g>
                </g>

                {/* Twinkling Vector Stars */}
                {/* Star 1 */}
                <path d="M100,60 L102,65 L107,67 L102,69 L100,74 L98,69 L93,67 L98,65 Z" className="twinkle-star" style={{ animationDelay: '0.5s' }} />
                {/* Star 2 */}
                <path d="M500,90 L502,95 L507,97 L502,99 L500,104 L498,99 L493,97 L498,95 Z" className="twinkle-star" style={{ animationDelay: '1.2s' }} />
                {/* Star 3 */}
                <path d="M70,470 L72,475 L77,477 L72,479 L70,484 L68,479 L63,477 L68,475 Z" className="twinkle-star" style={{ animationDelay: '2.3s' }} />
                {/* Star 4 */}
                <path d="M530,440 L532,445 L537,447 L532,449 L530,454 L528,449 L523,447 L528,445 Z" className="twinkle-star" style={{ animationDelay: '1.8s' }} />
                {/* Little points */}
                <circle cx="180" cy="40" r="2.5" className="twinkle-star" style={{ fill: '#fb923c', animationDelay: '0.1s' }} />
                <circle cx="380" cy="520" r="2.5" className="twinkle-star" style={{ fill: '#34d399', animationDelay: '1.5s' }} />
                <circle cx="40" cy="200" r="1.5" className="twinkle-star" style={{ fill: '#818cf8', animationDelay: '0.8s' }} />
              </svg>

              <div className="bento-glass-card" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.82)', border: '3px solid rgba(255,255,255,0.12)', borderRadius: '32px', width: '100%', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>eduquiz.cl/game/demo</span>
                </div>
                
                <div style={{ width: '100%', overflow: 'hidden', borderRadius: '20px', position: 'relative', aspectRatio: '16/9', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <video 
                    src="/promo_video.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  >
                    <track 
                      src="/subtitles.vtt" 
                      kind="subtitles" 
                      srcLang="es" 
                      label="Español" 
                      default 
                    />
                  </video>
                  
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    background: 'linear-gradient(to top, rgba(3,7,18,0.95), transparent 60%)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'flex-end', 
                    padding: '24px', 
                    textAlign: 'left' 
                  }}>
                    <span className="tag tag-success" style={{ width: 'fit-content', marginBottom: '8px', fontWeight: '800', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981' }}>En Vivo</span>
                    <h3 style={{ color: 'white', fontSize: '22px', marginBottom: '4px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)', fontWeight: '800' }}>EduQuiz en Acción</h3>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>Descubre cómo funciona la gamificación interactiva en tiempo real.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STATS SECTION (BENTO BLOCKS WITH GLOWING HOVER STATES) */}
      <section className="stats-section" style={{ position: 'relative', zIndex: 10, padding: '40px 0 80px' }}>
        {/* Physics/Stats Background SVG */}
        <svg className="section-svg-bg" viewBox="0 0 1200 400" style={{ opacity: 0.12 }}>
          <path d="M 100 350 Q 350 350 450 200 T 550 50 T 650 200 T 900 350" fill="none" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M 0 200 Q 150 100 300 200 T 600 200 T 900 200 T 1200 200" className="physics-wave" />
          <path d="M 0 220 Q 150 320 300 220 T 600 220 T 900 220 T 1200 220" className="physics-wave" style={{ animationDelay: '-3s', stroke: 'rgba(52, 211, 153, 0.25)' }} />
          <g transform="translate(1000, 150)">
            <ellipse rx="50" ry="15" fill="none" stroke="rgba(251, 146, 60, 0.3)" strokeWidth="1.5" style={{ transform: 'rotate(30deg)' }} />
            <ellipse rx="50" ry="15" fill="none" stroke="rgba(251, 146, 60, 0.3)" strokeWidth="1.5" style={{ transform: 'rotate(-30deg)' }} />
            <circle cx="0" cy="0" r="8" fill="rgba(251, 146, 60, 0.5)" />
          </g>
          <circle cx="200" cy="80" r="3" className="twinkle-star" style={{ fill: '#818cf8', animationDelay: '1s' }} />
          <circle cx="850" cy="90" r="2.5" className="twinkle-star" style={{ fill: '#34d399', animationDelay: '2.5s' }} />
        </svg>

        <div className="container">
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            <div className="bento-glass-card" style={{ textAlign: 'center', padding: '40px 32px', borderTop: '4px solid #6366f1' }}>
              <span className="stat-highlight" style={{ background: 'linear-gradient(135deg, #a5b4fc 30%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>+10.000</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preguntas respondidas en vivo</span>
            </div>
            <div className="bento-glass-card" style={{ textAlign: 'center', padding: '40px 32px', borderTop: '4px solid #fb923c' }}>
              <span className="stat-highlight" style={{ background: 'linear-gradient(135deg, #ffe4e6 30%, #fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>98%</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>De retención y participación</span>
            </div>
            <div className="bento-glass-card" style={{ textAlign: 'center', padding: '40px 32px', borderTop: '4px solid #34d399' }}>
              <span className="stat-highlight" style={{ background: 'linear-gradient(135deg, #d1fae5 30%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>150+</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profesores activos semanalmente</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="how-it-works-section" style={{ padding: '100px 0', position: 'relative' }}>
        {/* Chemistry Background SVG */}
        <svg className="section-svg-bg" viewBox="0 0 1200 600" style={{ opacity: 0.14 }}>
          <g transform="translate(150, 300)">
            <line x1="0" y1="0" x2="60" y2="-40" stroke="rgba(251, 146, 60, 0.4)" strokeWidth="2" />
            <line x1="0" y1="0" x2="-60" y2="40" stroke="rgba(251, 146, 60, 0.4)" strokeWidth="2" />
            <line x1="0" y1="0" x2="60" y2="50" stroke="rgba(251, 146, 60, 0.4)" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill="#fb923c" style={{ opacity: 0.7 }} />
            <circle cx="60" cy="-40" r="8" fill="#34d399" style={{ opacity: 0.7 }} />
            <circle cx="-60" cy="40" r="10" fill="#818cf8" style={{ opacity: 0.7 }} />
            <circle cx="60" cy="50" r="6" fill="#f43f5e" style={{ opacity: 0.7 }} />
            <text x="-8" y="5" style={{ fill: '#ffffff', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>C</text>
          </g>
          <g transform="translate(1050, 400)">
            <path d="M -20 -50 L 20 -50 L 20 -20 L 50 40 L -50 40 Z" fill="none" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="2.5" />
            <line x1="-30" y1="-50" x2="30" y2="-50" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="2.5" />
            <path d="M -38 18 L 38 18 L 46 32 L -46 32 Z" fill="rgba(52, 211, 153, 0.15)" />
            <circle cx="-10" cy="-10" r="4" className="chemistry-bubble" style={{ animationDelay: '0s' }} />
            <circle cx="12" cy="-25" r="5" className="chemistry-bubble" style={{ animationDelay: '1.5s' }} />
            <circle cx="-2" cy="-40" r="3" className="chemistry-bubble" style={{ animationDelay: '3s' }} />
          </g>
          <text x="350" y="100" style={{ fill: 'rgba(251, 146, 60, 0.35)', fontSize: '20px', fontFamily: 'monospace', fontWeight: 'bold' }}>H₂O</text>
          <text x="800" y="120" style={{ fill: 'rgba(251, 146, 60, 0.35)', fontSize: '20px', fontFamily: 'monospace', fontWeight: 'bold' }}>CO₂</text>
          <text x="550" y="500" style={{ fill: 'rgba(52, 211, 153, 0.3)', fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold' }}>NaCl</text>
        </svg>

        <div className="container">
          <div className="section-header" style={{ marginBottom: '64px', textAlign: 'center' }}>
            <h2 className="section-title" style={{ fontSize: '46px', fontWeight: '700', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>¿Cómo Funciona EduQuiz?</h2>
            <p className="section-desc" style={{ fontSize: '18px', color: '#cbd5e1' }}>Tres simples pasos para transformar tu sala de clases en un entorno interactivo.</p>
          </div>

          <div className="how-it-works-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            
            <div className="bento-glass-card" style={{ borderLeft: '5px solid #6366f1' }}>
              <span style={{ position: 'absolute', top: '16px', right: '24px', fontSize: '72px', fontWeight: '900', color: 'rgba(99,102,241,0.08)', fontFamily: 'var(--font-mono)' }}>01</span>
              <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>Crea la Pregunta</h3>
              <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                El alumno formula su propia pregunta sobre un tema académico específico o participa de una trivia general para desafiar a la clase.
              </p>
            </div>

            <div className="bento-glass-card" style={{ borderLeft: '5px solid #fb923c' }}>
              <span style={{ position: 'absolute', top: '16px', right: '24px', fontSize: '72px', fontWeight: '900', color: 'rgba(249,115,22,0.08)', fontFamily: 'var(--font-mono)' }}>02</span>
              <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>Ingreso al Instante</h3>
              <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                El alumno ingresa con su correo para unirse de inmediato a la sala de juego activa del día, listo para participar sin demoras.
              </p>
            </div>

            <div className="bento-glass-card" style={{ borderLeft: '5px solid #34d399' }}>
              <span style={{ position: 'absolute', top: '16px', right: '24px', fontSize: '72px', fontWeight: '900', color: 'rgba(16,185,129,0.08)', fontFamily: 'var(--font-mono)' }}>03</span>
              <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>Juega y Co-evalúa</h3>
              <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                Responde en vivo. Los alumnos evalúan y califican las respuestas de sus compañeros, construyendo aprendizaje mutuo y sumando puntos al ranking.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* DESIGN TASTE FEATURES SECTION */}
      <section className="features-section" style={{ padding: '100px 0', position: 'relative' }}>
        {/* Biology Background SVG */}
        <svg className="section-svg-bg" viewBox="0 0 1200 600" style={{ opacity: 0.12 }}>
          <g transform="translate(150, 300)">
            <g className="dna-helix">
              <path d="M -80 -150 Q -30 0 20 150" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="2" fill="none" />
              <path d="M 20 -150 Q -30 0 -80 150" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="2" fill="none" />
              <line x1="-70" y1="-120" x2="10" y2="-120" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <line x1="-60" y1="-80" x2="0" y2="-80" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <line x1="-40" y1="-40" x2="-20" y2="-40" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <line x1="-30" y1="0" x2="-30" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <line x1="-20" y1="40" x2="-40" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <line x1="0" y1="80" x2="-60" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <line x1="10" y1="120" x2="-70" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            </g>
          </g>
          <g transform="translate(1000, 250)">
            <circle cx="0" cy="0" r="12" fill="rgba(129, 140, 248, 0.6)" />
            <line x1="0" y1="0" x2="-60" y2="-50" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="70" y2="-20" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="-40" y2="60" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="50" y2="70" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="1.5" />
            <circle cx="-60" cy="-50" r="6" fill="rgba(52, 211, 153, 0.5)" className="twinkle-star" style={{ animationDelay: '0s' }} />
            <circle cx="70" cy="-20" r="7" fill="rgba(251, 146, 60, 0.5)" className="twinkle-star" style={{ animationDelay: '1s' }} />
            <circle cx="-40" cy="60" r="5" fill="rgba(244, 63, 94, 0.5)" className="twinkle-star" style={{ animationDelay: '2s' }} />
            <circle cx="50" cy="70" r="8" fill="rgba(129, 140, 248, 0.5)" className="twinkle-star" style={{ animationDelay: '0.5s' }} />
          </g>
          <g transform="translate(600, 500)">
            <path d="M 0 0 C -30 -30 -30 -70 0 -100 C 30 -70 30 -30 0 0" fill="none" stroke="rgba(52, 211, 153, 0.3)" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="0" y2="-90" stroke="rgba(52, 211, 153, 0.3)" strokeWidth="1.5" />
            <line x1="0" y1="-30" x2="-15" y2="-50" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="1" />
            <line x1="0" y1="-50" x2="15" y2="-70" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="1" />
          </g>
        </svg>

        <div className="container">
          <div className="section-header" style={{ marginBottom: '80px', textAlign: 'center' }}>
            <h2 className="section-title" style={{ fontSize: '46px', fontWeight: '700', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>Diseñado para el Aula de Hoy</h2>
            <p className="section-desc" style={{ fontSize: '18px', color: '#cbd5e1' }}>Interactividad, seguridad y control pedagógico total en una interfaz que a los niños les encanta.</p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px' }}>
            
            <div className="bento-glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '20px', 
                  background: 'rgba(99, 102, 241, 0.15)', 
                  color: '#818cf8', 
                  border: '2px solid rgba(99, 102, 241, 0.3)',
                  fontSize: '28px',
                  marginBottom: '28px'
                }}>
                  <GameController weight="fill" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '14px', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>Gamificación Activa</h3>
                <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Turnos secuenciales visibles, indicadores de preparación de alumnos y un sistema de puntajes dinámicos que promueve la sana competencia en la sala.
                </p>
              </div>
            </div>

            <div className="bento-glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '20px', 
                  background: 'rgba(249, 115, 22, 0.15)', 
                  color: '#fb923c', 
                  border: '2px solid rgba(249, 115, 22, 0.3)',
                  fontSize: '28px',
                  marginBottom: '28px'
                }}>
                  <ShieldCheck weight="fill" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '14px', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>Seguridad Escolar RLS</h3>
                <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Validación rigurosa de accesos contra la Whitelist de correos configurada por el apoderado o tutor. Datos escolares totalmente protegidos a nivel de base de datos.
                </p>
              </div>
            </div>

            <div className="bento-glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '20px', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: '#34d399', 
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '28px',
                  marginBottom: '28px'
                }}>
                  <Trophy weight="fill" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '14px', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>Evaluación por Pares</h3>
                <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  Fomenta el criterio y análisis crítico: los propios alumnos evalúan y califican las respuestas de sus compañeros en vivo bajo rúbricas amigables.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section" style={{ padding: '100px 0', position: 'relative' }}>
        {/* Literature/History Background SVG */}
        <svg className="section-svg-bg" viewBox="0 0 1200 600" style={{ opacity: 0.13 }}>
          <g transform="translate(150, 280) scale(0.9)" className="book-float">
            <path d="M -80 0 Q -40 -30 0 0 Q 40 -30 80 0 L 80 60 Q 40 30 0 60 Q -40 30 -80 60 Z" />
            <line x1="0" y1="0" x2="0" y2="60" />
            <line x1="-60" y1="15" x2="-20" y2="15" style={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />
            <line x1="-60" y1="30" x2="-20" y2="30" style={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />
            <line x1="20" y1="15" x2="60" y2="15" style={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />
            <line x1="20" y1="30" x2="60" y2="30" style={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />
          </g>
          <g transform="translate(1050, 250)">
            <path d="M -30 30 L 10 -40 C 20 -60 15 -70 10 -70 C 5 -70 -5 -60 -15 -45 L -45 5 Z" fill="none" stroke="rgba(167, 139, 250, 0.35)" strokeWidth="1.5" style={{ transform: 'rotate(-10deg)', transformOrigin: 'bottom left' }} />
            <path d="M -60 40 L -30 40 L -30 65 L -65 65 Z" fill="none" stroke="rgba(167, 139, 250, 0.35)" strokeWidth="1.5" />
            <ellipse cx="-45" cy="40" rx="15" ry="4" fill="none" stroke="rgba(167, 139, 250, 0.35)" strokeWidth="1.5" />
          </g>
          <g transform="translate(600, 450) scale(0.7)">
            <circle cx="0" cy="0" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <path d="M 0 -60 L 10 0 L 0 10 L -10 0 Z" fill="rgba(167, 139, 250, 0.4)" stroke="rgba(167, 139, 250, 0.6)" />
            <path d="M 0 60 L 10 0 L 0 10 L -10 0 Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" />
            <path d="M 60 0 L 0 10 L -10 0 L 0 -10 Z" fill="rgba(167, 139, 250, 0.3)" stroke="rgba(167, 139, 250, 0.5)" />
            <path d="M -60 0 L 0 10 L -10 0 L 0 -10 Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" />
          </g>
        </svg>

        <div className="container">
          <div className="section-header" style={{ marginBottom: '64px', textAlign: 'center' }}>
            <h2 className="section-title" style={{ fontSize: '46px', fontWeight: '700', color: '#ffffff', fontFamily: 'Fredoka, sans-serif' }}>Lo que dicen los profesores</h2>
            <p className="section-desc" style={{ fontSize: '18px', color: '#cbd5e1' }}>EduQuiz ya está transformando la concentración y motivación de los alumnos en diversas asignaturas.</p>
          </div>

          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            
            <div className="bento-glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', color: '#fb923c', fontSize: '18px' }}>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <blockquote style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', fontStyle: 'normal', lineHeight: '1.6', marginBottom: '28px' }}>
                "Buscábamos una herramienta que permitiera a los estudiantes pensar de forma crítica sin comprometer la seguridad de sus datos escolares. El sistema de Whitelist y RLS de EduQuiz nos dio la tranquilidad técnica necesaria para el colegio."
              </blockquote>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                <div style={{ backgroundColor: '#6366f1', color: '#ffffff', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>AC</div>
                <div>
                  <cite style={{ fontWeight: '800', fontStyle: 'normal', color: '#ffffff', display: 'block', fontSize: '14px' }}>Andrea Castro</cite>
                  <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Directora Académica // Colegio San Agustín</span>
                </div>
              </div>
            </div>

            <div className="bento-glass-card" style={{ borderLeft: '4px solid #fb923c' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', color: '#fb923c', fontSize: '16px' }}>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <blockquote style={{ fontSize: '16px', color: '#cbd5e1', fontStyle: 'normal', lineHeight: '1.6', marginBottom: '28px' }}>
                "Mis alumnos de 7° básico ahora me piden jugar las trivias al final de cada clase de ciencias. Las dinámicas de turnos secuenciales en vivo los mantienen sumamente enfocados y motivados en la materia."
              </blockquote>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                <div style={{ backgroundColor: '#fb923c', color: '#ffffff', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>TL</div>
                <div>
                  <cite style={{ fontWeight: '800', fontStyle: 'normal', color: '#ffffff', display: 'block', fontSize: '13px' }}>Teresa Lara</cite>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Profesora de Ciencias // Liceo Bicentenario</span>
                </div>
              </div>
            </div>

            <div className="bento-glass-card" style={{ borderLeft: '4px solid #34d399' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', color: '#fb923c', fontSize: '16px' }}>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <blockquote style={{ fontSize: '16px', color: '#cbd5e1', fontStyle: 'normal', lineHeight: '1.6', marginBottom: '28px' }}>
                "La evaluación por pares enseña a mi hijo a argumentar por qué la respuesta de su compañero es correcta o no. Ha sido una excelente herramienta pedagógica complementaria para el estudio en casa."
              </blockquote>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                <div style={{ backgroundColor: '#34d399', color: '#ffffff', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>ML</div>
                <div>
                  <cite style={{ fontWeight: '800', fontStyle: 'normal', color: '#ffffff', display: 'block', fontSize: '13px' }}>Mauricio Lara</cite>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Apoderado y Tutor Escolar</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="landing-cta-section" style={{ padding: '120px 0', position: 'relative' }}>
        {/* Engineering/Technology Background SVG */}
        <svg className="section-svg-bg" viewBox="0 0 1200 500" style={{ opacity: 0.12 }}>
          <g transform="translate(180, 250)">
            <g className="gear-rotate">
              <circle cx="0" cy="0" r="50" />
              <rect x="-10" y="-60" width="20" height="120" rx="3" />
              <rect x="-10" y="-60" width="20" height="120" rx="3" style={{ transform: 'rotate(30deg)' }} />
              <rect x="-10" y="-60" width="20" height="120" rx="3" style={{ transform: 'rotate(60deg)' }} />
              <rect x="-10" y="-60" width="20" height="120" rx="3" style={{ transform: 'rotate(90deg)' }} />
              <rect x="-10" y="-60" width="20" height="120" rx="3" style={{ transform: 'rotate(120deg)' }} />
              <rect x="-10" y="-60" width="20" height="120" rx="3" style={{ transform: 'rotate(150deg)' }} />
              <circle cx="0" cy="0" r="30" style={{ fill: '#0c1020' }} />
              <circle cx="0" cy="0" r="8" />
            </g>
            <g transform="translate(86, 60)">
              <g className="gear-rotate gear-rotate-reverse" style={{ animationDuration: '12s' }}>
                <circle cx="0" cy="0" r="30" />
                <rect x="-6" y="-36" width="12" height="72" rx="2" />
                <rect x="-6" y="-36" width="12" height="72" rx="2" style={{ transform: 'rotate(45deg)' }} />
                <rect x="-6" y="-36" width="12" height="72" rx="2" style={{ transform: 'rotate(90deg)' }} />
                <rect x="-6" y="-36" width="12" height="72" rx="2" style={{ transform: 'rotate(135deg)' }} />
                <circle cx="0" cy="0" r="18" style={{ fill: '#0c1020' }} />
                <circle cx="0" cy="0" r="5" />
              </g>
            </g>
          </g>
          <g transform="translate(950, 150)">
            <path d="M 0 0 L 80 0 L 120 40 L 120 120 M 80 0 L 100 -20" fill="none" stroke="rgba(96, 165, 250, 0.35)" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="5" fill="rgba(96, 165, 250, 0.5)" />
            <circle cx="120" cy="120" r="5" fill="rgba(96, 165, 250, 0.5)" />
            <circle cx="100" cy="-20" r="4" fill="rgba(52, 211, 153, 0.5)" />
            <rect x="30" y="-15" width="24" height="30" rx="3" fill="none" stroke="rgba(96, 165, 250, 0.35)" strokeWidth="1.5" />
          </g>
          <g transform="translate(750, 320) scale(0.8)">
            <path d="M 0 100 Q 50 20 150 0" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="6 6" />
            <polygon points="150,0 135,10 142,0 135,-10" fill="rgba(255,255,255,0.25)" style={{ transform: 'rotate(-10deg)' }} />
          </g>
        </svg>

        <div className="container">
          <div className="bento-glass-card" style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'radial-gradient(circle at top right, rgba(99,102,241,0.1) 0%, transparent 60%)' }}>
            <h2 style={{ fontSize: '46px', fontWeight: '700', color: '#ffffff', marginBottom: '20px', letterSpacing: '-0.01em', lineHeight: '1.2', fontFamily: 'Fredoka, sans-serif' }}>¿Listo para transformar tus clases hoy mismo?</h2>
            <p style={{ fontSize: '18px', color: '#cbd5e1', maxWidth: '640px', marginBottom: '40px', lineHeight: '1.6' }}>
              Únete a los colegios y apoderados que ya están revolucionando el aprendizaje interactivo con gamificación activa y segura.
            </p>
            <a 
              href="https://wa.me/56993005959" 
              className="pulse-primary-btn"
              target="_blank" 
              rel="noopener noreferrer"
              style={{ padding: '18px 44px', textDecoration: 'none', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)' }}
            >
              <WhatsappLogo weight="fill" size={28} />
              ¡¡¡Pruébalo ya!!!
            </a>
          </div>
        </div>
      </section>

      <footer className="landing-footer" style={{ textAlign: 'center', padding: '40px 0 30px', backgroundColor: '#070a14' }}>
        <p style={{ fontSize: '13px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          EduQuiz © 2026 // Creado por Mauricio Lara
        </p>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a 
        href="https://wa.me/56993005959" 
        className="whatsapp-pulse-btn"
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Contacto por WhatsApp"
      >
        <WhatsappLogo weight="fill" size={38} />
      </a>
    </div>
  );
}
