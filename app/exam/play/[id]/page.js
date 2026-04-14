'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExamPlayPage({ params }) {
  const unwrappedParams = use(params);
  const examId = unwrappedParams.id;
  const router = useRouter();

  const [exam, setExam] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeTab, setActiveTab] = useState('mcq'); // 'mcq' or 'coding'
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  
  const [warnings, setWarnings] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Fetch exam data to play (including questions without answers)
  useEffect(() => {
    const fetchExam = async () => {
      const res = await fetch(`/api/exam/play_data?id=${examId}`);
      const data = await res.json();
      if (res.ok) {
        setExam(data.exam);
        setTimeLeft(data.exam.duration * 60);
      } else {
        alert(data.error);
        router.push('/dashboard');
      }
    };
    fetchExam();
  }, [examId, router]);

  // Tab switching detection
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && !submitting) {
      setWarnings(w => {
        const newWarnings = w + 1;
        if (newWarnings === 1) {
          alert('WARNING: You have switched tabs or minimized the window. Doing this again will disqualify you and auto-submit the exam.');
        } else if (newWarnings === 2) {
          alert('DISQUALIFIED: You switched tabs again. The exam is now submitting automatically.');
          submitExam(); // Auto submit
        }
        return newWarnings;
      });
    }
  }, [submitting]);

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

  const submitExam = async () => {
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
      router.push('/dashboard/results');
    } catch (err) {
      alert('Error submitting exam.');
      setSubmitting(false); // Let them try again
    }
  };

  if (!exam) return <div className="container mt-8 text-center">Loading Exam Environment...</div>;

  const currentQuestions = activeTab === 'mcq' ? exam.mcqs : exam.codingQuestions;
  const currentQ = currentQuestions[currentIdx];

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
           <div className="flex gap-2 mb-4">
             <button className={`btn text-sm ${activeTab === 'mcq' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setActiveTab('mcq'); setCurrentIdx(0); }} style={{ flex: 1, padding: '0.5rem' }}>MCQs ({exam.mcqs?.length || 0})</button>
             <button className={`btn text-sm ${activeTab === 'coding' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setActiveTab('coding'); setCurrentIdx(0); }} style={{ flex: 1, padding: '0.5rem' }}>Coding ({exam.codingQuestions?.length || 0})</button>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
             {currentQuestions?.map((q, idx) => {
               const isAnswered = activeTab === 'mcq' ? mcqAnswers[q.id] !== undefined : !!codingAnswers[q.id];
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
                 <h3>Question {currentIdx + 1}</h3>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={markedForReview.has(currentIdx)} onChange={() => toggleReview(currentIdx)} />
                    Mark for Review
                 </label>
               </div>
               
               <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{currentQ.question}</p>

               {activeTab === 'mcq' ? (
                 <div className="flex flex-col gap-3">
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
                   style={{ fontFamily: 'monospace' }}
                   value={codingAnswers[currentQ.id] || ''}
                   onChange={(e) => setCodingAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
                 />
               )}
               
               <div className="mt-auto pt-8 flex justify-between">
                  <button className="btn btn-secondary" onClick={() => setCurrentIdx(p => Math.max(0, p - 1))} disabled={currentIdx === 0}>
                    <ChevronLeft /> Previous
                  </button>
                  <button className="btn btn-secondary" onClick={() => setCurrentIdx(p => Math.min(currentQuestions.length - 1, p + 1))} disabled={currentIdx === currentQuestions.length - 1}>
                    Next <ChevronRight />
                  </button>
               </div>
            </div>
          ) : (
            <p>No questions available for this section.</p>
          )}
        </main>
      </div>
    </div>
  );
}
