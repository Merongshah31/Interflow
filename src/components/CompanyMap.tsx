import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  RotateCw,
  Clock
} from 'lucide-react';
import type { Internship } from './PipelineTable';

export interface MapCompanyLocation {
  id: string;
  company: string;
  role: string;
  location: string;
  lat: number;
  lng: number;
  work_mode: 'On-site' | 'Hybrid' | 'Remote';
  match_score: number;
  required_skills: string[];
  job_url: string;
  stipend: string;
  companyLogoBg?: string;
  companyLogoText?: string;
}

interface CompanyMapProps {
  internships?: Internship[];
  onTriggerOutreach?: (company: { company: string; role: string; matchScore: number }) => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  lastSyncedAt?: Date;
}

const resolveCoordinates = (
  location: string = '',
  company: string = '',
  existingCoords?: { lat: number; lng: number }
): { lat: number; lng: number } => {
  const text = `${location} ${company}`.toLowerCase();
  
  // If existingCoords is provided and NOT the generic fallback default [3.1390, 101.6869], trust it!
  const isGenericDefault = existingCoords &&
    Math.abs(existingCoords.lat - 3.1390) < 0.005 &&
    Math.abs(existingCoords.lng - 101.6869) < 0.005;

  if (existingCoords && typeof existingCoords.lat === 'number' && typeof existingCoords.lng === 'number' && !isNaN(existingCoords.lat) && !isGenericDefault) {
    return existingCoords;
  }

  // 1. Kedah (Kulim Hi-Tech Park, Alor Setar)
  if (text.includes('kulim') || text.includes('kedah') || text.includes('khtp')) {
    return { lat: 5.4200, lng: 100.5800 };
  }
  // 2. Penang Tech Hubs (Batu Kawan, Bayan Lepas, George Town, Butterworth)
  if (text.includes('batu kawan')) {
    return { lat: 5.2638, lng: 100.4357 };
  }
  if (text.includes('bayan lepas')) {
    return { lat: 5.2974, lng: 100.2740 };
  }
  if (text.includes('georgetown') || text.includes('george town')) {
    return { lat: 5.4164, lng: 100.3327 };
  }
  if (text.includes('butterworth') || text.includes('seberang')) {
    return { lat: 5.3991, lng: 100.3638 };
  }
  if (text.includes('penang') || text.includes('pulau pinang')) {
    return { lat: 5.3056, lng: 100.2878 };
  }
  // 3. Cyberjaya & Putrajaya Tech Corridors
  if (text.includes('cyberjaya') || text.includes('sepang')) {
    return { lat: 2.9213, lng: 101.6559 };
  }
  if (text.includes('putrajaya')) {
    return { lat: 2.9264, lng: 101.6964 };
  }
  // 4. Selangor Tech Hubs (Shah Alam, Petaling Jaya, Subang, Sunway, Damansara)
  if (text.includes('shah alam')) {
    return { lat: 3.0733, lng: 101.5185 };
  }
  if (text.includes('subang') || text.includes('sunway')) {
    return { lat: 3.0738, lng: 101.6074 };
  }
  if (text.includes('damansara') || text.includes('bandar utama')) {
    return { lat: 3.1360, lng: 101.6180 };
  }
  if (text.includes('petaling') || text.includes('pj') || text.includes('selangor')) {
    return { lat: 3.1073, lng: 101.6067 };
  }
  // 5. Kuala Lumpur Clusters (Bangsar South, Mid Valley, KLCC, Mont Kiara)
  if (text.includes('bangsar') || text.includes('mid valley') || text.includes('kerinchi')) {
    return { lat: 3.1118, lng: 101.6663 };
  }
  if (text.includes('mont kiara') || text.includes('hartamas')) {
    return { lat: 3.1674, lng: 101.6534 };
  }
  if (text.includes('klcc') || text.includes('bukit bintang')) {
    return { lat: 3.1578, lng: 101.7119 };
  }
  if (text.includes('kuala lumpur') || text.includes('kl')) {
    return { lat: 3.1390, lng: 101.6869 };
  }
  // 6. Southern, Northern & Eastern Hubs
  if (text.includes('johor') || text.includes('jb') || text.includes('iskandar') || text.includes('nusajaya') || text.includes('medini')) {
    return { lat: 1.4927, lng: 103.7414 };
  }
  if (text.includes('melaka') || text.includes('malacca')) {
    return { lat: 2.1896, lng: 102.2501 };
  }
  if (text.includes('perak') || text.includes('ipoh') || text.includes('taiping')) {
    return { lat: 4.5975, lng: 101.0901 };
  }
  if (text.includes('pahang') || text.includes('kuantan')) {
    return { lat: 3.8077, lng: 103.3260 };
  }
  if (text.includes('sarawak') || text.includes('kuching')) {
    return { lat: 1.5533, lng: 110.3592 };
  }
  if (text.includes('sabah') || text.includes('kota kinabalu')) {
    return { lat: 5.9804, lng: 116.0735 };
  }

  // Fallback to existingCoords if valid, else central KL
  if (existingCoords && typeof existingCoords.lat === 'number' && typeof existingCoords.lng === 'number' && !isNaN(existingCoords.lat)) {
    return existingCoords;
  }
  return { lat: 3.1390, lng: 101.6869 }; // Default: Kuala Lumpur Hub
};

