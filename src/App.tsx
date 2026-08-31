import { useState, useEffect, useRef, type TouchEvent } from 'react';
import {
  Compass,
  Navigation,
  PenLine,
  User,
  X,
  Mail,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  BookOpen,
  RotateCcw,
  TreePine,
  ShieldCheck,
  Zap,
  Info,
  Footprints,
  AlertTriangle,
  ShieldAlert,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Flag,
  MapPin,
} from 'lucide-react';

import {
  AppState,
  TabType,
  RouteType,
  RouteSearchParams,
  FilterCategory,
  POICategory,
  Course,
  Facility,
  RidingRecord,
  UserPreferences,
  RampAccessPoint,
  NavStep,
  CommunityReport,
} from './types';

import { FILTER_TAGS, COURSE_DATA, ANYANG_CENTER, OFFICIAL_STREAM_LINES } from './data/courses';
import { ANYANG_FACILITIES } from './data/facilities';
import { ANYANG_CROSSWALKS, CrosswalkInfo } from './data/crosswalkData';
import { INITIAL_COMMUNITY_REPORTS } from './data/reports';
import {
  createFacilityOptimalRoute,
  createCustomOptimalRoute,
  createLoopRouteByDistance,
  fetchCustomOptimalRouteAsync,
  getCurrentTimeString,
  getCalculatedArrivalTime,
} from './utils/routeUtils';
import { coordToAddress, geocodeFacilityLocation, refineFacilitySearchKeyword, Coordinates } from './services/kakaoService';
import { getBearing, getPointToPolylineDistanceMeters } from './utils/navigationMath';
import MapComponent from './components/MapComponent';
import NavigationHeader from './components/NavigationHeader';
import NavigationInfoSheet from './components/NavigationInfoSheet';
import QuickReportModal from './components/QuickReportModal';
import RideSummaryModal from './components/RideSummaryModal';
import DepartureTimeModal from './components/DepartureTimeModal';
import FacilityDetailModal from './components/FacilityDetailModal';
import { fetchKmaWeather, type WeatherSummary } from './services/weatherService';
import OfficialBicycleMapModal from './components/OfficialBicycleMapModal';
import AllCoursesModal from './components/AllCoursesModal';
import RecordTab from './components/RecordTab';
import FacilitiesTab from './components/FacilitiesTab';
import ProfileTab from './components/ProfileTab';

