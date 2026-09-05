export interface CyclingSafetyAlert {
  level: 'danger' | 'warning' | 'caution' | 'info';
  title: string;
  message: string;
  bridgeWarning?: string;
  icon: string;
  checklist: string[];
  source: 'kma' | 'openmeteo' | 'fallback';
}

export interface WeatherSummary {
  temperatureC?: number;
  windSpeedMps?: number;
  windDirection?: string;
  airQualityLabel?: string;
  uvLabel?: string;
  summary?: string;
  humidity?: number;
  precipitationMm?: number;
  ptyCode?: number; // 0: 없음, 1: 비, 2: 비/눈, 3: 눈, 5: 빗방울, 6: 빗방울눈날림, 7: 눈날림
  skyLabel?: string;
  dataSource?: 'KMA(기상청 초단기실황)' | 'KMA(기상청 초단기예보)' | 'Open-Meteo' | '기본값';
  safetyAlert?: CyclingSafetyAlert;
}

// Provided KMA Service Key
const KMA_SERVICE_KEY = 'rM2VHPvXKwtnHuWU3YyT0qdHGgMtHUuoGBdHL1n80k2RJLoplVh%2BSs5slO7eqe5idbw7mj6zFXuABoIaqx609Q%3D%3D';

// Lambert Conformal Conic (LCC) Grid conversion for Korea Meteorological Administration (기상청 격자 좌표 변환)
export function dfsXyConv(lat: number, lng: number): { nx: number; ny: number } {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}

// Convert degree to 16 wind directions in Korean
export function degreeToWindDirection(deg: number): string {
  const directions = [
    '북풍', '북북동풍', '북동풍', '동북동풍',
    '동풍', '동남동풍', '남동풍', '남남동풍',
    '남풍', '남남서풍', '남서풍', '서남서풍',
    '서풍', '서북서풍', '북서풍', '북북서풍'
  ];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index] || '남서풍';
}

function getUvLabel(uvIndex: number): string {
  if (uvIndex < 3) return '낮음';
  if (uvIndex < 6) return '보통';
  if (uvIndex < 8) return '높음';
  if (uvIndex < 11) return '매우 높음';
  return '위험';
}

// Helper to get KMA Base Date and Time formatted string
function getKmaBaseDateTime(): { baseDate: string; baseTime: string } {
  const now = new Date();
  // KMA nowcast is updated at 40 mins past each hour. If before 45 mins, use previous hour
  let target = new Date(now.getTime());
  if (now.getMinutes() < 45) {
    target = new Date(now.getTime() - 60 * 60 * 1000);
  }

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  const hh = String(target.getHours()).padStart(2, '0');

  return {
    baseDate: `${yyyy}${mm}${dd}`,
    baseTime: `${hh}00`,
  };
}

/**
 * Generate specific cycling safety tips and alerts based on current weather factors (wind, rain, temp, humidity, etc.)
 */
