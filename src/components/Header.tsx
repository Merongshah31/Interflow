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
      <div className="header-left">
        <button
          onClick={onToggleSidebar}
          className="btn-sidebar-toggle"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>

        <div className="header-breadcrumbs">
          <span className="header-breadcrumb-root hide-on-mobile">Workspace</span>
          <span className="header-breadcrumb-sep hide-on-mobile">/</span>
          <span className="header-breadcrumb-active">
            {activeTab === 'map' ? 'Company Map' : 'Dashboard'}
          </span>
        </div>
      </div>

      <div className="header-right">
        {/* Google Workspace Connection Pill (Auto-adapts on mobile) */}
        <div className="header-google-btn-wrap hide-on-xs">
          <GoogleConnectButton 
            userId={user?.user_id} 
            userEmail={user?.email} 
            onStatusChange={onGoogleStatusChange} 
          />
        </div>

        {/* Apple-style Pending HITL Pill */}
        {pendingHITLCount > 0 && (
          <button
            onClick={onOpenHITL}
            className="header-hitl-pill"
            aria-label={`Action Required: ${pendingHITLCount} pending`}
          >
            <ShieldAlert size={14} color="#ff453a" />
            <span className="hide-on-mobile">Action Required ({pendingHITLCount})</span>
            <span className="show-on-mobile" style={{ fontWeight: 700 }}>{pendingHITLCount}</span>
          </button>
        )}

        {/* Minimalist Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="header-icon-btn"
            title="Notifications, updates & feedback"
            aria-label="Notifications"
          >
            <Bell size={15} color={isNotificationOpen ? '#f5f5f7' : '#86868b'} />
            {hasUnread && (
              <span className="header-notif-indicator" />
            )}
          </button>

          {/* Interactive Notification Dropdown Menu */}
          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        {/* Dynamic User Profile Pill */}
        <div
          onClick={onOpenProfileModal}
          className="header-profile-pill"
          title="Click to edit profile settings"
          role="button"
          tabIndex={0}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User'}
              referrerPolicy="no-referrer"
              className="header-avatar-img"
            />
          ) : (
            <div className="header-avatar-fallback">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}

          <div className="header-user-meta hide-on-mobile">
            <div className="header-user-name">
              {user?.name || 'Student'}
            </div>
            <div className="header-user-sub">
              {user?.headline || 'Software Engineering'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
