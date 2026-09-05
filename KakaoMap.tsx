import { useEffect, useRef, useState, useCallback, type PointerEvent } from 'react';
import { CommunityReport, Facility, POICategory, RampAccessPoint } from '../types';
import { AnyangTourSpot } from '../data/anyangAttractions';
import { OFFICIAL_STREAM_LINES, OFFICIAL_RAMP_POINTS } from '../data/courses';
import { loadKakaoMapsServices } from '../services/kakaoService';
import { Layers, Plus, Minus, Compass, Crosshair, ShieldAlert } from 'lucide-react';
import L from 'leaflet';

export interface KakaoMapProps {
  center: { lat: number; lng: number };
  routePath?: [number, number][];
  passedPath?: [number, number][];
  remainingPath?: [number, number][];
  riderPosition?: { lat: number; lng: number } | null;
  heading?: number; // Compass heading in degrees (0 - 360)
  isHeadingLocked?: boolean; // true = 1st person Heading-Up, false = 2D North-Up
  onToggleHeadingLock?: () => void;
  activePoiFilters?: POICategory[];
  alwaysVisibleCategories?: POICategory[];
  facilities?: Facility[];
  showAllFacilities?: boolean;
  highlightFacilityId?: string | null;
  onSelectFacility?: (fac: Facility) => void;
  onSelectRampPoint?: (ramp: RampAccessPoint) => void;
  onOpenOfficialGuide?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  reports?: CommunityReport[];
  onSelectReport?: (report: CommunityReport) => void;
  isRiding?: boolean;
  isSheetExpanded?: boolean;
  tourSpots?: AnyangTourSpot[];
  highlightTourSpotId?: string | null;
  onSelectTourSpot?: (spot: AnyangTourSpot) => void;
  onOpenQuickReport?: () => void;
  onFindMyLocation?: () => void;
}

// POI category styling
const POI_ICONS: Record<POICategory, { emoji: string; color: string; label: string }> = {
  water: { emoji: '💧', color: '#0284c7', label: '음수대' },
  repair: { emoji: '🔧', color: '#059669', label: '수리/공기주입기' },
  restroom: { emoji: '🚻', color: '#d97706', label: '화장실' },
  parking: { emoji: '🚲', color: '#4f46e5', label: '자전거 거치대' },
  cafe: { emoji: '☕', color: '#e11d48', label: '편의점/카페' },
  hazard: { emoji: '⚠️', color: '#ea580c', label: '주의구간' },
};

function getVisualMarkerPosition(facility: Facility, facilities: Facility[]) {
  const sameLocation = facilities.filter((item) => item.lat === facility.lat && item.lng === facility.lng);
  if (sameLocation.length <= 1) return { lat: facility.lat, lng: facility.lng };

  const occurrence = sameLocation.indexOf(facility);
  const angle = (occurrence / sameLocation.length) * Math.PI * 2;
  const radius = 0.000045;
  return {
    lat: facility.lat + Math.sin(angle) * radius,
    lng: facility.lng + Math.cos(angle) * radius,
  };
}

