import { useState, useEffect, useRef, type MouseEvent } from 'react';
import {
  Search,
  MapPin,
  ArrowUpDown,
  Sparkles,
  RotateCcw,
  X,
  Crosshair,
  Loader2,
  Clock,
  CornerDownRight,
  Milestone,
  TreePine,
  Maximize2,
  TrendingDown,
  Navigation,
  Train,
  Building,
  ShoppingBag,
  Bike,
} from 'lucide-react';
import { LatLng, FilterCategory } from '../types';
import { getCurrentTimeString } from '../utils/routeUtils';
import { searchKakaoPlaces, coordToAddress, PlaceSearchResult } from '../services/kakaoService';
import { searchAnyangPlacesLocal, ANYANG_PLACES_DATABASE, AnyangPlace } from '../data/anyangPlaces';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: string;
  destination: string;
  onFindOptimalRoute: (params: {
    routeType: 'oneway' | 'roundtrip';
    origin: string;
    originCoords?: LatLng;
    destination: string;
    destinationCoords?: LatLng;
    isDistanceLoop?: boolean;
    targetDistanceKm?: number;
    preferredFilter?: FilterCategory;
  }) => void;
  initialRouteType?: 'oneway' | 'roundtrip';
}

const PREFERRED_FILTERS: Array<{ id: FilterCategory; label: string; icon: any }> = [
  { id: '추천 코스', label: '최적 추천', icon: Sparkles },
  { id: '평지 중심', label: '평지 중심', icon: TrendingDown },
  { id: '경치 좋은', label: '수변·경치', icon: TreePine },
  { id: '단거리', label: '최단 시간', icon: Maximize2 },
];

const DISTANCE_PRESETS = [5, 10, 15, 20, 30];

