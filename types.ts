export type AppState = 'idle' | 'courseSelected' | 'riding';

export type TabType = 'home' | 'record' | 'facilities' | 'profile';

export type RouteType = 'oneway' | 'roundtrip';

export type FilterCategory =
  | '추천 코스'
  | '경치 좋은'
  | '평지 중심'
  | '단거리'
  | '계단 없음'
  | '낮은 혼잡도';

export type POICategory =
  | 'water'
  | 'repair'
  | 'restroom'
  | 'parking'
  | 'cafe'
  | 'hazard';

export type ReportCategory =
  | 'closure'
  | 'accident'
  | 'damage'
  | 'hazard'
  | 'flooding';

export type TTSVoiceType =
  | 'female-clear'
  | 'male-calm'
  | 'female-friendly'
  | 'male-energetic';

export type ThemeColor =
  | 'blue'
  | 'green'
  | 'dark'
  | 'high-contrast';

export type FontSize =
  | 'normal'
  | 'large'
  | 'xlarge';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NavStep {
  id?: string;
  iconType: 'up' | 'left' | 'right' | 'u-turn' | 'crosswalk' | 'arrive';
  distanceMeter: number;
  distanceMeters?: number;
  text: string;
  sub?: string;
  instruction?: string;
  warn?: boolean;
  turnType?: 'straight' | 'left' | 'right' | 'u-turn' | 'crosswalk' | 'arrive';
  crosswalkInfo?: {
    dong: string;
    widthM: number;
    lengthM: number;
    roadName?: string;
  };
}

export interface Course {
  id: string;
  name: string;
  tag: FilterCategory;
  badge: string;
  categoryTitle: string;
  distance: string;
  distanceKm: number;
  time: string;
  timeMinutes: number;
  slope: string;
  calories: number;
  stairs: number;
  arrival: string;
  bikePath: number;
  road: number;
  sidewalk: number;
  dedicatedBikeRatio?: number;
  sharedBikeRatio?: number;
  sidewalkRatio?: number;
  riverPathRatio?: number;
  segregatedRatio?: number;
  unsegregatedRatio?: number;
  description: string;
  scenicHighlights?: string[];
  themeKeywords?: string[];
  safetyNotes?: string[];
  startPoint?: string;
  endPoint?: string;
  path: [number, number][];
  navSteps: NavStep[];
}

export interface Facility {
  id: string;
  name: string;
  category: POICategory;
  categoryName: string;
  lat: number;
  lng: number;
  address: string;
  roadAddress?: string;
  district?: '만안구' | '동안구';
  capacity?: number;
  airPumpType?: string;
  description: string;
  distance?: string;
  rawDistanceKm?: number;
  openHours?: string;
  facilityType?: string;
  emergencyBell?: boolean;
  disabledToilet?: boolean;
  cctv?: boolean;
  diaperTable?: boolean;
  managementAgency?: string;
  phone?: string;
  availableItems?: string[];
  original?: string;
  detail?: string;
  searchKeyword?: string;
}

export interface RampAccessPoint {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  connectedRoad: string;
}

export interface RidingRecord {
  id: string;
  date: string;
  courseName: string;
  distanceKm: number;
  durationMinutes: number;
  avgSpeedKmh: number;
  maxSpeedKmh?: number;
  calories: number;
  elevationM?: number;
  path?: [number, number][];
}

export interface UserPreferences {
  avoidStairs: boolean;
  avoidSteepSlopes: boolean;
  voiceGuide: boolean;
  autoReroute: boolean;
  speedAlert: boolean;
  ttsVoice: TTSVoiceType;
  ttsSpeed: number;
  ttsPitch: number;
  themeColor: ThemeColor;
  fontSize: FontSize;
}

export interface CommunityReport {
  id: string;
  category: ReportCategory;
  categoryName: string;
  title: string;
  location: string;
  content: string;
  timestamp: string;
  status: 'active' | 'resolved';
  likes: number;
  isLiked?: boolean;
  coordinates?: { lat: number; lng: number };
}

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
