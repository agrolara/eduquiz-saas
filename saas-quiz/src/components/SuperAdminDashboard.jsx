import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Plus, GraduationCap, Users, UserPlus, Trash } from '@phosphor-icons/react';

export default function SuperAdminDashboard() {
  const { demoMode } = useAuth();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [courses, setCourses] = useState([]);
  
  // Form States
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Demo Initial Data
  const demoSchools = [
    { id: 'school-1', nombre: 'Colegio San Agustín' },
    { id: 'school-2', nombre: 'Liceo Bicentenario de Santiago' }
  ];

  const demoCourses = [
    { id: 'course-1', colegio_id: 'school-1', nombre: '7° Básico A', admin_email: 'profesora.teresa@gmail.com' },
    { id: 'course-2', colegio_id: 'school-1', nombre: '8° Básico B', admin_email: 'materiales.integrity@gmail.com' },
    { id: 'course-3', colegio_id: 'school-2', nombre: '1° Medio C', admin_email: 'director@liceo.cl' }
  ];

  useEffect(() => {
    if (demoMode) {
      setSchools(demoSchools);
      return;
    }
    fetchSchools();
  }, [demoMode]);

  useEffect(() => {
    if (!selectedSchool) return;
    if (demoMode) {
      setCourses(demoCourses.filter(c => c.colegio_id === selectedSchool.id));
      return;
    }
    fetchCourses(selectedSchool.id);
  }, [selectedSchool, demoMode]);

  const fetchSchools = async () => {
    const { data, error } = await supabase.from('colegios').select('*').order('nombre');
    if (error) console.error("Error fetching schools:", error);
    else setSchools(data);
  };

  const fetchCourses = async (schoolId) => {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('colegio_id', schoolId)
      .order('nombre');
    if (error) console.error("Error fetching courses:", error);
    else setCourses(data);
  };

  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!newSchoolName) return;

    if (demoMode) {
      const newSchool = { id: `school-${Date.now()}`, nombre: newSchoolName };
      setSchools([...schools, newSchool]);
      setNewSchoolName('');
      return;
    }

    const { data, error } = await supabase
      .from('colegios')
      .insert([{ nombre: newSchoolName }])
      .select();
    
    if (error) {
      alert("Error al guardar colegio: " + error.message);
    } else {
      setSchools([...schools, data[0]]);
      setNewSchoolName('');
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName || !selectedSchool) return;

    if (demoMode) {
      const newCourse = {
        id: `course-${Date.now()}`,
        colegio_id: selectedSchool.id,
        nombre: newCourseName,
        admin_email: newAdminEmail || null
      };
      setCourses([...courses, newCourse]);
      setNewCourseName('');
      setNewAdminEmail('');
      return;
    }

    const { data, error } = await supabase
      .from('cursos')
      .insert([{ 
        colegio_id: selectedSchool.id, 
        nombre: newCourseName, 
        admin_email: newAdminEmail || null 
      }])
      .select();
    
    if (error) {
      alert("Error al guardar curso: " + error.message);
    } else {
      setCourses([...courses, data[0]]);
      setNewCourseName('');
      setNewAdminEmail('');
    }
  };

  const handleDeleteSchool = async (schoolId, e) => {
    e.stopPropagation();
    if (!confirm("¿Seguro que deseas eliminar este colegio y todos sus cursos?")) return;

    if (demoMode) {
      setSchools(schools.filter(s => s.id !== schoolId));
      if (selectedSchool?.id === schoolId) setSelectedSchool(null);
      return;
    }

    const { error } = await supabase.from('colegios').delete().eq('id', schoolId);
    if (error) alert("Error al eliminar: " + error.message);
    else {
      setSchools(schools.filter(s => s.id !== schoolId));
      if (selectedSchool?.id === schoolId) setSelectedSchool(null);
    }
  };

  return (
    <div className="super-admin-dashboard">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', color: 'var(--brand-dark)', fontFamily: 'var(--font-display)', fontWeight: '800' }}>Panel del Super Administrador</h1>
        <p style={{ color: 'var(--text-muted)' }}>Mauricio Lara // materiales.integrity@gmail.com</p>
      </header>

      <div className="admin-grid">
        
        {/* Schools Section */}
        <div>
          <div className="double-bezel-outer">
            <div className="double-bezel-inner">
              <h2 className="card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                <GraduationCap size={24} weight="fill" color="var(--brand)" />
                Gestionar Colegios
              </h2>
              <form onSubmit={handleAddSchool} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nombre del Colegio (ej. Colegio Alemán)"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  required
                />
                <button className="btn btn-primary" type="submit" style={{ padding: '12px 20px' }}>
                  <Plus weight="bold" />
                </button>
              </form>

              <div className="school-grid">
                {schools.map(school => (
                  <div 
                    key={school.id} 
                    className={`school-card ${selectedSchool?.id === school.id ? 'active-border' : ''}`}
                    onClick={() => setSelectedSchool(school)}
                    style={{
                      borderColor: selectedSchool?.id === school.id ? 'var(--brand)' : 'var(--border-light)',
                      borderWidth: '2px',
                      position: 'relative'
                    }}
                  >
                    <GraduationCap className="school-icon" weight="fill" />
                    <div className="school-name">{school.nombre}</div>
                    <button 
                      onClick={(e) => handleDeleteSchool(school.id, e)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer'
                      }}
                      title="Eliminar Colegio"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected School Courses Section */}
        <div>
          {selectedSchool ? (
            <div className="double-bezel-outer">
              <div className="double-bezel-inner">
                <h2 className="card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>
                  <Users size={24} weight="fill" color="var(--brand)" />
                  Cursos en {selectedSchool.nombre}
                </h2>

                <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nombre del Curso (ej. 5° Básico A)"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      required
                    />
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="Gmail del Apoderado (Opcional)"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-end' }}>
                    <Plus weight="bold" /> Agregar Curso & Admin
                  </button>
                </form>

                {courses.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                    No hay cursos registrados en este colegio. ¡Agrega el primero!
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Curso</th>
                          <th>Administrador (Apoderado)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map(course => (
                          <tr key={course.id}>
                            <td style={{ fontWeight: '700' }}>{course.nombre}</td>
                            <td>
                              {course.admin_email ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="tag tag-success">Asignado</span>
                                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}>{course.admin_email}</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="tag tag-warning">Sin Administrador</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Editar para añadir Gmail</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="double-bezel-outer" style={{ height: '100%' }}>
              <div className="double-bezel-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', height: '100%', textAlign: 'center' }}>
                <GraduationCap size={48} weight="thin" color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-display)', fontWeight: '800' }}>Selecciona un Colegio</h3>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '300px', margin: 0 }}>
                  Haz clic en una tarjeta de colegio a la izquierda para ver y gestionar sus cursos y administradores.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

