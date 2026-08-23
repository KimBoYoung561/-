import { useState, type FormEvent } from 'react';
import { ReportCategory, CommunityReport } from '../types';
import {
  ShieldAlert,
  X,
  MapPin,
  Megaphone,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface QuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationName?: string;
  currentCoordinates?: { lat: number; lng: number };
  onSubmitReport: (report: CommunityReport) => void;
  onGoToReportPage: () => void;
}

export default function QuickReportModal({
  isOpen,
  onClose,
  currentLocationName = '안양천·학의천 자전거길 부근',
  currentCoordinates,
  onSubmitReport,
  onGoToReportPage,
}: QuickReportModalProps) {
  const [category, setCategory] = useState<ReportCategory>('closure');
  const [location, setLocation] = useState(currentLocationName || '안양시 자전거도로');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const categories: Array<{ id: ReportCategory; label: string; icon: string; desc: string }> = [
    { id: 'closure', label: '길 통제 / 공사', icon: '🚧', desc: '자전거도로 차단, 하천 준설 공사, 우회로' },
    { id: 'damage', label: '도로 파손 / 요철', icon: '⚠️', desc: '포트홀, 맨홀 턱, 노면 균열 및 크랙' },
    { id: 'accident', label: '사고 / 낙차 주의', icon: '🚨', desc: '자전거 충돌, 보행자 혼잡, 급커브 위험' },
    { id: 'hazard', label: '장애물 / 토사', icon: '🍂', desc: '빗물 모래, 나뭇가지, 공사 적치물' },
    { id: 'flooding', label: '하천 침수 / 통제', icon: '🌊', desc: '집중호우 수위 상승, 징검다리 통제' },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !content.trim()) return;

    const categoryNames: Record<ReportCategory, string> = {
      closure: '길 통제/공사',
      accident: '사고/낙차 주의',
      damage: '도로 파손/요철',
      hazard: '장애물/토사',
      flooding: '하천 침수/통제',
    };

    const newRep: CommunityReport = {
      id: `rep-${Date.now()}`,
      coordinates: currentCoordinates,
      category,
      categoryName: categoryNames[category],
      title: title.trim(),
      location: location.trim(),
      content: content.trim(),
      timestamp: '방금 전',
      status: 'active',
      likes: 1,
      isLiked: true,
    };

    onSubmitReport(newRep);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-xs">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-red-50 border border-red-200 px-1.5 py-0.2 text-[10px] font-extrabold text-red-700">
                  실시간 제보
                </span>
                <h3 className="text-sm font-bold text-slate-900">도로 위험 & 통제 빠른 신고</h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">장애물·파손·공사·사고 정보를 라이더들과 공유</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center animate-in zoom-in-90 duration-300">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-base font-bold text-slate-900">제보가 안전하게 등록되었습니다!</h4>
            <p className="text-xs text-slate-500 mt-1">
              안양시 자전거 이용자 모두의 안전 주행에 큰 도움이 됩니다. 🚴
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                신고 / 제보 유형
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      category === c.id
                        ? 'border-red-500 bg-red-50/70 text-red-900 ring-2 ring-red-200'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base shrink-0">{c.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight">{c.label}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Input with Auto GPS fill */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">목격 위치</label>
                <button
                  type="button"
                  onClick={() => setLocation(currentLocationName || '내 현재 주행 위치')}
                  className="text-[10px] font-bold text-[#0055FF] hover:underline flex items-center gap-0.5"
                >
                  <MapPin size={10} /> 현재 위치 입력
                </button>
              </div>
              <input
                type="text"
                placeholder="예: 학의천 수촌교 부근 북단 자전거도로"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">제보 요약 제목</label>
              <input
                type="text"
                placeholder="예: 수변 데크로드 노면 파손으로 서행 필요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">상세 내용</label>
              <textarea
                rows={2}
                placeholder="상황에 대해 간단히 설명해 주세요 (우회로 여부, 서행 권고, 바닥 모래/단차 등)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Quick Link to Settings / Report Full Page */}
            <div
              onClick={() => {
                onClose();
                onGoToReportPage();
              }}
              className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 cursor-pointer hover:bg-blue-100 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2">
                <Megaphone size={14} className="text-[#0055FF]" />
                <span className="text-xs font-bold text-blue-900">
                  다른 라이더들의 실시간 제보 목록 전체 보기
                </span>
              </div>
              <ChevronRight size={14} className="text-[#0055FF]" />
            </div>

            {/* Submit Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 min-h-[44px]"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <ShieldAlert size={15} />
                <span>즉시 제보하기</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
