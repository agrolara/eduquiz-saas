import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Plus, GraduationCap, Users, UserPlus, Trash, PencilSimple, Check, X, CurrencyCircleDollar, Clock, ShieldCheck, Warning, CreditCard, CalendarBlank, Notepad, CaretDown, CaretUp } from '@phosphor-icons/react';

export default function SuperAdminDashboard() {
  const { demoMode } = useAuth();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  
  // Form States
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingEmail, setEditingEmail] = useState('');

  // Subscription editing states
  const [editingPlanCourseId, setEditingPlanCourseId] = useState(null);
  const [editPlanForm, setEditPlanForm] = useState({
    plan_tipo: 'trial',
    plan_valor_mensual: 0,
    plan_fecha_vencimiento: '',
    plan_notas: ''
  });

  // Collapsible section states
  const [showSubscriptions, setShowSubscriptions] = useState(true);

  // Demo Initial Data
  const demoSchools = [
    { id: 'school-1', nombre: 'Colegio San Agustín' },
    { id: 'school-2', nombre: 'Liceo Bicentenario de Santiago' }
  ];

  const demoCourses = [
    { 
      id: 'course-1', colegio_id: 'school-1', nombre: '7° Básico A', admin_email: 'profesora.teresa@gmail.com',
      plan_tipo: 'activo', plan_valor_mensual: 45000,
      plan_fecha_inicio: '2026-01-15T00:00:00Z', plan_fecha_vencimiento: null,
      plan_notas: 'Convenio anual firmado con apoderados.'
    },
    { 
      id: 'course-2', colegio_id: 'school-1', nombre: '8° Básico B', admin_email: 'materiales.integrity@gmail.com',
      plan_tipo: 'trial', plan_valor_mensual: 0,
      plan_fecha_inicio: '2026-06-01T00:00:00Z', plan_fecha_vencimiento: '2026-06-30T23:59:59Z',
      plan_notas: 'Prueba solicitada por jefe de UTP.'
    },
    { 
      id: 'course-3', colegio_id: 'school-2', nombre: '1° Medio C', admin_email: 'director@liceo.cl',
      plan_tipo: 'gratuito', plan_valor_mensual: 0,
      plan_fecha_inicio: '2026-03-01T00:00:00Z', plan_fecha_vencimiento: null,
      plan_notas: 'Convenio municipal. Acceso gratuito permanente.'
    },
    {
      id: 'course-4', colegio_id: 'school-2', nombre: '2° Medio A', admin_email: null,
      plan_tipo: 'suspendido', plan_valor_mensual: 35000,
      plan_fecha_inicio: '2026-02-10T00:00:00Z', plan_fecha_vencimiento: '2026-05-10T23:59:59Z',
      plan_notas: 'Pago de mayo pendiente.'
    },
    {
      id: 'course-5', colegio_id: 'school-1', nombre: '6° Básico C', admin_email: null,
      plan_tipo: 'cancelado', plan_valor_mensual: 0,
      plan_fecha_inicio: '2026-01-20T00:00:00Z', plan_fecha_vencimiento: '2026-04-20T23:59:59Z',
      plan_notas: 'Cancelado por falta de uso.'
    }
  ];

  useEffect(() => {
    if (demoMode) {
      setSchools(demoSchools);
      setAllCourses(demoCourses);
      return;
    }
    fetchSchools();
    fetchAllCourses();
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

  const fetchAllCourses = async () => {
    const { data, error } = await supabase
      .from('cursos')
      .select('*, colegios(nombre)')
      .order('nombre');
    if (error) console.error("Error fetching all courses:", error);
    else setAllCourses(data);
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

  // Sync helper: update both courses and allCourses states
  const syncCourseUpdate = (courseId, updater) => {
    setCourses(prev => prev.map(c => c.id === courseId ? updater(c) : c));
    setAllCourses(prev => prev.map(c => c.id === courseId ? updater(c) : c));
  };

  const syncCourseAdd = (newCourse) => {
    setCourses(prev => [...prev, newCourse]);
    setAllCourses(prev => [...prev, newCourse]);
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
        admin_email: newAdminEmail || null,
        plan_tipo: 'trial',
        plan_valor_mensual: 0,
        plan_fecha_inicio: new Date().toISOString(),
        plan_fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        plan_notas: null
      };
      syncCourseAdd(newCourse);
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
      syncCourseAdd(data[0]);
      setNewCourseName('');
      setNewAdminEmail('');
    }
  };

  const handleDeleteSchool = async (schoolId, e) => {
    e.stopPropagation();
    if (!confirm("¿Seguro que deseas eliminar este colegio y todos sus cursos?")) return;

    if (demoMode) {
      setSchools(schools.filter(s => s.id !== schoolId));
      setAllCourses(allCourses.filter(c => c.colegio_id !== schoolId));
      if (selectedSchool?.id === schoolId) {
        setSelectedSchool(null);
        setCourses([]);
      }
      return;
    }

    const { error } = await supabase.from('colegios').delete().eq('id', schoolId);
    if (error) alert("Error al eliminar: " + error.message);
    else {
      setSchools(schools.filter(s => s.id !== schoolId));
      setAllCourses(allCourses.filter(c => c.colegio_id !== schoolId));
      if (selectedSchool?.id === schoolId) {
        setSelectedSchool(null);
        setCourses([]);
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("¿Seguro que deseas eliminar este curso y toda su información?")) return;

    if (demoMode) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setAllCourses(prev => prev.filter(c => c.id !== courseId));
      return;
    }

    const { error } = await supabase.from('cursos').delete().eq('id', courseId);
    if (error) {
      alert("Error al eliminar curso: " + error.message);
    } else {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setAllCourses(prev => prev.filter(c => c.id !== courseId));
    }
  };

  const handleUpdateAdminEmail = async (courseId, newEmail) => {
    if (demoMode) {
      syncCourseUpdate(courseId, c => ({ ...c, admin_email: newEmail || null }));
      setEditingCourseId(null);
      return;
    }

    const { error } = await supabase
      .from('cursos')
      .update({ admin_email: newEmail || null })
      .eq('id', courseId);

    if (error) {
      alert("Error al actualizar administrador: " + error.message);
    } else {
      syncCourseUpdate(courseId, c => ({ ...c, admin_email: newEmail || null }));
      setEditingCourseId(null);
    }
  };

  const handleDeleteAdminEmail = async (courseId) => {
    if (!confirm("¿Seguro que deseas eliminar al administrador de este curso?")) return;

    if (demoMode) {
      syncCourseUpdate(courseId, c => ({ ...c, admin_email: null }));
      return;
    }

    const { error } = await supabase
      .from('cursos')
      .update({ admin_email: null })
      .eq('id', courseId);

    if (error) {
      alert("Error al eliminar administrador: " + error.message);
    } else {
      syncCourseUpdate(courseId, c => ({ ...c, admin_email: null }));
    }
  };

  // ─── Subscription Management Handlers (now per COURSE) ───

  const startEditingPlan = (course) => {
    setEditingPlanCourseId(course.id);
    setEditPlanForm({
      plan_tipo: course.plan_tipo || 'trial',
      plan_valor_mensual: course.plan_valor_mensual || 0,
      plan_fecha_vencimiento: course.plan_fecha_vencimiento 
        ? new Date(course.plan_fecha_vencimiento).toISOString().split('T')[0] 
        : '',
      plan_notas: course.plan_notas || ''
    });
  };

  const cancelEditingPlan = () => {
    setEditingPlanCourseId(null);
    setEditPlanForm({ plan_tipo: 'trial', plan_valor_mensual: 0, plan_fecha_vencimiento: '', plan_notas: '' });
  };

  const handleSavePlan = async (courseId) => {
    const payload = {
      plan_tipo: editPlanForm.plan_tipo,
      plan_valor_mensual: editPlanForm.plan_tipo === 'activo' ? parseInt(editPlanForm.plan_valor_mensual) || 0 : 0,
      plan_fecha_vencimiento: editPlanForm.plan_fecha_vencimiento 
        ? new Date(editPlanForm.plan_fecha_vencimiento + 'T23:59:59Z').toISOString() 
        : null,
      plan_notas: editPlanForm.plan_notas || null
    };

    if (demoMode) {
      syncCourseUpdate(courseId, c => ({ ...c, ...payload }));
      setEditingPlanCourseId(null);
      return;
    }

    const { error } = await supabase
      .from('cursos')
      .update(payload)
      .eq('id', courseId);

    if (error) {
      alert("Error al actualizar plan: " + error.message);
    } else {
      syncCourseUpdate(courseId, c => ({ ...c, ...payload }));
      setEditingPlanCourseId(null);
    }
  };

  // ─── Helper Functions ───

  const getPlanConfig = (planTipo) => {
    const configs = {
      trial:      { label: 'Prueba',     color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: '⏳', border: '#fbbf24' },
      gratuito:   { label: 'Gratuito',   color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: '🆓', border: '#34d399' },
      activo:     { label: 'Activo',     color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: '💳', border: '#60a5fa' },
      suspendido: { label: 'Suspendido', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', icon: '⚠️', border: '#fb923c' },
      cancelado:  { label: 'Cancelado',  color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)',  icon: '❌', border: '#f87171' }
    };
    return configs[planTipo] || configs.trial;
  };

  const getDaysRemaining = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    const now = new Date();
    const end = new Date(fechaVencimiento);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0';
    return '$' + value.toLocaleString('es-CL');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getSchoolName = (colegioId) => {
    const school = schools.find(s => s.id === colegioId);
    return school ? school.nombre : '—';
  };

  // ─── KPI Calculations (from ALL courses across all schools) ───

  const kpiActivos = allCourses.filter(c => c.plan_tipo === 'activo' || c.plan_tipo === 'gratuito').length;
  const kpiTrials = allCourses.filter(c => c.plan_tipo === 'trial').length;
  const kpiIngresos = allCourses.filter(c => c.plan_tipo === 'activo').reduce((sum, c) => sum + (c.plan_valor_mensual || 0), 0);
  const kpiProblemas = allCourses.filter(c => c.plan_tipo === 'suspendido' || c.plan_tipo === 'cancelado').length;

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
                {schools.map(school => {
                  const schoolCourseCount = allCourses.filter(c => c.colegio_id === school.id).length;
                  return (
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
                      <span style={{
                        fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'
                      }}>
                        {schoolCourseCount} {schoolCourseCount === 1 ? 'curso' : 'cursos'}
                      </span>
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
                  );
                })}
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
                          <th style={{ textAlign: 'center' }}>Plan</th>
                          <th>Administrador (Apoderado)</th>
                          <th style={{ textAlign: 'center', width: '60px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map(course => {
                          const planCfg = getPlanConfig(course.plan_tipo);
                          return (
                            <tr key={course.id}>
                              <td style={{ fontWeight: '700' }}>{course.nombre}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: planCfg.bg,
                                  color: planCfg.color,
                                  border: `1px solid ${planCfg.border}`,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {planCfg.icon} {planCfg.label}
                                </span>
                              </td>
                              <td>
                                {editingCourseId === course.id ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input 
                                      type="email" 
                                      className="form-input" 
                                      style={{ padding: '6px 12px', fontSize: '13px', maxWidth: '240px', margin: 0 }}
                                      value={editingEmail}
                                      onChange={(e) => setEditingEmail(e.target.value)}
                                      placeholder="apoderado@gmail.com"
                                    />
                                    <button 
                                      onClick={() => handleUpdateAdminEmail(course.id, editingEmail)}
                                      style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                                      title="Guardar"
                                    >
                                      <Check size={18} weight="bold" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingCourseId(null)}
                                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                                      title="Cancelar"
                                    >
                                      <X size={18} weight="bold" />
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {course.admin_email ? (
                                        <>
                                          <span className="tag tag-success">Asignado</span>
                                          <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}>{course.admin_email}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="tag tag-warning">Sin Admin</span>
                                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Falta Gmail</span>
                                        </>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                      <button 
                                        onClick={() => { setEditingCourseId(course.id); setEditingEmail(course.admin_email || ''); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                                        title="Editar Administrador"
                                      >
                                        <PencilSimple size={16} />
                                      </button>
                                      {course.admin_email && (
                                        <button 
                                          onClick={() => handleDeleteAdminEmail(course.id)}
                                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                                          title="Eliminar Administrador"
                                        >
                                          <Trash size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  onClick={() => handleDeleteCourse(course.id)}
                                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'inline-flex', padding: '6px', borderRadius: '6px' }}
                                  title="Eliminar Curso"
                                >
                                  <Trash size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUBSCRIPTION MANAGEMENT SECTION (PER COURSE)          */}
      {/* ═══════════════════════════════════════════════════════ */}

      <div style={{ marginTop: '48px' }}>
        {/* Section Header with Toggle */}
        <button 
          onClick={() => setShowSubscriptions(!showSubscriptions)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '24px', padding: 0, width: '100%', textAlign: 'left'
          }}
        >
          <CurrencyCircleDollar size={32} weight="fill" color="var(--brand)" />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', color: 'var(--brand-dark)', fontFamily: 'var(--font-display)', fontWeight: '800', margin: 0 }}>
              Gestión de Suscripciones SaaS
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
              Administra planes, períodos de prueba, valores mensuales y accesos gratuitos <strong>por curso</strong>.
            </p>
          </div>
          {showSubscriptions ? <CaretUp size={20} color="var(--text-muted)" /> : <CaretDown size={20} color="var(--text-muted)" />}
        </button>

        {showSubscriptions && (
          <>
            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              
              {/* Active Courses */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <ShieldCheck size={24} weight="fill" color="#10b981" />
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {kpiActivos}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>
                    Cursos Activos
                  </div>
                </div>
              </div>

              {/* Trials */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Clock size={24} weight="fill" color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: '#f59e0b', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {kpiTrials}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>
                    En Período de Prueba
                  </div>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <CreditCard size={24} weight="fill" color="#3b82f6" />
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: '#3b82f6', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {formatCurrency(kpiIngresos)}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>
                    Ingresos Mensuales
                  </div>
                </div>
              </div>

              {/* Problems */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: kpiProblemas > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <Warning size={24} weight="fill" color={kpiProblemas > 0 ? '#ef4444' : '#10b981'} />
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: '900', color: kpiProblemas > 0 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {kpiProblemas}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px' }}>
                    Suspendidos / Cancelados
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Management Table (ALL courses across all schools) */}
            <div className="double-bezel-outer">
              <div className="double-bezel-inner" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--brand-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Notepad size={20} weight="fill" color="var(--brand)" />
                  Detalle de Planes por Curso
                </h3>

                {allCourses.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>
                    No hay cursos registrados aún. Crea un colegio y agrega cursos para gestionar sus planes.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ minWidth: '1000px' }}>
                      <thead>
                        <tr>
                          <th>Colegio</th>
                          <th>Curso</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                          <th style={{ textAlign: 'right' }}>Valor Mensual</th>
                          <th style={{ textAlign: 'center' }}>Inicio</th>
                          <th style={{ textAlign: 'center' }}>Vencimiento</th>
                          <th style={{ textAlign: 'center' }}>Días Rest.</th>
                          <th>Notas</th>
                          <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCourses.map(course => {
                          const planCfg = getPlanConfig(course.plan_tipo);
                          const daysLeft = getDaysRemaining(course.plan_fecha_vencimiento);
                          const isEditing = editingPlanCourseId === course.id;
                          const schoolName = course.colegios?.nombre || getSchoolName(course.colegio_id);

                          if (isEditing) {
                            return (
                              <tr key={course.id} style={{ backgroundColor: 'var(--brand-light)' }}>
                                <td colSpan="9" style={{ padding: '20px' }}>
                                  <div style={{ marginBottom: '12px' }}>
                                    <strong style={{ fontSize: '15px' }}>Editando plan de: {schoolName} → {course.nombre}</strong>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    {/* Plan Type */}
                                    <div>
                                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                                        Tipo de Plan
                                      </label>
                                      <select 
                                        className="form-input" 
                                        value={editPlanForm.plan_tipo}
                                        onChange={(e) => setEditPlanForm({ ...editPlanForm, plan_tipo: e.target.value })}
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                      >
                                        <option value="trial">⏳ Período de Prueba</option>
                                        <option value="gratuito">🆓 Gratuito Permanente</option>
                                        <option value="activo">💳 Activo (Pago Mensual)</option>
                                        <option value="suspendido">⚠️ Suspendido</option>
                                        <option value="cancelado">❌ Cancelado</option>
                                      </select>
                                    </div>

                                    {/* Monthly Value */}
                                    <div>
                                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                                        Valor Mensual (CLP)
                                      </label>
                                      <input 
                                        type="number" 
                                        className="form-input" 
                                        min="0"
                                        value={editPlanForm.plan_valor_mensual}
                                        onChange={(e) => setEditPlanForm({ ...editPlanForm, plan_valor_mensual: e.target.value })}
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                        disabled={editPlanForm.plan_tipo !== 'activo'}
                                        placeholder="Ej: 45000"
                                      />
                                    </div>

                                    {/* Expiration Date */}
                                    <div>
                                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                                        Fecha de Vencimiento
                                      </label>
                                      <input 
                                        type="date" 
                                        className="form-input" 
                                        value={editPlanForm.plan_fecha_vencimiento}
                                        onChange={(e) => setEditPlanForm({ ...editPlanForm, plan_fecha_vencimiento: e.target.value })}
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                      />
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                        Vacío = sin vencimiento
                                      </span>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                                      Notas Internas
                                    </label>
                                    <textarea 
                                      className="form-input" 
                                      rows="2"
                                      value={editPlanForm.plan_notas}
                                      onChange={(e) => setEditPlanForm({ ...editPlanForm, plan_notas: e.target.value })}
                                      style={{ padding: '8px 12px', fontSize: '13px', resize: 'vertical' }}
                                      placeholder="Ej: Convenio anual con municipalidad, contacto: Juan Pérez..."
                                    />
                                  </div>

                                  {/* Action Buttons */}
                                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button 
                                      className="btn btn-secondary" 
                                      onClick={cancelEditingPlan}
                                      style={{ padding: '8px 20px', fontSize: '13px' }}
                                    >
                                      <X size={16} weight="bold" /> Cancelar
                                    </button>
                                    <button 
                                      className="btn btn-primary" 
                                      onClick={() => handleSavePlan(course.id)}
                                      style={{ padding: '8px 20px', fontSize: '13px' }}
                                    >
                                      <Check size={16} weight="bold" /> Guardar Cambios
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={course.id}>
                              <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{schoolName}</td>
                              <td style={{ fontWeight: '700', fontSize: '14px' }}>{course.nombre}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: planCfg.bg,
                                  color: planCfg.color,
                                  border: `1px solid ${planCfg.border}`,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {planCfg.icon} {planCfg.label}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '14px', color: course.plan_tipo === 'activo' ? '#3b82f6' : 'var(--text-muted)' }}>
                                {course.plan_tipo === 'activo' ? formatCurrency(course.plan_valor_mensual) : '—'}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                                {formatDate(course.plan_fecha_inicio)}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                                {course.plan_fecha_vencimiento ? formatDate(course.plan_fecha_vencimiento) : (
                                  <span style={{ color: '#10b981', fontWeight: '600' }}>∞ Sin límite</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {daysLeft !== null ? (
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: '800',
                                    fontSize: '14px',
                                    color: daysLeft <= 0 ? '#ef4444' : daysLeft <= 7 ? '#f97316' : daysLeft <= 15 ? '#f59e0b' : '#10b981'
                                  }}>
                                    {daysLeft <= 0 ? 'VENCIDO' : `${daysLeft}d`}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                                )}
                              </td>
                              <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {course.plan_notas || '—'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  onClick={() => startEditingPlan(course)}
                                  style={{ 
                                    background: 'none', border: 'none', 
                                    color: 'var(--brand)', cursor: 'pointer', 
                                    display: 'inline-flex', padding: '6px',
                                    borderRadius: '6px'
                                  }}
                                  title="Editar Plan"
                                >
                                  <PencilSimple size={18} weight="bold" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
