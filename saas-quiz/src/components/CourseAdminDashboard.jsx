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
    { id: 'rank-1', nombre: 'Sofía Castro', email: 'alumna.sofia@gmail.com', puntaje_total: 120 },
    { id: 'rank-2', nombre: 'Benjamín Díaz', email: 'alumno.benjamin@gmail.com', puntaje_total: 95 },
    { id: 'rank-3', nombre: 'Mateo Rivas', email: 'alumno.mateo@gmail.com', puntaje_total: 80 },
    { id: 'rank-4', nombre: 'Valentina Silva', email: 'alumna.valentina@gmail.com', puntaje_total: 75 }
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
    const { data, error } = await supabase
      .from('rankings')
      .select('*, perfiles_usuarios(*)')
      .eq('curso_id', profile.curso_id)
      .order('puntaje_total', { ascending: false });
    
    if (error) console.error("Error fetching rankings:", error);
    else {
      // Map profiles
      const formatted = data.map((r, i) => ({
        id: r.id,
        nombre: r.perfiles_usuarios?.nombre || r.perfiles_usuarios?.email || 'Estudiante',
        email: r.perfiles_usuarios?.email,
        puntaje_total: r.puntaje_total
      }));
      setRankings(formatted);
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
                  <th style={{ textAlign: 'right' }}>Puntos Totales</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((student, index) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: '800' }}>#{index + 1}</td>
                    <td style={{ fontWeight: '700' }}>{student.nombre}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{student.email}</td>
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
