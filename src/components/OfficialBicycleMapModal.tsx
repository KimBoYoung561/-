import { useState } from 'react';
import {
  X,
  Shield,
  Wrench,
  Navigation,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react';
import { OFFICIAL_STREAM_LINES, OFFICIAL_RAMP_POINTS } from '../data/courses';

interface OfficialBicycleMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStreamCourse?: (streamId: string) => void;
}

export default function OfficialBicycleMapModal({
  isOpen,
  onClose,
  onSelectStreamCourse,
}: OfficialBicycleMapModalProps) {
  const [activeTab, setActiveTab] = useState<'streams' | 'ramps' | 'insurance' | 'repair'>('streams');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[88vh] max-h-[780px] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-[#0055FF] border border-blue-200 shadow-sm">
              <Compass size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#0055FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  안양시 공식 가이드
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                안양시 공식 자전거 지도 및 시민 가이드
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 min-w-[44px] min-h-[44px] items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 shrink-0 overflow-x-auto hide-scrollbar">
          {[
            { id: 'streams', label: '5대 하천 노선망', icon: '🌊' },
            { id: 'ramps', label: '진출입 램프/쉼터', icon: '📍' },
            { id: 'repair', label: '무료 정비소', icon: '🔧' },
            { id: 'insurance', label: '시민 자전거보험', icon: '🛡️' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 border-b-2 py-3 px-3.5 text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'border-[#0055FF] text-[#0055FF] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* 1. 5대 하천 노선망 */}
          {activeTab === 'streams' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={16} className="text-[#0055FF]" />
                  <h3 className="text-xs font-bold text-[#0055FF]">안양시 자전거도로 노선지정 고시 기준</h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  안양시 공식 자전거도로 고시도면에 명시된 3대 세부 유형을 기반으로 모든 길찾기 경로에서 구간별 비율을 정확히 안내합니다.
                </p>

                {/* 3 Road Type Indicators */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-xl p-2 border border-red-200">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EF4444] mb-1" />
                    <p className="text-[11px] font-bold text-red-600">하천변 도로</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">빨간색 (수변전용)</p>
                  </div>
                  <div className="bg-white rounded-xl p-2 border border-blue-900/20">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1E3A8A] mb-1" />
                    <p className="text-[11px] font-bold text-[#1E3A8A]">분리도로</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">남색 (보·차도 분리)</p>
                  </div>
                  <div className="bg-white rounded-xl p-2 border border-sky-200">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#38BDF8] mb-1" />
                    <p className="text-[11px] font-bold text-sky-600">비분리도로</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">하늘색 (보행자 겸용)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {OFFICIAL_STREAM_LINES.map((stream) => (
                  <div
                    key={stream.id}
                    className="rounded-2xl bg-slate-50 border border-slate-200 p-4 hover:border-blue-300 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: stream.color }}
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{stream.name}</h4>
                          <span className="text-xs text-slate-500">
                            총 연장 {stream.totalDistanceKm}km · {stream.type}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#0055FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {stream.streamName}
                      </span>
                    </div>

                    <p className="mt-2.5 text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                      {stream.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-200">
                      <div className="text-[11px] text-slate-500">
                        기종점: <span className="font-semibold text-slate-700">{stream.path.length}개 GPS 실측 포인트</span>
                      </div>
                      {onSelectStreamCourse && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectStreamCourse(stream.id);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-[#0055FF] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 active:scale-95 transition-all"
                        >
                          <span>이 노선으로 달리기</span>
                          <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. 진출입 램프/쉼터 */}
          {activeTab === 'ramps' && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <h3 className="text-xs font-bold text-emerald-800">무장애 경사로 및 공식 쉼터</h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  노약자 및 유모차, 휠체어도 안전하게 진출입할 수 있는 완만한 슬로프 및 자전거 거점 쉼터 위치입니다.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {OFFICIAL_RAMP_POINTS.map((ramp) => (
                  <div
                    key={ramp.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 p-3.5 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-base shadow-sm">
                        🚴
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{ramp.name}</h4>
                        <span className="text-[11px] text-slate-500">{ramp.type} · 연결: {ramp.connectedRoad}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      계단 없음
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 상설 무료 정비소 */}
          {activeTab === 'repair' && (
            <div className="space-y-4">
              {/* Ssanggaeul Main Center */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        상설 운영 센터
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">쌍개울 자전거 상설 무료정비소</h4>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl bg-white p-3 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock size={14} className="text-[#0055FF]" />
                    <span>운영시간: 화요일~일요일 10:00 ~ 17:00 (월요일/공휴일 휴무)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone size={14} className="text-emerald-600" />
                    <span>문의전화: 안양시 도로과 031-8045-2435</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                  <p className="font-bold text-slate-800">무료 지원 서비스:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                    <li>타이어 공기압 보충 및 펑크 무료 수리</li>
                    <li>브레이크 오일 및 패드 마모 점검, 장력 조절</li>
                    <li>기어 변속 세팅 및 체인 윤활유 주입</li>
                    <li>핸들/안장 체결부 유격 점검 및 안전 진단</li>
                  </ul>
                </div>
              </div>

              {/* Mobile Service */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚐</span>
                  <h4 className="text-xs font-bold text-slate-900">동 주민센터 찾아가는 이동수리반</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  3월부터 11월까지 만안구 및 동안구 각 동 주민센터를 순회하며 무료 자전거 정비 및 부품 교체(실비)를 지원합니다.
                </p>
              </div>
            </div>
          )}

          {/* 4. 안양시민 자전거 단체보험 */}
          {activeTab === 'insurance' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield size={18} className="text-[#0055FF]" />
                  <h3 className="text-sm font-bold text-[#0055FF]">안양시민 자전거 무료 단체보험</h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  안양시에 주민등록이 되어 있는 모든 시민(외국인 등록자 포함)은 별도 가입 절차 없이 자동으로 보험 혜택이 적용됩니다. (전국 어디서나 사고 시 보장)
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 px-1">주요 보장 내용 요약</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">자전거 사고 사망 / 후유장해</span>
                    <span className="font-bold text-[#0055FF]">최대 2,000만원</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">상해 진단위로금 (4주~8주 이상)</span>
                    <span className="font-bold text-emerald-600">20만원 ~ 60만원</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">4주 이상 진단 시 6일 이상 입원위로금</span>
                    <span className="font-bold text-slate-900">20만원 추가 지급</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">자전거 사고 벌금 / 변호사 선임비</span>
                    <span className="font-bold text-slate-900">최대 2,000만원 / 200만원</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-100 p-3 text-[11px] text-slate-600">
                <p className="font-bold text-slate-800">보험금 청구 및 상담:</p>
                <p className="mt-0.5">DB손해보험 자전거보험 전담 콜센터: 1899-7751</p>
                <p>청구 시효: 사고 발생일로부터 3년 이내</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Close Button */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#0055FF] py-3.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
}
