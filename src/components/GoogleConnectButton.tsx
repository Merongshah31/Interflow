import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogOut, AlertCircle, Loader2, ChevronDown, Mail, Calendar } from 'lucide-react';

interface GoogleAuthStatus {
  configured: boolean;
  connected: boolean;
  email: string;
  scopes: string[];
}

interface GoogleConnectButtonProps {
  onStatusChange?: (status: GoogleAuthStatus) => void;
}

export const GoogleConnectButton: React.FC<GoogleConnectButtonProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<GoogleAuthStatus>({
    configured: false,
    connected: false,
    email: '',
    scopes: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/google/status');
      if (res.ok) {
        const data: GoogleAuthStatus = await res.json();
        setStatus(data);
        if (onStatusChange) onStatusChange(data);
      }
    } catch {
      // Backend may be starting or offline
    } finally {
      setIsLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    let mounted = true;
    fetch('http://localhost:8000/api/auth/google/status')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (mounted && data) {
          setStatus(data);
          if (onStatusChange) onStatusChange(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const handleOAuthMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        void fetchStatus();
        setIsDropdownOpen(false);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        setErrorMsg(event.data.error || 'Authentication cancelled or failed.');
        setTimeout(() => setErrorMsg(null), 5000);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => {
      mounted = false;
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [fetchStatus, onStatusChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('http://localhost:8000/api/auth/google/url');
      const data = await res.json();

      if (!data.configured || !data.url) {
        setShowConfigModal(true);
        setIsLoading(false);
        return;
      }

      // Open OAuth popup centered on screen
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
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to initialize Google login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await fetch('http://localhost:8000/api/auth/google/disconnect', { method: 'POST' });
      await fetchStatus();
      setIsDropdownOpen(false);
    } catch {
      setErrorMsg('Failed to disconnect Google account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Error alert toast if any */}
      {errorMsg && (
        <div style={{
          position: 'absolute',
          top: '38px',
          right: 0,
          background: 'rgba(255, 69, 58, 0.95)',
          color: '#fff',
          fontSize: '0.72rem',
          padding: '6px 12px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
          zIndex: 3000,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertCircle size={13} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Button state: Connected */}
      {status.connected ? (
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            background: isDropdownOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid ' + (isDropdownOpen ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)'),
            color: '#f5f5f7',
            borderRadius: '980px',
            padding: '4px 12px 4px 8px',
            fontSize: '0.76rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.18s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
          title={`Connected as ${status.email}`}
        >
          {/* Google G Logo */}
          <svg width="13" height="13" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>

          {/* Pulsing indicator */}
          <span style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '7px',
            height: '7px'
          }}>
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#30d158',
              opacity: 0.8,
              animation: 'ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
            <span style={{
              position: 'relative',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#30d158'
            }} />
          </span>

          <span style={{
            maxWidth: '140px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#f5f5f7',
            fontWeight: 500
          }}>
            {status.email.split('@')[0]}
          </span>
          <ChevronDown
            size={12}
            color="#86868b"
            style={{
              transition: 'transform 0.2s ease',
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </button>
      ) : (
        /* Button state: Disconnected / Connect */
        <button
          onClick={handleConnect}
          disabled={isLoading}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#f5f5f7',
            borderRadius: '980px',
            padding: '5px 13px 5px 10px',
            fontSize: '0.76rem',
            fontWeight: 500,
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
          }}
          title="Connect Google Workspace (Gmail & Calendar)"
        >
          {isLoading ? (
            <Loader2 size={13} className="spin-slow" color="#86868b" />
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          )}
          <span>Connect Google</span>
        </button>
      )}

      {/* Connected Dropdown Menu */}
      {isDropdownOpen && status.connected && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#18181b',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          padding: '14px',
          width: '280px',
          zIndex: 9999,
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)'
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f5f5f7' }}>
                Google Workspace
              </span>
            </div>

            <span style={{
              fontSize: '0.66rem',
              color: '#30d158',
              background: 'rgba(48, 209, 88, 0.12)',
              border: '1px solid rgba(48, 209, 88, 0.25)',
              padding: '2px 7px',
              borderRadius: '980px',
              fontWeight: 500
            }}>
              Connected
            </span>
          </div>

          {/* Account Profile Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0071e3, #5e5ce6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#ffffff',
              flexShrink: 0
            }}>
              {status.email ? status.email[0].toUpperCase() : 'G'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.64rem', color: '#86868b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Google Account
              </span>
              <div style={{
                fontSize: '0.77rem',
                color: '#f5f5f7',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={status.email}>
                {status.email}
              </div>
            </div>
          </div>

          {/* Active Services List */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '9px',
            padding: '8px 10px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '7px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Mail size={13} color="#2997ff" />
                <span style={{ fontSize: '0.72rem', color: '#e5e5ea', fontWeight: 500 }}>Gmail Integration</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#86868b' }}>Direct & Drafts</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Calendar size={13} color="#30d158" />
                <span style={{ fontSize: '0.72rem', color: '#e5e5ea', fontWeight: 500 }}>Google Calendar</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#86868b' }}>Auto-Schedule</span>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            style={{
              width: '100%',
              background: 'rgba(255, 69, 58, 0.08)',
              border: '1px solid rgba(255, 69, 58, 0.22)',
              color: '#ff453a',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 69, 58, 0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 69, 58, 0.08)')}
          >
            <LogOut size={12} />
            <span>Disconnect Google</span>
          </button>
        </div>
      )}

      {/* Setup Guide Modal when GOOGLE_CLIENT_ID is not configured */}
      {showConfigModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(28, 28, 30, 0.96)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 159, 10, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={18} color="#ff9f0a" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: '#f5f5f7' }}>
                  Google Workspace Setup Required
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#86868b' }}>
                  Add OAuth credentials to backend/.env
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#a1a1a6', lineHeight: 1.5, marginBottom: '14px' }}>
              To connect real Gmail and Google Calendar, create an <strong>OAuth 2.0 Client ID</strong> in Google Cloud Console with redirect URI <code>http://localhost:8000/api/auth/google/callback</code>.
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              color: '#64d2ff',
              marginBottom: '16px'
            }}>
              GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com<br/>
              GOOGLE_CLIENT_SECRET=your-client-secret<br/>
              GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowConfigModal(false)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