export const CompanyMap: React.FC<CompanyMapProps> = ({
  internships = [],
  onTriggerOutreach,
  onRetry,
  isRetrying = false,
  lastSyncedAt
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Derive map companies directly from live scout/pipeline internships
  const companies: MapCompanyLocation[] = React.useMemo(() => {
    if (!internships || internships.length === 0) {
      return [];
    }
    return internships.map((item, idx) => {
      const coords = resolveCoordinates(item.location, item.company, item.coordinates);
      // Spiral dispersion so multiple listings in the same tech cluster are distinct and clickable
      const angle = (idx * 137.5 * Math.PI) / 180;
      const radius = 0.0035 * Math.sqrt((idx % 6) + 1);
      const jitterLat = coords.lat + Math.sin(angle) * radius;
      const jitterLng = coords.lng + Math.cos(angle) * radius;
      return {
        id: item.id,
        company: item.company,
        role: item.role,
        location: item.location || 'Kuala Lumpur, Malaysia',
        lat: jitterLat,
        lng: jitterLng,
        work_mode: (item.workMode || 'Hybrid') as 'On-site' | 'Hybrid' | 'Remote',
        match_score: item.matchScore ?? 0,
        required_skills: item.requiredSkills || [],
        job_url: item.jobUrl || '',
        stipend: item.salary || 'RM 2,000/mo',
        companyLogoBg: item.companyLogoBg || '#1c1c1e',
        companyLogoText: item.companyLogoText || (item.company ? item.company[0] : 'C')
      };
    });
  }, [internships]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  // Filters — default minScore to 0 so ALL approved internships display on map
  const [searchQuery, setSearchQuery] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState<'All' | 'Hybrid' | 'On-site' | 'Remote'>('All');
  const [minScore, setMinScore] = useState<number>(0);
  const [activeCluster, setActiveCluster] = useState<string>('all');

  // Initialize Leaflet Map Centered on Malaysia (Klang Valley)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [3.1390, 101.6869],
        zoom: 11,
        zoomControl: false,
        attributionControl: false
      });

      // OpenStreetMap clean tile layer without watermark
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof window.ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        mapInstanceRef.current?.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      resizeObserver?.disconnect();
    };
  }, []);

  // Update Markers when filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = companies.filter(c => {
      const matchSearch =
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMode = workModeFilter === 'All' || c.work_mode === workModeFilter;
      const matchScore = minScore === 0 ? true : c.match_score >= minScore;
      return matchSearch && matchMode && matchScore;
    });

    filtered.forEach(c => {
      const isHigh = c.match_score >= 90;
      const isMed = c.match_score >= 80;
      const borderColor = isHigh ? '#30d158' : isMed ? '#2997ff' : '#ff9f0a';
      const bgColor = c.companyLogoBg || '#1c1c1e';

      const customHtml = `
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${bgColor};
          border: 2px solid ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        ">
          ${c.companyLogoText || c.company.substring(0, 1)}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: customHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
        tooltipAnchor: [0, -20]
      });

      const marker = L.marker([c.lat, c.lng], { icon: customIcon }).addTo(map);
      (marker as unknown as { _companyId: string })._companyId = c.id;

      // Informative Apple-styled hover tooltip
      const tooltipHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; padding: 7px 10px; min-width: 170px; line-height: 1.35;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <span style="font-size: 12px; font-weight: 700; color: #f5f5f7; letter-spacing: -0.01em;">${c.company}</span>
            <span style="font-size: 10px; font-weight: 700; color: ${borderColor}; background: ${borderColor}22; padding: 1px 5px; border-radius: 980px; border: 1px solid ${borderColor}44;">
              ${c.match_score}%
            </span>
          </div>
          <div style="font-size: 11px; color: #a1a1a6; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 190px;">
            ${c.role}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #86868b; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px; margin-top: 2px;">
            <span>📍 ${c.location.split(',')[0]}</span>
            <span style="color: #30d158; font-weight: 600;">${c.stipend}</span>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -20],
        className: 'apple-map-tooltip',
        opacity: 1
      });

      // Dark Mode Apple-styled Click Popup
      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; width: 240px; color: #f5f5f7; padding: 8px 6px 4px 6px; line-height: 1.4;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 14px; color: #ffffff; letter-spacing: -0.01em;">${c.company}</strong>
            <span style="font-size: 11px; padding: 2px 7px; border-radius: 980px; background: ${borderColor}25; color: ${borderColor}; font-weight: 700; border: 1px solid ${borderColor}50;">
              ${c.match_score}% Fit
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #e5e5ea; margin-bottom: 5px;">
            ${c.role}
          </div>
          <div style="font-size: 11px; color: #a1a1a6; margin-bottom: 4px;">
            📍 ${c.location} • <span style="font-weight: 600; color: #2997ff;">${c.work_mode}</span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #30d158; margin-bottom: 8px;">
            💵 Stipend: ${c.stipend}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">
            ${c.required_skills.map(s => `<span style="font-size: 10px; background: rgba(255,255,255,0.08); color: #d1d1d6; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">${s}</span>`).join('')}
          </div>
          <button id="btn-popup-outreach-${c.id}" style="
            width: 100%;
            padding: 8px 10px;
            background: #0071e3;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 113, 227, 0.4);
            transition: background 0.15s ease;
          ">
            Draft Application
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'apple-map-popup',
        offset: [0, -18]
      });

      marker.on('popupopen', () => {
        setSelectedCompanyId(c.id);
        const outreachBtn = document.getElementById(`btn-popup-outreach-${c.id}`);
        if (outreachBtn) {
          outreachBtn.onclick = () => {
            if (onTriggerOutreach) {
              onTriggerOutreach({
                company: c.company,
                role: c.role,
                matchScore: c.match_score
              });
            }
          };
        }
      });

      markersRef.current.push(marker);
    });

    // Automatically fit map bounds so all loaded markers across Malaysia are visible
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.12), { maxZoom: 13 });
      }
    }
  }, [companies, searchQuery, workModeFilter, minScore, onTriggerOutreach]);

  const handleSelectCompanyFromList = (c: MapCompanyLocation) => {
    setSelectedCompanyId(c.id);
    setMobileTab('map');
    const map = mapInstanceRef.current;
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
        map.setView([c.lat, c.lng], 13, { animate: true });
        const marker = markersRef.current.find(m => (m as unknown as { _companyId?: string })._companyId === c.id);
        if (marker) {
          marker.openPopup();
        }
      }, 60);
    }
  };

  const jumpToCluster = (clusterKey: string, lat: number, lng: number, zoom: number) => {
    setActiveCluster(clusterKey);
    mapInstanceRef.current?.setView([lat, lng], zoom, { animate: true });
  };

  const filteredList = companies.filter(c => {
    const matchSearch =
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMode = workModeFilter === 'All' || c.work_mode === workModeFilter;
    const matchScore = minScore === 0 ? true : c.match_score >= minScore;
    return matchSearch && matchMode && matchScore;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Controls Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Header Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={18} color="#f5f5f7" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#f5f5f7', letterSpacing: '-0.02em', margin: 0 }}>
                Malaysia Tech Hubs Map
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#86868b', margin: '2px 0 0 0' }}>
                Geospatial visualization of software engineering opportunities in Malaysia.
              </p>
            </div>
          </div>

          {/* Search & Apple Segmented Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#86868b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search KL, Penang, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 14px 6px 32px',
                  borderRadius: '980px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: '#f5f5f7',
                  fontSize: '0.78rem',
                  width: '200px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Apple macOS Segmented Control */}
            <div style={{
              display: 'flex',
              gap: '2px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px',
              borderRadius: '980px',
              border: '1px solid var(--border-color)'
            }}>
              {(['All', 'Hybrid', 'On-site', 'Remote'] as const).map(mode => (
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

            {/* Min Match Score Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#86868b' }}>
              <span>Min Fit: <strong style={{ color: '#f5f5f7' }}>{minScore === 0 ? 'All' : `${minScore}%+`}</strong></span>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{ width: '60px', accentColor: '#0071e3', cursor: 'pointer' }}
              />
            </div>

            {lastSyncedAt && (
              <div
                title={`Last synchronized: ${lastSyncedAt.toLocaleTimeString()}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  color: '#86868b',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  padding: '3px 8px',
                  borderRadius: '980px'
                }}
              >
                <Clock size={11} color="#30d158" />
                <span>Updated: <strong style={{ color: '#f5f5f7', fontWeight: '500' }}>{lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
              </div>
            )}

            {onRetry && (
              <button
                onClick={onRetry}
                className="btn-secondary"
                disabled={isRetrying}
                title="Refresh / retry sync with backend database"
                style={{ padding: '4px 12px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <RotateCw size={12} className={isRetrying ? 'spin-anim' : ''} />
                <span>{isRetrying ? 'Syncing...' : 'Retry'}</span>
              </button>
            )}

          </div>

        </div>

        {/* Regional Quick Jump Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.7rem', color: '#86868b', fontWeight: '500', marginRight: '4px' }}>Clusters:</span>
          
          <button
            onClick={() => jumpToCluster('kl', 3.1390, 101.6869, 11)}
            style={{
              padding: '3px 10px',
              borderRadius: '980px',
              border: activeCluster === 'kl' ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-subtle)',
              background: activeCluster === 'kl' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeCluster === 'kl' ? '#fff' : '#86868b',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            Klang Valley (KL / Bangsar South / PJ)
          </button>

          <button
            onClick={() => jumpToCluster('cyberjaya', 2.9213, 101.6559, 13)}
            style={{
              padding: '3px 10px',
              borderRadius: '980px',
              border: activeCluster === 'cyberjaya' ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-subtle)',
              background: activeCluster === 'cyberjaya' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeCluster === 'cyberjaya' ? '#fff' : '#86868b',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            Cyberjaya
          </button>

          <button
            onClick={() => jumpToCluster('penang', 5.3056, 100.2878, 12)}
            style={{
              padding: '3px 10px',
              borderRadius: '980px',
              border: activeCluster === 'penang' ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-subtle)',
              background: activeCluster === 'penang' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeCluster === 'penang' ? '#fff' : '#86868b',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            Penang (Bayan Lepas / Batu Kawan)
          </button>

          <button
            onClick={() => jumpToCluster('kedah', 5.4200, 100.5800, 12)}
            style={{
              padding: '3px 10px',
              borderRadius: '980px',
              border: activeCluster === 'kedah' ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-subtle)',
              background: activeCluster === 'kedah' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeCluster === 'kedah' ? '#fff' : '#86868b',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            Kedah (Kulim Hi-Tech)
          </button>

          <button
            onClick={() => jumpToCluster('all', 4.2105, 101.9758, 7)}
            style={{
              padding: '3px 10px',
              borderRadius: '980px',
              border: activeCluster === 'all' ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-subtle)',
              background: activeCluster === 'all' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeCluster === 'all' ? '#fff' : '#86868b',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            All Malaysia
          </button>
        </div>

      </div>

      {/* Mobile Segmented View Switcher */}
      <div className="company-map-mobile-toggle">
        <div className="view-mode-toggle" style={{ width: '100%', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setMobileTab('map');
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 80);
            }}
            className={`view-mode-btn ${mobileTab === 'map' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
          >
            <span>Map View</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('list')}
            className={`view-mode-btn ${mobileTab === 'list' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '6px' }}
          >
            <span>Tech Hubs ({filteredList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport & Drawer Layout */}
      <div className="company-map-layout">
        
        {/* Left Side: Company Quick Navigation List */}
        <div className={`glass-panel map-list-col ${mobileTab === 'list' ? 'mobile-visible' : 'mobile-hidden'}`} style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f5f5f7' }}>
              Malaysian Tech Hubs ({filteredList.length})
            </span>
            <span style={{ fontSize: '0.68rem', color: '#86868b' }}>
              Click to pinpoint
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
            {filteredList.map(c => {
              const isSelected = selectedCompanyId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCompanyFromList(c)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        background: c.companyLogoBg || '#1c1c1e',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: '#fff'
                      }}>
                        {c.companyLogoText || c.company[0]}
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#f5f5f7' }}>
                        {c.company}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 7px',
                      borderRadius: '980px',
                      background: c.match_score >= 90 ? 'rgba(48, 209, 88, 0.14)' : 'rgba(255, 159, 10, 0.14)',
                      color: c.match_score >= 90 ? '#30d158' : '#ff9f0a',
                      fontWeight: '600'
                    }}>
                      {c.match_score}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#d1d1d6', fontWeight: '400', marginBottom: '4px' }}>
                    {c.role}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#86868b' }}>
                    <span>📍 {c.location.split(',')[0]}</span>
                    <span style={{ color: '#30d158', fontWeight: '500' }}>
                      {c.stipend}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <div style={{ textAlign: 'center', color: '#86868b', fontSize: '0.78rem', padding: '40px 10px', lineHeight: 1.5 }}>
                <div>
                  {internships.length === 0
                    ? 'No approved roles in the pipeline yet. Roles scouted by AI will appear on this map once approved in the Admin Dashboard.'
                    : 'No companies match current filters.'}
                </div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="btn-primary"
                    disabled={isRetrying}
                    style={{ marginTop: '12px', padding: '6px 14px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RotateCw size={12} className={isRetrying ? 'spin-anim' : ''} />
                    <span>{isRetrying ? 'Checking Pipeline...' : 'Retry / Sync Pipeline'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Leaflet Interactive Map Viewport */}
        <div className={`glass-panel map-viewport-col ${mobileTab === 'map' ? 'mobile-visible' : 'mobile-hidden'}`} style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '16px'
            }}
          />

          {/* Quick Map Legend Overlay — Apple Frosted Glass Pill */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 1000,
            background: 'rgba(24, 24, 27, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border-color)',
            borderRadius: '980px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.7rem',
            color: '#a1a1a6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158', display: 'inline-block' }} />
              <span>90%+ Fit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2997ff', display: 'inline-block' }} />
              <span>80–89%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff9f0a', display: 'inline-block' }} />
              <span>&lt;80%</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
