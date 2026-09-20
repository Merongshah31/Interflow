import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  RotateCw,
  Clock,
  Compass,
  Briefcase,
  X
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

// Strict geographic bounds covering Peninsular and East Malaysia exclusively
const MALAYSIA_BOUNDS: L.LatLngBoundsLiteral = [
  [0.8, 99.5],  // South-West: covers southern Johor / Singapore strait / Sarawak border
  [7.5, 119.5]  // North-East: covers northern Perlis / Kedah / Kelantan / tip of Sabah (Kudat)
];
const MALAYSIA_CENTER: L.LatLngTuple = [4.2105, 101.9758];

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

const clampZoom = (zoom: number): number => Math.min(Math.max(zoom, 6), 18);

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
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const sidebarListRef = useRef<HTMLDivElement | null>(null);

  // Guard flags to prevent unintended re-centering and animation clashes
  const hasInitializedRef = useRef<boolean>(false);
  const hasInitialFitRef = useRef<boolean>(false);
  const prevFilteredKeyRef = useRef<string>('');
  const onTriggerOutreachRef = useRef(onTriggerOutreach);
  useEffect(() => {
    onTriggerOutreachRef.current = onTriggerOutreach;
  }, [onTriggerOutreach]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const selectedCompanyIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedCompanyIdRef.current = selectedCompanyId;
  }, [selectedCompanyId]);

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

  // Filters — default minScore to 0 so ALL approved internships display on map
  const [searchQuery, setSearchQuery] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState<'All' | 'Hybrid' | 'On-site' | 'Remote'>('All');
  const [minScore, setMinScore] = useState<number>(0);
  const [activeCluster, setActiveCluster] = useState<string>('all');

  // Initialize Leaflet Map Centered and Bound to Malaysia (Runs ONCE)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: MALAYSIA_CENTER,
        zoom: clampZoom(6.5),
        minZoom: 6,
        maxZoom: 18,
        maxBounds: MALAYSIA_BOUNDS,
        maxBoundsViscosity: 1.0, // Strictly locks camera within Malaysia bounds
        zoomControl: false,
        attributionControl: false
      });

      // Clean OpenStreetMap tile layer bounded to Malaysia
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 6,
        bounds: MALAYSIA_BOUNDS,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Outer Boundary Mask Polygon: Dim ocean & surrounding countries to spotlight Malaysia
      const worldMask: [number, number][][] = [
        [
          [-85, -180],
          [-85, 180],
          [85, 180],
          [85, -180]
        ],
        [
          [0.8, 99.5],
          [7.5, 99.5],
          [7.5, 119.5],
          [0.8, 119.5]
        ]
      ];
      L.polygon(worldMask, {
        color: 'rgba(41, 151, 255, 0.35)',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#0a0a0c',
        fillOpacity: 0.32,
        interactive: false
      }).addTo(map);

      mapInstanceRef.current = map;
      hasInitializedRef.current = true;
    }

    // Auto-invalidate size on viewport changes
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof window.ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        mapInstanceRef.current?.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver?.disconnect();
    };
  }, []);

  // Update Markers when filter criteria or companies change (Decoupled from card clicks & incidental renders)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const filtered = companies.filter(c => {
      const matchSearch =
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMode = workModeFilter === 'All' || c.work_mode === workModeFilter;
      const matchScore = minScore === 0 ? true : c.match_score >= minScore;
      return matchSearch && matchMode && matchScore;
    });

    const currentFilteredKey = filtered.map(c => `${c.id}-${c.lat.toFixed(4)}-${c.lng.toFixed(4)}`).join('|');
    const hasFilterContentChanged = prevFilteredKeyRef.current !== currentFilteredKey;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    markersMapRef.current.clear();

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
          box-shadow: 0 4px 14px rgba(0,0,0,0.6);
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

      // Interaction Sync: Clicking marker highlights & scrolls sidebar card into view WITHOUT resetting zoom
      marker.on('click', () => {
        setSelectedCompanyId(c.id);
        const cardEl = document.getElementById(`company-card-${c.id}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      marker.on('popupopen', () => {
        setSelectedCompanyId(c.id);
        const cardEl = document.getElementById(`company-card-${c.id}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        const outreachBtn = document.getElementById(`btn-popup-outreach-${c.id}`);
        if (outreachBtn) {
          outreachBtn.onclick = () => {
            if (onTriggerOutreachRef.current) {
              onTriggerOutreachRef.current({
                company: c.company,
                role: c.role,
                matchScore: c.match_score
              });
            }
          };
        }
      });

      markersRef.current.push(marker);
      markersMapRef.current.set(c.id, marker);
    });

    // 1. Initial fit: runs ONCE on initial mount when markers are first ready
    if (!hasInitialFitRef.current && markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.12), { maxZoom: 12, animate: false });
      }
      hasInitialFitRef.current = true;
      prevFilteredKeyRef.current = currentFilteredKey;
      return;
    }

    // 2. Filter updates: only auto-fit if filter content actually changed AND no specific card is currently selected
    if (hasFilterContentChanged) {
      prevFilteredKeyRef.current = currentFilteredKey;
      if (!selectedCompanyIdRef.current && markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          map.stop();
          map.fitBounds(bounds.pad(0.12), { maxZoom: 12, animate: true });
        }
      }
    }
  }, [companies, searchQuery, workModeFilter, minScore]);

  // Interaction Sync: Clicking sidebar job card smoothly flyTo marker and opens popup (isolated)
  const handleSelectCompanyFromList = (c: MapCompanyLocation) => {
    if (selectedCompanyId === c.id) {
      // Already selected; just ensure popup is open without re-flying
      const marker = markersMapRef.current.get(c.id);
      if (marker && !marker.isPopupOpen()) {
        marker.openPopup();
      }
      return;
    }

    setSelectedCompanyId(c.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.stop(); // Stop any currently running map animation
      const targetZoom = clampZoom(14);
      map.flyTo([c.lat, c.lng], targetZoom, {
        animate: true,
        duration: 1.0
      });
      const marker = markersMapRef.current.get(c.id);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    }
  };

  const jumpToCluster = (clusterKey: string, lat: number, lng: number, zoom: number) => {
    setActiveCluster(clusterKey);
    setSelectedCompanyId(null);
    const map = mapInstanceRef.current;
    if (map) {
      map.stop();
      map.flyTo([lat, lng], clampZoom(zoom), { animate: true, duration: 1.0 });
    }
  };

  const resetToMalaysia = () => {
    setActiveCluster('all');
    setSelectedCompanyId(null);
    const map = mapInstanceRef.current;
    if (map) {
      map.stop();
      map.flyTo(MALAYSIA_CENTER, clampZoom(6.5), { animate: true, duration: 1.0 });
    }
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
    <div className="company-map-container">
      
      {/* 2. Dedicated Left Sidebar: Job Listings with Independent Scroll */}
      <aside className="company-map-sidebar">
        
        {/* Pinned Header Controls & Filter Section */}
        <div className="company-map-sidebar-header">
          
          {/* Top Title & Status Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'rgba(0, 113, 227, 0.16)',
                border: '1px solid rgba(41, 151, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={15} color="#2997ff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#f5f5f7', letterSpacing: '-0.02em', margin: 0 }}>
                    Tech Hubs Map
                  </h2>
                  <span style={{
                    fontSize: '0.66rem',
                    fontWeight: '600',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#a1a1a6',
                    padding: '1px 6px',
                    borderRadius: '980px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {filteredList.length}
                  </span>
                </div>
                <p style={{ fontSize: '0.68rem', color: '#86868b', margin: '1px 0 0 0' }}>
                  Malaysia geospatial intelligence
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {lastSyncedAt && (
                <div
                  title={`Last synchronized: ${lastSyncedAt.toLocaleTimeString()}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.66rem',
                    color: '#86868b',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    padding: '2px 6px',
                    borderRadius: '980px'
                  }}
                >
                  <Clock size={10} color="#30d158" />
                  <span>{lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}

              {onRetry && (
                <button
                  onClick={onRetry}
                  className="btn-secondary"
                  disabled={isRetrying}
                  title="Refresh / sync pipeline"
                  style={{ padding: '3px 8px', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCw size={11} className={isRetrying ? 'spin-anim' : ''} />
                  <span>{isRetrying ? 'Sync...' : 'Sync'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Input Bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={13} color="#86868b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search company, role, city (KL, Penang...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '6px 28px 6px 30px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: '#f5f5f7',
                fontSize: '0.76rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#86868b',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Pills: Work Mode & Min Fit Score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {/* Work Mode Segmented Filter */}
            <div style={{
              display: 'flex',
              gap: '2px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '2px',
              borderRadius: '7px',
              border: '1px solid var(--border-color)'
            }}>
              {(['All', 'Hybrid', 'On-site', 'Remote'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setWorkModeFilter(mode)}
                  style={{
                    padding: '2px 7px',
                    borderRadius: '5px',
                    border: 'none',
                    fontSize: '0.68rem',
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

            {/* Min Match Fit Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#86868b' }}>
              <span>Fit: <strong style={{ color: '#f5f5f7' }}>{minScore === 0 ? 'All' : `${minScore}%+`}</strong></span>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{ width: '52px', accentColor: '#0071e3', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Regional Quick Jump Clusters (Horizontal Scroll) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none'
          }}>
            <button
              onClick={() => jumpToCluster('all', 4.2105, 101.9758, 6.5)}
              style={{
                flexShrink: 0,
                padding: '2px 8px',
                borderRadius: '980px',
                border: activeCluster === 'all' ? '1px solid rgba(41, 151, 255, 0.5)' : '1px solid var(--border-subtle)',
                background: activeCluster === 'all' ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: activeCluster === 'all' ? '#64d2ff' : '#86868b',
                fontSize: '0.68rem',
                cursor: 'pointer'
              }}
            >
              All Malaysia
            </button>

            <button
              onClick={() => jumpToCluster('kl', 3.1390, 101.6869, 11)}
              style={{
                flexShrink: 0,
                padding: '2px 8px',
                borderRadius: '980px',
                border: activeCluster === 'kl' ? '1px solid rgba(41, 151, 255, 0.5)' : '1px solid var(--border-subtle)',
                background: activeCluster === 'kl' ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: activeCluster === 'kl' ? '#64d2ff' : '#86868b',
                fontSize: '0.68rem',
                cursor: 'pointer'
              }}
            >
              Klang Valley / PJ
            </button>

            <button
              onClick={() => jumpToCluster('cyberjaya', 2.9213, 101.6559, 13)}
              style={{
                flexShrink: 0,
                padding: '2px 8px',
                borderRadius: '980px',
                border: activeCluster === 'cyberjaya' ? '1px solid rgba(41, 151, 255, 0.5)' : '1px solid var(--border-subtle)',
                background: activeCluster === 'cyberjaya' ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: activeCluster === 'cyberjaya' ? '#64d2ff' : '#86868b',
                fontSize: '0.68rem',
                cursor: 'pointer'
              }}
            >
              Cyberjaya
            </button>

            <button
              onClick={() => jumpToCluster('penang', 5.3056, 100.2878, 12)}
              style={{
                flexShrink: 0,
                padding: '2px 8px',
                borderRadius: '980px',
                border: activeCluster === 'penang' ? '1px solid rgba(41, 151, 255, 0.5)' : '1px solid var(--border-subtle)',
                background: activeCluster === 'penang' ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: activeCluster === 'penang' ? '#64d2ff' : '#86868b',
                fontSize: '0.68rem',
                cursor: 'pointer'
              }}
            >
              Penang (Bayan Lepas / Batu Kawan)
            </button>

            <button
              onClick={() => jumpToCluster('kedah', 5.4200, 100.5800, 12)}
              style={{
                flexShrink: 0,
                padding: '2px 8px',
                borderRadius: '980px',
                border: activeCluster === 'kedah' ? '1px solid rgba(41, 151, 255, 0.5)' : '1px solid var(--border-subtle)',
                background: activeCluster === 'kedah' ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: activeCluster === 'kedah' ? '#64d2ff' : '#86868b',
                fontSize: '0.68rem',
                cursor: 'pointer'
              }}
            >
              Kedah (Kulim)
            </button>

            <button
              onClick={() => jumpToCluster('johor', 1.4927, 103.7414, 12)}
              style={{
                flexShrink: 0,
                padding: '2px 8px',
                borderRadius: '980px',
                border: activeCluster === 'johor' ? '1px solid rgba(41, 151, 255, 0.5)' : '1px solid var(--border-subtle)',
                background: activeCluster === 'johor' ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: activeCluster === 'johor' ? '#64d2ff' : '#86868b',
                fontSize: '0.68rem',
                cursor: 'pointer'
              }}
            >
              Johor (JB)
            </button>
          </div>

        </div>

        {/* Scrollable Job Cards List */}
        <div className="company-map-sidebar-list" ref={sidebarListRef}>
          {filteredList.map(c => {
            const isSelected = selectedCompanyId === c.id;
            return (
              <div
                key={c.id}
                id={`company-card-${c.id}`}
                className={`company-map-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectCompanyFromList(c)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: c.companyLogoBg || '#1c1c1e',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
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
                    background: c.match_score >= 90 ? 'rgba(48, 209, 88, 0.14)' : c.match_score >= 80 ? 'rgba(41, 151, 255, 0.14)' : 'rgba(255, 159, 10, 0.14)',
                    color: c.match_score >= 90 ? '#30d158' : c.match_score >= 80 ? '#2997ff' : '#ff9f0a',
                    fontWeight: '600'
                  }}>
                    {c.match_score}%
                  </span>
                </div>

                <div style={{ fontSize: '0.74rem', color: '#d1d1d6', fontWeight: '500' }}>
                  {c.role}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#86868b' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={10} color="#86868b" />
                    <span>{c.location.split(',')[0]}</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Briefcase size={10} color="#2997ff" />
                    <span style={{ color: '#2997ff', fontWeight: '500' }}>{c.work_mode}</span>
                  </span>
                  <span style={{ color: '#30d158', fontWeight: '500' }}>
                    {c.stipend}
                  </span>
                </div>

                {c.required_skills && c.required_skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                    {c.required_skills.slice(0, 3).map(skill => (
                      <span key={skill} style={{
                        fontSize: '0.62rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#a1a1a6'
                      }}>
                        {skill}
                      </span>
                    ))}
                    {c.required_skills.length > 3 && (
                      <span style={{ fontSize: '0.62rem', color: '#636366' }}>
                        +{c.required_skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div style={{ textAlign: 'center', color: '#86868b', fontSize: '0.76rem', padding: '40px 14px', lineHeight: 1.5 }}>
              <div>
                {internships.length === 0
                  ? 'No approved roles in the pipeline yet. Roles scouted by AI will appear on this map once approved in the Dashboard.'
                  : 'No companies match current filters.'}
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="btn-primary"
                  disabled={isRetrying}
                  style={{ marginTop: '12px', padding: '5px 12px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCw size={11} className={isRetrying ? 'spin-anim' : ''} />
                  <span>{isRetrying ? 'Checking...' : 'Retry Pipeline'}</span>
                </button>
              )}
            </div>
          )}
        </div>

      </aside>

      {/* 3. Right Main Area: Interactive Full-Height User Map */}
      <main className="company-map-main">
        
        {/* Leaflet Canvas */}
        <div
          ref={mapContainerRef}
          className="company-map-canvas"
        />

        {/* Floating Reset View to Malaysia Button */}
        <button
          onClick={resetToMalaysia}
          title="Reset map view to whole Malaysia"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            background: 'rgba(24, 24, 27, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border-color)',
            borderRadius: '980px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: '#f5f5f7',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.15s ease'
          }}
        >
          <Compass size={13} color="#2997ff" />
          <span>Reset to Malaysia</span>
        </button>

        {/* Floating Map Legend Overlay — Apple Frosted Glass Pill */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 1000,
          background: 'rgba(24, 24, 27, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color)',
          borderRadius: '980px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.7rem',
          color: '#a1a1a6',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#30d158', display: 'inline-block' }} />
            <span>90%+ Fit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2997ff', display: 'inline-block' }} />
            <span>80–89%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff9f0a', display: 'inline-block' }} />
            <span>&lt;80%</span>
          </div>
        </div>

      </main>

    </div>
  );
};
