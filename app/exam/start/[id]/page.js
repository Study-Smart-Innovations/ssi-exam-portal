'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle } from 'lucide-react';

export default function ExamStartPage({ params }) {
  const unwrappedParams = use(params);
  const examId = unwrappedParams.id;
  const router = useRouter();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [snapTaken, setSnapTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [examState, setExamState] = useState(null); // Will hold exam rules, etc. fetched from API
  
  useEffect(() => {
    // Fetch Exam config (rules, duration, title)
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/exam/config?id=${examId}`);
        const data = await res.json();
        if (res.ok) {
           setExamState(data.exam);
        } else {
           setError(data.error);
        }
      } catch (err) {
        setError("Failed to load exam details.");
      }
    };
    fetchExam();
  }, [examId]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Camera access is required for proctoring. Please allow camera access.");
    }
  };

  const takeSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 320, 240);
    setSnapTaken(true);
  };

  const proceedToExam = async () => {
    if (!snapTaken) return;
    setLoading(true);
    try {
      const snapData = canvasRef.current.toDataURL('image/jpeg');
      
      // We will save this snap indicating start of exam
      const res = await fetch('/api/exam/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, snap: snapData })
      });
      
      if (!res.ok) throw new Error("Failed to initialize exam session.");
      
      // Stop camera before navigating
      if (stream) stream.getTracks().forEach(track => track.stop());
      
      router.push(`/exam/play/${examId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!examState) return <div className="container mt-8">Loading Exam Context...</div>;

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '3rem' }}>
      <h1 className="text-gradient">Ready to Begin?</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{examState.title}</h2>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 className="mb-4" style={{ color: 'var(--danger)' }}>⚠️ Important Guidelines (CRITICAL)</h3>
        <ul className="flex flex-col gap-2 mb-4" style={{ paddingLeft: '1.5rem', color: 'var(--border)' }}>
          {examState.rules?.map((rule, idx) => (
             <li key={idx}>{rule}</li>
          ))}
          <li><strong>Proctoring:</strong> Your camera must remain ON. A snapshot of your face and Government ID is required right now.</li>
          <li><strong>Anti-Cheat:</strong> If you change tabs or switch windows during the exam, you will receive ONE warning. A second switch will immediately disqualify you.</li>
        </ul>
      </div>

      {error && <div className="mb-4 p-3" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 className="mb-4 text-center">Identity Verification</h3>
        <p className="text-center mb-6" style={{ color: 'var(--border)' }}>Please hold your Government ID next to your face and take a snapshot.</p>
        
        {!stream ? (
          <button className="btn btn-secondary mb-4" onClick={startCamera}>
            <Camera size={20} /> Enable Camera
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <div style={{ position: 'relative', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
               {/* Display video feed, hide if snap taken to show canvas instead */}
               <video ref={videoRef} autoPlay playsInline width="320" height="240" style={{ display: snapTaken ? 'none' : 'block' }}></video>
               <canvas ref={canvasRef} width="320" height="240" style={{ display: snapTaken ? 'block' : 'none' }}></canvas>
             </div>
             
             {!snapTaken ? (
               <button className="btn btn-primary" onClick={takeSnap}>Capture ID Snap</button>
             ) : (
               <div className="flex gap-4">
                 <button className="btn btn-secondary" onClick={() => setSnapTaken(false)}>Retake Snap</button>
                 <button className="btn btn-success" onClick={proceedToExam} disabled={loading}>
                   {loading ? 'Initializing...' : <><CheckCircle size={20} /> Start Examination</>}
                 </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
