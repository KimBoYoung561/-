import { CheckCircle2, Flame, Gauge, Clock } from 'lucide-react';
import { RidingRecord } from '../types';

interface RideSummaryModalProps {
  record: RidingRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onViewRecords: () => void;
}

export default function RideSummaryModal({
  record,
  isOpen,
  onClose,
  onViewRecords,
}: RideSummaryModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 text-slate-900">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Badge Icon */}
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>

        <h2 className="text-xl font-bold text-slate-900">주행을 완료했습니다!</h2>
        <p className="mt-1 text-xs font-bold text-slate-700">{record.courseName}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{record.date}</p>

        {/* Big Metric: Distance */}
        <div className="my-5 rounded-2xl bg-blue-50 border border-blue-200 p-4">
          <span className="text-xs font-bold text-[#0055FF]">총 주행 거리</span>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-5xl font-black tracking-tight text-[#0055FF]">
              {record.distanceKm}
            </span>
            <span className="text-xl font-bold text-slate-700">km</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-center mb-5">
          <div className="flex flex-col items-center">
            <Clock size={16} className="text-[#0055FF] mb-1" />
            <span className="text-[11px] text-slate-500 font-bold">주행 시간</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5">
              {record.durationMinutes <= 1 ? '1분' : `${record.durationMinutes}분`}
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-200">
            <Gauge size={16} className="text-emerald-600 mb-1" />
            <span className="text-[11px] text-slate-500 font-bold">평균 속도</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5">{record.avgSpeedKmh} km/h</span>
          </div>
          <div className="flex flex-col items-center">
            <Flame size={16} className="text-amber-500 mb-1" />
            <span className="text-[11px] text-slate-500 font-bold">소모 열량</span>
            <span className="text-sm font-bold text-amber-600 mt-0.5">{record.calories} kcal</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onViewRecords}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0055FF] py-4 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>주행 기록 보러가기</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 border border-slate-200 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            지도로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
