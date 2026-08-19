import { Course, FilterCategory, OfficialStreamLine, RampAccessPoint } from '../types';
import {
  RECOMMENDED_COURSE_PATH,
  SCENIC_COURSE_PATH,
  FLAT_COURSE_PATH,
  SHORT_COURSE_PATH,
  NO_STAIRS_COURSE_PATH,
  LOW_TRAFFIC_COURSE_PATH,
} from '../constants';

export const FILTER_TAGS: FilterCategory[] = [
  '추천 코스',
  '경치 좋은',
  '평지 중심',
  '단거리',
  '계단 없음',
  '낮은 혼잡도',
];

export const ANYANG_CENTER = { lat: 37.3943, lng: 126.9568 };

// ── 안양시 공식 5대 하천 자전거도로 및 도심 간선망 (단일톤 차분한 색상 팔레트) ──
export const OFFICIAL_STREAM_LINES: OfficialStreamLine[] = [
  {
    id: 'stream-anyang',
    name: '안양천 자전거 전용도로 (남북 메인 간선)',
    streamName: '안양천',
    color: '#0284C7',
    totalDistanceKm: 12.5,
    description: '서울시계(석수역/기아대교)에서 비산교 쌍개울을 거쳐 의왕시계(유봉교)까지 이어지는 안양시의 핵심 남북 척추 자전거길',
    type: '하천전용로',
    path: [
      [37.4392, 126.9025], // 서울시계 (기아대교 부근)
      [37.4320, 126.9080], // 석수체육공원 앞
      [37.4255, 126.9135], // 삼막천 합수부
      [37.4180, 126.9185], // 충훈교 벚꽃길
      [37.4110, 126.9240], // 박석교
      [37.4050, 126.9320], // 안양대교 (삼성천 합수부)
      [37.4010, 126.9405], // 안양천 중앙광장
      [37.3980, 126.9485], // 비산교 쌍개울 광장 (학의천 합수부)
      [37.3910, 126.9450], // 비산대교 하부
      [37.3840, 126.9420], // 명학대교 / 명학역 부근
      [37.3770, 126.9450], // 군포/동안 경계
      [37.3710, 126.9520], // 호계교
      [37.3650, 126.9600], // 의왕시계 (유봉교/고천)
    ],
  },
  {
    id: 'stream-hagui',
    name: '학의천 자전거 전용도로 (동서 힐링 라인)',
    streamName: '학의천',
    color: '#0284C7',
    totalDistanceKm: 4.5,
    description: '비산교 쌍개울에서 동안교, 인덕원교를 지나 의왕 백운호수 방면 시계로 이어지는 무장애 평지 명품 수변로',
    type: '하천전용로',
    path: [
      [37.3980, 126.9485], // 비산교 쌍개울 합수부
      [37.3965, 126.9540], // 비산체육공원 입구
      [37.3948, 126.9610], // 학운교
      [37.3940, 126.9680], // 수촌교
      [37.3960, 126.9740], // 관양교
      [37.3985, 126.9805], // 인덕원교 쉼터
      [37.4005, 126.9865], // 동안교
      [37.4020, 126.9930], // 의왕시계 (포일동/백운호수 연결)
    ],
  },
  {
    id: 'stream-samseong',
    name: '삼성천 자전거길 (안양예술공원 힐링 코스)',
    streamName: '삼성천',
    color: '#0284C7',
    totalDistanceKm: 2.8,
    description: '안양천 만안교 인근에서 분기하여 계곡을 따라 안양예술공원 조각광장과 숲속 쉼터로 오르는 감성 밸리길',
    type: '하천전용로',
    path: [
      [37.4050, 126.9320], // 안양천 삼성천 합수부 (대우아파트)
      [37.4100, 126.9310], // 만안교 삼거리
      [37.4150, 126.9300], // 관악역 후문 연결로
      [37.4190, 126.9290], // 안양예술공원 입구
      [37.4230, 126.9280], // 예술공원 벽천분수대
      [37.4270, 126.9270], // 안양파빌리온 / 쉼터
    ],
  },
  {
    id: 'stream-suam',
    name: '수암천 자전거길 (병목안 시민공원 코스)',
    streamName: '수암천',
    color: '#0284C7',
    totalDistanceKm: 2.5,
    description: '안양천에서 삼덕공원과 안양9동을 거쳐 수리산 자락 병목안 시민공원으로 이어지는 녹색 생태 자전거길',
    type: '하천전용로',
    path: [
      [37.4010, 126.9280], // 안양천 수암천 합수부
      [37.3980, 126.9230], // 삼덕공원
      [37.3950, 126.9180], // 안양9동 주민센터
      [37.3920, 126.9130], // 수암천 복원구간
      [37.3880, 126.9080], // 병목안 시민공원 입구
      [37.3840, 126.9040], // 삼천리 약수터 입구
    ],
  },
  {
    id: 'stream-sammak',
    name: '삼막천 자전거길 (경인교대·삼막사 코스)',
    streamName: '삼막천',
    color: '#0284C7',
    totalDistanceKm: 2.2,
    description: '석수체육공원 인근 안양천 합수부에서 삼막 맛거리촌을 거쳐 경인교대 정문 쉼터까지 이어지는 완경사 코스',
    type: '하천전용로',
    path: [
      [37.4255, 126.9135], // 안양천 삼막천 합수부
      [37.4270, 126.9200], // 석수IC 하부
      [37.4290, 126.9280], // 삼막 맛거리촌
      [37.4320, 126.9380], // 경인교대 경기캠퍼스 정문
      [37.4350, 126.9450], // 삼막사 입구 쉼터
    ],
  },
  {
    id: 'urban-simin',
    name: '시민대로 스마트 자전거길 (도심 동서축)',
    streamName: '도심간선도로',
    color: '#64748B',
    totalDistanceKm: 3.8,
    description: '범계역, 평촌중앙공원, 안양시청, 평촌역, 스마트스퀘어, 인덕원역을 일직선으로 잇는 안양 핵심 도심 자전거 전용차로',
    type: '도심전용로',
    path: [
      [37.3895, 126.9508], // 범계역 사거리
      [37.3915, 126.9560], // 동안구청 / 평촌중앙공원
      [37.3930, 126.9590], // 안양시청 앞
      [37.3945, 126.9635], // 평촌역 앞
      [37.3965, 126.9720], // 평촌스마트스퀘어
      [37.3990, 126.9820], // 인덕원역 사거리
    ],
  },
  {
    id: 'urban-pyeongchon',
    name: '평촌대로 자전거길 (도심 남북축)',
    streamName: '도심간선도로',
    color: '#64748B',
    totalDistanceKm: 4.2,
    description: '비산사거리에서 범계역, 평촌학원가, 자유공원을 관통하여 호계사거리로 이어지는 남북 핵심 생활 자전거도로',
    type: '도심전용로',
    path: [
      [37.4040, 126.9460], // 비산사거리
      [37.3950, 126.9490], // 샛별단지
      [37.3895, 126.9508], // 범계사거리
      [37.3820, 126.9540], // 평촌학원가 사거리
      [37.3750, 126.9580], // 자유공원 입구
      [37.3690, 126.9610], // 호계사거리
    ],
  },
];

