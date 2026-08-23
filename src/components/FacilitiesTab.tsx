import { useState, useMemo, useRef } from 'react';
import { Facility, POICategory } from '../types';
import {
  Search,
  MapPin,
  Navigation,
  Check,
  Building2,
  Clock,
  ShieldAlert,
  Accessibility,
  Info,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import MapComponent from './MapComponent';
import { ANYANG_CENTER } from '../data/courses';
import { getDistanceKm } from '../utils/routeUtils';

interface FacilitiesTabProps {
  facilities: Facility[];
  riderPosition?: { lat: number; lng: number } | null;
  onSelectFacilityOnMap: (fac: Facility) => void;
  onNavigateToFacility?: (fac: Facility) => void;
}

export default function FacilitiesTab({
  facilities,
  riderPosition,
  onSelectFacilityOnMap,
  onNavigateToFacility,
}: FacilitiesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<POICategory>('repair');
  const [restroomSubFilter, setRestroomSubFilter] = useState<'all' | 'public' | 'open' | 'emergency' | 'disabled'>('all');
  const [repairSubFilter, setRepairSubFilter] = useState<'all' | 'station' | 'center'>('all');
  const [parkingSubFilter, setParkingSubFilter] = useState<'all' | 'large' | 'station'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightFacilityId, setHighlightFacilityId] = useState<string | null>(null);
  
  // Panel View Mode: 'split' (standard), 'mapFull' (panel collapsed), 'listFull' (list expanded)
  const [panelViewMode, setPanelViewMode] = useState<'split' | 'mapFull' | 'listFull'>('split');

  const cardListRef = useRef<HTMLDivElement>(null);

  const categories: { id: POICategory; label: string; icon: string; count: number }[] = useMemo(() => [
    {
      id: 'repair',
      label: '수리/공기주입기',
      icon: '🔧',
      count: facilities.filter((f) => f.category === 'repair').length,
    },
    {
      id: 'parking',
      label: '자전거 거치대',
      icon: '🚲',
      count: facilities.filter((f) => f.category === 'parking').length,
    },
    {
      id: 'restroom',
      label: '화장실',
      icon: '🚻',
      count: facilities.filter((f) => f.category === 'restroom').length,
    },
    {
      id: 'water',
      label: '음수대',
      icon: '💧',
      count: facilities.filter((f) => f.category === 'water').length,
    },
    {
      id: 'cafe',
      label: '편의/카페',
      icon: '☕',
      count: facilities.filter((f) => f.category === 'cafe').length,
    },
    {
      id: 'hazard',
      label: '횡단보도',
      icon: '🚸',
      count: facilities.filter((f) => f.category === 'hazard').length,
    },
  ], [facilities]);

  const userBaseLoc = riderPosition || ANYANG_CENTER;

  const filteredFacilities = useMemo(() => {
    const list = facilities.filter((fac) => {
      const matchCat = fac.category === selectedCategory;

      let matchSub = true;
      if (selectedCategory === 'restroom') {
        if (restroomSubFilter === 'public') {
          matchSub = fac.facilityType === '공중화장실' || fac.openHours?.includes('24시간');
        } else if (restroomSubFilter === 'open') {
          matchSub = fac.facilityType === '개방화장실';
        } else if (restroomSubFilter === 'emergency') {
          matchSub = fac.emergencyBell !== false;
        } else if (restroomSubFilter === 'disabled') {
          matchSub = fac.disabledToilet !== false;
        }
      } else if (selectedCategory === 'repair') {
        if (repairSubFilter === 'station') {
          matchSub = fac.name.includes('역') || fac.description.includes('출구') || fac.description.includes('역');
        } else if (repairSubFilter === 'center') {
          matchSub = fac.name.includes('복지센터') || fac.name.includes('구청') || fac.name.includes('주민센터');
        }
      } else if (selectedCategory === 'parking') {
        if (parkingSubFilter === 'large') {
          matchSub =
            fac.description.includes('100대') ||
            fac.description.includes('150대') ||
            fac.description.includes('200대') ||
            fac.description.includes('300대') ||
            fac.description.includes('400대') ||
            fac.description.includes('대규모') ||
            fac.description.includes('대형');
        } else if (parkingSubFilter === 'station') {
          matchSub = fac.name.includes('역') || fac.description.includes('환승') || fac.description.includes('출구');
        }
      }

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        q === '' ||
        fac.name.toLowerCase().includes(q) ||
        fac.address.toLowerCase().includes(q) ||
        (fac.roadAddress && fac.roadAddress.toLowerCase().includes(q)) ||
        fac.description.toLowerCase().includes(q) ||
        (fac.managementAgency && fac.managementAgency.toLowerCase().includes(q));

      return matchCat && matchSub && matchQuery;
    });

    // Calculate dynamic distance and sort ascending (nearest first)
    return list
      .map((fac) => {
        const distKm = getDistanceKm(userBaseLoc.lat, userBaseLoc.lng, fac.lat, fac.lng);
        const dynamicDistance = distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`;
        return {
          ...fac,
          dynamicDistance,
          rawDistanceKm: distKm,
        };
      })
      .sort((a, b) => a.rawDistanceKm - b.rawDistanceKm);
  }, [facilities, selectedCategory, restroomSubFilter, repairSubFilter, parkingSubFilter, searchQuery, userBaseLoc]);

  const mapPoiFilters: POICategory[] = useMemo(() => {
    return [selectedCategory];
  }, [selectedCategory]);

  const mapCenter = useMemo(() => {
    if (highlightFacilityId) {
      const target = facilities.find((f) => f.id === highlightFacilityId);
      if (target) return { lat: target.lat, lng: target.lng };
    }
    return userBaseLoc;
  }, [highlightFacilityId, facilities, userBaseLoc]);

  const handleMapPinSelect = (fac: Facility) => {
    setHighlightFacilityId(fac.id);
    onSelectFacilityOnMap(fac);
    
    if (panelViewMode === 'mapFull') {
      setPanelViewMode('split');
    }

    setTimeout(() => {
      const elem = document.getElementById(`facility-card-${fac.id}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleFocusFacility = (fac: Facility) => {
    setHighlightFacilityId(fac.id);
    const elem = document.getElementById(`facility-card-${fac.id}`);
    if (elem && cardListRef.current) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-slate-100 text-slate-900 overflow-hidden select-none">
      
      {/* ── 1. Top Kakao-Style Floating Search & Category Selection Header ── */}
      <div className="z-20 bg-white border-b border-slate-200 px-4 pt-3 pb-2.5 shadow-sm shrink-0 space-y-2">
        {/* Search Bar Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="시설명, 역이름, 도로명 검색..."
              className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-10 pr-9 py-2 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0055FF] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Map View Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (panelViewMode === 'mapFull') setPanelViewMode('split');
              else setPanelViewMode('mapFull');
            }}
            className={`flex items-center gap-1 rounded-2xl border px-3 py-2 text-xs font-bold transition-all shrink-0 active:scale-95 ${
              panelViewMode === 'mapFull'
                ? 'bg-[#0055FF] text-white border-[#0055FF] shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={panelViewMode === 'mapFull' ? '목록 분할 보기' : '지도 전체화면'}
          >
            {panelViewMode === 'mapFull' ? (
              <>
                <Minimize2 size={13} />
                <span>분할</span>
              </>
            ) : (
              <>
                <Maximize2 size={13} className="text-[#0055FF]" />
                <span>지도</span>
              </>
            )}
          </button>
        </div>

        {/* Top Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setRestroomSubFilter('all');
                  setHighlightFacilityId(null);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#0055FF] text-white border border-[#0055FF] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters Row */}
        {(selectedCategory === 'restroom' || selectedCategory === 'repair' || selectedCategory === 'parking') && (
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-1 border-t border-slate-100 text-[11px]">
            {/* Restroom Sub-Filters */}
            {selectedCategory === 'restroom' && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold mr-1">화장실 유형:</span>
                {[
                  { id: 'all', label: '전체' },
                  { id: 'public', label: '공중 24h' },
                  { id: 'open', label: '개방화장실' },
                  { id: 'emergency', label: '비상벨' },
                  { id: 'disabled', label: '장애인용' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setRestroomSubFilter(sub.id as any)}
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all ${
                      restroomSubFilter === sub.id
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {/* Repair Sub-Filters */}
            {selectedCategory === 'repair' && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold mr-1">위치 유형:</span>
                {[
                  { id: 'all', label: '전체 주입기' },
                  { id: 'station', label: '지하철역 출구' },
                  { id: 'center', label: '주민센터/구청' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setRepairSubFilter(sub.id as any)}
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all ${
                      repairSubFilter === sub.id
                        ? 'bg-blue-100 text-[#0055FF] border border-blue-300 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {/* Parking Sub-Filters */}
            {selectedCategory === 'parking' && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold mr-1">거치대 규모:</span>
                {[
                  { id: 'all', label: '전체 거치대' },
                  { id: 'station', label: '환승역 앞' },
                  { id: 'large', label: '대형(100대+)' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setParkingSubFilter(sub.id as any)}
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all ${
                      parkingSubFilter === sub.id
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Middle Section: Interactive Map with Clean Icon Pins ── */}
      <div
        className={`relative w-full overflow-hidden bg-slate-200 transition-all duration-300 ${
          panelViewMode === 'mapFull'
            ? 'h-[calc(100%-120px)]'
            : panelViewMode === 'listFull'
            ? 'h-[16vh]'
            : 'h-[36vh]'
        }`}
      >
        <MapComponent
          center={mapCenter}
          facilities={filteredFacilities}
          showAllFacilities={false}
          activePoiFilters={mapPoiFilters}
          highlightFacilityId={highlightFacilityId}
          onSelectFacility={handleMapPinSelect}
        />

        {/* Floating Map Status Overlay */}
        <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/95 border border-slate-200 px-3 py-1.5 backdrop-blur-xl shadow-md">
            <span className="text-xs">📍</span>
            <span className="text-xs font-bold text-slate-800">
              {categories.find((c) => c.id === selectedCategory)?.label}
            </span>
            <span className="rounded-full bg-[#0055FF] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {filteredFacilities.length}개소 (내 주변 순)
            </span>
          </div>

          {highlightFacilityId && (
            <button
              type="button"
              onClick={() => setHighlightFacilityId(null)}
              className="pointer-events-auto rounded-2xl bg-white/95 border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 backdrop-blur-xl hover:text-slate-900 shadow-sm"
            >
              선택 해제
            </button>
          )}
        </div>

        {/* Floating map hint indicator */}
        <div className="absolute bottom-2.5 left-4 z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/90 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur-md shadow-sm">
            <span>💡 지도 아이콘을 터치하면 상세 정보로 이동합니다</span>
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Section: Detailed Information Cards ONLY ── */}
      {panelViewMode === 'mapFull' ? (
        /* Collapsed Bottom Floating Summary Bar */
        <div className="h-14 w-full border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur-xl flex items-center justify-between shadow-lg shrink-0 z-20">
          <div
            onClick={() => setPanelViewMode('split')}
            className="flex-1 flex items-center gap-2.5 cursor-pointer min-w-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF] shrink-0">
              <Info size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                상세 정보 목록 ({filteredFacilities.length}개소)
              </span>
              <span className="text-[10px] text-slate-500">
                터치하여 상세 정보 펼치기
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPanelViewMode('split')}
            className="flex items-center gap-1 rounded-xl bg-[#0055FF] px-3 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-transform"
          >
            <ChevronUp size={14} />
            <span>정보 보기</span>
          </button>
        </div>
      ) : (
        /* Expanded / Split List Panel containing ONLY Detailed Cards */
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 transition-all duration-300">
          
          {/* Header Bar with Toggle & Stats */}
          <div className="bg-white px-4 py-2 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                상세 정보
              </span>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0055FF]">
                {filteredFacilities.length}개소
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPanelViewMode(panelViewMode === 'listFull' ? 'split' : 'listFull')}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 transition-all"
              >
                {panelViewMode === 'listFull' ? (
                  <>
                    <ChevronDown size={12} />
                    <span>기본 분할</span>
                  </>
                ) : (
                  <>
                    <ChevronUp size={12} />
                    <span>목록 확장</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPanelViewMode('mapFull')}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 transition-all"
                title="지도 넓게 보기"
              >
                <ChevronDown size={12} />
                <span>접기</span>
              </button>
            </div>
          </div>

          {/* Scrollable Detailed Cards List */}
          <div
            ref={cardListRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24"
          >
            {filteredFacilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm font-bold text-slate-700">검색 조건에 맞는 편의시설이 없습니다</p>
                <p className="text-xs mt-1 text-slate-500">상단 검색어나 카테고리 필터를 변경해 보세요</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('repair');
                    setRestroomSubFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              filteredFacilities.map((fac) => {
                const isSelected = highlightFacilityId === fac.id;
                const isRestroom = fac.category === 'restroom';
                const displayDistance = (fac as any).dynamicDistance || fac.distance;

                return (
                  <div
                    id={`facility-card-${fac.id}`}
                    key={fac.id}
                    className={`rounded-2xl bg-white p-4 shadow-sm border transition-all ${
                      isSelected
                        ? 'border-[#0055FF] ring-2 ring-blue-200 bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div
                          onClick={() => handleFocusFacility(fac)}
                          className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-slate-50 border text-xl font-bold transition-transform active:scale-95 ${
                            isSelected ? 'border-[#0055FF] bg-blue-50' : 'border-slate-200'
                          }`}
                        >
                          {fac.category === 'water' && '💧'}
                          {fac.category === 'repair' && '🔧'}
                          {fac.category === 'restroom' && '🚻'}
                          {fac.category === 'parking' && '🚲'}
                          {fac.category === 'cafe' && '☕'}
                          {fac.category === 'hazard' && '⚠️'}
                        </div>
                        <div className="cursor-pointer" onClick={() => onSelectFacilityOnMap(fac)}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-[#0055FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              {fac.categoryName}
                            </span>
                            {fac.facilityType && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                                {fac.facilityType}
                              </span>
                            )}
                            {displayDistance && (
                              <span className="text-xs font-bold text-[#0055FF] bg-blue-50/80 px-2 py-0.5 rounded-md">
                                {displayDistance}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1 text-sm font-bold text-slate-900 leading-snug hover:text-[#0055FF] transition-colors">
                            {fac.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Restroom Features Quick Icons */}
                    {isRestroom && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-700">
                        {fac.emergencyBell !== false && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2 py-0.5 text-red-700">
                            <ShieldAlert size={10} className="text-red-500" />
                            비상벨
                          </span>
                        )}
                        {fac.disabledToilet !== false && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[#0055FF]">
                            <Accessibility size={10} className="text-[#0055FF]" />
                            장애인용
                          </span>
                        )}
                        {fac.openHours?.includes('24시간') && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-700">
                            <Clock size={10} className="text-emerald-600" />
                            24h 상시
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {fac.description && (
                      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        {fac.description}
                      </p>
                    )}

                    {/* Available Items */}
                    {fac.availableItems && fac.availableItems.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {fac.availableItems.slice(0, 4).map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700"
                          >
                            <Check size={9} className="text-emerald-600" strokeWidth={3} />
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Address & Meta Info */}
                    <div className="mt-3 space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                      <div className="flex items-start gap-1.5 truncate">
                        <MapPin size={12} className="shrink-0 text-[#0055FF] mt-0.5" />
                        <span className="truncate text-slate-700">{fac.roadAddress || fac.address}</span>
                      </div>
                      {fac.openHours && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock size={12} className="shrink-0 text-slate-400" />
                          <span>{fac.openHours}</span>
                        </div>
                      )}
                      {fac.managementAgency && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Building2 size={11} className="shrink-0 text-slate-400" />
                          <span>관리: {fac.managementAgency}</span>
                          {fac.phone && <span className="ml-1 text-[#0055FF]">{fac.phone}</span>}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleFocusFacility(fac)}
                        className="flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      >
                        <MapPin size={12} className="text-[#0055FF]" />
                        <span>위치 보기</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectFacilityOnMap(fac)}
                          className="flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Info size={12} />
                          <span>상세</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToFacility) {
                              onNavigateToFacility(fac);
                            } else {
                              onSelectFacilityOnMap(fac);
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-[#0055FF] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                        >
                          <Navigation size={12} fill="currentColor" />
                          <span>길안내</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
