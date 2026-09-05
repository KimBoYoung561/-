import { X, MapPin, Sparkles, Navigation, ExternalLink, ShieldCheck, TreePine, Wrench } from 'lucide-react';
import { AnyangTourSpot } from '../data/anyangAttractions';
import { WeatherSummary } from '../services/weatherService';
import WeatherCyclingSafetyBanner from './WeatherCyclingSafetyBanner';

interface AttractionDetailModalProps {
  spot: AnyangTourSpot | null;
  isOpen: boolean;
  onClose: () => void;
  onFocusOnMap?: (spot: AnyangTourSpot) => void;
  weather?: WeatherSummary | null;
}

export default function AttractionDetailModal({
  spot,
  isOpen,
  onClose,
  onFocusOnMap,
  weather,
}: AttractionDetailModalProps) {
  if (!isOpen || !spot) return null;

  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(spot.name)},${spot.lat},${spot.lng}`;
  const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(spot.name)}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-[28px] sm:rounded-3xl bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom duration-300">
        
        {/* Top Image Banner */}
        <div className="relative h-48 sm:h-56 w-full shrink-0 bg-slate-800 overflow-hidden">
          <img
            src={spot.imageUrl}
            alt={spot.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Official Image Attribution */}
          <div className="absolute top-3.5 left-4 z-10 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-medium text-white/90 border border-white/10">
            출처: {spot.imageSource || '안양시 문화관광'}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 flex h-9 w-9 min-w-[36px] min-h-[36px] items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-95 transition-all"
            aria-label="닫기"
          >
            <X size={18} />
          </button>

          {/* Badge & Title */}
          <div className="absolute bottom-3.5 left-4 right-4 text-white">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {spot.nineGyeongNumber ? (
                <span className="rounded-full bg-amber-500 text-slate-950 px-2.5 py-0.5 text-xs font-black shadow-sm flex items-center gap-1">
                  <ShieldCheck size={13} className="text-slate-950" />
                  안양 9경 · 제{spot.nineGyeongNumber}경
                </span>
              ) : (
                <span className="rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-xs font-black shadow-sm flex items-center gap-1">
                  <MapPin size={12} className="text-white" />
                  {spot.categoryLabel}
                </span>
              )}
              <span className="rounded-full bg-white/20 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold">
                {spot.dong}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight drop-shadow-md">
              {spot.name}
            </h2>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* AI Summary Highlight */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 border border-blue-200/80 p-4 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#0055FF] mb-1.5">
              <Sparkles size={15} />
              AI 핵심 추천 포인트
            </div>
            <p className="text-sm font-bold text-slate-900 leading-relaxed">
              {spot.aiSummary}
            </p>
          </div>

          {/* Real-time Weather & Cycling Safety Tips */}
          {weather && (
            <WeatherCyclingSafetyBanner weather={weather} compact={false} showChecklist={false} />
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-1">상세 안내</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {spot.description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {spot.tags.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Address & Dong */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex items-start gap-2 text-xs">
              <MapPin size={16} className="text-[#0055FF] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">{spot.address}</span>
                <span className="text-slate-500 ml-1">({spot.dong})</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs">
              <TreePine size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-800">자전거 라이딩 팁: </span>
                <span className="text-slate-700">{spot.ridingTip}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs">
              <Wrench size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-800">주변 편의시설: </span>
                <span className="text-slate-700">{spot.nearbyFacility}</span>
              </div>
            </div>
          </div>

          {/* Official Website Banner if Available */}
          {spot.officialUrl && (
            <a
              href={spot.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs font-bold text-[#0055FF] hover:bg-blue-100 transition-colors"
            >
              <span>안양시 문화관광 공식 상세정보 보기</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 shrink-0 flex gap-2">
          {onFocusOnMap && (
            <button
              type="button"
              onClick={() => {
                onFocusOnMap(spot);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-300 py-3 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-100 active:scale-98 min-h-[44px] transition-all"
            >
              <MapPin size={15} className="text-[#0055FF]" />
              <span>지도에서 위치 확인</span>
            </button>
          )}

          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] py-3 text-xs font-black text-[#191919] shadow-sm hover:brightness-95 active:scale-98 min-h-[44px] transition-all"
          >
            <Navigation size={14} fill="currentColor" />
            <span>카카오맵 길찾기</span>
          </a>

          <a
            href={naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#03C75A] py-3 text-xs font-black text-white shadow-sm hover:brightness-95 active:scale-98 min-h-[44px] transition-all"
          >
            <ExternalLink size={14} />
            <span>네이버지도</span>
          </a>
        </div>
      </div>
    </div>
  );
}
