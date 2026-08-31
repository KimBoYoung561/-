import { useState } from 'react';
import { RidingRecord } from '../types';
import {
  Trophy,
  Navigation,
  Trash2,
  ShieldCheck,
  BellRing,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Bike,
} from 'lucide-react';

interface RecordTabProps {
  records: RidingRecord[];
  onSelectRecordRoute: (record: RidingRecord) => void;
  onClearRecords: () => void;
}

export default function RecordTab({
  records,
  onSelectRecordRoute,
  onClearRecords,
}: RecordTabProps) {
  const [selectedFilter] = useState<'all' | 'week' | 'month'>('all');

  const totalKm = Math.round(records.reduce((acc, r) => acc + r.distanceKm, 0) * 10) / 10;
  const totalMinutes = records.reduce((acc, r) => acc + r.durationMinutes, 0);
  const totalCalories = records.reduce((acc, r) => acc + r.calories, 0);
  const avgSpeed = records.length
    ? Math.round((records.reduce((acc, r) => acc + r.avgSpeedKmh, 0) / records.length) * 10) / 10
    : 0;

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-5 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">내 주행 기록</h1>
            <p className="text-xs text-slate-500 mt-0.5">안양시 자전거길 주행 내역 및 운동 통계</p>
          </div>
          <span className="text-xs font-bold text-[#0055FF] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            총 {records.length}회 주행
          </span>
        </div>

        {/* Summary Card */}
        <div className="mt-5 rounded-3xl bg-gradient-to-br from-[#0055FF] to-[#003bb3] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between text-blue-100 text-xs font-bold">
            <span>총 주행 거리</span>
            <span className="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-white text-[11px]">
              <Trophy size={13} />
              목표 달성 78%
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight leading-none">{totalKm}</span>
            <span className="text-xl font-bold text-blue-100">km</span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/20 pt-3 text-center">
            <div>
              <p className="text-[11px] font-bold text-blue-100">총 주행 시간</p>
              <p className="text-sm font-bold text-white mt-0.5">{Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분</p>
            </div>
            <div className="border-x border-white/20">
              <p className="text-[11px] font-bold text-blue-100">평균 속도</p>
              <p className="text-sm font-bold text-white mt-0.5">{avgSpeed} km/h</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-100">소모 열량</p>
              <p className="text-sm font-bold text-white mt-0.5">{totalCalories} kcal</p>
            </div>
          </div>
        </div>

        {/* Weekly Bar Graph Visualizer */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="text-xs font-bold text-slate-600">주간 주행량 (km)</span>
            <span className="text-xs text-emerald-600 font-bold">+14.2% 지난주 대비</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-20 pt-3 px-1">
            {[
              { day: '월', km: 4.2, h: 40 },
              { day: '화', km: 2.9, h: 28 },
              { day: '수', km: 6.5, h: 65 },
              { day: '목', km: 0, h: 6 },
              { day: '금', km: 5.1, h: 50 },
              { day: '토', km: 9.8, h: 90 },
              { day: '일', km: 3.5, h: 35 },
            ].map((bar, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full bg-slate-200 rounded-t-md overflow-hidden flex items-end h-14">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      bar.km > 6 ? 'bg-[#0055FF]' : 'bg-slate-400'
                    }`}
                    style={{ height: `${bar.h}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="px-6 pt-5 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-600">최근 주행 기록</h2>
          {records.length > 0 && (
            <button
              type="button"
              onClick={onClearRecords}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={13} />
              <span>기록 초기화</span>
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center border border-slate-200 shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Navigation size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">아직 주행 기록이 없습니다</p>
            <p className="mt-1 text-xs text-slate-500">안양천 자전거길에서 첫 주행을 시작해보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">{rec.date}</span>
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        주행 완료
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">{rec.courseName}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectRecordRoute(rec)}
                    className="flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#0055FF] hover:bg-blue-100 active:scale-95 transition-all"
                  >
                    <span>코스 보기</span>
                  </button>
                </div>

                <div className="mt-3.5 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-center text-xs">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">거리</p>
                    <p className="font-bold text-slate-900 mt-0.5">{rec.distanceKm}km</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">시간</p>
                    <p className="font-bold text-slate-900 mt-0.5">{rec.durationMinutes}분</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">평균속도</p>
                    <p className="font-bold text-slate-900 mt-0.5">{rec.avgSpeedKmh}km/h</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">칼로리</p>
                    <p className="font-bold text-amber-600 mt-0.5">{rec.calories}kcal</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <BellRing size={16} className="text-amber-600" />
              <h3 className="text-sm font-black text-slate-900">오늘의 체크리스트 / 정비 알림</h3>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600">D-3 유지보수</p>
                  <p className="mt-1 text-base font-black text-slate-900">체인 오일링 D-3</p>
                  <p className="mt-1 text-[11px] text-slate-600">라이딩 전 필수 점검: 체인 상태, 타이어 압력, 브레이크 마찰, 안장 고정 여부를 확인해 주세요.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-sky-600" />
              <h3 className="text-sm font-black text-slate-900">자전거 안전 수칙</h3>
            </div>

            <div className="space-y-2.5">
              {[
                '자전거에서는 반드시 헬멧 착용 및 안전모를 우선 확인하세요.',
                '횡단보도에서는 자전거에서 내려 보행자로 건너세요.',
                '야간에는 라이트와 반사판을 점검하고, 보행자 우선 구역을 지켜주세요.',
                '고속 주행 시 앞차 간격을 충분히 유지하고, 급정거는 피해주세요.',
              ].map((rule, index) => (
                <div key={rule} className="flex gap-2 rounded-2xl border border-sky-100 bg-white/80 p-2.5">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[10px] font-black text-sky-700">
                    {index + 1}
                  </div>
                  <p className="text-[12px] leading-5 text-slate-700">{rule}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-sky-200 bg-white/80 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Bike size={15} className="text-sky-700" />
                <span className="text-[11px] font-black text-slate-800">수신호 사진 설명</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-sky-50 p-2.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">🚦</div>
                <p className="text-[11px] leading-5 text-slate-700">
                  좌측 수신호는 자전거 통행 시 반드시 지켜야 하는 신호 지시를 의미합니다. 신호를 확인하고 정차·출발을 안전하게 진행하세요.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Phone size={16} className="text-red-600" />
              <h3 className="text-sm font-black text-slate-900">위급시 전화번호</h3>
            </div>

            <div className="space-y-2">
              {[
                ['응급상황', '119'],
                ['안양시 자전거 안전 상담', '031-8045-XXXX'],
                ['지역 경찰청/교통상황', '112'],
              ].map(([label, number]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-red-100 bg-white/80 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-red-600" />
                    <span className="text-[12px] font-bold text-slate-800">{label}</span>
                  </div>
                  <span className="text-sm font-black text-red-700">{number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
