import React, { useState, useEffect } from 'react';
import { BrainCircuit, ShieldCheck, Mail, Calendar, Loader2, AlertCircle } from 'lucide-react';

import { API_BASE_URL } from '../config';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  headline?: string;
  avatar_url?: string;
  skills?: string[];
  resume_text?: string;
  is_google_connected?: boolean;
}

interface AuthGateProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const user: UserProfile = event.data.user || {
          user_id: 'student-001',
          name: event.data.email ? event.data.email.split('@')[0] : 'Student',
          email: event.data.email || 'student@university.edu.my',
          avatar_url: '',
          headline: 'Software Engineering'
        };
        sessionStorage.setItem('internflow_user', JSON.stringify(user));
        setIsLoading(false);
        onLoginSuccess(user);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setErrorMsg(event.data.error || 'Google authentication failed.');
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/url`);
      const data = await res.json();

      if (!data.configured || !data.url) {
        setErrorMsg('Google OAuth credentials not configured in backend/.env.');
        setIsLoading(false);
        return;
      }

      const width = 540;
      const height = 680;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.url,
        'GoogleSignInPopup',
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
      );

      if (!popup) {
        setErrorMsg('Pop-up blocked! Please allow pop-ups for this site to sign in with Google.');
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Connection to authentication service failed');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#000000',
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(0, 113, 227, 0.14), transparent 55%), radial-gradient(circle at 80% 80%, rgba(94, 92, 230, 0.08), transparent 45%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background grid pattern */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      {/* Center Auth Card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '440px',
        width: '100%',
        background: 'rgba(24, 24, 27, 0.82)',
        backdropFilter: 'blur(36px)',
        WebkitBackdropFilter: 'blur(36px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '38px 32px',
        boxShadow: '0 32px 80px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        textAlign: 'center'
      }}>
        {/* Brand Icon & Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.25), rgba(94, 92, 230, 0.25))',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 8px 24px rgba(0, 113, 227, 0.2)'
          }}>
            <BrainCircuit size={28} color="#64d2ff" />
          </div>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '980px',
            background: 'rgba(48, 209, 88, 0.1)',
            border: '1px solid rgba(48, 209, 88, 0.25)',
            fontSize: '0.68rem',
            color: '#30d158',
            fontWeight: 500,
            letterSpacing: '0.02em',
            marginBottom: '10px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158' }} />
            Malaysia AI Internship Pipeline
          </span>

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#f5f5f7',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            margin: '0 0 6px 0'
          }}>
            InternFlow
          </h1>

          <p style={{
            fontSize: '0.82rem',
            color: '#86868b',
            lineHeight: 1.45,
            maxWidth: '340px',
            margin: 0
          }}>
            Autonomous career intelligence platform for Malaysian tech students.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: 'rgba(255, 69, 58, 0.1)',
            border: '1px solid rgba(255, 69, 58, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left'
          }}>
            <AlertCircle size={15} color="#ff453a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.74rem', color: '#ff453a', lineHeight: 1.35 }}>
              {errorMsg}
            </span>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          style={{
            width: '100%',
            height: '46px',
            borderRadius: '12px',
            background: '#ffffff',
            color: '#1d1d1f',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: 'none',
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 18px rgba(255, 255, 255, 0.15)',
            letterSpacing: '-0.01em',
            marginBottom: '20px'
          }}
          onMouseEnter={e => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(255, 255, 255, 0.25)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(255, 255, 255, 0.15)';
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin-slow" color="#1d1d1f" />
              <span>Connecting Google...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Feature Grid Pill Icons */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={13} color="#2997ff" />
            <span style={{ fontSize: '0.71rem', color: '#a1a1a6' }}>Gmail Direct Outreach</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={13} color="#30d158" />
            <span style={{ fontSize: '0.71rem', color: '#a1a1a6' }}>Calendar Auto-Sync</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={13} color="#ff9f0a" />
            <span style={{ fontSize: '0.71rem', color: '#a1a1a6' }}>HITL Safety Gate</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem' }}>🇲🇾</span>
            <span style={{ fontSize: '0.71rem', color: '#a1a1a6' }}>Malaysia Tech Roles</span>
          </div>
        </div>
      </div>
    </div>
  );
};