// ── 안양시 공식 진출입 램프(슬로프) 및 거점 쉼터 ──
export const OFFICIAL_RAMP_POINTS: RampAccessPoint[] = [
  {
    id: 'ramp-ssanggaeul',
    name: '쌍개울 문화광장 거점 쉼터',
    streamName: '안양천·학의천 합수부',
    type: '하천합수부쉼터',
    lat: 37.3980,
    lng: 126.9485,
    description: '안양천-학의천 만남의 광장. 상설 무료 자전거 정비소, 공기주입기 4기, 음수대, 비상벨 공중화장실 완비',
    hasAirPump: true,
    hasRestroom: true,
  },
  {
    id: 'ramp-chunghun',
    name: '충훈교 무장애 자전거 슬로프',
    streamName: '안양천',
    type: '경사로(슬로프)',
    lat: 37.4180,
    lng: 126.9185,
    description: '석수3동 충훈부 벚꽃길과 안양천 자전거도로를 계단 없이 완만하게 연결하는 안심 슬로프',
    hasAirPump: true,
    hasRestroom: true,
  },
  {
    id: 'ramp-bisan-bridge',
    name: '비산대교 북단/남단 진출입로',
    streamName: '안양천',
    type: '경사로(슬로프)',
    lat: 37.3995,
    lng: 126.9490,
    description: '비산사거리 및 이마트 방면 도심과 안양천 자전거도로를 바로 잇는 완만 경사로',
    hasAirPump: true,
    hasRestroom: false,
  },
  {
    id: 'ramp-hagun',
    name: '학운교 평촌 도심 연결 램프',
    streamName: '학의천',
    type: '경사로(슬로프)',
    lat: 37.3948,
    lng: 126.9610,
    description: '평촌중앙공원 및 안양시청에서 학의천 자전거길로 다이렉트 진입 가능한 전용 램프',
    hasAirPump: true,
    hasRestroom: false,
  },
  {
    id: 'ramp-indeokwon',
    name: '인덕원교 쉼터 진출입로',
    streamName: '학의천',
    type: '하천합수부쉼터',
    lat: 37.3985,
    lng: 126.9805,
    description: '인덕원역 4호선 및 과천·의왕 방면 진출입 거점. 태양광 스마트 공기주입기 및 쉼터 벤치 설치',
    hasAirPump: true,
    hasRestroom: true,
  },
  {
    id: 'ramp-artpark',
    name: '안양예술공원 입구 삼성천 램프',
    streamName: '삼성천',
    type: '경사로(슬로프)',
    lat: 37.4190,
    lng: 126.9290,
    description: '관악역 및 만안구 도심에서 안양예술공원 밸리 자전거길로 연결되는 평탄 진입로',
    hasAirPump: true,
    hasRestroom: true,
  },
  {
    id: 'ramp-samdeok',
    name: '삼덕공원 수암천 연결로',
    streamName: '수암천',
    type: '지하철연결로',
    lat: 37.3980,
    lng: 126.9230,
    description: '안양일번가, 안양역, 삼덕공원에서 병목안 시민공원 방면 수암천길로 이어지는 진출입로',
    hasAirPump: true,
    hasRestroom: true,
  },
  {
    id: 'ramp-seoksu-park',
    name: '석수체육공원 삼막천 합수부 진입로',
    streamName: '안양천·삼막천',
    type: '경사로(슬로프)',
    lat: 37.4255,
    lng: 126.9135,
    description: '석수체육공원 축구장/인라인장 및 서울 금천구 경계에서 안양천 하천길로 진입하는 광폭 램프',
    hasAirPump: true,
    hasRestroom: true,
  },
  {
    id: 'ramp-myeonghak',
    name: '명학대교 수변 진입 슬로프',
    streamName: '안양천',
    type: '지하철연결로',
    lat: 37.3840,
    lng: 126.9420,
    description: '1호선 명학역 1번 출구에서 150m 거리의 안양천 직통 연결 경사로',
    hasAirPump: true,
    hasRestroom: false,
  },
  {
    id: 'ramp-hogye',
    name: '호계교 의왕시계 쉼터 램프',
    streamName: '안양천',
    type: '경사로(슬로프)',
    lat: 37.3710,
    lng: 126.9520,
    description: '호계동 주거지 및 의왕 고천 자전거길 연결 거점. 공기주입기 및 안전 쉼터 구비',
    hasAirPump: true,
    hasRestroom: false,
  },
];

