import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Cpu, 
  Search,
  Check
} from 'lucide-react';

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

type ShowcaseTab = 'scout' | 'match' | 'hitl' | 'calendar';

export const AuthGate: React.FC<AuthGateProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('scout');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const email = event.data.email || '';
        const user: UserProfile = event.data.user || {
          user_id: `usr-${btoa(email || 'student').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`,
          name: email ? email.split('@')[0] : 'Student',
          email: email,
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

  const handleQuickLogin = (name: string = 'Shahidsaharudin', email: string = 'shahidsaharudin31@gmail.com') => {
    const user: UserProfile = {
      user_id: `usr-${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`,
      name: name,
      email: email,
      avatar_url: '',
      headline: 'Software Engineering'
    };
    sessionStorage.setItem('internflow_user', JSON.stringify(user));
    setIsLoading(false);
    onLoginSuccess(user);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/url`);
      const data = await res.json();

      if (!data.configured || !data.url) {
        // If Google OAuth credentials are not configured in backend, smoothly log in as student demo
        console.warn('Google OAuth not configured, using instant student demo access');
        handleQuickLogin();
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
        setErrorMsg('Pop-up blocked! Click "Continue as Demo Student" below to enter directly.');
        setIsLoading(false);
      }
    } catch {
      // Backend unavailable or network error: fallback to demo session
      handleQuickLogin();
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#050507',
      color: '#f5f5f7',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
      position: 'relative',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 113, 227, 0.18), transparent 45%), radial-gradient(circle at 85% 30%, rgba(94, 92, 230, 0.12), transparent 40%), radial-gradient(circle at 15% 70%, rgba(48, 209, 88, 0.08), transparent 40%)',
    }}>

      {/* Decorative Grid Pattern */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Sticky Top Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 12, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.3), rgba(94, 92, 230, 0.3))',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 113, 227, 0.25)'
          }}>
            <BrainCircuit size={22} color="#64d2ff" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f5f5f7' }}>
              InternFlow
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '980px',
              background: 'rgba(0, 113, 227, 0.15)',
              border: '1px solid rgba(0, 113, 227, 0.3)',
              color: '#64d2ff'
            }}>
              v2.0
            </span>
          </div>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '980px',
            background: 'rgba(48, 209, 88, 0.1)',
            border: '1px solid rgba(48, 209, 88, 0.22)',
            fontSize: '0.68rem',
            color: '#30d158',
            fontWeight: 500
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158' }} />
            Malaysia Verified
          </span>
        </div>

        {/* Center Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          fontSize: '0.82rem',
          color: '#86868b'
        }}>
          <button 
            onClick={() => scrollToSection('showcase')}
            style={{ background: 'none', border: 'none', color: '#a1a1a6', cursor: 'pointer', fontSize: '0.82rem', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5f5f7'}
            onMouseLeave={e => e.currentTarget.style.color = '#a1a1a6'}
          >
            Live Showcase
          </button>
          <button 
            onClick={() => scrollToSection('ecosystem')}
            style={{ background: 'none', border: 'none', color: '#a1a1a6', cursor: 'pointer', fontSize: '0.82rem', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5f5f7'}
            onMouseLeave={e => e.currentTarget.style.color = '#a1a1a6'}
          >
            Malaysia Roles
          </button>
          <button 
            onClick={() => scrollToSection('agents')}
            style={{ background: 'none', border: 'none', color: '#a1a1a6', cursor: 'pointer', fontSize: '0.82rem', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5f5f7'}
            onMouseLeave={e => e.currentTarget.style.color = '#a1a1a6'}
          >
            Multi-Agent Architecture
          </button>
        </div>

        {/* Right CTA */}
        <div>
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            style={{
              background: '#ffffff',
              color: '#1d1d1f',
              border: 'none',
              borderRadius: '980px',
              padding: '7px 16px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.18s ease',
              boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)'
            }}
            onMouseEnter={e => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.25)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(255, 255, 255, 0.15)';
            }}
          >
            {isLoading ? (
              <Loader2 size={13} className="spin-slow" color="#1d1d1f" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>

        {/* Global Error Banner */}
        {errorMsg && (
          <div style={{
            maxWidth: '680px',
            margin: '20px auto 0 auto',
            background: 'rgba(255, 69, 58, 0.12)',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={18} color="#ff453a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: '#ff453a', lineHeight: 1.4 }}>{errorMsg}</span>
          </div>
        )}

        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          padding: '80px 20px 60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Subtle Glow Aura behind title */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '480px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(0, 113, 227, 0.28) 0%, rgba(94, 92, 230, 0.15) 50%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
            zIndex: -1
          }} />

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '980px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            marginBottom: '24px'
          }}>
            <Sparkles size={14} color="#64d2ff" />
            <span style={{ fontSize: '0.78rem', color: '#e5e5ea', fontWeight: 500 }}>
              Dual-LLM Agentic Pipeline: DeepSeek + Gemini 3.6 Flash
            </span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.2vw, 4.2rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.08,
            maxWidth: '920px',
            margin: '0 auto 20px auto',
            background: 'linear-gradient(180deg, #ffffff 40%, rgba(255, 255, 255, 0.72) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Autonomous Career Intelligence for Malaysian Tech Internships.
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(0.96rem, 1.8vw, 1.15rem)',
            color: '#86868b',
            lineHeight: 1.55,
            maxWidth: '720px',
            margin: '0 auto 36px auto',
            fontWeight: 400
          }}>
            Stop manually hunting across scattered job portals. InternFlow continuously scouts verified software engineering internships across Malaysia, computes multi-factor matchfit scores, and drafts cold recruiter emails with Human-in-the-Loop safety.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '48px'
          }}>
            {/* Primary Google Login Button */}
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              style={{
                background: '#ffffff',
                color: '#1d1d1f',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 28px',
                fontSize: '0.94rem',
                fontWeight: 600,
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                boxShadow: '0 8px 30px rgba(255, 255, 255, 0.18)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={e => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(255, 255, 255, 0.28)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 255, 255, 0.18)';
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin-slow" color="#1d1d1f" />
                  <span>Connecting Google Workspace...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Sign in with Google Workspace</span>
                  <ArrowRight size={16} color="#1d1d1f" />
                </>
              )}
            </button>

            {/* Direct Demo Access Button */}
            <button
              onClick={() => handleQuickLogin()}
              style={{
                background: 'rgba(0, 113, 227, 0.15)',
                color: '#64d2ff',
                border: '1px solid rgba(0, 113, 227, 0.35)',
                borderRadius: '14px',
                padding: '14px 22px',
                fontSize: '0.94rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0, 113, 227, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(0, 113, 227, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0, 113, 227, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(0, 113, 227, 0.35)';
              }}
            >
              <span>Continue as Demo Student</span>
              <ArrowRight size={15} color="#64d2ff" />
            </button>

            {/* Secondary Showcase Button */}
            <button
              onClick={() => scrollToSection('showcase')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f5f5f7',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '14px',
                padding: '14px 20px',
                fontSize: '0.94rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
              }}
            >
              <span>Explore Live Showcase</span>
            </button>
          </div>

          {/* Ecosystem Highlights Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '18px',
            flexWrap: 'wrap',
            padding: '14px 20px',
            borderRadius: '980px',
            background: 'rgba(20, 20, 24, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{ fontSize: '0.74rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Tracking Top Malaysian Tech Roles:
            </span>
            {['Grab', 'Petronas', 'Intel Penang', 'TNG Digital', 'Carsome', 'Deriv', 'GXBank', 'Shopee MY'].map(comp => (
              <span key={comp} style={{
                fontSize: '0.76rem',
                color: '#f5f5f7',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#64d2ff' }} />
                {comp}
              </span>
            ))}
          </div>
        </section>

        {/* Section 1: Interactive Product Showcase Terminal */}
        <section id="showcase" style={{ padding: '60px 0 80px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.74rem', color: '#64d2ff', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Live Product Experience
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.03em', margin: '6px 0 10px 0' }}>
              How the Multi-Agent Engine Works
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#86868b', maxWidth: '580px', margin: '0 auto' }}>
              Click between agent stages below to preview how InternFlow ingests, validates, matches, and protects your applications.
            </p>
          </div>

          {/* Terminal Window Container */}
          <div style={{
            background: 'rgba(20, 20, 23, 0.85)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            overflow: 'hidden'
          }}>
            {/* Terminal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#27c93f' }} />
                <span style={{ marginLeft: '12px', fontSize: '0.76rem', color: '#86868b', fontFamily: 'var(--font-mono)' }}>
                  internflow-agentic-pipeline.sys
                </span>
              </div>

              {/* Stage Switcher Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'scout' as ShowcaseTab, label: '1. Dual-LLM Scout', icon: Search },
                  { key: 'match' as ShowcaseTab, label: '2. Match Fit Engine', icon: Cpu },
                  { key: 'hitl' as ShowcaseTab, label: '3. HITL Safety Gate', icon: ShieldCheck },
                  { key: 'calendar' as ShowcaseTab, label: '4. Calendar Auto-Sync', icon: Calendar }
                ].map(item => {
                  const Icon = item.icon;
                  const isSel = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      style={{
                        background: isSel ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid ' + (isSel ? 'rgba(0, 113, 227, 0.5)' : 'rgba(255, 255, 255, 0.08)'),
                        color: isSel ? '#64d2ff' : '#86868b',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: isSel ? 600 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={12} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage Body */}
            <div style={{ padding: '32px' }}>
              {activeTab === 'scout' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', alignItems: 'center' }}>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(0, 113, 227, 0.15)',
                      color: '#64d2ff',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      marginBottom: '10px'
                    }}>
                      <Search size={12} />
                      STAGE 1: VERIFIED SCRAPER & DEDUPLICATION
                    </span>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                      DeepSeek Reasoning + Gemini Evaluator
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#86868b', lineHeight: 1.6, marginBottom: '18px' }}>
                      Scout Agent continuously explores authentic Malaysian tech company career portals, extracts real monthly stipends (RM), detects work mode (Hybrid/On-site), and verifies direct application URLs.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e5e5ea' }}>
                        <Check size={14} color="#30d158" />
                        <span>Zero synthetic hallucinations — validated against authenticated job endpoints.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e5e5ea' }}>
                        <Check size={14} color="#30d158" />
                        <span>Preserves full provenance: source name, discovery engine, and query timestamp.</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Card Mock */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#00b14f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          G
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f5f5f7' }}>Grab Malaysia</div>
                          <div style={{ fontSize: '0.72rem', color: '#86868b' }}>Petaling Jaya, Selangor</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '980px', background: 'rgba(48, 209, 88, 0.12)', color: '#30d158', fontWeight: 600 }}>
                        RM 2,000/mo
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f5f5f7', marginBottom: '6px' }}>
                      Software Engineering Intern (Core Services)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#86868b', lineHeight: 1.4, marginBottom: '14px' }}>
                      Build distributed microservices in Go, maintain high-throughput backend APIs, and collaborate with regional platform engineers.
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['Go', 'Microservices', 'Docker', 'REST API', 'Hybrid'].map(t => (
                        <span key={t} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', color: '#a1a1a6' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'match' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', alignItems: 'center' }}>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(94, 92, 230, 0.15)',
                      color: '#a3a0fb',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      marginBottom: '10px'
                    }}>
                      <Cpu size={12} />
                      STAGE 2: MEMORY-AWARE MATCH FIT
                    </span>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                      Deep Analysis of Your Technical Profile
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#86868b', lineHeight: 1.6, marginBottom: '18px' }}>
                      Match Agent evaluates your GitHub projects, academic coursework, and tech skills against Malaysian recruiter benchmarks. It gives you a quantified match fit percentage and tailored prep tasks.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e5e5ea' }}>
                        <Check size={14} color="#30d158" />
                        <span>Identifies exact skill matches and missing keywords for ATS screening.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e5e5ea' }}>
                        <Check size={14} color="#30d158" />
                        <span>Synthesizes actionable preparation tasks for technical interview rounds.</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Card Preview */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#86868b', fontWeight: 600 }}>MATCHFIT EVALUATION</span>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#30d158',
                        background: 'rgba(48, 209, 88, 0.12)',
                        padding: '4px 12px',
                        borderRadius: '980px',
                        border: '1px solid rgba(48, 209, 88, 0.25)'
                      }}>
                        94% High Fit
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '6px', color: '#a1a1a6' }}>
                        <span>Skills Compatibility</span>
                        <span style={{ color: '#f5f5f7', fontWeight: 600 }}>96%</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '980px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                        <div style={{ width: '96%', height: '100%', background: 'linear-gradient(90deg, #0071e3, #30d158)' }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#86868b', marginBottom: '8px' }}>
                      Identified Strengths:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['Distributed Systems (Go)', 'PostgreSQL DB Design', 'REST API Contracts'].map(s => (
                        <span key={s} style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(48, 209, 88, 0.1)', color: '#30d158', border: '1px solid rgba(48, 209, 88, 0.2)' }}>
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hitl' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', alignItems: 'center' }}>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 159, 10, 0.15)',
                      color: '#ff9f0a',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      marginBottom: '10px'
                    }}>
                      <ShieldCheck size={12} />
                      STAGE 3: HUMAN-IN-THE-LOOP (HITL) GATE
                    </span>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                      Absolute Student Control & Safety
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#86868b', lineHeight: 1.6, marginBottom: '18px' }}>
                      No uncontrolled bots or autonomous spam. InternFlow drafts high-converting outreach emails directly into your Gmail workspace, but execution requires your explicit approval inside the modal.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e5e5ea' }}>
                        <Check size={14} color="#30d158" />
                        <span>Delivery mode options: Dispatch directly or save as a draft in Gmail.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e5e5ea' }}>
                        <Check size={14} color="#30d158" />
                        <span>Full editable body preview before sending to recruiter inboxes.</span>
                      </div>
                    </div>
                  </div>

                  {/* HITL Card Mock */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 159, 10, 0.25)',
                    borderRadius: '14px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Mail size={16} color="#2997ff" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f5f5f7' }}>
                        Recruiter Outreach Draft
                      </span>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.72rem', color: '#a1a1a6', marginBottom: '14px', fontFamily: 'var(--font-mono)' }}>
                      To: careers@grab.com<br/>
                      Subject: Software Engineer Intern Application — Shahid Saharudin<br/><br/>
                      &quot;Hi Grab Recruiting Team, I am submitting my application for the Software Engineer Intern opening. My technical profile matches 94% of core requirements...&quot;
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#86868b', borderRadius: '8px', padding: '6px 12px', fontSize: '0.72rem' }}>
                        Reject / Dismiss
                      </button>
                      <button style={{ background: '#0071e3', border: 'none', color: '#ffffff', borderRadius: '8px', padding: '6px 14px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={13} />
                        <span>Approve Draft</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', alignItems: 'center' }}>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(48, 209, 88, 0.15)',
                      color: '#30d158',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      marginBottom: '10px'
                    }}>
                      <Calendar size={12} />
                      STAGE 4: GOOGLE CALENDAR TIME-BLOCKING
                    </span>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                      Automated Interview Prep Scheduling
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#86868b', lineHeight: 1.6, marginBottom: '18px' }}>
                      Never scramble before a technical assessment. InternFlow auto-generates 60-minute targeted study blocks directly in your Google Calendar with checklist items and relevant Malaysian company domain knowledge.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e5e5ea' }}>
                        <Check size={14} color="#30d158" />
                        <span>Automatically inserts calendar event with study checklist & topics.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e5e5ea' }}>
                        <Check size={14} color="#30d158" />
                        <span>Synchronizes with your primary Google account via OAuth 2.0.</span>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Card Mock */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(48, 209, 88, 0.25)',
                    borderRadius: '14px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Calendar size={16} color="#30d158" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f5f5f7' }}>
                        Google Calendar Event
                      </span>
                    </div>

                    <div style={{ background: 'rgba(48, 209, 88, 0.08)', border: '1px solid rgba(48, 209, 88, 0.2)', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f5f5f7', marginBottom: '4px' }}>
                        Grab Technical Prep: Concurrency & Go Channels
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#30d158', fontWeight: 500, marginBottom: '6px' }}>
                        Tomorrow, 3:00 PM – 4:00 PM • Google Calendar
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#86868b' }}>
                        Target: Review Goroutines, Mutex Locks, and Distributed KV Storage.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Architecture Feature Grid */}
        <section id="agents" style={{ padding: '40px 0 80px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '0.74rem', color: '#30d158', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Engineered for Student Success
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.03em', margin: '6px 0 10px 0' }}>
              Four Autonomous Pillars
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#86868b', maxWidth: '580px', margin: '0 auto' }}>
              Built specifically to eliminate the manual toil of internship applications while preserving safety and authenticity.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {/* Bento Card 1 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '26px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(0, 113, 227, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 113, 227, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={20} color="#2997ff" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f5f5f7', margin: 0 }}>
                Dual-LLM Scout Pipeline
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#86868b', lineHeight: 1.5, margin: 0 }}>
                Combines DeepSeek-chat scraper reasoning with Gemini 3.6 Flash deduplication to guarantee zero hallucinations and fresh Malaysian openings.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '26px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 159, 10, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 159, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} color="#ff9f0a" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f5f5f7', margin: 0 }}>
                Human-in-the-Loop Gateway
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#86868b', lineHeight: 1.5, margin: 0 }}>
                Complete agency with zero risk. All cold outreach emails and calendar study blocks are drafted into a safety queue for your personal sign-off.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '26px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(48, 209, 88, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(48, 209, 88, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} color="#30d158" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f5f5f7', margin: 0 }}>
                Google Workspace Native
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#86868b', lineHeight: 1.5, margin: 0 }}>
                Connects directly to your Gmail and Google Calendar via OAuth 2.0. Create interview prep blocks and compose drafts straight in your existing inbox.
              </p>
            </div>

            {/* Bento Card 4 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '26px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(163, 160, 251, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(94, 92, 230, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={20} color="#a3a0fb" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f5f5f7', margin: 0 }}>
                100% Malaysia-Centric
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#86868b', lineHeight: 1.5, margin: 0 }}>
                Tailored for Malaysian university students. Real stipends in MYR (RM), verified hybrid/on-site modalities, and company coordinates for Klang Valley & Penang.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Bottom Call to Action Card */}
        <section style={{
          padding: '40px 0 100px 0',
          position: 'relative'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 25, 0.9) 0%, rgba(12, 12, 16, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '60px 32px',
            textAlign: 'center',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient Corner Glow */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(0, 113, 227, 0.3), transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }} />

            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.3), rgba(94, 92, 230, 0.3))',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto'
            }}>
              <BrainCircuit size={26} color="#64d2ff" />
            </div>

            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 14px 0' }}>
              Ready to Accelerate Your Tech Career?
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#86868b', maxWidth: '540px', margin: '0 auto 28px auto', lineHeight: 1.5 }}>
              Sign in with your Google account to unlock the verified Malaysian software engineering internship pipeline and multi-agent assistance today.
            </p>

            <button
              onClick={handleSignIn}
              disabled={isLoading}
              style={{
                background: '#ffffff',
                color: '#1d1d1f',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 32px',
                fontSize: '0.96rem',
                fontWeight: 600,
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '11px',
                boxShadow: '0 8px 32px rgba(255, 255, 255, 0.22)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={e => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 255, 255, 0.35)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 255, 255, 0.22)';
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin-slow" color="#1d1d1f" />
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
                  <ArrowRight size={16} color="#1d1d1f" />
                </>
              )}
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(8, 8, 10, 0.9)',
        padding: '30px 24px',
        textAlign: 'center',
        fontSize: '0.74rem',
        color: '#6e6e73'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={16} color="#64d2ff" />
            <span style={{ fontWeight: 600, color: '#f5f5f7' }}>InternFlow Malaysia</span>
            <span>•</span>
            <span>Autonomous Career Intelligence</span>
          </div>

          <div>
            Built for Computer Science & Software Engineering Undergrads in Malaysia 🇲🇾
          </div>
        </div>
      </footer>
    </div>
  );
};
