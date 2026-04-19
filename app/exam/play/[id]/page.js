'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Monitor, AlertOctagon, ArrowLeft } from 'lucide-react';
import CameraProctor from '@/components/CameraProctor';
import { useModal } from '@/lib/contexts/ModalContext';
import { useRef } from 'react';
import Link from 'next/link';

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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const lastLogTimestampRef = useRef(0);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobileDevice(isMobile || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Fetch exam data to play (including questions without answers)
  useEffect(() => {
    if (isMobileDevice) return;
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


  if (isMobileDevice) {
    return (
      <div className="restriction-overlay">
        <div className="glass-panel restriction-card">
           <div className="icon-badge">
             <Monitor size={48} />
           </div>
           
           <h1 className="restriction-title">Desktop Required</h1>
           
           <div className="alert-tag">
             <AlertOctagon size={16} />
             <span>RESTRICTED ACCESS</span>
           </div>
           
           <p className="restriction-text">
             For security and technical reasons, assessments must be completed on a <strong>Laptop or Desktop</strong> environment. 
             Mobile devices and tablets are not supported for this exam.
           </p>

           <Link href="/dashboard" className="btn btn-secondary back-btn">
             <ArrowLeft size={18} /> Back to Dashboard
           </Link>
        </div>

        <style jsx>{`
          .restriction-overlay {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1.5rem;
            background: var(--background);
          }
          .restriction-card {
            width: 100%;
            max-width: 500px;
            padding: 3rem;
            border-radius: 2rem;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          }
          .icon-badge {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
            padding: 1.5rem;
            border-radius: 50%;
            width: fit-content;
            margin: 0 auto 1.5rem;
          }
          .restriction-title {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            color: var(--foreground);
            font-family: var(--font-space-grotesk);
          }
          .alert-tag {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            color: var(--danger);
            font-weight: 600;
            font-size: 0.8rem;
            letter-spacing: 0.05em;
          }
          .restriction-text {
            color: var(--border);
            line-height: 1.6;
            margin-bottom: 2rem;
            font-size: 1.1rem;
          }
          :global(.back-btn) {
            width: 100%;
            text-decoration: none;
          }

          @media (max-width: 640px) {
            .restriction-card {
              padding: 2rem 1.5rem;
              border-radius: 1.5rem;
            }
            .restriction-title {
              font-size: 1.5rem;
            }
            .restriction-text {
              font-size: 1rem;
              margin-bottom: 1.5rem;
            }
            .icon-badge {
              padding: 1rem;
              margin-bottom: 1rem;
            }
          }
        `}</style>
      </div>
    );
  }

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
      <header className="exam-header">
        <h2 className="exam-title">{exam.title}</h2>
        <div className="flex items-center gap-3 md:gap-6">
          {warnings > 0 && <span className="warning-text"><AlertTriangle size={18} /> <span className="hidden-mobile">Warning: </span>{warnings}/2</span>}
          <div className="timer-display" style={{ color: timeLeft < 300 ? 'var(--danger)' : 'var(--success)' }}>
            <Clock size={20} /> <span>{formatTime(timeLeft)}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={submitExam} disabled={submitting}>
            {submitting ? '...' : (
              <>
                <span className="hidden-mobile">Finish & </span>Submit
              </>
            )}
          </button>
        </div>
      </header>

      <div className="exam-body">
        {/* Left Sidebar (Navigation) */}
        <aside className="exam-sidebar">
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
        <main className="exam-main">
          {currentQ ? (
            <div className="glass-panel exam-question-card">
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
                   rows="15" className="coding-editor" 
                   placeholder="Write your code here..." 
                   
                   value={codingAnswers[currentQ.id] || ''}
                   onChange={(e) => setCodingAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
                 />
               )}
               
               <div className="mt-auto flex justify-between" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-secondary" onClick={() => setCurrentIdx(p => (p - 1 + combinedQuestions.length) % combinedQuestions.length)}>
                    <ChevronLeft size={18} /> <span className="hidden-mobile">Previous</span>
                  </button>
                  <button className="btn btn-primary" onClick={() => setCurrentIdx(p => (p + 1) % combinedQuestions.length)}>
                    <span className="hidden-mobile">Next Question</span> <ChevronRight size={18} />
                  </button>
               </div>
            </div>
          ) : (
            <p>No questions available for this section.</p>
          )}
        </main>
      </div>

      <CameraProctor />

      <style jsx>{`
        .exam-header {
          padding: 1rem 2rem;
          background: var(--secondary);
          border-bottom: 1px solid ${warnings > 0 ? 'var(--danger)' : 'var(--border)'};
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
        }

        .exam-title {
          font-size: 1.25rem;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .warning-text {
          color: var(--danger);
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .timer-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: bold;
        }

        .exam-body {
          display: flex;
          flex-direction: row;
          flex: 1;
          height: calc(100vh - 70px);
          overflow: hidden;
        }

        .exam-sidebar {
          width: 250px;
          background: var(--background);
          border-right: 1px solid var(--border);
          overflow-y: auto;
          padding: 1.5rem;
        }

        .exam-main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
        }

        .exam-question-card {
          padding: 2.5rem;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
        }

        .coding-editor {
          font-family: 'Space Mono', 'Courier New', monospace;
          padding: 1.5rem;
          background: #0a0a0c;
          border: 1px solid var(--border);
          font-size: 1rem;
          color: #e2e8f0;
          line-height: 1.5;
          border-radius: var(--radius-md);
          resize: vertical;
        }

        @media (max-width: 768px) {
          .exam-header {
            padding: 0.75rem 1rem;
          }
          .exam-title {
            font-size: 1rem;
          }
          .timer-display {
            font-size: 1rem;
          }
          .exam-body {
            flex-direction: column;
            overflow-y: auto;
          }
          .exam-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--border);
            height: auto;
            max-height: 200px;
          }
          .exam-main {
            padding: 1rem;
          }
          .exam-question-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
