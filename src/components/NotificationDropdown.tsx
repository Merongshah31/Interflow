import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Heart, 
  MessageSquare, 
  ExternalLink, 
  Upload, 
  Check, 
  Copy 
} from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'updates' | 'donation' | 'feedback';

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('updates');
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [customQrImage, setCustomQrImage] = useState<string>(() => {
    return localStorage.getItem('internflow_custom_qr') || '/duitnow-qr.svg';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomQrImage(reader.result);
          try {
            localStorage.setItem('internflow_custom_qr', reader.result);
          } catch {
            // storage quota limit fallback
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '42px',
        right: '0',
        width: '380px',
        maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(28, 28, 30, 0.95)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'fadeInSlideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top Header & Tab Navigation */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f5f5f7' }}>
              Notifications & Info
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '980px',
              background: 'rgba(48, 209, 88, 0.15)',
              color: '#30d158',
              border: '1px solid rgba(48, 209, 88, 0.25)'
            }}>
              v2.0.0
            </span>
          </div>
        </div>

        {/* 3 Segmented Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '4px',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            onClick={() => setActiveTab('updates')}
            style={{
              padding: '6px 0',
              borderRadius: '7px',
              fontSize: '0.74rem',
              fontWeight: activeTab === 'updates' ? 600 : 500,
              color: activeTab === 'updates' ? '#ffffff' : '#86868b',
              background: activeTab === 'updates' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={12} color={activeTab === 'updates' ? '#0071e3' : '#86868b'} />
            Updates
          </button>

          <button
            onClick={() => setActiveTab('donation')}
            style={{
              padding: '6px 0',
              borderRadius: '7px',
              fontSize: '0.74rem',
              fontWeight: activeTab === 'donation' ? 600 : 500,
              color: activeTab === 'donation' ? '#ffffff' : '#86868b',
              background: activeTab === 'donation' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <Heart size={12} color={activeTab === 'donation' ? '#ff375f' : '#86868b'} />
            Sumbangan
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              padding: '6px 0',
              borderRadius: '7px',
              fontSize: '0.74rem',
              fontWeight: activeTab === 'feedback' ? 600 : 500,
              color: activeTab === 'feedback' ? '#ffffff' : '#86868b',
              background: activeTab === 'feedback' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={12} color={activeTab === 'feedback' ? '#30d158' : '#86868b'} />
            Feedback
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px' }}>
        {/* TAB 1: UPDATES / CHANGELOG */}
        {activeTab === 'updates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(0, 113, 227, 0.08)',
              border: '1px solid rgba(0, 113, 227, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f5f5f7' }}>
                  Versi 2.0.0 (Terkini)
                </span>
                <span style={{ fontSize: '0.7rem', color: '#86868b' }}>September 2026</span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#86868b', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                Peningkatan penuh ekosistem AI Internship Malaysia dengan integrasi cloud & autonomi.
              </p>
              
              <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ fontSize: '0.74rem', color: '#d1d1d6', lineHeight: '1.4' }}>
                  <strong style={{ color: '#f5f5f7' }}>Live Cloud Backend:</strong> Dikuasakan oleh Render FastAPI dengan Supabase PostgreSQL persisten.
                </li>
                <li style={{ fontSize: '0.74rem', color: '#d1d1d6', lineHeight: '1.4' }}>
                  <strong style={{ color: '#f5f5f7' }}>Google OAuth 2.0 & Workspace:</strong> Integrasi rasmi akaun Google untuk outreach terus ke Gmail & Calendar.
                </li>
                <li style={{ fontSize: '0.74rem', color: '#d1d1d6', lineHeight: '1.4' }}>
                  <strong style={{ color: '#f5f5f7' }}>AI Career Coach & Dual Scout:</strong> Model Gemini 3.8 Flash & DeepSeek Chat untuk eksplorasi kerja tech Malaysia.
                </li>
                <li style={{ fontSize: '0.74rem', color: '#d1d1d6', lineHeight: '1.4' }}>
                  <strong style={{ color: '#f5f5f7' }}>Human-in-the-Loop Gateway:</strong> Keselamatan ketat kelulusan sebelum sebarang draf email dihantar.
                </li>
              </ul>
            </div>

            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#a1a1a6' }}>
                  Versi 1.0.0
                </span>
                <span style={{ fontSize: '0.68rem', color: '#636366' }}>Ogos 2026</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#636366', margin: 0 }}>
                Pelancaran MVP: Peta interaktif Leaflet Malaysia, Pipeline Kan-ban, dan integrasi awal resume evaluator.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SUMBANGAN / DUITNOW QR */}
        {activeTab === 'donation' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: '980px',
              background: 'rgba(255, 55, 95, 0.12)',
              border: '1px solid rgba(255, 55, 95, 0.25)',
              color: '#ff375f',
              fontSize: '0.72rem',
              fontWeight: 600,
              marginBottom: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Heart size={12} fill="#ff375f" />
              Sokong Pembangunan InternFlow
            </div>

            <p style={{ fontSize: '0.76rem', color: '#86868b', margin: '0 0 14px 0', lineHeight: '1.4' }}>
              InternFlow dibangunkan khas secara percuma untuk pelajar tech di Malaysia. Sebarang sumbangan amat bermakna untuk menampung kos server, API, dan penyelenggaraan platform.
            </p>

            {/* QR Card Container */}
            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              width: '200px',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              overflow: 'hidden'
            }}>
              <img
                src={customQrImage}
                alt="DuitNow QR Code"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Upload or change QR button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleQrUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                color: '#d1d1d6',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px',
                transition: 'all 0.15s ease'
              }}
              title="Tukar kepada gambar QR DuitNow peribadi anda"
            >
              <Upload size={12} />
              Tukar Gambar QR DuitNow
            </button>

            {/* Manual Account Copy Option */}
            <div style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.68rem', color: '#86868b' }}>DuitNow / TNG eWallet</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f5f5f7' }}>InternFlow Community Fund</div>
              </div>
              <button
                onClick={() => handleCopyAccount('internflow-fund@duitnow')}
                style={{
                  background: copiedAccount ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: copiedAccount ? '#30d158' : '#f5f5f7',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedAccount ? <Check size={12} /> : <Copy size={12} />}
                {copiedAccount ? 'Copied' : 'Salin'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: FEEDBACK (GOOGLE FORM) */}
        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(48, 209, 88, 0.12), rgba(0, 113, 227, 0.1))',
              border: '1px solid rgba(48, 209, 88, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(48, 209, 88, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <MessageSquare size={18} color="#30d158" />
              </div>
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f5f5f7', display: 'block', marginBottom: '4px' }}>
                Borang Maklum Balas Pelajar
              </span>
              <p style={{ fontSize: '0.75rem', color: '#86868b', margin: 0, lineHeight: '1.4' }}>
                Bantu kami menambah baik InternFlow dengan berkongsi cadangan ciri baru, laporan masalah, atau pengalaman anda mencari latihan industri.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '10px 12px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#86868b', marginBottom: '6px', fontWeight: 600 }}>
                TOPIK MAKLUM BALAS:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.73rem', color: '#d1d1d6' }}>
                <div>✨ Cadangan syarikat tech Malaysia baharu</div>
                <div>🐞 Laporan pepijat atau masalah login Google</div>
                <div>💡 Ciri integrasi AI Coach yang diinginkan</div>
              </div>
            </div>

            {/* Direct Google Form CTA Button */}
            <a
              href="https://forms.gle/sampleGoogleFormInternFlow"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 14px',
                background: '#0071e3',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                boxSizing: 'border-box',
                transition: 'background 0.15s ease',
                marginTop: '4px'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0077ed')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0071e3')}
            >
              <span>Buka Google Form</span>
              <ExternalLink size={14} />
            </a>

            <span style={{ fontSize: '0.68rem', color: '#636366', textAlign: 'center' }}>
              (Hanya mengambil masa 1 minit untuk diisi)
            </span>
          </div>
        )}
      </div>

      {/* Footer info bar */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: '#86868b'
      }}>
        <span>InternFlow Ecosystem</span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#86868b',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: '0.7rem'
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
