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
  Hand,
  ArrowLeft,
  ArrowRight,
  Octagon,
  TrendingDown,
  Building2,
  Scale,
  Car,
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
  const totalKm = Math.round(records.reduce((acc, r) => acc + r.distanceKm, 0) * 10) / 10;
  const totalMinutes = records.reduce((acc, r) => acc + r.durationMinutes, 0);
  const totalCalories = records.reduce((acc, r) => acc + r.calories, 0);
  const avgSpeed = records.length
    ? Math.round((records.reduce((acc, r) => acc + r.avgSpeedKmh, 0) / records.length) * 10) / 10
    : 0;

  // Hand Signals Guide Data
  const handSignals = [
    {
      title: '좌회전 (진로 좌측 변경)',
      action: '왼팔을 수평으로 핀다.',
      icon: ArrowLeft,
      badge: '좌회전',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      title: '우회전 (진로 우측 변경)',
      action: '오른팔을 수평으로 핀다.',
      icon: ArrowRight,
      badge: '우회전',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
      title: '정지 (주행 정지/정차)',
      action: '팔을 45° 밑으로 내린다.',
      icon: Octagon,
      badge: '정지신호',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      title: '노면 위험/장애물 주의',
      action: '검지손가락으로 아래방향을 가리키면서 신호를 보낸다.',
      icon: AlertTriangle,
      badge: '장애물',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      title: '서행 (속도 감속)',
      action: '손을 위와 아래방향으로 흔든다.',
      icon: TrendingDown,
      badge: '서행신호',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  // Anyang Public Emergency & Organization Contacts
  const anyangContacts = [
    { label: '안양시청', number: '031-8045-2222', note: '야간/통합민원' },
    { label: '만안구청', number: '031-8045-3222', altNumber: '031-8045-7000', note: '야간' },
    { label: '동안구청', number: '031-8045-4222', note: '야간' },
    { label: '만안경찰서', number: '031-8041-6321', note: '교통/사고접수' },
    { label: '동안경찰서', number: '031-478-7321', note: '교통/사고접수' },
    { label: '수원지방법원 안양지원', number: '031-8086-1114', note: '사법지원' },
    { label: '수원지방검찰청 안양지청', number: '031-470-4200', note: '검찰민원' },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-5 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">내 주행 기록</h1>
            <p className="text-xs text-slate-500 mt-0.5">안양시 자전거길 주행 내역 및 안전 수칙</p>
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
      <div className="px-6 pt-5 pb-8 space-y-6">
        <div>
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
        </div>

        {/* 1. Maintenance Notification Checklist */}
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
          <div className="mb-2.5 flex items-center gap-2">
            <BellRing size={18} className="text-amber-600" />
            <h3 className="text-sm font-black text-slate-900">오늘의 체크리스트 / 정비 알림</h3>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/90 p-3.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="inline-block rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5">D-3 정기 점검</span>
                <p className="mt-1 text-sm font-black text-slate-900">체인 오일링 D-3</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  라이딩 전 필수 점검: 체인 장력 및 윤활 상태, 타이어 적정 공기압, 브레이크 제동 마찰, 핸들 및 안장 고정 상태를 반드시 확인해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bicycle Hand Signals Guide (사고를 예방하는 자전거 수신호 요령) */}
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0055FF] text-white">
                <Hand size={15} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">사고를 예방하는 자전거 수신호 요령</h3>
                <span className="text-[10px] text-blue-700 font-bold">도로교통법 규정 수신호</span>
              </div>
            </div>
            <span className="rounded-full bg-blue-100 text-[#0055FF] text-[10px] font-extrabold px-2 py-0.5">
              필수 안전수칙
            </span>
          </div>

          <div className="rounded-2xl bg-white/90 border border-blue-200 p-3 text-xs text-slate-700 leading-relaxed font-medium">
            💡 <strong className="text-slate-900">자전거는 신호등이 없기 때문에</strong> 신호를 하고자 할 때 <span className="text-[#0055FF] font-bold">손으로 수신호</span>를 하여야 합니다. (도로교통법 제38조)
          </div>

          <div className="space-y-2.5">
            {handSignals.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl bg-white border border-slate-200/90 p-3.5 shadow-2xs hover:border-blue-300 transition-colors"
                >
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF] shrink-0 border border-blue-100">
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-black text-slate-900 truncate">{item.title}</h4>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-semibold flex items-center gap-1">
                      👉 <span className="text-[#0055FF] font-bold">{item.action}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Accident Response Guide (자전거 사고 대처요령) */}
        <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-orange-50 to-white p-5 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-600 text-white">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">자전거 사고 대처요령</h3>
              <p className="text-[10px] text-rose-700 font-bold">사고 발생 시 올바른 법적 대처 절차</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-rose-200 p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-slate-900 leading-relaxed">
                자전거 주행 중 사고도 <span className="text-rose-600 underline">교통사고</span>임을 명심하고 교통 법규를 준수하여야 하며 사고 발생 시 법에 따른 조치를 하여야 합니다.
              </p>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-slate-100 rounded-xl bg-rose-50/50 p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-black text-slate-900">
                <Car className="h-3.5 w-3.5 text-rose-600" />
                <span>자전거와 차 (자동차, 자전거 등) 대처</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed list-disc list-inside">
                <li>
                  <strong>차대차 사고로 사람이 다치지 않고 물적 피해만 있을 경우</strong>: 경찰 사건처리는 불필요합니다.
                </li>
                <li>
                  당사자끼리 합의하고 보험사 등에 연락합니다. <span className="text-rose-600 font-bold">(합의가 안 될 시 경찰에 신고)</span>
                </li>
                <li>
                  인명 피해가 발생한 경우 즉시 119 구호 조치 및 112 경찰 신고를 우선 진행합니다.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Anyang Public Institutions Contact Numbers (안양시 주요기관 연락처) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Building2 size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">안양시 주요기관 연락처</h3>
                <p className="text-[10px] text-slate-500">긴급상황 및 야간·민원 신고</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400">터치 시 바로 통화</span>
          </div>

          {/* Quick Emergency 112 & 119 */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:119"
              className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-3 hover:bg-rose-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-xs">
                  119
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 font-bold block">소방 / 응급구조</span>
                  <span className="text-xs font-black text-slate-900">119 신고</span>
                </div>
              </div>
              <Phone size={14} className="text-rose-600" />
            </a>

            <a
              href="tel:112"
              className="flex items-center justify-between rounded-2xl bg-blue-50 border border-blue-200 p-3 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0055FF] text-white font-black text-xs">
                  112
                </div>
                <div>
                  <span className="text-[10px] text-blue-600 font-bold block">경찰 / 범죄·사고</span>
                  <span className="text-xs font-black text-slate-900">112 신고</span>
                </div>
              </div>
              <Phone size={14} className="text-[#0055FF]" />
            </a>
          </div>

          {/* Anyang City, Districts, Police, Court, Prosecution contacts */}
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
            {anyangContacts.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{contact.label}</span>
                    {contact.note && (
                      <span className="rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.2">
                        {contact.note}
                      </span>
                    )}
                  </div>
                  {contact.altNumber && (
                    <p className="text-[11px] text-slate-400 mt-0.5">보조: {contact.altNumber}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${contact.number.replace(/-/g, '')}`}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0055FF] text-xs font-black px-3 py-1.5 transition-all active:scale-95"
                  >
                    <Phone size={12} />
                    <span>{contact.number}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Anyang Citizen Free Bicycle Group Insurance Note */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-700 leading-relaxed">
              <strong className="text-emerald-800">안양시민 무료 자전거 단체보험:</strong> 안양시 주민등록 시민은 별도 가입 없이 자전거 사고 시 치료비·상해 보장을 지원받을 수 있습니다. (전담 콜센터: 1899-7751)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

