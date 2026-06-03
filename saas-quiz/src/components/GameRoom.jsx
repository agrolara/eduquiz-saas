import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import GeminiAssetGenerator from './GeminiAssetGenerator';
import { 
  Trophy, Clock, Star, AirplaneTilt, PlayCircle
} from '@phosphor-icons/react';

export default function GameRoom({ sessionId, sessionName, onLeave }) {
  const { profile, demoMode } = useAuth();
  
  // Game States
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [rankings, setRankings] = useState([]);
  
  // Timer Ref & State
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180s
  const timerInterval = useRef(null);

  // Forms
  const [qText, setQText] = useState('');
  const [qAnswer, setQAnswer] = useState('');
  const [qImage, setQImage] = useState('');
  const [myAnswerText, setMyAnswerText] = useState('');
  const [myAnswerImage, setMyAnswerImage] = useState('');

  // Initial Mock State for Demo Mode
  const demoPlayers = [
    { id: 'demo-student-benjamin', nombre: 'Benjamín Díaz', rol: 'jugador', email: 'alumno.benjamin@gmail.com' },
    { id: 'demo-student-sofia', nombre: 'Sofía Castro', rol: 'jugador', email: 'alumna.sofia@gmail.com' },
    { id: 'demo-student-mateo', nombre: 'Mateo Rivas', rol: 'jugador', email: 'alumno.mateo@gmail.com' },
    { id: 'demo-student-valentina', nombre: 'Valentina Silva', rol: 'jugador', email: 'alumna.valentina@gmail.com' }
  ];

  useEffect(() => {
    if (demoMode) {
      // Setup demo session
      setSession({
        id: sessionId,
        nombre: sessionName,
        estado: 'esperando', // esperando -> pregunta -> respuesta -> evaluacion -> terminado
        turno_actual_usuario_id: 'demo-student-sofia', // Sofía goes first
        pregunta_actual_id: null,
        orden_turnos: ['demo-student-sofia', 'demo-student-benjamin', 'demo-student-mateo', 'demo-student-valentina']
      });
      setPlayers(demoPlayers);
      setRankings([
        { email: 'alumna.sofia@gmail.com', puntaje_total: 120 },
        { email: 'alumno.benjamin@gmail.com', puntaje_total: 95 },
        { email: 'alumno.mateo@gmail.com', puntaje_total: 80 },
        { email: 'alumna.valentina@gmail.com', puntaje_total: 75 }
      ]);
      return;
    }

    // Real Supabase Connection
    fetchSessionDetails();
    subscribeToSession();
  }, [sessionId, demoMode]);

  useEffect(() => {
    // Sync Timer
    if (session?.estado === 'respuesta') {
      startCountdown();
    } else {
      clearInterval(timerInterval.current);
    }
    return () => clearInterval(timerInterval.current);
  }, [session?.estado]);

  // Demo Mode Simulation Logic
  useEffect(() => {
    if (!demoMode || !session) return;

    // 1. If we are in "esperando" and the user is NOT the admin, we wait for admin to start.
    // In demo mode, if we are a student, we can just click "Start Game" ourselves too.

    // 2. If it is Sofía's turn (Mock) and state is "pregunta":
    if (session.estado === 'pregunta' && session.turno_actual_usuario_id === 'demo-student-sofia' && profile.id !== 'demo-student-sofia') {
      // Simulate Sofía formulating a question after 4 seconds
      const timeout = setTimeout(() => {
        setQuestion({
          id: 'demo-q-1',
          texto: '¿Cuál es el océano más grande del planeta Tierra?',
          url_imagen: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=350',
          respuesta_correcta: 'Océano Pacífico'
        });
        setSession(s => ({ ...s, estado: 'respuesta', pregunta_actual_id: 'demo-q-1' }));
        setTimeLeft(180);
      }, 4000);
      return () => clearTimeout(timeout);
    }

    // 3. If state is "respuesta":
    if (session.estado === 'respuesta') {
      // Simulate other mock players answering
      const timeout = setTimeout(() => {
        const mockAnswers = [
          { id: 'ans-1', alumno_id: 'demo-student-mateo', nombre: 'Mateo Rivas', texto: 'El Pacífico', calificacion: null },
          { id: 'ans-2', alumno_id: 'demo-student-valentina', nombre: 'Valentina Silva', texto: 'Océano Pacífico y es muy hondo', calificacion: null }
        ];
        // If the logged in user is Benjamín and has already submitted, add it
        setAnswers(prev => {
          const ids = prev.map(a => a.alumno_id);
          const filteredMocks = mockAnswers.filter(m => !ids.includes(m.alumno_id));
          return [...prev, ...filteredMocks];
        });
      }, 3000);
      return () => clearTimeout(timeout);
    }

  }, [session?.estado, session?.turno_actual_usuario_id, demoMode]);

  const startCountdown = () => {
    clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval.current);
          // Auto block inputs and switch to evaluation
          setSession(s => ({ ...s, estado: 'evaluacion' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchSessionDetails = async () => {
    const { data: sess, error: err1 } = await supabase.from('sesiones_juego').select('*').eq('id', sessionId).single();
    if (err1) return console.error(err1);
    setSession(sess);

    // Get whitelisted / joined users
    const { data: users, error: err2 } = await supabase
      .from('perfiles_usuarios')
      .select('*')
      .eq('curso_id', sess.curso_id);
    if (!err2) setPlayers(users);

    if (sess.pregunta_actual_id) {
      const { data: q } = await supabase.from('preguntas').select('*').eq('id', sess.pregunta_actual_id).single();
      setQuestion(q);
    }

    // Fetch initial rankings
    const { data: ranks } = await supabase
      .from('rankings')
      .select('*, perfiles_usuarios(*)')
      .eq('curso_id', sess.curso_id);
    if (ranks) {
      const formatted = ranks.map(r => ({
        email: r.perfiles_usuarios?.email,
        puntaje_total: r.puntaje_total
      }));
      setRankings(formatted);
    }
  };

  const subscribeToSession = () => {
    const channel = supabase.channel(`game:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sesiones_juego', filter: `id=eq.${sessionId}` }, payload => {
        setSession(payload.new);
        if (payload.new.pregunta_actual_id) {
          fetchQuestion(payload.new.pregunta_actual_id);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'preguntas' }, payload => {
        if (payload.new.sesion_id === sessionId) {
          setQuestion(payload.new);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'respuestas' }, () => {
        fetchAnswers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rankings' }, () => {
        fetchRankings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchQuestion = async (qId) => {
    const { data } = await supabase.from('preguntas').select('*').eq('id', qId).single();
    if (data) setQuestion(data);
  };

  const fetchRankings = async () => {
    if (demoMode) return;
    const { data: sess } = await supabase.from('sesiones_juego').select('curso_id').eq('id', sessionId).single();
    if (!sess) return;
    
    const { data: ranks } = await supabase
      .from('rankings')
      .select('*, perfiles_usuarios(*)')
      .eq('curso_id', sess.curso_id);
    if (ranks) {
      const formatted = ranks.map(r => ({
        email: r.perfiles_usuarios?.email,
        puntaje_total: r.puntaje_total
      }));
      setRankings(formatted);
    }
  };

  const fetchAnswers = async () => {
    if (!question) return;
    const { data } = await supabase
      .from('respuestas')
      .select('*, perfiles_usuarios(nombre, email)')
      .eq('pregunta_id', question.id);
    if (data) {
      setAnswers(data.map(ans => ({
        id: ans.id,
        alumno_id: ans.alumno_id,
        nombre: ans.perfiles_usuarios?.nombre || ans.perfiles_usuarios?.email,
        texto: ans.texto,
        calificacion: ans.calificacion
      })));
    }
  };

  const handleStartGame = async () => {
    const turnOrder = players.map(p => p.id);
    if (demoMode) {
      setSession(s => ({
        ...s,
        estado: 'pregunta',
        turno_actual_usuario_id: turnOrder[0],
        orden_turnos: turnOrder
      }));
      return;
    }

    const { error } = await supabase
      .from('sesiones_juego')
      .update({
        estado: 'pregunta',
        turno_actual_usuario_id: turnOrder[0],
        orden_turnos: turnOrder
      })
      .eq('id', sessionId);
    if (error) alert("Error al iniciar partida: " + error.message);
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!qText || !qAnswer) return;

    if (demoMode) {
      const mockQ = {
        id: `q-${Date.now()}`,
        texto: qText,
        url_imagen: qImage || null,
        respuesta_correcta: qAnswer
      };
      setQuestion(mockQ);
      setSession(s => ({ ...s, estado: 'respuesta', pregunta_actual_id: mockQ.id }));
      setTimeLeft(180);
      setQText('');
      setQAnswer('');
      setQImage('');
      return;
    }

    try {
      // Real Supabase insert
      const { data: newQ, error: qErr } = await supabase
        .from('preguntas')
        .insert([{
          sesion_id: sessionId,
          creador_id: profile.id,
          texto: qText,
          url_imagen: qImage || null,
          respuesta_correcta: qAnswer
        }])
        .select();

      if (qErr) {
        alert("Error al enviar pregunta: " + qErr.message);
        return;
      }

      if (!newQ || newQ.length === 0) {
        alert("Error: No se pudo registrar la pregunta. RLS policy error.");
        return;
      }

      const { error: sErr } = await supabase
        .from('sesiones_juego')
        .update({
          estado: 'respuesta',
          pregunta_actual_id: newQ[0].id
        })
        .eq('id', sessionId);
      
      if (sErr) {
        alert("Error al actualizar partida: " + sErr.message);
      } else {
        setQText('');
        setQAnswer('');
        setQImage('');
      }
    } catch (err) {
      console.error("Crash submitting question:", err);
      alert("Error inesperado al enviar la pregunta: " + err.message);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!myAnswerText) return;

    if (demoMode) {
      const myAns = {
        id: `ans-${Date.now()}`,
        alumno_id: profile.id,
        nombre: profile.nombre,
        texto: myAnswerText,
        calificacion: null
      };
      setAnswers([...answers, myAns]);
      setMyAnswerText('');
      return;
    }

    try {
      const { error } = await supabase
        .from('respuestas')
        .insert([{
          pregunta_id: question.id,
          alumno_id: profile.id,
          texto: myAnswerText,
          url_imagen: myAnswerImage || null
        }]);
      
      if (error) {
        alert("Error al responder: " + error.message);
      } else {
        setMyAnswerText('');
        alert("¡Respuesta enviada!");
        fetchAnswers();
      }
    } catch (err) {
      console.error("Crash submitting answer:", err);
      alert("Error inesperado al enviar la respuesta: " + err.message);
    }
  };

  const handleGradeAnswer = (answerId, score) => {
    setAnswers(answers.map(ans => ans.id === answerId ? { ...ans, calificacion: score } : ans));
  };

  const handleFinishEvaluation = async () => {
    if (demoMode) {
      // In demo mode, update player rankings in local view
      setSession(s => {
        // Shift to next player
        const currentIndex = s.orden_turnos.indexOf(s.turno_actual_usuario_id);
        const nextIndex = (currentIndex + 1) % s.orden_turnos.length;
        return {
          ...s,
          estado: 'pregunta',
          turno_actual_usuario_id: s.orden_turnos[nextIndex],
          pregunta_actual_id: null
        };
      });
      // Add points
      alert("Evaluación completada. Se han repartido los puntos y pasamos al siguiente turno.");
      setAnswers([]);
      setQuestion(null);
      return;
    }

    try {
      // Save grades in Supabase
      for (const ans of answers) {
        await supabase
          .from('respuestas')
          .update({ calificacion: ans.calificacion || 0 })
          .eq('id', ans.id);

        // Increment student's ranking points
        if (ans.calificacion > 0) {
          // Check if exists
          const { data: rank } = await supabase
            .from('rankings')
            .select('*')
            .eq('curso_id', session.curso_id)
            .eq('usuario_id', ans.alumno_id)
            .single();

          if (rank) {
            await supabase
              .from('rankings')
              .update({ puntaje_total: rank.puntaje_total + ans.calificacion })
              .eq('id', rank.id);
          } else {
            await supabase
              .from('rankings')
              .insert([{
                curso_id: session.curso_id,
                usuario_id: ans.alumno_id,
                puntaje_total: ans.calificacion
              }]);
          }
        }
      }

      // Rotate turns
      const currentIndex = session.orden_turnos.indexOf(session.turno_actual_usuario_id);
      const nextIndex = (currentIndex + 1) % session.orden_turnos.length;

      const { error: sErr } = await supabase
        .from('sesiones_juego')
        .update({
          estado: 'pregunta',
          turno_actual_usuario_id: session.orden_turnos[nextIndex],
          pregunta_actual_id: null
        })
        .eq('id', sessionId);

      if (sErr) {
        alert("Error al rotar turnos: " + sErr.message);
      }
    } catch (err) {
      console.error("Crash finishing evaluation:", err);
      alert("Error inesperado al completar la evaluación: " + err.message);
    }
  };

  // Helper selectors
  const isMyTurn = session?.turno_actual_usuario_id === profile?.id;
  const currentDrawer = players.find(p => p.id === session?.turno_actual_usuario_id);
  
  // Find who is next to ask
  const getNextDrawerName = () => {
    if (!session || players.length === 0) return '';
    const currentIndex = session.orden_turnos?.indexOf(session.turno_actual_usuario_id) ?? 0;
    const nextIndex = (currentIndex + 1) % (session.orden_turnos?.length || 1);
    const nextId = session.orden_turnos?.[nextIndex];
    return players.find(p => p.id === nextId)?.nombre || 'Siguiente Alumno';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!session) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando sala virtual...</div>;
  }

  return (
    <div className="game-arena-wrapper">
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="tag tag-success" style={{ marginBottom: '8px' }}>
            Partida en vivo
          </span>
          <h1 style={{ fontSize: '28px', color: 'var(--brand-dark)' }}>{session.nombre}</h1>
        </div>
        <button className="btn btn-secondary" onClick={onLeave}>
          Salir de la sala
        </button>
      </header>

      {/* Turn Order Visual Bar */}
      <div className="turn-order-container" style={{ marginBottom: '24px' }}>
        <div className="turn-title-bar">
          <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-muted)' }}>
            Orden de Turnos:
          </span>
          <span className="tag tag-warning" style={{ textTransform: 'none' }}>
            🔔 Próximo a preguntar: <strong>{getNextDrawerName()}</strong>
          </span>
        </div>
        <div className="turn-list">
          {session.orden_turnos?.map((pId, idx) => {
            const p = players.find(pl => pl.id === pId);
            if (!p) return null;
            const isActive = session.turno_actual_usuario_id === pId;
            const isNext = session.orden_turnos[(session.orden_turnos.indexOf(session.turno_actual_usuario_id) + 1) % session.orden_turnos.length] === pId;
            
            return (
              <div key={pId} className={`turn-item ${isActive ? 'active' : ''} ${isNext ? 'next-up' : ''}`}>
                <div className="turn-avatar">{idx + 1}</div>
                <span className="turn-name">{p.nombre}</span>
                {isActive && <Star size={14} weight="fill" color="var(--accent)" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="game-arena">
        {/* Main Stage Panel */}
        <div className="game-main-panel">
          
          {/* WAITING PHASE */}
          {session.estado === 'esperando' && (
            <div className="stage-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <PlayCircle size={64} color="var(--brand)" style={{ marginBottom: '16px' }} />
              <h2 className="stage-title">¡Bienvenidos a la Sala de Espera!</h2>
              <p className="stage-description">
                Estamos esperando a que todos los compañeros se conecten a la sesión.
              </p>

              <div style={{ maxWidth: '400px', margin: '0 auto 32px' }}>
                <h4 style={{ marginBottom: '12px', textAlign: 'left' }}>Jugadores en línea ({players.length}):</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {players.map(p => (
                    <div key={p.id} className="user-profile-badge" style={{ justifyContent: 'center' }}>
                      <span className="user-avatar">{p.nombre[0]}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>{p.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(profile.rol === 'admin_curso' || profile.rol === 'super_admin' || players.length > 0) && (
                <button className="btn btn-primary" onClick={handleStartGame}>
                  Iniciar Desafío Trivia
                </button>
              )}
            </div>
          )}

          {/* QUESTION PHASE */}
          {session.estado === 'pregunta' && (
            <div className="stage-card">
              <h2 className="stage-title">Fase de Pregunta</h2>
              
              {isMyTurn ? (
                <div>
                  <p className="stage-description">
                    ¡Es tu turno de desafiar a tus compañeros! Escribe una pregunta inteligente y su respuesta esperada.
                  </p>
                  
                  <form onSubmit={handleSubmitQuestion}>
                    <div className="form-group">
                      <label className="form-label">Escribe tu Pregunta</label>
                      <textarea 
                        className="form-input" 
                        rows="3"
                        placeholder="Ej: ¿Cuál es el planeta más cercano al Sol?"
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        required
                        style={{ resize: 'none' }}
                      />
                    </div>

                    {/* Gemini AI asset generator integrations */}
                    <GeminiAssetGenerator 
                      type="pregunta" 
                      onAssetGenerated={(url) => setQImage(url)} 
                    />

                    <div className="form-group">
                      <label className="form-label">Respuesta Correcta Esperada</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej: Mercurio"
                        value={qAnswer}
                        onChange={(e) => setQAnswer(e.target.value)}
                        required
                      />
                    </div>

                    <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                      <AirplaneTilt weight="fill" /> Enviar Pregunta al Aula
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '28px', margin: '0 auto 16px' }}>
                    {currentDrawer?.nombre[0]}
                  </div>
                  <h3 style={{ marginBottom: '8px' }}>Esperando a {currentDrawer?.nombre}</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                    Está redactando la pregunta en este momento. ¡Prepara tus conocimientos!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ANSWER PHASE */}
          {session.estado === 'respuesta' && question && (
            <div className="stage-card">
              {/* Synchronous 3-minute timer bubble */}
              <div className="timer-bubble">
                <Clock weight="fill" />
                {formatTime(timeLeft)}
              </div>

              <span className="tag tag-success" style={{ marginBottom: '12px' }}>Pregunta Activa</span>
              <h2 className="stage-title">{question.texto}</h2>
              
              {question.url_imagen && (
                <div style={{ margin: '20px 0', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', maxWidth: '450px' }}>
                  <img src={question.url_imagen} alt="Material de pregunta" style={{ width: '100%', display: 'block' }} />
                </div>
              )}

              {isMyTurn ? (
                <div style={{ backgroundColor: 'var(--brand-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-focus)' }}>
                  <h4 style={{ color: 'var(--brand-dark)', marginBottom: '8px' }}>Tu respuesta correcta registrada:</h4>
                  <p style={{ fontWeight: '700', fontSize: '18px' }}>{question.respuesta_correcta}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
                    Espera a que tus compañeros respondan. ({answers.length} respuestas recibidas)
                  </p>
                </div>
              ) : (
                <div>
                  {answers.some(ans => ans.alumno_id === profile.id) ? (
                    <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '16px', borderRadius: 'var(--radius-md)', fontWeight: '700', textAlign: 'center' }}>
                      ✓ ¡Respuesta enviada con éxito! Esperando que termine el tiempo o evalúe el creador.
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitAnswer}>
                      <div className="form-group">
                        <label className="form-label">Tu Respuesta</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Escribe tu respuesta aquí..."
                          value={myAnswerText}
                          onChange={(e) => setMyAnswerText(e.target.value)}
                          required
                          disabled={timeLeft === 0}
                        />
                      </div>
                      <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={timeLeft === 0}>
                        Enviar Respuesta
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* EVALUATION PHASE */}
          {session.estado === 'evaluacion' && (
            <div className="stage-card">
              <h2 className="stage-title">Fase de Calificación</h2>
              <p className="stage-description">
                La respuesta correcta esperada era: <strong style={{ color: 'var(--success)' }}>{question?.respuesta_correcta}</strong>
              </p>

              {isMyTurn ? (
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Califica las respuestas de tus compañeros:</h3>
                  
                  <div className="grading-panel">
                    {answers.filter(ans => ans.alumno_id !== profile.id).map(ans => (
                      <div key={ans.id} className="grading-item">
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Respuesta de {ans.nombre}:
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '800' }}>"{ans.texto}"</div>
                        </div>

                        <div className="grading-buttons">
                          <button 
                            className="grade-btn grade-btn-bad"
                            onClick={() => handleGradeAnswer(ans.id, 0)}
                            style={{ opacity: ans.calificacion === 0 ? 1 : 0.4 }}
                          >
                            Mala (0 pt)
                          </button>
                          <button 
                            className="grade-btn grade-btn-mid"
                            onClick={() => handleGradeAnswer(ans.id, 5)}
                            style={{ opacity: ans.calificacion === 5 ? 1 : 0.4 }}
                          >
                            Regular (5 pt)
                          </button>
                          <button 
                            className="grade-btn grade-btn-good"
                            onClick={() => handleGradeAnswer(ans.id, 10)}
                            style={{ opacity: ans.calificacion === 10 ? 1 : 0.4 }}
                          >
                            Buena (10 pt)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    className="btn btn-primary" 
                    onClick={handleFinishEvaluation}
                    style={{ width: '100%', marginTop: '32px' }}
                  >
                    Finalizar Ronda & Actualizar Ranking
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '28px', margin: '0 auto 16px', backgroundColor: 'var(--warning)' }}>
                    ★
                  </div>
                  <h3 style={{ marginBottom: '8px' }}>El creador está evaluando</h3>
                  <p style={{ color: 'var(--text-muted)' }}>
                    {currentDrawer?.nombre} está revisando las respuestas. ¡Pronto sabremos el ranking actualizado!
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar Leaderboard */}
        <div className="game-leaderboard">
          <h3 className="leaderboard-title">
            <Trophy weight="fill" size={22} color="var(--warning)" />
            Puntajes de la Sesión
          </h3>
          
          <div className="leaderboard-list">
            {players.map((p, idx) => {
              // Calculate demo points or total scores
              // In live sessions we accumulate scores of correct answers
              const points = rankings.find(r => r.email === p.email)?.puntaje_total || 0;
              const isPodium = idx < 3;
              const podiumClass = idx === 0 ? 'podium-1' : idx === 1 ? 'podium-2' : idx === 2 ? 'podium-3' : '';

              return (
                <div key={p.id} className={`leaderboard-item ${podiumClass}`}>
                  <div className="leaderboard-user">
                    <span className="leaderboard-rank">#{idx + 1}</span>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{p.nombre}</span>
                  </div>
                  <span className="leaderboard-points">{points} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
