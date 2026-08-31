import { X, Navigation, MapPin, Phone, Clock, Check, ShieldAlert, Accessibility, Baby, Video, Building2 } from 'lucide-react';
import { Facility } from '../types';

interface FacilityDetailModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (fac: Facility) => void;
}

export default function FacilityDetailModal({
  facility,
  isOpen,
  onClose,
  onNavigateTo,
}: FacilityDetailModalProps) {
  if (!isOpen || !facility) return null;

  const isRestroom = facility.category === 'restroom';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200 text-slate-900 select-none">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-2xl shadow-sm">
              {facility.category === 'water' && '💧'}
              {facility.category === 'repair' && '🔧'}
              {facility.category === 'restroom' && '🚻'}
              {facility.category === 'parking' && '🚲'}
              {facility.category === 'cafe' && '☕'}
              {facility.category === 'hazard' && '⚠️'}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#0055FF] px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                  {facility.categoryName}
                </span>
                {facility.facilityType && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                    {facility.facilityType}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug mt-1.5">
                {facility.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 min-w-[44px] min-h-[44px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Restroom Safety / Accessibility Special Badges */}
        {isRestroom && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {facility.emergencyBell !== false && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-700">
                <ShieldAlert size={14} className="text-red-500 shrink-0" />
                <span>안심 비상벨 설치</span>
              </div>
            )}
            {facility.disabledToilet !== false && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">
                <Accessibility size={14} className="text-[#0055FF] shrink-0" />
                <span>장애인 화장실 완비</span>
              </div>
            )}
            {facility.cctv && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800">
                <Video size={14} className="text-amber-600 shrink-0" />
                <span>입구 방범용 CCTV</span>
              </div>
            )}
            {facility.diaperTable && (
              <div className="flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 px-3 py-2 text-xs font-bold text-purple-700">
                <Baby size={14} className="text-purple-600 shrink-0" />
                <span>기저귀 교환대</span>
              </div>
            )}
          </div>
        )}

        {/* Details description */}
        <p className="mt-4 text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
          {facility.description}
        </p>
        {facility.original && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            <p className="font-bold">원문 위치: {facility.original}</p>
            {facility.detail && <p className="mt-1">상세 안내: {facility.detail}</p>}
          </div>
        )}

        {/* Items available list */}
        {facility.availableItems && facility.availableItems.length > 0 && (
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-500 mb-2 block">
              구비 편의 시설
            </span>
            <div className="flex flex-wrap gap-1.5">
              {facility.availableItems.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700"
                >
                  <Check size={12} className="text-emerald-600" strokeWidth={3} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Address / Info rows */}
        <div className="mt-4 space-y-2.5 text-xs text-slate-600 border-t border-slate-200 pt-4">
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="text-[#0055FF] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 font-semibold">{facility.roadAddress || facility.address}</p>
              {facility.roadAddress && facility.address !== facility.roadAddress && (
                <p className="text-[11px] text-slate-500 mt-0.5">(지번) {facility.address}</p>
              )}
            </div>
            {facility.distance && (
              <span className="font-bold text-[#0055FF] shrink-0">{facility.distance}</span>
            )}
          </div>
          {facility.openHours && (
            <div className="flex items-center gap-2.5">
              <Clock size={14} className="text-slate-400 shrink-0" />
              <span className="text-slate-700 font-semibold">{facility.openHours}</span>
            </div>
          )}
          {facility.managementAgency && (
            <div className="flex items-center gap-2.5">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              <span className="text-slate-600">관리부서: <strong className="text-slate-800">{facility.managementAgency}</strong></span>
            </div>
          )}
          {facility.phone && (
            <div className="flex items-center gap-2.5">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <a href={`tel:${facility.phone}`} className="text-[#0055FF] underline font-semibold">
                {facility.phone}
              </a>
            </div>
          )}
        </div>

        {/* Navigation / Route button */}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 border border-slate-200 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigateTo(facility);
              onClose();
            }}
            className="flex-[1.8] flex items-center justify-center gap-2 rounded-xl bg-[#0055FF] py-3.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Navigation size={14} fill="currentColor" />
            <span>이곳으로 길찾기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