// ── 안양시 공식 자전거 추천 6대 테마 코스 ──
export const COURSE_DATA: Record<FilterCategory, Course> = {
  '추천 코스': {
    id: 'c-rec',
    tag: '추천 코스',
    name: '안양천-학의천 쌍개울 힐링 순환 코스',
    distance: '5.8km',
    distanceKm: 5.8,
    time: '25분',
    timeMinutes: 25,
    type: '공식 안양 대표 순환로',
    arrival: '11:25',
    bikePath: 92,
    road: 5,
    sidewalk: 3,
    dedicatedBikeRatio: 92, // 자전거 전용도로 92%
    sharedBikeRatio: 5,    // 자전거 겸용도로 5%
    sidewalkRatio: 3,      // 인도/보행로 3%
    riverPathRatio: 88,    // 하천변 도로 88% (빨간색)
    segregatedRatio: 8,    // 분리도로 8% (남색)
    unsegregatedRatio: 4,  // 비분리도로 4% (하늘색)
    isScenicCourse: true,
    scenicScore: '우수 (수변 생태 95%)',
    scenicHighlights: ['비산교 쌍개울 수변광장', '학의천 버들 쉼터', '안양천 합수부 생태습지'],
    stairs: 0,
    overpass: 0,
    slope: '1.2%',
    slopeLevel: '평탄',
    calories: 220,
    description: '안양천 본류와 학의천이 만나는 쌍개울 문화광장을 중심으로, 넓은 수변 전용로만 달리는 안양 최고의 베스트셀러 코스',
    startPoint: '안양천 중앙광장',
    endPoint: '학의천 학운교 쉼터 (쌍개울 순환)',
    elevationProfile: [26, 27, 28, 29, 28, 27, 26, 27],
    path: RECOMMENDED_COURSE_PATH,
    navSteps: [
      { id: 's1', iconType: 'up', text: '450m 안양천 자전거 전용로 직진', sub: '폭 4m 광폭 전용길', distanceMeter: 450, instruction: '평탄한 안양천 하천길을 따라 남동쪽으로 직진하세요.' },
      { id: 's2', iconType: 'crosswalk', text: '비산동 하천 진입 횡단보도 통과', sub: '비산동 횡단보도 (폭 4.5m · 길이 7.0m) - 하차 보행', distanceMeter: 120, warn: true, instruction: '30m 앞 비산동 횡단보도입니다. 안전을 위해 자전거에서 내려 보행해 주세요.', crosswalkInfo: { dong: '비산동', widthM: 4.47, lengthM: 7.01, roadName: '관악대로 비산사거리 연결로' } },
      { id: 's3', iconType: 'left', text: '비산교 쌍개울 광장 진입', sub: '학의천 합수부 방면', distanceMeter: 600, instruction: '쌍개울 문화광장을 지나 학의천 방향으로 완만하게 좌회전하세요.' },
      { id: 's4', iconType: 'up', text: '2.1km 학의천 힐링 수변길', sub: '신호등 없는 평지 100%', distanceMeter: 2100, instruction: '신호 없이 쾌적한 학의천 평지 자전거길을 즐기세요.' },
      { id: 's5', iconType: 'u-turn', text: '수촌교 쉼터에서 북단길 유턴', sub: '순환 반환 코스', distanceMeter: 1200, instruction: '수촌교 쉼터에서 유턴하여 북단 하천로로 복귀하세요.' },
      { id: 's6', iconType: 'arrive', text: '쌍개울 거점 광장 도착', sub: '무료 정비소 및 공기주입기', distanceMeter: 1330, instruction: '출발지인 쌍개울 거점 광장에 안전하게 도착했습니다.' },
    ],
  },

  '경치 좋은': {
    id: 'c-scenic',
    tag: '경치 좋은',
    name: '삼성천·안양예술공원 밸리 숲길',
    distance: '4.8km',
    distanceKm: 4.8,
    time: '26분',
    timeMinutes: 26,
    type: '공식 하천·자연 힐링 코스',
    arrival: '11:26',
    bikePath: 78,
    road: 14,
    sidewalk: 8,
    dedicatedBikeRatio: 78, // 자전거 전용도로 78% (삼성천변 계곡로)
    sharedBikeRatio: 16,    // 자전거 겸용도로 16% (예술공원 숲길)
    sidewalkRatio: 6,       // 인도/보행로 6% (조각공원 광장)
    riverPathRatio: 72,     // 하천변 도로 72% (빨간색)
    segregatedRatio: 18,    // 분리도로 18% (남색)
    unsegregatedRatio: 10,  // 비분리도로 10% (하늘색)
    isScenicCourse: true,
    scenicScore: '최우수 (숲길·계곡 92%)',
    scenicHighlights: ['삼성천 계곡 물소리길', '안양예술공원 야외조각', '관악산 숲속 쉼터', '벽천분수대'],
    stairs: 0,
    overpass: 0,
    slope: '3.5%',
    slopeLevel: '완만',
    calories: 245,
    description: '안양천에서 삼성천 계곡을 따라 안양예술공원 야외 조각작품과 울창한 관악산 숲길을 감상하는 감성 라이딩 코스',
    startPoint: '안양역 2번 출구 (안양천 진입로)',
    endPoint: '안양예술공원 벽천분수대 광장',
    elevationProfile: [28, 32, 38, 48, 62, 75, 82],
    path: SCENIC_COURSE_PATH,
    navSteps: [
      { id: 's1', iconType: 'up', text: '700m 안양천 북단 직진', sub: '삼성천 합수부 방면', distanceMeter: 700, instruction: '안양천을 따라 북쪽으로 이동하여 삼성천 합수부로 향하세요.' },
      { id: 's2', iconType: 'crosswalk', text: '석수1동 예술공원 입구 횡단보도', sub: '석수1동 횡단보도 (폭 8.6m · 길이 9.0m) - 하차 보행', distanceMeter: 150, warn: true, instruction: '예술공원 입구 석수1동 횡단보도입니다. 자전거에서 내려 보행해 주세요.', crosswalkInfo: { dong: '석수1동', widthM: 8.57, lengthM: 8.97, roadName: '안양예술공원 사거리 횡단보도' } },
      { id: 's3', iconType: 'right', text: '만안교 방향 우회전 진입', sub: '삼성천 자전거길 시작', distanceMeter: 800, instruction: '우회전하여 삼성천 계곡 자전거길로 진입하세요.' },
      { id: 's4', iconType: 'up', text: '1.8km 예술공원 숲길 완만 오르막', sub: '피톤치드 쉼터 통과', distanceMeter: 1800, instruction: '계곡 물소리와 숲길을 따라 완만한 경사로를 라이딩하세요.' },
      { id: 's5', iconType: 'arrive', text: '예술공원 벽천분수 광장 도착', sub: '자전거 거치대 및 카페거리', distanceMeter: 1350, instruction: '예술공원 중심 분수광장에 도착했습니다.' },
    ],
  },

  '평지 중심': {
    id: 'c-flat',
    tag: '평지 중심',
    name: '학의천 평지 쾌속선 (쌍개울~인덕원교)',
    distance: '4.5km',
    distanceKm: 4.5,
    time: '20분',
    timeMinutes: 20,
    type: '공식 무장애 평지 코스',
    arrival: '11:20',
    bikePath: 95,
    road: 3,
    sidewalk: 2,
    dedicatedBikeRatio: 95, // 자전거 전용도로 95% (전구간 아스팔트 하천길)
    sharedBikeRatio: 4,     // 자전거 겸용도로 4%
    sidewalkRatio: 1,      // 인도/보행로 1%
    riverPathRatio: 94,    // 하천변 도로 94% (빨간색)
    segregatedRatio: 4,    // 분리도로 4% (남색)
    unsegregatedRatio: 2,  // 비분리도로 2% (하늘색)
    isScenicCourse: true,
    scenicScore: '우수 (수변 생태 90%)',
    scenicHighlights: ['학의천 무장애 수변길', '수촌교 갈대밭', '인덕원교 쉼터'],
    stairs: 0,
    overpass: 0,
    slope: '0.6%',
    slopeLevel: '평탄',
    calories: 175,
    description: '고저차가 0.6% 미만인 전구간 아스팔트 하천 자전거길로 초보자, 가족 단위, 페이스 라이더에게 이상적인 코스',
    startPoint: '비산교 쌍개울 광장',
    endPoint: '인덕원교 쉼터 (백운호수 연결로)',
    elevationProfile: [27, 27, 28, 28, 29, 29, 30],
    path: FLAT_COURSE_PATH,
    navSteps: [
      { id: 's1', iconType: 'up', text: '800m 학의천 남단 전용로 직진', sub: '보행자 완전 분리', distanceMeter: 800, instruction: '보행로와 완전히 분리된 학의천 남단 전용길로 직진하세요.' },
      { id: 's2', iconType: 'up', text: '2.5km 논스톱 무장애 평지 구간', sub: '신호등 없음 (평균속도 20km/h 권장)', distanceMeter: 2500, instruction: '신호 없이 탁 트인 평지 구간을 시속 20km 이내로 주행하세요.' },
      { id: 's3', iconType: 'arrive', text: '인덕원교 쉼터 도착', sub: '공기주입기 및 의왕 연결', distanceMeter: 1200, instruction: '인덕원교 쉼터 거점에 도착했습니다.' },
    ],
  },

  '단거리': {
    id: 'c-short',
    tag: '단거리',
    name: '시민대로 스마트 그린웨이 (범계~시청~평촌역)',
    distance: '2.4km',
    distanceKm: 2.4,
    time: '12분',
    timeMinutes: 12,
    type: '공식 도심 생활 간선망',
    arrival: '11:12',
    bikePath: 85,
    road: 10,
    sidewalk: 5,
    dedicatedBikeRatio: 85, // 자전거 전용도로 85% (도심 전용차로)
    sharedBikeRatio: 10,    // 자전거 겸용도로 10%
    sidewalkRatio: 5,      // 인도/보행로 5% (역사 광장)
    riverPathRatio: 0,      // 하천변 도로 0% (빨간색)
    segregatedRatio: 82,    // 분리도로 82% (남색)
    unsegregatedRatio: 18,  // 비분리도로 18% (하늘색)
    isScenicCourse: false,
    scenicScore: '도심 (공원 인접 65%)',
    scenicHighlights: ['평촌중앙공원 분수광장', '안양시청 잔디광장'],
    stairs: 0,
    overpass: 0,
    slope: '0.8%',
    slopeLevel: '평탄',
    calories: 95,
    description: '범계역 상권에서 평촌중앙공원, 안양시청, 평촌역을 안전하고 빠르게 잇는 대표적인 도심 전용 자전거도로',
    startPoint: '범계역 4번 출구',
    endPoint: '평촌역 1번 출구 (스마트스퀘어)',
    elevationProfile: [30, 31, 31, 32, 32],
    path: SHORT_COURSE_PATH,
    navSteps: [
      { id: 's1', iconType: 'up', text: '600m 시민대로 자전거 전용차로 직진', sub: '자전거 전용 횡단도', distanceMeter: 600, instruction: '시민대로 녹색 자전거 전용차로를 따라 직진하세요.' },
      { id: 's2', iconType: 'up', text: '900m 평촌중앙공원-안양시청 통과', sub: '넓고 안전한 전용로', distanceMeter: 900, instruction: '중앙공원 광장을 지나 안양시청 방면으로 주행하세요.' },
      { id: 's3', iconType: 'arrive', text: '평촌역 광장 도착', sub: '대규모 거치대 300대 완비', distanceMeter: 900, instruction: '평촌역 자전거 거치 구역에 도착했습니다.' },
    ],
  },

  '계단 없음': {
    id: 'c-nostairs',
    tag: '계단 없음',
    name: '안양천 전구간 100% 무장애 슬로프길',
    distance: '6.5km',
    distanceKm: 6.5,
    time: '30분',
    timeMinutes: 30,
    type: '공식 100% 무경사로 안심 코스',
    arrival: '11:30',
    bikePath: 96,
    road: 4,
    sidewalk: 0,
    dedicatedBikeRatio: 96, // 자전거 전용도로 96% (하천 전용 슬로프)
    sharedBikeRatio: 4,     // 자전거 겸용도로 4%
    sidewalkRatio: 0,      // 인도 0% (계단/턱 제로)
    riverPathRatio: 95,    // 하천변 도로 95% (빨간색)
    segregatedRatio: 4,    // 분리도로 4% (남색)
    unsegregatedRatio: 1,  // 비분리도로 1% (하늘색)
    isScenicCourse: true,
    scenicScore: '우수 (수변 생태 94%)',
    scenicHighlights: ['충훈교 벚꽃길 슬로프', '박석교 하천 생태습지', '비산교 쌍개울'],
    stairs: 0,
    overpass: 0,
    slope: '0.7%',
    slopeLevel: '평탄',
    calories: 270,
    description: '계단이나 급경사 육교가 전혀 없는 100% 완만 램프와 수변 전용길로만 설계된 누구나 안심할 수 있는 무장애 코스',
    startPoint: '충훈교 벚꽃 무장애 슬로프',
    endPoint: '비산교 쌍개울 문화광장',
    elevationProfile: [25, 25, 26, 26, 27, 27, 28],
    path: NO_STAIRS_COURSE_PATH,
    navSteps: [
      { id: 's1', iconType: 'up', text: '400m 충훈교 광폭 슬로프 하강', sub: '계단 0개 완만 램프', distanceMeter: 400, instruction: '충훈교 무장애 슬로프를 통해 안양천변으로 진입하세요.' },
      { id: 's2', iconType: 'up', text: '4.2km 안양천 본류 평지 전용로', sub: '전구간 포장 아스팔트', distanceMeter: 4200, instruction: '4.2킬로미터 동안 계단 없는 쾌적한 하천길을 직진하세요.' },
      { id: 's3', iconType: 'arrive', text: '비산교 쌍개울 쉼터 도착', sub: '상설 정비소 및 장애인 화장실', distanceMeter: 1900, instruction: '쌍개울 거점 쉼터에 안전하게 도착했습니다.' },
    ],
  },

  '낮은 혼잡도': {
    id: 'c-lowtraffic',
    tag: '낮은 혼잡도',
    name: '삼막천·경인교대 에어로 힐링 트랙',
    distance: '4.2km',
    distanceKm: 4.2,
    time: '22분',
    timeMinutes: 22,
    type: '공식 쾌적 저혼잡 경로',
    arrival: '11:22',
    bikePath: 88,
    road: 10,
    sidewalk: 2,
    dedicatedBikeRatio: 88, // 자전거 전용도로 88%
    sharedBikeRatio: 10,    // 자전거 겸용도로 10%
    sidewalkRatio: 2,      // 인도/보행로 2%
    riverPathRatio: 80,    // 하천변 도로 80% (빨간색)
    segregatedRatio: 12,   // 분리도로 12% (남색)
    unsegregatedRatio: 8,  // 비분리도로 8% (하늘색)
    isScenicCourse: true,
    scenicScore: '우수 (한적한 숲·수변 92%)',
    scenicHighlights: ['삼막천 맛거리 쉼터', '경인교대 캠퍼스 녹지'],
    stairs: 0,
    overpass: 0,
    slope: '2.2%',
    slopeLevel: '완만',
    calories: 210,
    description: '도심 밀집 구간을 벗어나 관악산 자락 삼막천을 따라 여유롭고 한적하게 달리는 저혼잡 에어로 트랙',
    startPoint: '석수체육공원 입구',
    endPoint: '삼막사 먹거리촌·경인교대 정문',
    elevationProfile: [28, 31, 35, 42, 50, 46, 38],
    path: LOW_TRAFFIC_COURSE_PATH,
    navSteps: [
      { id: 's1', iconType: 'up', text: '600m 석수천변 한적한 자전거길', sub: '혼잡도 매우 낮음 (원활)', distanceMeter: 600, instruction: '석수체육공원 앞 천변길을 따라 남동쪽으로 직진하세요.' },
      { id: 's2', iconType: 'left', text: '삼막천 합수부에서 계곡길 진입', sub: '피톤치드 숲바람 코스', distanceMeter: 1200, instruction: '삼막천 합수부에서 좌측 삼막천 자전거길로 진입하세요.' },
      { id: 's3', iconType: 'up', text: '1.6km 삼막 맛거리촌 완경사 주행', sub: '여유로운 숲길', distanceMeter: 1600, instruction: '경인교대 방면으로 한적한 도로를 여유롭게 주행하세요.' },
      { id: 's4', iconType: 'arrive', text: '경인교대 쉼터 도착', sub: '음수대 및 벤치', distanceMeter: 800, instruction: '경인교대 정문 자전거 쉼터에 도착했습니다.' },
    ],
  },
};