export default function KakaoMap({
  center,
  routePath,
  passedPath,
  remainingPath,
  riderPosition,
  heading = 0,
  isHeadingLocked = true,
  onToggleHeadingLock,
  activePoiFilters = [],
  alwaysVisibleCategories = [],
  facilities = [],
  showAllFacilities = false,
  highlightFacilityId = null,
  onSelectFacility,
  onSelectRampPoint,
  onMapClick,
  reports = [],
  onSelectReport,
  isRiding = false,
  isSheetExpanded = false,
  tourSpots = [],
  highlightTourSpotId = null,
  onSelectTourSpot,
  onOpenQuickReport,
  onFindMyLocation,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Kakao Map & Overlays Ref
  const kakaoMapRef = useRef<any>(null);
  const kakaoPolylineRef = useRef<any>(null);
  const kakaoPassedPolylineRef = useRef<any>(null);
  const kakaoStartOverlayRef = useRef<any>(null);
  const kakaoEndOverlayRef = useRef<any>(null);
  const kakaoRiderOverlayRef = useRef<any>(null);
  const kakaoPoiOverlaysRef = useRef<any[]>([]);
  const kakaoPoiInfoWindowsRef = useRef<any[]>([]);
  const kakaoPoiMarkersRef = useRef<any[]>([]);
  const kakaoPoiClustererRef = useRef<any>(null);
  const kakaoReportMarkersRef = useRef<any[]>([]);
  const kakaoReportOverlaysRef = useRef<any[]>([]);
  const kakaoTourMarkersRef = useRef<any[]>([]);
  const kakaoTourOverlaysRef = useRef<any[]>([]);
  const kakaoBikePolylinesRef = useRef<any[]>([]);
  const kakaoRampOverlaysRef = useRef<any[]>([]);

  // Leaflet Fallback Ref
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletPolylineRef = useRef<L.Polyline | null>(null);
  const leafletPassedPolylineRef = useRef<L.Polyline | null>(null);
  const leafletStartMarkerRef = useRef<L.Marker | null>(null);
  const leafletEndMarkerRef = useRef<L.Marker | null>(null);
  const leafletRiderMarkerRef = useRef<L.Marker | null>(null);
  const leafletPoiGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletReportGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletTourGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletBikeLinesGroupRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Engine state: 'kakao' | 'leaflet'
  const [engine, setEngine] = useState<'kakao' | 'leaflet' | null>(null);
  // Default to false (자전거 도로망 기본 비활성화)
  const [isBicycleOverlayOn, setIsBicycleOverlayOn] = useState<boolean>(false);

  // 사용자 수동 지도 조작(드래그) 상태 관리
  // 주행 중 사용자가 지도를 직접 드래그하여 주변을 살펴볼 때만 일시적으로 2D 자유 탐색 모드로 전환
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const isPointerDownRef = useRef(false);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // 주행 모드 전환 시 사용자 조작 상태 초기화 (1인칭 헤딩 추종 모드 즉시 활성화)
  useEffect(() => {
    if (isRiding) {
      setIsUserInteracting(false);
    }
  }, [isRiding]);

  // 1. Initialize Map: Try Kakao first, fallback seamlessly to Leaflet
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!containerRef.current) return;

      try {
        const kakaoMaps = await loadKakaoMapsServices();
        if (isCancelled || !containerRef.current) return;

        if (kakaoMaps && (window as any).kakao?.maps) {
          const kakao = (window as any).kakao;

          containerRef.current.innerHTML = '';

          const options = {
            center: new kakao.maps.LatLng(center.lat, center.lng),
            level: isRiding ? 3 : 5,
          };

          const map = new kakao.maps.Map(containerRef.current, options);
          kakaoMapRef.current = map;

          kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
            const latlng = mouseEvent.latLng;
            if (onMapClickRef.current) {
              onMapClickRef.current(latlng.getLat(), latlng.getLng());
            }
          });

          setEngine('kakao');
          return;
        }
      } catch (err) {
        console.warn('Kakao map initialization skipped/failed, using high-performance Leaflet engine:', err);
      }

      // Fallback: Leaflet
      if (!isCancelled && containerRef.current && !leafletMapRef.current) {
        containerRef.current.innerHTML = '';
        const map = L.map(containerRef.current, {
          center: [center.lat, center.lng],
          zoom: isRiding ? 17 : 14,
          zoomControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }).addTo(map);

        leafletPoiGroupRef.current = L.layerGroup().addTo(map);
        leafletReportGroupRef.current = L.layerGroup().addTo(map);
        leafletTourGroupRef.current = L.layerGroup().addTo(map);
        leafletBikeLinesGroupRef.current = L.layerGroup().addTo(map);
        leafletMapRef.current = map;

        map.on('click', (e) => {
          if (onMapClickRef.current) onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        });

        setEngine('leaflet');
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Keep the actual Kakao & Leaflet bike overlays synchronized with state.
  useEffect(() => {
    // 1. Kakao Engine
    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      const map = kakaoMapRef.current;

      // Clear existing overlays
      kakaoBikePolylinesRef.current.forEach((p) => p.setMap(null));
      kakaoBikePolylinesRef.current = [];
      kakaoRampOverlaysRef.current.forEach((o) => o.setMap(null));
      kakaoRampOverlaysRef.current = [];

      if (isBicycleOverlayOn) {
        map.addOverlayMapTypeId(kakao.maps.MapTypeId.BICYCLE);

        // Render high-precision official bike stream lines
        OFFICIAL_STREAM_LINES.forEach((stream) => {
          const path = stream.path.map(([lat, lng]) => new kakao.maps.LatLng(lat, lng));

          // 1) Outline / Glow line
          const underlay = new kakao.maps.Polyline({
            path,
            strokeWeight: 9,
            strokeColor: '#FFFFFF',
            strokeOpacity: 0.9,
            strokeStyle: 'solid',
            lineCap: 'round',
            lineJoin: 'round',
          });
          underlay.setMap(map);
          kakaoBikePolylinesRef.current.push(underlay);

          // 2) Core Color line
          const poly = new kakao.maps.Polyline({
            path,
            strokeWeight: 5,
            strokeColor: stream.color || '#0055FF',
            strokeOpacity: 0.95,
            strokeStyle: stream.id.includes('urban') ? 'dashed' : 'solid',
            lineCap: 'round',
            lineJoin: 'round',
          });
          poly.setMap(map);
          kakaoBikePolylinesRef.current.push(poly);
        });

        // Render official ramp access points
        OFFICIAL_RAMP_POINTS.forEach((ramp) => {
          const content = document.createElement('div');
          content.style.cssText =
            'background:#0284c7;color:#ffffff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:12px;border:1.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:3px;transform:translate(-50%,-50%);';
          content.innerHTML = `<span>🚲</span><span>${ramp.name}</span>`;
          content.onclick = () => {
            if (onSelectRampPoint) onSelectRampPoint(ramp);
          };

          const overlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(ramp.lat, ramp.lng),
            content,
            yAnchor: 0.5,
            xAnchor: 0.5,
          });
          overlay.setMap(map);
          kakaoRampOverlaysRef.current.push(overlay);
        });
      } else {
        map.removeOverlayMapTypeId(kakao.maps.MapTypeId.BICYCLE);
      }
    }

    // 2. Leaflet Engine
    if (engine === 'leaflet' && leafletBikeLinesGroupRef.current) {
      const group = leafletBikeLinesGroupRef.current;
      group.clearLayers();

      if (isBicycleOverlayOn) {
        // Render stream lines with outline & tooltip
        OFFICIAL_STREAM_LINES.forEach((stream) => {
          // Underlay outline
          const underlay = L.polyline(stream.path, {
            color: '#FFFFFF',
            weight: 8,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          });
          group.addLayer(underlay);

          // Main theme line
          const poly = L.polyline(stream.path, {
            color: stream.color || '#0055FF',
            weight: 5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: stream.id.includes('urban') ? '6, 6' : undefined,
          });

          poly.bindTooltip(
            `<div style="font-size:11px;font-weight:800;color:#0f172a;padding:3px 6px;border-radius:6px;background:white;border:1px solid #cbd5e1;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
              <div style="color:${stream.color};font-size:10px;font-weight:bold;">안양시 자전거 전용도로망</div>
              <div>🚲 ${stream.name}</div>
              <div style="font-size:10px;color:#64748b;font-weight:normal;">${stream.type} (${stream.totalDistanceKm}km)</div>
            </div>`,
            { sticky: true }
          );

          group.addLayer(poly);
        });

        // Render ramp points
        OFFICIAL_RAMP_POINTS.forEach((ramp) => {
          const rampIcon = L.divIcon({
            className: 'custom-ramp-marker',
            html: `<div style="display:inline-flex;align-items:center;gap:3px;background:#0284c7;color:#ffffff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:12px;border:1.5px solid #ffffff;box-shadow:0 2px 6px rgba(2,132,199,0.35);white-space:nowrap;transform:translate(-50%, -50%);cursor:pointer;">
                     <span style="font-size:11px;">🚲</span><span>${ramp.name}</span>
                   </div>`,
            iconSize: [0, 0],
          });

          const marker = L.marker([ramp.lat, ramp.lng], { icon: rampIcon });
          marker.bindTooltip(
            `<div style="font-size:11px;padding:3px 6px;">
               <span style="color:#0284c7;font-weight:bold;">${ramp.type}</span><br/>
               <b>${ramp.name}</b><br/>
               <span style="color:#64748b;">${ramp.connectedRoad}</span>
             </div>`
          );

          if (onSelectRampPoint) {
            marker.on('click', () => onSelectRampPoint(ramp));
          }

          group.addLayer(marker);
        });
      }
    }
  }, [engine, isBicycleOverlayOn, onSelectRampPoint]);

  // 2. DOM 레벨의 정확한 사용자 드래그 제스처 감지 (프로그래밍적 panTo와 구분)
  const handlePointerDown = (e: PointerEvent) => {
    isPointerDownRef.current = true;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isPointerDownRef.current || !pointerStartPosRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
    
    // 10px 이상 의도적인 드래그 시 자유 탐색 모드 전환
    if (dx > 10 || dy > 10) {
      if (isRiding && !isUserInteracting) {
        setIsUserInteracting(true);
      }
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    pointerStartPosRef.current = null;
  };

  // 3. Toggle Bicycle Layer
  const toggleBicycleLayer = useCallback(() => {
    setIsBicycleOverlayOn((isOn) => !isOn);
  }, []);

  // 4. Render Route Polylines (지나온 길 회색, 앞으로 갈 길 진한 파란색)
  useEffect(() => {
    const activeRemaining = remainingPath && remainingPath.length > 0 ? remainingPath : routePath;
    const activePassed = isRiding && passedPath && passedPath.length > 1 ? passedPath : null;

    // A. Kakao Engine
    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      const map = kakaoMapRef.current;

      if (kakaoPolylineRef.current) {
        kakaoPolylineRef.current.setMap(null);
        kakaoPolylineRef.current = null;
      }
      if (kakaoPassedPolylineRef.current) {
        kakaoPassedPolylineRef.current.setMap(null);
        kakaoPassedPolylineRef.current = null;
      }
      if (kakaoStartOverlayRef.current) {
        kakaoStartOverlayRef.current.setMap(null);
        kakaoStartOverlayRef.current = null;
      }
      if (kakaoEndOverlayRef.current) {
        kakaoEndOverlayRef.current.setMap(null);
        kakaoEndOverlayRef.current = null;
      }

      if (!activeRemaining || activeRemaining.length === 0) {
        return;
      }

      // 1) 지나온 경로 (Passed Path - Muted Gray)
      if (activePassed && activePassed.length > 1) {
        const passedLines = activePassed.map(([lat, lng]) => new kakao.maps.LatLng(lat, lng));
        const passedPolyline = new kakao.maps.Polyline({
          path: passedLines,
          strokeWeight: 6,
          strokeColor: '#94A3B8',
          strokeOpacity: 0.65,
          strokeStyle: 'solid',
        });
        passedPolyline.setMap(map);
        kakaoPassedPolylineRef.current = passedPolyline;
      }

      // 2) 앞으로 가야 할 남은 경로 (Remaining Path - High Visibility Blue)
      const remainingLines = activeRemaining.map(([lat, lng]) => new kakao.maps.LatLng(lat, lng));
      const remainingPolyline = new kakao.maps.Polyline({
        path: remainingLines,
        strokeWeight: 6,
        strokeColor: '#2563EB',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
      });
      remainingPolyline.setMap(map);
      kakaoPolylineRef.current = remainingPolyline;

      // Start Badge Overlay (only when not riding)
      if (!isRiding && routePath && routePath.length > 0) {
        const startPt = routePath[0];
        const startDiv = document.createElement('div');
        startDiv.className = 'navi-counter-rotate';
        startDiv.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:center; width:28px; height:28px; background:#0055FF; color:#fff; border-radius:50%; box-shadow:0 3px 10px rgba(0,85,255,0.4); border:2.5px solid #fff; font-weight:800; font-size:11px;">
            출
          </div>
        `;
        const startOverlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(startPt[0], startPt[1]),
          content: startDiv,
          yAnchor: 0.5,
          zIndex: 35,
        });
        startOverlay.setMap(map);
        kakaoStartOverlayRef.current = startOverlay;
      }

      // Destination Badge Overlay
      const fullPath = routePath || activeRemaining;
      if (fullPath && fullPath.length > 0) {
        const endPt = fullPath[fullPath.length - 1];
        const endDiv = document.createElement('div');
        endDiv.className = 'navi-counter-rotate';
        endDiv.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:center; width:28px; height:28px; background:#E11D48; color:#fff; border-radius:50%; box-shadow:0 3px 10px rgba(225,29,72,0.4); border:2.5px solid #fff; font-weight:800; font-size:11px;">
            도
          </div>
        `;
        const endOverlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(endPt[0], endPt[1]),
          content: endDiv,
          yAnchor: 0.5,
          zIndex: 35,
        });
        endOverlay.setMap(map);
        kakaoEndOverlayRef.current = endOverlay;
      }

      // Adjust viewport smoothly when not actively riding
      if (!isRiding && routePath && routePath.length > 0) {
        const bounds = new kakao.maps.LatLngBounds();
        routePath.forEach(([lat, lng]) => bounds.extend(new kakao.maps.LatLng(lat, lng)));
        map.setBounds(bounds, 60, 60, 60, 240);
      }
    }
    // B. Leaflet Engine Fallback
    else if (engine === 'leaflet' && leafletMapRef.current) {
      const map = leafletMapRef.current;

      if (leafletPolylineRef.current) {
        leafletPolylineRef.current.remove();
        leafletPolylineRef.current = null;
      }
      if (leafletPassedPolylineRef.current) {
        leafletPassedPolylineRef.current.remove();
        leafletPassedPolylineRef.current = null;
      }
      if (leafletStartMarkerRef.current) {
        leafletStartMarkerRef.current.remove();
        leafletStartMarkerRef.current = null;
      }
      if (leafletEndMarkerRef.current) {
        leafletEndMarkerRef.current.remove();
        leafletEndMarkerRef.current = null;
      }

      if (!activeRemaining || activeRemaining.length === 0) return;

      if (activePassed && activePassed.length > 1) {
        const passedPolyline = L.polyline(activePassed, {
          color: '#94A3B8',
          weight: 6,
          opacity: 0.65,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
        leafletPassedPolylineRef.current = passedPolyline;
      }

      const polyline = L.polyline(activeRemaining, {
        color: '#0055FF',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      leafletPolylineRef.current = polyline;

      if (!isRiding && routePath && routePath.length > 0) {
        const startPt = routePath[0];
        const startHtml = `<div class="navi-counter-rotate flex items-center justify-center w-7 h-7 bg-[#0055FF] text-white rounded-full shadow-lg border-2 border-white font-bold text-xs">출</div>`;
        const startIcon = L.divIcon({ className: 'custom-bike-marker', html: startHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
        leafletStartMarkerRef.current = L.marker(startPt, { icon: startIcon, zIndexOffset: 35 }).addTo(map);
      }

      const fullPath = routePath || activeRemaining;
      if (fullPath && fullPath.length > 0) {
        const endPt = fullPath[fullPath.length - 1];
        const endHtml = `<div class="navi-counter-rotate flex items-center justify-center w-7 h-7 bg-[#E11D48] text-white rounded-full shadow-lg border-2 border-white font-bold text-xs">도</div>`;
        const endIcon = L.divIcon({ className: 'custom-bike-marker', html: endHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
        leafletEndMarkerRef.current = L.marker(endPt, { icon: endIcon, zIndexOffset: 35 }).addTo(map);
      }

      if (!isRiding && routePath && routePath.length > 0) {
        const bounds = L.latLngBounds(routePath);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    }
  }, [engine, routePath, passedPath, remainingPath, isRiding]);

  // 5. Clean POI Markers with Counter-Rotation
  useEffect(() => {
    const hasActiveFilters = activePoiFilters.length > 0;
    const shouldShow = showAllFacilities || hasActiveFilters || alwaysVisibleCategories.length > 0 || !!highlightFacilityId;

    const filtered = shouldShow
      ? facilities.filter((fac) => {
          if (highlightFacilityId === fac.id) return true;
          if (showAllFacilities) return true;
          if (alwaysVisibleCategories.includes(fac.category)) return true;
          return activePoiFilters.includes(fac.category);
        })
      : [];

    // Kakao POI Markers
    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      const map = kakaoMapRef.current;

      kakaoPoiOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      kakaoPoiOverlaysRef.current = [];
      kakaoPoiInfoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
      kakaoPoiInfoWindowsRef.current = [];
      kakaoPoiClustererRef.current?.clear();
      kakaoPoiClustererRef.current = null;
      kakaoPoiMarkersRef.current.forEach((marker) => marker.setMap(null));
      kakaoPoiMarkersRef.current = [];

      const markers: any[] = [];
      filtered.forEach((fac) => {
        const isHighlighted = highlightFacilityId === fac.id;
        const iconInfo = POI_ICONS[fac.category] || { emoji: '📍', color: '#2563EB', label: '시설' };
        const markerPosition = getVisualMarkerPosition(fac, filtered);
        const iconSize = isHighlighted ? 36 : 30;
        const iconSvg = encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="white" stroke="${iconInfo.color}" stroke-width="8"/>
            <text x="50" y="57" text-anchor="middle" dominant-baseline="middle" font-size="48">${iconInfo.emoji}</text>
          </svg>
        `);
        const markerImage = new kakao.maps.MarkerImage(
          `data:image/svg+xml;charset=UTF-8,${iconSvg}`,
          new kakao.maps.Size(iconSize, iconSize),
          { offset: new kakao.maps.Point(iconSize / 2, iconSize / 2) },
        );

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(markerPosition.lat, markerPosition.lng),
          image: markerImage,
          title: fac.name,
          zIndex: isHighlighted ? 40 : 20,
        });
        kakao.maps.event.addListener(marker, 'click', () => {
          const original = fac.original || fac.name;
          const detail = fac.detail ? `<div style="margin-top:4px;color:#475569;">상세 안내: ${fac.detail}</div>` : '';
          const infoWindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:10px 12px;font-size:12px;line-height:1.5;max-width:240px;"><strong>${original}</strong>${detail}</div>`,
            removable: true,
          });
          infoWindow.open(map, marker);
          kakaoPoiInfoWindowsRef.current.push(infoWindow);
          onSelectFacility?.(fac);
        });
        markers.push(marker);

        if (isHighlighted) {
          const label = document.createElement('div');
          label.className = 'navi-counter-rotate';
          label.style.cssText = 'background:rgba(15,23,42,0.9);color:#fff;border-radius:8px;padding:2px 6px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);';
          label.textContent = fac.name;
          const overlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(markerPosition.lat, markerPosition.lng),
            content: label,
            yAnchor: 1.8,
            zIndex: 41,
          });
          overlay.setMap(map);
          kakaoPoiOverlaysRef.current.push(overlay);
        }
      });

      kakaoPoiMarkersRef.current = markers;
      if (markers.length > 0 && kakao.maps.MarkerClusterer) {
        // Kakao's clusterer keeps dense facility areas readable while preserving custom icons.
        kakaoPoiClustererRef.current = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          // Keep individual restroom/bike icons visible at the default level 5.
          // Cluster only after the user zooms farther out.
          minLevel: 8,
          disableClickZoom: false,
        });
        kakaoPoiClustererRef.current.addMarkers(markers);
      } else {
        markers.forEach((marker) => marker.setMap(map));
      }
    }
    // Leaflet POI Markers
    else if (engine === 'leaflet' && leafletPoiGroupRef.current) {
      const layerGroup = leafletPoiGroupRef.current;
      layerGroup.clearLayers();

      filtered.forEach((fac) => {
        const isHighlighted = highlightFacilityId === fac.id;
        const iconInfo = POI_ICONS[fac.category] || { emoji: '📍', color: '#2563EB', label: '시설' };
        const markerPosition = getVisualMarkerPosition(fac, filtered);

        const poiHtml = `
          <div class="navi-counter-rotate" style="cursor:pointer; display:flex; flex-direction:column; align-items:center;" title="${fac.name}">
            <div style="width:${isHighlighted ? '32px' : '26px'}; height:${isHighlighted ? '32px' : '26px'}; border-radius:50%; background:#FFFFFF; border:2px solid ${iconInfo.color}; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.18); font-size:${isHighlighted ? '14px' : '12px'};">
              ${iconInfo.emoji}
            </div>
            ${
              isHighlighted
                ? `<div style="margin-top:2px; background:rgba(15,23,42,0.9); color:#FFFFFF; border-radius:8px; padding:2px 6px; font-size:10px; font-weight:700; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
                    ${fac.name}
                  </div>`
                : ''
            }
          </div>
        `;

        const icon = L.divIcon({ className: 'custom-bike-marker', html: poiHtml, iconSize: [80, 40], iconAnchor: [40, 13] });
        const marker = L.marker([markerPosition.lat, markerPosition.lng], { icon, zIndexOffset: isHighlighted ? 40 : 20 });
        marker.bindTooltip(
          `<strong>${fac.original || fac.name}</strong>${fac.detail ? `<br><span>상세 안내: ${fac.detail}</span>` : ''}`,
          { direction: 'top', offset: [0, -12] },
        );
        marker.on('click', () => {
          if (onSelectFacility) onSelectFacility(fac);
        });
        layerGroup.addLayer(marker);
      });
    }
  }, [engine, facilities, activePoiFilters, alwaysVisibleCategories, showAllFacilities, highlightFacilityId, onSelectFacility]);

  // Active community reports are visible even when facility filters are off.
  useEffect(() => {
    const activeReports = reports.filter((report) => report.status === 'active' && report.coordinates);

    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      kakaoReportMarkersRef.current.forEach((marker) => marker.setMap(null));
      kakaoReportOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      kakaoReportOverlaysRef.current = [];
      kakaoReportMarkersRef.current = activeReports.map((report) => {
        const position = new kakao.maps.LatLng(report.coordinates!.lat, report.coordinates!.lng);
        const marker = new kakao.maps.Marker({ position, title: report.categoryName, zIndex: 45 });
        kakao.maps.event.addListener(marker, 'click', () => onSelectReport?.(report));
        marker.setMap(kakaoMapRef.current);

        const content = document.createElement('button');
        content.type = 'button';
        content.title = `${report.categoryName}: ${report.location}`;
        content.setAttribute('aria-label', `${report.categoryName} 제보: ${report.location}`);
        content.style.cssText = 'width:32px;height:32px;border-radius:50%;border:3px solid #fff;background:#dc2626;color:#fff;font-size:18px;font-weight:900;line-height:26px;box-shadow:0 3px 10px rgba(127,29,29,.45);cursor:pointer;';
        content.textContent = '!';
        content.onclick = () => onSelectReport?.(report);
        const overlay = new kakao.maps.CustomOverlay({ position, content, yAnchor: 0.5, zIndex: 46 });
        overlay.setMap(kakaoMapRef.current);
        kakaoReportOverlaysRef.current.push(overlay);
        return marker;
      });
    } else if (engine === 'leaflet' && leafletReportGroupRef.current) {
      leafletReportGroupRef.current.clearLayers();
      activeReports.forEach((report) => {
        const icon = L.divIcon({
          className: 'custom-bike-marker',
          html: '<div style="width:30px;height:30px;border-radius:50%;background:#dc2626;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:15px">!</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        const marker = L.marker([report.coordinates!.lat, report.coordinates!.lng], { icon, zIndexOffset: 100 });
        marker.bindTooltip(`${report.categoryName}: ${report.location}`);
        marker.on('click', () => onSelectReport?.(report));
        leafletReportGroupRef.current!.addLayer(marker);
      });
    }
  }, [engine, reports, onSelectReport]);

  // Tour Spots (안양 9경 및 동별 명소) Markers - Sleek Modern Vector Pin Icon
  useEffect(() => {
    if (!tourSpots || tourSpots.length === 0) {
      if (engine === 'kakao' && kakaoMapRef.current) {
        kakaoTourMarkersRef.current.forEach((m) => m.setMap(null));
        kakaoTourMarkersRef.current = [];
        kakaoTourOverlaysRef.current.forEach((o) => o.setMap(null));
        kakaoTourOverlaysRef.current = [];
      } else if (engine === 'leaflet' && leafletTourGroupRef.current) {
        leafletTourGroupRef.current.clearLayers();
      }
      return;
    }

    const renderSpotBadgeHtml = (spot: AnyangTourSpot, isSelected: boolean) => {
      const is9Gyeong = !!spot.nineGyeongNumber;
      const num = spot.nineGyeongNumber;

      if (is9Gyeong) {
        if (isSelected) {
          return `
            <div class="navi-counter-rotate" style="display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0 4px 10px rgba(217,119,6,0.45)); transform:scale(1.1); transition:transform 0.15s ease;">
              <div style="display:inline-flex; align-items:center; gap:4px; background:#D97706; color:#FFFFFF; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:800; border:1.5px solid #FFFFFF; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
                <span style="background:#FFFFFF; color:#D97706; font-size:9.5px; font-weight:900; padding:1px 4px; border-radius:6px; line-height:1;">${num}경</span>
                <span>${spot.name}</span>
              </div>
              <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid #D97706; margin-top:-0.5px;"></div>
            </div>
          `;
        }
        return `
          <div class="navi-counter-rotate" style="display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.18)); transition:transform 0.15s ease;">
            <div style="display:inline-flex; align-items:center; gap:4px; background:#FFFFFF; color:#0F172A; padding:2px 7px; border-radius:12px; font-size:11px; font-weight:700; border:1.5px solid #D97706; white-space:nowrap;">
              <span style="background:#D97706; color:#FFFFFF; font-size:9.5px; font-weight:900; padding:1px 4px; border-radius:5px; line-height:1;">${num}경</span>
              <span>${spot.name}</span>
            </div>
            <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:4px solid #D97706; margin-top:-0.5px;"></div>
          </div>
        `;
      }

      // Other local spots
      if (isSelected) {
        return `
          <div class="navi-counter-rotate" style="display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0 4px 10px rgba(0,85,255,0.4)); transform:scale(1.1); transition:transform 0.15s ease;">
            <div style="display:inline-flex; align-items:center; gap:4px; background:#0055FF; color:#FFFFFF; padding:3px 8px; border-radius:12px; font-size:10.5px; font-weight:800; border:1.5px solid #FFFFFF; white-space:nowrap;">
              <span style="width:6px; height:6px; border-radius:50%; background:#FFFFFF;"></span>
              <span>${spot.name}</span>
            </div>
            <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid #0055FF; margin-top:-0.5px;"></div>
          </div>
        `;
      }

      return `
        <div class="navi-counter-rotate" style="display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15)); transition:transform 0.15s ease;">
          <div style="display:inline-flex; align-items:center; gap:4px; background:#FFFFFF; color:#1E293B; padding:2px 7px; border-radius:11px; font-size:10.5px; font-weight:700; border:1.5px solid #0055FF; white-space:nowrap;">
            <span style="width:5px; height:5px; border-radius:50%; background:#0055FF;"></span>
            <span>${spot.name}</span>
          </div>
          <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:4px solid #0055FF; margin-top:-0.5px;"></div>
        </div>
      `;
    };

    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      const map = kakaoMapRef.current;

      kakaoTourMarkersRef.current.forEach((m) => m.setMap(null));
      kakaoTourMarkersRef.current = [];
      kakaoTourOverlaysRef.current.forEach((o) => o.setMap(null));
      kakaoTourOverlaysRef.current = [];

      tourSpots.forEach((spot) => {
        const isSelected = highlightTourSpotId === spot.id;
        const position = new kakao.maps.LatLng(spot.lat, spot.lng);

        const el = document.createElement('div');
        el.className = 'navi-counter-rotate';
        el.style.cssText = `cursor:pointer; display:flex; flex-direction:column; align-items:center; z-index:${isSelected ? 75 : 35};`;

        el.innerHTML = renderSpotBadgeHtml(spot, isSelected);
        el.onclick = () => onSelectTourSpot?.(spot);

        const overlay = new kakao.maps.CustomOverlay({
          position,
          content: el,
          yAnchor: 1.0,
          zIndex: isSelected ? 75 : 35,
        });
        overlay.setMap(map);
        kakaoTourOverlaysRef.current.push(overlay);
      });
    } else if (engine === 'leaflet' && leafletTourGroupRef.current) {
      leafletTourGroupRef.current.clearLayers();

      tourSpots.forEach((spot) => {
        const isSelected = highlightTourSpotId === spot.id;
        const html = renderSpotBadgeHtml(spot, isSelected);

        const icon = L.divIcon({
          className: 'custom-tour-marker',
          html,
          iconSize: [120, 28],
          iconAnchor: [60, 28],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon, zIndexOffset: isSelected ? 75 : 35 });
        marker.on('click', () => onSelectTourSpot?.(spot));
        leafletTourGroupRef.current!.addLayer(marker);
      });
    }
  }, [engine, tourSpots, highlightTourSpotId, onSelectTourSpot]);

  // 6. Navigation 3D Direction Arrow Marker (진행 방향 3D 화살표 마커)
  const createNaviArrowHtml = (deg: number) => {
    return `
      <div style="position:relative; display:flex; align-items:center; justify-content:center; width:52px; height:52px; pointer-events:none;">
        <!-- 1. Radar Pulse Field -->
        <div style="position:absolute; width:48px; height:48px; border-radius:50%; background:rgba(0,102,255,0.18); animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        
        <!-- 2. Concentric Soft Beacon -->
        <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:radial-gradient(circle, rgba(0,198,255,0.4) 0%, rgba(0,85,255,0.05) 75%, transparent 100%);"></div>

        <!-- 3. Forward Headlight / View Cone -->
        <div style="position:absolute; width:52px; height:52px; display:flex; justify-content:center; transform:rotate(${deg}deg); transition:transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);">
          <div style="position:absolute; top:2px; width:0; height:0; border-left:14px solid transparent; border-right:14px solid transparent; border-bottom:28px solid rgba(0,198,255,0.28); filter:blur(1px);"></div>
        </div>

        <!-- 4. 3D Supersonic Navigation Arrow Body -->
        <div id="navi-rider-3d-arrow" style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center; transform:rotate(${deg}deg); transition:transform 0.35s cubic-bezier(0.25, 1, 0.5, 1); filter:drop-shadow(0 4px 10px rgba(0,50,220,0.55));">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 2 L31 29 L17 22 L3 29 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
            <path d="M17 5.5 L28 26.5 L17 21 L6 26.5 Z" fill="url(#navi-arrow-grad-dynamic)" />
            <path d="M17 5.5 L17 21" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.9" />
            <path d="M17 5.5 L6 26.5 L17 21 Z" fill="black" opacity="0.12" />
            <defs>
              <linearGradient id="navi-arrow-grad-dynamic" x1="17" y1="5.5" x2="17" y2="26.5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#00E5FF" />
                <stop offset="50%" stop-color="#0088FF" />
                <stop offset="100%" stop-color="#0044EE" />
              </linearGradient>
            </defs>
          </svg>
          <div style="position:absolute; width:6px; height:6px; border-radius:50%; background:#FFFFFF; box-shadow:0 0 4px #00E5FF;"></div>
        </div>
      </div>
    `;
  };

  // 7. Rider GPS Position & Real-time Auto Centering (1인칭 내비게이션 시점 및 화살표 마커)
  useEffect(() => {
    if (!riderPosition) return;

    // A. Kakao Engine
    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      const map = kakaoMapRef.current;
      const pos = new kakao.maps.LatLng(riderPosition.lat, riderPosition.lng);

      if (kakaoRiderOverlayRef.current) {
        kakaoRiderOverlayRef.current.setPosition(pos);
        
        const arrowEl = document.getElementById('navi-rider-3d-arrow');
        if (arrowEl) {
          arrowEl.style.transform = `rotate(${heading}deg)`;
        }
      } else {
        const content = document.createElement('div');
        content.innerHTML = createNaviArrowHtml(heading);

        const overlay = new kakao.maps.CustomOverlay({
          position: pos,
          content,
          yAnchor: 0.5,
          xAnchor: 0.5,
          zIndex: 60,
        });
        overlay.setMap(map);
        kakaoRiderOverlayRef.current = overlay;
      }

      // 1인칭 모드이며 사용자가 수동 드래그 중이 아닐 때 실시간 중심 이동
      if (isRiding && isHeadingLocked && !isUserInteracting) {
        map.panTo(pos);
        if (map.getLevel() > 3) {
          map.setLevel(3);
        }
      }
    } 
    // B. Leaflet Fallback Engine
    else if (engine === 'leaflet' && leafletMapRef.current) {
      const map = leafletMapRef.current;
      const riderHtml = createNaviArrowHtml(heading);

      if (leafletRiderMarkerRef.current) {
        leafletRiderMarkerRef.current.setLatLng([riderPosition.lat, riderPosition.lng]);
        const icon = L.divIcon({ className: 'custom-bike-marker', html: riderHtml, iconSize: [52, 52], iconAnchor: [26, 26] });
        leafletRiderMarkerRef.current.setIcon(icon);
      } else {
        const icon = L.divIcon({ className: 'custom-bike-marker', html: riderHtml, iconSize: [52, 52], iconAnchor: [26, 26] });
        leafletRiderMarkerRef.current = L.marker([riderPosition.lat, riderPosition.lng], { icon, zIndexOffset: 1000 }).addTo(map);
      }

      if (isRiding && isHeadingLocked && !isUserInteracting) {
        map.panTo([riderPosition.lat, riderPosition.lng], { animate: true, duration: 0.4 });
      }
    }
  }, [engine, riderPosition, heading, isRiding, isHeadingLocked, isUserInteracting]);

  // 8. Counter-rotate POI and Badge Markers on map rotation (글자/아이콘 바로 세우기)
  useEffect(() => {
    const isRotating = isRiding && isHeadingLocked && !isUserInteracting;
    const counterDeg = isRotating ? heading : 0;
    const elements = document.querySelectorAll('.navi-counter-rotate');
    elements.forEach((el) => {
      (el as HTMLElement).style.transform = `rotate(${counterDeg}deg)`;
      (el as HTMLElement).style.transition = 'transform 0.35s ease-out';
    });
  }, [heading, isRiding, isHeadingLocked, isUserInteracting]);

  // 9. Pan to center when idle
  useEffect(() => {
    if (isRiding) return;
    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      kakaoMapRef.current.panTo(new kakao.maps.LatLng(center.lat, center.lng));
    } else if (engine === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.setView([center.lat, center.lng], 15, { animate: true });
    }
  }, [center.lat, center.lng, engine, isRiding]);

  // Pan to Highlighted facility
  useEffect(() => {
    if (!highlightFacilityId) return;
    const fac = facilities.find((f) => f.id === highlightFacilityId);
    if (!fac) return;

    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      kakaoMapRef.current.panTo(new kakao.maps.LatLng(fac.lat, fac.lng));
      kakaoMapRef.current.setLevel(3);
    } else if (engine === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.setView([fac.lat, fac.lng], 16, { animate: true });
    }
  }, [highlightFacilityId, facilities, engine]);

  const handleZoomIn = () => {
    setIsUserInteracting(true);
    if (engine === 'kakao' && kakaoMapRef.current) {
      kakaoMapRef.current.setLevel(kakaoMapRef.current.getLevel() - 1);
    } else if (engine === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    setIsUserInteracting(true);
    if (engine === 'kakao' && kakaoMapRef.current) {
      kakaoMapRef.current.setLevel(kakaoMapRef.current.getLevel() + 1);
    } else if (engine === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    }
  };

  // 내 위치로 재탐색 및 1인칭 헤딩 추종 모드 복귀
  const handleResumeTracking = () => {
    setIsUserInteracting(false);
    const target = riderPosition || center;
    if (engine === 'kakao' && kakaoMapRef.current) {
      const kakao = (window as any).kakao;
      kakaoMapRef.current.panTo(new kakao.maps.LatLng(target.lat, target.lng));
      kakaoMapRef.current.setLevel(isRiding ? 3 : 4);
    } else if (engine === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.setView([target.lat, target.lng], isRiding ? 17 : 15, { animate: true });
    }
  };

  const handleToggleHeading = () => {
    setIsUserInteracting(false);
    if (onToggleHeadingLock) {
      onToggleHeadingLock();
    }
  };

  // ── 1인칭 헤딩 추종 회전 및 위치 오프셋 계산 ──
  // 1) 1인칭 진행 방향 회전 모드(is1stPersonActive):
  //    - rotate(-heading deg): 진행 방향이 항상 화면 12시 방향(상단)을 향함
  //    - translateY(8%): 내 위치 마커를 하단 정보창 바로 위(화면 62% 지점)에 안정적으로 배치하여 전방 도로를 65~70% 이상 시원하게 확보
  //    - translateY(-14%): 하단 시트 확장 시 마커를 상단 1/3 가시 영역으로 들어 올려 가림 방지
  //    - scale(1.45): 지도 회전 시 사각 모서리에 빈 여백이 생기지 않도록 뷰포트 확대
  // 2) 사용자 수동 드래그 탐색 중(isUserInteracting) 또는 2D 북쪽 고정 모드:
  //    - translateY(0%) rotate(0deg) scale(1)로 평면 정방향 2D 상태 유지하여 드래그 축 반전 없는 1:1 자유 탐색 가능
  const is1stPersonActive = isRiding && isHeadingLocked && !isUserInteracting;
  const mapTransformStyle = is1stPersonActive
    ? `translateY(${isSheetExpanded ? '-14%' : '8%'}) rotate(-${heading}deg) scale(1.45)`
    : 'translateY(0%) rotate(0deg) scale(1)';

  return (
    <div
      ref={mapWrapperRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative h-full w-full bg-slate-100 overflow-hidden isolate z-0 touch-none select-none"
    >
      {/* ── 1. Rotatable & Scaled Map Viewport Layer ── */}
      <div
        className="absolute inset-[-30%] w-[160%] h-[160%] origin-center pointer-events-auto"
        style={{
          transform: mapTransformStyle,
          transformOrigin: '50% 50%',
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* ── 2. 지도 드래그 탐색 중일 때 나타나는 '내 위치로 복귀' 플로팅 버튼 ── */}
      {isRiding && isUserInteracting && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <button
            type="button"
            onClick={handleResumeTracking}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0055FF] text-white font-bold text-xs shadow-2xl shadow-blue-500/50 border border-blue-400/40 active:scale-95 transition-all hover:bg-blue-600"
          >
            <Crosshair size={16} className="animate-spin-slow" />
            <span>내 위치로 복귀 (1인칭 시점)</span>
          </button>
        </div>
      )}

      {/* ── 2-1. 자전거 도로망 레이어 활성화 시 노선 범례 바 ── */}
      {isBicycleOverlayOn && !isRiding && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-[calc(100%-4rem)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-3 rounded-2xl bg-white/95 border border-slate-200/80 shadow-lg backdrop-blur-md text-[11px] font-bold text-slate-700">
            <span className="shrink-0 text-slate-400 font-semibold mr-0.5">도로망</span>
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#0055FF] border border-blue-200/80">
              <span className="w-2 h-2 rounded-full bg-[#0055FF]" /> 안양천
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#10B981] border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> 학의천
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-200/80">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> 삼성천
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-[#8B5CF6] border border-purple-200/80">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> 삼막천
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 text-[#EC4899] border border-pink-200/80">
              <span className="w-2 h-2 rounded-full bg-[#EC4899]" /> 평촌선
            </span>
          </div>
        </div>
      )}

      {/* ── 3. Clean Right-side Floating Map Controls (필수 아이콘만 정갈하게 배치) ── */}
      <div
        className={`absolute right-3.5 z-20 flex flex-col gap-2 pointer-events-auto transition-all duration-300 ${
          isRiding ? 'top-36' : 'top-20'
        }`}
      >
        {/* 주행 모드 시 1인칭 헤딩 추종 vs 2D 북쪽 고정 나침반 버튼 */}
        {isRiding && onToggleHeadingLock && (
          <button
            type="button"
            onClick={handleToggleHeading}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-xl active:scale-95 transition-all ${
              is1stPersonActive
                ? 'bg-[#0055FF] text-white border-[#0055FF] ring-2 ring-blue-400/50'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:text-slate-900'
            }`}
            title={is1stPersonActive ? '1인칭 주행방향 추종 중 (클릭 시 북쪽 고정 2D)' : '북쪽 고정 2D (클릭 시 1인칭 회전)'}
            aria-label="헤딩 1인칭 시점 토글"
          >
            <div className="relative flex items-center justify-center">
              <Compass
                size={22}
                className={`transition-transform duration-300 ${is1stPersonActive ? 'text-white' : 'text-slate-600'}`}
                style={{ transform: `rotate(${is1stPersonActive ? 0 : -heading}deg)` }}
              />
              <div
                className={`absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black ${
                  is1stPersonActive ? 'bg-cyan-300 text-blue-900' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {is1stPersonActive ? '3D' : 'N'}
              </div>
            </div>
          </button>
        )}

        {/* GPS 내 현재 위치로 지도 중심 이동 버튼 */}
        <button
          type="button"
          onClick={() => {
            if (onFindMyLocation) {
              onFindMyLocation();
            } else {
              handleResumeTracking();
            }
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-xl active:scale-95 transition-all ${
            isUserInteracting
              ? 'bg-[#0055FF] text-white border-[#0055FF]'
              : 'bg-white/95 text-[#0055FF] border-slate-200 hover:bg-blue-50'
          }`}
          title="내 현재 위치 (GPS)로 지도 중심 이동"
          aria-label="내 위치 찾기"
        >
          <Crosshair size={20} className={isUserInteracting ? 'text-white' : 'text-[#0055FF]'} />
        </button>

        {/* 자전거 전용 도로망 레이어 On/Off 토글 버튼 */}
        <button
          type="button"
          onClick={toggleBicycleLayer}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-xl active:scale-95 transition-all ${
            isBicycleOverlayOn
              ? 'bg-[#0055FF] text-white border-[#0055FF] ring-2 ring-blue-400/40'
              : 'bg-white/95 text-slate-600 border-slate-200 hover:text-slate-900'
          }`}
          title={isBicycleOverlayOn ? '자전거 전용 도로망 켜짐 (클릭 시 끄기)' : '자전거 전용 도로망 꺼짐 (클릭 시 켜기)'}
          aria-label="자전거 도로망 레이어 토글"
        >
          <Layers size={19} />
        </button>

        {/* 지도 확대 / 축소 듀얼 버튼 */}
        <div className="flex flex-col rounded-2xl bg-white/95 border border-slate-200 shadow-lg overflow-hidden backdrop-blur-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-10 w-11 items-center justify-center text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors border-b border-slate-100"
            aria-label="지도 확대"
            title="확대"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-10 w-11 items-center justify-center text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label="지도 축소"
            title="축소"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* 위험 / 장애물 실시간 제보 버튼 */}
        {onOpenQuickReport && (
          <button
            type="button"
            onClick={onOpenQuickReport}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 border border-red-400 text-white shadow-lg shadow-red-500/25 active:scale-95 transition-all hover:brightness-110"
            title="주행 중 장애물·파손·통제 현장 빠른 신고"
            aria-label="위험 장애물 신고"
          >
            <ShieldAlert size={19} className="text-white" />
          </button>
        )}
      </div>

      {/* Simple destination guidance for the bicycle-road layer. */}
      {!isRiding && (routePath?.length || highlightFacilityId) && (
        <div className="absolute bottom-4 left-3 right-3 z-20 pointer-events-none sm:left-1/2 sm:right-auto sm:w-[min(90%,420px)] sm:-translate-x-1/2">
          <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white/95 px-3.5 py-3 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-xl">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base">🚲</span>
            <span>자전거 전용 도로(분홍/파란선)를 따라 안전하게 이동하세요</span>
          </div>
        </div>
      )}
    </div>
  );
}
