import { useState, type FormEvent } from 'react';
import { UserPreferences, CommunityReport, ReportCategory, TTSVoiceType, ThemeColor, FontSize } from '../types';
import { INITIAL_COMMUNITY_REPORTS } from '../data/reports';
import {
  Sliders,
  Phone,
  Volume2,
  VolumeX,
  Palette,
  Type,
  AlertTriangle,
  Megaphone,
  Plus,
  ThumbsUp,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  Play,
  Square,
  ShieldAlert,
} from 'lucide-react';
import { playVoiceSample, stopVoice } from '../utils/ttsVoice';

interface ProfileTabProps {
  preferences: UserPreferences;
  currentCoordinates?: { lat: number; lng: number };
  onUpdatePreferences: (prefs: UserPreferences) => void;
  reports?: CommunityReport[];
  onAddReport?: (report: CommunityReport) => void;
  onToggleLikeReport?: (id: string) => void;
}

export default function ProfileTab({
  preferences,
  currentCoordinates,
  onUpdatePreferences,
  reports: propReports,
  onAddReport,
  onToggleLikeReport,
}: ProfileTabProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [localReports, setLocalReports] = useState<CommunityReport[]>(INITIAL_COMMUNITY_REPORTS);
  const reports = propReports || localReports;
  const [selectedReportFilter, setSelectedReportFilter] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // New report form state
  const [newReport, setNewReport] = useState<{
    category: ReportCategory;
    title: string;
    location: string;
    content: string;
  }>({
    category: 'closure',
    title: '',
    location: '',
    content: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updatePreferenceField = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    onUpdatePreferences(updated);
  };

  const toggleOption = (key: keyof UserPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    onUpdatePreferences(updated);
  };

  // TTS Voice Sample Playback
  const handleTestVoice = (voiceType: TTSVoiceType, speed: number, pitch: number) => {
    setIsPlayingVoice(true);
    const sampleText = '안양 스마트 내비게이션 안내를 시작합니다. 잠시 후 300미터 앞 비산교 쌍개울에서 학의천 방면으로 우회전입니다. 보행자에 주의하세요.';
    playVoiceSample(sampleText, { voiceType, speed, pitch });
    setTimeout(() => setIsPlayingVoice(false), 5500);
  };

  const handleStopVoice = () => {
    stopVoice();
    setIsPlayingVoice(false);
  };

  // Like / Upvote Report
  const handleLikeReport = (id: string) => {
    if (onToggleLikeReport) {
      onToggleLikeReport(id);
    } else {
      setLocalReports((prev) =>
        prev.map((rep) => {
          if (rep.id === id) {
            const isLiked = !rep.isLiked;
            return {
              ...rep,
              likes: isLiked ? rep.likes + 1 : rep.likes - 1,
              isLiked,
            };
          }
          return rep;
        })
      );
    }
  };

  // Submit New Report
  const handleSubmitReport = (e: FormEvent) => {
    e.preventDefault();
    if (!newReport.title.trim() || !newReport.location.trim() || !newReport.content.trim()) {
      showToast('모든 항목을 입력해 주세요.');
      return;
    }

    const categoryNames: Record<ReportCategory, string> = {
      closure: '길 통제/공사',
      accident: '사고/낙차 주의',
      damage: '도로 파손/요철',
      hazard: '장애물/토사',
      flooding: '하천 침수/통제',
    };

    const created: CommunityReport = {
      id: `rep-${Date.now()}`,
      coordinates: currentCoordinates,
      category: newReport.category,
      categoryName: categoryNames[newReport.category],
      title: newReport.title.trim(),
      location: newReport.location.trim(),
      content: newReport.content.trim(),
      timestamp: '방금 전',
      status: 'active',
      likes: 1,
      isLiked: true,
    };

    if (onAddReport) {
      onAddReport(created);
    } else {
      setLocalReports([created, ...localReports]);
    }
    setIsReportModalOpen(false);
    setNewReport({
      category: 'closure',
      title: '',
      location: '',
      content: '',
    });
    showToast('라이더 제보가 안전하게 등록되어 다른 사용자들과 공유되었습니다! 🚴');
  };

  // Filtered reports
  const filteredReports = reports.filter((rep) => {
    if (selectedReportFilter === 'all') return true;
    return rep.category === selectedReportFilter;
  });

  // TTS Voice Options
  const voiceOptions: Array<{ id: TTSVoiceType; name: string; desc: string; icon: string }> = [
    { id: 'female-clear', name: '여성 내비 안내원', desc: '또렷하고 맑은 고음질 표준 톤', icon: '👩' },
    { id: 'male-calm', name: '남성 스마트 보이스', desc: '차분하고 신뢰감 있는 중저음 톤', icon: '👨' },
    { id: 'female-friendly', name: '여성 힐링 보이스', desc: '친근하고 부드러운 하천 숲길 톤', icon: '🌸' },
    { id: 'male-energetic', name: '남성 스포츠 보이스', desc: '역동적이고 기민한 라이딩 톤', icon: '⚡' },
  ];

  // Theme Colors
  const themeOptions: Array<{ id: ThemeColor; name: string; desc: string; bgClass: string; accentColor: string }> = [
    { id: 'blue', name: '스마트 안양 블루', desc: '표준 공식 테마 (시원한 파란색)', bgClass: 'bg-[#0055FF]', accentColor: '#0055FF' },
    { id: 'green', name: '자연 힐링 에메랄드', desc: '수변 녹지 숲길 친화 테마', bgClass: 'bg-emerald-600', accentColor: '#059669' },
    { id: 'dark', name: '야간 세이프티 네이비', desc: '야간 눈부심 방지 딥 네이비', bgClass: 'bg-slate-900', accentColor: '#38BDF8' },
    { id: 'high-contrast', name: '고대비 시인성 특화', desc: '야외 직사광선용 선명 모드', bgClass: 'bg-black', accentColor: '#FACC15' },
  ];

  // Font Sizes
  const fontSizeOptions: Array<{ id: FontSize; name: string; desc: string; scale: string }> = [
    { id: 'normal', name: '보통 (100%)', desc: '표준 가독성 기본 글자 크기', scale: '1.0x' },
    { id: 'large', name: '크게 (115%)', desc: '주행 중 거치대 시인성 강화', scale: '1.15x' },
    { id: 'xlarge', name: '아주 크게 (130%)', desc: '야외 직사광선용 대형 글씨', scale: '1.3x' },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-y-auto pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl bg-slate-900 text-white px-5 py-3 shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Profile Summary (No citizen badge / clean header) */}
      <div className="bg-white px-6 pt-6 pb-5 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 border border-blue-200 text-2xl font-black text-[#0055FF] shadow-sm">
              🚴
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">내 라이딩 설정 & 커뮤니티</h1>
              <p className="text-xs text-slate-500 mt-0.5">실시간 도로 제보 · TTS 음성 · 테마 및 글자 크기</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        
        {/* ── 1. 도로 상황 및 사고 실시간 제보/신고 섹션 (NEW!) ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Megaphone size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">주행 중 도로 통제 & 사고 실시간 제보</h2>
                <p className="text-[10px] text-slate-500">라이더들이 공유하는 안양 자전거길 실시간 위험 정보</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
            >
              <Plus size={14} />
              <span>제보 등록</span>
            </button>
          </div>

          {/* Report Category Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-2 pt-1">
            {[
              { id: 'all', label: '전체' },
              { id: 'closure', label: '🚧 통제/공사' },
              { id: 'accident', label: '🚨 사고주의' },
              { id: 'damage', label: '⚠️ 도로파손' },
              { id: 'hazard', label: '🍂 장애물/토사' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedReportFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedReportFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recent Reports List */}
          <div className="space-y-2.5 mt-2 max-h-80 overflow-y-auto hide-scrollbar pr-0.5">
            {filteredReports.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertTriangle size={24} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-600">등록된 제보가 없습니다.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">새로운 도로 통제나 위험 상황을 먼저 제보해 보세요!</p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isClosure = report.category === 'closure';
                const isAccident = report.category === 'accident';
                const isResolved = report.status === 'resolved';

                return (
                  <div
                    key={report.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isResolved
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : isAccident
                        ? 'bg-red-50/60 border-red-200'
                        : isClosure
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isResolved
                              ? 'bg-emerald-200 text-emerald-900'
                              : isAccident
                              ? 'bg-red-200 text-red-900'
                              : isClosure
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-blue-200 text-blue-900'
                          }`}
                        >
                          {report.categoryName}
                        </span>
                        {isResolved && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> 해결완료
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {report.timestamp}
                        </span>
                      </div>

                      {/* Like / Helpfulness Counter Button */}
                      <button
                        type="button"
                        onClick={() => handleLikeReport(report.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          report.isLiked
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ThumbsUp size={11} className={report.isLiked ? 'fill-current' : ''} />
                        <span>{report.likes}</span>
                      </button>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 mt-2 leading-snug">{report.title}</h3>

                    <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium mt-1">
                      <MapPin size={12} className="text-red-500 shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-200/50">
                      {report.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 2. TTS 음성 안내 커스텀 설정 (NEW!) ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#0055FF]">
                <Volume2 size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">TTS 음성 안내 목소리 및 속도</h2>
                <p className="text-[10px] text-slate-500">내비게이션 턴바이턴 한국어 음성 스타일 설정</p>
              </div>
            </div>

            {/* Test Voice Button */}
            <button
              type="button"
              onClick={() => {
                if (isPlayingVoice) handleStopVoice();
                else handleTestVoice(prefs.ttsVoice, prefs.ttsSpeed, prefs.ttsPitch);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 ${
                isPlayingVoice
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-[#0055FF] text-white hover:bg-blue-700'
              }`}
            >
              {isPlayingVoice ? (
                <>
                  <Square size={13} fill="currentColor" />
                  <span>재생 중지</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>음성 미리듣기</span>
                </>
              )}
            </button>
          </div>

          {/* Voice Type Selector Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {voiceOptions.map((v) => {
              const isSelected = prefs.ttsVoice === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => updatePreferenceField('ttsVoice', v.id)}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#0055FF] bg-blue-50/70 ring-2 ring-blue-200 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl">{v.icon}</span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-[#0055FF] ring-2 ring-blue-300" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-900">{v.name}</span>
                  <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{v.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Speed & Pitch Controls */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            {/* Speed Control */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>안내 말하기 속도</span>
                <span className="text-[#0055FF] font-extrabold">{prefs.ttsSpeed}x</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { speed: 0.8, label: '0.8x (느리게)' },
                  { speed: 1.0, label: '1.0x (표준)' },
                  { speed: 1.2, label: '1.2x (빠르게)' },
                ].map((s) => (
                  <button
                    key={s.speed}
                    type="button"
                    onClick={() => updatePreferenceField('ttsSpeed', s.speed)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      prefs.ttsSpeed === s.speed
                        ? 'bg-[#0055FF] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch Control */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>음성 톤 (피치)</span>
                <span className="text-[#0055FF] font-extrabold">{prefs.ttsPitch === 0.8 ? '낮은 톤' : prefs.ttsPitch === 1.2 ? '높은 톤' : '보통 톤'}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { pitch: 0.8, label: '차분하게 (낮음)' },
                  { pitch: 1.0, label: '표준 톤' },
                  { pitch: 1.2, label: '명료하게 (높음)' },
                ].map((p) => (
                  <button
                    key={p.pitch}
                    type="button"
                    onClick={() => updatePreferenceField('ttsPitch', p.pitch)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      prefs.ttsPitch === p.pitch
                        ? 'bg-[#0055FF] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. 화면 색 구성 테마 (NEW!) ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Palette size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">화면 색 구성 테마</h2>
              <p className="text-[10px] text-slate-500">주행 환경과 기호에 맞는 색상 팔레트 선택</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {themeOptions.map((t) => {
              const isSelected = prefs.themeColor === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updatePreferenceField('themeColor', t.id)}
                  className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#0055FF] bg-blue-50/70 ring-2 ring-blue-200 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 w-full">
                    <div className={`h-5 w-5 rounded-full ${t.bgClass} shadow-xs border border-white`} />
                    <span className="text-xs font-bold text-slate-900 truncate">{t.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 4. 글자 크기 조절 (NEW!) ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Type size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">글자 크기 (텍스트 배율)</h2>
              <p className="text-[10px] text-slate-500">자전거 거치대 장착 시 시인성을 위한 텍스트 크기</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {fontSizeOptions.map((f) => {
              const isSelected = prefs.fontSize === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => updatePreferenceField('fontSize', f.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-[#0055FF] bg-blue-50/70 ring-2 ring-blue-200 shadow-xs font-bold text-[#0055FF]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`font-black mb-1 ${
                      f.id === 'normal' ? 'text-sm' : f.id === 'large' ? 'text-base' : 'text-lg'
                    }`}
                  >
                    가
                  </span>
                  <span className="text-[11px] font-bold">{f.name}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">{f.scale}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 5. 길찾기 및 안전 주행 옵션 ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-3.5">
            <Sliders size={18} className="text-[#0055FF]" />
            <h2 className="text-xs font-bold text-slate-800">길찾기 및 안전 주행 옵션</h2>
          </div>

          <div className="space-y-3.5">
            {[
              {
                key: 'avoidStairs' as const,
                title: '계단 및 육교 계단 자동 회피',
                desc: '자전거를 끌고 가야 하는 계단을 우회하여 완만한 슬로프만 안내',
              },
              {
                key: 'avoidSteepSlopes' as const,
                title: '급경사로(10% 이상) 우회',
                desc: '노약자 및 초보자를 위한 평탄한 자전거길 우선 추천',
              },
              {
                key: 'voiceGuide' as const,
                title: '음성 길안내 활성화',
                desc: '방향 전환 및 주요 교차로 진입 전 한국어 음성 알림',
              },
              {
                key: 'speedAlert' as const,
                title: '안양천 제한속도(20km/h) 경고 알림',
                desc: '보행자 겸용구간 과속 시 진동 및 화면 경고 표시',
              },
            ].map((opt) => (
              <div
                key={opt.key}
                onClick={() => toggleOption(opt.key)}
                className="flex items-center justify-between py-1.5 cursor-pointer group"
              >
                <div className="flex-1 pr-3">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#0055FF] transition-colors">{opt.title}</p>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5">{opt.desc}</p>
                </div>
                <div
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    prefs[opt.key] ? 'bg-[#0055FF]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      prefs[opt.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 6. 비상 연락처 및 관련 기관 ── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <h2 className="text-xs font-bold text-slate-800 mb-3">비상 연락처 및 관련 기관</h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">쌍개울 자전거 상설 무료정비소</span>
              <a href="tel:031-8045-2435" className="flex items-center gap-1 font-bold text-[#0055FF]">
                <Phone size={12} />
                031-8045-2435
              </a>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">안양시청 도로과 자전거팀</span>
              <a href="tel:031-8045-2442" className="flex items-center gap-1 font-bold text-[#0055FF]">
                <Phone size={12} />
                031-8045-2442
              </a>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-700">안양시민 자전거 단체보험 전담</span>
              <a href="tel:1899-7751" className="flex items-center gap-1 font-bold text-emerald-700">
                <Phone size={12} />
                1899-7751
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 새 제보 등록 모달 (Submit Report Modal) ── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 text-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">도로 상황 및 사고 제보하기</h3>
                  <p className="text-[10px] text-slate-500">다른 라이더들의 안전 주행을 위해 공유됩니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3.5">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">제보 유형 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'closure' as ReportCategory, label: '🚧 길 통제/공사' },
                    { id: 'accident' as ReportCategory, label: '🚨 사고/낙차 발생' },
                    { id: 'damage' as ReportCategory, label: '⚠️ 도로 파손/요철' },
                    { id: 'hazard' as ReportCategory, label: '🍂 장애물/토사유출' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewReport({ ...newReport, category: cat.id })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        newReport.category === cat.id
                          ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">위치 (어디서 목격하셨나요?)</label>
                <input
                  type="text"
                  placeholder="예: 학의천 수촌교 부근 북단 자전거도로"
                  value={newReport.location}
                  onChange={(e) => setNewReport({ ...newReport, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">제보 제목</label>
                <input
                  type="text"
                  placeholder="예: 수변 데크 보수 공사로 서행 우회 필요"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">상세 내용 및 주의 안내</label>
                <textarea
                  rows={3}
                  placeholder="상황에 대해 자세히 설명해 주세요 (우회로 여부, 서행 권고, 바닥 모래/단차 등)"
                  value={newReport.content}
                  onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all"
                >
                  제보 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
