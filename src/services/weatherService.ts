export interface WeatherSummary {
  tempC: number | null;
  windSpeedMps: number | null;
  windDirection: string;
  humidity: number | null;
  precipitationType: string;
  summary: string;
  airQualityLabel: string;
  uvLabel: string;
}

const KMA_SERVICE_KEY = 'xJTccV8Y5ncidvbMpb2EWknkSkXIk%2Bm3sXMsfiifXMABV29B%2Banj%2BhYvVbvTVqwRsAjEsri%2FZ34gsye2eDgFGA%3D%3D';
const KMA_BASE_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

const VALID_BASE_TIMES = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function getLocalDateParts(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return {
    year: local.getFullYear(),
    month: pad2(local.getMonth() + 1),
    day: pad2(local.getDate()),
    hour: local.getHours(),
  };
}

function getNearestBaseTime(date: Date) {
  const { year, month, day, hour } = getLocalDateParts(date);
  const currentHour = hour;
  let baseTime = '0200';

  for (const candidate of VALID_BASE_TIMES) {
    const candidateHour = Number(candidate.slice(0, 2));
    if (candidateHour <= currentHour) {
      baseTime = candidate;
    }
  }

  const candidateHour = Number(baseTime.slice(0, 2));
  const adjustedDate = new Date(date.getTime());
  if (candidateHour > currentHour && currentHour < 2) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }

  const adjusted = getLocalDateParts(adjustedDate);
  return {
    baseDate: `${adjusted.year}${adjusted.month}${adjusted.day}`,
    baseTime,
  };
}

function getWindDirectionFromDegrees(deg: number | null): string {
  if (deg === null || !Number.isFinite(deg)) return '무풍';
  const directions = ['북풍', '북동풍', '동풍', '남동풍', '남풍', '남서풍', '서풍', '북서풍'];
  const index = Math.round((deg % 360) / 45) % 8;
  return directions[index];
}

function getPrecipitationLabel (code: number | null): string {
  switch (code) {
    case 1:
      return '비';
    case 2:
      return '비/눈';
    case 3:
      return '눈';
    case 4:
      return '소나기';
    default:
      return '맑음';
  }
}

function getAirQualityLabel(tempC: number | null, humidity: number | null): string {
  if (tempC === null || humidity === null) return '양호';
  if (tempC >= 28 && humidity >= 70) return '보통';
  if (humidity >= 80) return '보통';
  return '좋음';
}

function getUvLabel(tempC: number | null, windSpeedMps: number | null): string {
  if (tempC === null || windSpeedMps === null) return '보통';
  if (tempC >= 30 && windSpeedMps <= 4) return '높음';
  if (tempC >= 26) return '보통';
  return '낮음';
}

function buildSummary(tempC: number | null, windSpeedMps: number | null): string {
  if (tempC === null && windSpeedMps === null) {
    return '현재 날씨 정보를 불러오고 있습니다.';
  }

  const tempText = tempC === null ? '기온 정보 없음' : `${Math.round(tempC)}°C`;
  const windText = windSpeedMps === null ? '풍속 정보 없음' : `${windSpeedMps.toFixed(1)}m/s`;

  if (tempC !== null && windSpeedMps !== null) {
    if (tempC >= 20 && tempC <= 28 && windSpeedMps <= 5) {
      return `현재 ${tempText}에 바람도 ${windText}로 자전거 타기 좋은 날씨입니다.`;
    }
    if (windSpeedMps > 7) {
      return `현재 ${tempText}이고 풍속 ${windText}로 바람이 강해 라이딩 준비를 더 신경 써야 합니다.`;
    }
    return `현재 ${tempText}이고 풍속 ${windText}로 무난한 라이딩 조건입니다.`;
  }

  return `현재 ${tempText}와 ${windText} 기준으로 라이딩 상태를 확인 중입니다.`;
}

function toGrid(lat: number, lng: number) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI / 4 + slat2 / 2) / Math.tan(Math.PI / 4 + slat1 / 2);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  const sf = Math.pow(Math.tan(Math.PI / 4 + lat * DEGRAD / 2), sn) * Math.cos(slat1) / Math.pow(Math.tan(Math.PI / 4 + slat1 / 2), sn);
  const ro = re * sf / Math.pow(Math.tan(Math.PI / 4 + olat / 2), sn);
  const theta = sn * (lng * DEGRAD - olon);

  const x = ro * Math.sin(theta) + XO;
  const y = ro * Math.cos(theta) + YO;

  return {
    nx: Math.round(x),
    ny: Math.round(y),
  };
}

export async function fetchKmaWeather(lat: number, lng: number): Promise<WeatherSummary> {
  const { baseDate, baseTime } = getNearestBaseTime(new Date());
  const { nx, ny } = toGrid(lat, lng);

  const url = `${KMA_BASE_URL}/getUltraSrtNcst?serviceKey=${encodeURIComponent(KMA_SERVICE_KEY)}&pageNo=1&numOfRows=100&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`KMA weather request failed: ${response.status}`);
  }

  const data = await response.json();
  const items = data?.response?.body?.items?.item ?? [];

  const itemMap = new Map<string, string | number>();
  items.forEach((item: any) => {
    itemMap.set(item.category, item.obsrValue ?? item.fcstValue ?? item.category);
  });

  const tempC = Number(itemMap.get('T1H'));
  const windSpeedMps = Number(itemMap.get('WSD'));
  const humidity = Number(itemMap.get('REH'));
  const vecDeg = Number(itemMap.get('VEC'));
  const precipitationCode = Number(itemMap.get('PTY'));

  return {
    tempC: Number.isFinite(tempC) ? tempC : null,
    windSpeedMps: Number.isFinite(windSpeedMps) ? windSpeedMps : null,
    windDirection: getWindDirectionFromDegrees(Number.isFinite(vecDeg) ? vecDeg : null),
    humidity: Number.isFinite(humidity) ? humidity : null,
    precipitationType: getPrecipitationLabel(Number.isFinite(precipitationCode) ? precipitationCode : null),
    summary: buildSummary(Number.isFinite(tempC) ? tempC : null, Number.isFinite(windSpeedMps) ? windSpeedMps : null),
    airQualityLabel: getAirQualityLabel(Number.isFinite(tempC) ? tempC : null, Number.isFinite(humidity) ? humidity : null),
    uvLabel: getUvLabel(Number.isFinite(tempC) ? tempC : null, Number.isFinite(windSpeedMps) ? windSpeedMps : null),
  };
}
