import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldAlert,
  Radio,
  Navigation,
  Sparkles,
  X,
} from 'lucide-react';
import {
  GpsStatus,
  GpsHubPreset,
  ANYANG_GPS_PRESETS,
  isRunningInIframe,
} from '../utils/gpsHelper';

interface GpsTroubleshootModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpsStatus: GpsStatus;
  gpsAccuracy: number | null;
  gpsMessage: string;
  currentCoords: { lat: number; lng: number } | null;
  currentAddress: string;
  onRetryGps: () => Promise<void> | void;
  onSelectPreset: (preset: GpsHubPreset) => void;
  onEnableMapPickMode?: () => void;
  isLocating: boolean;
}

export default function GpsTroubleshootModal({
  isOpen,
  onClose,
  gpsStatus,
  gpsAccuracy,
  gpsMessage,
  currentCoords,
  currentAddress,
  onRetryGps,
  onSelectPreset,
  onEnableMapPickMode,
  isLocating,
}: GpsTroubleshootModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'guide'>('presets');
  const inIframe = isRunningInIframe();

  if (!isOpen) return null;

  const handleOpenNewTab = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch {
      // Fallback
    }
  };

  const getStatusBadge = () => {
    switch (gpsStatus) {
      case 'active':
        return {
          color: 'bg-emerald-500 text-white',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50 border-emerald-200',
          icon: <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />,
          title: '실시간 GPS 연결 완료',
          desc: gpsAccuracy
            ? `현재 위치가 정상 수신 중입니다. (오차 반경: 약 ±${Math.round(gpsAccuracy)}m)`
            : '현재 위치가 정상적으로 수신되고 있습니다.',
        };
      case 'searching':
        return {
          color: 'bg-blue-500 text-white',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50 border-blue-200',
          icon: <RefreshCw size={16} className="text-blue-600 animate-spin shrink-0" />,
          title: 'GPS 신호 수신 중...',
          desc: '위성 GPS 신호 및 Wi-Fi 통신망 위치를 탐색하고 있습니다.',
        };
      case 'denied':
        return {
          color: 'bg-rose-500 text-white',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50 border-rose-200',
          icon: <ShieldAlert size={16} className="text-rose-600 shrink-0" />,
          title: '브라우저 위치 권한 차단됨',
          desc: '브라우저 주소창 설정에서 위치 접근 권한을 "허용"으로 변경해주세요.',
        };
      case 'timeout':
      case 'unavailable':
      case 'error':
      default:
        return {
          color: 'bg-amber-500 text-white',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50 border-amber-200',
          icon: <AlertTriangle size={16} className="text-amber-600 shrink-0" />,
          title: 'GPS 신호 지연 또는 음영지역',
          desc: gpsMessage || '실내이거나 위성 신호가 약합니다. 아래 [다시 잡기] 또는 [안양 거점 선택]을 이용해보세요.',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div
      id="gps-troubleshoot-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="gps-troubleshoot-modal-panel"
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0055FF] text-white shadow-xs">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                GPS 위치 수신 및 설정
              </h2>
              <p className="text-xs text-slate-500">실시간 위치 보정 & 권한 관리</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4 text-slate-700 text-sm">
          {/* Current Status Card */}
          <div className={`p-3.5 rounded-2xl border ${statusInfo.bgColor} flex items-start gap-3`}>
            {statusInfo.icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-bold text-xs ${statusInfo.textColor}`}>
                  {statusInfo.title}
                </span>
                {currentCoords && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{statusInfo.desc}</p>
              {currentAddress && (
                <div className="mt-2 text-[11px] font-semibold text-slate-800 flex items-center gap-1 truncate bg-white/80 px-2 py-1 rounded-lg border border-slate-200/60">
                  <MapPin size={12} className="text-[#0055FF] shrink-0" />
                  <span className="truncate">{currentAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Retry GPS Button */}
            <button
              type="button"
              id="gps-retry-button"
              onClick={() => onRetryGps()}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-black text-white bg-[#0055FF] hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-blue-500/20 transition-all text-xs"
            >
              <RefreshCw size={15} className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? '위치 탐색 진행 중...' : '실시간 GPS 다시 잡기'}</span>
            </button>

            {/* Map Click Pick Mode Button */}
            {onEnableMapPickMode && (
              <button
                type="button"
                id="gps-map-pick-button"
                onClick={() => {
                  onEnableMapPickMode();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all border border-slate-200 text-xs"
              >
                <Compass size={15} className="text-[#0055FF]" />
                <span>지도에서 내 위치 직접 찍기</span>
              </button>
            )}
          </div>

          {/* Iframe Notice & Open in New Tab if in iframe */}
          {inIframe && (
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2">
                <Info size={15} className="text-[#0055FF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">미리보기(iFrame) 환경 안내</div>
                  <div className="text-[11px] text-slate-600">
                    새 탭에서 열면 브라우저 GPS 팝업이 바로 뜨며 가장 정확합니다.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0055FF] text-white font-bold text-[11px] hover:bg-blue-600 active:scale-95 transition-all shadow-xs"
              >
                <span>새 탭 열기</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}

          {/* Tabs: Presets vs Permission Guide */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Navigation size={13} className={activeTab === 'presets' ? 'text-[#0055FF]' : ''} />
              <span>안양 주요 거점 1초 선택 ({ANYANG_GPS_PRESETS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert size={13} className={activeTab === 'guide' ? 'text-amber-600' : ''} />
              <span>권한 허용 방법</span>
            </button>
          </div>

          {/* Tab 1: Presets Grid */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500 shrink-0" />
                실내이거나 GPS 수신이 안 될 때, 안양 출발지를 원클릭으로 지정하세요:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {ANYANG_GPS_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-left transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#0055FF] truncate">
                        {preset.name}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-700 shrink-0">
                        {preset.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate w-full mt-0.5">
                      {preset.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Permission Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-[#0055FF]" />
                브라우저 위치 권한 허용 가이드
              </div>

              {/* Chrome / Edge / Whale */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>크롬(Chrome) / 웨일 / 엣지</span>
                  <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">PC & 모바일</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. 브라우저 맨 위 주소창 좌측의 🔒(자물쇠) 또는 설정 아이콘 클릭<br />
                  2. <b>[위치(Location)]</b> 항목을 찾아서 <b>&apos;허용&apos;</b>으로 변경<br />
                  3. 새로고침 후 위의 <b>[실시간 GPS 다시 잡기]</b> 버튼 터치
                </p>
              </div>

              {/* Safari / iPhone */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>사파리(Safari) / 아이폰(iOS)</span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">iPhone</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. 주소창 좌측 &apos;가&apos; 또는 웹사이트 설정 클릭 &gt; 위치 &gt; <b>&apos;허용&apos;</b><br />
                  2. 아이폰 설정 앱 &gt; [개인정보 보호 및 보안] &gt; [위치 서비스: 켬] 확인
                </p>
              </div>

              {/* Samsung Internet */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>삼성 인터넷 (Galaxy)</span>
                  <span className="text-[9px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Galaxy</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  하단 메뉴(≡) &gt; 설정 &gt; 사이트 및 다운로드 &gt; 사이트 권한 &gt; 위치 &gt; <b>&apos;허용&apos;</b>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {gpsStatus === 'active' ? '🟢 GPS 정상 작동 중' : '💡 안양시 자전거 내비게이션'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300 active:scale-95 transition-all"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
