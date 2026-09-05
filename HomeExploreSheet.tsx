import { useState, useMemo } from 'react';
import {
  MapPin,
  Sparkles,
  Search,
  BookOpen,
  ExternalLink,
  Trophy,
  Landmark,
  ShoppingBag,
  Trees,
  Palette,
  Compass,
  Wind,
  Sun,
  CloudFog,
  ChevronRight,
  Navigation,
  Clock,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { ANYANG_TOUR_DATA, AnyangTourSpot } from '../data/anyangAttractions';
import { WeatherSummary } from '../services/weatherService';

interface HomeExploreSheetProps {
  origin: string;
  weather: WeatherSummary | null;
  riderPosition: { lat: number; lng: number } | null;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectSpot: (spot: AnyangTourSpot) => void;
  onOpenOfficialGuide: () => void;
}

export const TOUR_CATEGORIES = [
  { id: 'all', label: '전체', icon: Compass, count: ANYANG_TOUR_DATA.length },
  { id: 'anyang9', label: '안양 9경', icon: Trophy, count: 9 },
  { id: 'anyang_dong', label: '안양동', icon: Landmark, count: 6 },
  { id: 'pyeongchon_hogye', label: '평촌/호계', icon: ShoppingBag, count: 4 },
  { id: 'bisan_gwanyang', label: '비산/관양', icon: Trees, count: 4 },
  { id: 'seoksu_bakdal', label: '석수/박달', icon: Palette, count: 8 },
];

export type SortCriterion = 'gyeong' | 'distance' | 'weather' | 'name';

const SORT_OPTIONS: { id: SortCriterion; label: string; icon: string }[] = [
  { id: 'gyeong', label: '안양 9경순', icon: '🏆' },
  { id: 'distance', label: '가까운 거리순', icon: '📍' },
  { id: 'weather', label: '오늘 날씨 맞춤순', icon: '🌤️' },
  { id: 'name', label: '이름순', icon: '🔤' },
];

// Calculate Haversine Distance in Kilometers
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Compute Weather-based suitability score & highlight label
function getWeatherRecommendation(spot: AnyangTourSpot, weather: WeatherSummary | null): {
  score: number;
  badge?: string;
  reason?: string;
} {
  if (!weather) {
    if (spot.nineGyeongNumber) return { score: 10 - spot.nineGyeongNumber, badge: '안양 대표 명소' };
    return { score: 0 };
  }

  const isHotOrSunny =
    (weather.temperatureC != null && weather.temperatureC >= 25) ||
    weather.uvLabel === '높음' ||
    weather.uvLabel === '매우높음';
  const isWindy = weather.windSpeedMps != null && weather.windSpeedMps >= 3.5;
  const isDusty = weather.airQualityLabel === '나쁨' || weather.airQualityLabel === '매우나쁨';
  const isClearCalm =
    weather.windSpeedMps != null &&
    weather.windSpeedMps < 3.0 &&
    (weather.airQualityLabel === '좋음' || weather.airQualityLabel === '보통');

  let score = 5;
  let badge: string | undefined;

  // 1. Forest / Shade / Valley spots
  const isShadeForest =
    spot.id === 'anyang9-1' || // 안양예술공원 (계곡/숲)
    spot.id === 'dong-anyang-1' || // 수리산 산림욕장
    spot.id === 'anyang9-6' || // 수리산성지
    spot.id === 'anyang9-8' || // 병목안 시민공원
    spot.tags.some((t) => t.includes('숲') || t.includes('계곡') || t.includes('피톤치드'));

  // 2. Open Waterside / Riverside paths
  const isWaterside =
    spot.id === 'anyang9-2' || // 안양천
    spot.id === 'anyang9-9' || // 만안교
    spot.id === 'dong-bisan-1' || // 학의천
    spot.tags.some((t) => t.includes('천') || t.includes('수변'));

  // 3. Indoor Art / Museum spots
  const isIndoor =
    spot.id === 'dong-anyang-2' || // 안양아트센터
    spot.id === 'dong-seoksu-1' || // 김중업건축박물관
    spot.id === 'dong-seoksu-2' || // 안양박물관
    spot.id === 'dong-pyeongchon-1'; // 평촌아트홀

  // 4. Sunset / Viewpoint spots
  const isViewpoint = spot.id === 'anyang9-4'; // 망해암 일몰

  if (isDusty) {
    if (isIndoor) {
      score += 15;
      badge = '🏛️ 미세먼지 안심 실내 코스';
    } else if (isShadeForest) {
      score += 8;
      badge = '🌲 맑은 피톤치드 숲속길';
    }
  } else if (isHotOrSunny) {
    if (isShadeForest) {
      score += 18;
      badge = '🌿 시원한 계곡 & 숲 그늘 코스';
    } else if (isIndoor) {
      score += 12;
      badge = '❄️ 쾌적한 실내 문화 쉼터';
    } else if (isWaterside) {
      score += 6;
      badge = '💦 시원한 수변 바람 코스';
    }
  } else if (isWindy) {
    if (isShadeForest || isIndoor) {
      score += 14;
      badge = '🛡️ 맞바람 적은 숲/도심 코스';
    } else {
      score -= 2;
    }
  } else if (isClearCalm) {
    if (isWaterside) {
      score += 16;
      badge = '🚴 바람 없는 쾌속 수변 코스';
    } else if (isViewpoint) {
      score += 15;
      badge = '🌅 노을 감상 최고 전망 코스';
    } else if (spot.nineGyeongNumber) {
      score += 12;
      badge = '✨ 맑은 날 최적 라이딩 명소';
    }
  }

  // Baseline boost for 9 Gyeong
  if (spot.nineGyeongNumber) {
    score += (10 - spot.nineGyeongNumber) * 0.5;
  }

  return { score, badge };
}

export default function HomeExploreSheet({
  origin,
  weather,
  riderPosition,
  selectedCategory,
  onSelectCategory,
  onSelectSpot,
  onOpenOfficialGuide,
}: HomeExploreSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCriterion, setSortCriterion] = useState<SortCriterion>('gyeong');

  // Filtered and Sorted Spots
  const processedSpots = useMemo(() => {
    // 1. Filter by category & search query
    const filtered = ANYANG_TOUR_DATA.filter((spot) => {
      const categoryMatch =
        selectedCategory === 'all' ? true : spot.category === selectedCategory;

      if (!categoryMatch) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.trim().toLowerCase();
      return (
        spot.name.toLowerCase().includes(query) ||
        spot.dong.toLowerCase().includes(query) ||
        spot.address.toLowerCase().includes(query) ||
        spot.tags.some((t) => t.toLowerCase().includes(query))
      );
    });

    // 2. Attach distance & weather recommendation
    const enriched = filtered.map((spot) => {
      let distanceKm: number | null = null;
      if (riderPosition) {
        distanceKm = calculateDistanceKm(
          riderPosition.lat,
          riderPosition.lng,
          spot.lat,
          spot.lng
        );
      }
      const weatherRec = getWeatherRecommendation(spot, weather);
      return {
        ...spot,
        distanceKm,
        weatherScore: weatherRec.score,
        weatherBadge: weatherRec.badge,
      };
    });

    // 3. Sort based on user selected criterion
    enriched.sort((a, b) => {
      if (sortCriterion === 'gyeong') {
        // Anyang 9 Gyeong first (1 -> 9), then other spots by ID
        const aNum = a.nineGyeongNumber ?? 999;
        const bNum = b.nineGyeongNumber ?? 999;
        if (aNum !== bNum) return aNum - bNum;
        return a.name.localeCompare(b.name, 'ko');
      }

      if (sortCriterion === 'distance') {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      }

      if (sortCriterion === 'weather') {
        return b.weatherScore - a.weatherScore;
      }

      if (sortCriterion === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      }

      return 0;
    });

    return enriched;
  }, [selectedCategory, searchQuery, sortCriterion, riderPosition, weather]);

  const temp = weather?.temperatureC != null ? `${Math.round(weather.temperatureC)}°C` : '21°C';
  const windSpd = weather?.windSpeedMps != null ? `${weather.windSpeedMps.toFixed(1)}m/s` : '1.8m/s';
  const windDir = weather?.windDirection || '남서풍';
  const airQual = weather?.airQualityLabel || '좋음';
  const uvVal = weather?.uvLabel || '보통';

  return (
    <div className="px-4 pb-6 pt-1 text-slate-900 space-y-3.5 max-h-[66vh] overflow-y-auto hide-scrollbar">
      
      {/* ── 1. Vibrant Live Cycling Weather & AI Coaching Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0055FF] via-[#0048D9] to-[#0A2E8A] p-4 text-white shadow-lg border border-blue-400/30">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-cyan-400/15 blur-xl pointer-events-none" />

        {/* Top Header: Location + Live Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
              <MapPin size={13} className="text-white" />
            </div>
            <p className="text-xs font-black text-white/95 truncate">
              {origin || '경기도 안양시 안양천로'}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>실시간 라이딩 기상</span>
          </div>
        </div>

        {/* Middle: Main Temperature + Essential 4 Cycling Metrics */}
        <div className="relative z-10 mt-3 flex items-center gap-3">
          <div className="flex flex-col justify-center shrink-0 border-r border-white/20 pr-3">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
                {temp}
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-200 mt-0.5">
              {weather?.skyLabel || '맑음 / 라이딩 최적'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 flex-1">
            <div className="flex flex-col items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/15 p-1.5 text-center">
              <div className="flex items-center gap-0.5 text-blue-200">
                <Wind size={12} className="text-cyan-300" />
                <span className="text-[9px] font-bold">풍속</span>
              </div>
              <span className="text-[11px] font-black text-white mt-0.5">{windSpd}</span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/15 p-1.5 text-center">
              <div className="flex items-center gap-0.5 text-blue-200">
                <Compass size={12} className="text-amber-300" />
                <span className="text-[9px] font-bold">풍향</span>
              </div>
              <span className="text-[10px] font-black text-white mt-0.5 truncate max-w-[42px]">{windDir}</span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/15 p-1.5 text-center">
              <div className="flex items-center gap-0.5 text-blue-200">
                <CloudFog size={12} className="text-emerald-300" />
                <span className="text-[9px] font-bold">미세</span>
              </div>
              <span className="text-[11px] font-black text-white mt-0.5">{airQual}</span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/15 p-1.5 text-center">
              <div className="flex items-center gap-0.5 text-blue-200">
                <Sun size={12} className="text-amber-300" />
                <span className="text-[9px] font-bold">자외선</span>
              </div>
              <span className="text-[11px] font-black text-white mt-0.5">{uvVal}</span>
            </div>
          </div>
        </div>

        {/* AI Cycling Coach Insight Box */}
        <div className="relative z-10 mt-3 rounded-xl bg-white/95 text-slate-900 p-2.5 shadow-md border border-white flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0055FF] text-white shadow-xs mt-0.5">
            <Sparkles size={14} className="text-amber-300 animate-spin-slow" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#0055FF] tracking-wider uppercase flex items-center gap-1">
                <Compass size={12} />
                AI 라이딩 코치 맞춤 분석
              </span>
              <span className="text-[9px] font-semibold text-slate-400">실시간 조언</span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-1 leading-relaxed break-keep">
              {weather?.summary ||
                '현재 안양천 일대는 풍속 1.8m/s로 라이딩하기 쾌적합니다. 낮 시간대 자외선에 대비해 썬크림과 충분한 수분을 준비하세요!'}
            </p>
          </div>
        </div>

      </div>

      {/* ── 2. Search & Category Chips ── */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="명소 또는 동 검색 (예: 안양예술공원, 만안교)"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-7 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#0055FF] focus:outline-none shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
          {TOUR_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComp = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#0055FF] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <IconComp size={13} className={isSelected ? 'text-white' : 'text-slate-500'} />
                <span>{cat.label}</span>
                <span className={`text-[10px] ml-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Sort Options Bar (9경순 / 거리순 / 날씨맞춤순 / 가나다순) ── */}
      <div className="rounded-xl bg-slate-100/90 p-1 border border-slate-200/80">
        <div className="flex items-center justify-between px-1.5 pb-1">
          <div className="flex items-center gap-1 text-[10px] font-black text-slate-600">
            <ArrowUpDown size={11} className="text-[#0055FF]" />
            <span>탐색 정렬 기준</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400">
            {sortCriterion === 'gyeong' && '제1경 ~ 제9경 순서'}
            {sortCriterion === 'distance' && '내 GPS 위치 기준 거리'}
            {sortCriterion === 'weather' && '오늘 기온·풍속·자외선 맞춤'}
            {sortCriterion === 'name' && '가나다순'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortCriterion === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortCriterion(opt.id)}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 text-[10.5px] font-black transition-all ${
                  isActive
                    ? 'bg-white text-[#0055FF] shadow-xs border border-blue-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{opt.icon}</span>
                <span className="truncate">{opt.label.replace('순', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Rich Photo Tour Spot Cards with Distance & Weather Badges ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-slate-900">추천 라이딩 명소</h3>
            <span className="rounded-full bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[10px] font-bold">
              {processedSpots.length}곳
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">카드 터치 시 상세 가이드</span>
        </div>

        {processedSpots.length > 0 ? (
          <div className="space-y-2">
            {processedSpots.map((spot) => {
              const is9Gyeong = !!spot.nineGyeongNumber;
              const distText = spot.distanceKm != null
                ? spot.distanceKm < 1
                  ? `${Math.round(spot.distanceKm * 1000)}m`
                  : `${spot.distanceKm.toFixed(1)}km`
                : null;
              const estMinutes = spot.distanceKm != null ? Math.max(1, Math.round((spot.distanceKm / 15) * 60)) : null;

              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => onSelectSpot(spot)}
                  className="w-full flex items-stretch gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 text-left shadow-xs hover:border-[#0055FF]/40 hover:bg-blue-50/10 active:scale-[0.99] transition-all group"
                >
                  {/* Photo Thumbnail with Badge Overlay */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80">
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {is9Gyeong ? (
                      <div className="absolute top-1.5 left-1.5 rounded-lg bg-amber-500/95 text-slate-950 font-black text-[9px] px-1.5 py-0.5 shadow-sm backdrop-blur-xs flex items-center gap-0.5">
                        <Trophy size={10} strokeWidth={3} />
                        <span>제{spot.nineGyeongNumber}경</span>
                      </div>
                    ) : (
                      <div className="absolute top-1.5 left-1.5 rounded-lg bg-slate-900/80 text-white font-bold text-[9px] px-1.5 py-0.5 shadow-sm backdrop-blur-xs">
                        {spot.dong}
                      </div>
                    )}

                    {/* Distance Badge on Photo if available (bottom left) */}
                    {distText && (
                      <div className="absolute bottom-1 left-1 rounded-md bg-slate-900/85 text-white font-black text-[8px] px-1.5 py-0.5 shadow-sm backdrop-blur-xs flex items-center gap-0.5 z-10">
                        <Navigation size={8} className="text-[#0055FF]" />
                        <span>{distText}</span>
                      </div>
                    )}

                    {/* Official Image Attribution Label (bottom right) */}
                    <div className="absolute bottom-1 right-1 rounded bg-black/65 text-white/95 font-semibold text-[7.5px] px-1 py-0.5 backdrop-blur-xs shadow-xs tracking-tight z-10">
                      출처: 안양시청
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {is9Gyeong ? (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                            안양 9경 · 제{spot.nineGyeongNumber}경
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                            {spot.categoryLabel}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-400">
                          {spot.dong}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-0.5 group-hover:text-[#0055FF] transition-colors truncate">
                        {spot.name}
                      </h4>

                      {/* Weather recommendation badge or AI Summary */}
                      {spot.weatherBadge ? (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50/90 border border-blue-150 px-1.5 py-0.5 rounded-md w-fit max-w-full truncate">
                          <Sparkles size={11} className="text-[#0055FF] shrink-0" />
                          <span className="truncate">{spot.weatherBadge}</span>
                        </div>
                      ) : null}

                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-snug">
                        {spot.aiSummary || spot.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Distance ETA */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {distText && estMinutes ? (
                          <span className="text-[10px] font-bold text-[#0055FF] bg-blue-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Clock size={10} />
                            <span>자전거 {estMinutes}분 ({distText})</span>
                          </span>
                        ) : (
                          spot.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[100px]"
                            >
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                      <span className="flex items-center text-[10px] font-bold text-[#0055FF] shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
                        상세보기 <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-slate-50">
            <p className="text-xs font-bold text-slate-600">검색된 명소가 없습니다.</p>
            <p className="mt-0.5 text-[10px] text-slate-400">다른 키워드나 카테고리를 선택해 보세요.</p>
          </div>
        )}
      </div>

      {/* ── 5. Compact Official Links ── */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onOpenOfficialGuide}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-2 text-center text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 active:scale-98 transition-all"
        >
          <BookOpen size={13} className="text-[#0055FF]" />
          <span>공식 자전거 노선 안내</span>
        </button>

        <a
          href="https://www.anyang.go.kr/tour/index.do"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 rounded-xl bg-slate-100 border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-98 transition-all"
        >
          <span>문화관광</span>
          <ExternalLink size={12} className="text-slate-500" />
        </a>
      </div>
    </div>
  );
}
