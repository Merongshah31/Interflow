import React, { useState } from 'react';
import { Bell, ShieldAlert, PanelLeft, PanelLeftClose } from 'lucide-react';
import { GoogleConnectButton } from './GoogleConnectButton';
import { NotificationDropdown } from './NotificationDropdown';
import type { UserProfile } from './AuthGate';

interface HeaderProps {
  pendingHITLCount: number;
  onOpenHITL: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeTab?: string;
  onGoogleStatusChange?: (status: any) => void;
  user?: UserProfile | null;
  onOpenProfileModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pendingHITLCount,
  onOpenHITL,
  isSidebarOpen,
  onToggleSidebar,
  activeTab = 'pipeline',
  onGoogleStatusChange,
  user,
  onOpenProfileModal
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(() => {
    return localStorage.getItem('internflow_last_read_v2') !== 'true';
  });

  const handleToggleNotifications = () => {
    setIsNotificationOpen(prev => !prev);
    if (hasUnread) {
      setHasUnread(false);
      localStorage.setItem('internflow_last_read_v2', 'true');
    }
  };

  return (
    <header className="top-header">
      {/* Sidebar Toggle & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn-sidebar-toggle"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          style={{
            background: isSidebarOpen ? 'transparent' : 'rgba(255, 255, 255, 0.08)',
            border: '1px solid ' + (isSidebarOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.16)'),
            color: isSidebarOpen ? '#86868b' : '#f5f5f7',
            cursor: 'pointer',
            width: '30px',
            height: '30px',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
        </button>

        <span style={{ fontSize: '0.82rem', color: '#86868b', fontWeight: '400' }}>
          Workspace
        </span>
        <span style={{ fontSize: '0.82rem', color: '#48484a' }}>/</span>
        <span style={{ fontSize: '0.82rem', color: '#f5f5f7', fontWeight: '500' }}>
          {activeTab === 'map' ? 'Company Map' : 'Dashboard'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Google Workspace Connection Pill */}
        <GoogleConnectButton 
          userId={user?.user_id} 
          userEmail={user?.email} 
          onStatusChange={onGoogleStatusChange} 
        />

        {/* Apple-style Pending HITL Pill */}
        {pendingHITLCount > 0 && (
          <button
            onClick={onOpenHITL}
            style={{
              background: 'rgba(255, 69, 58, 0.12)',
              border: '1px solid rgba(255, 69, 58, 0.24)',
              color: '#ff453a',
              borderRadius: '980px',
              padding: '4px 12px',
              fontSize: '0.74rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldAlert size={13} />
            <span>Action Required ({pendingHITLCount})</span>
          </button>
        )}

        {/* Minimalist Notification Bell */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={handleToggleNotifications}
            style={{
              cursor: 'pointer',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isNotificationOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid ' + (isNotificationOpen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
              transition: 'all 0.15s ease'
            }}
            title="Notifications, updates & feedback"
          >
            <Bell size={14} color={isNotificationOpen ? '#f5f5f7' : '#86868b'} />
            {hasUnread && (
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ff453a',
                boxShadow: '0 0 6px rgba(255, 69, 58, 0.8)'
              }} />
            )}
          </div>

          {/* Interactive Notification Dropdown Menu */}
          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        {/* Dynamic User Profile Pill */}
        <div
          onClick={onOpenProfileModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '4px 8px 4px 4px',
            borderRadius: '980px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
          title="Click to edit profile settings"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User'}
              referrerPolicy="no-referrer"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0071e3, #5e5ce6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.74rem',
              color: '#ffffff'
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}

          <div>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              color: '#f5f5f7',
              lineHeight: 1.2,
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.name || 'Student'}
            </div>
            <div style={{
              fontSize: '0.64rem',
              color: '#86868b',
              lineHeight: 1.2,
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.headline || 'Software Engineering'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
