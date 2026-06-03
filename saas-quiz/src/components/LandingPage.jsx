import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkle, GameController, ShieldCheck, Trophy, Play, EnvelopeSimple, Lock, User, WhatsappLogo } from '@phosphor-icons/react';

export default function LandingPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, selectDemoUser } = useAuth();
  
  // Auth Form State
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUpWithEmail(email, password, name);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setErrorMsg(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="container">
          <div className="hero-grid">
            
            {/* Left Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <span className="landing-badge">✨ Plataforma Educativa SaaS de Próxima Generación</span>
              <h1 className="landing-title" style={{ textAlign: 'left' }}>
                El juego de preguntas que transforma el <span>aula</span>
              </h1>
              <p className="landing-subtitle" style={{ textAlign: 'left', maxWidth: '580px', marginLeft: 0 }}>
                Crea salas en tiempo real, fomenta el aprendizaje colaborativo con evaluación por pares y mantén a tus alumnos motivados con dinámicas gamificadas.
              </p>
              
              <div style={{ width: '100%' }}>
                <div className="cta-group">
                  <button className="btn btn-primary" onClick={() => setShowEmailForm(!showEmailForm)}>
                    <EnvelopeSimple weight="bold" size={20} />
                    {showEmailForm ? 'Ocultar Formulario' : 'Iniciar Sesión con Correo'}
                  </button>
                </div>


                {/* Email Form Panel - nested double bezel */}
                {showEmailForm && (
                  <div className="double-bezel-outer" style={{ maxWidth: '420px', marginTop: '24px', textAlign: 'left' }}>
                    <div className="double-bezel-inner">
                      <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '800', color: 'var(--brand-dark)' }}>
                        {isSignUp ? 'Crear cuenta de Estudiante' : 'Iniciar Sesión'}
                      </h3>
                      
                      {errorMsg && (
                        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
                          ✕ {errorMsg}
                        </div>
                      )}

                      {successMsg && (
                        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
                          ✓ {successMsg}
                        </div>
                      )}

                      <form onSubmit={handleAuthSubmit}>
                        {isSignUp && (
                          <div className="form-group">
                            <label className="form-label">Tu Nombre</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Ej: Benjamín Díaz"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label className="form-label">Correo Electrónico</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            placeholder="alumno@colegio.cl"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Contraseña</label>
                          <input 
                            type="password" 
                            className="form-input" 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>

                        <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                          {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
                        </button>
                      </form>

                      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
                        <button 
                          onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); }}
                          style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: '800' }}
                        >
                          {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Asset Column - Double Bezel Mockup */}
            <div className="double-bezel-outer">
              <div className="double-bezel-inner" style={{ padding: '16px', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>eduquiz.cl/game/demo</span>
                </div>
                <div style={{ width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-sm)', position: 'relative', aspectRatio: '16/9' }}>
                  <video 
                    src="/promo_video.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.85 }}
                  >
                    <track 
                      src="/subtitles.vtt" 
                      kind="subtitles" 
                      srcLang="es" 
                      label="Español" 
                      default 
                    />
                  </video>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95), transparent 70%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px', textAlign: 'left' }}>
                    <span className="tag tag-success" style={{ width: 'fit-content', marginBottom: '8px' }}>En Vivo</span>
                    <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '4px', letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' }}>EduQuiz en Acción</h3>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Descubre cómo funciona la gamificación interactiva en tiempo real.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">+10.000</span>
              <span className="stat-label">Preguntas respondidas en vivo</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">98%</span>
              <span className="stat-label">De retención y participación</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">150+</span>
              <span className="stat-label">Profesores activos semanalmente</span>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">¿Cómo Funciona EduQuiz?</h2>
            <p className="section-desc">Tres simples pasos para transformar tu sala de clases en un entorno interactivo.</p>
          </div>

          <div className="how-it-works-grid">
            <div className="double-bezel-outer">
              <div className="double-bezel-inner step-card" style={{ padding: '32px' }}>
                <span className="step-number">01</span>
                <h3 className="step-title" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Crea el Desafío</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, paddingRight: '24px' }}>
                  Ingresa tus preguntas didácticas en pocos segundos o deja que nuestro motor te sugiera opciones.
                </p>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner step-card" style={{ padding: '32px' }}>
                <span className="step-number">02</span>
                <h3 className="step-title" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Comparte el Código</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, paddingRight: '24px' }}>
                  Los estudiantes ingresan al lobby de juego al instante usando su correo y un código rápido. Sin registros complejos.
                </p>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner step-card" style={{ padding: '32px' }}>
                <span className="step-number">03</span>
                <h3 className="step-title" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Juega y Co-evalúa</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, paddingRight: '24px' }}>
                  Responde en vivo. Los alumnos evalúan y califican las respuestas de sus compañeros, asignando puntos al ranking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Diseñado para el Aula de Hoy</h2>
            <p className="section-desc">Interactividad, seguridad y control pedagógico total en una interfaz que a los niños les encanta.</p>
          </div>

          <div className="features-grid">
            <div className="double-bezel-outer">
              <div className="double-bezel-inner card-feature-gamificacion" style={{ padding: '32px' }}>
                <div className="feature-icon">
                  <GameController weight="fill" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Gamificación Activa</h3>
                <p style={{ fontSize: '14px', margin: 0 }}>Turnos secuenciales visibles, indicadores de preparación y un sistema de puntajes dinámicos que promueve la sana competencia.</p>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner card-feature-seguridad" style={{ padding: '32px' }}>
                <div className="feature-icon">
                  <ShieldCheck weight="fill" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Seguridad Escolar RLS</h3>
                <p style={{ fontSize: '14px', margin: 0 }}>Validación rigurosa de accesos contra la Whitelist de correos configurada por el apoderado o tutor. Datos totalmente protegidos.</p>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner card-feature-evaluacion" style={{ padding: '32px' }}>
                <div className="feature-icon">
                  <Trophy weight="fill" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Evaluación por Pares</h3>
                <p style={{ fontSize: '14px', margin: 0 }}>Fomenta el criterio y análisis crítico: los propios alumnos evalúan y califican las respuestas de sus compañeros en vivo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Lo que dicen los profesores</h2>
            <p className="section-desc">EduQuiz ya está transformando la concentración y motivación de los alumnos en diversas asignaturas.</p>
          </div>

          <div className="testimonials-grid">
            {/* Testimonio Principal (Destacado Bento) */}
            <div className="double-bezel-outer testimonial-card featured">
              <div className="double-bezel-inner" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div className="stars-container" style={{ display: 'flex', gap: '4px', marginBottom: '16px', color: '#f59e0b' }}>
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <blockquote style={{ fontSize: '18px', fontWeight: '500', fontStyle: 'italic', color: 'var(--text-main)', margin: '0 0 24px', lineHeight: '1.5' }}>
                    "Buscábamos una herramienta que permitiera a los estudiantes pensar de forma crítica sin comprometer la seguridad de sus datos escolares. El sistema de Whitelist y RLS de EduQuiz nos dio la tranquilidad técnica necesaria para implementarlo en todo el colegio."
                  </blockquote>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="testimonial-avatar" style={{ backgroundColor: 'var(--brand)', color: '#ffffff' }}>AC</div>
                  <div>
                    <cite style={{ fontWeight: '800', fontStyle: 'normal', color: 'var(--text-main)', display: 'block', fontSize: '14px' }}>Andrea Castro</cite>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Directora Académica // Colegio San Agustín</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonio Secundario 1 */}
            <div className="double-bezel-outer testimonial-card">
              <div className="double-bezel-inner" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div className="stars-container" style={{ display: 'flex', gap: '4px', marginBottom: '16px', color: '#f59e0b' }}>
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <blockquote style={{ fontSize: '15px', fontStyle: 'italic', color: 'var(--text-main)', margin: '0 0 24px', lineHeight: '1.6' }}>
                    "Mis alumnos de 7° básico ahora me piden jugar las trivias al final de cada clase de ciencias. Las dinámicas de turnos secuenciales en vivo los mantienen sumamente enfocados y motivados."
                  </blockquote>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="testimonial-avatar" style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}>TL</div>
                  <div>
                    <cite style={{ fontWeight: '800', fontStyle: 'normal', color: 'var(--text-main)', display: 'block', fontSize: '13px' }}>Teresa Lara</cite>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profesora de Ciencias // Liceo Bicentenario</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonio Secundario 2 */}
            <div className="double-bezel-outer testimonial-card">
              <div className="double-bezel-inner" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <div className="stars-container" style={{ display: 'flex', gap: '4px', marginBottom: '16px', color: '#f59e0b' }}>
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <blockquote style={{ fontSize: '15px', fontStyle: 'italic', color: 'var(--text-main)', margin: '0 0 24px', lineHeight: '1.6' }}>
                    "La evaluación por pares enseña a mi hijo a argumentar por qué la respuesta de su compañero es correcta o no. Ha sido una excelente herramienta pedagógica complementaria."
                  </blockquote>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="testimonial-avatar" style={{ backgroundColor: '#10b981', color: '#ffffff' }}>ml</div>
                  <div>
                    <cite style={{ fontWeight: '800', fontStyle: 'normal', color: 'var(--text-main)', display: 'block', fontSize: '13px' }}>Mauricio Lara</cite>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Apoderado y Tutor Escolar</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="landing-cta-section">
        <div className="container">
          <div className="double-bezel-outer cta-banner-outer">
            <div className="double-bezel-inner cta-banner-inner">
              <h2 className="cta-title">¿Listo para transformar tus clases hoy mismo?</h2>
              <p className="cta-subtitle">
                Únete a los colegios y apoderados que ya están revolucionando el aprendizaje interactivo con gamificación activa y segura.
              </p>
              <a 
                href="https://wa.me/56993005959" 
                className="btn btn-primary cta-btn-whatsapp"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <WhatsappLogo weight="fill" size={24} />
                ¡¡¡Pruébalo ya!!!
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer" style={{ textAlign: 'center', padding: '40px 0 20px', borderTop: '1px solid var(--border-light)', marginTop: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          EduQuiz © 2026 // Creado por Mauricio Lara
        </p>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a 
        href="https://wa.me/56993005959" 
        className="whatsapp-float" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Contacto por WhatsApp"
      >
        <WhatsappLogo weight="fill" size={32} />
      </a>
    </div>
  );
}