// ── 안양시 공식 및 명소 자전거 테마 코스 전체 갤러리 데이터 ──
export const ANYANG_THEME_COURSES: (Course & { badge: string; categoryTitle: string; themeKeywords: string[] })[] = [
  {
    ...COURSE_DATA['추천 코스'],
    badge: '1위 베스트',
    categoryTitle: '하천 수변 순환',
    themeKeywords: ['쌍개울 광장', '안양천', '학의천', '상설 정비소'],
  },
  {
    ...COURSE_DATA['평지 중심'],
    badge: '초보·가족 추천',
    categoryTitle: '무장애 평지 직통로',
    themeKeywords: ['학의천', '인덕원', '무신호 평지', '고저차 0.6%'],
  },
  {
    ...COURSE_DATA['경치 좋은'],
    badge: '경치 최우수',
    categoryTitle: '계곡 숲길·야외 예술',
    themeKeywords: ['안양예술공원', '삼성천 계곡', '야외 조각', '벽천분수'],
  },
  {
    ...COURSE_DATA['단거리'],
    badge: '도심 쾌속',
    categoryTitle: '스마트 도심 간선망',
    themeKeywords: ['범계역', '평촌중앙공원', '안양시청', '평촌역'],
  },
  {
    ...COURSE_DATA['계단 없음'],
    badge: '100% 무장애',
    categoryTitle: '안심 슬로프길',
    themeKeywords: ['충훈교 벚꽃길', '박석교', '슬로프 램프', '턱 제로'],
  },
  {
    ...COURSE_DATA['낮은 혼잡도'],
    badge: '한적한 여유',
    categoryTitle: '자연 에어로 트랙',
    themeKeywords: ['삼막천', '경인교대', '삼막맛거리', '피톤치드'],
  },
  {
    id: 'c-suam-byeongmokan',
    tag: '경치 좋은',
    badge: '자연 생태',
    categoryTitle: '수암천·병목안 숲길',
    name: '수암천 생태길 & 병목안 시민공원 코스',
    distance: '4.1km',
    distanceKm: 4.1,
    time: '22분',
    timeMinutes: 22,
    type: '공식 하천·자연 생태길',
    arrival: '11:22',
    bikePath: 82,
    road: 12,
    sidewalk: 6,
    dedicatedBikeRatio: 82,
    sharedBikeRatio: 12,
    sidewalkRatio: 6,
    riverPathRatio: 78,
    segregatedRatio: 14,
    unsegregatedRatio: 8,
    isScenicCourse: true,
    scenicScore: '우수 (숲길·생태 91%)',
    scenicHighlights: ['수암천 복원 생태로', '삼덕공원', '병목안 시민공원 숲길'],
    stairs: 0,
    overpass: 0,
    slope: '2.8%',
    slopeLevel: '완만',
    calories: 215,
    description: '안양천 합수부에서 삼덕공원과 수암천 복원 수변길을 거쳐 수리산 자락 병목안 시민공원까지 이어지는 힐링 코스',
    startPoint: '안양천 삼덕공원 연결로',
    endPoint: '병목안 시민공원 입구',
    elevationProfile: [28, 30, 35, 42, 54, 68],
    themeKeywords: ['수암천', '삼덕공원', '수리산 자락', '병목안 공원'],
    path: [
      [37.4010, 126.9280],
      [37.3980, 126.9230],
      [37.3950, 126.9180],
      [37.3920, 126.9130],
      [37.3880, 126.9080],
    ],
    navSteps: [
      { id: 's1', iconType: 'up', text: '500m 수암천 생태 자전거길 직진', sub: '삼덕공원 방면', distanceMeter: 500, instruction: '수암천변 생태 자전거길로 직진하세요.' },
      { id: 's2', iconType: 'crosswalk', text: '안양4동 수암천 횡단보도 통과', sub: '안양4동 (폭 9.8m · 길이 10.9m) - 하차 보행', distanceMeter: 120, warn: true, instruction: '안양4동 횡단보도입니다. 자전거에서 내려 안전하게 건너세요.', crosswalkInfo: { dong: '안양4동', widthM: 9.82, lengthM: 10.88, roadName: '중앙시장 입구 횡단보도' } },
      { id: 's3', iconType: 'up', text: '2.2km 수암천 복원 구간 주행', sub: '완만한 오르막 수변길', distanceMeter: 2200, instruction: '수암천 복원 물길을 따라 병목안 방향으로 주행하세요.' },
      { id: 's4', iconType: 'arrive', text: '병목안 시민공원 광장 도착', sub: '피크닉장 및 자전거 거치대', distanceMeter: 1280, instruction: '병목안 시민공원 입구에 도착했습니다.' },
    ],
  },
  {
    id: 'c-anyang-longrun',
    tag: '추천 코스',
    badge: '장거리 종단',
    categoryTitle: '안양천 척추 쾌속 롱라이딩',
    name: '안양천 종단 쾌속 롱라이딩 (기아대교~호계교)',
    distance: '11.8km',
    distanceKm: 11.8,
    time: '48분',
    timeMinutes: 48,
    type: '공식 안양 남북 척추 간선로',
    arrival: '11:48',
    bikePath: 96,
    road: 3,
    sidewalk: 1,
    dedicatedBikeRatio: 96,
    sharedBikeRatio: 3,
    sidewalkRatio: 1,
    riverPathRatio: 96,
    segregatedRatio: 3,
    unsegregatedRatio: 1,
    isScenicCourse: true,
    scenicScore: '우수 (안양천 전구간 94%)',
    scenicHighlights: ['석수체육공원', '충훈교 벚꽃길', '쌍개울 광장', '호계교'],
    stairs: 0,
    overpass: 0,
    slope: '0.5%',
    slopeLevel: '평탄',
    calories: 490,
    description: '서울시계(기아대교)부터 비산 쌍개울을 거쳐 의왕시계(호계교)까지 안양시를 남북으로 시원하게 관통하는 11.8km 논스톱 장거리 코스',
    startPoint: '석수체육공원 (서울시계)',
    endPoint: '호계교 의왕시계 쉼터',
    elevationProfile: [22, 24, 25, 26, 27, 28, 29, 31, 33],
    themeKeywords: ['안양천 종단', '11.8km', '신호등 없음', '롱라이딩'],
    path: [
      [37.4392, 126.9025],
      [37.4320, 126.9080],
      [37.4255, 126.9135],
      [37.4180, 126.9185],
      [37.4110, 126.9240],
      [37.4010, 126.9405],
      [37.3980, 126.9485],
      [37.3840, 126.9420],
      [37.3710, 126.9520],
    ],
    navSteps: [
      { id: 's1', iconType: 'up', text: '3.5km 안양천 북부 구간 질주', sub: '서울시계~충훈교', distanceMeter: 3500, instruction: '신호 없이 쾌적한 안양천 하천길을 따라 남쪽으로 직진하세요.' },
      { id: 's2', iconType: 'up', text: '4.2km 중앙광장 및 쌍개울 통과', sub: '무료 정비소 및 급수대', distanceMeter: 4200, instruction: '쌍개울 문화광장을 지나 의왕 방향 본류로 계속 직진하세요.' },
      { id: 's3', iconType: 'up', text: '4.1km 남부 호계교 방면 주행', sub: '평탄 아스팔트 전용로', distanceMeter: 4100, instruction: '명학대교를 지나 호계교 쉼터까지 완만한 평지길을 즐기세요.' },
      { id: 's4', iconType: 'arrive', text: '호계교 의왕시계 쉼터 도착', sub: '라이딩 완료 (11.8km)', distanceMeter: 0, instruction: '안양천 남북 종단 코스를 완주했습니다.' },
    ],
  },
  {
    id: 'c-pyeongchon-urban-loop',
    tag: '단거리',
    badge: '생활 순환',
    categoryTitle: '평촌 도심 생활 그린로드',
    name: '평촌 도심 순환 그린웨이 (중앙공원~학원가~자유공원)',
    distance: '5.2km',
    distanceKm: 5.2,
    time: '24분',
    timeMinutes: 24,
    type: '공식 도심 문화 생활로',
    arrival: '11:24',
    bikePath: 86,
    road: 9,
    sidewalk: 5,
    dedicatedBikeRatio: 86,
    sharedBikeRatio: 9,
    sidewalkRatio: 5,
    riverPathRatio: 5,
    segregatedRatio: 75,
    unsegregatedRatio: 20,
    isScenicCourse: false,
    scenicScore: '도심 공원 연계 78%',
    scenicHighlights: ['평촌중앙공원 분수대', '평촌학원가 녹지대', '자유공원 숲길'],
    stairs: 0,
    overpass: 0,
    slope: '1.0%',
    slopeLevel: '평탄',
    calories: 195,
    description: '평촌중앙공원에서 출발하여 평촌대로와 학원가를 지나 자유공원을 돌아오는 평촌 신도시 핵심 생활 라이딩 코스',
    startPoint: '평촌중앙공원 분수광장',
    endPoint: '평촌중앙공원 (순환)',
    elevationProfile: [31, 32, 33, 34, 32, 31],
    themeKeywords: ['평촌중앙공원', '평촌학원가', '자유공원', '도심 순환'],
    path: [
      [37.3915, 126.9560],
      [37.3895, 126.9508],
      [37.3820, 126.9540],
      [37.3750, 126.9580],
      [37.3820, 126.9620],
      [37.3915, 126.9560],
    ],
    navSteps: [
      { id: 's1', iconType: 'up', text: '1.2km 시민대로 자전거 전용로', sub: '범계역 방면', distanceMeter: 1200, instruction: '중앙공원에서 범계역 방향 자전거 전용차로로 직진하세요.' },
      { id: 's2', iconType: 'left', text: '평촌대로 학원가 방향 좌회전', sub: '자전거 횡단도 통과', distanceMeter: 800, instruction: '평촌대로를 따라 남쪽 학원가 방면으로 주행하세요.' },
      { id: 's3', iconType: 'crosswalk', text: '귀인동 학원가 입구 횡단보도 통과', sub: '귀인동 (폭 18.8m · 길이 30.0m) - 하차 보행', distanceMeter: 100, warn: true, instruction: '평촌학원가 횡단보도입니다. 자전거에서 내려 안전하게 건너세요.', crosswalkInfo: { dong: '귀인동', widthM: 18.77, lengthM: 30.02, roadName: '귀인로 평촌학원가 입구' } },
      { id: 's4', iconType: 'up', text: '2.1km 자유공원 경유 순환 복귀', sub: '문화공원 숲길', distanceMeter: 2100, instruction: '자유공원을 돌아 중앙공원 분수광장으로 안전하게 복귀하세요.' },
      { id: 's5', iconType: 'arrive', text: '평촌중앙공원 원점 복귀 완료', sub: '공기주입기 및 쉼터', distanceMeter: 1000, instruction: '평촌 도심 순환 라이딩을 마쳤습니다.' },
    ],
  },
  {
    id: 'c-hagui-baekun-link',
    tag: '경치 좋은',
    badge: '호수 힐링',
    categoryTitle: '학의천~백운호수 힐링로드',
    name: '학의천~의왕 백운호수 연결 힐링 수변길',
    distance: '6.8km',
    distanceKm: 6.8,
    time: '32분',
    timeMinutes: 32,
    type: '공식 광역 수변 힐링 코스',
    arrival: '11:32',
    bikePath: 93,
    road: 5,
    sidewalk: 2,
    dedicatedBikeRatio: 93,
    sharedBikeRatio: 5,
    sidewalkRatio: 2,
    riverPathRatio: 90,
    segregatedRatio: 7,
    unsegregatedRatio: 3,
    isScenicCourse: true,
    scenicScore: '최우수 (하천·호수 96%)',
    scenicHighlights: ['학의천 갈대밭', '인덕원교 쉼터', '백운호수 수변데크'],
    stairs: 0,
    overpass: 0,
    slope: '1.5%',
    slopeLevel: '평탄',
    calories: 280,
    description: '비산 쌍개울에서 학의천을 따라 인덕원을 지나 백운호수 입구 수변 데크까지 이어지는 대표 근교 힐링 코스',
    startPoint: '비산교 쌍개울 광장',
    endPoint: '의왕 백운호수 자전거 진입로',
    elevationProfile: [27, 28, 29, 31, 36, 44],
    themeKeywords: ['학의천', '인덕원', '백운호수', '호수 풍경'],
    path: [
      [37.3980, 126.9485],
      [37.3948, 126.9610],
      [37.3985, 126.9805],
      [37.4005, 126.9865],
      [37.4020, 126.9930],
      [37.3850, 127.0100],
    ],
    navSteps: [
      { id: 's1', iconType: 'up', text: '3.8km 학의천 수변 전용길 직진', sub: '인덕원교 방면', distanceMeter: 3800, instruction: '학의천을 따라 동쪽 인덕원 방면으로 직진하세요.' },
      { id: 's2', iconType: 'crosswalk', text: '관양동 인덕원교 횡단보도 통과', sub: '관양동 (폭 20.1m · 길이 34.8m) - 하차 보행', distanceMeter: 150, warn: true, instruction: '인덕원 횡단보도입니다. 자전거에서 내려 보행해 주세요.', crosswalkInfo: { dong: '관양동', widthM: 20.05, lengthM: 34.83, roadName: '인덕원역 4호선 사거리 횡단보도' } },
      { id: 's3', iconType: 'up', text: '2.8km 포일천~백운호수 연결로', sub: '완경사 수변로', distanceMeter: 2800, instruction: '백운호수 방면 자전거 연결 데크길로 주행하세요.' },
      { id: 's4', iconType: 'arrive', text: '백운호수 입구 도착', sub: '호수 전망대 및 카페거리', distanceMeter: 50, instruction: '백운호수 수변 광장에 도착했습니다.' },
    ],
  },
  {
    id: 'c-heritage-manan',
    tag: '경치 좋은',
    badge: '역사 문화',
    categoryTitle: '정조 능행차 역사길',
    name: '안양 9경 문화유산 라이딩 (만안교~안양사~예술공원)',
    distance: '5.5km',
    distanceKm: 5.5,
    time: '28분',
    timeMinutes: 28,
    type: '공식 문화유산 테마 코스',
    arrival: '11:28',
    bikePath: 84,
    road: 11,
    sidewalk: 5,
    dedicatedBikeRatio: 84,
    sharedBikeRatio: 11,
    sidewalkRatio: 5,
    isScenicCourse: true,
    scenicScore: '우수 (문화재·역사 93%)',
    scenicHighlights: ['조선 정조대왕 만안교(경기도 유형문화재)', '안양사', '안양예술공원 문화광장'],
    stairs: 0,
    overpass: 0,
    slope: '2.5%',
    slopeLevel: '완만',
    calories: 250,
    description: '조선 정조대왕의 효심이 깃든 7련 홍예석교 만안교와 안양시의 유래가 된 고찰 안양사, 예술공원을 잇는 역사 문화 코스',
    startPoint: '석수역 1번 출구 자전거길',
    endPoint: '안양예술공원 안양사 입구',
    elevationProfile: [24, 28, 33, 45, 58, 70],
    themeKeywords: ['만안교', '정조대왕', '안양사', '안양 9경'],
    path: [
      [37.4320, 126.9080],
      [37.4255, 126.9135],
      [37.4100, 126.9310],
      [37.4190, 126.9290],
      [37.4270, 126.9270],
    ],
    navSteps: [
      { id: 's1', iconType: 'up', text: '1.8km 안양천변 남하 직진', sub: '만안교 방면', distanceMeter: 1800, instruction: '안양천길을 따라 만안교 방향으로 직진하세요.' },
      { id: 's2', iconType: 'left', text: '만안교 홍예교 관람 진입', sub: '경기도 유형문화재 제38호', distanceMeter: 600, instruction: '만안교 쉼터에서 조선시대 7련 홍예석교를 감상하세요.' },
      { id: 's3', iconType: 'up', text: '2.2km 삼성천 계곡 숲길 주행', sub: '안양예술공원 입구', distanceMeter: 2200, instruction: '삼성천 계곡길을 따라 안양예술공원 방향으로 완만하게 주행하세요.' },
      { id: 's4', iconType: 'arrive', text: '안양사 입구 도착', sub: '전통사찰 및 숲 쉼터', distanceMeter: 900, instruction: '역사 문화 코스 종점에 도착했습니다.' },
    ],
  },
  {
    id: 'c-chunghun-seoksu-riverside',
    tag: '평지 중심',
    badge: '시원한 강바람',
    categoryTitle: '충훈부~서울시계 리버사이드',
    name: '충훈부~석수체육공원 서울시계 리버사이드',
    distance: '4.6km',
    distanceKm: 4.6,
    time: '20분',
    timeMinutes: 20,
    type: '공식 강변 평지 코스',
    arrival: '11:20',
    bikePath: 95,
    road: 3,
    sidewalk: 2,
    dedicatedBikeRatio: 95,
    sharedBikeRatio: 3,
    sidewalkRatio: 2,
    isScenicCourse: true,
    scenicScore: '우수 (강변 시야 92%)',
    scenicHighlights: ['충훈교 벚꽃 쉼터', '석수체육공원 롤러장', '기아대교 전망대'],
    stairs: 0,
    overpass: 0,
    slope: '0.4%',
    slopeLevel: '평탄',
    calories: 180,
    description: '만안구 충훈부에서 석수체육공원을 거쳐 서울 금천구 경계까지 탁 트인 강바람을 맞으며 달리는 무신호 평지 수변길',
    startPoint: '충훈교 벚꽃 슬로프',
    endPoint: '석수체육공원 서울시계',
    elevationProfile: [25, 24, 23, 23, 22],
    themeKeywords: ['충훈부', '석수체육공원', '서울시계', '강바람길'],
    path: [
      [37.4180, 126.9185],
      [37.4255, 126.9135],
      [37.4320, 126.9080],
      [37.4392, 126.9025],
    ],
    navSteps: [
      { id: 's1', iconType: 'up', text: '1.5km 안양천 하류 직진', sub: '충훈교 쉼터 통과', distanceMeter: 1500, instruction: '충훈교에서 북쪽 석수 방향으로 직진하세요.' },
      { id: 's2', iconType: 'up', text: '2.1km 석수체육공원 천변 통과', sub: '시야 탁 트인 직선 주로', distanceMeter: 2100, instruction: '석수체육공원 앞 광폭 자전거길을 안전하게 주행하세요.' },
      { id: 's3', iconType: 'arrive', text: '서울시계 (기아대교) 도착', sub: '서울 한강 연결점', distanceMeter: 1000, instruction: '서울시계 쉼터에 도착했습니다.' },
    ],
  },
];

