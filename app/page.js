'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Code, GraduationCap, ShieldCheck, ChevronRight, Lock, User, Terminal, Eye, EyeOff } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push(data.redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="landing-wrapper">
      {/* Background Elements */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* Navigation */}
      <nav className="navbar glass-panel">
        <div className="nav-container">
          <div className="flex items-center gap-2">
            <div className="logo-icon">
              <Terminal size={20} className="text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">SSI Portal</span>
          </div>
          <div className="nav-links">
            <Link href="/support" className="nav-link">Support</Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="hero-container container">
        <div className="hero-split">
          {/* Left Side: Content */}
          <div className="hero-content">
            <div className="badge">
              <ShieldCheck size={14} className="text-primary" />
              <span>AI-Proctored Examination</span>
            </div>
            <h1 className="hero-title">
              Engineering <br />
              <span className="text-gradient">Potential</span> through <br />
              Assessment.
            </h1>
            <p className="hero-subtitle">
              The industry-standard portal for coding challenges and MCQ assessments.
              Secure, standardized, and designed for modern developers.
            </p>

            <div className="hero-features">
              <div className="feature-item">
                <div className="feature-icon"><Code size={20} /></div>
                <span>Live Coding Challenges</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon"><GraduationCap size={20} /></div>
                <span>Certified Assessments</span>
              </div>
            </div>
          </div>

          {/* Right Side: Login Card */}
          <div className="hero-form">
            <div className="glass-panel auth-card-premium">
              <div className="card-header">
                <div className="logo-display-small">
                  <Image src="/logo.jpeg" alt="SSI Logo" width={100} height={40} priority />
                </div>
                <h3>Welcome Back</h3>
                <p>Sign in to your assessment portal</p>
              </div>

              {error && (
                <div className="error-badge">
                  {error}
                </div>
              )}

              {/* Role selector removed - login is student-only here */}

              <form onSubmit={handleLogin} className="auth-form-v2">
                <div className="input-group-v2">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group-v2">
                  <label>Password</label>
                  <div className="input-wrapper relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button 
                      type="button"
                      className="password-toggle-v2"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        opacity: 0.5,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Authenticating...' : (
                    <>
                      <span>Sign In</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .landing-wrapper {
          min-height: 100vh;
          width: 100vw;
          position: relative;
          background-color: var(--background);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow: hidden;
        }

        .bg-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 0;
          opacity: 0.15;
          pointer-events: none;
        }

        .bg-glow-1 {
          top: -100px;
          right: -100px;
          background: var(--primary);
        }

        .bg-glow-2 {
          bottom: -100px;
          left: -100px;
          background: var(--accent);
        }

        .navbar {
          position: fixed;
          top: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 3rem);
          max-width: 1100px;
          padding: 0.75rem 1.5rem;
          z-index: 100;
          border-radius: var(--radius-xl);
        }

        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
        }

        :global(.nav-link) {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground);
          opacity: 0.7;
          text-decoration: none;
          transition: 0.2s opacity;
        }

        :global(.nav-link:hover) {
          opacity: 1;
        }

        .hero-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1100px;
        }

        .hero-split {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.4rem 0.8rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--primary);
          width: fit-content;
        }

        .hero-title {
          font-size: 4rem;
          line-height: 1;
          margin: 0;
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--foreground);
          opacity: 0.7;
          max-width: 500px;
          line-height: 1.6;
        }

        .hero-features {
          display: flex;
          gap: 2rem;
          margin-top: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .feature-icon {
          color: var(--primary);
        }

        .auth-card-premium {
          padding: 2.5rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-premium);
        }

        .card-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .card-header h3 {
          font-size: 1.5rem;
          margin-bottom: 0.35rem;
        }

        .card-header p {
          font-size: 0.875rem;
          color: var(--foreground);
          opacity: 0.6;
        }

        .logo-display-small {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 2rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.35rem;
          border-radius: var(--radius-md);
        }

        .role-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--foreground);
          opacity: 0.6;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: 0.2s all;
        }

        .role-btn.active {
          background: var(--secondary);
          opacity: 1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .auth-form-v2 {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group-v2 {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group-v2 label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.5;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .btn-full {
          width: 100%;
          margin-top: 0.5rem;
        }

        .error-badge {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        @media (max-width: 1024px) {
          .hero-split {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }
          .hero-content {
            align-items: center;
          }
          .hero-title {
            font-size: 3rem;
          }
          .navbar {
            top: 1rem;
          }
          .landing-wrapper {
            padding-top: 6rem;
            overflow-y: auto;
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
