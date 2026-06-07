import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Plus, UserPlus, Play, Trophy, Users, Shield, Trash } from '@phosphor-icons/react';

export default function CourseAdminDashboard({ onStartSession }) {
  const { profile, demoMode } = useAuth();
  
  // Whitelist State
  const [whitelist, setWhitelist] = useState([]);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  
  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [newSessionName, setNewSessionName] = useState('');
  
  // Rankings State
  const [rankings, setRankings] = useState([]);

  // Auditing States for final sessions
  const [selectedSessionAudit, setSelectedSessionAudit] = useState(null);
  const [auditQuestions, setAuditQuestions] = useState([]);
  const [selectedQuestionAudit, setSelectedQuestionAudit] = useState(null);
  const [auditAnswers, setAuditAnswers] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Mock data for Demo Mode
  const demoWhitelist = [
    { id: 'wl-1', email: 'alumno.benjamin@gmail.com' },
    { id: 'wl-2', email: 'alumna.sofia@gmail.com' },
    { id: 'wl-3', email: 'alumno.mateo@gmail.com' },
    { id: 'wl-4', email: 'alumna.valentina@gmail.com' }
  ];

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

  const demoSessions = [
    { id: 'sess-1', nombre: 'Trivia de Historia de Chile', estado: 'finalizado', creado_en: '2026-06-01' },
    { id: 'sess-2', nombre: 'Desafío de Fracciones', estado: 'esperando', creado_en: '2026-06-02' }
  ];

  useEffect(() => {
    if (demoMode) {
      setWhitelist(demoWhitelist);
      setRankings(demoRankings);
      setSessions(demoSessions);
      return;
    }
    
    if (profile?.curso_id) {
      fetchWhitelist();
      fetchSessions();
      fetchRankings();
    } else {
      setWhitelist([]);
      setRankings([]);
      setSessions([]);
    }
  }, [profile, demoMode]);

  const fetchWhitelist = async () => {
    const { data, error } = await supabase
      .from('whitelist_alumnos')
      .select('*')
      .eq('curso_id', profile.curso_id);
    if (error) console.error("Error fetching whitelist:", error);
    else setWhitelist(data);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('sesiones_juego')
      .select('*')
      .eq('curso_id', profile.curso_id)
      .order('creado_en', { ascending: false });
    if (error) console.error("Error fetching sessions:", error);
    else setSessions(data);
  };

  const fetchRankings = async () => {
    const { data: ranks, error: rankErr } = await supabase
      .from('rankings')
      .select('*')
      .eq('curso_id', profile.curso_id)
      .order('puntaje_total', { ascending: false });
    
    if (rankErr) {
      console.error("Error fetching rankings:", rankErr);
      return;
    }

    if (!ranks || ranks.length === 0) {
      setRankings([]);
      return;
    }

    // Fetch student profiles for mapping
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

    // Map profiles of the student rankings
    const formatted = ranks.map(r => ({
      id: r.id,
      nombre: profileMap[r.usuario_id]?.nombre || profileMap[r.usuario_id]?.email || 'Estudiante',
      email: profileMap[r.usuario_id]?.email || 'Desconocido',
      puntaje_total: r.puntaje_total,
      sesiones_jugadas: r.sesiones_jugadas || 0,
      historial_participacion: r.historial_participacion || []
    }));

    setRankings(formatted);
  };

  const handleOpenAuditPanel = async (session) => {
    setSelectedSessionAudit(session);
    setLoadingAudit(true);
    setAuditQuestions([]);
    setSelectedQuestionAudit(null);
    setAuditAnswers([]);

    if (demoMode) {
      // Setup demo audit data
      const mockQuestions = [
        {
          id: 'q-demo-1',
          texto: '¿Cuál es el océano más grande del mundo?',
          respuesta_correcta: 'Océano Pacífico'
        },
        {
          id: 'q-demo-2',
          texto: '¿Cuánto es 3/4 + 1/2?',
          respuesta_correcta: '5/4 o 1 1/4'
        }
      ];
      setAuditQuestions(mockQuestions);
      setSelectedQuestionAudit(mockQuestions[0]);
      
      const mockAnswers = [
        {
          id: 'ans-demo-1',
          pregunta_id: 'q-demo-1',
          alumno_id: 'rank-1',
          nombre: 'Sofía Castro',
          texto: 'El Pacífico',
          calificacion: 10
        },
        {
          id: 'ans-demo-2',
          pregunta_id: 'q-demo-1',
          alumno_id: 'rank-2',
          nombre: 'Benjamín Díaz',
          texto: 'Atlántico',
          calificacion: 0
        }
      ];
      setAuditAnswers(mockAnswers);
      setLoadingAudit(false);
      return;
    }

    try {
      // 1. Fetch questions for the session
      const { data: questions, error: qErr } = await supabase
        .from('preguntas')
        .select('*')
        .eq('sesion_id', session.id);
      
      if (qErr) {
        console.error("Error fetching questions for audit:", qErr);
        setLoadingAudit(false);
        return;
      }

      setAuditQuestions(questions || []);

      if (questions && questions.length > 0) {
        const firstQ = questions[0];
        setSelectedQuestionAudit(firstQ);
        await fetchAuditAnswers(firstQ.id);
      }
    } catch (err) {
      console.error("Crash loading audit data:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchAuditAnswers = async (questionId) => {
    setLoadingAudit(true);
    try {
      const { data: answers, error: aErr } = await supabase
        .from('respuestas')
        .select('*')
        .eq('pregunta_id', questionId);

      if (aErr) {
        console.error("Error fetching answers for audit question:", aErr);
        return;
      }

      // Fetch profile details for mapping names
      const { data: profiles, error: pErr } = await supabase
        .from('perfiles_usuarios')
        .select('id, nombre, email')
        .eq('curso_id', profile.curso_id);

      const profileMap = {};
      profiles?.forEach(p => {
        profileMap[p.id] = p;
      });

      const mapped = (answers || []).map(ans => ({
        id: ans.id,
        pregunta_id: ans.pregunta_id,
        alumno_id: ans.alumno_id,
        nombre: profileMap[ans.alumno_id]?.nombre || profileMap[ans.alumno_id]?.email || 'Estudiante',
        texto: ans.texto,
        url_imagen: ans.url_imagen,
        calificacion: ans.calificacion
      }));

      setAuditAnswers(mapped);
    } catch (err) {
      console.error("Crash fetching audit answers:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleCorrectGrade = async (answer, newGrade) => {
    const previousGrade = typeof answer.calificacion === 'number' ? answer.calificacion : 0;
    const difference = newGrade - previousGrade;

    if (demoMode) {
      // Update local answers state
      setAuditAnswers(prev => prev.map(a => a.id === answer.id ? { ...a, calificacion: newGrade } : a));

      // Update local rankings state
      setRankings(prev => prev.map(r => {
        const matches = r.nombre === answer.nombre || r.email === answer.email || r.id === answer.alumno_id;
        if (matches) {
          let historial = Array.isArray(r.historial_participacion) ? [...r.historial_participacion] : [];
          const sessionIndex = historial.findIndex(h => h.sesion_id === selectedSessionAudit.id || h.sesion_id === 's-demo-1');
          
          if (sessionIndex !== -1) {
            historial[sessionIndex] = {
              ...historial[sessionIndex],
              puntaje_obtenido: (historial[sessionIndex].puntaje_obtenido || 0) + difference
            };
          } else {
            historial.push({
              sesion_id: selectedSessionAudit.id,
              sesion_nombre: selectedSessionAudit.nombre,
              fecha: new Date().toISOString().split('T')[0],
              puntaje_obtenido: newGrade
            });
          }

          return {
            ...r,
            puntaje_total: r.puntaje_total + difference,
            historial_participacion: historial
          };
        }
        return r;
      }));
      return;
    }

    try {
      // 1. Update the answer grade in Supabase
      const { error: aErr } = await supabase
        .from('respuestas')
        .update({ calificacion: newGrade })
        .eq('id', answer.id);

      if (aErr) {
        alert("Error al actualizar la calificación: " + aErr.message);
        return;
      }

      // 2. Fetch the current ranking for the student to update scores & participation history
      const { data: rank, error: rErr } = await supabase
        .from('rankings')
        .select('*')
        .eq('curso_id', profile.curso_id)
        .eq('usuario_id', answer.alumno_id)
        .single();

      if (rErr) {
        console.error("Error fetching student ranking row:", rErr);
        // Fallback: if ranking row doesn't exist, create it
        const newHistorialEntry = {
          sesion_id: selectedSessionAudit.id,
          sesion_nombre: selectedSessionAudit.nombre,
          fecha: new Date().toISOString().split('T')[0],
          puntaje_obtenido: newGrade
        };
        const { error: insErr } = await supabase
          .from('rankings')
          .insert([{
            curso_id: profile.curso_id,
            usuario_id: answer.alumno_id,
            puntaje_total: newGrade,
            sesiones_jugadas: 1,
            historial_participacion: [newHistorialEntry]
          }]);
        
        if (insErr) {
          console.error("Error inserting ranking fallback:", insErr);
        }
      } else if (rank) {
        // Recalculate puntaje_total and historial_participacion
        const newPuntajeTotal = rank.puntaje_total + difference;
        let historial = Array.isArray(rank.historial_participacion) ? [...rank.historial_participacion] : [];
        const sessionIndex = historial.findIndex(h => h.sesion_id === selectedSessionAudit.id);

        if (sessionIndex !== -1) {
          historial[sessionIndex] = {
            ...historial[sessionIndex],
            puntaje_obtenido: (historial[sessionIndex].puntaje_obtenido || 0) + difference
          };
        } else {
          historial.push({
            sesion_id: selectedSessionAudit.id,
            sesion_nombre: selectedSessionAudit.nombre,
            fecha: new Date().toISOString().split('T')[0],
            puntaje_obtenido: newGrade
          });
        }

        const updatePayload = {
          puntaje_total: newPuntajeTotal,
          historial_participacion: historial
        };

        const { error: upErr } = await supabase
          .from('rankings')
          .update(updatePayload)
          .eq('id', rank.id);

        if (upErr) {
          if (upErr.code === '42703') {
            await supabase
              .from('rankings')
              .update({ puntaje_total: newPuntajeTotal })
              .eq('id', rank.id);
          } else {
            console.error("Error updating ranking:", upErr);
          }
        }
      }

      // Update local audit answers state
      setAuditAnswers(prev => prev.map(a => a.id === answer.id ? { ...a, calificacion: newGrade } : a));

      // Refresh rankings in the dashboard
      await fetchRankings();
    } catch (err) {
      console.error("Crash during grade correction:", err);
      alert("Error inesperado al corregir calificación: " + err.message);
    }
  };

  const handleAddWhitelist = async (e) => {
    e.preventDefault();
    if (!newStudentEmail) return;

    if (demoMode) {
      const newEntry = { id: `wl-${Date.now()}`, email: newStudentEmail };
      setWhitelist([...whitelist, newEntry]);
      setNewStudentEmail('');
      return;
    }

    const { data, error } = await supabase
      .from('whitelist_alumnos')
      .insert([{ curso_id: profile.curso_id, email: newStudentEmail }])
      .select();
    
    if (error) {
      alert("Error al añadir correo a la lista: " + error.message);
    } else {
      setWhitelist([...whitelist, data[0]]);
      setNewStudentEmail('');
    }
  };

  const handleDeleteWhitelist = async (id, e) => {
    e.preventDefault();
    if (demoMode) {
      setWhitelist(whitelist.filter(item => item.id !== id));
      return;
    }

    const { error } = await supabase.from('whitelist_alumnos').delete().eq('id', id);
    if (error) alert("Error al eliminar: " + error.message);
    else setWhitelist(whitelist.filter(item => item.id !== id));
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName) return;

    if (demoMode) {
      const newSession = {
        id: `sess-${Date.now()}`,
        nombre: newSessionName,
        estado: 'esperando',
        creado_en: new Date().toISOString().split('T')[0]
      };
      setSessions([newSession, ...sessions]);
      setNewSessionName('');
      onStartSession(newSession.id, newSession.nombre);
      return;
    }

    const { data, error } = await supabase
      .from('sesiones_juego')
      .insert([{ 
        curso_id: profile.curso_id, 
        nombre: newSessionName, 
        estado: 'esperando' 
      }])
      .select();
    
    if (error) {
      alert("Error al iniciar sesión: " + error.message);
    } else {
      setSessions([data[0], ...sessions]);
      setNewSessionName('');
      onStartSession(data[0].id, data[0].nombre);
    }
  };

  const getStoragePathFromUrl = (url) => {
    if (!url) return null;
    const marker = '/public/quiz-assets/';
    const index = url.indexOf(marker);
    if (index !== -1) {
      return url.substring(index + marker.length);
    }
    return null;
  };

  const handleDeleteSession = async (sessId, sessNombre) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar la sesión "${sessNombre}"? Esto liberará el historial visual y los archivos de imagen asociados, pero mantendrá las estadísticas y puntos históricos en el ranking.`);
    if (!confirmDelete) return;

    if (demoMode) {
      setSessions(prev => prev.filter(s => s.id !== sessId));
      alert("Sesión eliminada de la simulación (modo demo).");
      return;
    }

    try {
      // 1. Fetch questions for this session to get their image URLs
      const { data: questions, error: qErr } = await supabase
        .from('preguntas')
        .select('id, url_imagen')
        .eq('sesion_id', sessId);

      if (qErr) {
        console.error("Error fetching questions for deletion:", qErr);
      }

      // 2. Fetch answers for these questions to get their image URLs
      let imagePathsToDelete = [];
      if (questions && questions.length > 0) {
        const questionIds = questions.map(q => q.id);
        
        // Collect question image paths
        questions.forEach(q => {
          if (q.url_imagen) {
            const path = getStoragePathFromUrl(q.url_imagen);
            if (path) imagePathsToDelete.push(path);
          }
        });

        const { data: answers, error: aErr } = await supabase
          .from('respuestas')
          .select('url_imagen')
          .in('pregunta_id', questionIds);

        if (aErr) {
          console.error("Error fetching answers for deletion:", aErr);
        } else if (answers) {
          answers.forEach(a => {
            if (a.url_imagen) {
              const path = getStoragePathFromUrl(a.url_imagen);
              if (path) imagePathsToDelete.push(path);
            }
          });
        }
      }

      // 3. Delete files from Supabase Storage
      if (imagePathsToDelete.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from('quiz-assets')
          .remove(imagePathsToDelete);
        
        if (storageErr) {
          console.error("Error deleting image assets from storage:", storageErr);
        } else {
          console.log("Deleted images from storage:", imagePathsToDelete);
        }
      }

      // 4. Delete the game session from DB (cascades to questions and answers)
      const { data: deletedRows, error: deleteErr } = await supabase
        .from('sesiones_juego')
        .delete()
        .eq('id', sessId)
        .select();

      if (deleteErr) {
        alert("Error al eliminar la sesión: " + deleteErr.message);
      } else if (!deletedRows || deletedRows.length === 0) {
        alert("No se pudo eliminar la sesión de la base de datos. Esto ocurre porque falta aplicar la política de seguridad RLS 'DELETE' en Supabase. Sigue las instrucciones e instala la consulta SQL correspondiente.");
      } else {
        setSessions(prev => prev.filter(s => s.id !== sessId));
        alert("Sesión eliminada con éxito y espacio liberado.");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("Error inesperado al eliminar la sesión: " + err.message);
    }
  };

  return (
    <div className="course-admin-dashboard">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', color: 'var(--brand-dark)', fontFamily: 'var(--font-display)', fontWeight: '800' }}>Panel del Administrador de Curso</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Gestionando tu curso. Asegura que los alumnos estén en la lista para ingresar.
        </p>
      </header>

      <div className="admin-grid">
        
        {/* Whitelist Panel */}
        <div className="double-bezel-outer">
          <div className="double-bezel-inner">
            <h2 className="card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>
              <Shield size={24} weight="fill" color="var(--brand)" />
              Alumnos Permitidos (Whitelist)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Solo los alumnos cuyos correos estén registrados aquí tendrán acceso a las salas de juego.
            </p>

            <form onSubmit={handleAddWhitelist} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input 
                type="email" 
                className="form-input" 
                placeholder="alumno@colegio.cl"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit">
                <UserPlus weight="bold" /> Invitar
              </button>
            </form>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Correo Invitado</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {whitelist.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>{student.email}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={(e) => handleDeleteWhitelist(student.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sessions & Leaderboards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Game Sessions Block */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner">
              <h2 className="card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                <Play size={24} weight="fill" color="var(--brand)" />
                Sesiones de Juego
              </h2>
              
              <form onSubmit={handleCreateSession} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nombre de la nueva partida (ej. Desafío del Saber)"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  required
                />
                <button className="btn btn-primary" type="submit">
                  <Play weight="fill" /> Iniciar Partida
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessions.map(session => (
                  <div 
                    key={session.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: 'var(--bg-page)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800' }}>{session.nombre}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Creado: {session.creado_en}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {session.estado === 'finalizado' ? (
                        <>
                          <span className="tag tag-success">Terminado</span>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '8px 14px', fontSize: '13px' }}
                            onClick={() => handleOpenAuditPanel(session)}
                          >
                            Ver Detalles
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="tag tag-warning">Esperando alumnos</span>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '8px 14px', fontSize: '13px' }}
                            onClick={() => onStartSession(session.id, session.nombre)}
                          >
                            Entrar
                          </button>
                        </>
                      )}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 10px', fontSize: '13px', borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleDeleteSession(session.id, session.nombre)}
                        title="Eliminar sesión y liberar archivos de imagen"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Global Course Leaderboard */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner">
              <h2 className="card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                <Trophy size={24} weight="fill" color="var(--brand)" />
                Histórico de Rankings (Curso)
              </h2>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rango</th>
                      <th>Alumno</th>
                      <th>Correo</th>
                      <th style={{ textAlign: 'center' }}>Partidas Jugadas</th>
                      <th style={{ textAlign: 'right' }}>Puntos Totales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((student, index) => (
                      <tr key={student.id}>
                        <td style={{ fontWeight: '800' }}>#{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: '700' }}>{student.nombre}</div>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{student.email}</td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>{student.sesiones_jugadas || 0}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--brand)' }}>{student.puntaje_total} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AUDIT / CORRECTION MODAL */}
      {selectedSessionAudit && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="double-bezel-outer" style={{
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-card)',
            overflow: 'hidden'
          }}>
            <div className="double-bezel-inner" style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(90vh - 8px)',
              padding: '24px'
            }}>
              
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
                    Auditoría de Calificaciones
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Sesión: <strong>{selectedSessionAudit.nombre}</strong>
                  </p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => setSelectedSessionAudit(null)}
                >
                  Cerrar
                </button>
              </div>

              {/* Main Content Split: Questions selector (Left) & Question Details / Student Answers (Right) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '250px 1fr',
                gap: '24px',
                flex: 1,
                overflow: 'hidden'
              }}>
                
                {/* Left Panel: Questions List */}
                <div style={{
                  borderRight: '1px solid var(--border-light)',
                  paddingRight: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Preguntas Formuladas
                  </h4>
                  {auditQuestions.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No hay preguntas en esta sesión.
                    </div>
                  ) : (
                    auditQuestions.map((q, idx) => {
                      const isSelected = selectedQuestionAudit?.id === q.id;
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setSelectedQuestionAudit(q);
                            fetchAuditAnswers(q.id);
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '12px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '2px solid var(--brand)' : '1px solid var(--border-light)',
                            backgroundColor: isSelected ? 'var(--brand-light)' : 'transparent',
                            color: isSelected ? 'var(--brand-dark)' : 'var(--text-main)',
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                          }}
                        >
                          Pregunta #{idx + 1}: {q.texto.substring(0, 30)}{q.texto.length > 30 ? '...' : ''}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Right Panel: Selected Question details and grading */}
                <div style={{
                  overflowY: 'auto',
                  paddingRight: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  {selectedQuestionAudit ? (
                    <>
                      {/* Question Text */}
                      <div style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-page)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--brand)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          Texto de la Pregunta
                        </span>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
                          {selectedQuestionAudit.texto}
                        </h4>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--success)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                          Respuesta Correcta Esperada
                        </span>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {selectedQuestionAudit.respuesta_correcta}
                        </p>
                      </div>

                      {/* Student Answers List */}
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          Respuestas de los Alumnos
                        </h4>
                        
                        {loadingAudit ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                            Cargando respuestas...
                          </div>
                        ) : auditAnswers.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>
                            Nadie respondió a esta pregunta.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {auditAnswers.map(ans => (
                              <div key={ans.id} style={{
                                padding: '16px',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                backgroundColor: '#fff'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>
                                      {ans.nombre}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      {ans.email}
                                    </div>
                                  </div>
                                  <span className={`tag ${ans.calificacion === 10 ? 'tag-success' : ans.calificacion === 5 ? 'tag-warning' : 'tag-danger'}`} style={{ textTransform: 'none' }}>
                                    Puntaje: {ans.calificacion !== null ? `${ans.calificacion} pt` : 'Sin calificar'}
                                  </span>
                                </div>

                                <div style={{
                                  fontSize: '15px',
                                  fontWeight: '700',
                                  color: 'var(--text-main)',
                                  padding: '8px 12px',
                                  backgroundColor: 'var(--bg-page)',
                                  borderRadius: 'var(--radius-sm)',
                                  borderLeft: '4px solid var(--border-focus)'
                                }}>
                                  "{ans.texto}"
                                </div>

                                {ans.url_imagen && (
                                  <div style={{ marginTop: '4px' }}>
                                    <a href={ans.url_imagen} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brand)', textDecoration: 'underline' }}>
                                      Ver archivo adjunto
                                    </a>
                                  </div>
                                )}

                                {/* Action Buttons to Re-grade */}
                                <div style={{
                                  display: 'flex',
                                  gap: '8px',
                                  marginTop: '4px',
                                  borderTop: '1px solid var(--border-light)',
                                  paddingTop: '12px'
                                }}>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '8px' }}>
                                    Corregir:
                                  </span>
                                  <button
                                    onClick={() => handleCorrectGrade(ans, 0)}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      borderRadius: 'var(--radius-sm)',
                                      border: ans.calificacion === 0 ? '1px solid var(--danger)' : '1px solid var(--border-light)',
                                      backgroundColor: ans.calificacion === 0 ? 'var(--danger-bg)' : 'transparent',
                                      color: ans.calificacion === 0 ? 'var(--danger)' : 'var(--text-muted)',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Mala (0 pt)
                                  </button>
                                  <button
                                    onClick={() => handleCorrectGrade(ans, 5)}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      borderRadius: 'var(--radius-sm)',
                                      border: ans.calificacion === 5 ? '1px solid var(--warning)' : '1px solid var(--border-light)',
                                      backgroundColor: ans.calificacion === 5 ? 'var(--warning-bg)' : 'transparent',
                                      color: ans.calificacion === 5 ? 'var(--warning)' : 'var(--text-muted)',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Regular (5 pt)
                                  </button>
                                  <button
                                    onClick={() => handleCorrectGrade(ans, 10)}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      borderRadius: 'var(--radius-sm)',
                                      border: ans.calificacion === 10 ? '1px solid var(--success)' : '1px solid var(--border-light)',
                                      backgroundColor: ans.calificacion === 10 ? 'var(--success-bg)' : 'transparent',
                                      color: ans.calificacion === 10 ? 'var(--success)' : 'var(--text-muted)',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Buena (10 pt)
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Selecciona una pregunta para ver las respuestas de los alumnos.
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

