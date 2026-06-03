import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkle, GameController, ShieldCheck, Trophy, Play, EnvelopeSimple, Lock, User } from '@phosphor-icons/react';

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
          <span className="landing-badge">✨ Plataforma Educativa SaaS de Próxima Generación</span>
          <h1 className="landing-title">
            El juego de preguntas en <span>tiempo real</span> que transforma el aula
          </h1>
          <p className="landing-subtitle">
            Crea salas virtuales instantáneas, fomenta el aprendizaje colaborativo con lógica peer-to-peer y mantén a tus alumnos motivados con dinámicas gamificadas.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
            <div className="cta-group">
              <button className="btn btn-primary" onClick={signInWithGoogle}>
                <Sparkle weight="fill" size={20} />
                Iniciar con Google OAuth
              </button>
              
              <button className="btn btn-secondary" onClick={() => setShowEmailForm(!showEmailForm)}>
                <EnvelopeSimple weight="bold" size={20} />
                {showEmailForm ? 'Ocultar formulario' : 'Iniciar con Correo'}
              </button>

              <button className="btn btn-secondary" onClick={() => selectDemoUser('super_admin')}>
                <GameController weight="bold" size={20} />
                Entrar en Modo Demo
              </button>
            </div>

            {/* Email Form Panel */}
            {showEmailForm && (
              <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '24px', margin: '0 auto', textAlign: 'left', border: '1px solid var(--border-focus)' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '700', color: 'var(--brand-dark)' }}>
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
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontWeight: '700' }}
                  >
                    {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="video-container-wrapper">
            <div className="video-container">
              <img 
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200" 
                alt="Niños en el colegio participando en clases virtuales" 
                className="video-placeholder-bg"
              />
              <button className="video-play-btn" onClick={() => alert("Reproduciendo video explicativo... Descubre cómo el aprendizaje social incrementa la retención un 85%.")}>
                <Play weight="fill" />
              </button>
              <div className="video-overlay-text">
                <h4>Descubre la plataforma en 2 minutos</h4>
                <p>Ver cómo funciona la sincronización en tiempo real entre alumnos</p>
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
            <div className="feature-card">
              <div className="feature-icon">
                <GameController weight="fill" />
              </div>
              <h3>Gamificación Activa</h3>
              <p>Turnos secuenciales visibles, indicadores de preparación y un sistema de puntajes dinámicos que promueve la sana competencia.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <ShieldCheck weight="fill" />
              </div>
              <h3>Seguridad Escolar RLS</h3>
              <p>Validación rigurosa de accesos contra la Whitelist de correos configurada por el apoderado. Datos totalmente protegidos.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Trophy weight="fill" />
              </div>
              <h3>Evaluación por Pares</h3>
              <p>Fomenta el criterio y análisis crítico: los alumnos evalúan y califican las respuestas de sus compañeros de forma simple.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