export default function SearchModal({
  isOpen,
  onClose,
  origin,
  destination,
  onFindOptimalRoute,
  initialRouteType = 'oneway',
}: SearchModalProps) {
  // Navigation & Sub-mode: 'oneway' | 'loop-distance' | 'roundtrip-dest'
  const [subMode, setSubMode] = useState<'oneway' | 'loop-distance' | 'roundtrip-dest'>('oneway');
  const [targetDistanceKm, setTargetDistanceKm] = useState<number>(10);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('추천 코스');

  // Input states
  const [tempOrigin, setTempOrigin] = useState(origin || '내 현재 위치');
  const [originCoords, setOriginCoords] = useState<LatLng | undefined>(undefined);
  const [tempDest, setTempDest] = useState(destination || '');
  const [destCoords, setDestCoords] = useState<LatLng | undefined>(undefined);

  // Active focus & UI feedback
  const [activeField, setActiveField] = useState<'origin' | 'dest'>('dest');
  const [isOriginFocused, setIsOriginFocused] = useState(false);
  const [isDestFocused, setIsDestFocused] = useState(false);

  // Suggested candidates state
  const [originCandidates, setOriginCandidates] = useState<AnyangPlace[]>([]);
  const [destCandidates, setDestCandidates] = useState<AnyangPlace[]>([]);
  const [kakaoResults, setKakaoResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchRequestIdRef = useRef(0);
  const destInputRef = useRef<HTMLInputElement>(null);

  // Load / Save Recent Searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('anyang_bike_recent_searches_v2');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      } else {
        setRecentSearches(['쌍개울 문화광장', '평촌중앙공원', '안양예술공원', '범계역', '충훈교']);
      }
    } catch {
      setRecentSearches(['쌍개울 문화광장', '평촌중앙공원', '안양예술공원', '범계역', '충훈교']);
    }
  }, []);

  const saveRecentSearches = (items: string[]) => {
    setRecentSearches(items);
    try {
      localStorage.setItem('anyang_bike_recent_searches_v2', JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const handleAddRecentSearch = (name: string) => {
    if (!name || !name.trim()) return;
    const clean = name.trim();
    const updated = [clean, ...recentSearches.filter((item) => item !== clean)].slice(0, 8);
    saveRecentSearches(updated);
  };

  const handleRemoveRecentSearch = (nameToRemove: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== nameToRemove);
    saveRecentSearches(updated);
  };

  const handleClearAllRecentSearches = (e: MouseEvent) => {
    e.stopPropagation();
    saveRecentSearches([]);
  };

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempOrigin(origin || '내 현재 위치');
      setTempDest(destination || '');
      setSubMode(initialRouteType === 'roundtrip' ? 'loop-distance' : 'oneway');
      setIsOriginFocused(false);
      setIsDestFocused(false);
      setOriginCandidates([]);
      setDestCandidates([]);
      setKakaoResults([]);
      setCurrentTimeStr(getCurrentTimeString());
    }
  }, [isOpen, origin, destination, initialRouteType]);

  // 1. Origin Input Change Handler
  const handleOriginInputChange = (text: string) => {
    setTempOrigin(text);
    setOriginCoords(undefined);
    const requestId = ++searchRequestIdRef.current;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!text.trim()) {
      setOriginCandidates([]);
      setKakaoResults([]);
      return;
    }

    // Instant local candidate lookup
    const localMatches = searchAnyangPlacesLocal(text.trim());
    setOriginCandidates(localMatches);

    // Debounced Kakao Places search for comprehensive coverage
    setIsSearchingPlaces(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const places = await searchKakaoPlaces(text.trim());
        if (requestId === searchRequestIdRef.current) setKakaoResults(places || []);
      } catch (err) {
        console.warn('Place search failed:', err);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 200);
  };

  // 2. Destination Input Change Handler
  const handleDestInputChange = (text: string) => {
    setTempDest(text);
    setDestCoords(undefined);
    const requestId = ++searchRequestIdRef.current;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!text.trim()) {
      setDestCandidates([]);
      setKakaoResults([]);
      return;
    }

    // Instant local candidate lookup
    const localMatches = searchAnyangPlacesLocal(text.trim());
    setDestCandidates(localMatches);

    // Debounced Kakao Places search
    setIsSearchingPlaces(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const places = await searchKakaoPlaces(text.trim());
        if (requestId === searchRequestIdRef.current) setKakaoResults(places || []);
      } catch (err) {
        console.warn('Place search failed:', err);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 200);
  };

  // Geolocation Real GPS retrieval
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('위치 정보를 지원하지 않는 브라우저입니다.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOriginCoords({ lat, lng });

        try {
          const address = await coordToAddress(lat, lng);
          setTempOrigin(address || '내 현재 위치');
        } catch {
          setTempOrigin('내 현재 위치');
        } finally {
          setIsLocating(false);
          setIsOriginFocused(false);
          if (subMode !== 'loop-distance') {
            setActiveField('dest');
            setIsDestFocused(true);
            destInputRef.current?.focus();
          }
        }
      },
      (err) => {
        console.warn('GPS location error:', err);
        setIsLocating(false);
        setTempOrigin('내 현재 위치');
        setIsOriginFocused(false);
        if (subMode !== 'loop-distance') {
          setActiveField('dest');
          setIsDestFocused(true);
          destInputRef.current?.focus();
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Select Anyang Place Candidate
  const handleSelectAnyangPlace = (place: AnyangPlace, target: 'origin' | 'dest') => {
    const coords: LatLng = { lat: place.lat, lng: place.lng };

    if (target === 'origin') {
      setTempOrigin(place.name);
      setOriginCoords(coords);
      setIsOriginFocused(false);
      handleAddRecentSearch(place.name);
      // Auto-advance to destination
      if (subMode !== 'loop-distance') {
        setActiveField('dest');
        setIsDestFocused(true);
        setTimeout(() => {
          destInputRef.current?.focus();
        }, 100);
      }
    } else {
      setTempDest(place.name);
      setDestCoords(coords);
      setIsDestFocused(false);
      handleAddRecentSearch(place.name);
    }
  };

  // Select Kakao Place Result
  const handleSelectKakaoPlace = (item: PlaceSearchResult, target: 'origin' | 'dest') => {
    const placeName = item.place_name;
    const address = item.road_address_name || item.address_name;
    const fullText = address && !placeName.includes(address) ? `${placeName} (${address})` : placeName;

    const coords: LatLng = {
      lat: parseFloat(item.y),
      lng: parseFloat(item.x),
    };

    if (target === 'origin') {
      setTempOrigin(fullText);
      setOriginCoords(coords);
      setIsOriginFocused(false);
      handleAddRecentSearch(placeName);
      if (subMode !== 'loop-distance') {
        setActiveField('dest');
        setIsDestFocused(true);
        setTimeout(() => {
          destInputRef.current?.focus();
        }, 100);
      }
    } else {
      setTempDest(fullText);
      setDestCoords(coords);
      setIsDestFocused(false);
      handleAddRecentSearch(placeName);
    }
  };

  const handleSelectRecentSearch = (item: string, target: 'origin' | 'dest') => {
    const matched = ANYANG_PLACES_DATABASE.find((p) => p.name === item || item.includes(p.name));
    const coords = matched ? { lat: matched.lat, lng: matched.lng } : undefined;

    if (target === 'origin') {
      setTempOrigin(item);
      setOriginCoords(coords);
      setIsOriginFocused(false);
      handleAddRecentSearch(item);
      if (subMode !== 'loop-distance') {
        setActiveField('dest');
        setIsDestFocused(true);
        destInputRef.current?.focus();
      }
    } else {
      setTempDest(item);
      setDestCoords(coords);
      setIsDestFocused(false);
      handleAddRecentSearch(item);
    }
  };

  const handleSwap = () => {
    const prevO = tempOrigin;
    const prevOCoords = originCoords;
    setTempOrigin(tempDest || '내 현재 위치');
    setOriginCoords(destCoords);
    setTempDest(prevO);
    setDestCoords(prevOCoords);
  };

  const handleSubmitOptimalRoute = () => {
    const finalOrigin = tempOrigin.trim() || '내 현재 위치';

    if (subMode === 'loop-distance') {
      // 1. Distance-based closed loop with NO destination required
      onFindOptimalRoute({
        routeType: 'roundtrip',
        origin: finalOrigin,
        originCoords,
        destination: `${finalOrigin} (AI ${targetDistanceKm}km 원점 회귀)`,
        destinationCoords: originCoords,
        isDistanceLoop: true,
        targetDistanceKm,
        preferredFilter: selectedFilter,
      });
    } else {
      // 2. Destination-based One-way or Round-trip
      const finalDest = tempDest.trim() || '평촌중앙공원 분수대';
      handleAddRecentSearch(finalDest);
      onFindOptimalRoute({
        routeType: subMode === 'roundtrip-dest' ? 'roundtrip' : 'oneway',
        origin: finalOrigin,
        originCoords,
        destination: finalDest,
        destinationCoords: destCoords,
        isDistanceLoop: false,
        preferredFilter: selectedFilter,
      });
    }

    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'subway':
        return <Train size={14} className="text-indigo-600" />;
      case 'park':
        return <TreePine size={14} className="text-emerald-600" />;
      case 'shopping':
        return <ShoppingBag size={14} className="text-rose-600" />;
      case 'bike_ramp':
        return <Bike size={14} className="text-[#0055FF]" />;
      case 'culture':
      default:
        return <Building size={14} className="text-slate-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-900 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
        <div>
          <h2 className="text-base font-bold text-slate-900">안양시 자전거 길찾기</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {subMode === 'loop-distance'
              ? '출발지와 원하는 총 거리를 선택하면 AI가 왕복 순환 루트를 추천합니다'
              : '출발지와 목적지를 입력하여 실제 도로 기반 최적 자전거 경로를 탐색하세요'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 min-w-[44px] min-h-[44px] items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
      </div>

      {/* 1. Route Mode Selection Tabs */}
      <div className="px-6 pt-3.5 pb-2 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-slate-200">
          <button
            type="button"
            onClick={() => setSubMode('oneway')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all ${
              subMode === 'oneway'
                ? 'bg-[#0055FF] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Milestone size={14} />
            <span>편도 경로</span>
          </button>
          <button
            type="button"
            onClick={() => setSubMode('loop-distance')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all ${
              subMode === 'loop-distance'
                ? 'bg-[#0055FF] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} />
            <span>거리 맞춤 왕복 (AI)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubMode('roundtrip-dest')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all ${
              subMode === 'roundtrip-dest'
                ? 'bg-[#0055FF] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpDown size={14} />
            <span>목적지 왕복</span>
          </button>
        </div>
      </div>

      {/* 2. Search Form Container */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="space-y-3">
          {/* 출발지 (Origin) Input */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0055FF] text-[10px] text-white font-bold">
                  출
                </span>
                출발지 (현재 시각: {currentTimeStr})
              </label>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 min-h-[36px] text-xs font-bold text-[#0055FF] hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>실제 GPS 위치 확인 중...</span>
                  </>
                ) : (
                  <>
                    <Crosshair size={13} />
                    <span>내 현재 위치 (GPS)</span>
                  </>
                )}
              </button>
            </div>

            <div
              onClick={() => {
                setActiveField('origin');
                setIsOriginFocused(true);
                setIsDestFocused(false);
              }}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all ${
                activeField === 'origin' || isOriginFocused
                  ? 'bg-blue-50/50 border-[#0055FF] ring-2 ring-blue-100'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <MapPin size={16} className="text-[#0055FF] shrink-0" />
              <input
                type="text"
                value={tempOrigin}
                onChange={(e) => {
                  handleOriginInputChange(e.target.value);
                  setIsOriginFocused(true);
                }}
                onFocus={() => {
                  setActiveField('origin');
                  setIsOriginFocused(true);
                  setIsDestFocused(false);
                  if (tempOrigin.trim()) {
                    handleOriginInputChange(tempOrigin);
                  }
                }}
                placeholder="출발지를 입력하거나 '내 현재 위치 (GPS)'를 누르세요"
                className="flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              {tempOrigin && (
                <button
                  type="button"
                  onClick={() => {
                    setTempOrigin('');
                    setOriginCoords(undefined);
                    setOriginCandidates([]);
                    setIsOriginFocused(true);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Origin Dropdown Candidates */}
            {isOriginFocused && (
              <div className="absolute left-0 right-0 top-full mt-2 z-40 max-h-72 overflow-y-auto rounded-2xl bg-white border border-slate-200 p-3 shadow-2xl animate-in fade-in zoom-in-95">
                {/* Case A: User is typing text */}
                {tempOrigin.trim() ? (
                  <>
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-500 flex items-center justify-between border-b border-slate-100 pb-2 mb-1.5">
                      <span>출발지 추천 장소</span>
                      <span className="text-[#0055FF] font-bold">
                        {originCandidates.length + kakaoResults.length}건
                      </span>
                    </div>

                    <div className="space-y-1">
                      {/* Local curated Anyang places */}
                      {originCandidates.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => handleSelectAnyangPlace(place, 'origin')}
                          className="flex w-full items-start gap-3 rounded-xl p-2.5 min-h-[44px] text-left hover:bg-blue-50/60 active:bg-blue-100/60 transition-colors group"
                        >
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0055FF] border border-blue-200 group-hover:bg-[#0055FF] group-hover:text-white transition-all">
                            {getCategoryIcon(place.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-[#0055FF] truncate">
                                {place.name}
                              </p>
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {place.categoryLabel}
                              </span>
                              <span className="text-[10px] text-slate-400">{place.dong}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{place.address}</p>
                          </div>
                          <CornerDownRight size={13} className="text-slate-400 mt-1 shrink-0" />
                        </button>
                      ))}

                      {/* Kakao places */}
                      {kakaoResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectKakaoPlace(item, 'origin')}
                          className="flex w-full items-start gap-3 rounded-xl p-2.5 min-h-[44px] text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                        >
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-[#0055FF] group-hover:text-white transition-all">
                            <MapPin size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#0055FF] truncate">
                              {item.place_name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.road_address_name || item.address_name}
                            </p>
                          </div>
                          <CornerDownRight size={13} className="text-slate-400 mt-1 shrink-0" />
                        </button>
                      ))}

                      {originCandidates.length === 0 && kakaoResults.length === 0 && !isSearchingPlaces && (
                        <div className="py-4 text-center text-xs text-slate-400">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Case B: Input is empty - show GPS quick button & popular starting hubs */
                  <>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      className="flex w-full items-center gap-2.5 rounded-xl bg-blue-50 p-2.5 text-xs font-bold text-[#0055FF] hover:bg-blue-100 transition-colors mb-2"
                    >
                      <Crosshair size={15} />
                      <span>현재 내 위치로 지정</span>
                    </button>

                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                      자주 출발하는 안양 거점
                    </span>
                    <div className="space-y-1">
                      {ANYANG_PLACES_DATABASE.filter((p) => p.popular).slice(0, 5).map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => handleSelectAnyangPlace(place, 'origin')}
                          className="flex w-full items-center justify-between gap-2 rounded-xl p-2 min-h-[38px] hover:bg-slate-50 text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getCategoryIcon(place.category)}
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {place.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{place.dong}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* MODE A: Distance-Based Loop */}
          {subMode === 'loop-distance' ? (
            <div className="mt-1 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <RotateCcw size={16} className="text-[#0055FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    원하는 총 라이딩 거리 선택
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#0055FF]">
                    {targetDistanceKm}
                  </span>
                  <span className="text-xs font-bold text-slate-600">km</span>
                </div>
              </div>

              {/* Distance Quick Presets */}
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {DISTANCE_PRESETS.map((km) => {
                  const isSelected = targetDistanceKm === km;
                  return (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setTargetDistanceKm(km)}
                      className={`py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#0055FF] text-white shadow-sm ring-2 ring-blue-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {km}km
                    </button>
                  );
                })}
              </div>

              {/* Slider for precision */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-500">3km</span>
                <input
                  type="range"
                  min="3"
                  max="40"
                  step="1"
                  value={targetDistanceKm}
                  onChange={(e) => setTargetDistanceKm(Number(e.target.value))}
                  className="flex-1 accent-[#0055FF] cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="text-[11px] font-bold text-slate-500">40km</span>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 font-medium bg-white/80 rounded-xl p-2.5 border border-slate-200">
                <span>예상 시간: 약 {Math.round((targetDistanceKm / 15) * 60)}분</span>
                <span>예상 칼로리: 약 {Math.round(targetDistanceKm * 38)} kcal</span>
                <span className="text-emerald-600 font-bold">평지 수변길 100%</span>
              </div>
            </div>
          ) : (
            /* MODE B & C: Destination-based */
            <>
              {/* Swap Button */}
              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="flex h-9 w-9 min-w-[36px] min-h-[36px] items-center justify-center rounded-full bg-white border border-slate-300 text-[#0055FF] shadow-sm hover:bg-slate-50 active:scale-90 transition-all z-10"
                  title="출발지 ⇄ 목적지 맞바꾸기"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>

              {/* Destination Input */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#E11D48] text-[10px] text-white font-bold">
                    도
                  </span>
                  도착지 검색
                </label>

                <div
                  onClick={() => {
                    setActiveField('dest');
                    setIsDestFocused(true);
                    setIsOriginFocused(false);
                  }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all ${
                    activeField === 'dest' || isDestFocused
                      ? 'bg-rose-50/50 border-[#E11D48] ring-2 ring-rose-100'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Search size={16} className="text-[#E11D48] shrink-0" />
                  <input
                    ref={destInputRef}
                    type="text"
                    value={tempDest}
                    onChange={(e) => {
                      handleDestInputChange(e.target.value);
                      setIsDestFocused(true);
                    }}
                    onFocus={() => {
                      setActiveField('dest');
                      setIsDestFocused(true);
                      setIsOriginFocused(false);
                      if (tempDest.trim()) {
                        handleDestInputChange(tempDest);
                      }
                    }}
                    placeholder="도착지 검색 (예: 안양예술공원, 범계역, 평촌중앙공원)"
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {isSearchingPlaces && (
                    <Loader2 size={15} className="animate-spin text-slate-400 shrink-0" />
                  )}
                  {tempDest && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempDest('');
                        setDestCoords(undefined);
                        setDestCandidates([]);
                        setIsDestFocused(true);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Destination Dropdown Candidates */}
                {isDestFocused && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-40 max-h-72 overflow-y-auto rounded-2xl bg-white border border-slate-200 p-3 shadow-2xl animate-in fade-in zoom-in-95">
                    {/* Case A: User is typing search keyword */}
                    {tempDest.trim() ? (
                      <>
                        <div className="px-2 py-1 text-[11px] font-bold text-slate-500 flex items-center justify-between border-b border-slate-100 pb-2 mb-1.5">
                          <span>도착지 추천 장소</span>
                          <span className="text-[#E11D48] font-bold">
                            {destCandidates.length + kakaoResults.length}건
                          </span>
                        </div>

                        <div className="space-y-1">
                          {/* Local curated Anyang places */}
                          {destCandidates.map((place) => (
                            <button
                              key={place.id}
                              type="button"
                              onClick={() => handleSelectAnyangPlace(place, 'dest')}
                              className="flex w-full items-start gap-3 rounded-xl p-2.5 min-h-[44px] text-left hover:bg-rose-50/60 active:bg-rose-100/60 transition-colors group"
                            >
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#E11D48] border border-rose-200 group-hover:bg-[#E11D48] group-hover:text-white transition-all">
                                {getCategoryIcon(place.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#E11D48] truncate">
                                    {place.name}
                                  </p>
                                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                    {place.categoryLabel}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{place.dong}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{place.address}</p>
                              </div>
                              <CornerDownRight size={13} className="text-slate-400 mt-1 shrink-0" />
                            </button>
                          ))}

                          {/* Kakao places */}
                          {kakaoResults.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectKakaoPlace(item, 'dest')}
                              className="flex w-full items-start gap-3 rounded-xl p-2.5 min-h-[44px] text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                            >
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-[#E11D48] group-hover:text-white transition-all">
                                <MapPin size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 group-hover:text-[#E11D48] truncate">
                                  {item.place_name}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {item.road_address_name || item.address_name}
                                </p>
                              </div>
                              <CornerDownRight size={13} className="text-slate-400 mt-1 shrink-0" />
                            </button>
                          ))}

                          {destCandidates.length === 0 && kakaoResults.length === 0 && !isSearchingPlaces && (
                            <div className="py-4 text-center text-xs text-slate-400">
                              검색 결과가 없습니다.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Case B: Input is empty - show Recent Searches & Popular spots */
                      <>
                        <div className="px-1 py-1 text-[11px] font-bold text-slate-500 flex items-center justify-between border-b border-slate-100 pb-2 mb-1.5">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Clock size={13} className="text-[#0055FF]" />
                            <span>최근 검색지</span>
                          </div>
                          {recentSearches.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllRecentSearches}
                              className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              전체 삭제
                            </button>
                          )}
                        </div>

                        {recentSearches.length > 0 ? (
                          <div className="space-y-1 mt-1">
                            {recentSearches.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleSelectRecentSearch(item, 'dest')}
                                className="flex w-full items-center justify-between gap-2.5 rounded-xl p-2.5 min-h-[42px] hover:bg-slate-50 active:bg-blue-50/50 cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <Clock size={14} className="text-slate-400 group-hover:text-[#0055FF] shrink-0" />
                                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0055FF] truncate">
                                    {item}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveRecentSearch(item, e)}
                                  className="text-slate-300 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors shrink-0"
                                  title="삭제"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-3 text-center text-xs text-slate-400">
                            최근 검색 기록이 없습니다.
                          </div>
                        )}

                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                            자주 찾는 안양 라이딩 명소
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {['쌍개울 문화광장', '평촌중앙공원', '안양예술공원', '범계역', '충훈교', '병목안시민공원'].map((spot) => (
                              <button
                                key={spot}
                                type="button"
                                onClick={() => handleSelectRecentSearch(spot, 'dest')}
                                className="rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-[#E11D48] px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors"
                              >
                                {spot}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Route Style Preference Filter */}
          <div className="mt-1">
            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">선호 코스 추천 기준</span>
            <div className="grid grid-cols-4 gap-1.5">
              {PREFERRED_FILTERS.map((f) => {
                const Icon = f.icon;
                const isSelected = selectedFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all min-h-[50px] ${
                      isSelected
                        ? 'bg-blue-50 border-[#0055FF] text-[#0055FF] font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-[#0055FF]' : 'text-slate-500'} />
                    <span className="text-[11px] font-bold mt-1 whitespace-nowrap">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Suggested Popular Hubs List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              {subMode === 'loop-distance' ? '출발지로 지정하기 좋은 안양 거점' : '안양시 주요 라이딩 추천 명소'}
            </span>
            <span className="text-[11px] font-medium text-slate-400">터치 시 바로 지정</span>
          </div>

          <div className="space-y-2">
            {ANYANG_PLACES_DATABASE.filter((p) => p.popular).map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelectAnyangPlace(place, activeField)}
                className="flex w-full items-start gap-3.5 rounded-2xl bg-white border border-slate-200 p-3.5 min-h-[44px] text-left hover:border-blue-300 active:bg-slate-50 transition-all shadow-sm group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0055FF] border border-blue-200 group-hover:scale-105 transition-transform">
                  {getCategoryIcon(place.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-[#0055FF] transition-colors truncate">
                      {place.name}
                    </p>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {place.categoryLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{place.address}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Footer Confirm Button */}
      <div className="border-t border-slate-200 p-5 bg-white">
        <button
          type="button"
          onClick={handleSubmitOptimalRoute}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0055FF] py-4 min-h-[48px] text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Sparkles size={16} />
          <span>
            {subMode === 'loop-distance'
              ? `AI ${targetDistanceKm}km 순환 루트 생성하기`
              : subMode === 'roundtrip-dest'
              ? '왕복 최적 경로 찾기'
              : '최적 경로 찾기'}
          </span>
        </button>
      </div>
    </div>
  );
}
