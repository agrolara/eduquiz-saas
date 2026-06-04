import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { 
  Trophy, Clock, Star, AirplaneTilt, PlayCircle
} from '@phosphor-icons/react';

const getSessionNameAndLimit = (sess) => {
  if (!sess) return { name: '', limit: -1 };
  const parts = sess.nombre.split('|limit:');
  const name = parts[0];
  const limit = parts[1] ? parseInt(parts[1], 10) : -1;
  return { name, limit };
};

export default function GameRoom({ sessionId, sessionName, onLeave }) {
  const { profile, demoMode } = useAuth();

  const playAlertSound = (type = 'success') => {
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
      
      if (type === 'turn') {
        // Two ascending notes for turn alert
        playTone(523.25, audioCtx.currentTime, 0.12); // C5
        playTone(659.25, audioCtx.currentTime + 0.1, 0.25); // E5
      } else if (type === 'question') {
        // Ding-dong note alert for loaded question
        playTone(587.33, audioCtx.currentTime, 0.15); // D5
        playTone(440.00, audioCtx.currentTime + 0.15, 0.35); // A4
      }
    } catch (err) {
      console.warn("AudioContext not supported or blocked:", err);
    }
  };

  const triggerConfetti = () => {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    // Clear previous particles
    container.innerHTML = '';

    const colors = [
      '#fbbf24', // Warm gold
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#3b82f6', // Indigo
      '#6366f1', // Indigo-Purple
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#f43f5e'  // Deep Rose
    ];

    const particleCount = 75;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = `${Math.floor(Math.random() * 8) + 6}px`;
      const shapeRand = Math.random();
      const shapeRadius = shapeRand > 0.6 ? '50%' : shapeRand > 0.3 ? '2px' : '0px';

      const xStart = `${Math.floor(Math.random() * 100)}vw`;
      const drift = Math.floor(Math.random() * 30) - 15;
      const xEnd = `calc(${xStart} + ${drift}vw)`;
      const yFall = `${Math.floor(Math.random() * 20) + 90}vh`;
      const rotate = `${Math.floor(Math.random() * 720) - 360}deg`;
      const delay = `${Math.floor(Math.random() * 800)}ms`;
      const duration = `${Math.floor(Math.random() * 1500) + 2000}ms`;

      particle.style.setProperty('--color', color);
      particle.style.setProperty('--size', size);
      particle.style.setProperty('--shape-radius', shapeRadius);
      particle.style.setProperty('--x-start', xStart);
      particle.style.setProperty('--x-end', xEnd);
      particle.style.setProperty('--y-fall', yFall);
      particle.style.setProperty('--rotate', rotate);
      particle.style.setProperty('--delay', delay);
      particle.style.setProperty('--duration', duration);

      container.appendChild(particle);
    }
  };
  
  // Game States
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [rankings, setRankings] = useState([]);

  // Celebration States
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFinalCelebration, setShowFinalCelebration] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const prevScoreRef = useRef(null);
  
  // Turn/Round count states
  const [questionsCount, setQuestionsCount] = useState(0);
  const [demoQuestionsCount, setDemoQuestionsCount] = useState(0);
  const [localLimitInput, setLocalLimitInput] = useState('');

  // File Upload States
  const [qFile, setQFile] = useState(null);
  const [uploadingQFile, setUploadingQFile] = useState(false);
  const [myAnswerFile, setMyAnswerFile] = useState(null);
  const [uploadingAnswerFile, setUploadingAnswerFile] = useState(false);
  
  // Timer Ref & State
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180s
  const timerInterval = useRef(null);
  const activeQuestionIdRef = useRef(null);

  useEffect(() => {
    activeQuestionIdRef.current = question?.id;
  }, [question?.id]);

  // Deserialized session details & progress
  const { name: cleanSessionName, limit: roundsLimit } = getSessionNameAndLimit(session);
  const currentTurnNumber = demoMode ? demoQuestionsCount : questionsCount;

  // Final standings / Podium players
  const podiumPlayers = [...players]
    .map(p => {
      const rank = rankings.find(r => r.usuario_id === p.id);
      let points = 0;
      if (rank) {
        if (Array.isArray(rank.historial_participacion)) {
          const entry = rank.historial_participacion.find(h => h.sesion_id === sessionId);
          points = entry ? (entry.puntaje_obtenido || 0) : 0;
        } else {
          // Fallback to cumulative points if DB column is missing (e.g. migration not run)
          points = rank.puntaje_total || 0;
        }
      }
      return { ...p, points };
    })
    .sort((a, b) => b.points - a.points);


  // Forms
  const [qText, setQText] = useState('');
  const [qAnswer, setQAnswer] = useState('');
  const [qImage, setQImage] = useState('');
  const [myAnswerText, setMyAnswerText] = useState('');
  const [myAnswerImage, setMyAnswerImage] = useState('');

  // Helper selectors
  const isMyTurn = session?.turno_actual_usuario_id === profile?.id;
  const currentDrawer = players.find(p => p.id === session?.turno_actual_usuario_id);

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
        { usuario_id: 'demo-student-sofia', email: 'alumna.sofia@gmail.com', puntaje_total: 120 },
        { usuario_id: 'demo-student-benjamin', email: 'alumno.benjamin@gmail.com', puntaje_total: 95 },
        { usuario_id: 'demo-student-mateo', email: 'alumno.mateo@gmail.com', puntaje_total: 80 },
        { usuario_id: 'demo-student-valentina', email: 'alumna.valentina@gmail.com', puntaje_total: 75 }
      ]);
      return;
    }

    // Real Supabase Connection
    fetchSessionDetails();
    const unsubscribe = subscribeToSession();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sessionId, demoMode]);

  useEffect(() => {
    // Sync Timer
    if (session?.estado === 'respuesta' && session?.temporizador_fin) {
      startCountdown(session.temporizador_fin);
    } else {
      clearInterval(timerInterval.current);
    }
    return () => clearInterval(timerInterval.current);
  }, [session?.estado, session?.temporizador_fin]);

  useEffect(() => {
    if (question?.id && !demoMode) {
      fetchAnswers(question.id);
    }
  }, [question?.id, demoMode]);

  // Trigger sound alerts on state changes
  useEffect(() => {
    if (!session) return;
    if (session.estado === 'pregunta' && session.turno_actual_usuario_id === profile?.id) {
      playAlertSound('turn');
    } else if (session.estado === 'respuesta' && question?.id) {
      playAlertSound('question');
    }
  }, [session?.estado, session?.turno_actual_usuario_id, question?.id, profile?.id]);

  // Monitor score increases to trigger victory confetti
  const myRank = rankings.find(r => r.usuario_id === profile?.id);
  const currentScore = myRank ? myRank.puntaje_total : 0;

  useEffect(() => {
    if (rankings.length === 0 || !profile?.id) return;

    if (prevScoreRef.current === null) {
      prevScoreRef.current = currentScore;
      return;
    }

    if (currentScore > prevScoreRef.current) {
      const gain = currentScore - prevScoreRef.current;
      setPointsEarned(gain);
      setShowCelebration(true);
      
      // Delay slightly to ensure confetti DOM is ready
      const confettiTimeout = setTimeout(() => {
        triggerConfetti();
      }, 50);

      const hideTimeout = setTimeout(() => {
        setShowCelebration(false);
      }, 5000);

      prevScoreRef.current = currentScore;
      return () => {
        clearTimeout(confettiTimeout);
        clearTimeout(hideTimeout);
      };
    } else if (currentScore < prevScoreRef.current) {
      prevScoreRef.current = currentScore;
    }
  }, [currentScore, rankings, profile?.id]);

  // Sync local rounds limit input with session database value
  useEffect(() => {
    setLocalLimitInput(roundsLimit > 0 ? String(roundsLimit) : '');
  }, [roundsLimit]);

  // Continuous confetti shower & final victory overlay when game is finalized
  useEffect(() => {
    if (session?.estado === 'finalizado') {
      setShowFinalCelebration(true);
      triggerConfetti();
      const interval = setInterval(() => {
        triggerConfetti();
      }, 3000);
      return () => {
        clearInterval(interval);
      };
    } else {
      setShowFinalCelebration(false);
    }
  }, [session?.estado]);

  // Polling fallback: fetch answers every 3 seconds during respuesta phase
  useEffect(() => {
    if (session?.estado === 'respuesta' && question?.id && !demoMode) {
      const pollInterval = setInterval(() => {
        fetchAnswers(question.id);
      }, 3000);
      return () => clearInterval(pollInterval);
    }
  }, [session?.estado, question?.id, demoMode]);

  // Auto-grade non-responders when the round transitions to evaluation phase
  useEffect(() => {
    if (session?.estado === 'evaluacion' && isMyTurn && question?.id) {
      autoGradeNonResponders();
    }
  }, [session?.estado, isMyTurn, question?.id]);

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
        setDemoQuestionsCount(prev => prev + 1);
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

  const startCountdown = (endTimeString) => {
    clearInterval(timerInterval.current);
    if (demoMode) {
      // In demo mode, count down from 180s normally
      timerInterval.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            setSession(s => ({ ...s, estado: 'evaluacion' }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    if (!endTimeString) return;

    const tick = () => {
      const endTime = new Date(endTimeString).getTime();
      const now = Date.now();
      const left = Math.floor((endTime - now) / 1000);

      if (left <= 0) {
        clearInterval(timerInterval.current);
        setTimeLeft(0);
        
        // Switch session state to evaluation once time expires.
        // Allow any active client to perform this single-shot update safely.
        supabase
          .from('sesiones_juego')
          .update({ estado: 'evaluacion' })
          .eq('id', sessionId)
          .eq('estado', 'respuesta');
      } else {
        setTimeLeft(left);
      }
    };

    tick(); // Run immediately on start
    timerInterval.current = setInterval(tick, 1000);
  };

  const handleFileUpload = async (file, path) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('quiz-assets')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('quiz-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const isImageFile = (url) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.png') || 
           cleanUrl.endsWith('.jpg') || 
           cleanUrl.endsWith('.jpeg') || 
           cleanUrl.endsWith('.gif') || 
           cleanUrl.endsWith('.webp') || 
           cleanUrl.endsWith('.svg');
  };

  const fetchSessionDetails = async () => {
    const { data: sess, error: err1 } = await supabase.from('sesiones_juego').select('*').eq('id', sessionId).single();
    if (err1) return console.error(err1);
    setSession(sess);
    fetchQuestionsCount();

    // Get whitelisted / joined users (only students, excluding teacher)
    const { data: users, error: err2 } = await supabase
      .from('perfiles_usuarios')
      .select('*')
      .eq('curso_id', sess.curso_id)
      .eq('rol', 'jugador');
    if (!err2) setPlayers(users);

    if (sess.pregunta_actual_id) {
      const { data: q } = await supabase.from('preguntas').select('*').eq('id', sess.pregunta_actual_id).single();
      setQuestion(q);
      
      // Load current answers on load/refresh (no join - fetch profiles separately)
      const { data: ansList, error: ansErr } = await supabase
        .from('respuestas')
        .select('*')
        .eq('pregunta_id', q.id);
      if (ansErr) console.error('Error loading answers:', ansErr);
      if (ansList && ansList.length > 0) {
        const playerIds = [...new Set(ansList.map(a => a.alumno_id))];
        const { data: profiles } = await supabase
          .from('perfiles_usuarios')
          .select('id, nombre, email')
          .in('id', playerIds);
        const profileMap = {};
        profiles?.forEach(p => { profileMap[p.id] = p; });
        setAnswers(ansList.map(ans => ({
          id: ans.id,
          alumno_id: ans.alumno_id,
          nombre: profileMap[ans.alumno_id]?.nombre || profileMap[ans.alumno_id]?.email || 'Alumno',
          texto: ans.texto,
          calificacion: ans.calificacion,
          url_imagen: ans.url_imagen
        })));
      }
    }

    // Set initial timer timeLeft if session is in progress
    if (sess.estado === 'respuesta' && sess.temporizador_fin) {
      const endTime = new Date(sess.temporizador_fin).getTime();
      const now = Date.now();
      const left = Math.floor((endTime - now) / 1000);
      setTimeLeft(left > 0 ? left : 0);
    }

    // Fetch initial rankings (no join, match by usuario_id directly in frontend)
    const { data: ranks } = await supabase
      .from('rankings')
      .select('*')
      .eq('curso_id', sess.curso_id);
    if (ranks) {
      setRankings(ranks);
    }
  };

  const subscribeToSession = () => {
    const channel = supabase.channel(`game:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sesiones_juego', filter: `id=eq.${sessionId}` }, payload => {
        setSession(payload.new);
        fetchQuestionsCount();
        if (payload.new.estado === 'finalizado') {
          fetchRankings();
        }
        if (payload.new.pregunta_actual_id) {
          fetchQuestion(payload.new.pregunta_actual_id);
        }
        if (payload.new.estado === 'respuesta' && payload.new.temporizador_fin) {
          const endTime = new Date(payload.new.temporizador_fin).getTime();
          const now = Date.now();
          const left = Math.floor((endTime - now) / 1000);
          setTimeLeft(left > 0 ? left : 0);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'preguntas' }, payload => {
        if (payload.new.sesion_id === sessionId) {
          setQuestion(payload.new);
          fetchQuestionsCount();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'respuestas' }, payload => {
        if (activeQuestionIdRef.current && payload.new.pregunta_id === activeQuestionIdRef.current) {
          fetchAnswers(activeQuestionIdRef.current);
        }
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
    try {
      const { data: sess } = await supabase.from('sesiones_juego').select('curso_id').eq('id', sessionId).single();
      if (!sess) return;
      
      const { data: ranks, error } = await supabase
        .from('rankings')
        .select('*')
        .eq('curso_id', sess.curso_id);
      if (error) {
        console.error("Error fetching rankings:", error);
        return;
      }
      if (ranks) {
        setRankings(ranks);
      }
    } catch (err) {
      console.error("Crash in fetchRankings:", err);
    }
  };

  const fetchQuestionsCount = async () => {
    if (demoMode) return;
    try {
      const { count, error } = await supabase
        .from('preguntas')
        .select('*', { count: 'exact', head: true })
        .eq('sesion_id', sessionId);
      if (!error && count !== null) {
        setQuestionsCount(count);
      }
    } catch (err) {
      console.error("Error fetching questions count:", err);
    }
  };

  const fetchAnswers = async (qId) => {
    const targetQId = qId || question?.id;
    if (!targetQId) return;
    try {
      // Query answers WITHOUT join (avoids PostgREST FK resolution issues)
      const { data, error } = await supabase
        .from('respuestas')
        .select('*')
        .eq('pregunta_id', targetQId);

      if (error) {
        console.error('Error fetching answers:', error);
        return;
      }

      if (data && data.length > 0) {
        // Fetch profiles separately
        const playerIds = [...new Set(data.map(a => a.alumno_id))];
        const { data: profiles } = await supabase
          .from('perfiles_usuarios')
          .select('id, nombre, email')
          .in('id', playerIds);
        const profileMap = {};
        profiles?.forEach(p => { profileMap[p.id] = p; });

        setAnswers(data.map(ans => ({
          id: ans.id,
          alumno_id: ans.alumno_id,
          nombre: profileMap[ans.alumno_id]?.nombre || profileMap[ans.alumno_id]?.email || 'Alumno',
          texto: ans.texto,
          calificacion: ans.calificacion,
          url_imagen: ans.url_imagen
        })));
      } else if (data && data.length === 0) {
        setAnswers([]);
      }
    } catch (err) {
      console.error('Crash in fetchAnswers:', err);
    }
  };

  const handleApplyLimit = () => {
    const val = localLimitInput.trim();
    const num = val === '' ? -1 : parseInt(val, 10);
    if (isNaN(num)) {
      handleUpdateLimit(-1);
    } else {
      handleUpdateLimit(num);
    }
  };

  const handleUpdateLimit = async (newLimit) => {
    const limitVal = parseInt(newLimit, 10);
    if (isNaN(limitVal)) return;

    if (demoMode) {
      setSession(s => ({
        ...s,
        nombre: `${cleanSessionName}|limit:${limitVal}`
      }));
      return;
    }

    try {
      const serializedName = `${cleanSessionName}|limit:${limitVal}`;
      const { error } = await supabase
        .from('sesiones_juego')
        .update({ nombre: serializedName })
        .eq('id', sessionId);
      if (error) {
        alert("Error al actualizar límite de rondas: " + error.message);
      }
    } catch (err) {
      console.error("Crash updating rounds limit:", err);
    }
  };

  const handleEndGame = async () => {
    if (!window.confirm("¿Estás seguro de que deseas finalizar la partida ahora? Esto mostrará el podio final a todos los alumnos.")) {
      return;
    }

    if (demoMode) {
      setSession(s => ({
        ...s,
        estado: 'finalizado'
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('sesiones_juego')
        .update({
          estado: 'finalizado',
          finalizado_en: new Date().toISOString()
        })
        .eq('id', sessionId);
      if (error) {
        alert("Error al finalizar la partida: " + error.message);
      }
    } catch (err) {
      console.error("Crash ending game:", err);
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
        url_imagen: null,
        respuesta_correcta: qAnswer
      };
      setQuestion(mockQ);
      setSession(s => ({ ...s, estado: 'respuesta', pregunta_actual_id: mockQ.id }));
      setDemoQuestionsCount(prev => prev + 1);
      setTimeLeft(180);
      setQText('');
      setQAnswer('');
      setQFile(null);
      return;
    }

    try {
      setUploadingQFile(true);
      let uploadedUrl = null;
      if (qFile) {
        uploadedUrl = await handleFileUpload(qFile, 'questions');
      }

      // Real Supabase insert
      const { data: newQ, error: qErr } = await supabase
        .from('preguntas')
        .insert([{
          sesion_id: sessionId,
          creador_id: profile.id,
          texto: qText,
          url_imagen: uploadedUrl,
          respuesta_correcta: qAnswer
        }])
        .select();

      if (qErr) {
        alert("Error al enviar pregunta: " + qErr.message);
        setUploadingQFile(false);
        return;
      }

      if (!newQ || newQ.length === 0) {
        alert("Error: No se pudo registrar la pregunta. RLS policy error.");
        setUploadingQFile(false);
        return;
      }

      // Set countdown end time 3 minutes from now
      const endTime = new Date(Date.now() + 180 * 1000).toISOString();

      const { error: sErr } = await supabase
        .from('sesiones_juego')
        .update({
          estado: 'respuesta',
          pregunta_actual_id: newQ[0].id,
          temporizador_fin: endTime
        })
        .eq('id', sessionId);
      
      if (sErr) {
        alert("Error al actualizar partida: " + sErr.message);
      } else {
        // CRITICAL: Set question and session state locally so UI transitions immediately
        setQuestion(newQ[0]);
        setSession(s => ({
          ...s,
          estado: 'respuesta',
          pregunta_actual_id: newQ[0].id,
          temporizador_fin: endTime
        }));
        setQText('');
        setQAnswer('');
        setQFile(null);
      }
    } catch (err) {
      console.error("Crash submitting question:", err);
      alert("Error inesperado al enviar la pregunta: " + err.message);
    } finally {
      setUploadingQFile(false);
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
      setMyAnswerFile(null);
      return;
    }

    try {
      setUploadingAnswerFile(true);
      let uploadedUrl = null;
      if (myAnswerFile) {
        uploadedUrl = await handleFileUpload(myAnswerFile, 'answers');
      }

      const { error } = await supabase
        .from('respuestas')
        .insert([{
          pregunta_id: question.id,
          alumno_id: profile.id,
          texto: myAnswerText,
          url_imagen: uploadedUrl
        }]);
      
      if (error) {
        alert("Error al responder: " + error.message);
      } else {
        setMyAnswerText('');
        setMyAnswerFile(null);
        alert("¡Respuesta enviada!");
        fetchAnswers(question?.id);
      }
    } catch (err) {
      console.error("Crash submitting answer:", err);
      alert("Error inesperado al enviar la respuesta: " + err.message);
    } finally {
      setUploadingAnswerFile(false);
    }
  };

  const autoGradeNonResponders = async () => {
    if (!session || !question || !players.length) return;
    
    // Students who need to answer (exclude the creator/drawer)
    const activeStudents = players.filter(p => p.id !== session.turno_actual_usuario_id);
    
    // Find who hasn't answered
    const nonResponders = activeStudents.filter(student => 
      !answers.some(ans => ans.alumno_id === student.id)
    );

    if (nonResponders.length === 0) return;

    if (demoMode) {
      const mockInserts = nonResponders.map(student => ({
        id: `ans-dummy-${student.id}`,
        alumno_id: student.id,
        nombre: student.nombre,
        texto: '(No respondió)',
        calificacion: 0
      }));
      setAnswers(prev => {
        const existingIds = prev.map(a => a.alumno_id);
        const filtered = mockInserts.filter(m => !existingIds.includes(m.alumno_id));
        return [...prev, ...filtered];
      });
      return;
    }

    const inserts = nonResponders.map(student => ({
      pregunta_id: question.id,
      alumno_id: student.id,
      texto: '(No respondió)',
      calificacion: 0
    }));

    try {
      const { error } = await supabase
        .from('respuestas')
        .insert(inserts);

      if (error) {
        console.error("Error auto-grading non-responders:", error);
      } else {
        fetchAnswers(question.id);
      }
    } catch (err) {
      console.error("Crash in autoGradeNonResponders:", err);
    }
  };

  const handleGradeAnswer = async (answerId, score) => {
    // 1. Update local state immediately for instant feedback
    setAnswers(prev => prev.map(ans => ans.id === answerId ? { ...ans, calificacion: score } : ans));

    if (demoMode) return;

    // 2. Persist to DB immediately
    try {
      const { error } = await supabase
        .from('respuestas')
        .update({ calificacion: score })
        .eq('id', answerId);
      if (error) {
        console.error('Error updating grade in DB:', error);
      }
    } catch (err) {
      console.error('Crash updating grade in DB:', err);
    }
  };

  const handleFinishEvaluation = async () => {
    // Prevent finishing round if there are ungraded student answers
    const ungradedAnswers = answers.filter(ans => 
      ans.alumno_id !== session.turno_actual_usuario_id && 
      (ans.calificacion === null || ans.calificacion === undefined)
    );

    if (ungradedAnswers.length > 0) {
      const names = ungradedAnswers.map(a => a.nombre).join(', ');
      alert(`No se puede finalizar la ronda. Falta calificar la respuesta de: ${names}`);
      return;
    }

    if (demoMode) {
      // 1. Auto-insert "(No respondió)" for any student who hasn't answered yet in demo mode
      const activeStudents = players.filter(p => p.id !== session.turno_actual_usuario_id);
      const nonResponders = activeStudents.filter(student => 
        !answers.some(ans => ans.alumno_id === student.id)
      );
      
      let updatedAnswersList = [...answers];
      if (nonResponders.length > 0) {
        const mockInserts = nonResponders.map(student => ({
          id: `ans-dummy-${student.id}`,
          alumno_id: student.id,
          nombre: student.nombre,
          texto: '(No respondió)',
          calificacion: 0
        }));
        updatedAnswersList = [...updatedAnswersList, ...mockInserts];
      }

      // Update mock rankings (demo mode)
      for (const ans of updatedAnswersList) {
        const finalGrade = typeof ans.calificacion === 'number' ? ans.calificacion : 0;
        setRankings(prev => prev.map(r => {
          if (r.usuario_id === ans.alumno_id) {
            let historial = Array.isArray(r.historial_participacion) ? r.historial_participacion : [];
            const existingSessionIndex = historial.findIndex(h => h.sesion_id === sessionId);
            let newSesionesJugadas = r.sesiones_jugadas || 0;

            if (existingSessionIndex !== -1) {
              historial[existingSessionIndex].puntaje_obtenido = (historial[existingSessionIndex].puntaje_obtenido || 0) + finalGrade;
            } else {
              historial.push({
                sesion_id: sessionId,
                sesion_nombre: sessionName,
                fecha: new Date().toISOString().split('T')[0],
                puntaje_obtenido: finalGrade
              });
              newSesionesJugadas = newSesionesJugadas + 1;
            }

            return {
              ...r,
              puntaje_total: r.puntaje_total + finalGrade,
              sesiones_jugadas: newSesionesJugadas,
              historial_participacion: historial
            };
          }
          return r;
        }));
      }

      const isLimitReached = roundsLimit > 0 && demoQuestionsCount >= roundsLimit;
      setSession(s => {
        if (isLimitReached) {
          return {
            ...s,
            estado: 'finalizado'
          };
        }
        const currentIndex = s.orden_turnos.indexOf(s.turno_actual_usuario_id);
        const nextIndex = (currentIndex + 1) % s.orden_turnos.length;
        return {
          ...s,
          estado: 'pregunta',
          turno_actual_usuario_id: s.orden_turnos[nextIndex],
          pregunta_actual_id: null
        };
      });
      if (isLimitReached) {
        alert("¡Partida finalizada! Se ha alcanzado el límite de rondas.");
      } else {
        alert("Evaluación completada. Se han repartido los puntos y pasamos al siguiente turno.");
      }
      setAnswers([]);
      setQuestion(null);
      return;
    }

    // 1. Auto-grade non-responders in the DB (for safety if finished early)
    const activeStudents = players.filter(p => p.id !== session.turno_actual_usuario_id);
    const nonResponders = activeStudents.filter(student => 
      !answers.some(ans => ans.alumno_id === student.id)
    );

    let updatedAnswersList = [...answers];

    if (nonResponders.length > 0) {
      const inserts = nonResponders.map(student => ({
        pregunta_id: question.id,
        alumno_id: student.id,
        texto: '(No respondió)',
        calificacion: 0
      }));

      const { data, error } = await supabase
        .from('respuestas')
        .insert(inserts)
        .select();

      if (!error && data) {
        const formatted = data.map(ans => {
          const student = nonResponders.find(s => s.id === ans.alumno_id);
          return {
            id: ans.id,
            alumno_id: ans.alumno_id,
            nombre: student?.nombre || student?.email || 'Alumno',
            texto: ans.texto,
            calificacion: ans.calificacion,
            url_imagen: ans.url_imagen
          };
        });
        updatedAnswersList = [...updatedAnswersList, ...formatted];
      } else {
        console.error("Error inserting non-responders answers:", error);
      }
    }

    // Save grades and rankings individually - failures don't block turn rotation
    for (const ans of updatedAnswersList) {
      const finalGrade = typeof ans.calificacion === 'number' ? ans.calificacion : 0;
      try {
        await supabase
          .from('respuestas')
          .update({ calificacion: finalGrade })
          .eq('id', ans.id);

        // Fetch current ranking for the student to update scores & participation
        const { data: rank } = await supabase
          .from('rankings')
          .select('*')
          .eq('curso_id', session.curso_id)
          .eq('usuario_id', ans.alumno_id)
          .single();

        let newHistorialEntry = {
          sesion_id: sessionId,
          sesion_nombre: session.nombre,
          fecha: new Date().toISOString().split('T')[0],
          puntaje_obtenido: finalGrade
        };

        if (rank) {
          const updatePayload = {
            puntaje_total: rank.puntaje_total + finalGrade
          };

          let newSesionesJugadas = rank.sesiones_jugadas !== undefined ? rank.sesiones_jugadas : 0;
          let historial = Array.isArray(rank.historial_participacion) ? rank.historial_participacion : [];
          const existingSessionIndex = historial.findIndex(h => h.sesion_id === sessionId);

          if (existingSessionIndex !== -1) {
            historial[existingSessionIndex].puntaje_obtenido = (historial[existingSessionIndex].puntaje_obtenido || 0) + finalGrade;
          } else {
            historial.push(newHistorialEntry);
            newSesionesJugadas = newSesionesJugadas + 1;
          }

          if (rank.sesiones_jugadas !== undefined) {
            updatePayload.sesiones_jugadas = newSesionesJugadas;
          }
          if (rank.historial_participacion !== undefined) {
            updatePayload.historial_participacion = historial;
          }

          const { error: upErr } = await supabase
            .from('rankings')
            .update(updatePayload)
            .eq('id', rank.id);

          // Fallback if columns are missing
          if (upErr && upErr.code === '42703') {
            console.warn("Table rankings lacks sesiones_jugadas or historial_participacion. Updating only puntaje_total.");
            await supabase
              .from('rankings')
              .update({ puntaje_total: rank.puntaje_total + finalGrade })
              .eq('id', rank.id);
          }
        } else {
          // Attempt insert with all columns
          const { error: insErr } = await supabase
            .from('rankings')
            .insert([{
              curso_id: session.curso_id,
              usuario_id: ans.alumno_id,
              puntaje_total: finalGrade,
              sesiones_jugadas: 1,
              historial_participacion: [newHistorialEntry]
            }]);

          // Fallback if columns are missing
          if (insErr && insErr.code === '42703') {
            console.warn("Table rankings lacks sesiones_jugadas or historial_participacion. Inserting only basic fields.");
            await supabase
              .from('rankings')
              .insert([{
                curso_id: session.curso_id,
                usuario_id: ans.alumno_id,
                puntaje_total: finalGrade
              }]);
          }
        }
      } catch (gradeErr) {
        console.error('Error grading answer', ans.id, gradeErr);
      }
    }

    // ALWAYS rotate turns regardless of grading success
    try {
      const isLimitReached = roundsLimit > 0 && questionsCount >= roundsLimit;

      const currentIndex = session.orden_turnos.indexOf(session.turno_actual_usuario_id);
      const nextIndex = (currentIndex + 1) % session.orden_turnos.length;

      const updatePayload = isLimitReached 
        ? {
            estado: 'finalizado',
            finalizado_en: new Date().toISOString()
          }
        : {
            estado: 'pregunta',
            turno_actual_usuario_id: session.orden_turnos[nextIndex],
            pregunta_actual_id: null,
            temporizador_fin: null
          };

      const { error: sErr } = await supabase
        .from('sesiones_juego')
        .update(updatePayload)
        .eq('id', sessionId);

      if (sErr) {
        alert("Error al actualizar partida: " + sErr.message);
      } else {
        setAnswers([]);
        setQuestion(null);
        if (isLimitReached) {
          alert("¡Partida finalizada! Se ha alcanzado el límite de rondas.");
        }
      }
    } catch (err) {
      console.error("Crash updating turns/ending game:", err);
      alert("Error inesperado al actualizar la partida: " + err.message);
    }
  };

  // Helper selectors (moved to top to avoid TDZ issues)
  
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
          <h1 style={{ fontSize: '28px', color: 'var(--brand-dark)' }}>{cleanSessionName}</h1>
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
            <div className="double-bezel-outer">
              <div className="double-bezel-inner" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <PlayCircle size={64} color="var(--brand)" style={{ marginBottom: '16px', display: 'inline-block' }} />
                <h2 className="stage-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>¡Bienvenidos a la Sala de Espera!</h2>
                <p className="stage-description">
                  Estamos esperando a que todos los compañeros se conecten a la sesión.
                </p>

                <div style={{ maxWidth: '400px', margin: '0 auto 32px' }}>
                  <h4 style={{ marginBottom: '12px', textAlign: 'left', fontWeight: '800' }}>Jugadores en línea ({players.length}):</h4>
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
            </div>
          )}

          {/* QUESTION PHASE */}
          {session.estado === 'pregunta' && (
            <div className="double-bezel-outer">
              <div className="double-bezel-inner">
                <h2 className="stage-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>Fase de Pregunta</h2>
                
                {isMyTurn ? (
                  <div>
                    <p className="stage-description">
                      ¡Es tu turno de desafiar a tus compañeros! Escribe una pregunta inteligente y añade un archivo de apoyo si lo deseas.
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
                          disabled={uploadingQFile}
                          style={{ resize: 'none' }}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Adjuntar Archivo Complementario (Opcional - Imagen, PDF, Documento)</label>
                        <input 
                          type="file" 
                          className="form-input"
                          onChange={(e) => setQFile(e.target.files[0])}
                          disabled={uploadingQFile}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Respuesta Correcta Esperada</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej: Mercurio"
                          value={qAnswer}
                          onChange={(e) => setQAnswer(e.target.value)}
                          required
                          disabled={uploadingQFile}
                        />
                      </div>

                      <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={uploadingQFile}>
                        {uploadingQFile ? 'Subiendo archivo y pregunta...' : 'Enviar Pregunta al Aula'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '28px', margin: '0 auto 16px' }}>
                      {currentDrawer?.nombre ? currentDrawer.nombre[0] : 'U'}
                    </div>
                    <h3 style={{ marginBottom: '8px', fontWeight: '800' }}>Esperando a {currentDrawer?.nombre || 'compañero'}</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                      Está redactando la pregunta en este momento. ¡Prepara tus conocimientos!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANSWER PHASE */}
          {session.estado === 'respuesta' && question && (
            <div className="double-bezel-outer" style={{ position: 'relative' }}>
              {/* Synchronous 3-minute timer bubble */}
              <div className="timer-bubble">
                <Clock weight="fill" />
                {formatTime(timeLeft)}
              </div>

              <div className="double-bezel-inner" style={{ paddingTop: '40px' }}>
                <span className="tag tag-success" style={{ marginBottom: '12px', width: 'fit-content' }}>Pregunta Activa</span>
                <h2 className="stage-title" style={{ color: 'var(--text-main)', fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: '800', lineHeight: '1.2', marginBottom: '20px' }}>{question.texto}</h2>
                
                {question.url_imagen && (
                  <div style={{ margin: '20px 0', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: '#f8fafc', maxWidth: '450px' }}>
                    {isImageFile(question.url_imagen) ? (
                      <img src={question.url_imagen} alt="Archivo adjunto de la pregunta" style={{ width: '100%', borderRadius: 'var(--radius-sm)', display: 'block' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>📎</span>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)' }}>Archivo adjunto de pregunta</div>
                          <a href={question.url_imagen} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--brand)', fontWeight: '700', textDecoration: 'underline' }}>
                            Descargar / Ver archivo
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isMyTurn ? (
                  <div>
                    <div style={{ backgroundColor: 'var(--brand-light)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-focus)', marginBottom: '20px' }}>
                      <h4 style={{ color: 'var(--brand-dark)', marginBottom: '4px', fontSize: '14px', fontWeight: '800' }}>Tu respuesta correcta:</h4>
                      <p style={{ fontWeight: '700', fontSize: '16px', margin: 0 }}>{question.respuesta_correcta}</p>
                    </div>

                    <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: '800' }}>
                      Respuestas recibidas ({answers.filter(a => a.alumno_id !== profile.id).length}):
                    </h3>

                    {answers.filter(ans => ans.alumno_id !== profile.id).length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                        Esperando respuestas de tus compañeros...
                      </p>
                    ) : (
                      <div className="grading-panel">
                        {answers.filter(ans => ans.alumno_id !== profile.id).map(ans => (
                          <div key={ans.id} className="grading-item">
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Respuesta de {ans.nombre}:
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>"{ans.texto}"</div>
                              {ans.url_imagen && (
                                <div style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', display: 'inline-block', marginTop: '6px', maxWidth: '300px' }}>
                                  {isImageFile(ans.url_imagen) ? (
                                    <a href={ans.url_imagen} target="_blank" rel="noopener noreferrer">
                                      <img src={ans.url_imagen} alt="Respuesta adjunta" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px', display: 'block' }} />
                                    </a>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>📎</span>
                                      <a href={ans.url_imagen} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: '700', textDecoration: 'underline' }}>
                                        Ver archivo adjunto
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="grading-buttons">
                              <button className={`grade-btn grade-btn-bad ${ans.calificacion === 0 ? 'selected' : ''}`} onClick={() => handleGradeAnswer(ans.id, 0)}>Mala (0 pt)</button>
                              <button className={`grade-btn grade-btn-mid ${ans.calificacion === 5 ? 'selected' : ''}`} onClick={() => handleGradeAnswer(ans.id, 5)}>Regular (5 pt)</button>
                              <button className={`grade-btn grade-btn-good ${ans.calificacion === 10 ? 'selected' : ''}`} onClick={() => handleGradeAnswer(ans.id, 10)}>Buena (10 pt)</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {answers.filter(a => a.alumno_id !== profile.id).length > 0 && (
                      <button 
                        className="btn btn-primary" 
                        onClick={handleFinishEvaluation}
                        style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
                      >
                        Finalizar Ronda & Siguiente Turno
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {answers.some(ans => ans.alumno_id === profile.id) ? (
                      <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '16px', borderRadius: 'var(--radius-md)', fontWeight: '800', textAlign: 'center' }}>
                        ✓ ¡Respuesta enviada con éxito! Esperando que termine el tiempo o evalúe el creador.
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitAnswer}>
                        <div className="form-group">
                          <label className="form-label">Tu Respuesta (Texto)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Escribe tu respuesta aquí..."
                            value={myAnswerText}
                            onChange={(e) => setMyAnswerText(e.target.value)}
                            required
                            disabled={timeLeft === 0 || uploadingAnswerFile}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Adjuntar Archivo de Respuesta (Opcional - Foto, PDF, etc.)</label>
                          <input 
                            type="file" 
                            className="form-input"
                            onChange={(e) => setMyAnswerFile(e.target.files[0])}
                            disabled={timeLeft === 0 || uploadingAnswerFile}
                          />
                        </div>

                        <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={timeLeft === 0 || uploadingAnswerFile}>
                          {uploadingAnswerFile ? 'Subiendo respuesta y archivo...' : 'Enviar Respuesta'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EVALUATION PHASE */}
          {session.estado === 'evaluacion' && (
            <div className="double-bezel-outer">
              <div className="double-bezel-inner">
                <h2 className="stage-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800' }}>Fase de Calificación</h2>
                <p className="stage-description">
                  La respuesta correcta esperada era: <strong style={{ color: 'var(--success)' }}>{question?.respuesta_correcta}</strong>
                </p>

                {isMyTurn ? (
                  <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '800' }}>Califica las respuestas de tus compañeros:</h3>
                    
                    <div className="grading-panel">
                      {answers.filter(ans => ans.alumno_id !== profile.id).map(ans => (
                        <div key={ans.id} className="grading-item">
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              Respuesta de {ans.nombre}:
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>"{ans.texto}"</div>

                            {/* Render student uploaded file */}
                            {ans.url_imagen && (
                              <div style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', display: 'inline-block', marginTop: '6px', maxWidth: '300px' }}>
                                {isImageFile(ans.url_imagen) ? (
                                  <a href={ans.url_imagen} target="_blank" rel="noopener noreferrer">
                                    <img src={ans.url_imagen} alt="Respuesta adjunta" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px', display: 'block' }} />
                                  </a>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>📎</span>
                                    <a href={ans.url_imagen} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: '700', textDecoration: 'underline' }}>
                                      Ver archivo adjunto
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="grading-buttons">
                            <button 
                              className={`grade-btn grade-btn-bad ${ans.calificacion === 0 ? 'selected' : ''}`}
                              onClick={() => handleGradeAnswer(ans.id, 0)}
                            >
                              Mala (0 pt)
                            </button>
                            <button 
                              className={`grade-btn grade-btn-mid ${ans.calificacion === 5 ? 'selected' : ''}`}
                              onClick={() => handleGradeAnswer(ans.id, 5)}
                            >
                              Regular (5 pt)
                            </button>
                            <button 
                              className={`grade-btn grade-btn-good ${ans.calificacion === 10 ? 'selected' : ''}`}
                              onClick={() => handleGradeAnswer(ans.id, 10)}
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
                      style={{ width: '100%', marginTop: '32px', justifyContent: 'center' }}
                    >
                      Finalizar Ronda & Actualizar Ranking
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '28px', margin: '0 auto 16px', backgroundColor: 'var(--warning)', color: '#b45309' }}>
                      ★
                    </div>
                    <h3 style={{ marginBottom: '8px', fontWeight: '800' }}>El creador está evaluando</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                      {currentDrawer?.nombre} está revisando las respuestas. ¡Pronto sabremos el ranking actualizado!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FINALIZED PHASE */}
          {session.estado === 'finalizado' && (
            <div className="double-bezel-outer">
              <div className="double-bezel-inner" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div className="celebrate-icon-ring" style={{ width: '96px', height: '96px', fontSize: '48px' }}>
                  🏆
                </div>
                <h2 className="stage-title" style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '36px', color: 'var(--brand-dark)' }}>
                  ¡Desafío Completado!
                </h2>
                <p className="stage-description" style={{ marginBottom: '40px' }}>
                  La partida ha finalizado con éxito. Felicitaciones a todos los participantes por su excelente desempeño escolar.
                </p>

                {/* 3D Podium Visualization */}
                <div className="podium-container">
                  {/* 2nd Place */}
                  {podiumPlayers[1] && (
                    <div className="podium-step-wrapper">
                      <div className="podium-avatar" style={{ border: '2px solid #cbd5e1' }}>
                        {podiumPlayers[1].nombre[0]}
                      </div>
                      <div className="podium-name">{podiumPlayers[1].nombre}</div>
                      <div className="podium-points">{podiumPlayers[1].points} pts</div>
                      <div className="podium-step step-2" style={{ height: '100px' }}>
                        <span>2°</span>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {podiumPlayers[0] && (
                    <div className="podium-step-wrapper">
                      <div className="podium-avatar" style={{ border: '3px solid #fbbf24', width: '56px', height: '56px', fontSize: '24px' }}>
                        👑
                      </div>
                      <div className="podium-name" style={{ fontWeight: '800' }}>{podiumPlayers[0].nombre}</div>
                      <div className="podium-points" style={{ fontWeight: '800', color: 'var(--warning)' }}>{podiumPlayers[0].points} pts</div>
                      <div className="podium-step step-1" style={{ height: '140px' }}>
                        <span>1°</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {podiumPlayers[2] && (
                    <div className="podium-step-wrapper">
                      <div className="podium-avatar" style={{ border: '2px solid #fed7aa' }}>
                        {podiumPlayers[2].nombre[0]}
                      </div>
                      <div className="podium-name">{podiumPlayers[2].nombre}</div>
                      <div className="podium-points">{podiumPlayers[2].points} pts</div>
                      <div className="podium-step step-3" style={{ height: '70px' }}>
                        <span>3°</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scoreboard List */}
                {podiumPlayers.length > 3 && (
                  <div style={{ maxWidth: '500px', margin: '0 auto 32px', textAlign: 'left' }}>
                    <h4 style={{ marginBottom: '16px', fontWeight: '800', textAlign: 'center' }}>Tabla de Posiciones Final</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {podiumPlayers.slice(3).map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                          <span style={{ fontWeight: '700' }}>#{idx + 4} {p.nombre}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{p.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(profile.rol === 'admin_curso' || profile.rol === 'super_admin') && (
                  <button className="btn btn-primary" onClick={onLeave} style={{ marginTop: '24px' }}>
                    Volver al Dashboard
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Panel de Control del Profesor */}
        {(profile.rol === 'admin_curso' || profile.rol === 'super_admin') && session.estado !== 'finalizado' && (
          <div className="double-bezel-outer" style={{ marginBottom: '24px' }}>
            <div className="double-bezel-inner" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-dark)', marginBottom: '16px' }}>
                ⚙️ Control del Profesor
              </h3>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: '6px' }}>Límite de Rondas/Turnos:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="number" 
                    min="1"
                    className="form-input" 
                    style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '14px', flex: 1 }}
                    placeholder="Sin límite (libre)"
                    value={localLimitInput}
                    onChange={(e) => setLocalLimitInput(e.target.value)}
                    onBlur={handleApplyLimit}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyLimit(); }}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={handleApplyLimit}
                    style={{ padding: '8px 14px', fontSize: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  >
                    Fijar
                  </button>
                </div>
                <small style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Presiona Enter o "Fijar". Dejar vacío para rondas libres.
                </small>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Progreso:</span>
                  <span>{currentTurnNumber} {roundsLimit > 0 ? `/ ${roundsLimit}` : ''} turnos</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: roundsLimit > 0 ? `${Math.min(100, (currentTurnNumber / roundsLimit) * 100)}%` : '50%', 
                      backgroundColor: 'var(--brand)', 
                      borderRadius: '4px',
                      transition: 'width 0.4s ease-out'
                    }} 
                  />
                </div>
              </div>

              {session.estado !== 'esperando' && (
                <button 
                  className="btn btn-secondary" 
                  onClick={handleEndGame}
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    padding: '10px', 
                    borderColor: 'var(--danger)', 
                    color: 'var(--danger)', 
                    fontSize: '13px',
                    fontWeight: '800'
                  }}
                >
                  Finalizar Partida Ahora
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sidebar Leaderboard */}
        <div className="game-leaderboard">
          <h3 className="leaderboard-title">
            <Trophy weight="fill" size={22} color="var(--warning)" />
            Puntajes de la Sesión
          </h3>
          
          <div className="leaderboard-list">
            {podiumPlayers.map((p, idx) => {
              const podiumClass = idx === 0 ? 'podium-1' : idx === 1 ? 'podium-2' : idx === 2 ? 'podium-3' : '';
              return (
                <div key={p.id} className={`leaderboard-item ${podiumClass}`}>
                  <div className="leaderboard-user">
                    <span className="leaderboard-rank">#{idx + 1}</span>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{p.nombre}</span>
                  </div>
                  <span className="leaderboard-points">{p.points} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confetti Container DOM target */}
      <div id="confetti-container" />

      {/* Celebration overlay modal */}
      {showCelebration && (
        <div className="celebration-overlay" onClick={() => setShowCelebration(false)}>
          <div className="celebration-card-outer double-bezel-outer" onClick={(e) => e.stopPropagation()}>
            <div className="celebration-card-inner double-bezel-inner">
              <div className="celebrate-icon-ring">
                🏆
              </div>
              <h2 className="celebrate-title">
                {pointsEarned >= 10 ? '¡Excelente respuesta! 🌟' : '¡Buen trabajo! 👍'}
              </h2>
              <p className="celebrate-subtitle">
                Has respondido correctamente y ayudado al aula. ¡Sigue así para liderar el podio!
              </p>
              <div className="celebrate-score-badge">
                <span>+{pointsEarned} PUNTOS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Session Winner Celebration Overlay */}
      {showFinalCelebration && podiumPlayers.length > 0 && (
        <div className="celebration-overlay" onClick={() => setShowFinalCelebration(false)}>
          <div className="celebration-card-outer double-bezel-outer" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="celebration-card-inner double-bezel-inner" style={{ padding: '40px 32px' }}>
              <div className="celebrate-icon-ring" style={{ width: '90px', height: '90px', fontSize: '44px', background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}>
                👑
              </div>
              <h2 className="celebrate-title" style={{ fontSize: '32px' }}>¡Tenemos un Ganador!</h2>
              <p className="celebrate-subtitle" style={{ marginBottom: '20px' }}>
                El desafío ha terminado. Felicitaciones a quien lideró la sala hoy:
              </p>

              {/* Winner Showcase Box */}
              <div style={{ 
                backgroundColor: 'var(--warning-bg)', 
                border: '2px solid #fde68a', 
                borderRadius: 'var(--radius-md)', 
                padding: '20px', 
                marginBottom: '28px',
                transform: 'scale(1.02)'
              }}>
                <h3 style={{ fontSize: '24px', color: '#b45309', fontWeight: '800', marginBottom: '4px' }}>
                  {podiumPlayers[0].nombre}
                </h3>
                <span style={{ fontSize: '14px', color: '#b45309', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {podiumPlayers[0].points} puntos totales 🏆
                </span>
              </div>

              {/* Standing positions summary list */}
              <div style={{ textAlign: 'left', marginBottom: '32px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                  Tabla de Clasificación de la Sesión
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {podiumPlayers.map((p, idx) => {
                    const isWinner = idx === 0;
                    return (
                      <div 
                        key={p.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '10px 16px', 
                          backgroundColor: isWinner ? 'var(--warning-bg)' : 'var(--bg-page)', 
                          borderRadius: 'var(--radius-sm)', 
                          border: `1px solid ${isWinner ? '#fde68a' : 'var(--border-light)'}`,
                          fontWeight: isWinner ? '800' : '600'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`} {p.nombre}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--brand-dark)' }}>
                          {p.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={() => setShowFinalCelebration(false)} 
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Ver Podio 3D
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