/* ─── Sub-components for Sheets ─── */
function FilterTags({
  active,
  onSelect,
}: {
  active: FilterCategory;
  onSelect: (tag: FilterCategory) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      {FILTER_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelect(tag)}
          className={`shrink-0 rounded-xl px-4 py-2 min-h-[44px] text-xs font-bold whitespace-nowrap transition-all ${
            active === tag
              ? 'bg-[#0055FF] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 active:bg-slate-300'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

function CongestionBar({ level = 1 }: { level?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-500 font-bold">도로 혼잡도</span>
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-6 rounded-full bg-emerald-500 shadow-xs"></div>
        <div className="h-2.5 w-6 rounded-full bg-emerald-100"></div>
        <div className="h-2.5 w-6 rounded-full bg-emerald-100"></div>
        <span className="text-xs font-bold text-emerald-600 ml-1">원활</span>
      </div>
    </div>
  );
}

function PathTypeBar({
  riverPathRatio,
  segregatedRatio,
  unsegregatedRatio,
  dedicatedBikeRatio = 0,
  sharedBikeRatio = 0,
  sidewalkRatio = 0,
  legacyBikePath = 0,
  legacyRoad = 0,
  legacySidewalk = 0,
}: {
  riverPathRatio?: number;
  segregatedRatio?: number;
  unsegregatedRatio?: number;
  dedicatedBikeRatio?: number;
  sharedBikeRatio?: number;
  sidewalkRatio?: number;
  legacyBikePath?: number;
  legacyRoad?: number;
  legacySidewalk?: number;
}) {
  // Determine breakdown ratios
  let river = riverPathRatio;
  let segregated = segregatedRatio;
  let unsegregated = unsegregatedRatio;

  if (river === undefined || segregated === undefined || unsegregated === undefined) {
    const ded = dedicatedBikeRatio > 0 ? dedicatedBikeRatio : legacyBikePath || 85;
    const sha = sharedBikeRatio > 0 ? sharedBikeRatio : legacyRoad || 10;
    const sw = sidewalkRatio > 0 ? sidewalkRatio : legacySidewalk || 5;

    river = Math.round(ded * 0.88);
    segregated = Math.round(ded * 0.12) + Math.round(sha * 0.7);
    unsegregated = Math.max(1, 100 - river - segregated);
  }

  // Normalize sum to 100
  const sum = river + segregated + unsegregated;
  if (sum !== 100 && sum > 0) {
    unsegregated += (100 - sum);
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      {/* Header with Official Badge */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Info size={14} className="text-[#0055FF]" />
          <span className="text-xs font-bold text-slate-800">
            자전거 도로 유형별 비율 안내
          </span>
          <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-[#0055FF]">
            고시도면 기준
          </span>
        </div>
        <span className="text-[11px] font-extrabold text-slate-700">
          총 100%
        </span>
      </div>

      {/* Visual Percentage Stacked Bar (Red, Navy, Sky Blue) */}
      <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner border border-slate-200/80 p-0.5">
        {river > 0 && (
          <div
            className="h-full rounded-l-full bg-[#EF4444] transition-all"
            style={{ width: `${river}%` }}
            title={`하천변 도로: ${river}%`}
          />
        )}
        {segregated > 0 && (
          <div
            className="h-full bg-[#1E3A8A] transition-all"
            style={{ width: `${segregated}%` }}
            title={`분리도로: ${segregated}%`}
          />
        )}
        {unsegregated > 0 && (
          <div
            className="h-full rounded-r-full bg-[#38BDF8] transition-all"
            style={{ width: `${unsegregated}%` }}
            title={`비분리도로: ${unsegregated}%`}
          />
        )}
      </div>

      {/* Detailed 3-Column Legend with Official Colors & Meaning */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {/* 1. 하천변 도로 (빨간색 - Red) */}
        <div className="flex flex-col items-center rounded-xl bg-red-50/70 border border-red-200/80 p-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shrink-0 shadow-xs" />
            <span className="text-[11px] font-bold text-red-900">하천변 도로</span>
          </div>
          <span className="text-sm font-black text-[#EF4444] mt-0.5">
            {river}%
          </span>
          <span className="text-[9px] text-red-700 font-medium leading-tight mt-0.5">
            수변 전용 자전거길
          </span>
        </div>

        {/* 2. 분리도로 (남색 - Navy) */}
        <div className="flex flex-col items-center rounded-xl bg-blue-50/80 border border-blue-900/20 p-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A] shrink-0 shadow-xs" />
            <span className="text-[11px] font-bold text-[#1E3A8A]">분리도로</span>
          </div>
          <span className="text-sm font-black text-[#1E3A8A] mt-0.5">
            {segregated}%
          </span>
          <span className="text-[9px] text-blue-900 font-medium leading-tight mt-0.5">
            보·차도 완전 분리
          </span>
        </div>

        {/* 3. 비분리도로 (하늘색 - Sky Blue) */}
        <div className="flex flex-col items-center rounded-xl bg-sky-50/80 border border-sky-200 p-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shrink-0 shadow-xs" />
            <span className="text-[11px] font-bold text-sky-900">비분리도로</span>
          </div>
          <span className="text-sm font-black text-[#0284C7] mt-0.5">
            {unsegregated}%
          </span>
          <span className="text-[9px] text-sky-800 font-medium leading-tight mt-0.5">
            보행자 겸용 서행로
          </span>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-500 text-center leading-relaxed">
        * 안양시 자전거도로 노선지정 고시도면 기준: 
        <span className="font-semibold text-red-600 ml-1">🔴 하천변</span> · 
        <span className="font-semibold text-[#1E3A8A] ml-1">🔵 분리도로</span> · 
        <span className="font-semibold text-sky-600 ml-1">🔷 비분리도로</span>
      </p>
    </div>
  );
}

function BottomNav({
  active = 'home',
  onChangeTab,
}: {
  active: TabType;
  onChangeTab: (tab: TabType) => void;
}) {
  const items: Array<{ id: TabType; icon: any; label: string }> = [
    { id: 'record', icon: Compass, label: '주행기록' },
    { id: 'home', icon: PenLine, label: '메인' },
    { id: 'facilities', icon: Mail, label: '편의시설' },
    { id: 'profile', icon: User, label: '내 설정' },
  ];
  return (
    <nav className="flex h-16 shrink-0 items-center justify-around border-t border-slate-200 bg-white shadow-lg">
      {items.map(({ id, icon: Icon, label }) => {
        const isSelected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChangeTab(id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 min-h-[48px] transition-all ${
              isSelected ? 'text-[#0055FF] font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={isSelected ? 'relative' : ''}>
              <Icon size={21} strokeWidth={isSelected ? 2.5 : 1.9} />
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
              )}
            </div>
            <span className="text-[11px] tracking-tight">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function HomeSummarySheet({
  origin,
  weather,
  onOpenOfficialGuide,
}: {
  origin: string;
  weather: WeatherSummary | null;
  onOpenOfficialGuide: () => void;
}) {
  return (
    <div className="px-4 pb-5 pt-2 text-slate-900">
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <MapPin size={12} className="text-[#0055FF]" />
            현재 위치
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
            실시간
          </span>
        </div>
        <p className="text-lg font-black text-slate-900">{origin || '성동구 응봉동'}</p>
        <p className="mt-1 text-[11px] text-slate-500">풍속/풍향 · 미세먼지 · 자외선까지 한 번에 확인</p>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-2">
        {[
          { label: '풍속', value: weather?.windSpeedMps != null ? `${weather.windSpeedMps.toFixed(1)}m/s` : '—', icon: '💨', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
          { label: '풍향', value: weather?.windDirection || '—', icon: '🧭', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
          { label: '미세먼지', value: weather?.airQualityLabel || '—', icon: '🌫️', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: '자외선', value: weather?.uvLabel || '—', icon: '☀️', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-2 text-center ${item.tone}`}>
            <div className="text-lg leading-none">{item.icon}</div>
            <div className="mt-1 text-[9px] font-bold">{item.label}</div>
            <div className="mt-0.5 text-[11px] font-black">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 p-3.5 shadow-sm">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black text-[#0055FF]">
          <Sparkles size={13} />
          AI 요약
        </div>
        <p className="text-sm leading-6 text-slate-800">
          {weather?.summary || '현재 날씨 정보를 불러오고 있습니다.'}
        </p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:bg-slate-50 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0055FF] text-white shadow-sm">
              <Navigation size={16} fill="currentColor" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">안양시 가기 좋은 장소 추천</p>
              <p className="mt-0.5 text-[11px] text-slate-600 truncate">안양천 힐링코스</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={onOpenOfficialGuide}
          className="flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-left shadow-sm hover:bg-blue-100 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0055FF] text-white shadow-sm">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">안양시 나들이 지도</p>
              <p className="mt-0.5 text-[11px] text-slate-700 truncate">GPS 기반 · 안양 8경, 갈만한 곳 추천</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500 shrink-0" />
        </button>
      </div>
    </div>
  );
}

function StepIconRenderer({ iconType, warn }: { iconType: string; warn?: boolean }) {
  switch (iconType) {
    case 'crosswalk':
      return <Footprints size={18} className="text-amber-500 shrink-0" />;
    case 'left':
      return <ArrowLeft size={18} className={warn ? 'text-amber-500 shrink-0' : 'text-[#0055FF] shrink-0'} />;
    case 'right':
      return <ArrowRight size={18} className={warn ? 'text-amber-500 shrink-0' : 'text-[#0055FF] shrink-0'} />;
    case 'u-turn':
      return <RotateCcw size={18} className="text-[#E11D48] shrink-0" />;
    case 'arrive':
      return <Flag size={18} className="text-[#10B981] shrink-0" />;
    case 'up':
    default:
      return <ArrowUp size={18} className="text-[#0055FF] shrink-0" />;
  }
}