export function generateCyclingSafetyAlert(weather: {
  temp: number;
  windSpeed: number;
  windDir?: string;
  ptyCode?: number;
  precip?: number;
  source: 'kma' | 'openmeteo' | 'fallback';
}): CyclingSafetyAlert {
  const { temp, windSpeed, windDir, ptyCode = 0, precip = 0, source } = weather;

  // 1. Heavy Wind Alert (풍속 6.0 m/s 이상 위험, 4.0 m/s 이상 주의)
  if (windSpeed >= 6.0) {
    return {
      level: 'danger',
      icon: '💨',
      title: `강풍 경보 발효 (풍속 ${windSpeed.toFixed(1)}m/s ${windDir || ''})`,
      message: `안양천·학의천 교량(비산교, 안양대교, 학의교 등) 횡단 시 측면 돌풍에 각별히 유의하세요!`,
      bridgeWarning: `교량 난간 통과 시 자전거가 순간적으로 밀릴 수 있으므로 양손으로 핸들을 꽉 잡고 서행하세요.`,
      checklist: [
        '교량 및 제방 통과 시 감속 & 양손 핸들 파지',
        '맞바람 구간 기어 1~2단 낮추고 페이스 조절',
        '낙엽, 비산물, 현수막 이탈 위험 주의',
      ],
      source,
    };
  }

  if (windSpeed >= 4.0) {
    return {
      level: 'warning',
      icon: '💨',
      title: `돌풍 및 강바람 주의 (풍속 ${windSpeed.toFixed(1)}m/s ${windDir || ''})`,
      message: `교량 위 및 하천 개활지 구간에서 측면 맞바람에 유의하세요.`,
      bridgeWarning: `교량 진출입 램프 및 오픈된 수변 구간 통과 시 흔들림에 주의하세요.`,
      checklist: [
        '교량 통과 시 핸들 양손 파지 및 안전거리 2배 유지',
        '추월 시 측면 바람 간섭 고려',
        '하천 맞바람 구간 체력 안배',
      ],
      source,
    };
  }

  // 2. Rain / Snow / Slippery road alert (강수, 눈, 결빙)
  if (ptyCode > 0 || precip > 0) {
    const isSnow = ptyCode === 2 || ptyCode === 3 || ptyCode === 6 || ptyCode === 7;
    return {
      level: 'danger',
      icon: isSnow ? '❄️' : '🌧️',
      title: isSnow ? '눈길 및 결빙 주의보' : '우천 및 노면 미끄럼 주의보',
      message: `노면이 젖어 제동거리가 평소의 2~3배로 늘어납니다. 맨홀 뚜껑, 횡단보도 도색선 급브레이크 금지!`,
      bridgeWarning: `교량 이음새 철판(신축이음) 및 빗물받이 통과 시 차체가 미끄러질 수 있으니 핸들을 똑바로 유지하세요.`,
      checklist: [
        '평소 속도 대비 30~50% 감속 주행',
        '코너링 중 브레이크 조작 지양 & 차체 수직 유지',
        '안양천 둔치 자전거도로 수위 상승 및 징검다리 침수 확인',
      ],
      source,
    };
  }

  // 3. Heatwave Alert (기온 30도 이상)
  if (temp >= 30) {
    return {
      level: 'warning',
      icon: '☀️',
      title: `폭염 및 온열질환 주의 (기온 ${temp.toFixed(1)}℃)`,
      message: `한낮 복사열과 아스팔트 지열이 매우 높습니다. 15~20분마다 수분을 충분히 섭취하세요.`,
      bridgeWarning: `그늘이 없는 교량 상부 및 제방길에서 장시간 정차하지 마시고 그늘 쉼터로 이동하세요.`,
      checklist: [
        '15~20분 주기 필수 수분 및 전해질 섭취',
        '자외선 차단 고글, 버프, 썬크림 착용',
        '어지럼증이나 현기증 발생 시 즉시 그늘에서 정차 및 휴식',
      ],
      source,
    };
  }

  // 4. Freezing Alert (기온 3도 이하)
  if (temp <= 3) {
    return {
      level: 'warning',
      icon: '❄️',
      title: `결빙 / 블랙아이스 주의 (기온 ${temp.toFixed(1)}℃)`,
      message: `교량 하부 음지 및 하천 습지 인접 구간에 살얼음(블랙아이스)이 발생할 수 있습니다.`,
      bridgeWarning: `교량 상판은 지열이 차단되어 일반 도로보다 먼저 결빙되므로 서행 통과하세요.`,
      checklist: [
        '음지 구간 감속 및 급제동 금지',
        '방한 방풍 장갑 및 헬멧 이너캡 착용',
        '타이어 적정 공기압 점검',
      ],
      source,
    };
  }

  // 5. Default Good Cycling Weather
  return {
    level: 'info',
    icon: '🚲',
    title: `라이딩하기 쾌적한 날씨 (기온 ${temp.toFixed(1)}℃ · 풍속 ${windSpeed.toFixed(1)}m/s)`,
    message: `시야와 바람이 온화한 최적의 라이딩 환경입니다. 안양 9경 및 수변 코스를 안전하게 즐기세요!`,
    bridgeWarning: `교량 통과 시 보행자 및 반대편 자전거와의 안전거리를 유지하세요.`,
    checklist: [
      '안전 헬멧 턱끈 밀착 착용 확인',
      '자전거도로 우측통행 및 속도(20km/h 이하 권장) 준수',
      '보행자/자전거 추월 전 벨 사전 타종 ("좌측으로 지나가겠습니다")',
    ],
    source,
  };
}

