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
      const { error: deleteErr } = await supabase
        .from('sesiones_juego')
        .delete()
        .eq('id', sessId);

      if (deleteErr) {
        alert("Error al eliminar la sesión: " + deleteErr.message);
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
        <h1 style={{ fontSize: '32px', color: 'var(--brand-dark)' }}>Panel del Administrador de Curso</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Gestionando tu curso. Asegura que los alumnos estén en la lista para ingresar.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px' }}>
        
        {/* Whitelist Panel */}
        <div className="card">
          <h2 className="card-title">
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

        {/* Sessions & Leaderboards */}
        <div>
          {/* Game Sessions Block */}
          <div className="card">
            <h2 className="card-title">
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
                    <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{session.nombre}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Creado: {session.creado_en}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {session.estado === 'finalizado' ? (
                      <span className="tag tag-success">Terminado</span>
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

          {/* Global Course Leaderboard */}
          <div className="card">
            <h2 className="card-title">
              <Trophy size={24} weight="fill" color="var(--brand)" />
              Histórico de Rankings (Curso)
            </h2>
            
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
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {student.historial_participacion && student.historial_participacion.length > 0 ? (
                          <span>Partidas: {student.historial_participacion.map(h => `${h.sesion_nombre} (${h.puntaje_obtenido} pts)`).join(', ')}</span>
                        ) : (
                          <span>Sin participación registrada</span>
                        )}
                      </div>
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
  );
}
