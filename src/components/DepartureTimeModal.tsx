import { useState, useEffect } from 'react';
import { Clock, X, Check } from 'lucide-react';
import { getCurrentTimeString, getCalculatedArrivalTime } from '../utils/routeUtils';

interface DepartureTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: string;
  durationMinutes: number;
  onApplyTime: (departureTime: string, arrivalTime: string) => void;
}

export default function DepartureTimeModal({
  isOpen,
  onClose,
  currentTime,
  durationMinutes,
  onApplyTime,
}: DepartureTimeModalProps) {
  const now = new Date();
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  const [selectedHour, setSelectedHour] = useState(currentH);
  const [selectedMinute, setSelectedMinute] = useState(currentM);

  useEffect(() => {
    if (isOpen) {
      if (currentTime && currentTime.includes(':')) {
        const [h, m] = currentTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          setSelectedHour(h);
          setSelectedMinute(m);
          return;
        }
      }
      const d = new Date();
      setSelectedHour(d.getHours());
      setSelectedMinute(d.getMinutes());
    }
  }, [isOpen, currentTime]);

  if (!isOpen) return null;

  const calculateArrival = (h: number, m: number) => {
    const totalM = h * 60 + m + durationMinutes;
    const arrH = Math.floor(totalM / 60) % 24;
    const arrM = totalM % 60;
    return `${arrH.toString().padStart(2, '0')}:${arrM.toString().padStart(2, '0')}`;
  };

  const handleApply = (h: number, m: number) => {
    const dep = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const arr = calculateArrival(h, m);
    onApplyTime(dep, arr);
    onClose();
  };

  const currentDep = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  const currentArr = calculateArrival(selectedHour, selectedMinute);

  const getAddMinuteTime = (addM: number) => {
    const total = currentH * 60 + currentM + addM;
    return {
      h: Math.floor(total / 60) % 24,
      m: total % 60,
    };
  };

  const p10 = getAddMinuteTime(10);
  const p30 = getAddMinuteTime(30);

  const presets = [
    { label: '지금 출발', h: currentH, m: currentM },
    { label: '10분 후', h: p10.h, m: p10.m },
    { label: '30분 후', h: p30.h, m: p30.m },
    { label: '오후 1:00', h: 13, m: 0 },
    { label: '오후 3:00', h: 15, m: 0 },
    { label: '오후 6:00', h: 18, m: 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#0055FF]" />
            <h3 className="text-base font-bold text-slate-900">출발 예정 시간 설정</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 min-w-[44px] min-h-[44px] items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Calculation Preview */}
        <div className="my-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
          <div className="flex items-center justify-around">
            <div>
              <p className="text-xs font-bold text-slate-500">출발 시간</p>
              <p className="text-2xl font-black text-[#0055FF] mt-0.5">{currentDep}</p>
            </div>
            <span className="text-slate-400 font-bold text-lg">→</span>
            <div>
              <p className="text-xs font-bold text-slate-500">도착 예정 ({durationMinutes}분 소요)</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{currentArr}</p>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 mb-2.5">빠른 시간 선택</p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedHour(preset.h);
                  setSelectedMinute(preset.m);
                }}
                className={`rounded-xl py-3 px-1 min-h-[44px] text-xs font-bold transition-all ${
                  selectedHour === preset.h && selectedMinute === preset.m
                    ? 'bg-[#0055FF] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          type="button"
          onClick={() => handleApply(selectedHour, selectedMinute)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0055FF] py-3.5 min-h-[48px] text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Check size={16} strokeWidth={2.5} />
          <span>시간 적용하기</span>
        </button>
      </div>
    </div>
  );
}
