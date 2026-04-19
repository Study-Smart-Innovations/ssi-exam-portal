'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import CameraProctor from '@/components/CameraProctor';
import { useModal } from '@/lib/contexts/ModalContext';
import { useRef } from 'react';

export default function ExamPlayPage({ params }) {
  const unwrappedParams = use(params);
  const examId = unwrappedParams.id;
  const router = useRouter();
  const { showAlert } = useModal();

  const [exam, setExam] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [combinedQuestions, setCombinedQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  
  const [warnings, setWarnings] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const lastLogTimestampRef = useRef(0);

  // Fetch exam data to play (including questions without answers)
  useEffect(() => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err.message);
        });
      }
    } catch (e) {
      // Ignore
    }

    const fetchExam = async () => {
      const res = await fetch(`/api/exam/play_data?id=${examId}`);
      const data = await res.json();
      if (res.ok) {
        setExam(data.exam);
        setTimeLeft(data.exam.duration * 60);

        // Merge MCQs and Coding into one sequence
        const mcqs = (data.exam.mcqs || []).map(q => ({ ...q, type: 'mcq' }));
        const coding = (data.exam.codingQuestions || []).map(q => ({ ...q, type: 'coding' }));
        setCombinedQuestions([...mcqs, ...coding]);
      } else {
        await showAlert('Error', data.error, 'DANGER');
        router.push('/dashboard');
      }
    };
    fetchExam();
  }, [examId, router]);

  const submitExam = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          mcqAnswers,
          codingAnswers
        })
      });

      // Log activity
      fetch('/api/exam/log_activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SUBMITTED', examId, examTitle: exam?.title, message: 'Exam successfully submitted for evaluation.' })
      });

      router.push('/dashboard/results');
    } catch (err) {
      showAlert('Submission Error', 'Error submitting exam. Please check your connection and try again.', 'DANGER');
      setSubmitting(false); // Let them try again
    }
  }, [submitting, examId, mcqAnswers, codingAnswers, exam, router, showAlert]);

  // Tab switching detection
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && !submitting) {
      // Prevent duplicate logs (debounce)
      const now = Date.now();
      if (now - lastLogTimestampRef.current < 2000) return;
      lastLogTimestampRef.current = now;

      let currentWarnings = 0;
      setWarnings(w => {
        currentWarnings = w + 1;
        return currentWarnings;
      });

      if (currentWarnings === 1) {
        showAlert('Proctoring Warning', 'You have switched tabs or minimized the window. Doing this again will disqualify you and auto-submit the exam.', 'DANGER');
        // Log first warning
        fetch('/api/exam/log_activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'TAB_SWITCH', examId, examTitle: exam.title, message: 'FIRST WARNING: Student switched tabs.' })
        });
      } else if (currentWarnings === 2) {
        showAlert('Disqualified', 'You switched tabs again. The exam is now submitting automatically.', 'DANGER');
        // Log violation
        fetch('/api/exam/log_activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'TAB_SWITCH', examId, examTitle: exam.title, message: 'DISQUALIFIED: Second tab switch violation.' })
        });
        submitExam(); // Auto submit
      }
    }
  }, [submitting, exam, examId, showAlert, submitExam]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (exam && !submitting) submitExam();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, exam, submitting]);

  const toggleReview = (idx) => {
    const newSet = new Set(markedForReview);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setMarkedForReview(newSet);
  };


  if (!exam || combinedQuestions.length === 0) return <div className="container mt-8 text-center">Loading Exam Environment...</div>;

  const currentQ = combinedQuestions[currentIdx];

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Top Navbar */}
      <header style={{ padding: '1rem 2rem', background: 'var(--secondary)', borderBottom: `1px solid ${warnings > 0 ? 'var(--danger)' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{exam.title}</h2>
        <div className="flex items-center gap-6">
          {warnings > 0 && <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}><AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Warning: {warnings}/2</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: timeLeft < 300 ? 'var(--danger)' : 'var(--success)' }}>
            <Clock /> {formatTime(timeLeft)}
          </div>
          <button className="btn btn-primary" onClick={submitExam} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Finish & Submit'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Navigation) */}
        <aside style={{ width: '250px', background: 'var(--background)', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '1rem' }}>
           <h4 className="mb-4">Question List</h4>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
             {combinedQuestions.map((q, idx) => {
               const isAnswered = q.type === 'mcq' ? mcqAnswers[q.id] !== undefined : !!codingAnswers[q.id];
               const isReview = markedForReview.has(idx);
               return (
                 <button 
                   key={idx} 
                   onClick={() => setCurrentIdx(idx)}
                   style={{
                     padding: '0.5rem',
                     borderRadius: 'var(--radius-sm)',
                     background: currentIdx === idx ? 'var(--primary)' : isReview ? 'var(--accent)' : isAnswered ? 'rgba(16, 185, 129, 0.4)' : 'var(--secondary)',
                     border: 'none',
                     color: 'white',
                     cursor: 'pointer'
                   }}
                 >
                   {idx + 1}
                 </button>
               );
             })}
           </div>
           
           <div className="mt-8">
              <div className="flex items-center gap-2 mb-2 text-sm"><div style={{ width: 15, height: 15, background: 'rgba(16, 185, 129, 0.4)' }}></div> Answered</div>
              <div className="flex items-center gap-2 mb-2 text-sm"><div style={{ width: 15, height: 15, background: 'var(--accent)' }}></div> Marked Review</div>
              <div className="flex items-center gap-2 mb-2 text-sm"><div style={{ width: 15, height: 15, background: 'var(--secondary)' }}></div> Unanswered</div>
           </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {currentQ ? (
            <div className="glass-panel" style={{ padding: '2rem', minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="mb-1">Question {currentIdx + 1}</h3>
                   <span style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                     {currentQ.type.toUpperCase()}
                   </span>
                 </div>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={markedForReview.has(currentIdx)} onChange={() => toggleReview(currentIdx)} />
                    Mark for Review
                 </label>
               </div>
               
               <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{currentQ.question}</p>

               {currentQ.type === 'mcq' ? (
                 <div className="flex flex-col gap-4">
                   {currentQ.options.map((opt, oIdx) => (
                     <label key={oIdx} style={{
                       display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                       background: mcqAnswers[currentQ.id] === oIdx ? 'rgba(59, 130, 246, 0.1)' : 'var(--secondary)',
                       border: `1px solid ${mcqAnswers[currentQ.id] === oIdx ? 'var(--primary)' : 'var(--border)'}`,
                       borderRadius: 'var(--radius-md)', cursor: 'pointer'
                     }}>
                       <input type="radio" style={{ width: 'auto' }} name={`q-${currentQ.id}`} 
                         checked={mcqAnswers[currentQ.id] === oIdx} 
                         onChange={() => setMcqAnswers(p => ({ ...p, [currentQ.id]: oIdx }))} 
                       />
                       {opt}
                     </label>
                   ))}
                 </div>
               ) : (
                 <textarea 
                   rows="12" 
                   placeholder="Write your code here..." 
                   style={{ fontFamily: 'monospace', padding: '1.5rem', background: '#0a0a0c', border: '1px solid var(--border)', fontSize: '1rem' }}
                   value={codingAnswers[currentQ.id] || ''}
                   onChange={(e) => setCodingAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
                 />
               )}
               
               <div className="mt-auto flex justify-between" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-secondary" onClick={() => setCurrentIdx(p => (p - 1 + combinedQuestions.length) % combinedQuestions.length)}>
                    <ChevronLeft /> Previous
                  </button>
                  <button className="btn btn-primary" onClick={() => setCurrentIdx(p => (p + 1) % combinedQuestions.length)}>
                    Next Question <ChevronRight />
                  </button>
               </div>
            </div>
          ) : (
            <p>No questions available for this section.</p>
          )}
        </main>
      </div>

      <CameraProctor />
    </div>
  );
}
