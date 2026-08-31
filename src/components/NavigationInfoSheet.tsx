import { useState, useEffect, useRef, TouchEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Flag,
  Clock,
  Navigation,
  Footprints,
  Save,
  Trash2,
  Radio,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Course, POICategory, NavStep } from '../types';
import { splitPathAtRider, getBearing, getDistanceMeters } from '../utils/navigationMath';

export interface NavigationInfoSheetProps {
  course: Course;
  onStop: () => void;
  onFinishRide: (stats: {
    courseName: string;
    distanceKm: number;
    durationMinutes: number;
    avgSpeedKmh: number;
    maxSpeedKmh: number;
    calories: number;
    elevationM: number;
  }) => void;
  riderPosition: { lat: number; lng: number } | null;
  onRiderPositionChange: (pos: { lat: number; lng: number }) => void;
  heading?: number;
  onHeadingChange?: (heading: number) => void;
  isHeadingLocked?: boolean;
  onToggleHeadingLock?: () => void;
  onPathUpdate?: (passed: [number, number][], remaining: [number, number][]) => void;
  activePoiFilters: POICategory[];
  onTogglePoiFilter: (category: POICategory) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isGpsActive: boolean;
  onGpsActiveChange: (active: boolean) => void;
  onNavMetricsChange?: (metrics: {
    currentStep?: NavStep;
    nextStep?: NavStep;
    distanceToNextStepMeter: number;
    totalRemainingDistanceKm: number;
    remainingMinutes: number;
    currentSpeedKmh: number;
  }) => void;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export default function NavigationInfoSheet({
  course,
  onStop,
  onFinishRide,
  riderPosition,
  onRiderPositionChange,
  heading = 0,
  onHeadingChange,
  isHeadingLocked = true,
  onToggleHeadingLock,
  onPathUpdate,
  activePoiFilters,
  onTogglePoiFilter,
  voiceEnabled,
  onToggleVoice,
  isGpsActive,
  onGpsActiveChange,
  onNavMetricsChange,
  isExpanded: controlledExpanded,
  onExpandChange,
}: NavigationInfoSheetProps) {
  // Foldable Bottom Sheet state (Default: Collapse / False)
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const setExpanded = (value: boolean) => {
    setInternalExpanded(value);
    if (onExpandChange) onExpandChange(value);
  };

  // Touch Drag / Swipe handler states
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartYRef.current;
    
    // Swipe Up (deltaY < -40) -> Expand
    if (deltaY < -40) {
      setExpanded(true);
    }
    // Swipe Down (deltaY > 40) -> Collapse
    else if (deltaY > 40) {
      setExpanded(false);
    }
    touchStartYRef.current = null;
  };

