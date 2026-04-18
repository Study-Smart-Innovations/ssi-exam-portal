'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, UserX } from 'lucide-react';

export default function CameraProctor() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 160, height: 120, frameRate: 15 } 
        });
        
        streamRef.current = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Note: autoPlay handles the playing state.
        }
      } catch (err) {
        console.error("Proctor Camera Error:", err);
        setError(true);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("Stopped track:", track.label);
        });
        streamRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="camera-pip glass-panel" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--danger)' }}>
        <UserX className="text-danger" size={24} />
        <span style={{ fontSize: '0.6rem', color: 'var(--danger)', textAlign: 'center' }}>Camera Error</span>
      </div>
    );
  }

  return (
    <div className="camera-pip glass-panel">
      <div className="live-indicator">
        <div className="dot"></div>
        <span>LIVE</span>
      </div>
      <video ref={videoRef} autoPlay playsInline muted />
      
      <style jsx>{`
        .camera-pip {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 135px;
          border-radius: var(--radius-md);
          overflow: hidden;
          z-index: 1000;
          border: 2px solid var(--primary);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #000;
        }

        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1); /* Mirror effect */
        }

        .live-indicator {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(0, 0, 0, 0.6);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          z-index: 10;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          animation: blink 1s infinite;
        }

        span {
          font-size: 0.65rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.05em;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
