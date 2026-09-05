import { useState, useEffect } from 'react';
import {
  Shield,
  Phone,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MapPin,
  Volume2,
  Bike,
  HeartHandshake,
  Navigation,
  Type,
  Play,
  Square,
  Flame,
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { ANYANG_COMMUNITY_REPORTS } from '../data/reports';
import { CommunityReport, FontSize } from '../types';

interface ProfileTabProps {
  onOpenOfficialMap?: () => void;
  onOpenReportModal?: () => void;
  reports?: CommunityReport[];
  fontSize?: FontSize;
  onChangeFontSize?: (size: FontSize) => void;
  preferences?: any;
  currentCoordinates?: { lat: number; lng: number };
  onUpdatePreferences?: (p: any) => void;
  onAddReport?: (newRep: CommunityReport) => void;
  onToggleLikeReport?: (id: string) => void;
}

export default function ProfileTab({
  onOpenOfficialMap,
  onOpenReportModal,
  reports = ANYANG_COMMUNITY_REPORTS,
  fontSize = 'normal',
  onChangeFontSize,
}: ProfileTabProps) {
  // Simple Riding Tracker State for Today
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [todayDistKm, setTodayDistKm] = useState(8.4);
  const [todayCalories, setTodayCalories] = useState(210);

  useEffect(() => {
    let timer: any;
    if (isTracking) {
      timer = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
        setTodayDistKm((prev) => +(prev + 0.005).toFixed(2));
        setTodayCalories((prev) => +(prev + 0.12).toFixed(0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTracking]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-y-auto pb-24">
      {/* User Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0055FF] text-white shadow-md">
            <Bike size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0055FF]">
                안양시민 라이더
              </span>
              <span className="rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2">
                보험 가입완료
              </span>
            </div>
            <h1 className="text-base font-extrabold text-slate-900 mt-0.5">마이 라이딩 프로필 & 설정</h1>
          </div>
        </div>

        {/* Anyang Insurance Card */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield size={16} className="text-[#0055FF]" />
              <span className="text-xs font-bold text-[#0055FF]">안양시민 무료 자전거 단체보험</span>
            </div>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
              전액 시비 보장
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-700 leading-relaxed font-medium">
            안양시에 주민등록이 되어 있는 모든 시민은 별도 가입 절차 없이 전국 어디서나 자전거 사고 시 자동 보장됩니다.
          </p>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Today's Ride Simple Tracker */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0055FF]" />
              <h3 className="text-xs font-bold text-slate-900">오늘의 라이딩 기록</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">간편 스톱워치</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-2.5">
              <span className="text-[10px] font-bold text-slate-400 block">오늘 주행거리</span>
              <p className="text-base font-black text-slate-900 mt-0.5">{todayDistKm}<span className="text-[10px] font-normal text-slate-500">km</span></p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-2.5">
              <span className="text-[10px] font-bold text-slate-400 block">주행 시간</span>
              <p className="text-base font-black text-slate-900 mt-0.5 font-mono">{formatTimer(elapsedSec)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-2.5">
              <span className="text-[10px] font-bold text-slate-400 block">소모 칼로리</span>
              <p className="text-base font-black text-amber-600 mt-0.5">{todayCalories}<span className="text-[10px] font-normal text-slate-500">kcal</span></p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsTracking(!isTracking)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-bold text-xs shadow-xs active:scale-98 transition-all ${
                isTracking
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#0055FF] hover:bg-blue-600 text-white'
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>주행 일시정지</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>오늘 라이딩 기록 시작</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTracking(false);
                setElapsedSec(0);
              }}
              className="px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
              title="시간 리셋"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Font Size Adjuster */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-[#0055FF]" />
              <h3 className="text-xs font-bold text-slate-900">앱 글씨 크기 조절</h3>
            </div>
            <span className="text-[11px] font-extrabold text-[#0055FF]">
              {fontSize === 'normal' ? '보통' : fontSize === 'large' ? '크게' : '아주 크게'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal' as FontSize, label: '보통' },
              { id: 'large' as FontSize, label: '크게 (+15%)' },
              { id: 'xlarge' as FontSize, label: '아주 크게 (+30%)' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChangeFontSize && onChangeFontSize(s.id)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  fontSize === s.id
                    ? 'bg-[#0055FF] text-white border-[#0055FF] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Administration Links */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 mb-2">안양시 자전거 공식 안내</h2>
          <div className="rounded-3xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
            <div
              onClick={onOpenOfficialMap}
              className="flex items-center justify-between p-4 hover:bg-slate-50 active:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF] border border-blue-200">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">안양시 공식 자전거 고시 노선도</p>
                  <p className="text-[11px] text-slate-500">5대 하천 자전거망 및 공공 노선 원본</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            <div
              onClick={onOpenReportModal}
              className="flex items-center justify-between p-4 hover:bg-slate-50 active:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">도로 파손 & 위험 제보하기</p>
                  <p className="text-[11px] text-slate-500">안양시 도로과 및 라이더와 실시간 공유</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Emergency Call Quick Box */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 mb-2">긴급 연락처</h2>
          <div className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">안양시청 도로교통과 (자전거팀)</span>
              <a href="tel:031-8045-2436" className="font-bold text-[#0055FF] underline font-mono">
                031-8045-2436
              </a>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-slate-600">쌍개울 상설 자전거 무료 정비소</span>
              <span className="font-bold text-slate-900">화~일 10:00~17:00</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-slate-600">자전거 단체보험 전담 콜센터</span>
              <a href="tel:1899-7751" className="font-bold text-[#0055FF] underline font-mono">
                1899-7751
              </a>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-slate-600">경찰 / 소방 긴급 신고</span>
              <span className="font-bold text-rose-600">112 / 119</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-200/60 p-4 text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">안양시 스마트 자전거 나들이 가이드</p>
          <p className="text-[11px]">안양 8경 & 공식 자전거 편의시설 데이터 탑재</p>
          <p className="text-[10px] text-slate-400">© 2026 Anyang Smart Bicycle Tour Guide</p>
        </div>
      </div>
    </div>
  );
}
