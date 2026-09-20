import React from 'react';
import { Table, MapPin, ShieldAlert, User } from 'lucide-react';
import type { NavTabType } from './Sidebar';
import type { UserProfile } from './AuthGate';

interface BottomNavProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  pendingHITLCount: number;
  onOpenHITL: () => void;
  user: UserProfile | null;
  onOpenProfile: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingHITLCount,
  onOpenHITL,
  user,
  onOpenProfile
}) => {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* Dashboard Tab */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
        onClick={() => setActiveTab('pipeline')}
        aria-label="Dashboard"
      >
        <div className="bottom-nav-icon-wrap">
          <Table size={18} />
        </div>
        <span className="bottom-nav-label">Dashboard</span>
      </button>

      {/* Company Map Tab */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => setActiveTab('map')}
        aria-label="Company Map"
      >
        <div className="bottom-nav-icon-wrap">
          <MapPin size={18} />
        </div>
        <span className="bottom-nav-label">Map</span>
      </button>

      {/* HITL Pending Actions Tab */}
      <button
        type="button"
        className={`bottom-nav-item ${pendingHITLCount > 0 ? 'has-action' : ''}`}
        onClick={onOpenHITL}
        aria-label={`Action Required: ${pendingHITLCount} pending`}
      >
        <div className="bottom-nav-icon-wrap">
          <ShieldAlert size={18} color={pendingHITLCount > 0 ? '#ff453a' : 'currentColor'} />
          {pendingHITLCount > 0 && (
            <span className="bottom-nav-badge">{pendingHITLCount}</span>
          )}
        </div>
        <span className="bottom-nav-label" style={{ color: pendingHITLCount > 0 ? '#ff453a' : undefined }}>
          {pendingHITLCount > 0 ? `HITL (${pendingHITLCount})` : 'Queue'}
        </span>
      </button>

      {/* Profile & Settings Tab */}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={onOpenProfile}
        aria-label="User Profile"
      >
        <div className="bottom-nav-icon-wrap">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User'}
              className="bottom-nav-avatar"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User size={18} />
          )}
        </div>
        <span className="bottom-nav-label">Profile</span>
      </button>
    </nav>
  );
};
