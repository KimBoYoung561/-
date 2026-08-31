import { useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  Flag,
  Footprints,
  Volume2,
  VolumeX,
  X,
  Compass,
  ShieldAlert,
} from 'lucide-react';
import { NavStep } from '../types';

interface NavigationHeaderProps {
  currentStep?: NavStep;
  nextStep?: NavStep;
  distanceToNextStepMeter: number;
  totalRemainingDistanceKm: number;
  remainingMinutes: number;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onStopRide: () => void;
  isGpsActive: boolean;
  isHeadingLocked?: boolean;
  onToggleHeadingLock?: () => void;
  onOpenQuickReport?: () => void;
}

export default function NavigationHeader({
  currentStep,
  nextStep,
  distanceToNextStepMeter,
  totalRemainingDistanceKm,
  remainingMinutes,
  voiceEnabled,
  onToggleVoice,
  onStopRide,
  isGpsActive,
  isHeadingLocked = true,
  onToggleHeadingLock,
  onOpenQuickReport,
}: NavigationHeaderProps) {
  // Render big action icon based on step iconType
  const stepIcon = useMemo(() => {
    const type = currentStep?.iconType || 'up';
    switch (type) {
      case 'left':
        return <ArrowLeft size={34} strokeWidth={3} className="text-white animate-pulse" />;
      case 'right':
        return <ArrowRight size={34} strokeWidth={3} className="text-white animate-pulse" />;
      case 'u-turn':
        return <RotateCcw size={32} strokeWidth={3} className="text-white" />;
      case 'crosswalk':
        return <Footprints size={32} strokeWidth={2.8} className="text-amber-300 animate-bounce" />;
      case 'arrive':
        return <Flag size={32} strokeWidth={2.8} className="text-emerald-300" />;
      case 'up':
      default:
        return <ArrowUp size={34} strokeWidth={3.2} className="text-white" />;
    }
  }, [currentStep?.iconType]);

  // Mini preview icon for upcoming 2nd step
  const nextStepMiniIcon = useMemo(() => {
    if (!nextStep) return null;
    const type = nextStep.iconType || 'up';
    switch (type) {
      case 'left':
        return <ArrowLeft size={13} className="text-slate-300" />;
      case 'right':
        return <ArrowRight size={13} className="text-slate-300" />;
      case 'u-turn':
        return <RotateCcw size={13} className="text-slate-300" />;
      case 'crosswalk':
        return <Footprints size={13} className="text-amber-400" />;
      case 'arrive':
        return <Flag size={13} className="text-emerald-400" />;
      default:
        return <ArrowUp size={13} className="text-slate-300" />;
    }
  }, [nextStep]);

  const isCrosswalk = currentStep?.iconType === 'crosswalk' || !!currentStep?.crosswalkInfo;

  return (
    <div className="absolute top-0 left-0 right-0 z-40 px-3 pt-3 pointer-events-none select-none animate-in slide-in-from-top duration-300">
      {/* ── Main TBT Navi Top Banner Card ── */}
      <div className="pointer-events-auto rounded-3xl bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl border border-slate-700/80 overflow-hidden">
        
        {/* Top Status Bar (GPS status, Heading Lock, Voice, Close) */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            {/* GPS Live Pulse */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[10px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{isGpsActive ? '실시간 GPS 수신' : '모의 주행 중'}</span>
            </div>

            {/* 1인칭 시점 고정 토글 */}
            {onToggleHeadingLock && (
              <button
                type="button"
                onClick={onToggleHeadingLock}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  isHeadingLocked
                    ? 'bg-blue-500/30 border border-blue-400/50 text-blue-300'
                    : 'bg-slate-700 text-slate-400 border border-slate-600'
                }`}
                title="내비게이션 시점 고정 (1인칭)"
              >
                <Compass size={11} className={isHeadingLocked ? 'animate-spin-slow' : ''} />
                <span>{isHeadingLocked ? '1인칭 시점 ON' : '시점 자유'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* 위험/통제 빠른 신고 */}
            {onOpenQuickReport && (
              <button
                type="button"
                onClick={onOpenQuickReport}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-bold text-[10px] shadow-sm transition-colors"
                title="주행 중 장애물/파손/통제 실시간 신고"
              >
                <ShieldAlert size={12} className="animate-pulse text-amber-300" />
                <span>신고</span>
              </button>
            )}

            {/* 음성 안내 토글 */}
            <button
              type="button"
              onClick={onToggleVoice}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                voiceEnabled ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
              title={voiceEnabled ? '음성 안내 켜짐' : '음성 안내 꺼짐'}
              aria-label="음성 안내 토글"
            >
              {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* 안내 종료 / 나가기 */}
            <button
              type="button"
              onClick={onStopRide}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700/80 text-slate-300 hover:bg-red-500 hover:text-white transition-colors"
              title="안내 종료"
              aria-label="안내 종료"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Big Turn Action Section ── */}
        <div className="p-3.5 flex items-center gap-3.5">
          {/* Big Action Icon Container (Color adjusts if crosswalk) */}
          <div
            className={`flex h-16 w-16 min-w-[64px] items-center justify-center rounded-2xl shadow-lg border ${
              isCrosswalk
                ? 'bg-amber-600 border-amber-400 text-white shadow-amber-900/40'
                : currentStep?.iconType === 'arrive'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/40'
                : 'bg-blue-600 border-blue-400 text-white shadow-blue-900/40'
            }`}
          >
            {stepIcon}
          </div>

          {/* Action Text & Distance */}
          <div className="flex-1 min-w-0">
            {/* Distance Number & Unit */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tight text-white leading-none">
                {distanceToNextStepMeter >= 1000
                  ? `${(distanceToNextStepMeter / 1000).toFixed(1)}km`
                  : `${distanceToNextStepMeter}m`}
              </span>
              <span className="text-sm font-bold text-slate-300">
                {currentStep?.iconType === 'arrive' ? '도착 예정' : '앞에서'}
              </span>
            </div>

            {/* Direction / Road Instruction */}
            <h3 className="text-base font-black text-white truncate mt-1 leading-tight tracking-tight">
              {currentStep?.text || '안양시 자전거도로를 따라 직진'}
            </h3>

            {/* Sub description */}
            <p className="text-[11px] font-semibold text-slate-300 truncate mt-0.5">
              {currentStep?.sub || '안전 속도(20km/h 이하)를 준수하세요'}
            </p>
          </div>
        </div>

        {/* ── Bottom Strip: 2nd Turn Preview & Remaining Distance/Time ── */}
        <div className="px-3.5 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs">
          {/* Next 2nd step preview */}
          {nextStep ? (
            <div className="flex items-center gap-1.5 text-slate-300 min-w-0 pr-2">
              <span className="text-[10px] font-bold text-slate-400 shrink-0">다음</span>
              <span className="flex items-center justify-center h-4 w-4 rounded bg-slate-800 shrink-0">
                {nextStepMiniIcon}
              </span>
              <span className="text-[11px] font-bold truncate text-slate-200">
                {nextStep.distanceMeter ? `${nextStep.distanceMeter}m 앞 ` : ''}
                {nextStep.text}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
              <Flag size={12} />
              <span>목적지 도착 임박</span>
            </div>
          )}

          {/* Quick Metrics (Remaining km, time) */}
          <div className="flex items-center gap-2 shrink-0 text-[11px] font-extrabold pl-2 border-l border-slate-800">
            <span className="text-blue-400">
              {totalRemainingDistanceKm.toFixed(1)}km
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-400">
              {remainingMinutes}분
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