function CourseSelectedSheet({
  course,
  departureTime,
  onStart,
  onClose,
  onOpenDepartureModal,
  onSelectFilter,
  activeFilter,
}: {
  course: Course;
  departureTime: string;
  onStart: () => void;
  onClose: () => void;
  onOpenDepartureModal: () => void;
  onSelectFilter: (tag: FilterCategory) => void;
  activeFilter: FilterCategory;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const touchStartY = useRef<number | null>(null);

  // Crosswalks on this route
  const crosswalkSteps = course.navSteps.filter((s) => s.iconType === 'crosswalk' || s.crosswalkInfo);

  // Swipe / Drag handling
  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStartY.current - currentY;
    if (diff > 40) {
      setIsExpanded(true); // Swiped up
    } else if (diff < -40) {
      setIsExpanded(false); // Swiped down
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  return (
    <div
      className="text-slate-900 transition-all duration-300"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Drag Handle & Mini Header Bar (Always Visible) ── */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 pt-3 pb-2 cursor-pointer group flex flex-col items-center select-none"
      >
        <div className="h-1.5 w-12 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors" />
        <div className="w-full flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#0055FF] leading-none">{course.timeMinutes}</span>
              <span className="text-sm font-bold text-slate-800">분</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="text-xs font-bold text-slate-600">
              <span>{course.distanceKm}km</span>
              <span className="mx-1 text-slate-300">·</span>
              <span className="text-slate-500">도착 {course.arrival}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#0055FF] flex items-center gap-0.5 transition-colors">
              {isExpanded ? (
                <>
                  <ChevronDown size={14} /> 접기
                </>
              ) : (
                <>
                  <ChevronUp size={14} /> 상세 정보
                </>
              )}
            </span>
          </div>
        </div>

        {/* Swipe Up Visual Hint if collapsed */}
        {!isExpanded && (
          <div className="w-full mt-1 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-0.5 rounded-full">
              <ChevronUp size={11} className="text-[#0055FF] animate-bounce" /> 위로 올려서 횡단보도 & 도로 정보 보기
            </span>
          </div>
        )}
      </div>

      {/* Primary Action Buttons (Always Visible) */}
      <div className="px-5 pb-3 pt-1 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300 min-h-[44px] transition-colors"
        >
          경로 취소
        </button>
        <button
          type="button"
          onClick={onStart}
          className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-[#0055FF] py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-98 min-h-[44px] transition-all"
        >
          <Navigation size={15} fill="currentColor" />
          <span>자전거 안내 시작</span>
        </button>
      </div>

      {/* ── Expanded Full Details View (Scrollable) ── */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 max-h-[58vh] overflow-y-auto hide-scrollbar space-y-3.5 border-t border-slate-200/80 mt-1 animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* 1. In-Sheet Filter Category Chips (경치 좋은, 평지 중심 등 키워드) */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
            <p className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-[#0055FF]" />
              추천 경로 키워드 선택
            </p>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
              {FILTER_TAGS.map((tag) => {
                const isSelected = activeFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectFilter(tag)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 min-h-[34px] text-[11px] font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-[#0055FF] text-white shadow-sm scale-[1.02]'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tag === '추천 코스' && '✨ '}
                    {tag === '경치 좋은' && '🌳 '}
                    {tag === '평지 중심' && '🌿 '}
                    {tag === '단거리' && '⚡ '}
                    {tag === '계단 없음' && '🛡️ '}
                    {tag === '낮은 혼잡도' && '🧘 '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Course Description & Scenic Highlights */}
          <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-3">
            <p className="text-xs text-slate-700 leading-relaxed">{course.description}</p>
            {course.scenicHighlights && course.scenicHighlights.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                  <TreePine size={11} /> 주요 경치:
                </span>
                {course.scenicHighlights.map((spot, idx) => (
                  <span
                    key={idx}
                    className="bg-amber-100/70 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                  >
                    {spot}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 3. Road Composition Stacked Bar (안양시 자전거도로 노선지정 고시 기준) */}
          <PathTypeBar
            riverPathRatio={course.riverPathRatio}
            segregatedRatio={course.segregatedRatio}
            unsegregatedRatio={course.unsegregatedRatio}
            dedicatedBikeRatio={course.dedicatedBikeRatio}
            sharedBikeRatio={course.sharedBikeRatio}
            sidewalkRatio={course.sidewalkRatio}
            legacyBikePath={course.bikePath}
            legacyRoad={course.road}
            legacySidewalk={course.sidewalk}
          />

          {/* 4. Crosswalk Safety & Actual Data Card (첨부된 안양시 횡단보도 실측 데이터) */}
          <div className="rounded-2xl bg-amber-50/60 border border-amber-200 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Footprints size={14} className="text-amber-600" />
                안양시 횡단보도 실측 안전 정보
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                자전거 하차 보행 구간
              </span>
            </div>

            <div className="space-y-1.5 mb-2">
              {crosswalkSteps.length > 0 ? (
                crosswalkSteps.map((cw, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white/80 border border-amber-200/80 p-2 rounded-xl text-[11px]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 font-black text-[10px]">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800">
                        {cw.crosswalkInfo ? `${cw.crosswalkInfo.dong} 횡단보도` : cw.text}
                      </p>
                      {cw.crosswalkInfo && (
                        <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                          실측 규격: 폭 {cw.crosswalkInfo.widthM}m · 길이 {cw.crosswalkInfo.lengthM}m ({cw.crosswalkInfo.roadName || '주요 접속로'})
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/80 border border-amber-200/80 p-2 rounded-xl text-[11px] text-slate-700">
                  <p className="font-bold text-slate-800">안양천·학의천 수변 전용로 (횡단보도 0개 구간)</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    전구간 하천 무신호 직통로로 보행자 및 횡단보도 간섭 없이 안전하게 주행 가능합니다.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-amber-800 flex items-center gap-1 font-medium">
              <AlertTriangle size={11} className="shrink-0 text-amber-600" />
              도로교통법상 횡단보도 통과 시에는 반드시 자전거에서 내려 보행자로 건너야 합니다.
            </p>
          </div>

          {/* 5. Statistics Grid (Slope, Stairs, Calories) */}
          <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-500">평균 경사도</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">{course.slope}</p>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[10px] font-bold text-slate-500">예상 소모</span>
              <p className="text-sm font-black text-[#0055FF] mt-0.5">{course.calories} kcal</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500">계단 유무</span>
              <p className="text-sm font-black text-emerald-600 mt-0.5">{course.stairs === 0 ? '0개 (무장애)' : `${course.stairs}개`}</p>
            </div>
          </div>

          {/* 6. Navigation Turn-by-Turn Steps */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
            <p className="text-xs font-bold text-slate-800 mb-2.5 flex items-center justify-between">
              <span>구간별 경로 상세 안내</span>
              <span className="text-[10px] text-slate-500 font-semibold">총 {course.navSteps.length}개 스텝</span>
            </p>

            <div className="space-y-2">
              {course.navSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-white border border-slate-200/80 p-2.5 rounded-xl">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 mt-0.5">
                    <StepIconRenderer iconType={step.iconType} warn={step.warn} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 truncate">{step.text}</p>
                      {step.distanceMeter > 0 && (
                        <span className="text-[10px] font-bold text-[#0055FF] shrink-0">{step.distanceMeter}m</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Live Departure & Arrival Time Indicator */}
          <div
            onClick={onOpenDepartureModal}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100 active:scale-[0.99] transition-all min-h-[44px]"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Clock size={15} className="text-[#0055FF]" />
              <span>출발 {departureTime} 기준 (실시간 동기화)</span>
            </div>
            <span className="text-sm font-bold text-slate-900">
              도착 예정: <span className="text-[#0055FF] font-bold">{course.arrival}</span>
            </span>
          </div>

        </div>
      )}
    </div>
  );
}

/* ─── Main App Component ─── */
export default function App() {
  // Navigation & Screen states
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Route & Course selection
  const [origin, setOrigin] = useState('내 현재 위치');
  const [destination, setDestination] = useState('');
  const [routeType, setRouteType] = useState<RouteType>('oneway');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('추천 코스');
  const [selectedCourse, setSelectedCourse] = useState<Course>(COURSE_DATA['추천 코스']);
  const [departureTime, setDepartureTime] = useState<string>(getCurrentTimeString());

  // Active POI Filter toggles (e.g. water, repair, restroom, parking, cafe)
  const [activePoiFilters, setActivePoiFilters] = useState<POICategory[]>([]);

  // Modals
  const [isDepartureModalOpen, setIsDepartureModalOpen] = useState(false);
  const [isOfficialGuideOpen, setIsOfficialGuideOpen] = useState(false);
  const [isAllCoursesOpen, setIsAllCoursesOpen] = useState(false);
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [selectedFacilityDetail, setSelectedFacilityDetail] = useState<Facility | null>(null);
  const [finishedRideRecord, setFinishedRideRecord] = useState<RidingRecord | null>(null);
  const [isRideSummaryOpen, setIsRideSummaryOpen] = useState(false);

  // Real-time Community Reports state
  const [reports, setReports] = useState<CommunityReport[]>(INITIAL_COMMUNITY_REPORTS);
  const [reportCoordinates, setReportCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [routeWarning, setRouteWarning] = useState<CommunityReport | null>(null);
  const [warningRouteKey, setWarningRouteKey] = useState<string | null>(null);
  const [activeRouteEndpoints, setActiveRouteEndpoints] = useState<{
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  } | null>(null);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const lastTriggeredReportIdRef = useRef<string | null>(null);

  const handleAddReport = (newRep: CommunityReport) => {
    const fallbackPoint = riderPosition || (selectedCourse.path[0]
      ? { lat: selectedCourse.path[0][0], lng: selectedCourse.path[0][1] }
      : undefined);
    const reportWithCoordinates = newRep.coordinates
      ? newRep
      : { ...newRep, coordinates: fallbackPoint };
    setReports((prev) => [reportWithCoordinates, ...prev]);
    if (
      appState !== 'idle' &&
      reportWithCoordinates.status === 'active' &&
      reportWithCoordinates.coordinates &&
      getPointToPolylineDistanceMeters(reportWithCoordinates.coordinates, selectedCourse.path) <= 40
    ) {
      setRouteWarning(reportWithCoordinates);
    }
  };

  const checkRouteReports = (path: [number, number][], routeKey: string) => {
    const nearbyReport = reports.find((report) =>
      report.status === 'active' && report.coordinates &&
      getPointToPolylineDistanceMeters(report.coordinates, path) <= 40
    );
    if (nearbyReport && warningRouteKey !== routeKey) {
      setWarningRouteKey(routeKey);
      setRouteWarning(nearbyReport);
    }
  };

  const handleSelectReport = (report: CommunityReport) => {
    if (
      appState !== 'idle' &&
      report.status === 'active' &&
      report.coordinates &&
      getPointToPolylineDistanceMeters(report.coordinates, selectedCourse.path) <= 40
    ) {
      setRouteWarning(report);
    }
  };

  const rerouteAroundReport = (report: CommunityReport) => {
    if (!report.coordinates || !activeRouteEndpoints) return;
    setRouteWarning(null);
    Promise.all([
      fetchCustomOptimalRouteAsync(selectedCourse.startPoint, activeRouteEndpoints.origin, destination, activeRouteEndpoints.destination, routeType, activeFilter, report.coordinates, 1),
      fetchCustomOptimalRouteAsync(selectedCourse.startPoint, activeRouteEndpoints.origin, destination, activeRouteEndpoints.destination, routeType, activeFilter, report.coordinates, -1),
    ])
      .then(([firstRoute, secondRoute]) => {
        const firstDistance = getPointToPolylineDistanceMeters(report.coordinates!, firstRoute.path);
        const secondDistance = getPointToPolylineDistanceMeters(report.coordinates!, secondRoute.path);
        return firstDistance >= secondDistance ? firstRoute : secondRoute;
      })
      .then((reroutedCourse) => {
        setSelectedCourse({
          ...reroutedCourse,
          description: `${reroutedCourse.description} ${report.categoryName} 제보 구간을 피해 실제 자전거도로로 재탐색한 경로입니다.`,
        });
        setRemainingPath(reroutedCourse.path);
        setPassedPath([]);
      })
      .catch((error) => console.warn('Report avoidance route failed:', error));
  };

  const handleToggleLikeReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isLiked = !r.isLiked;
          return {
            ...r,
            likes: isLiked ? r.likes + 1 : r.likes - 1,
            isLiked,
          };
        }
        return r;
      })
    );
  };

  // Panel Collapsible / Expandable (Toggle) states
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);
  const [isRidingSheetExpanded, setIsRidingSheetExpanded] = useState(false); // Navigation Info Sheet default: collapsed

  // Rider position
  const [riderPosition, setRiderPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (appState === 'idle' || !riderPosition || routeWarning) return;
    const nearbyReport = reports.find((report) =>
      report.status === 'active' &&
      report.coordinates &&
      getPointToPolylineDistanceMeters(report.coordinates, [[riderPosition.lat, riderPosition.lng]]) <= 40
    );
    if (!nearbyReport) {
      lastTriggeredReportIdRef.current = null;
    } else if (nearbyReport.id !== lastTriggeredReportIdRef.current) {
      lastTriggeredReportIdRef.current = nearbyReport.id;
      setRouteWarning(nearbyReport);
    }
  }, [appState, riderPosition, reports, routeWarning]);

  const isGeocodedFacility = (facility: Facility) =>
    facility.category === 'restroom' || facility.category === 'parking' || facility.facilityType === '공기주입기';
  const [mappedFacilities, setMappedFacilities] = useState<Facility[]>(ANYANG_FACILITIES);

  // Resolve source addresses to real map coordinates once, then reuse them on later visits.
  useEffect(() => {
    let cancelled = false;
    const cacheKey = 'anyang-facility-coordinates-v9-air-pumps-precise-place-search';
    const targets = ANYANG_FACILITIES.filter(isGeocodedFacility);
    let cached: Record<string, Coordinates> = {};

    try {
      cached = JSON.parse(localStorage.getItem(cacheKey) || '{}') as Record<string, Coordinates>;
    } catch {
      cached = {};
    }

    const applyCoordinates = (coordinates: Record<string, Coordinates>) => {
      if (cancelled) return;
      setMappedFacilities(ANYANG_FACILITIES.map((facility) => ({
        ...facility,
        ...(facility.facilityType === '공기주입기'
          ? (() => {
              const refined = refineFacilitySearchKeyword(facility.name);
              return {
                original: refined.original,
                searchKeyword: refined.searchKeyword,
                detail: refined.detail,
              };
            })()
          : {}),
        ...(coordinates[facility.id] || {}),
      })));
    };

    applyCoordinates(cached);
    // Rebuild coordinates after changing the source dataset or geocoding strategy.
    const pendingFacilities = targets.filter((facility) => !cached[facility.id]);
    if (pendingFacilities.length === 0) return () => { cancelled = true; };

    const resolved = { ...cached };
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < pendingFacilities.length && !cancelled) {
        const facility = pendingFacilities[nextIndex++];
        const refined = facility.facilityType === '공기주입기'
          ? refineFacilitySearchKeyword(facility.name)
          : null;
        const address = facility.roadAddress || facility.address;
        const coordinate = await geocodeFacilityLocation(
          refined?.searchKeyword || facility.name,
          address,
          facility.category === 'parking' || facility.facilityType === '공기주입기',
        );
        if (coordinate) {
          resolved[facility.id] = coordinate;
          try {
            localStorage.setItem(cacheKey, JSON.stringify(resolved));
          } catch {
            // Coordinate caching is optional and must not block map rendering.
          }
          applyCoordinates(resolved);
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    };

    void Promise.all(Array.from({ length: 4 }, () => worker()));
    return () => { cancelled = true; };
  }, []);

  // Real-time navigation & 1st-person tracking states
  const [heading, setHeading] = useState(0);
  const [isHeadingLocked, setIsHeadingLocked] = useState(true);
  const [passedPath, setPassedPath] = useState<[number, number][]>([]);
  const [remainingPath, setRemainingPath] = useState<[number, number][]>([]);
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [navMetrics, setNavMetrics] = useState<{
    currentStep?: NavStep;
    nextStep?: NavStep;
    distanceToNextStepMeter: number;
    totalRemainingDistanceKm: number;
    remainingMinutes: number;
    currentSpeedKmh: number;
  }>({
    distanceToNextStepMeter: 300,
    totalRemainingDistanceKm: 5.8,
    remainingMinutes: 25,
    currentSpeedKmh: 18.5,
  });

  // Riding history records
  const [records, setRecords] = useState<RidingRecord[]>([
    {
      id: 'rec-1',
      date: '2026-08-14 18:30',
      courseName: '안양천-학의천 쌍개울 힐링 순환 코스',
      distanceKm: 5.8,
      durationMinutes: 25,
      avgSpeedKmh: 19.5,
      maxSpeedKmh: 28.0,
      calories: 220,
      elevationM: 27,
      path: COURSE_DATA['추천 코스'].path,
    },
    {
      id: 'rec-2',
      date: '2026-08-12 10:15',
      courseName: '학의천 평지 쾌속선 (쌍개울~인덕원교)',
      distanceKm: 4.5,
      durationMinutes: 20,
      avgSpeedKmh: 21.0,
      maxSpeedKmh: 29.5,
      calories: 175,
      elevationM: 20,
      path: COURSE_DATA['평지 중심'].path,
    },
  ]);

  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    avoidStairs: true,
    avoidSteepSlopes: true,
    voiceGuide: true,
    autoReroute: true,
    speedAlert: true,
    ttsVoice: 'female-clear',
    ttsSpeed: 1.0,
    ttsPitch: 1.0,
    themeColor: 'blue',
    fontSize: 'normal',
  });

  // GPS Auto-location on startup & Continuous Live Time Update (10초마다 현재 시각 및 도착 시각 실시간 동기화)
  useEffect(() => {
    const updateTimes = () => {
      const curTime = getCurrentTimeString();
      setDepartureTime(curTime);
      setSelectedCourse((prev) => ({
        ...prev,
        arrival: getCalculatedArrivalTime(prev.timeMinutes, curTime),
      }));
    };

    updateTimes();
    const timer = setInterval(updateTimes, 10000); // 10초마다 자동 갱신

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setRiderPosition({ lat, lng });

          try {
            const address = await coordToAddress(lat, lng);
            if (address && address !== '내 현재 위치') {
              setOrigin(address);
            } else {
              setOrigin('내 현재 위치');
            }
          } catch {
            setOrigin('내 현재 위치');
          }
        },
        async () => {
          setRiderPosition({
            lat: ANYANG_CENTER.lat,
            lng: ANYANG_CENTER.lng,
          });
          setOrigin('내 현재 위치');
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!riderPosition) return;

    let isMounted = true;
    const loadWeather = async () => {
      try {
        const nextWeather = await fetchKmaWeather(riderPosition.lat, riderPosition.lng);
        if (isMounted) setWeather(nextWeather);
      } catch {
        if (isMounted) setWeather(null);
      }
    };

    void loadWeather();
    return () => {
      isMounted = false;
    };
  }, [riderPosition]);

  /* Filter Tag Click */
  const handleFilterSelect = (tag: FilterCategory) => {
    setActiveFilter(tag);
    const course = COURSE_DATA[tag];
    if (course) {
      const curTime = getCurrentTimeString();
      const updatedCourse = {
        ...course,
        arrival: getCalculatedArrivalTime(course.timeMinutes, curTime),
      };
      setSelectedCourse(updatedCourse);
      setAppState('courseSelected');
      setIsBottomSheetOpen(true);
    }
  };

  /* Start Riding action */
  const handleStartRiding = () => {
    setAppState('riding');
    setCurrentTab('home');
    setIsRidingSheetExpanded(false);
    setPassedPath([]);
    setRemainingPath(selectedCourse.path);
    setIsHeadingLocked(true);
    
    // Initialize heading to initial course segment direction
    if (selectedCourse.path && selectedCourse.path.length > 1) {
      const initBearing = getBearing(
        selectedCourse.path[0][0],
        selectedCourse.path[0][1],
        selectedCourse.path[1][0],
        selectedCourse.path[1][1]
      );
      setHeading(initBearing);
      setRiderPosition({ lat: selectedCourse.path[0][0], lng: selectedCourse.path[0][1] });
    } else {
      setHeading(0);
    }

    setNavMetrics({
      currentStep: selectedCourse.navSteps?.[0],
      nextStep: selectedCourse.navSteps?.[1],
      distanceToNextStepMeter: selectedCourse.navSteps?.[0]?.distanceMeter || 300,
      totalRemainingDistanceKm: selectedCourse.distanceKm,
      remainingMinutes: selectedCourse.timeMinutes,
      currentSpeedKmh: 18.5,
    });
  };

  /* Stop / Finish Riding */
  const handleStopRiding = () => {
    setAppState('courseSelected');
  };

  const handleFinishRideComplete = (stats: {
    courseName: string;
    distanceKm: number;
    durationMinutes: number;
    avgSpeedKmh: number;
    maxSpeedKmh: number;
    calories: number;
    elevationM: number;
  }) => {
    const newRecord: RidingRecord = {
      id: `rec-${Date.now()}`,
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      courseName: stats.courseName,
      distanceKm: stats.distanceKm,
      durationMinutes: stats.durationMinutes,
      avgSpeedKmh: stats.avgSpeedKmh,
      maxSpeedKmh: stats.maxSpeedKmh,
      calories: stats.calories,
      elevationM: stats.elevationM,
      path: selectedCourse.path,
    };

    setRecords((prev) => [newRecord, ...prev]);
    setFinishedRideRecord(newRecord);
    setAppState('idle');
    setIsRideSummaryOpen(true);
  };

  /* POI Category Toggle */
  const handleTogglePoiFilter = (category: POICategory) => {
    setActivePoiFilters((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  /* Find My Location (GPS) */
  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert('위치 서비스를 지원하지 않는 브라우저입니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRiderPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setRiderPosition({
          lat: ANYANG_CENTER.lat,
          lng: ANYANG_CENTER.lng,
        });
      },
      { enableHighAccuracy: true }
    );
  };

  /* Close / Reset Route Search completely */
  const handleCloseRouteSearch = () => {
    setDestination('');
    setOrigin('현재 위치 (안양천 중앙광장)');
    setSelectedCourse(COURSE_DATA['추천 코스']);
    setActiveFilter('추천 코스');
    setAppState('idle');
    setIsBottomSheetOpen(false);
  };

  /* Find Optimal Route from Search Modal */
  const handleFindOptimalRoute = async (params: RouteSearchParams) => {
    setOrigin(params.origin);
    setDestination(params.destination);
    setRouteType(params.routeType);

    const startCoords = params.originCoords || riderPosition || ANYANG_CENTER;
    const resolvedDestCoords = params.destinationCoords || await geocodeFacilityLocation('', params.destination);
    const destCoords = resolvedDestCoords || { lat: 37.3943, lng: 126.9568 };
    setActiveRouteEndpoints({ origin: startCoords, destination: destCoords });

    if (params.originCoords) {
      setRiderPosition(params.originCoords);
    }

    if (params.preferredFilter) {
      setActiveFilter(params.preferredFilter);
    }

    if (params.isDistanceLoop) {
      // 1. AI Distance Loop Route (No destination, round-trip back to origin based on selected distance)
      const loopCourse = createLoopRouteByDistance(
        params.origin,
        startCoords,
        params.targetDistanceKm || 10
      );
      setSelectedCourse(loopCourse);
    } else {
      // 2. Point-to-Point Optimal Route: show instant route, then fetch real OSRM road route
      const initialCourse = createCustomOptimalRoute(
        params.origin,
        startCoords,
        params.destination,
        destCoords,
        params.routeType,
        params.preferredFilter
      );
      setSelectedCourse(initialCourse);
      checkRouteReports(initialCourse.path, `${params.origin}|${params.destination}|${Date.now()}`);

      // Asynchronously fetch high-precision real road route & matching turn-by-turn steps
      fetchCustomOptimalRouteAsync(
        params.origin,
        startCoords,
        params.destination,
        destCoords,
        params.routeType,
        params.preferredFilter
      )
        .then((realCourse) => {
          setSelectedCourse(realCourse);
          checkRouteReports(realCourse.path, realCourse.id);
        })
        .catch((err) => {
          console.warn('Real route fetch fallback used:', err);
        });
    }

    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  /* Select Stream Corridor from Official Guide */
  const handleSelectOfficialStream = (streamId: string) => {
    const stream = OFFICIAL_STREAM_LINES.find((s) => s.id === streamId);
    if (!stream) return;

    let targetCourse: Course;
    if (streamId === 'stream-hagui') {
      targetCourse = COURSE_DATA['평지 중심'];
    } else if (streamId === 'stream-samseong') {
      targetCourse = COURSE_DATA['경치 좋은'];
    } else if (streamId === 'stream-sammak') {
      targetCourse = COURSE_DATA['낮은 혼잡도'];
    } else if (streamId === 'urban-simin') {
      targetCourse = COURSE_DATA['단거리'];
    } else {
      targetCourse = COURSE_DATA['추천 코스'];
    }

    const curTime = getCurrentTimeString();
    const updated = {
      ...targetCourse,
      arrival: getCalculatedArrivalTime(targetCourse.timeMinutes, curTime),
    };

    setSelectedCourse(updated);
    setActiveFilter(targetCourse.tag);
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  /* Select Anyang Theme Course from AllCoursesModal */
  const handleSelectThemeCourse = (course: Course) => {
    const curTime = getCurrentTimeString();
    const updated: Course = {
      ...course,
      arrival: getCalculatedArrivalTime(course.timeMinutes, curTime),
    };

    setOrigin(course.startPoint || '출발지');
    setDestination(course.endPoint || course.name);
    setSelectedCourse(updated);
    setActiveFilter(course.tag || '추천 코스');
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  /* Select Ramp Access Point */
  const handleSelectRampPoint = (ramp: RampAccessPoint) => {
    setDestination(ramp.name);
    setSelectedCourse(COURSE_DATA['계단 없음']);
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  /* Navigate to Facility (최적 자전거 루트 자동 생성 및 연결) */
  const handleNavigateToFacility = (fac: Facility) => {
    setDestination(fac.name);
    const startCoords = riderPosition || ANYANG_CENTER;
    const optimalRoute = createFacilityOptimalRoute(startCoords, origin, fac);

    setSelectedCourse(optimalRoute);
    setActiveFilter('단거리');
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
    setSelectedFacilityDetail(null);
  };

  /* Select Record Route */
  const handleSelectRecordRoute = (rec: RidingRecord) => {
    const matched = Object.values(COURSE_DATA).find((c) => c.name === rec.courseName) || COURSE_DATA['추천 코스'];
    setSelectedCourse(matched);
    setActiveFilter(matched.tag);
    setAppState('courseSelected');
    setCurrentTab('home');
    setIsBottomSheetOpen(true);
  };

  const fontScaleClass =
    preferences.fontSize === 'xlarge'
      ? 'text-[1.12rem]'
      : preferences.fontSize === 'large'
      ? 'text-[1.05rem]'
      : '';

  return (
    <div className={`app-scale relative h-[100dvh] w-full overflow-hidden bg-slate-100 select-none ${fontScaleClass}`}>
      {/* Background Radial Dots */}
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      {/* ── Main View Container ── */}
      <div className="relative h-full w-full max-w-md mx-auto bg-slate-50 overflow-hidden flex flex-col shadow-2xl border-x border-slate-200">
        
        {/* ── Map Canvas (Always mounted in Home view) ── */}
        <div className={`relative flex-1 w-full ${currentTab === 'home' ? 'block' : 'hidden'}`}>
          <MapComponent
            center={riderPosition || ANYANG_CENTER}
            routePath={appState !== 'idle' ? selectedCourse.path : undefined}
            passedPath={appState === 'riding' ? passedPath : undefined}
            remainingPath={appState === 'riding' ? remainingPath : undefined}
            heading={heading}
            isHeadingLocked={isHeadingLocked}
            onToggleHeadingLock={() => setIsHeadingLocked((prev) => !prev)}
            riderPosition={riderPosition}
            activePoiFilters={activePoiFilters}
            alwaysVisibleCategories={['restroom']}
            facilities={mappedFacilities}
            onSelectFacility={(fac) => setSelectedFacilityDetail(fac)}
            reports={reports}
            onSelectReport={handleSelectReport}
            onMapClick={(lat, lng) => {
              setReportCoordinates({ lat, lng });
              setIsQuickReportOpen(true);
            }}
            onSelectRampPoint={handleSelectRampPoint}
            onOpenOfficialGuide={() => setIsOfficialGuideOpen(true)}
            isRiding={appState === 'riding'}
            isSheetExpanded={appState === 'riding' ? isRidingSheetExpanded : false}
          />

          {/* ── Top Turn-by-Turn Navigation HUD (Kakao/TMap style) ── */}
          {appState === 'riding' && (
            <NavigationHeader
              currentStep={navMetrics.currentStep || selectedCourse.navSteps?.[0]}
              nextStep={navMetrics.nextStep || selectedCourse.navSteps?.[1]}
              distanceToNextStepMeter={navMetrics.distanceToNextStepMeter}
              totalRemainingDistanceKm={navMetrics.totalRemainingDistanceKm}
              remainingMinutes={navMetrics.remainingMinutes}
              voiceEnabled={voiceEnabled}
              onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
              onStopRide={handleStopRiding}
              isGpsActive={isGpsActive}
              isHeadingLocked={isHeadingLocked}
              onToggleHeadingLock={() => setIsHeadingLocked((prev) => !prev)}
              onOpenQuickReport={() => setIsQuickReportOpen(true)}
            />
          )}

          {/* ── Top Utility Bar (Current location and quick access only) ── */}
          {appState !== 'riding' && (
            <div className="absolute left-0 right-0 top-0 z-30 px-3 pt-3 pointer-events-none">
              <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl bg-white/95 p-2.5 shadow-xl backdrop-blur-xl border border-slate-200">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#0055FF]">
                    <Navigation size={14} fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-400">현재 위치</div>
                    <div className="truncate text-xs font-bold text-slate-800">{origin}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuickReportOpen(true)}
                  className="flex h-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2.5 text-red-600 hover:bg-red-100 active:scale-95 transition-all shrink-0"
                  title="장애물 신고"
                >
                  <ShieldAlert size={13} className="text-red-600" />
                </button>
              </div>
            </div>
          )}

          {/* ── Main Map Quick Hazard & Road Report FAB (메인 지도 신고 아이콘) ── */}
          <button
            type="button"
            onClick={() => setIsQuickReportOpen(true)}
            className={`absolute right-3.5 z-30 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 border border-red-400 text-white shadow-xl hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all duration-300 ${
              appState === 'riding'
                ? 'top-[135px]'
                : isBottomSheetOpen
                ? 'bottom-[355px]'
                : 'bottom-[130px]'
            }`}
            aria-label="장애물/파손/통제 실시간 신고"
            title="주행 중 장애물·파손·통제·공사 현장 빠른 신고"
          >
            <ShieldAlert size={15} className="animate-pulse text-amber-300 shrink-0" />
            <span className="text-xs font-black tracking-tight whitespace-nowrap">위험/통제 신고</span>
          </button>

          {/* ── GPS FAB Button ── */}
          {appState !== 'riding' && (
            <button
              type="button"
              onClick={handleFindMyLocation}
              className={`absolute right-3.5 z-30 flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center rounded-2xl bg-white border border-slate-200 text-[#0055FF] shadow-xl hover:bg-slate-50 active:scale-95 transition-all duration-300 ${
                isBottomSheetOpen ? 'bottom-[300px]' : 'bottom-[75px]'
              }`}
              aria-label="내 위치 찾기 (GPS)"
              title="내 현재 위치로 자동 줌 및 이동"
            >
              <Navigation size={18} fill="currentColor" />
            </button>
          )}

          {/* ── Bottom Sheet (Idle / CourseSelected / Riding) ── */}
          <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col pointer-events-none">
            <div className="pointer-events-auto">
              {appState === 'riding' ? (
                /* Foldable Navigation Info Sheet (Slim mode by default) */
                <NavigationInfoSheet
                  course={selectedCourse}
                  onStop={handleStopRiding}
                  onFinishRide={handleFinishRideComplete}
                  riderPosition={riderPosition}
                  onRiderPositionChange={setRiderPosition}
                  heading={heading}
                  onHeadingChange={setHeading}
                  isHeadingLocked={isHeadingLocked}
                  onToggleHeadingLock={() => setIsHeadingLocked(!isHeadingLocked)}
                  onPathUpdate={(passed, remaining) => {
                    setPassedPath(passed);
                    setRemainingPath(remaining);
                  }}
                  activePoiFilters={activePoiFilters}
                  onTogglePoiFilter={handleTogglePoiFilter}
                  voiceEnabled={voiceEnabled}
                  onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                  isGpsActive={isGpsActive}
                  onGpsActiveChange={setIsGpsActive}
                  onNavMetricsChange={setNavMetrics}
                  isExpanded={isRidingSheetExpanded}
                  onExpandChange={setIsRidingSheetExpanded}
                />
              ) : (
                <div className="rounded-t-[28px] bg-white/95 shadow-2xl border-t border-slate-200 backdrop-blur-2xl transition-all duration-300">
                  {isBottomSheetOpen ? (
                    /* Expanded Sheet */
                    <>
                      {appState === 'idle' ? (
                    <>
                      <div
                        onClick={() => setIsBottomSheetOpen(false)}
                        className="flex cursor-pointer flex-col items-center justify-center pt-2.5 pb-1 group min-h-[28px]"
                        title="패널 접기"
                      >
                        <div className="h-1.5 w-12 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 mt-1 flex items-center gap-0.5">
                          <ChevronDown size={12} /> 패널 접기
                        </span>
                      </div>
                      <HomeSummarySheet
                        origin={origin}
                        weather={weather}
                        onOpenOfficialGuide={() => setIsOfficialGuideOpen(true)}
                      />
                    </>
                  ) : (
                    <CourseSelectedSheet
                      course={selectedCourse}
                      departureTime={departureTime}
                      onStart={handleStartRiding}
                      onClose={() => setAppState('idle')}
                      onOpenDepartureModal={() => setIsDepartureModalOpen(true)}
                      onSelectFilter={handleFilterSelect}
                      activeFilter={activeFilter}
                    />
                  )}
                </>
              ) : (
                /* Collapsed Peek Bar */
                <div
                  onClick={() => setIsBottomSheetOpen(true)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors min-h-[56px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#0055FF]">
                      <Navigation size={15} fill="currentColor" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {selectedCourse.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {selectedCourse.time} 소요 ({selectedCourse.distance}) · 전용로 {selectedCourse.dedicatedBikeRatio || selectedCourse.bikePath}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRiding();
                      }}
                      className="flex items-center gap-1 rounded-xl bg-[#0055FF] px-3.5 py-2 min-h-[38px] text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      <span>안내시작</span>
                    </button>
                    <div className="flex items-center text-slate-400 p-1">
                      <ChevronUp size={16} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

        {/* ── Other Navigation Tabs ── */}
        {currentTab === 'record' && (
          <RecordTab
            records={records}
            onSelectRecordRoute={handleSelectRecordRoute}
            onClearRecords={() => setRecords([])}
          />
        )}

        {currentTab === 'facilities' && (
          <FacilitiesTab
            facilities={mappedFacilities}
            riderPosition={riderPosition}
            onSelectFacilityOnMap={(fac) => {
              setSelectedFacilityDetail(fac);
            }}
            onNavigateToFacility={(fac) => {
              handleNavigateToFacility(fac);
            }}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileTab
            preferences={preferences}
            currentCoordinates={riderPosition || undefined}
            onUpdatePreferences={(p) => setPreferences(p)}
            reports={reports}
            onAddReport={handleAddReport}
            onToggleLikeReport={handleToggleLikeReport}
          />
        )}

        {/* ── Bottom Navigation Bar (Hidden during live ride HUD) ── */}
        {appState !== 'riding' && (
          <BottomNav active={currentTab} onChangeTab={(t) => setCurrentTab(t)} />
        )}

        {/* ── Modals ── */}
        <QuickReportModal
          isOpen={isQuickReportOpen}
          onClose={() => setIsQuickReportOpen(false)}
          currentLocationName={origin && origin !== '내 현재 위치' ? origin : '안양시 자전거도로 (현재 위치)'}
          currentCoordinates={reportCoordinates || riderPosition || undefined}
          onSubmitReport={handleAddReport}
          onGoToReportPage={() => {
            setIsQuickReportOpen(false);
            setCurrentTab('profile');
          }}
        />

        {routeWarning && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={22} />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">경로 제보 알림</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {routeWarning.location} 구간에서 {routeWarning.categoryName} 제보가 있습니다. 그냥 가시겠습니까? 우회 경로를 재탐색할까요?
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setRouteWarning(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700">
                  기존 경로 유지
                </button>
                <button type="button" onClick={() => { rerouteAroundReport(routeWarning); setRouteWarning(null); }} className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white">
                  우회 재탐색
                </button>
              </div>
            </div>
          </div>
        )}

        <DepartureTimeModal
          isOpen={isDepartureModalOpen}
          onClose={() => setIsDepartureModalOpen(false)}
          currentTime={departureTime}
          durationMinutes={selectedCourse.timeMinutes}
          onApplyTime={(dep, arr) => {
            setDepartureTime(dep);
            setSelectedCourse((prev) => ({ ...prev, arrival: arr }));
          }}
        />

        <OfficialBicycleMapModal
          isOpen={isOfficialGuideOpen}
          onClose={() => setIsOfficialGuideOpen(false)}
          onSelectStreamCourse={handleSelectOfficialStream}
        />

        <AllCoursesModal
          isOpen={isAllCoursesOpen}
          onClose={() => setIsAllCoursesOpen(false)}
          onSelectCourse={handleSelectThemeCourse}
        />

        <FacilityDetailModal
          facility={selectedFacilityDetail}
          isOpen={!!selectedFacilityDetail}
          onClose={() => setSelectedFacilityDetail(null)}
          onNavigateTo={handleNavigateToFacility}
        />

        <RideSummaryModal
          record={finishedRideRecord}
          isOpen={isRideSummaryOpen}
          onClose={() => setIsRideSummaryOpen(false)}
          onViewRecords={() => {
            setIsRideSummaryOpen(false);
            setCurrentTab('record');
          }}
        />
      </div>
    </div>
  );
}
