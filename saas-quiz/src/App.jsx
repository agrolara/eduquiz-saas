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
  const [showInstructionsModal, setShowInstructionsModal] = useState(true);

  // Default Course Lobby State for Students
  const [sessionCodeInput, setSessionCodeInput] = useState('');
  
  // Real database session for players
  const [activeDbSession, setActiveDbSession] = useState(null);
  const [loadingDbSession, setLoadingDbSession] = useState(false);

  // Notifications and Service Worker States
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [swRegistration, setSwRegistration] = useState(null);
  const [toast, setToast] = useState(null);
  const [demoNotificationCountdown, setDemoNotificationCountdown] = useState(null);

  const handleSimulateDelayedNotification = () => {
    if (demoNotificationCountdown !== null) return;
    
    let currentSeconds = 5;
    setDemoNotificationCountdown(currentSeconds);
    
    const interval = setInterval(() => {
      currentSeconds -= 1;
      if (currentSeconds <= 0) {
        clearInterval(interval);
        setDemoNotificationCountdown(null);
        triggerPushNotification(
          "¡Nueva Partida Programada! 🚀",
          "partida empieza en 10 minutos conectate pronto o quedaras fuera de esta partida",
          "demo-session-active",
          "Trivia de Geografía"
        );
      } else {
        setDemoNotificationCountdown(currentSeconds);
      }
    }, 1000);
  };

  // Keep ref of activeSession to use in Supabase subscription without resubscribing
  const activeSessionRef = React.useRef(activeSession);
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('SW registrado:', reg);
          setSwRegistration(reg);
        })
        .catch(err => console.error('Error SW:', err));

      navigator.serviceWorker.ready.then(reg => {
        console.log('SW listo y activo:', reg);
        setSwRegistration(reg);
      });
        
      const handleMessage = (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          const { sessionId, sessionName } = event.data.payload || {};
          if (sessionId && sessionName) {
            handleJoinSession(sessionId, sessionName);
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (frequency, startTime, duration, vol = 0.12) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(vol, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.1);      // C5
      playTone(659.25, now + 0.08, 0.1); // E5
      playTone(783.99, now + 0.16, 0.1); // G5
      playTone(1046.50, now + 0.24, 0.3); // C6
    } catch (err) {
      console.error(err);
    }
  };

  const triggerPushNotification = (title, body, sessionId, sessionName) => {
    playNotificationSound();
    
    // In-app visual toast
    setToast({ title, body, sessionId, sessionName });
    setTimeout(() => {
      setToast(prev => prev && prev.sessionId === sessionId ? null : prev);
    }, 8500);

    // Browser native push notification
    if (notificationPermission === 'granted') {
      const iconUrl = 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png';
      if (swRegistration) {
        swRegistration.showNotification(title, {
          body,
          icon: iconUrl,
          badge: iconUrl,
          vibrate: [200, 100, 200],
          data: {
            clickAction: window.location.origin,
            sessionId,
            sessionName
          }
        }).catch(err => {
          console.warn("SW showNotification failed, using fallback:", err);
          try {
            new Notification(title, { body, icon: iconUrl });
          } catch (e) {
            console.error("Direct Notification constructor failed:", e);
          }
        });
      } else {
        try {
          new Notification(title, {
            body,
            icon: iconUrl
          });
        } catch (e) {
          console.warn('Native notification fallback failed:', e);
        }
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones de escritorio.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        triggerPushNotification(
          "¡Notificaciones Activas! 🔔",
          "Recibirás una alerta aquí cuando tu profesor inicie una nueva partida programada.",
          "test-notification",
          "Test"
        );
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

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
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newSession = payload.new;
          if (profile?.rol === 'jugador' && (!activeSessionRef.current || activeSessionRef.current.id !== newSession.id)) {
            triggerPushNotification(
              "¡Nueva Partida Programada! 🚀",
              "partida empieza en 10 minutos conectate pronto o quedaras fuera de esta partida",
              newSession.id,
              newSession.nombre
            );
          }
        }
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

  useEffect(() => {
    if (user && profile?.rol === 'jugador') {
      const autoId = localStorage.getItem('autoJoinSessionId');
      const autoName = localStorage.getItem('autoJoinSessionName');
      if (autoId && autoName) {
        localStorage.removeItem('autoJoinSessionId');
        localStorage.removeItem('autoJoinSessionName');
        handleJoinSession(autoId, autoName);
      }
    }
  }, [user, profile]);

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

  // Dynamic Medal Count Calculation for logged-in student
  const getMedalsCount = () => {
    const medals = { gold: 0, silver: 0, bronze: 0 };
    if (!profile || !rankings.length) return medals;

    // Group scores by session
    const scoresBySession = {}; // { [sesion_id]: { [email]: score } }

    rankings.forEach(r => {
      if (Array.isArray(r.historial_participacion)) {
        r.historial_participacion.forEach(h => {
          if (!scoresBySession[h.sesion_id]) {
            scoresBySession[h.sesion_id] = {};
          }
          // Use email as unique identifier for both demo and real mode
          scoresBySession[h.sesion_id][r.email] = h.puntaje_obtenido || 0;
        });
      }
    });

    // Compute rank for each session
    Object.keys(scoresBySession).forEach(sesionId => {
      const sessionScores = scoresBySession[sesionId];
      const participants = Object.keys(sessionScores).map(email => ({
        email,
        score: sessionScores[email]
      })).sort((a, b) => b.score - a.score);

      // Assign ranks (handling ties!)
      let currentRank = 1;
      const rankedParticipants = [];
      participants.forEach((p, idx) => {
        if (idx > 0 && p.score < participants[idx - 1].score) {
          currentRank = idx + 1;
        }
        rankedParticipants.push({ ...p, rank: currentRank });
      });

      // Find logged-in user's rank in this session
      const myParticipation = rankedParticipants.find(p => p.email === profile.email);
      if (myParticipation) {
        if (myParticipation.rank === 1) {
          medals.gold++;
        } else if (myParticipation.rank === 2) {
          medals.silver++;
        } else if (myParticipation.rank === 3) {
          medals.bronze++;
        }
      }
    });

    return medals;
  };

  const medals = getMedalsCount();

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
            {profile?.rol === 'jugador' && (
              <>
                <button 
                  className="demo-btn" 
                  style={{ backgroundColor: 'var(--accent)', border: 'none', marginLeft: '12px', color: 'white', fontWeight: 'bold' }}
                  onClick={() => {
                    triggerPushNotification(
                      "¡Nueva Partida Programada! 🚀",
                      "partida empieza en 10 minutos conectate pronto o quedaras fuera de esta partida",
                      "demo-session-active",
                      "Trivia de Geografía"
                    );
                  }}
                >
                  🔔 Simular Ahora
                </button>
                <button 
                  className="demo-btn" 
                  style={{ backgroundColor: '#f59e0b', border: 'none', marginLeft: '8px', color: 'white', fontWeight: 'bold' }}
                  onClick={handleSimulateDelayedNotification}
                  disabled={demoNotificationCountdown !== null}
                >
                  {demoNotificationCountdown !== null ? `⏱️ Enviando en ${demoNotificationCountdown}s...` : '⏱️ Simular en 5s (Cierra la App)'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <header className="app-header" style={!user ? { backgroundColor: '#030712', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#ffffff' } : {}}>
        <div className="app-logo">
          <div className="logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M22 7v6" />
              <circle cx="22" cy="13" r="1" fill="currentColor" />
              <path d="M6 10v4c0 3.3 2.7 6 6 6s6-2.7 6-6v-4" />
            </svg>
          </div>
          <span className="hide-mobile" style={!user ? { color: '#ffffff' } : {}}>EduQuiz</span>
        </div>
        
        <div className="nav-links">
          {user ? (
            <>
              <div className="user-profile-badge">
                <span className="user-avatar">{profile?.nombre ? profile.nombre[0] : 'U'}</span>
                <div className="hide-mobile">
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
                <SignOut size={16} />
                <span className="hide-mobile"> Cerrar Sesión</span>
              </button>
            </>
          ) : (
            <a 
              href="https://wa.me/56993005959" 
              className="btn btn-primary" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ padding: '10px 20px', fontSize: '13px', textDecoration: 'none', fontWeight: '800' }}
            >
              ¡¡¡Pruébalo ya!!!
            </a>
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
              <>
                {showInstructionsModal && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                      border: '2px solid rgba(251, 191, 36, 0.4)',
                      borderRadius: '24px',
                      padding: '32px',
                      maxWidth: '550px',
                      width: '100%',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.25)',
                      textAlign: 'center',
                      animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      position: 'relative',
                      color: '#e2e8f0'
                    }}>
                      {/* Close button top right */}
                      <button 
                        onClick={() => setShowInstructionsModal(false)}
                        style={{
                          position: 'absolute',
                          top: '20px',
                          right: '20px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '20px',
                          cursor: 'pointer',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s, color 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
                      >
                        ✕
                      </button>

                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
                      
                      <h3 style={{ color: '#fbbf24', fontSize: '24px', fontWeight: '800', margin: '0 0 12px 0', fontFamily: 'Fredoka, sans-serif' }}>
                        📖 ¿Cómo se juega a EduQuiz?
                      </h3>
                      
                      <p style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '700', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                        ¡Hola! Este es un juego divertido en tiempo real donde aprenderemos en 3 fases rápidas:
                      </p>
                      
                      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '20px', lineHeight: '1' }}>✏️</span>
                          <div>
                            <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>Fase 1 - Escribir Preguntas (2 min)</h5>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                              Un compañero (o el profesor) redactará una pregunta inteligente sobre la materia de hoy.
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '20px', lineHeight: '1' }}>⚡</span>
                          <div>
                            <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>Fase 2 - Responder (3 min)</h5>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                              Todos los demás tendrán tiempo para escribir sus mejores respuestas en secreto.
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '20px', lineHeight: '1' }}>⭐</span>
                          <div>
                            <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>Fase 3 - Calificar (2 min)</h5>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                              Quien creó la pregunta (o el profesor) revisará y calificará las respuestas:
                              <span style={{ display: 'block', color: '#fbbf24', marginTop: '4px', fontWeight: '700' }}>
                                • Buena = 10 pts | • Regular = 5 pts | • Mala = 0 pts
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <button 
                        className="pulse-primary-btn" 
                        onClick={() => setShowInstructionsModal(false)}
                        style={{ width: '100%', justifyContent: 'center', padding: '14px 28px', fontSize: '16px' }}
                      >
                        ¡Entendido, a jugar! 🚀
                      </button>

                      <style>{`
                        @keyframes fadeIn {
                          from { opacity: 0; }
                          to { opacity: 1; }
                        }
                        @keyframes scaleUp {
                          from { transform: scale(0.9); opacity: 0; }
                          to { transform: scale(1); opacity: 1; }
                        }
                      `}</style>
                    </div>
                  </div>
                )}
                {notificationPermission !== 'granted' && (
                  <div className="card notification-prompt-card animate-slide-in" style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'var(--shadow-md)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="pulse-bell-container" style={{
                        fontSize: '28px',
                        background: 'rgba(255, 255, 255, 0.6)',
                        borderRadius: '50%',
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)'
                      }}>🔔</div>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ margin: '0 0 6px', fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>¿Quieres recibir avisos en tiempo real?</h4>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          Activa las notificaciones de escritorio para saber al instante cuando tu profesor inicie una nueva partida programada de 10 minutos.
                        </p>
                        <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', lineHeight: '1.4' }}>
                          ℹ️ Nota para móviles: En Android, asegúrate de habilitar las notificaciones de Chrome en la configuración del sistema. En iPhone (iOS), debes agregar esta página a tu pantalla de inicio ("Compartir" &gt; "Añadir a pantalla de inicio") para habilitar las alertas push.
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-primary animate-hover" onClick={requestNotificationPermission} style={{
                      whiteSpace: 'nowrap',
                      background: 'var(--brand)',
                      color: 'white',
                      padding: '12px 24px',
                      boxShadow: 'var(--shadow-glow)'
                    }}>
                      Activar Alertas
                    </button>
                  </div>
                )}
                
                <div className="student-grid">
                
                {/* Left Column: Game Lobby & Ranking */}
                <div>
                  {/* Active Session Lobby */}
                  <div className="double-bezel-outer">
                    <div className="double-bezel-inner" style={{ textAlign: 'center' }}>
                      <GameController size={48} weight="fill" color="var(--brand)" style={{ marginBottom: '16px' }} />
                      <h2 style={{ fontSize: '28px', marginBottom: '12px', fontFamily: 'var(--font-display)', fontWeight: '800' }}>¡Hola {profile.nombre}!</h2>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
                        Ingresa a la sala de juego en vivo para responder el desafío de tu curso.
                      </p>

                      {demoMode ? (
                        <div style={{ backgroundColor: 'var(--brand-light)', border: '1px solid var(--border-focus)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                          <h3 style={{ fontSize: '18px', color: 'var(--brand-dark)', marginBottom: '8px', fontWeight: '800' }}>Partida Activa (Modo Demo)</h3>
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
                          <h3 style={{ fontSize: '18px', color: 'var(--success)', marginBottom: '8px', fontWeight: '800' }}>🚀 Partida Activa en Vivo</h3>
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
                        <div className="waiting-lobby-container" style={{ padding: '24px 16px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                          <div className="radar-wave-container">
                            <div className="radar-ping"></div>
                            <div className="radar-wave wave-1"></div>
                            <div className="radar-wave wave-2"></div>
                            <div className="radar-core">📡</div>
                          </div>
                          <h3 style={{ fontSize: '16px', color: 'var(--brand-dark)', marginTop: '20px', marginBottom: '8px', fontWeight: '800' }}>
                            Sincronizando con el Aula...
                          </h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, textAlign: 'center', maxWidth: '280px', lineHeight: '1.4' }}>
                            Esperando a que tu profesor inicie la trivia en vivo de hoy. La pantalla se actualizará automáticamente.
                          </p>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px', textAlign: 'left' }}>
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
                            onClick={async () => {
                              const code = sessionCodeInput.trim();
                              if (!code) {
                                alert("Por favor ingresa un código de sala.");
                                return;
                              }
                              
                              const { data, error } = await supabase
                                .from('sesiones_juego')
                                .select('id, nombre')
                                .eq('codigo', code)
                                .single();

                              if (error || !data) {
                                alert("No se encontró ninguna sala con el código ingresado.");
                              } else {
                                handleJoinSession(data.id, data.nombre);
                              }
                            }}
                          >
                            Unirse
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ranking Histórico del Curso */}
                  <div className="double-bezel-outer">
                    <div className="double-bezel-inner">
                      <h3 className="card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>
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
                </div>

                {/* Right Column: Scoreboard/Medals */}
                <div>
                  {/* Student Scoreboard summary */}
                  <div className="double-bezel-outer">
                    <div className="double-bezel-inner">
                      <h3 className="card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                        <Trophy weight="fill" size={20} color="var(--warning)" />
                        Vitrina de Medallas
                      </h3>
                      <div className="medal-showcase">
                        {/* Oro */}
                        <div className="medal-slot gold-slot">
                          <div className="medal-icon-container">
                            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M12 15a6 6 0 100-12 6 6 0 000 12z" fill="url(#goldGrad)" stroke="#d97706" />
                              <path d="M8.21 13.89L7 21l5-2.5 5 2.5-1.21-7.11" stroke="#b91c1c" strokeWidth="2" strokeLinejoin="round" />
                              <text x="12" y="12.5" fill="#78350f" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="var(--font-display)">1</text>
                              <defs>
                                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#fbbf24" />
                                  <stop offset="50%" stopColor="#f59e0b" />
                                  <stop offset="100%" stopColor="#d97706" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: '800', display: 'block', color: '#b45309' }}>1er Lugar</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Desafíos ganados</span>
                          </div>
                          <span style={{ fontSize: '20px', fontWeight: '800', color: '#b45309', marginLeft: 'auto' }}>
                            {medals.gold} {medals.gold === 1 ? 'vez' : 'veces'}
                          </span>
                        </div>

                        {/* Plata */}
                        <div className="medal-slot silver-slot">
                          <div className="medal-icon-container">
                            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M12 15a6 6 0 100-12 6 6 0 000 12z" fill="url(#silverGrad)" stroke="#475569" />
                              <path d="M8.21 13.89L7 21l5-2.5 5 2.5-1.21-7.11" stroke="#1d4ed8" strokeWidth="2" strokeLinejoin="round" />
                              <text x="12" y="12.5" fill="#1e293b" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="var(--font-display)">2</text>
                              <defs>
                                <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#f1f5f9" />
                                  <stop offset="50%" stopColor="#cbd5e1" />
                                  <stop offset="100%" stopColor="#94a3b8" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: '800', display: 'block', color: '#475569' }}>2do Lugar</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Segundos puestos</span>
                          </div>
                          <span style={{ fontSize: '20px', fontWeight: '800', color: '#475569', marginLeft: 'auto' }}>
                            {medals.silver} {medals.silver === 1 ? 'vez' : 'veces'}
                          </span>
                        </div>

                        {/* Bronce */}
                        <div className="medal-slot bronze-slot">
                          <div className="medal-icon-container">
                            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M12 15a6 6 0 100-12 6 6 0 000 12z" fill="url(#bronzeGrad)" stroke="#92400e" />
                              <path d="M8.21 13.89L7 21l5-2.5 5 2.5-1.21-7.11" stroke="#047857" strokeWidth="2" strokeLinejoin="round" />
                              <text x="12" y="12.5" fill="#451a03" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="var(--font-display)">3</text>
                              <defs>
                                <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#fed7aa" />
                                  <stop offset="50%" stopColor="#f97316" />
                                  <stop offset="100%" stopColor="#ea580c" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: '800', display: 'block', color: '#c2410c' }}>3er Lugar</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Terceros puestos</span>
                          </div>
                          <span style={{ fontSize: '20px', fontWeight: '800', color: '#c2410c', marginLeft: 'auto' }}>
                            {medals.bronze} {medals.bronze === 1 ? 'vez' : 'veces'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
            )}
            
          </div>
        )}

        {/* Visual Toast Notification Overlay */}
        {toast && (
          <div className="in-app-toast-container animate-slide-in" onClick={() => {
            if (toast.sessionId !== 'test-notification') {
              handleJoinSession(toast.sessionId, toast.sessionName);
            }
            setToast(null);
          }} style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            maxWidth: '400px',
            width: 'calc(100% - 48px)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-lg)',
            cursor: 'pointer',
            display: 'flex',
            gap: '16px',
            transition: 'var(--transition-normal)'
          }}>
            <div style={{
              background: 'var(--brand-light)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <GameController size={24} weight="fill" color="var(--brand)" />
            </div>
            <div style={{ flexGrow: 1, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EduQuiz • Ahora</span>
                <button onClick={(e) => {
                  e.stopPropagation();
                  setToast(null);
                }} style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center'
                }}>×</button>
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{toast.title}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{toast.body}</p>
              {toast.sessionId !== 'test-notification' && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--brand)' }}>
                  <span>Entrar a Jugar</span>
                  <span>→</span>
                </div>
              )}
            </div>
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