/**
 * Fetch real-time weather from KMA (기상청 초단기실황) API
 * If network, CORS or parsing fails, seamlessly fallback to Open-Meteo
 */
export async function fetchKmaWeather(lat: number = 37.3943, lng: number = 126.9568): Promise<WeatherSummary> {
  const { nx, ny } = dfsXyConv(lat, lng);
  const { baseDate, baseTime } = getKmaBaseDateTime();

  // Try 1: Call KMA Ultra Short Term Nowcast (기상청 초단기실황)
  try {
    const kmaUrl = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${KMA_SERVICE_KEY}&numOfRows=60&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(kmaUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      const items = json?.response?.body?.items?.item;

      if (Array.isArray(items) && items.length > 0) {
        let temp = 22;
        let windSpeed = 1.8;
        let windDeg = 225;
        let humidity = 50;
        let pty = 0;
        let rn1 = 0;

        items.forEach((item: any) => {
          const cat = item.category;
          const val = parseFloat(item.obsrValue);
          if (cat === 'T1H' && !isNaN(val)) temp = val;
          if (cat === 'WSD' && !isNaN(val)) windSpeed = val;
          if (cat === 'VEC' && !isNaN(val)) windDeg = val;
          if (cat === 'REH' && !isNaN(val)) humidity = val;
          if (cat === 'PTY' && !isNaN(val)) pty = Math.round(val);
          if (cat === 'RN1' && !isNaN(val)) rn1 = val;
        });

        const windDir = degreeToWindDirection(windDeg);
        const safetyAlert = generateCyclingSafetyAlert({
          temp,
          windSpeed,
          windDir,
          ptyCode: pty,
          precip: rn1,
          source: 'kma',
        });

        return {
          temperatureC: temp,
          windSpeedMps: windSpeed,
          windDirection: windDir,
          airQualityLabel: '좋음',
          uvLabel: '보통',
          humidity,
          precipitationMm: rn1,
          ptyCode: pty,
          dataSource: 'KMA(기상청 초단기실황)',
          summary: safetyAlert.message,
          safetyAlert,
        };
      }
    }
  } catch (err) {
    console.info('KMA API request handled or bypassed, switching to Open-Meteo fallback:', err);
  }

  // Try 2: Open-Meteo Fallback with Precise GPS
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,uv_index,precipitation&timezone=Asia%2FSeoul`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const current = data.current;

      if (current) {
        const windSpeedMps = current.wind_speed_10m ? Number((current.wind_speed_10m / 3.6).toFixed(1)) : 1.8;
        const windDeg = current.wind_direction_10m ?? 225;
        const windDirection = degreeToWindDirection(windDeg);
        const uvIndex = current.uv_index ?? 3.5;
        const uvLabel = getUvLabel(uvIndex);
        const temperatureC = current.temperature_2m ?? 22;
        const humidity = current.relative_humidity_2m ?? 55;
        const precipitationMm = current.precipitation ?? 0;
        const ptyCode = precipitationMm > 0 ? 1 : 0;

        const safetyAlert = generateCyclingSafetyAlert({
          temp: temperatureC,
          windSpeed: windSpeedMps,
          windDir: windDirection,
          ptyCode,
          precip: precipitationMm,
          source: 'openmeteo',
        });

        return {
          temperatureC,
          windSpeedMps,
          windDirection,
          airQualityLabel: '좋음',
          uvLabel,
          humidity,
          precipitationMm,
          ptyCode,
          dataSource: 'Open-Meteo',
          summary: safetyAlert.message,
          safetyAlert,
        };
      }
    }
  } catch (err) {
    console.warn('Weather fallback failed:', err);
  }

  // Fallback defaults
  const fallbackAlert = generateCyclingSafetyAlert({
    temp: 22,
    windSpeed: 2.1,
    windDir: '남서풍',
    ptyCode: 0,
    precip: 0,
    source: 'fallback',
  });

  return {
    temperatureC: 22,
    windSpeedMps: 2.1,
    windDirection: '남서풍',
    airQualityLabel: '좋음',
    uvLabel: '보통',
    humidity: 50,
    dataSource: '기본값',
    summary: fallbackAlert.message,
    safetyAlert: fallbackAlert,
  };
}
