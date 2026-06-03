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
                  <button className="btn btn-primary" onClick={signInWithGoogle}>
                    <Sparkle weight="fill" size={20} />
                    Google OAuth
                  </button>
                  
                  <button className="btn btn-secondary" onClick={() => setShowEmailForm(!showEmailForm)}>
                    <EnvelopeSimple weight="bold" size={20} />
                    {showEmailForm ? 'Ocultar Correo' : 'Iniciar con Correo'}
                  </button>

                  <button className="btn btn-secondary" onClick={() => selectDemoUser('super_admin')}>
                    <GameController weight="bold" size={20} />
                    Entrar Demo
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
                <div style={{ width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-sm)', position: 'relative' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200" 
                    alt="Niños en el colegio participando en clases virtuales" 
                    style={{ width: '100%', display: 'block', opacity: 0.85 }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95), transparent 70%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px', textAlign: 'left' }}>
                    <span className="tag tag-success" style={{ width: 'fit-content', marginBottom: '8px' }}>En Vivo</span>
                    <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '4px', letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' }}>Desafío de Trivia de Geografía</h3>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Sincronización en tiempo real y co-evaluación activa de respuestas.</p>
                  </div>
                </div>
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
              <div className="double-bezel-inner" style={{ padding: '32px' }}>
                <div className="feature-icon">
                  <GameController weight="fill" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Gamificación Activa</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Turnos secuenciales visibles, indicadores de preparación y un sistema de puntajes dinámicos que promueve la sana competencia.</p>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner" style={{ padding: '32px' }}>
                <div className="feature-icon">
                  <ShieldCheck weight="fill" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Seguridad Escolar RLS</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Validación rigurosa de accesos contra la Whitelist de correos configurada por el apoderado o tutor. Datos totalmente protegidos.</p>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner" style={{ padding: '32px' }}>
                <div className="feature-icon">
                  <Trophy weight="fill" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Evaluación por Pares</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Fomenta el criterio y análisis crítico: los propios alumnos evalúan y califican las respuestas de sus compañeros en vivo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

