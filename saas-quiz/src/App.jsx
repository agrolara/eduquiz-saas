import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
import LandingPage from './components/LandingPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CourseAdminDashboard from './components/CourseAdminDashboard';
import GameRoom from './components/GameRoom';
import { 
  Trophy, Key, SignOut, Shield, 
  GameController, Users, Globe, Play 
} from '@phosphor-icons/react';

function AppContent() {
  const { user, profile, loading, signOut, demoMode, setDemoMode, selectDemoUser, hasKeys } = useAuth();
  const [activeSession, setActiveSession] = useState(null);

  // Default Course Lobby State for Students
  const [sessionCodeInput, setSessionCodeInput] = useState('');
  
  // Real database session for players
  const [activeDbSession, setActiveDbSession] = useState(null);
  const [loadingDbSession, setLoadingDbSession] = useState(false);

  useEffect(() => {
    if (demoMode || !profile?.curso_id) return;

    const fetchActiveSession = async () => {
      setLoadingDbSession(true);
      const { data, error } = await supabase
        .from('sesiones_juego')
        .select('*')
        .eq('curso_id', profile.curso_id)
        .neq('estado', 'finalizado')
        .order('creado_en', { ascending: false })
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setActiveDbSession(data[0]);
      } else {
        setActiveDbSession(null);
      }
      setLoadingDbSession(false);
    };

    fetchActiveSession();

    // Subscribe to session changes for the course in real time
    const channel = supabase.channel(`course_sessions:${profile.curso_id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sesiones_juego', 
        filter: `curso_id=eq.${profile.curso_id}` 
      }, () => {
        fetchActiveSession();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.curso_id, demoMode]);

  // Fetch historical rankings for students
  const [rankings, setRankings] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(false);

  const demoRankings = [
    {
      id: 'rank-1',
      nombre: 'Sofía Castro',
      email: 'alumna.sofia@gmail.com',
      puntaje_total: 120,
      sesiones_jugadas: 3,
      historial_participacion: [
        { sesion_id: 's-demo-1', sesion_nombre: 'Trivia de Geografía', fecha: '2026-06-01', puntaje_obtenido: 50 },
        { sesion_id: 's-demo-2', sesion_nombre: 'Desafío de Fracciones', fecha: '2026-06-02', puntaje_obtenido: 40 },
        { sesion_id: 's-demo-3', sesion_nombre: 'Historia de Chile', fecha: '2026-06-03', puntaje_obtenido: 30 }
      ]
    },
    {
      id: 'rank-2',
      nombre: 'Benjamín Díaz',
      email: 'alumno.benjamin@gmail.com',
      puntaje_total: 95,
      sesiones_jugadas: 3,
      historial_participacion: [
        { sesion_id: 's-demo-1', sesion_nombre: 'Trivia de Geografía', fecha: '2026-06-01', puntaje_obtenido: 35 },
        { sesion_id: 's-demo-2', sesion_nombre: 'Desafío de Fracciones', fecha: '2026-06-02', puntaje_obtenido: 30 },
        { sesion_id: 's-demo-3', sesion_nombre: 'Historia de Chile', fecha: '2026-06-03', puntaje_obtenido: 30 }
      ]
    },
    {
      id: 'rank-3',
      nombre: 'Mateo Rivas',
      email: 'alumno.mateo@gmail.com',
      puntaje_total: 80,
      sesiones_jugadas: 2,
      historial_participacion: [
        { sesion_id: 's-demo-1', sesion_nombre: 'Trivia de Geografía', fecha: '2026-06-01', puntaje_obtenido: 40 },
        { sesion_id: 's-demo-2', sesion_nombre: 'Desafío de Fracciones', fecha: '2026-06-02', puntaje_obtenido: 40 }
      ]
    },
    {
      id: 'rank-4',
      nombre: 'Valentina Silva',
      email: 'alumna.valentina@gmail.com',
      puntaje_total: 75,
      sesiones_jugadas: 2,
      historial_participacion: [
        { sesion_id: 's-demo-1', sesion_nombre: 'Trivia de Geografía', fecha: '2026-06-01', puntaje_obtenido: 45 },
        { sesion_id: 's-demo-3', sesion_nombre: 'Historia de Chile', fecha: '2026-06-03', puntaje_obtenido: 30 }
      ]
    }
  ];

  useEffect(() => {
    if (demoMode) {
      setRankings(demoRankings);
      return;
    }

    if (!profile?.curso_id) {
      setRankings([]); // Clear rankings while loading real profile to avoid mock leakage
      return;
    }

    const fetchRankings = async () => {
      setLoadingRankings(true);
      
      const { data: ranks, error: rankErr } = await supabase
        .from('rankings')
        .select('*')
        .eq('curso_id', profile.curso_id)
        .order('puntaje_total', { ascending: false });

      if (rankErr) {
        console.error("Error fetching rankings for player:", rankErr);
        setLoadingRankings(false);
        return;
      }

      if (!ranks || ranks.length === 0) {
        setRankings([]);
        setLoadingRankings(false);
        return;
      }

      const { data: profiles, error: profErr } = await supabase
        .from('perfiles_usuarios')
        .select('id, nombre, email')
        .eq('curso_id', profile.curso_id);

      if (profErr) {
        console.error("Error fetching profiles for rankings:", profErr);
      }

      const profileMap = {};
      profiles?.forEach(p => {
        profileMap[p.id] = p;
      });

      const formatted = ranks.map(r => ({
        id: r.id,
        nombre: profileMap[r.usuario_id]?.nombre || profileMap[r.usuario_id]?.email || 'Estudiante',
        email: profileMap[r.usuario_id]?.email || 'Desconocido',
        puntaje_total: r.puntaje_total,
        sesiones_jugadas: r.sesiones_jugadas || 0,
        historial_participacion: r.historial_participacion || []
      }));

      setRankings(formatted);
      setLoadingRankings(false);
    };

    fetchRankings();

    // Subscribe to rankings update
    const channel = supabase.channel(`course_rankings:${profile.curso_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rankings',
        filter: `curso_id=eq.${profile.curso_id}`
      }, () => {
        fetchRankings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.curso_id, demoMode]);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div className="user-avatar animate-spin" style={{ width: '48px', height: '48px', fontSize: '20px' }}>⚡</div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Iniciando sesión segura...</p>
      </div>
    );
  }

  // Handle switching to a active session
  const handleJoinSession = (id, name) => {
    setActiveSession({ id, name });
  };

  return (
    <div className="app-root">
      {/* Demo Mode Control Header */}
      {demoMode && (
        <div className="demo-banner">
          <div>
            <span>🚀 <strong>Modo Demostración Activo</strong></span>
            {!hasKeys && <span style={{ marginLeft: '12px', fontSize: '12px', opacity: 0.8 }}>(Configura VITE_SUPABASE_URL para conectar base de datos real)</span>}
          </div>
          <div className="demo-controls">
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Simular Rol:</span>
            <button 
              className={`demo-btn ${profile?.rol === 'super_admin' ? 'active' : ''}`}
              onClick={() => selectDemoUser('super_admin')}
            >
              Mauricio (Super Admin)
            </button>
            <button 
              className={`demo-btn ${profile?.rol === 'admin_curso' ? 'active' : ''}`}
              onClick={() => selectDemoUser('admin_curso')}
            >
              Teresa (Apoderado/Teacher)
            </button>
            <button 
              className={`demo-btn ${profile?.rol === 'jugador' ? 'active' : ''}`}
              onClick={() => selectDemoUser('jugador')}
            >
              Benjamín (Alumno)
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-icon">▲</div>
          <span>EduQuiz</span>
        </div>
        
        <div className="nav-links">
          {user ? (
            <>
              <div className="user-profile-badge">
                <span className="user-avatar">{profile?.nombre ? profile.nombre[0] : 'U'}</span>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>{profile?.nombre}</div>
                  <div className="user-role-label">
                    {profile?.rol === 'super_admin' 
                      ? 'Super Admin' 
                      : profile?.rol === 'admin_curso' 
                        ? 'Administrador' 
                        : profile?.rol === 'jugador' 
                          ? 'Jugador' 
                          : 'Cargando perfil...'}
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={signOut} 
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <SignOut size={16} /> Cerrar Sesión
              </button>
            </>
          ) : (
            <button 
              className="btn btn-secondary" 
              onClick={() => selectDemoUser('super_admin')} 
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <Key size={16} /> Acceso Rápido (Demo)
            </button>
          )}
        </div>
      </header>

      {/* Content Router */}
      <main className="app-body">
        {!user ? (
          <LandingPage />
        ) : activeSession ? (
          <div className="container" style={{ padding: '32px 0' }}>
            <GameRoom 
              sessionId={activeSession.id} 
              sessionName={activeSession.name} 
              onLeave={() => setActiveSession(null)} 
            />
          </div>
        ) : (
          <div className="container" style={{ padding: '40px 0' }}>
            
            {/* PROFILE LOADING / NOT FOUND FALLBACK */}
            {user && !profile && (
              <div className="card" style={{ textAlign: 'center', padding: '48px 32px', maxWidth: '500px', margin: '40px auto' }}>
                <div className="user-avatar animate-spin" style={{ width: '48px', height: '48px', fontSize: '20px', margin: '0 auto 16px' }}>⚡</div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Cargando perfil...</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                  Estamos preparando tu sesión de estudiante. Si tarda más de unos segundos, intenta recargar la página.
                </p>
                <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ margin: '0 auto' }}>
                  Recargar Página
                </button>
              </div>
            )}

            {/* SUPER ADMIN VIEW */}
            {profile?.rol === 'super_admin' && (
              <SuperAdminDashboard />
            )}

            {/* COURSE ADMIN VIEW */}
            {profile?.rol === 'admin_curso' && (
              <CourseAdminDashboard onStartSession={handleJoinSession} />
            )}

            {/* PLAYER (STUDENT) VIEW */}
            {profile?.rol === 'jugador' && (
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                
                {/* Active Session Lobby */}
                <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                  <GameController size={48} weight="fill" color="var(--brand)" style={{ marginBottom: '16px' }} />
                  <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>¡Hola {profile.nombre}!</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                    Ingresa a la sala de juego en vivo para responder el desafío de tu curso.
                  </p>

                  {demoMode ? (
                    <div style={{ backgroundColor: 'var(--brand-light)', border: '1px solid var(--border-focus)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '18px', color: 'var(--brand-dark)', marginBottom: '8px' }}>Partida Activa (Modo Demo)</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Trivia de Geografía - 7° Básico
                      </p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleJoinSession('demo-session-active', 'Trivia de Geografía')}
                      >
                        <Play weight="fill" /> Entrar a Jugar
                      </button>
                    </div>
                  ) : loadingDbSession ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Buscando partidas activas de tu curso...
                    </div>
                  ) : activeDbSession ? (
                    <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '18px', color: 'var(--success)', marginBottom: '8px' }}>🚀 Partida Activa en Vivo</h3>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '16px' }}>
                        {activeDbSession.nombre}
                      </p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleJoinSession(activeDbSession.id, activeDbSession.nombre)}
                        style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                      >
                        <Play weight="fill" /> Entrar a Jugar
                      </button>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: 'var(--warning-bg)', border: '1px dashed var(--warning)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', color: '#b45309', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        🕒 Esperando partida activa
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Tu profesor aún no ha iniciado la sesión de juego de hoy para tu curso. En cuanto la inicie, esta pantalla se actualizará automáticamente.
                      </p>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
                    <label className="form-label" style={{ textAlign: 'left' }}>O ingresa un código de sala:</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej: SESS-1234"
                        value={sessionCodeInput}
                        onChange={(e) => setSessionCodeInput(e.target.value)}
                      />
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          if (sessionCodeInput) {
                            handleJoinSession(sessionCodeInput, `Partida Especial (${sessionCodeInput})`);
                          } else {
                            alert("Por favor ingresa un código válido.");
                          }
                        }}
                      >
                        Unirse
                      </button>
                    </div>
                  </div>
                </div>

                {/* Student Scoreboard summary */}
                <div className="card">
                  <h3 className="card-title">
                    <Trophy weight="fill" size={20} color="var(--warning)" />
                    Tu Historial de Medallas
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '16px 0' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="user-avatar" style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', color: '#b45309', fontSize: '20px', margin: '0 auto 8px' }}>🥇</div>
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>1er Lugar (2)</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="user-avatar" style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '20px', margin: '0 auto 8px' }}>🥈</div>
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>2do Lugar (1)</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="user-avatar" style={{ width: '48px', height: '48px', backgroundColor: '#ffedd5', color: '#c2410c', fontSize: '20px', margin: '0 auto 8px' }}>🥉</div>
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>3er Lugar (4)</span>
                    </div>
                  </div>
                </div>

                {/* Ranking Histórico del Curso */}
                <div className="card">
                  <h3 className="card-title">
                    <Trophy weight="fill" size={20} color="var(--brand)" />
                    Ranking Histórico del Curso
                  </h3>
                  {loadingRankings ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Cargando ranking histórico...
                    </div>
                  ) : rankings.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aún no hay puntuaciones registradas en este curso.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Posición</th>
                            <th>Alumno</th>
                            <th style={{ textAlign: 'center' }}>Partidas Jugadas</th>
                            <th style={{ textAlign: 'right' }}>Puntos Totales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((student, index) => {
                            const isMe = student.email === profile?.email;
                            return (
                              <tr key={student.id} style={isMe ? { backgroundColor: 'var(--brand-light)', borderLeft: '3px solid var(--brand)' } : {}}>
                                <td style={{ fontWeight: '800' }}>#{index + 1}</td>
                                <td>
                                  <span style={{ fontWeight: '700' }}>{student.nombre}</span> {isMe && <span className="tag tag-success" style={{ marginLeft: '6px', fontSize: '10px' }}>Tú</span>}
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {student.historial_participacion && student.historial_participacion.length > 0 ? (
                                      <span>Partidas: {student.historial_participacion.map(h => `${h.sesion_nombre} (${h.puntaje_obtenido} pts)`).join(', ')}</span>
                                    ) : (
                                      <span>Sin participación registrada</span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: '600' }}>{student.sesiones_jugadas || 0}</td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--brand)' }}>{student.puntaje_total} pts</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '40px auto', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#991b1b', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: 'bold' }}>⚠️ Algo salió mal al cargar el juego</h2>
          <p style={{ marginBottom: '16px' }}>Ha ocurrido un error inesperado. Comparte este mensaje con el administrador:</p>
          <pre style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca', overflowX: 'auto', fontSize: '13px', fontFamily: 'monospace' }}>
            {this.state.error?.toString()}
            {"\n\nStack Trace:"}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#991b1b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