  // Navigation simulation & progress state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [useRealGps, setUseRealGps] = useState(false); // GPS vs 모의 주행
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);
  
  // Real-time riding stats
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(18.5);
  const [maxSpeed, setMaxSpeed] = useState(21.4);
  const [progressPercent, setProgressPercent] = useState(0);
  const [distanceToNextStepMeter, setDistanceToNextStepMeter] = useState(250);
  const [totalRemainingDistanceKm, setTotalRemainingDistanceKm] = useState(course.distanceKm);
  const [remainingMinutes, setRemainingMinutes] = useState(course.timeMinutes);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  const progressPercentRef = useRef(0);
  const currentStepIndexRef = useRef(0);
  const prevPositionRef = useRef<{ lat: number; lng: number } | null>(riderPosition);
  const navSteps = course.navSteps || [];
  const navStepsRef = useRef(navSteps);
  const path = course.path;
  const pathRef = useRef(path);

  useEffect(() => {
    navStepsRef.current = navSteps;
  }, [navSteps]);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  const currentStep = navSteps[currentStepIndex] || navSteps[0];
  const nextStep = navSteps[currentStepIndex + 1];

  // Speak Korean turn instruction
  const speakInstruction = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  // Trigger TTS on turn step change
  useEffect(() => {
    if (currentStep?.instruction) {
      speakInstruction(currentStep.instruction);
    }
  }, [currentStepIndex, voiceEnabled]);

  // Pass metrics up to NavigationHeader
  useEffect(() => {
    if (onNavMetricsChange) {
      onNavMetricsChange({
        currentStep,
        nextStep,
        distanceToNextStepMeter,
        totalRemainingDistanceKm,
        remainingMinutes,
        currentSpeedKmh: currentSpeed,
      });
    }
  }, [currentStep, nextStep, distanceToNextStepMeter, totalRemainingDistanceKm, remainingMinutes, currentSpeed, onNavMetricsChange]);

  // Real-time GPS Tracking via navigator.geolocation.watchPosition
  useEffect(() => {
    if (!useRealGps || !navigator.geolocation) return;

    let watchId: number;
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          onGpsActiveChange(true);
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          const newPos = { lat: newLat, lng: newLng };

          // Calculate heading from GPS or consecutive coordinates
          if (pos.coords.heading !== null && !isNaN(pos.coords.heading) && pos.coords.heading >= 0) {
            if (onHeadingChange) onHeadingChange(Math.round(pos.coords.heading));
          } else if (prevPositionRef.current) {
            const dist = getDistanceMeters(
              prevPositionRef.current.lat,
              prevPositionRef.current.lng,
              newLat,
              newLng
            );
            if (dist > 1.5) {
              const bearing = getBearing(
                prevPositionRef.current.lat,
                prevPositionRef.current.lng,
                newLat,
                newLng
              );
              if (onHeadingChange) onHeadingChange(bearing);
            }
          }
          prevPositionRef.current = newPos;
          onRiderPositionChange(newPos);

          // Update speed if provided by GPS
          if (pos.coords.speed !== null && pos.coords.speed >= 0) {
            const speedKmh = Math.round(pos.coords.speed * 3.6 * 10) / 10;
            setCurrentSpeed(speedKmh);
            setMaxSpeed((m) => Math.max(m, speedKmh));
          }

          // Path split and remaining calculation
          const split = splitPathAtRider(pathRef.current, newPos);
          if (onPathUpdate) {
            onPathUpdate(split.passedPath, split.remainingPath);
          }

          const remKm = Math.round((split.remainingDistanceMeters / 1000) * 10) / 10;
          setTotalRemainingDistanceKm(remKm);
          const remMins = Math.max(1, Math.round((remKm / 18) * 60));
          setRemainingMinutes(remMins);

          const totalDist = course.distanceKm;
          const progress = Math.min(100, Math.max(0, Math.round(((totalDist - remKm) / totalDist) * 100)));
          setProgressPercent(progress);
        },
        () => {
          onGpsActiveChange(false);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    } catch {
      onGpsActiveChange(false);
    }

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [useRealGps, course.distanceKm, onRiderPositionChange, onHeadingChange, onGpsActiveChange, onPathUpdate]);

  // Simulation runner (when not in real GPS mode)
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      if (useRealGps) return;

      setCurrentSpeed((prev) => {
        const baseSpeed = 18 * simSpeedMultiplier;
        const delta = (Math.random() - 0.48) * 1.5;
        const next = Math.max(10, Math.min(45, baseSpeed + delta));
        setMaxSpeed((m) => Math.max(m, Math.round(next * 10) / 10));
        return Math.round(next * 10) / 10;
      });

      const stepIncrement = 0.25 * simSpeedMultiplier;
      const nextProgress = progressPercentRef.current + stepIncrement;

      if (nextProgress >= 100) {
        progressPercentRef.current = 100;
        setProgressPercent(100);
        setIsPlaying(false);
        setShowConfirmFinish(true);
        return;
      }

      progressPercentRef.current = nextProgress;
      setProgressPercent(nextProgress);

      const currentPath = pathRef.current;
      const totalPoints = currentPath.length;
      if (totalPoints > 0) {
        const rawIndex = (nextProgress / 100) * (totalPoints - 1);
        const idx1 = Math.floor(rawIndex);
        const idx2 = Math.min(idx1 + 1, totalPoints - 1);
        const ratio = rawIndex - idx1;

        if (currentPath[idx1] && currentPath[idx2]) {
          const lat = currentPath[idx1][0] + (currentPath[idx2][0] - currentPath[idx1][0]) * ratio;
          const lng = currentPath[idx1][1] + (currentPath[idx2][1] - currentPath[idx1][1]) * ratio;
          const currentPos = { lat, lng };

          const bearing = getBearing(
            currentPath[idx1][0],
            currentPath[idx1][1],
            currentPath[idx2][0],
            currentPath[idx2][1]
          );
          if (onHeadingChange) onHeadingChange(bearing);

          onRiderPositionChange(currentPos);
          prevPositionRef.current = currentPos;

          const split = splitPathAtRider(currentPath, currentPos);
          if (onPathUpdate) {
            onPathUpdate(split.passedPath, split.remainingPath);
          }

          const remKm = Math.round((split.remainingDistanceMeters / 1000) * 10) / 10;
          setTotalRemainingDistanceKm(remKm);
          const remMins = Math.max(1, Math.round((remKm / 18) * 60));
          setRemainingMinutes(remMins);
        }
      }

      const currentNavSteps = navStepsRef.current;
      if (currentNavSteps.length > 0) {
        const targetStepIdx = Math.min(
          Math.floor((nextProgress / 100) * currentNavSteps.length),
          currentNavSteps.length - 1
        );
        if (targetStepIdx !== currentStepIndexRef.current) {
          currentStepIndexRef.current = targetStepIdx;
          setCurrentStepIndex(targetStepIdx);
        }

        const stepProgressRatio = ((nextProgress / 100) * currentNavSteps.length) % 1;
        const currentStepTotalMeters = currentNavSteps[targetStepIdx]?.distanceMeter || 300;
        const remainingStepMeters = Math.max(
          10,
          Math.round(currentStepTotalMeters * (1 - stepProgressRatio))
        );
        setDistanceToNextStepMeter(remainingStepMeters);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, useRealGps, simSpeedMultiplier, course.distanceKm, onRiderPositionChange, onHeadingChange, onPathUpdate]);

  // Format Elapsed Time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const actualDistanceKm = Math.round((course.distanceKm * (progressPercent / 100)) * 10) / 10;
  
  const burnedCalories = Math.max(
    Math.round(actualDistanceKm * 34),
    Math.round(elapsedSeconds * 0.08)
  );

  const getStepIcon = (iconType: string, warn?: boolean) => {
    switch (iconType) {
      case 'crosswalk':
        return <Footprints size={20} strokeWidth={2.5} className="text-amber-500" />;
      case 'left':
        return <ArrowLeft size={20} strokeWidth={3} className={warn ? 'text-amber-500' : 'text-[#0055FF]'} />;
      case 'right':
        return <ArrowRight size={20} strokeWidth={3} className={warn ? 'text-amber-500' : 'text-[#0055FF]'} />;
      case 'u-turn':
        return <RotateCcw size={20} strokeWidth={3} className="text-[#E11D48]" />;
      case 'arrive':
        return <Flag size={20} strokeWidth={3} className="text-[#10B981]" />;
      case 'up':
      default:
        return <ArrowUp size={20} strokeWidth={3} className="text-[#0055FF]" />;
    }
  };

  const handleSaveAndCompleteRide = () => {
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    let avgSpeed = 18.0;
    if (elapsedSeconds > 10 && actualDistanceKm > 0) {
      const hours = elapsedSeconds / 3600;
      avgSpeed = Math.round((actualDistanceKm / hours) * 10) / 10;
      if (avgSpeed > 35) avgSpeed = 22.5;
      if (avgSpeed < 5) avgSpeed = 12.0;
    } else {
      avgSpeed = currentSpeed;
    }

    onFinishRide({
      courseName: course.name,
      distanceKm: actualDistanceKm,
      durationMinutes,
      avgSpeedKmh: avgSpeed,
      maxSpeedKmh: Math.max(maxSpeed, avgSpeed),
      calories: Math.max(burnedCalories, 5),
      elevationM: Math.round(actualDistanceKm * 5),
    });
  };

  const handleCancelRideWithoutSaving = () => {
    setShowConfirmFinish(false);
    onStop();
  };

  const isShortRide = elapsedSeconds < 30 || actualDistanceKm < 0.1;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`w-full rounded-t-[28px] bg-white/95 backdrop-blur-2xl shadow-2xl border-t border-slate-200 text-slate-900 transition-all duration-300 ease-out select-none ${
        isExpanded ? 'max-h-[65vh] flex flex-col' : 'max-h-[140px]'
      }`}
    >
      {/* ── 1. Top Drag Handle & Toggle Header ── */}
      <div
        onClick={() => setExpanded(!isExpanded)}
        className="w-full flex flex-col items-center pt-2.5 pb-1.5 px-4 cursor-pointer group hover:bg-slate-50/80 rounded-t-[28px] transition-colors"
        title={isExpanded ? '시트 접기 (지도 넓게 보기)' : '상세 경로 및 제어창 펼치기'}
      >
        {/* Drag Handle Bar */}
        <div className="h-1.5 w-12 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors" />
        
        {/* Sub-label & Toggle Arrow */}
        <div className="flex items-center justify-between w-full mt-1 px-1">
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 flex items-center gap-1">
            {isExpanded ? (
              <>
                <ChevronDown size={13} className="text-[#0055FF]" /> 상세 정보 접기 (지도 넓게 보기)
              </>
            ) : (
              <>
                <ChevronUp size={13} className="text-[#0055FF]" /> 위로 올려 상세 경로 및 편의시설 보기
              </>
            )}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {isExpanded ? '상세 모드' : '슬림 모드'}
          </span>
        </div>
      </div>

      {/* ── 2. Always Visible: Slim Riding Metrics Bar ── */}
      <div className="px-3 pb-2 pt-0.5">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-50 p-2 border border-slate-200 text-center shadow-xs">
          {/* 남은 거리 */}
          <div className="flex flex-col items-center border-l border-slate-200">
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500">
              <Navigation size={10} className="text-indigo-600" />
              남은거리
            </span>
            <span className="text-xl font-black text-slate-900 leading-none my-0.5">{totalRemainingDistanceKm}</span>
            <span className="text-[9px] font-bold text-slate-500">km 남음</span>
          </div>

          {/* 주행 시간 */}
          <div className="flex flex-col items-center border-l border-slate-200">
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500">
              <Clock size={10} className="text-[#10B981]" />
              주행시간
            </span>
            <span className="text-lg font-black text-slate-900 leading-none my-0.5">{formatTime(elapsedSeconds)}</span>
            <span className="text-[9px] font-bold text-slate-500">경과</span>
          </div>
        </div>
      </div>

      {/* ── 3. Detail Content Section (Only rendered in Expanded mode) ── */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3 pt-1 space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* Turn-by-Turn Maneuvers Detailed List */}
          <div>
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px] font-extrabold text-slate-700">구간별 상세 경로 안내</span>
              <span className="text-[10px] text-slate-400">{navSteps.length}개 구간</span>
            </div>
            <div className="max-h-28 overflow-y-auto hide-scrollbar rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-200 shadow-xs">
              {navSteps.map((step, idx) => {
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step.id || idx}
                    onClick={() => {
                      currentStepIndexRef.current = idx;
                      setCurrentStepIndex(idx);
                    }}
                    className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors ${
                      isCurrent ? 'bg-blue-50/95 border-l-4 border-[#0055FF]' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-xs shrink-0">
                      {getStepIcon(step.iconType, step.warn)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                        {step.text}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">
                      {step.distanceMeter}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GPS Mode & Simulation Controller Bar */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 shadow-xs">
            {/* Real GPS Toggle */}
            <button
              type="button"
              onClick={() => setUseRealGps(!useRealGps)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors border ${
                useRealGps
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="실제 야외 GPS 주행 트래킹 전환"
            >
              <Radio size={13} className={useRealGps ? 'animate-pulse' : ''} />
              <span>{useRealGps ? '실제 GPS 주행' : '모의 주행'}</span>
            </button>

            {/* Play/Pause & Speed Multiplier (Simulation mode) */}
            {!useRealGps ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0055FF] text-white shadow-xs active:scale-95 transition-transform"
                  title={isPlaying ? '일시정지' : '모의 주행 재생'}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>
                
                <span className="text-[10px] text-slate-500 font-bold ml-1">배속:</span>
                {[1, 2, 4].map((mult) => (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => setSimSpeedMultiplier(mult)}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all ${
                      simSpeedMultiplier === mult
                        ? 'bg-[#0055FF] text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
                야외 GPS 실시간 추적 중
              </div>
            )}
          </div>

          {/* POI Quick Toggles Bar & Exit Action */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center gap-1 flex-1 overflow-x-auto hide-scrollbar rounded-2xl bg-slate-50 p-1 border border-slate-200 shadow-xs">
              {[
                { cat: 'water' as POICategory, emoji: '💧', label: '음수대' },
                { cat: 'repair' as POICategory, emoji: '🔧', label: '공기주입' },
                { cat: 'restroom' as POICategory, emoji: '🚻', label: '화장실' },
                { cat: 'parking' as POICategory, emoji: '🚲', label: '보관소' },
              ].map(({ cat, emoji, label }) => {
                const isActive = activePoiFilters.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onTogglePoiFilter(cat)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 min-h-[38px] transition-all active:scale-95 ${
                      isActive
                        ? 'bg-[#0055FF] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs">{emoji}</span>
                    <span className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* End Ride Button */}
            <button
              type="button"
              onClick={() => setShowConfirmFinish(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 active:scale-95 transition-colors shrink-0 shadow-xs"
              title="라이딩 종료"
            >
              <X size={14} />
              <span>안내 종료</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm End Ride Dialog ── */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-5 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0055FF] border border-blue-100 shadow-sm">
              <Navigation size={24} />
            </div>
            
            <h3 className="text-base font-bold text-slate-900">
              {progressPercent >= 100 ? '목적지에 도착했습니다!' : '라이딩 안내를 종료하시겠습니까?'}
            </h3>
            
            <p className="mt-1 text-xs text-slate-500">
              {isShortRide
                ? '주행 시간이 짧거나 이동 거리가 적어 기록하지 않고 취소할 수 있습니다.'
                : '실제 이동한 거리와 시간 기준으로 주행 기록이 계산됩니다.'}
            </p>

            <div className="my-3.5 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">실제 주행 시간</span>
                <span className="font-bold text-slate-900">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">실제 이동 거리</span>
                <span className="font-bold text-[#0055FF]">
                  {actualDistanceKm} km <span className="text-[10px] text-slate-400 font-normal">({Math.round(progressPercent)}% 진행)</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveAndCompleteRide}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0055FF] py-3.5 min-h-[44px] text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Save size={15} />
                <span>주행 기록 저장 후 완료</span>
              </button>

              <button
                type="button"
                onClick={handleCancelRideWithoutSaving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 border border-slate-200 py-3 min-h-[44px] text-xs font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
              >
                <Trash2 size={15} />
                <span>기록 저장 없이 안내 취소</span>
              </button>

              {progressPercent < 100 && (
                <button
                  type="button"
                  onClick={() => setShowConfirmFinish(false)}
                  className="w-full rounded-xl bg-transparent py-2.5 min-h-[40px] text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  계속 주행하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
