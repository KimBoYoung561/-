export type AppState = 'idle' | 'courseSelected' | 'riding';

export type TabType = 'home' | 'record' | 'facilities' | 'profile';

export type RouteType = 'oneway' | 'roundtrip';

export type FilterCategory = '추천 코스' | '경치 좋은' | '평지 중심' | '단거리' | '계단 없음' | '낮은 혼잡도';

export interface RouteSearchParams {
  routeType: RouteType;
  origin: string;
  originCoords?: LatLng;
  destination: string;
  destinationCoords?: LatLng;
  isDistanceLoop?: boolean;
  targetDistanceKm?: number;
  preferredFilter?: FilterCategory;
}

export type POICategory = 'water' | 'restroom' | 'repair' | 'parking' | 'cafe' | 'hazard';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NavStep {
  id: string;
  iconType: 'up' | 'left' | 'right' | 'u-turn' | 'arrive' | 'crosswalk';
  text: string;
  sub: string;
  distanceMeter: number;
  warn?: boolean;
  instruction: string;
  crosswalkInfo?: {
    widthM: number;
    lengthM: number;
    dong: string;
    roadName?: string;
  };
}

export interface Course {
  id: string;
  tag: FilterCategory;
  name: string;
  distance: string;
  distanceKm: number;
  time: string;
  timeMinutes: number;
  type: string;
  arrival: string;
  bikePath: number; // legacy for backward compatibility
  road: number;     // legacy
  sidewalk: number; // legacy
  dedicatedBikeRatio?: number; // legacy alias
  sharedBikeRatio?: number;    // legacy alias
  sidewalkRatio?: number;      // legacy alias
  // 안양시 자전거도로 노선지정 고시 기준 세부 유형별 비율
  riverPathRatio?: number;     // 하천변 도로 (%) - 빨간색 (Red: #EF4444)
  segregatedRatio?: number;    // 분리도로 (%) - 남색 (Navy: #1E3A8A)
  unsegregatedRatio?: number;  // 비분리도로 (%) - 하늘색 (Sky Blue: #38BDF8)
  scenicScore?: string;        // 경치 평가 등급
  scenicHighlights?: string[]; // 경치 좋은 랜드마크 목록
  isScenicCourse?: boolean;    // 경치 우수 코스 태그
  stairs: number;
  overpass: number;
  slope: string;
  slopeLevel: '평탄' | '완만' | '경사';
  calories: number;
  description: string;
  startPoint: string;
  endPoint: string;
  path: [number, number][];
  elevationProfile: number[];
  navSteps: NavStep[];
}

export interface Facility {
  id: string;
  name: string;
  category: POICategory;
  categoryName: string;
  facilityType?: '공중화장실' | '개방화장실' | '음수대' | '수리시설' | '공기주입기' | '자전거보관소' | '라이더카페' | '주의구간' | '횡단보도';
  address: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  original?: string;
  searchKeyword?: string;
  detail?: string;
  description: string;
  availableItems?: string[];
  distance?: string;
  phone?: string;
  openHours?: string;
  managementAgency?: string;
  emergencyBell?: boolean;
  disabledToilet?: boolean;
  cctv?: boolean;
  diaperTable?: boolean;
}

export interface RidingRecord {
  id: string;
  date: string;
  courseName: string;
  distanceKm: number;
  durationMinutes: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  calories: number;
  elevationM: number;
  path: [number, number][];
}

export type TTSVoiceType = 'female-clear' | 'male-calm' | 'female-friendly' | 'male-energetic';
export type ThemeColor = 'blue' | 'green' | 'dark' | 'high-contrast';
export type FontSize = 'normal' | 'large' | 'xlarge';
export type ReportCategory = 'closure' | 'accident' | 'damage' | 'hazard' | 'flooding';

export interface CommunityReport {
  id: string;
  coordinates?: LatLng;
  category: ReportCategory;
  categoryName: string;
  title: string;
  location: string;
  content: string;
  timestamp: string;
  status: 'active' | 'resolved';
  likes: number;
  isLiked?: boolean;
}

export interface UserPreferences {
  avoidStairs: boolean;
  avoidSteepSlopes: boolean;
  voiceGuide: boolean;
  autoReroute: boolean;
  speedAlert: boolean;
  // Customization additions
  ttsVoice: TTSVoiceType;
  ttsSpeed: number;
  ttsPitch: number;
  themeColor: ThemeColor;
  fontSize: FontSize;
}

export interface OfficialStreamLine {
  id: string;
  name: string;
  streamName: '안양천' | '학의천' | '삼성천' | '수암천' | '삼막천' | '도심간선도로';
  color: string;
  totalDistanceKm: number;
  description: string;
  path: [number, number][];
  type: '하천전용로' | '도심전용로' | '보행겸용로';
}

export interface RampAccessPoint {
  id: string;
  name: string;
  streamName: string;
  type: '경사로(슬로프)' | '하천합수부쉼터' | '지하철연결로' | '자전거교량';
  lat: number;
  lng: number;
  description: string;
  connectedRoad?: string;
  hasAirPump?: boolean;
  hasRestroom?: boolean;
}

