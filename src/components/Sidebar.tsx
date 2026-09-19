import React from 'react';
import {
  Table,
  Settings,
  BrainCircuit,
  MapPin,
  PanelLeftClose
} from 'lucide-react';

export type NavTabType = 'pipeline' | 'map';

interface SidebarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onToggle
}) => {
  return (
    <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-logo-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BrainCircuit size={17} color="#f5f5f7" />
          </div>
          <div>
            <h1 style={{ fontSize: '0.98rem', fontWeight: '600', color: '#f5f5f7', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
              InternFlow
            </h1>
            <span style={{ fontSize: '0.66rem', color: '#86868b', display: 'block', letterSpacing: '-0.01em' }}>
              Career Intelligence
            </span>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="btn-sidebar-toggle"
          title="Close Sidebar"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#86868b',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Main Navigation (Dashboard, Company Map) */}
      <nav className="sidebar-nav">
        <div style={{
          fontSize: '0.66rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#6e6e73',
          padding: '6px 12px 4px 12px'
        }}>
          Workspace
        </div>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`sidebar-item ${activeTab === 'pipeline' ? 'active' : ''}`}
        >
          <Table size={16} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`sidebar-item ${activeTab === 'map' ? 'active' : ''}`}
        >
          <MapPin size={16} />
          <span>Company Map</span>
        </button>

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '10px 8px' }} />

        <button className="sidebar-item" style={{ opacity: 0.5, cursor: 'default' }}>
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
};
