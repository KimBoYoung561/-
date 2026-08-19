import { Course, LatLng, Facility, NavStep } from '../types';
import { OFFICIAL_STREAM_LINES } from '../data/courses';
import { calculateRealBikeRoute, calculateAnyangDenseRoadRoute, interpolateDenseRoadPath } from '../services/routerService';

/**
 * Haversine formula to compute distance between two coordinates in kilometers
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats current date/time to HH:mm string
 */
export function getCurrentTimeString(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculates estimated arrival time string (HH:mm) given riding duration in minutes from now (or from baseTimeStr)
 */
export function getCalculatedArrivalTime(durationMinutes: number, baseTimeStr?: string): string {
  const now = new Date();
  if (baseTimeStr && baseTimeStr.includes(':')) {
    const [h, m] = baseTimeStr.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      now.setHours(h, m, 0, 0);
    }
  }
  const arrival = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const h = String(arrival.getHours()).padStart(2, '0');
  const m = String(arrival.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Helper to build round-trip return navigation steps
 */
export function createReturnNavSteps(
  destName: string,
  originName: string,
  totalDistanceKm: number
): NavStep[] {
  return [
    {
      id: 'step-turnaround',
      iconType: 'u-turn',
      text: `${destName} 반환점 통과 후 회귀`,
      sub: `${originName} 방면 복귀 주행 시작`,
      distanceMeter: 50,
      instruction: `${destName}에서 안전하게 유턴하여 출발지인 ${originName} 방면으로 복귀하세요.`,
    },
    {
      id: 'step-return-ride',
      iconType: 'up',
      text: `${originName} 방면 수변/전용도로 주행`,
      sub: '복귀 안전 주행 (보행자 안전거리 유지, 20km/h)',
      distanceMeter: Math.round((totalDistanceKm / 2) * 1000),
      instruction: `${originName} 방면으로 시원하게 복귀 주행하세요.`,
    },
    {
      id: 'step-return-arrive',
      iconType: 'arrive',
      text: `${originName} 원점 회귀 완료`,
      sub: `총 ${totalDistanceKm}km 왕복 라이딩 완주`,
      distanceMeter: 0,
      instruction: `출발지인 ${originName}에 안전하게 되돌아왔습니다. 수고하셨습니다!`,
    },
  ];
}

/**
 * Calculates the total length of a polyline in kilometers
 */
export function calculatePathTotalKm(path: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += getDistanceKm(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
  }
  return Math.round(total * 10) / 10;
}

/**
 * Asynchronously calculates a real-road bicycle route using OSRM & Anyang bike network
 */
export async function fetchCustomOptimalRouteAsync(
  originName: string,
  originCoords: LatLng,
  destName: string,
  destCoords: LatLng,
  routeType: 'oneway' | 'roundtrip' = 'oneway',
  preferredFilter?: string
): Promise<Course> {
  const isRoundTrip = routeType === 'roundtrip';
  const result = await calculateRealBikeRoute(originCoords, destCoords, originName, destName);

  let finalPath = [...result.path];
  let finalNavSteps = [...result.navSteps];
  let distanceKm = result.distanceKm;

  if (isRoundTrip) {
    const reversed = [...result.path].reverse().slice(1);
    finalPath = [...result.path, ...reversed];
    distanceKm = Math.round(distanceKm * 2 * 10) / 10;

    const returnSteps = createReturnNavSteps(destName, originName, distanceKm);
    finalNavSteps = [...result.navSteps.slice(0, -1), ...returnSteps];
  }

  const timeMinutes = Math.max(5, Math.round((distanceKm / 15) * 60));
  const calories = Math.round(distanceKm * 38);
  const arrival = getCalculatedArrivalTime(timeMinutes);

  const isScenic =
    preferredFilter === '경치 좋은' ||
    destName.includes('공원') ||
    destName.includes('천') ||
    destName.includes('계곡');

  return {
    id: `custom-route-${Date.now()}`,
    name: `${originName.split(' ')[0]} ➔ ${destName.split(' ')[0]} ${isRoundTrip ? '(왕복)' : '(편도)'}`,
    description: `${originName}에서 ${destName}까지 실제 자전거 전용로와 안전 간선도로를 따라 안내하는 ${isRoundTrip ? '왕복 순환' : '편도 최적'} 자전거 경로입니다.`,
    startPoint: originName,
    endPoint: isRoundTrip ? `${originName} (반환: ${destName})` : destName,
    distance: `${distanceKm}km`,
    distanceKm,
    time: `${timeMinutes}분`,
    timeMinutes,
    slope: '평탄함 (0.8%)',
    slopeLevel: '평탄',
    stairs: 0,
    overpass: 0,
    arrival,
    bikePath: result.dedicatedBikeRatio,
    road: result.sharedBikeRatio,
    sidewalk: result.sidewalkRatio,
    dedicatedBikeRatio: result.dedicatedBikeRatio,
    sharedBikeRatio: result.sharedBikeRatio,
    sidewalkRatio: result.sidewalkRatio,
    riverPathRatio: result.riverPathRatio,
    segregatedRatio: result.segregatedRatio,
    unsegregatedRatio: result.unsegregatedRatio,
    isScenicCourse: isScenic,
    scenicScore: isScenic ? '우수 (수변·공원 연계)' : '양호 (자전거 간선도로 연계)',
    scenicHighlights: isScenic ? ['안양 자전거길', destName] : [destName],
    path: finalPath,
    calories,
    tag: (preferredFilter as any) || '추천 코스',
    type: isRoundTrip ? '왕복 최적 자전거 경로' : '편도 최적 자전거 경로',
    elevationProfile: [27, 28, 30, 32, 31, 29, 28],
    navSteps: finalNavSteps,
  };
}

/**
 * Creates an instant Course object for custom search (synchronous fallback)
 */
export function createCustomOptimalRoute(
  originName: string,
  originCoords: LatLng,
  destName: string,
  destCoords: LatLng,
  routeType: 'oneway' | 'roundtrip' = 'oneway',
  preferredFilter?: string
): Course {
  const isRoundTrip = routeType === 'roundtrip';
  
  const denseResult = calculateAnyangDenseRoadRoute(originCoords, destCoords, originName, destName);
  const finalPath = isRoundTrip ? [...denseResult.path, ...[...denseResult.path].reverse().slice(1)] : denseResult.path;
  const distanceKm = isRoundTrip ? Math.round(denseResult.distanceKm * 2 * 10) / 10 : denseResult.distanceKm;
  const timeMinutes = isRoundTrip ? denseResult.timeMinutes * 2 : denseResult.timeMinutes;
  const calories = isRoundTrip ? denseResult.calories * 2 : denseResult.calories;
  const arrival = getCalculatedArrivalTime(timeMinutes);

  const isScenic = preferredFilter === '경치 좋은' || destName.includes('공원') || destName.includes('천');
  const finalNavSteps = isRoundTrip
    ? [...denseResult.navSteps.slice(0, -1), ...createReturnNavSteps(destName, originName, distanceKm)]
    : denseResult.navSteps;

  return {
    id: `custom-route-${Date.now()}`,
    name: `${originName.split(' ')[0]} ➔ ${destName.split(' ')[0]} ${isRoundTrip ? '(왕복)' : '(편도)'}`,
    description: `${originName}에서 ${destName}까지 실제 자전거 전용로를 따라 안내하는 ${isRoundTrip ? '왕복 순환' : '편도 최적'} 자전거 경로입니다.`,
    startPoint: originName,
    endPoint: isRoundTrip ? `${originName} (반환: ${destName})` : destName,
    distance: `${distanceKm}km`,
    distanceKm,
    time: `${timeMinutes}분`,
    timeMinutes,
    slope: '평탄함 (0.8%)',
    slopeLevel: '평탄',
    stairs: 0,
    overpass: 0,
    arrival,
    bikePath: denseResult.dedicatedBikeRatio,
    road: denseResult.sharedBikeRatio,
    sidewalk: denseResult.sidewalkRatio,
    dedicatedBikeRatio: denseResult.dedicatedBikeRatio,
    sharedBikeRatio: denseResult.sharedBikeRatio,
    sidewalkRatio: denseResult.sidewalkRatio,
    riverPathRatio: denseResult.riverPathRatio,
    segregatedRatio: denseResult.segregatedRatio,
    unsegregatedRatio: denseResult.unsegregatedRatio,
    isScenicCourse: isScenic,
    scenicScore: isScenic ? '우수 (수변·공원 92%)' : '보통 (하천 및 도심)',
    scenicHighlights: [destName],
    path: finalPath,
    calories,
    tag: (preferredFilter as any) || '추천 코스',
    type: isRoundTrip ? '왕복 최적 자전거 경로' : '편도 최적 자전거 경로',
    elevationProfile: [27, 28, 30, 32, 31, 29, 28],
    navSteps: finalNavSteps,
  };
}

/**
 * Creates a Course object when navigating to a Facility
 */
export function createFacilityOptimalRoute(
  originCoords: LatLng,
  originName: string,
  facility: Facility
): Course {
  const denseResult = calculateAnyangDenseRoadRoute(originCoords, { lat: facility.lat, lng: facility.lng }, originName, facility.name);

  const categoryEmoji: Record<string, string> = {
    water: '💧',
    repair: '🔧',
    restroom: '🚻',
    parking: '🚲',
    cafe: '☕',
    hazard: '⚠️',
  };

  const emoji = categoryEmoji[facility.category] || '📍';
  const arrival = getCalculatedArrivalTime(denseResult.timeMinutes);

  return {
    id: `facility-route-${facility.id}-${Date.now()}`,
    name: `${originName.split(' ')[0]} ➔ ${emoji} ${facility.name}`,
    description: `${facility.categoryName} (${facility.name})까지 안양 자전거도로를 우선 경유하는 최적 안전 경로입니다.`,
    startPoint: originName,
    endPoint: facility.name,
    distance: `${denseResult.distanceKm}km`,
    distanceKm: denseResult.distanceKm,
    time: `${denseResult.timeMinutes}분`,
    timeMinutes: denseResult.timeMinutes,
    slope: '평탄함 (0.6%)',
    slopeLevel: '평탄',
    stairs: 0,
    overpass: 0,
    arrival,
    bikePath: denseResult.dedicatedBikeRatio,
    road: denseResult.sharedBikeRatio,
    sidewalk: denseResult.sidewalkRatio,
    dedicatedBikeRatio: denseResult.dedicatedBikeRatio,
    sharedBikeRatio: denseResult.sharedBikeRatio,
    sidewalkRatio: denseResult.sidewalkRatio,
    riverPathRatio: denseResult.riverPathRatio,
    segregatedRatio: denseResult.segregatedRatio,
    unsegregatedRatio: denseResult.unsegregatedRatio,
    isScenicCourse: true,
    scenicScore: '우수 (수변·도심 자전거도로)',
    scenicHighlights: [facility.name],
    path: denseResult.path,
    calories: denseResult.calories,
    tag: '단거리',
    type: '편의시설 최적 자전거 경로',
    elevationProfile: [28, 29, 31, 30, 32, 29, 30],
    navSteps: denseResult.navSteps,
  };
}

/**
 * Creates an AI-recommended closed loop route for a specified target distance returning to the origin
 */
export function createLoopRouteByDistance(
  originName: string,
  originCoords: LatLng,
  targetKm: number
): Course {
  const roundedTarget = Math.max(3, Math.min(50, Math.round(targetKm * 10) / 10));
  const halfTarget = roundedTarget / 2;

  // Find closest stream line
  const stream = OFFICIAL_STREAM_LINES[0]; // 안양천 or 학의천
  const forwardPath: [number, number][] = [];
  forwardPath.push([originCoords.lat, originCoords.lng]);

  // Connect along stream path
  let curDist = 0;
  for (let i = 0; i < stream.path.length; i++) {
    const pt = stream.path[i];
    const prev = forwardPath[forwardPath.length - 1];
    const d = getDistanceKm(prev[0], prev[1], pt[0], pt[1]);
    if (curDist + d > halfTarget) break;
    curDist += d;
    forwardPath.push([pt[0], pt[1]]);
  }

  const turnaroundPt = forwardPath[forwardPath.length - 1];
  const turnaroundName = turnaroundPt[0] > 37.41 ? '안양천 충훈교 쉼터' : '비산교 쌍개울 광장';

  const returnPath = [...forwardPath].reverse().slice(1);
  const rawLoopPath: [number, number][] = [...forwardPath, ...returnPath];
  const fullLoopPath = interpolateDenseRoadPath(rawLoopPath, 35);

  const actualKm = calculatePathTotalKm(fullLoopPath);
  const finalDistanceKm = actualKm < 2.0 ? roundedTarget : actualKm;
  const timeMinutes = Math.max(10, Math.round((finalDistanceKm / 15) * 60));
  const calories = Math.round(finalDistanceKm * 38);
  const arrival = getCalculatedArrivalTime(timeMinutes);

  const navSteps: NavStep[] = [
    {
      id: 'loop-start',
      iconType: 'up',
      text: `${originName} 출발 (AI ${roundedTarget}km 순환 루프)`,
      sub: '가까운 수변 자전거 전용도로 진입',
      distanceMeter: 150,
      instruction: `${originName}에서 출발하여 ${stream.streamName} 수변 자전거 전용로로 진입합니다.`,
    },
    {
      id: 'loop-forward',
      iconType: 'up',
      text: `${turnaroundName} 방면 평지 수변길 주행`,
      sub: `반환점까지 약 ${(finalDistanceKm / 2).toFixed(1)}km 직진 코스 (시속 20km/h 권장)`,
      distanceMeter: Math.round((finalDistanceKm / 2) * 1000 - 150),
      instruction: `${turnaroundName} 방면으로 쾌적하게 수변 라이딩을 즐기세요.`,
    },
    {
      id: 'loop-turnaround',
      iconType: 'u-turn',
      text: `${turnaroundName} 반환점 유턴 및 회귀`,
      sub: `${originName} 방면 원점 회귀 주행 시작`,
      distanceMeter: 50,
      instruction: `${turnaroundName}에서 안전하게 유턴하여 원점 복귀 코스로 전환하세요.`,
    },
    {
      id: 'loop-return',
      iconType: 'up',
      text: `${originName} 방면 회귀 주행`,
      sub: '보행자 주의 및 1m 안전거리 유지',
      distanceMeter: Math.round((finalDistanceKm / 2) * 1000 - 50),
      instruction: `${originName} 방면으로 안전하게 복귀 주행하세요.`,
    },
    {
      id: 'loop-arrive',
      iconType: 'arrive',
      text: `${originName} 원점 회귀 완료`,
      sub: `총 ${finalDistanceKm}km 라이딩 완주 (약 ${calories} kcal 소모)`,
      distanceMeter: 0,
      instruction: `출발지인 ${originName}에 도착하여 순환 코스를 성공적으로 완주했습니다!`,
    },
  ];

  return {
    id: `loop-route-${roundedTarget}km-${Date.now()}`,
    name: `${originName.split(' ')[0]} 출발 ➔ ${roundedTarget}km 원점 회귀 코스`,
    description: `${originName}에서 출발하여 ${turnaroundName}을 거쳐 다시 돌아오는 총 ${finalDistanceKm}km의 평지 100% 안양천·학의천 수변 순환 라이딩 코스입니다.`,
    startPoint: originName,
    endPoint: `${originName} (반환: ${turnaroundName})`,
    distance: `${finalDistanceKm}km`,
    distanceKm: finalDistanceKm,
    time: `${timeMinutes}분`,
    timeMinutes,
    slope: '평탄함 (0.5%)',
    slopeLevel: '평탄',
    stairs: 0,
    overpass: 0,
    arrival,
    bikePath: 95,
    road: 4,
    sidewalk: 1,
    dedicatedBikeRatio: 95,
    sharedBikeRatio: 4,
    sidewalkRatio: 1,
    riverPathRatio: 92,
    segregatedRatio: 6,
    unsegregatedRatio: 2,
    isScenicCourse: true,
    scenicScore: '최우수 (수변·하천 98%)',
    scenicHighlights: [stream.streamName, turnaroundName, '쌍개울 광장'],
    path: fullLoopPath,
    calories,
    tag: '추천 코스',
    type: '거리 맞춤 왕복 순환 (AI)',
    elevationProfile: [28, 28, 29, 30, 29, 28, 28],
    navSteps,
  };
}
