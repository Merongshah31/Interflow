import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  ChevronDown,
  ExternalLink,
  Briefcase,
  Mail,
  Copy,
  Check,
  MapPin,
  X,
  RotateCw,
  Clock,
  Pencil,
  Loader2,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export type RoleSource = 'JobStreet' | 'Hiredly' | 'LinkedIn' | 'Glassdoor' | 'Maukerja' | 'Indeed' | 'MyFutureJobs' | 'Tech in Asia' | 'NodeFlair' | 'Company Portal' | (string & {});
export type WorkMode = 'On-site' | 'Hybrid' | 'Remote';

export interface Internship {
  id: string;
  company: string;
  companyLogoBg: string;
  companyLogoText: string;
  role: string;
  status: 'Not Started' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  deadline: string;
  matchScore: number;
  matchTier: 'High Match' | 'Low Match';
  aiReadiness: 'Skills Ready' | 'Gap Identified - See Taskmaster';
  jobUrl: string;
  resource: RoleSource;
  workMode: WorkMode;
  salary: string;
  location?: string;
  description?: string;
  sourceTitle?: string;
  sourceEvidence?: string;
  employmentType?: string;
  confidence?: number;
  contactEmail?: string;
  requiredSkills?: string[];
  coordinates?: { lat: number; lng: number };
  updatedAt?: string;
  createdAt?: string;
}

interface PipelineTableProps {
  internships: Internship[];
  onTriggerOutreach: (internship: Internship) => void;
  onAddListing: (listing: Internship) => void;
  onStatusChange: (id: string, newStatus: Internship['status']) => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  lastSyncedAt?: Date;
  onUpdateContactEmail?: (id: string, email: string) => Promise<void>;
  onSyncCalendar?: (internship: Internship) => void;
}

const formatRelativeTime = (isoString?: string): string => {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
};

const formatFullTimestamp = (isoString?: string | Date): string => {
  if (!isoString) return '';
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
};

export interface DeadlineDisplayInfo {
  text: string;
  isRolling: boolean;
}

const formatDeadlineDisplay = (raw?: string): DeadlineDisplayInfo => {
  if (!raw) return { text: 'Open / Rolling', isRolling: true };
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (
    !trimmed ||
    trimmed === '10/30/2026' ||
    lower.includes('not stated') ||
    lower.includes('rolling') ||
    lower.includes('open') ||
    lower.includes('undisclosed') ||
    lower === 'none'
  ) {
    return { text: 'Open / Rolling', isRolling: true };
  }

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const year = d.getFullYear();
    if (year >= 2024 && year <= 2035) {
      // Legacy hardcoded fallback check: 2026-10-30
      if (d.getMonth() === 9 && d.getDate() === 30 && year === 2026) {
        return { text: 'Open / Rolling', isRolling: true };
      }
      return {
        text: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        isRolling: false
      };
    }
  }

  return { text: trimmed, isRolling: false };
};

const ALL_STATUSES: Internship['status'][] = [
  'Not Started',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected'
];

const ALL_WORK_MODES: WorkMode[] = ['On-site', 'Hybrid', 'Remote'];
const ALL_SOURCES: RoleSource[] = ['JobStreet', 'Hiredly', 'LinkedIn', 'Glassdoor', 'Maukerja', 'Indeed', 'MyFutureJobs', 'Tech in Asia', 'NodeFlair', 'Company Portal'];

const normalizeMalaysianRegion = (location: string = '', company: string = ''): string => {
  const text = `${location} ${company}`.toLowerCase();

  // 1. Kedah (Kulim, Alor Setar, Sungai Petani, KHTP)
  if (text.includes('kedah') || text.includes('kulim') || text.includes('khtp') || text.includes('alor setar') || text.includes('sungai petani')) {
    return 'Kedah';
  }
  // 2. Penang (Bayan Lepas, Batu Kawan, George Town, Butterworth, Seberang Perai)
  if (text.includes('penang') || text.includes('pulau pinang') || text.includes('bayan lepas') || text.includes('batu kawan') || text.includes('george town') || text.includes('georgetown') || text.includes('butterworth') || text.includes('seberang')) {
    return 'Penang';
  }
  // 3. Perak (Ipoh, Taiping, Kampar)
  if (text.includes('perak') || text.includes('ipoh') || text.includes('taiping') || text.includes('kampar')) {
    return 'Perak';
  }
  // 4. Kuala Lumpur (KL, KLCC, Bangsar, Bangsar South, Mid Valley, Mont Kiara, Bukit Bintang, Cheras, etc.)
  if (text.includes('kuala lumpur') || text.includes('klcc') || text.includes('bangsar') || text.includes('mid valley') || text.includes('mont kiara') || text.includes('bukit bintang') || text.includes('federal territory of kuala lumpur') || text.includes('cheras') || text.includes('kerinchi') || /\bkl\b/i.test(text)) {
    return 'Kuala Lumpur';
  }
  // 5. Selangor (Petaling Jaya, PJ, Shah Alam, Cyberjaya, Subang, Sunway, Damansara, Puchong, Klang, Sepang, Bandar Utama)
  if (text.includes('selangor') || text.includes('petaling') || text.includes('pj') || text.includes('shah alam') || text.includes('cyberjaya') || text.includes('subang') || text.includes('sunway') || text.includes('damansara') || text.includes('puchong') || text.includes('klang') || text.includes('sepang') || text.includes('bandar utama')) {
    return 'Selangor';
  }
  // 6. Johor (Johor Bahru, JB, Iskandar, Nusajaya, Medini, Senai, Skudai)
  if (text.includes('johor') || text.includes('jb') || text.includes('iskandar') || text.includes('nusajaya') || text.includes('medini') || text.includes('senai') || text.includes('skudai')) {
    return 'Johor';
  }
  // 7. Melaka
  if (text.includes('melaka') || text.includes('malacca')) {
    return 'Melaka';
  }
  // 8. Putrajaya
  if (text.includes('putrajaya')) {
    return 'Putrajaya';
  }
  // 9. Negeri Sembilan
  if (text.includes('negeri sembilan') || text.includes('seremban') || text.includes('nilai')) {
    return 'Negeri Sembilan';
  }
  // 10. Pahang
  if (text.includes('pahang') || text.includes('kuantan')) {
    return 'Pahang';
  }
  // 11. Sarawak
  if (text.includes('sarawak') || text.includes('kuching') || text.includes('miri')) {
    return 'Sarawak';
  }
  // 12. Sabah
  if (text.includes('sabah') || text.includes('kota kinabalu')) {
    return 'Sabah';
  }

  return 'Kuala Lumpur';
};