export const POPULAR_LOCATIONS = [
  { name: '쌍개울 문화광장 쉼터', desc: '안양천-학의천 합수부 (상설 무료 자전거 정비소)', lat: 37.3980, lng: 126.9485 },
  { name: '안양천 중앙광장', desc: '안양시 만안구 안양동 안양천변', lat: 37.4010, lng: 126.9405 },
  { name: '범계역 4번 출구', desc: '안양시 동안구 호계동 1039-1 (시민대로 자전거길)', lat: 37.3895, lng: 126.9508 },
  { name: '평촌중앙공원 분수대', desc: '안양시 동안구 관양동 1601 (공기주입기 완비)', lat: 37.3915, lng: 126.9605 },
  { name: '안양예술공원 벽천분수대', desc: '안양시 만안구 석수동 산22 (삼성천 밸리길)', lat: 37.4230, lng: 126.9280 },
  { name: '학의천 인덕원교 쉼터', desc: '안양시 동안구 관양동 1500 (학의천 동단)', lat: 37.3985, lng: 126.9805 },
  { name: '충훈교 벚꽃길 슬로프', desc: '안양시 만안구 석수동 789 (무장애 진출입로)', lat: 37.4180, lng: 126.9185 },
  { name: '병목안 시민공원 입구', desc: '안양시 만안구 안양9동 산81 (수암천 코스 종점)', lat: 37.3880, lng: 126.9080 },
  { name: '경인교대 경기캠퍼스 정문', desc: '안양시 만안구 석수동 240 (삼막천 코스)', lat: 37.4320, lng: 126.9380 },
  { name: '석수체육공원 자전거길', desc: '안양시 만안구 석수동 101-1 (서울시계 연결)', lat: 37.4320, lng: 126.9080 },
  { name: '평촌역 1번 출구', desc: '안양시 동안구 관양동 1599 (스마트스퀘어)', lat: 37.3945, lng: 126.9635 },
  { name: '비산체육공원 자전거길', desc: '안양시 동안구 비산동 132 (학의천 연결)', lat: 37.3965, lng: 126.9540 },
];
