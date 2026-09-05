import { AlertTriangle, Wind, ShieldAlert, CheckCircle2, CloudRain, Sun, Snowflake, Info, Sparkles } from 'lucide-react';
import { WeatherSummary } from '../services/weatherService';

interface WeatherCyclingSafetyBannerProps {
  weather: WeatherSummary | null;
  compact?: boolean;
  showChecklist?: boolean;
}

export default function WeatherCyclingSafetyBanner({
  weather,
  compact = false,
  showChecklist = true,
}: WeatherCyclingSafetyBannerProps) {
  const alert = weather?.safetyAlert;
  const isDanger = alert?.level === 'danger';
  const isWarning = alert?.level === 'warning';

  const toneConfig = isDanger
    ? {
        border: 'border-red-300',
        bg: 'bg-gradient-to-r from-red-50 to-orange-50',
        badgeBg: 'bg-red-500 text-white',
        badgeText: '기상 특보 / 위험',
        titleColor: 'text-red-900',
        descColor: 'text-red-800',
        bridgeBg: 'bg-red-100/90 border-red-300 text-red-950',
        icon: <ShieldAlert size={16} className="text-red-600 shrink-0" />,
      }
    : isWarning
    ? {
        border: 'border-amber-300',
        bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
        badgeBg: 'bg-amber-500 text-white',
        badgeText: '기상 주의보',
        titleColor: 'text-amber-950',
        descColor: 'text-amber-900',
        bridgeBg: 'bg-amber-100/90 border-amber-300 text-amber-950',
        icon: <AlertTriangle size={16} className="text-amber-600 shrink-0" />,
      }
    : {
        border: 'border-blue-200',
        bg: 'bg-gradient-to-r from-blue-50/90 via-sky-50 to-emerald-50/70',
        badgeBg: 'bg-blue-600 text-white',
        badgeText: '안전 라이딩 수칙',
        titleColor: 'text-blue-950',
        descColor: 'text-slate-800',
        bridgeBg: 'bg-blue-100/80 border-blue-200 text-blue-950',
        icon: <Sparkles size={16} className="text-[#0055FF] shrink-0" />,
      };

  if (compact) {
    return (
      <div className={`rounded-xl border ${toneConfig.border} ${toneConfig.bg} p-2.5 shadow-xs`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base leading-none">{alert?.icon || '🚲'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 truncate">
                  {alert?.title || '실시간 기상청 연동 안전 라이딩'}
                </span>
                <span className={`rounded px-1.5 py-0.2 text-[9px] font-black ${toneConfig.badgeBg}`}>
                  {toneConfig.badgeText}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-medium truncate mt-0.5">
                {alert?.bridgeWarning || alert?.message || '교량 및 하천 횡단 시 안전거리 확보'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-500 bg-white/70 px-2 py-0.5 rounded-full border border-slate-200">
              {weather?.windSpeedMps != null ? `${weather.windSpeedMps}m/s` : '1.8m/s'} {weather?.windDirection || ''}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${toneConfig.border} ${toneConfig.bg} p-3.5 shadow-xs space-y-2.5`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg leading-none">{alert?.icon || '🚲'}</span>
          <span className="text-xs font-black text-slate-900">
            {alert?.title || '실시간 기상청 안전 라이딩 수칙'}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-tight ${toneConfig.badgeBg}`}>
            {toneConfig.badgeText}
          </span>
        </div>

        <span className="flex items-center gap-1 rounded-full bg-white/80 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {weather?.dataSource || '기상청 초단기실황'}
        </span>
      </div>

      {/* Main Message */}
      <p className={`text-xs ${toneConfig.descColor} font-semibold leading-relaxed`}>
        {alert?.message || weather?.summary}
      </p>

      {/* Bridge / Open River Gust Warning (교량 및 하천 돌풍 주의) */}
      {alert?.bridgeWarning && (
        <div className={`rounded-xl border p-2 text-xs font-bold flex items-start gap-2 ${toneConfig.bridgeBg}`}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
          <div className="min-w-0">
            <span className="text-[10px] font-black text-amber-900 block">교량 및 하천 수변 주의구간:</span>
            <span className="text-[11px] font-medium leading-snug">{alert.bridgeWarning}</span>
          </div>
        </div>
      )}

      {/* Weather Quick Stats Bar */}
      <div className="grid grid-cols-4 gap-1.5 text-center bg-white/70 border border-slate-200/80 rounded-xl p-1.5">
        <div className="px-1 py-0.5">
          <div className="text-[9px] font-bold text-slate-500">기온</div>
          <div className="text-[11px] font-black text-slate-900">
            {weather?.temperatureC != null ? `${weather.temperatureC.toFixed(1)}℃` : '22℃'}
          </div>
        </div>
        <div className="px-1 py-0.5 border-l border-slate-200/80">
          <div className="text-[9px] font-bold text-slate-500">풍속/풍향</div>
          <div className="text-[11px] font-black text-slate-900">
            {weather?.windSpeedMps != null ? `${weather.windSpeedMps.toFixed(1)}m/s` : '1.8m/s'} {weather?.windDirection || ''}
          </div>
        </div>
        <div className="px-1 py-0.5 border-l border-slate-200/80">
          <div className="text-[9px] font-bold text-slate-500">습도/강수</div>
          <div className="text-[11px] font-black text-slate-900">
            {weather?.precipitationMm && weather.precipitationMm > 0
              ? `${weather.precipitationMm}mm`
              : `${weather?.humidity ?? 50}%`}
          </div>
        </div>
        <div className="px-1 py-0.5 border-l border-slate-200/80">
          <div className="text-[9px] font-bold text-slate-500">자외선</div>
          <div className="text-[11px] font-black text-slate-900">
            {weather?.uvLabel || '보통'}
          </div>
        </div>
      </div>

      {/* Safety Checklist */}
      {showChecklist && alert?.checklist && alert.checklist.length > 0 && (
        <div className="space-y-1 pt-0.5">
          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-600" />
            주행 전 필수 체크리스트
          </p>
          <div className="space-y-1">
            {alert.checklist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-white/80 border border-slate-200/60 rounded-lg px-2.5 py-1 font-medium"
              >
                <span className="h-1 w-1 rounded-full bg-[#0055FF] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