export const PipelineTable: React.FC<PipelineTableProps> = ({
  internships,
  onTriggerOutreach,
  onAddListing,
  onStatusChange,
  onRetry,
  isRetrying = false,
  lastSyncedAt,
  onUpdateContactEmail,
  onSyncCalendar
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Internship['status']>('All');
  const [workModeFilter, setWorkModeFilter] = useState<'All' | WorkMode>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | RoleSource>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');

  // Sorting State (default, location, company, role, salary, deadline, updatedAt)
  const [sortBy, setSortBy] = useState<'default' | 'location' | 'company' | 'role' | 'salary' | 'deadline' | 'updatedAt'>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 'cards';
    }
    return 'table';
  });

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  // Status Dropdown State
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // Job Details Modal State (on clicking Grab or any role)
  const [selectedRole, setSelectedRole] = useState<Internship | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [editedEmailValue, setEditedEmailValue] = useState<string>('');
  const [isSavingEmail, setIsSavingEmail] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSaveSuccess, setEmailSaveSuccess] = useState<boolean>(false);

  const handleOpenRoleDetails = (item: Internship) => {
    setSelectedRole(item);
    const email = item.contactEmail || `careers@${item.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    setEditedEmailValue(email);
    setIsEditingEmail(false);
    setEmailError(null);
    setEmailSaveSuccess(false);
  };

  const handleSaveContactEmail = async () => {
    if (!selectedRole) return;
    const trimmed = editedEmailValue.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email format (e.g. name@domain.com)');
      return;
    }
    setEmailError(null);
    setIsSavingEmail(true);
    try {
      if (onUpdateContactEmail) {
        await onUpdateContactEmail(selectedRole.id, trimmed);
      }
      setSelectedRole(prev => prev ? { ...prev, contactEmail: trimmed } : null);
      setIsEditingEmail(false);
      setEmailSaveSuccess(true);
      setTimeout(() => setEmailSaveSuccess(false), 2500);
    } catch {
      setEmailError('Failed to update email. Please try again.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Dynamically include any custom resources present in internships
  const availableSources = Array.from(new Set([...ALL_SOURCES, ...internships.map(i => i.resource).filter(Boolean)]));

  // Add Entry Form State
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newWorkMode, setNewWorkMode] = useState<WorkMode>('Hybrid');
  const [newSource, setNewSource] = useState<RoleSource>('JobStreet');
  const [newSalary, setNewSalary] = useState('RM 2,000/mo');
  const [newLocation, setNewLocation] = useState('Kuala Lumpur, Malaysia');
  const [newJobUrl, setNewJobUrl] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Click outside to close status dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.status-pill')) {
          setOpenDropdownId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically derive unique normalized Malaysian regions for filter dropdown
  const availableRegions = React.useMemo(() => {
    const regSet = new Set<string>();
    internships.forEach(item => {
      const reg = normalizeMalaysianRegion(item.location, item.company);
      if (reg) regSet.add(reg);
    });
    return Array.from(regSet).sort((a, b) => a.localeCompare(b));
  }, [internships]);

  // Multi-criteria Filtering
  const filtered = internships.filter(item => {
    const itemRegion = normalizeMalaysianRegion(item.location, item.company);
    const matchesSearch =
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.resource && item.resource.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      itemRegion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesWorkMode = workModeFilter === 'All' || item.workMode === workModeFilter;
    const matchesSource = sourceFilter === 'All' || item.resource === sourceFilter;
    const matchesLocation = locationFilter === 'All' || itemRegion.toLowerCase() === locationFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesWorkMode && matchesSource && matchesLocation;
  });

  // Sorting Logic supporting Location, Company, Role, Stipend, Deadline, and Last Updated
  const sorted = React.useMemo(() => {
    if (sortBy === 'default') return filtered;

    const parseSalaryNum = (s?: string): number => {
      if (!s) return 0;
      const digits = s.replace(/[^0-9]/g, '');
      return digits ? parseInt(digits, 10) : 0;
    };

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'location') {
        const regA = normalizeMalaysianRegion(a.location, a.company);
        const regB = normalizeMalaysianRegion(b.location, b.company);
        cmp = regA.localeCompare(regB);
      } else if (sortBy === 'company') {
        cmp = (a.company || '').localeCompare(b.company || '');
      } else if (sortBy === 'role') {
        cmp = (a.role || '').localeCompare(b.role || '');
      } else if (sortBy === 'salary') {
        cmp = parseSalaryNum(a.salary) - parseSalaryNum(b.salary);
      } else if (sortBy === 'deadline') {
        const dA = formatDeadlineDisplay(a.deadline);
        const dB = formatDeadlineDisplay(b.deadline);
        if (dA.isRolling && dB.isRolling) {
          cmp = 0;
        } else if (dA.isRolling) {
          cmp = 1; // Open / Rolling comes after fixed dates
        } else if (dB.isRolling) {
          cmp = -1;
        } else {
          const dateA = new Date(a.deadline).getTime() || 0;
          const dateB = new Date(b.deadline).getTime() || 0;
          cmp = dateA - dateB;
        }
      } else if (sortBy === 'updatedAt') {
        const timeA = new Date(a.updatedAt || a.createdAt || '').getTime() || 0;
        const timeB = new Date(b.updatedAt || b.createdAt || '').getTime() || 0;
        cmp = timeA - timeB;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDirection]);

  const handleSort = (column: 'default' | 'location' | 'company' | 'role' | 'salary' | 'deadline' | 'updatedAt') => {
    if (sortBy === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortBy('default');
        setSortDirection('asc');
      }
    } else {
      setSortBy(column);
      setSortDirection(column === 'updatedAt' ? 'desc' : 'asc');
    }
  };

  const getStatusBadgeClass = (status: Internship['status']) => {
    switch (status) {
      case 'Not Started': return 'status-not-started';
      case 'Applied': return 'status-applied';
      case 'Interviewing': return 'status-interviewing';
      case 'Offer': return 'status-offer';
      case 'Rejected': return 'status-rejected';
      default: return 'status-not-started';
    }
  };

  const getStatusDotColor = (status: Internship['status']) => {
    switch (status) {
      case 'Not Started': return '#86868b';
      case 'Applied': return '#2997ff';
      case 'Interviewing': return '#ff9f0a';
      case 'Offer': return '#30d158';
      case 'Rejected': return '#ff453a';
      default: return '#86868b';
    }
  };

  const getSourceBadgeStyle = (src: RoleSource) => {
    switch (src) {
      case 'JobStreet':
        return { background: 'rgba(0, 113, 227, 0.16)', color: '#2997ff', border: '1px solid rgba(0, 113, 227, 0.28)' };
      case 'Hiredly':
        return { background: 'rgba(175, 82, 222, 0.16)', color: '#bf5af2', border: '1px solid rgba(175, 82, 222, 0.28)' };
      case 'LinkedIn':
        return { background: 'rgba(10, 102, 194, 0.16)', color: '#58a6ff', border: '1px solid rgba(10, 102, 194, 0.28)' };
      case 'Glassdoor':
        return { background: 'rgba(12, 166, 120, 0.16)', color: '#20c997', border: '1px solid rgba(12, 166, 120, 0.28)' };
      case 'Indeed':
        return { background: 'rgba(37, 99, 235, 0.16)', color: '#60a5fa', border: '1px solid rgba(37, 99, 235, 0.28)' };
      case 'MyFutureJobs':
        return { background: 'rgba(217, 119, 6, 0.16)', color: '#fbbf24', border: '1px solid rgba(217, 119, 6, 0.28)' };
      case 'Tech in Asia':
        return { background: 'rgba(225, 29, 72, 0.16)', color: '#fb7185', border: '1px solid rgba(225, 29, 72, 0.28)' };
      case 'Maukerja':
        return { background: 'rgba(255, 59, 48, 0.16)', color: '#ff453a', border: '1px solid rgba(255, 59, 48, 0.28)' };
      case 'Company Portal':
        return { background: 'rgba(52, 199, 89, 0.16)', color: '#30d158', border: '1px solid rgba(52, 199, 89, 0.28)' };
      default:
        return { background: 'rgba(191, 90, 242, 0.16)', color: '#dcb8ff', border: '1px solid rgba(191, 90, 242, 0.28)' };
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newRole) return;

    const finalJobUrl = newJobUrl.trim() || 'https://www.jobstreet.com.my';
    const finalContactEmail = newContactEmail.trim() || `careers@${newCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    const newItem: Internship = {
      id: `job-${Date.now()}`,
      company: newCompany,
      companyLogoBg: '#1c1c1e',
      companyLogoText: newCompany.substring(0, 1).toUpperCase(),
      role: newRole,
      status: 'Not Started',
      deadline: newDeadline.trim() || 'Open / Rolling',
      matchScore: 85,
      matchTier: 'High Match',
      aiReadiness: 'Skills Ready',
      jobUrl: finalJobUrl,
      contactEmail: finalContactEmail,
      resource: newSource,
      workMode: newWorkMode,
      salary: newSalary.startsWith('RM') ? newSalary : `RM ${newSalary}`,
      location: newLocation || 'Kuala Lumpur, Malaysia'
    };

    onAddListing(newItem);
    setShowAddModal(false);
    setNewCompany('');
    setNewRole('');
    setNewDeadline('');
    setNewWorkMode('Hybrid');
    setNewSource('JobStreet');
    setNewSalary('RM 2,000/mo');
    setNewLocation('Kuala Lumpur, Malaysia');
    setNewJobUrl('');
    setNewContactEmail('');
  };

  const hasActiveFilters = statusFilter !== 'All' || workModeFilter !== 'All' || sourceFilter !== 'All' || locationFilter !== 'All' || sortBy !== 'default' || searchTerm !== '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>

      {/* Top Title Bar — Apple Minimalist Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '600', color: '#f5f5f7', letterSpacing: '-0.025em', marginBottom: '4px' }}>
            Dashboard
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#86868b', letterSpacing: '-0.01em' }}>
            Explore software engineering internships across Kuala Lumpur, Cyberjaya, and Penang tech hubs.
          </p>
        </div>

        {/* Primary Action Button & Sync Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastSyncedAt && (
            <div
              title={`Last synchronized: ${formatFullTimestamp(lastSyncedAt)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                color: '#86868b',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                padding: '5px 11px',
                borderRadius: '980px'
              }}
            >
              <Clock size={12} color="#30d158" />
              <span>Last update: <strong style={{ color: '#f5f5f7', fontWeight: '500' }}>{formatRelativeTime(lastSyncedAt.toISOString())}</strong></span>
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-secondary"
              title="Refresh / retry sync with backend database"
              disabled={isRetrying}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCw size={13} className={isRetrying ? 'spin-anim' : ''} />
              <span>{isRetrying ? 'Syncing...' : 'Retry / Sync'}</span>
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={14} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Apple-Style Filter Bar */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Top Row: Search & Work Mode Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>

          {/* Spotlight Search Pill */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '380px' }}>
            <Search size={13} color="#86868b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Grab, Carsome, TNG, role, source..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '980px',
                padding: '6px 14px 6px 32px',
                color: '#f5f5f7',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Work Mode Segmented Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#86868b', fontWeight: '500' }}>Mode:</span>
            <div style={{
              display: 'flex',
              gap: '2px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '2px',
              borderRadius: '980px',
              border: '1px solid var(--border-color)'
            }}>
              {(['All', ...ALL_WORK_MODES] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setWorkModeFilter(mode)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '980px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    background: workModeFilter === mode ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                    color: workModeFilter === mode ? '#ffffff' : '#86868b',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Region Dropdown Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={12} color={locationFilter !== 'All' ? '#2997ff' : '#86868b'} />
            <span style={{ fontSize: '0.72rem', color: locationFilter !== 'All' ? '#2997ff' : '#86868b', fontWeight: '500' }}>Region:</span>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              style={{
                background: locationFilter !== 'All' ? 'rgba(0, 113, 227, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: locationFilter !== 'All' ? '1px solid rgba(0, 113, 227, 0.4)' : '1px solid var(--border-color)',
                borderRadius: '980px',
                padding: '4px 10px',
                color: locationFilter !== 'All' ? '#64d2ff' : '#f5f5f7',
                fontSize: '0.72rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All" style={{ background: '#1c1c1e', color: '#fff' }}>All Regions</option>
              {availableRegions.map(reg => (
                <option key={reg} value={reg} style={{ background: '#1c1c1e', color: '#fff' }}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={12} color={sortBy !== 'default' ? '#2997ff' : '#86868b'} />
            <span style={{ fontSize: '0.72rem', color: sortBy !== 'default' ? '#2997ff' : '#86868b', fontWeight: '500' }}>Sort:</span>
            <select
              value={sortBy === 'default' ? 'default' : `${sortBy}-${sortDirection}`}
              onChange={e => {
                const val = e.target.value;
                if (val === 'default') {
                  setSortBy('default');
                  setSortDirection('asc');
                } else {
                  const [col, dir] = val.split('-') as [any, any];
                  setSortBy(col);
                  setSortDirection(dir);
                }
              }}
              style={{
                background: sortBy !== 'default' ? 'rgba(0, 113, 227, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: sortBy !== 'default' ? '1px solid rgba(0, 113, 227, 0.4)' : '1px solid var(--border-color)',
                borderRadius: '980px',
                padding: '4px 10px',
                color: sortBy !== 'default' ? '#64d2ff' : '#f5f5f7',
                fontSize: '0.72rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="default" style={{ background: '#1c1c1e', color: '#fff' }}>Default Order</option>
              <option value="location-asc" style={{ background: '#1c1c1e', color: '#fff' }}>📍 Region (A → Z)</option>
              <option value="location-desc" style={{ background: '#1c1c1e', color: '#fff' }}>📍 Region (Z → A)</option>
              <option value="company-asc" style={{ background: '#1c1c1e', color: '#fff' }}>Company (A → Z)</option>
              <option value="company-desc" style={{ background: '#1c1c1e', color: '#fff' }}>Company (Z → A)</option>
              <option value="role-asc" style={{ background: '#1c1c1e', color: '#fff' }}>Role (A → Z)</option>
              <option value="salary-desc" style={{ background: '#1c1c1e', color: '#fff' }}>Stipend (High to Low)</option>
              <option value="salary-asc" style={{ background: '#1c1c1e', color: '#fff' }}>Stipend (Low to High)</option>
              <option value="deadline-asc" style={{ background: '#1c1c1e', color: '#fff' }}>Deadline (Soonest)</option>
              <option value="updatedAt-desc" style={{ background: '#1c1c1e', color: '#fff' }}>Recently Updated</option>
            </select>
          </div>

          {/* Source Dropdown Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#86868b', fontWeight: '500' }}>Source:</span>
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as any)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '980px',
                padding: '4px 10px',
                color: '#f5f5f7',
                fontSize: '0.72rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All" style={{ background: '#1c1c1e', color: '#fff' }}>All Sources</option>
              {availableSources.map(src => (
                <option key={src} value={src} style={{ background: '#1c1c1e', color: '#fff' }}>{src}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters if any active */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setWorkModeFilter('All');
                setSourceFilter('All');
                setLocationFilter('All');
                setSortBy('default');
                setSortDirection('asc');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2997ff',
                fontSize: '0.72rem',
                cursor: 'pointer',
                padding: '4px 8px',
                textDecoration: 'underline'
              }}
            >
              Reset Filters
            </button>
          )}

        </div>

        {/* Bottom Row: Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingTop: '2px' }}>
          <span style={{ fontSize: '0.72rem', color: '#86868b', fontWeight: '500', marginRight: '2px' }}>Status:</span>
          {(['All', ...ALL_STATUSES] as const).map(st => {
            const isSelected = statusFilter === st;
            const dotColor = st === 'All' ? '#86868b' : getStatusDotColor(st);
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '980px',
                  border: isSelected ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? '#ffffff' : '#86868b',
                  fontSize: '0.72rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease'
                }}
              >
                {st !== 'All' && (
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
                )}
                <span>{st}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Table Container Card — Apple Frosted Glass */}
      <div className="glass-panel" style={{ overflow: openDropdownId ? 'visible' : 'hidden' }}>

        {/* Table Sub-Header */}
        <div style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.01)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '600', color: '#f5f5f7', letterSpacing: '-0.01em' }}>
              Showing {sorted.length} of {internships.length} Malaysian Tech Roles
            </span>
            {sortBy !== 'default' && (
              <span style={{
                fontSize: '0.68rem',
                color: '#64d2ff',
                background: 'rgba(0, 113, 227, 0.15)',
                border: '1px solid rgba(0, 113, 227, 0.3)',
                padding: '1px 7px',
                borderRadius: '980px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ArrowUpDown size={10} />
                <span>Sorted: {sortBy === 'location' ? 'Place / Location' : sortBy} ({sortDirection === 'asc' ? 'A→Z' : 'Z→A'})</span>
              </span>
            )}
            {lastSyncedAt && (
              <>
                <span style={{ color: '#48484a', fontSize: '0.8rem' }}>•</span>
                <span style={{ fontSize: '0.72rem', color: '#86868b' }}>
                  Updated {formatRelativeTime(lastSyncedAt.toISOString())}
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="hide-on-mobile" style={{ fontSize: '0.72rem', color: '#86868b' }}>
              Click status pill to edit directly
            </span>

            {/* View Mode Toggle Switcher */}
            <div className="view-mode-toggle">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                title="Card View (Optimized for Mobile)"
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                title="Table View"
              >
                <TableIcon size={13} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div className="mobile-internship-cards">
            {filtered.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#86868b' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>No internships matched your filters.</p>
                {onRetry && (
                  <button onClick={onRetry} className="btn-primary" disabled={isRetrying}>
                    <RotateCw size={13} className={isRetrying ? 'spin-anim' : ''} />
                    <span>Sync Pipeline</span>
                  </button>
                )}
              </div>
            ) : (
              sorted.map((item) => {
                const isDropdownOpen = openDropdownId === item.id;
                return (
                  <div
                    key={item.id}
                    className="mobile-card"
                    onClick={() => handleOpenRoleDetails(item)}
                  >
                    {/* Header: Company, Location, Source, Work Mode */}
                    <div className="mobile-card-header">
                      <div className="mobile-card-company-wrap">
                        <div
                          className="mobile-card-logo"
                          style={{ background: item.companyLogoBg }}
                        >
                          {item.companyLogoText}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="mobile-card-company-name">{item.company}</div>
                          <div className="mobile-card-location">
                            <MapPin size={11} color="#86868b" />
                            <span title={item.location || 'Malaysia'}>
                              {normalizeMalaysianRegion(item.location, item.company)}
                              {item.location && item.location.split(',')[0].trim().toLowerCase() !== normalizeMalaysianRegion(item.location, item.company).toLowerCase() && (
                                <span style={{ opacity: 0.65, marginLeft: '4px' }}>• {item.location.split(',')[0].trim()}</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mobile-card-badges">
                        <span className="source-tag" style={getSourceBadgeStyle(item.resource)}>
                          {item.resource}
                        </span>
                        <span className="mode-tag">{item.workMode}</span>
                      </div>
                    </div>

                    {/* Role Title */}
                    <div className="mobile-card-role">
                      {item.role}
                    </div>

                    {/* Stipend & Deadline Meta Row */}
                    <div className="mobile-card-meta-row">
                      <div className="mobile-card-stipend">
                        {item.salary}
                      </div>
                      <div
                        className="mobile-card-deadline"
                        style={onSyncCalendar ? { cursor: 'pointer' } : undefined}
                        title={onSyncCalendar ? 'Click to sync deadline to Google Calendar' : undefined}
                        onClick={onSyncCalendar ? (e) => { e.stopPropagation(); onSyncCalendar(item); } : undefined}
                      >
                        <Calendar size={11} />
                        <span>{formatDeadlineDisplay(item.deadline).isRolling ? 'Open / Rolling' : `Deadline: ${formatDeadlineDisplay(item.deadline).text}`}</span>
                      </div>
                    </div>

                    {/* Footer: Status Pill with Dropdown & Apply Action */}
                    <div className="mobile-card-footer" onClick={(e) => e.stopPropagation()}>
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(prev => prev === item.id ? null : item.id);
                          }}
                          className={`status-pill ${getStatusBadgeClass(item.status)}`}
                          style={{
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            cursor: 'pointer',
                            padding: '4px 10px',
                            fontSize: '0.72rem'
                          }}
                        >
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: getStatusDotColor(item.status)
                          }} />
                          <span>{item.status}</span>
                          <ChevronDown size={11} style={{ opacity: 0.7 }} />
                        </button>

                        {/* Floating Status Options Dropdown */}
                        {isDropdownOpen && (
                          <div
                            ref={dropdownRef}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              bottom: 'calc(100% + 4px)',
                              left: 0,
                              zIndex: 99999,
                              background: 'rgba(24, 24, 27, 0.98)',
                              backdropFilter: 'blur(30px)',
                              WebkitBackdropFilter: 'blur(30px)',
                              border: '1px solid rgba(255, 255, 255, 0.18)',
                              borderRadius: '12px',
                              padding: '5px',
                              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.85)',
                              minWidth: '150px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}
                          >
                            {ALL_STATUSES.map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(item.id, opt);
                                  setOpenDropdownId(null);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: item.status === opt ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                                  color: item.status === opt ? '#ffffff' : '#d1d1d6',
                                  fontWeight: item.status === opt ? '600' : '400',
                                  fontSize: '0.74rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  width: '100%'
                                }}
                              >
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: getStatusDotColor(opt)
                                }} />
                                <span>{opt}</span>
                                {item.status === opt && (
                                  <Check size={12} color="#30d158" style={{ marginLeft: 'auto' }} />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          disabled
                          className="btn-action-outline"
                          title="Apply action disabled"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 12px',
                            opacity: 0.45,
                            cursor: 'not-allowed'
                          }}
                        >
                          <span>Apply</span>
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Dynamic Data Table */
          <div style={{ overflowX: openDropdownId ? 'visible' : 'auto', overflowY: openDropdownId ? 'visible' : 'hidden' }}>
            <table style={{ width: '100%', minWidth: '1080px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', tableLayout: 'auto' }}>
            <thead>
              <tr style={{
                background: 'rgba(255, 255, 255, 0.015)',
                color: '#86868b',
                fontSize: '0.72rem',
                fontWeight: '500',
                letterSpacing: '-0.01em',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <th
                  onClick={() => handleSort('company')}
                  title="Click to sort by Company"
                  style={{ padding: '11px 16px', fontWeight: '500', cursor: 'pointer', userSelect: 'none', color: sortBy === 'company' ? '#2997ff' : '#86868b' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Company</span>
                    {sortBy === 'company' && (sortDirection === 'asc' ? <ArrowUp size={11} color="#2997ff" /> : <ArrowDown size={11} color="#2997ff" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('role')}
                  title="Click to sort by Role"
                  style={{ padding: '11px 16px', fontWeight: '500', cursor: 'pointer', userSelect: 'none', color: sortBy === 'role' ? '#2997ff' : '#86868b' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Role</span>
                    {sortBy === 'role' && (sortDirection === 'asc' ? <ArrowUp size={11} color="#2997ff" /> : <ArrowDown size={11} color="#2997ff" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('location')}
                  title="Click to sort by Region (A-Z / Z-A)"
                  style={{
                    padding: '11px 16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: sortBy === 'location' ? '#2997ff' : '#f5f5f7',
                    background: sortBy === 'location' ? 'rgba(0, 113, 227, 0.12)' : 'transparent',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={12} color={sortBy === 'location' ? '#2997ff' : '#64d2ff'} />
                    <span>Region</span>
                    {sortBy === 'location' ? (
                      sortDirection === 'asc' ? <ArrowUp size={11} color="#2997ff" /> : <ArrowDown size={11} color="#2997ff" />
                    ) : (
                      <ArrowUpDown size={11} style={{ opacity: 0.5 }} />
                    )}
                  </div>
                </th>
                <th style={{ padding: '11px 16px', fontWeight: '500', whiteSpace: 'nowrap', minWidth: '160px' }}>Status</th>
                <th style={{ padding: '11px 16px', fontWeight: '500' }}>Mode</th>
                <th style={{ padding: '11px 16px', fontWeight: '500' }}>Source</th>
                <th
                  onClick={() => handleSort('salary')}
                  title="Click to sort by Stipend"
                  style={{ padding: '11px 16px', fontWeight: '500', cursor: 'pointer', userSelect: 'none', color: sortBy === 'salary' ? '#2997ff' : '#86868b' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Stipend (MYR)</span>
                    {sortBy === 'salary' && (sortDirection === 'asc' ? <ArrowUp size={11} color="#2997ff" /> : <ArrowDown size={11} color="#2997ff" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deadline')}
                  title="Click to sort by Deadline"
                  style={{ padding: '11px 16px', fontWeight: '500', cursor: 'pointer', userSelect: 'none', color: sortBy === 'deadline' ? '#2997ff' : '#86868b' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Deadline</span>
                    {sortBy === 'deadline' && (sortDirection === 'asc' ? <ArrowUp size={11} color="#2997ff" /> : <ArrowDown size={11} color="#2997ff" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('updatedAt')}
                  title="Click to sort by Last Updated"
                  style={{ padding: '11px 16px', fontWeight: '500', cursor: 'pointer', userSelect: 'none', color: sortBy === 'updatedAt' ? '#2997ff' : '#86868b' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Last Updated</span>
                    {sortBy === 'updatedAt' && (sortDirection === 'asc' ? <ArrowUp size={11} color="#2997ff" /> : <ArrowDown size={11} color="#2997ff" />)}
                  </div>
                </th>
                <th style={{ padding: '11px 16px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => {
                const isDropdownOpen = openDropdownId === item.id;

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenRoleDetails(item)}
                    style={{
                      borderBottom: idx === sorted.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                      transition: 'background 0.12s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* 1. Company */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          background: item.companyLogoBg,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '0.74rem',
                          color: '#fff',
                          flexShrink: 0
                        }}>
                          {item.companyLogoText}
                        </div>
                        <span style={{ fontWeight: '500', color: '#f5f5f7' }}>{item.company}</span>
                      </div>
                    </td>

                    {/* 2. Role */}
                    <td style={{ padding: '12px 16px', color: '#d1d1d6', fontWeight: '400' }}>
                      <span title={item.description || 'Description unavailable from source'}>{item.role}</span>
                    </td>

                    {/* 2.5 Region */}
                    <td style={{ padding: '12px 16px', color: '#d1d1d6', fontSize: '0.78rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={12} color={sortBy === 'location' ? '#2997ff' : '#86868b'} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: sortBy === 'location' ? '600' : '400', color: sortBy === 'location' ? '#64d2ff' : '#d1d1d6' }} title={item.location || 'Malaysia'}>
                          {normalizeMalaysianRegion(item.location, item.company)}
                        </span>
                        {item.location && item.location.split(',')[0].trim().toLowerCase() !== normalizeMalaysianRegion(item.location, item.company).toLowerCase() && (
                          <span style={{ fontSize: '0.68rem', color: '#86868b' }}>({item.location.split(',')[0].trim()})</span>
                        )}
                      </div>
                    </td>

                    {/* 3. Status — Interactive Apple Dropdown */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: '12px 16px', position: 'relative', whiteSpace: 'nowrap', overflow: 'visible', minWidth: '170px' }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(prev => prev === item.id ? null : item.id);
                        }}
                        className={`status-pill ${getStatusBadgeClass(item.status)}`}
                        style={{
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '5px 12px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          borderRadius: '980px',
                          fontSize: '0.76rem',
                          fontWeight: '500',
                          transition: 'all 0.15s ease'
                        }}
                        title="Click to adjust status"
                      >
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: getStatusDotColor(item.status),
                          display: 'inline-block'
                        }} />
                        <span>{item.status}</span>
                        <ChevronDown
                          size={11}
                          style={{
                            opacity: 0.7,
                            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s ease'
                          }}
                        />
                      </button>

                      {/* Floating Apple Dropdown Menu */}
                      {isDropdownOpen && (
                        <div
                          ref={dropdownRef}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: '16px',
                            zIndex: 99999,
                            background: 'rgba(24, 24, 27, 0.98)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255, 255, 255, 0.18)',
                            borderRadius: '12px',
                            padding: '5px',
                            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                            minWidth: '160px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <div style={{ fontSize: '0.64rem', color: '#86868b', padding: '4px 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Adjust Status
                          </div>
                          {ALL_STATUSES.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(item.id, opt);
                                setOpenDropdownId(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: item.status === opt ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                                color: item.status === opt ? '#ffffff' : '#d1d1d6',
                                fontWeight: item.status === opt ? '600' : '400',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.1s ease',
                                width: '100%'
                              }}
                              onMouseEnter={e => {
                                if (item.status !== opt) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                              }}
                              onMouseLeave={e => {
                                if (item.status !== opt) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: getStatusDotColor(opt)
                              }} />
                              <span>{opt}</span>
                              {item.status === opt && (
                                <Check size={13} color="#30d158" style={{ marginLeft: 'auto' }} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* 4. Work Mode */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '980px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        color: '#d1d1d6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Briefcase size={10} color="#86868b" />
                        <span>{item.workMode}</span>
                      </span>
                    </td>

                    {/* 5. Resource / Source */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <a
                        href={item.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        aria-label={`Open ${item.resource} job posting for ${item.role}`}
                        title={`Open ${item.resource} posting`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          padding: '3px 9px',
                          borderRadius: '980px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          ...getSourceBadgeStyle(item.resource)
                        }}
                      >
                        {item.resource}
                        <ExternalLink size={10} aria-hidden="true" />
                      </a>
                    </td>

                    {/* 6. Salary / Stipend in RM */}
                    <td style={{ padding: '12px 16px', color: '#30d158', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {(!item.salary || item.salary.toLowerCase().includes('not stated') || item.salary.toLowerCase().includes('undisclosed')) ? (
                        <span style={{ color: '#86868b', fontSize: '0.74rem', fontWeight: '400', fontFamily: 'var(--font-sans)' }}>
                          Salary not stated
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ fontSize: '0.66rem', color: '#86868b', fontWeight: '600' }}>RM</span>
                          <span>{item.salary.replace(/RM|\$/gi, '').trim()}</span>
                        </div>
                      )}
                    </td>

                    {/* 7. Deadline */}
                    <td style={{ padding: '12px 16px', color: '#86868b', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {(() => {
                        const dl = formatDeadlineDisplay(item.deadline);
                        return (
                          <div
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: onSyncCalendar ? 'pointer' : 'default' }}
                            title={onSyncCalendar ? 'Click to sync deadline to Google Calendar' : undefined}
                            onClick={onSyncCalendar ? (e) => { e.stopPropagation(); onSyncCalendar(item); } : undefined}
                          >
                            <Calendar size={12} color={dl.isRolling ? '#6e6e73' : '#2997ff'} />
                            {dl.isRolling ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#86868b',
                                fontSize: '0.72rem',
                                fontWeight: 500,
                                fontFamily: 'var(--font-sans)'
                              }}>
                                {dl.text}
                              </span>
                            ) : (
                              <span style={{ color: '#f5f5f7', fontWeight: 500, fontFamily: 'var(--font-sans)', fontSize: '0.74rem' }}>
                                {dl.text}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 8. Timestamp Last Update */}
                    <td style={{ padding: '12px 16px', color: '#86868b', fontSize: '0.74rem' }}>
                      <div
                        title={`Last updated: ${formatFullTimestamp(item.updatedAt || item.createdAt)}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Clock size={12} color="#6e6e73" />
                        <span style={{ color: '#aeaeb2', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                          {formatRelativeTime(item.updatedAt || item.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          disabled
                          className="btn-action-outline"
                          title="Apply action disabled"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#86868b',
                            opacity: 0.45,
                            cursor: 'not-allowed',
                            gap: '5px',
                            padding: '4px 9px',
                            fontSize: '0.74rem'
                          }}
                        >
                          <span>Apply</span>
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '48px 24px', textAlign: 'center', color: '#86868b', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '500', color: '#f5f5f7' }}>
                        {internships.length === 0 ? 'No Approved Roles Yet' : 'No Matching Roles'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#86868b', maxWidth: '420px', lineHeight: 1.5 }}>
                        {internships.length === 0 
                          ? 'New scraped roles must be reviewed and approved by the administrator in the backend dashboard before appearing here.' 
                          : 'Try adjusting your search query, status, or source filters.'}
                      </span>
                      {onRetry && (
                        <button
                          onClick={onRetry}
                          className="btn-primary"
                          disabled={isRetrying}
                          style={{
                            marginTop: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 16px',
                            fontSize: '0.78rem'
                          }}
                        >
                          <RotateCw size={13} className={isRetrying ? 'spin-anim' : ''} />
                          <span>{isRetrying ? 'Checking Pipeline...' : 'Retry / Sync Pipeline'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Entry Modal — Apple Sheet Dialog */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div style={{
            background: 'rgba(28, 28, 30, 0.92)',
            backdropFilter: 'blur(32px)',
            padding: '24px 20px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ color: '#f5f5f7', fontSize: '1.05rem', fontWeight: '600', marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Add Malaysia Internship Listing
            </h3>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grab, Touch 'n Go, Carsome"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#f5f5f7',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Role Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer Intern"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#f5f5f7',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Work Mode</label>
                  <select
                    value={newWorkMode}
                    onChange={e => setNewWorkMode(e.target.value as WorkMode)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#1c1c1e',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#f5f5f7',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Source Channel</label>
                  <select
                    value={newSource}
                    onChange={e => setNewSource(e.target.value as RoleSource)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#1c1c1e',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#f5f5f7',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="JobStreet">JobStreet</option>
                    <option value="Indeed">Indeed</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Hiredly">Hiredly</option>
                    <option value="MyFutureJobs">MyFutureJobs</option>
                    <option value="Tech in Asia">Tech in Asia</option>
                    <option value="NodeFlair">NodeFlair</option>
                    <option value="Glassdoor">Glassdoor</option>
                    <option value="Maukerja">Maukerja</option>
                    <option value="Company Portal">Company Portal</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Stipend (MYR)</label>
                  <input
                    type="text"
                    placeholder="e.g. RM 2,000/mo"
                    value={newSalary}
                    onChange={e => setNewSalary(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#f5f5f7',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Deadline Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Nov 2026 or Open / Rolling"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#f5f5f7',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Location / Tech Hub</label>
                <input
                  type="text"
                  placeholder="e.g. Mid Valley City, Kuala Lumpur / Bayan Lepas, Penang / Cyberjaya"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#f5f5f7',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Job Application Link / URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://www.grab.careers/... or https://www.jobstreet.com.my/..."
                  value={newJobUrl}
                  onChange={e => setNewJobUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#f5f5f7',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '4px' }}>Recruiter / Application Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. careers@company.com (defaults to careers@company.com)"
                  value={newContactEmail}
                  onChange={e => setNewContactEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#f5f5f7',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Job Details Modal — shows description, direct link, and recruiter email */}
      {selectedRole && (
        <div
          onClick={() => setSelectedRole(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(28, 28, 30, 0.96)',
              backdropFilter: 'blur(36px)',
              WebkitBackdropFilter: 'blur(36px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              gap: '18px',
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: selectedRole.companyLogoBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  {selectedRole.companyLogoText}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#f5f5f7', margin: 0 }}>
                    {selectedRole.role}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#a1a1a6', fontWeight: '500' }}>
                      {selectedRole.company}
                    </span>
                    <span style={{ color: '#48484a' }}>•</span>
                    <span style={{ fontSize: '0.74rem', color: '#86868b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="#30d158" />
                      Last update: {formatFullTimestamp(selectedRole.updatedAt || selectedRole.createdAt) || 'Recent'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#86868b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#86868b'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Badges / Metadata Pill Grid */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#d1d1d6' }}>
                <MapPin size={12} color="#86868b" />
                <span>{selectedRole.location || 'Kuala Lumpur, Malaysia'}</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#30d158', fontWeight: '500' }}>
                <span>{selectedRole.salary || 'RM 2,500/mo'}</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#d1d1d6' }}>
                <Briefcase size={12} color="#86868b" />
                <span>{selectedRole.workMode}</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#86868b' }}>
                <Calendar size={12} color="#86868b" />
                <span>{formatDeadlineDisplay(selectedRole.deadline).isRolling ? 'Open / Rolling Admission' : `Apply by ${formatDeadlineDisplay(selectedRole.deadline).text}`}</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
                <span style={{ color: '#86868b' }}>Status:</span>
                <select
                  value={selectedRole.status}
                  onChange={(e) => {
                    const newSt = e.target.value as Internship['status'];
                    onStatusChange(selectedRole.id, newSt);
                    setSelectedRole(prev => prev ? { ...prev, status: newSt } : null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '980px',
                    padding: '3px 10px',
                    color: '#f5f5f7',
                    fontSize: '0.74rem',
                    fontWeight: '500',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {ALL_STATUSES.map(st => (
                    <option key={st} value={st} style={{ background: '#1c1c1e', color: '#fff' }}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Job Description Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#a1a1a6', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Job Description & Responsibilities
              </h4>
              <p style={{
                fontSize: '0.86rem',
                color: '#e5e5ea',
                lineHeight: 1.65,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '14px 16px',
                borderRadius: '12px',
                margin: 0,
                whiteSpace: 'pre-line'
              }}>
                {selectedRole.description || 'Join the engineering team to design, build, and deploy high-performance software systems. Collaborate with cross-functional teams to solve technical challenges and deliver reliable features for consumers across Malaysia.'}
              </p>
            </div>

            {/* Required Skills Section */}
            {selectedRole.requiredSkills && selectedRole.requiredSkills.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#a1a1a6', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Key Skills & Technologies
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedRole.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '980px',
                        fontSize: '0.74rem',
                        color: '#f5f5f7',
                        fontWeight: '500'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Application Link Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#a1a1a6', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Official Job Posting Link
              </h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    ...getSourceBadgeStyle(selectedRole.resource)
                  }}>
                    {selectedRole.resource}
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    color: '#86868b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {selectedRole.jobUrl}
                  </span>
                </div>
                <a
                  href={selectedRole.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#2997ff',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  <span>Open Link</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Recruiter / Contact Email Section */}
            {!isEditingEmail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#a1a1a6', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    Recruiter & Application Email
                  </h4>
                  {emailSaveSuccess && (
                    <span style={{ fontSize: '0.72rem', color: '#30d158', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Email updated
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <Mail size={15} color="#2997ff" style={{ flexShrink: 0 }} />
                    <a
                      href={`mailto:${selectedRole.contactEmail || `careers@${selectedRole.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}`}
                      style={{
                        fontSize: '0.82rem',
                        color: '#2997ff',
                        textDecoration: 'none',
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {selectedRole.contactEmail || `careers@${selectedRole.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingEmail(true);
                        setEmailError(null);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f5f5f7',
                        padding: '6px 11px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                      title="Edit recruiter email"
                    >
                      <Pencil size={12} />
                      <span>Edit Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const email = selectedRole.contactEmail || `careers@${selectedRole.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
                        navigator.clipboard.writeText(email);
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2000);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: copiedEmail ? '#30d158' : '#f5f5f7',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedEmail ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onTriggerOutreach(selectedRole);
                        setSelectedRole(null);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(41, 151, 255, 0.15)',
                        border: '1px solid rgba(41, 151, 255, 0.35)',
                        color: '#2997ff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Mail size={12} />
                      <span>Draft Outreach</span>
                    </button>
                    {onSyncCalendar && (
                      <button
                        type="button"
                        onClick={() => {
                          onSyncCalendar(selectedRole);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(52, 199, 89, 0.15)',
                          border: '1px solid rgba(52, 199, 89, 0.35)',
                          color: '#34c759',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        title="Add application deadline reminder to your Google Calendar"
                      >
                        <Calendar size={12} />
                        <span>Sync Calendar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: '600', color: '#2997ff', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    Edit Recruiter Email
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#86868b' }}>
                    Syncs with future & pending outreach drafts
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(41, 151, 255, 0.35)',
                  borderRadius: '12px'
                }}>
                  <Mail size={15} color="#2997ff" style={{ flexShrink: 0 }} />
                  <input
                    type="email"
                    value={editedEmailValue}
                    onChange={e => {
                      setEditedEmailValue(e.target.value);
                      setEmailError(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleSaveContactEmail();
                      } else if (e.key === 'Escape') {
                        setIsEditingEmail(false);
                        setEmailError(null);
                      }
                    }}
                    placeholder="e.g. careers@company.com"
                    autoFocus
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f5f5f7',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveContactEmail}
                    disabled={isSavingEmail}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#2997ff',
                      border: 'none',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '7px',
                      fontSize: '0.74rem',
                      fontWeight: '600',
                      cursor: isSavingEmail ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSavingEmail ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    <span>{isSavingEmail ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(false);
                      setEmailError(null);
                      setEditedEmailValue(selectedRole.contactEmail || `careers@${selectedRole.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
                    }}
                    disabled={isSavingEmail}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#86868b',
                      padding: '6px 10px',
                      borderRadius: '7px',
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} />
                    <span>Cancel</span>
                  </button>
                </div>
                {emailError && (
                  <span style={{ fontSize: '0.72rem', color: '#ff453a', paddingLeft: '4px' }}>
                    {emailError}
                  </span>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
