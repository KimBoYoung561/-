import { LatLng, NavStep, Course } from '../types';
import { getDistanceKm, getCalculatedArrivalTime } from '../utils/routeUtils';
import { ANYANG_CROSSWALKS } from '../data/crosswalkData';
import { OFFICIAL_STREAM_LINES } from '../data/courses';

export interface RouteResult {
  path: [number, number][];
  distanceKm: number;
  timeMinutes: number;
  calories: number;
  navSteps: NavStep[];
  dedicatedBikeRatio: number;
  sharedBikeRatio: number;
  sidewalkRatio: number;
  riverPathRatio: number;      // 하천변 도로 (%) - 빨간색 (Red: #EF4444)
  segregatedRatio: number;     // 분리도로 (%) - 남색 (Navy: #1E3A8A)
  unsegregatedRatio: number;   // 비분리도로 (%) - 하늘색 (Sky Blue: #38BDF8)
}

function getPointToPathDistanceMeters(point: LatLng, path: [number, number][]): number {
  if (path.length === 0) return Infinity;
  const latitudeScale = 111320;
  const longitudeScale = Math.cos((point.lat * Math.PI) / 180) * latitudeScale;
  let minimumDistance = Infinity;

  for (let index = 0; index < path.length - 1; index += 1) {
    const startX = (path[index][1] - point.lng) * longitudeScale;
    const startY = (path[index][0] - point.lat) * latitudeScale;
    const endX = (path[index + 1][1] - point.lng) * longitudeScale;
    const endY = (path[index + 1][0] - point.lat) * latitudeScale;
    const dx = endX - startX;
    const dy = endY - startY;
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, -(startX * dx + startY * dy) / lengthSquared));
    minimumDistance = Math.min(minimumDistance, Math.hypot(startX + ratio * dx, startY + ratio * dy));
  }

  return path.length === 1
    ? Math.hypot((path[0][1] - point.lng) * longitudeScale, (path[0][0] - point.lat) * latitudeScale)
    : minimumDistance;
}

/**
 * Calculate Anyang Official Bicycle Road Type Breakdown based on official notification map:
 * - 하천변 도로: 빨간색 (Red: #EF4444)
 * - 분리도로: 남색 (Navy: #1E3A8A)
 * - 비분리도로: 하늘색 (Sky Blue: #38BDF8)
 */
export function calculateRoadTypeBreakdown(coords: [number, number][]): {
  riverPathRatio: number;
  segregatedRatio: number;
  unsegregatedRatio: number;
  dedicatedBikeRatio: number;
  sharedBikeRatio: number;
  sidewalkRatio: number;
} {
  if (!coords || coords.length === 0) {
    return {
      riverPathRatio: 82,
      segregatedRatio: 12,
      unsegregatedRatio: 6,
      dedicatedBikeRatio: 90,
      sharedBikeRatio: 7,
      sidewalkRatio: 3,
    };
  }

  let riverDistance = 0;
  let segregatedDistance = 0;
  let unsegregatedDistance = 0;

  for (let index = 0; index < coords.length - 1; index += 1) {
    const [startLat, startLng] = coords[index];
    const [endLat, endLng] = coords[index + 1];
    const midpoint = { lat: (startLat + endLat) / 2, lng: (startLng + endLng) / 2 };
    const segmentDistance = getDistanceKm(startLat, startLng, endLat, endLng);

    // Classify each segment by its midpoint, then weight the result by distance.
    let isRiver = false;
    for (const stream of OFFICIAL_STREAM_LINES) {
      if (stream.type === '하천전용로') {
        if (getPointToPathDistanceMeters(midpoint, stream.path) < 120) isRiver = true;
      }
      if (isRiver) break;
    }

    if (isRiver) {
      riverDistance += segmentDistance;
      continue;
    }

    // 2. Check proximity to segregated urban bike corridors (< 100m)
    let isSegregated = false;
    for (const key of ['simin-daero', 'pyeongchon-daero', 'gwanak-daero']) {
      const vec = ROAD_VECTORS[key];
      if (vec && getPointToPathDistanceMeters(midpoint, vec) < 100) isSegregated = true;
      if (isSegregated) break;
    }

    if (isSegregated) {
      segregatedDistance += segmentDistance;
    } else {
      unsegregatedDistance += segmentDistance;
    }
  }

  const totalDistance = riverDistance + segregatedDistance + unsegregatedDistance;
  const riverPct = totalDistance > 0 ? Math.round((riverDistance / totalDistance) * 100) : 0;
  const segPct = totalDistance > 0 ? Math.round((segregatedDistance / totalDistance) * 100) : 0;
  const unsegPct = Math.max(0, 100 - riverPct - segPct);
  const dedicatedBikeRatio = riverPct + segPct;
  const sharedBikeRatio = unsegPct;
  const sidewalkRatio = 0;

  return {
    riverPathRatio: Math.max(0, riverPct),
    segregatedRatio: Math.max(0, segPct),
    unsegregatedRatio: Math.max(0, unsegPct),
    dedicatedBikeRatio,
    sharedBikeRatio,
    sidewalkRatio,
  };
}

/**
 * High-density Road Corridors in Anyang (Detailed multi-point vectors following real roads & river paths)
 */
const ROAD_VECTORS: Record<string, [number, number][]> = {
  // 시민대로 (시흥대로/범계역 ~ 인덕원역 도심 동서축 자전거 전용차로)
  'simin-daero': [
    [37.3888, 126.9450], // 범계역 서측 (롯데백화점)
    [37.3895, 126.9508], // 범계역 사거리
    [37.3905, 126.9535], // 동안경찰서 앞
    [37.3915, 126.9560], // 평촌중앙공원 북단 / 동안구청
    [37.3925, 126.9580], // 안양시청 삼거리
    [37.3930, 126.9590], // 안양시청 정문
    [37.3938, 126.9610], // 평촌도서관 사거리
    [37.3945, 126.9635], // 평촌역 사거리 (이마트)
    [37.3952, 126.9670], // 법원/검찰청 삼거리
    [37.3960, 126.9700], // 오비즈타워 삼거리
    [37.3965, 126.9720], // 평촌스마트스퀘어 입구
    [37.3975, 126.9760], // 대한스마트브릿지
    [37.3982, 126.9790], // 인덕원교차로 서단
    [37.3990, 126.9820], // 인덕원역 사거리
  ],

  // 평촌대로 (비산사거리 ~ 범계역 ~ 학원가 ~ 자유공원 ~ 호계사거리 남북축)
  'pyeongchon-daero': [
    [37.4040, 126.9460], // 비산사거리
    [37.4010, 126.9472], // 비산대교 남단
    [37.3980, 126.9485], // 비산교 쌍개울 입구
    [37.3950, 126.9490], // 샛별단지 사거리
    [37.3920, 126.9500], // 범계중학교
    [37.3895, 126.9508], // 범계사거리
    [37.3860, 126.9520], // 목련단지 사거리
    [37.3820, 126.9540], // 평촌학원가 사거리
    [37.3780, 126.9560], // 귀인동 주민센터 삼거리
    [37.3750, 126.9580], // 자유공원 입구 / 평촌아트홀
    [37.3720, 126.9595], // 호계3동 주민센터
    [37.3690, 126.9610], // 호계사거리
  ],

  // 관악대로 (비산사거리 ~ 종합운동장 ~ 수촌마을 ~ 관양사거리 ~ 인덕원역)
  'gwanak-daero': [
    [37.4040, 126.9460], // 비산사거리
    [37.4042, 126.9500], // 비산우체국
    [37.4045, 126.9550], // 안양종합운동장 정문
    [37.4040, 126.9600], // 비산동 삼성래미안
    [37.4030, 126.9670], // 수촌마을 사거리
    [37.4020, 126.9710], // 관양시장 입구
    [37.4015, 126.9740], // 관양사거리
    [37.4005, 126.9780], // 동편마을 입구
    [37.3990, 126.9820], // 인덕원역 사거리
  ],

  // 만안로 / 안양로 (석수역 ~ 관악역 ~ 안양역 ~ 만안구청 ~ 명학역 ~ 금정)
  'anyang-manan-ro': [
    [37.4350, 126.9025], // 석수역
    [37.4270, 126.9055], // 석수2동 주민센터
    [37.4190, 126.9090], // 관악역 광장
    [37.4120, 126.9140], // 안양여고 사거리
    [37.4050, 126.9200], // 안양대교 남단
    [37.4018, 126.9228], // 안양역 / 엔터식스
    [37.3980, 126.9250], // 안양일번가 상가거리
    [37.3940, 126.9280], // 만안초교 사거리
    [37.3890, 126.9310], // 세경아파트 삼거리
    [37.3855, 126.9340], // 만안구청 / 안양아트센터
    [37.3840, 126.9355], // 명학역 1번출구
    [37.3780, 126.9400], // 명학초교 삼거리
    [37.3725, 126.9435], // 금정역 사거리
  ],

  // 안양천 자전거 메인 종단로 (북쪽 석수체육공원에서 남쪽 호계교까지 25+ 좌표)
  'anyangcheon-main': [
    [37.4392, 126.9025],
    [37.4350, 126.9050],
    [37.4320, 126.9080],
    [37.4280, 126.9110],
    [37.4255, 126.9135],
    [37.4215, 126.9160],
    [37.4180, 126.9185],
    [37.4145, 126.9210],
    [37.4110, 126.9240],
    [37.4080, 126.9280],
    [37.4050, 126.9320],
    [37.4030, 126.9360],
    [37.4010, 126.9405],
    [37.3995, 126.9445],
    [37.3980, 126.9485],
    [37.3945, 126.9465],
    [37.3910, 126.9450],
    [37.3875, 126.9435],
    [37.3840, 126.9420],
    [37.3805, 126.9435],
    [37.3770, 126.9450],
    [37.3740, 126.9485],
    [37.3710, 126.9520],
    [37.3680, 126.9560],
    [37.3650, 126.9600],
  ],

  // 학의천 자전거 횡단로 (쌍개울 ~ 학운공원 ~ 인덕원교 ~ 동안교 15+ 좌표)
  'haguicheon-main': [
    [37.3980, 126.9485],
    [37.3972, 126.9510],
    [37.3965, 126.9540],
    [37.3955, 126.9575],
    [37.3948, 126.9610],
    [37.3942, 126.9645],
    [37.3940, 126.9680],
    [37.3950, 126.9710],
    [37.3960, 126.9740],
    [37.3972, 126.9770],
    [37.3985, 126.9805],
    [37.3995, 126.9835],
    [37.4005, 126.9865],
    [37.4012, 126.9900],
    [37.4020, 126.9930],
  ],

  // 삼성천 - 안양예술공원 계곡 숲길
  'artpark-samsung': [
    [37.4050, 126.9320],
    [37.4075, 126.9315],
    [37.4100, 126.9310],
    [37.4125, 126.9305],
    [37.4150, 126.9300],
    [37.4170, 126.9295],
    [37.4190, 126.9290],
    [37.4210, 126.9285],
    [37.4230, 126.9280],
    [37.4250, 126.9275],
    [37.4270, 126.9270],
  ],

  // 수암천 - 삼덕공원 ~ 병목안시민공원 녹색길
  'suamcheon-byeongmok': [
    [37.4010, 126.9280],
    [37.3995, 126.9255],
    [37.3980, 126.9230],
    [37.3965, 126.9205],
    [37.3950, 126.9180],
    [37.3935, 126.9155],
    [37.3920, 126.9130],
    [37.3900, 126.9105],
    [37.3880, 126.9080],
    [37.3860, 126.9060],
    [37.3840, 126.9040],
  ],
};

/**
 * Interpolate curve between waypoints with smooth Catmull-Rom road-following points
 */
export function interpolateDenseRoadPath(rawWaypoints: [number, number][], targetMinPoints = 25): [number, number][] {
  if (!rawWaypoints || rawWaypoints.length === 0) return [];
  if (rawWaypoints.length >= targetMinPoints) return rawWaypoints;

  const result: [number, number][] = [];

  for (let i = 0; i < rawWaypoints.length - 1; i++) {
    const p0 = i > 0 ? rawWaypoints[i - 1] : rawWaypoints[i];
    const p1 = rawWaypoints[i];
    const p2 = rawWaypoints[i + 1];
    const p3 = i < rawWaypoints.length - 2 ? rawWaypoints[i + 2] : p2;

    const segmentDist = getDistanceKm(p1[0], p1[1], p2[0], p2[1]);
    const steps = Math.max(3, Math.min(12, Math.round(segmentDist * 18)));

    for (let t = 0; t < steps; t++) {
      const s = t / steps;
      // Catmull-Rom Spline Formula
      const s2 = s * s;
      const s3 = s2 * s;

      const lat =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * s +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3);

      const lng =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * s +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3);

      result.push([Math.round(lat * 1000000) / 1000000, Math.round(lng * 1000000) / 1000000]);
    }
  }

  const lastPt = rawWaypoints[rawWaypoints.length - 1];
  result.push([lastPt[0], lastPt[1]]);

  // Deduplicate
  const clean: [number, number][] = [];
  for (const pt of result) {
    if (
      clean.length === 0 ||
      Math.abs(clean[clean.length - 1][0] - pt[0]) > 0.00005 ||
      Math.abs(clean[clean.length - 1][1] - pt[1]) > 0.00005
    ) {
      clean.push(pt);
    }
  }

  return clean;
}

/**
 * Fetch real bicycle route from OSRM Routing API (or fallback to Anyang Network Graph)
 */
export async function calculateRealBikeRoute(
  originCoords: LatLng,
  destCoords: LatLng,
  originName: string,
  destName: string,
  avoidPoint?: LatLng,
  avoidSide: 1 | -1 = 1,
  preferredFilter?: string,
): Promise<RouteResult> {
  const startLat = originCoords.lat;
  const startLng = originCoords.lng;
  const destLat = destCoords.lat;
  const destLng = destCoords.lng;

  // 1. Try OSRM Bicycle Router API (OpenStreetMap real cycleway/road network with 20~80+ coordinates)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    let routePoints = `${startLng},${startLat};${destLng},${destLat}`;
    if (avoidPoint) {
      const directionLat = destLat - startLat;
      const directionLng = destLng - startLng;
      const length = Math.hypot(directionLat, directionLng) || 1;
      const detourOffset = 0.0007;
      const bypassLat = avoidPoint.lat - (directionLng / length) * detourOffset * avoidSide;
      const bypassLng = avoidPoint.lng + (directionLat / length) * detourOffset * avoidSide;
      routePoints = `${startLng},${startLat};${bypassLng},${bypassLat};${destLng},${destLat}`;
    }
    const url = `https://router.project-osrm.org/route/v1/bicycle/${routePoints}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routes = data.routes as any[];
        const wantsRiverRoute = preferredFilter === '경치 좋은' || /하천|천변|수변/.test(destName);
        const osrmRoute = wantsRiverRoute
          ? [...routes].sort((first, second) => {
              const firstPath = first.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
              const secondPath = second.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
              return calculateRoadTypeBreakdown(secondPath).riverPathRatio - calculateRoadTypeBreakdown(firstPath).riverPathRatio;
            })[0]
          : routes[0];
        const rawCoords: [number, number][] = osrmRoute.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        if (rawCoords.length >= 4) {
          const distKm = Math.round((osrmRoute.distance / 1000) * 10) / 10 || 0.5;
          const timeMins = Math.max(3, Math.round(distKm / 15 * 60));
          const calories = Math.round(distKm * 36);

          const navSteps = parseOsrmStepsToNavSteps(
            osrmRoute.legs?.[0]?.steps || [],
            originName,
            destName,
            rawCoords
          );

          const breakdown = calculateRoadTypeBreakdown(rawCoords);

          if (avoidPoint && getPointToPathDistanceMeters(avoidPoint, rawCoords) < 40) {
            console.warn('OSRM route remained too close to the reported segment; using forced bypass fallback.');
          } else {
            return {
            path: rawCoords,
            distanceKm: distKm,
            timeMinutes: timeMins,
            calories,
            navSteps,
            dedicatedBikeRatio: breakdown.dedicatedBikeRatio,
            sharedBikeRatio: breakdown.sharedBikeRatio,
            sidewalkRatio: breakdown.sidewalkRatio,
            riverPathRatio: breakdown.riverPathRatio,
            segregatedRatio: breakdown.segregatedRatio,
            unsegregatedRatio: breakdown.unsegregatedRatio,
            };
          }
        }
      }
    }
  } catch (err) {
    console.info('OSRM router fallback to High-Density Anyang Graph:', err);
  }

  // 2. High-Accuracy Dense Topological Anyang Bike Network Router (Fallback)
  if (avoidPoint) {
    const directionLat = destLat - startLat;
    const directionLng = destLng - startLng;
    const length = Math.hypot(directionLat, directionLng) || 1;
    const detourOffset = 0.0007 * avoidSide;
    const bypassPoint: LatLng = {
      lat: avoidPoint.lat - (directionLng / length) * detourOffset,
      lng: avoidPoint.lng + (directionLat / length) * detourOffset,
    };
    const firstLeg = calculateAnyangDenseRoadRoute(originCoords, bypassPoint, originName, '제보 구간 우회 지점');
    const secondLeg = calculateAnyangDenseRoadRoute(bypassPoint, destCoords, '제보 구간 우회 지점', destName);
    const breakdown = calculateRoadTypeBreakdown([...firstLeg.path, ...secondLeg.path]);

    return {
      path: [...firstLeg.path, ...secondLeg.path.slice(1)],
      distanceKm: Math.round((firstLeg.distanceKm + secondLeg.distanceKm) * 10) / 10,
      timeMinutes: firstLeg.timeMinutes + secondLeg.timeMinutes,
      calories: firstLeg.calories + secondLeg.calories,
      navSteps: [...firstLeg.navSteps.slice(0, -1), ...secondLeg.navSteps],
      dedicatedBikeRatio: breakdown.dedicatedBikeRatio,
      sharedBikeRatio: breakdown.sharedBikeRatio,
      sidewalkRatio: breakdown.sidewalkRatio,
      riverPathRatio: breakdown.riverPathRatio,
      segregatedRatio: breakdown.segregatedRatio,
      unsegregatedRatio: breakdown.unsegregatedRatio,
    };
  }

  return calculateAnyangDenseRoadRoute(originCoords, destCoords, originName, destName);
}

/**
 * Determine dedicated bike path ratio
 */
function checkDedicatedPathRatio(coords: [number, number][]): number {
  if (!coords || coords.length === 0) return 85;
  let streamCloseCount = 0;

  for (const [lat, lng] of coords) {
    let isClose = false;
    for (const stream of OFFICIAL_STREAM_LINES) {
      for (const p of stream.path) {
        if (getDistanceKm(lat, lng, p[0], p[1]) < 0.08) {
          isClose = true;
          break;
        }
      }
      if (isClose) break;
    }
    if (isClose) streamCloseCount++;
  }

  const ratio = Math.round((streamCloseCount / coords.length) * 100);
  return Math.min(96, Math.max(65, ratio + 25));
}

/**
 * Convert OSRM maneuver steps to friendly Korean cycling navigation steps with crosswalk warnings
 */
function parseOsrmStepsToNavSteps(
  steps: any[],
  originName: string,
  destName: string,
  fullPath: [number, number][]
): NavStep[] {
  const result: NavStep[] = [];

  result.push({
    id: 'step-depart',
    iconType: 'up',
    text: `${originName} 출발`,
    sub: '자전거 전용도로 및 안전 주행로 진입',
    distanceMeter: 150,
    instruction: `${originName}에서 출발하여 안전 주행로를 따라 라이딩을 시작하세요.`,
  });

  let stepIdx = 0;
  for (const s of steps) {
    const maneuver = s.maneuver || {};
    const type = maneuver.type;
    const modifier = maneuver.modifier || '';
    const name = s.name || '';
    const dist = Math.round(s.distance || 100);

    if (type === 'depart' || type === 'arrive') continue;
    if (dist < 15 && !modifier.includes('left') && !modifier.includes('right')) continue;

    stepIdx++;
    let iconType: 'up' | 'left' | 'right' | 'u-turn' | 'crosswalk' | 'arrive' = 'up';
    let text = `${dist}m 직진 주행`;
    let sub = name ? `${name} 방면 직진` : '보행자 안전거리 1m 이상 유지 (제한속도 20km/h)';
    let instruction = `${name ? `${name}을(를) 따라 ` : ''}${dist}m 직진 주행하세요.`;

    if (modifier.includes('left')) {
      iconType = 'left';
      text = `${name ? `${name} 방면 ` : ''}좌회전`;
      sub = `${dist}m 이동 후 좌측 도로 진입`;
      instruction = `${name ? `${name} 방면으로 ` : ''}좌회전 후 안전하게 주행하세요.`;
    } else if (modifier.includes('right')) {
      iconType = 'right';
      text = `${name ? `${name} 방면 ` : ''}우회전`;
      sub = `${dist}m 이동 후 우측 도로 진입`;
      instruction = `${name ? `${name} 방면으로 ` : ''}우회전 후 안전하게 주행하세요.`;
    } else if (modifier.includes('uturn')) {
      iconType = 'u-turn';
      text = '유턴 (U-Turn)';
      sub = '반대 방향 안전 회귀';
      instruction = '반대 방향으로 안전하게 유턴하세요.';
    }

    result.push({
      id: `step-turn-${stepIdx}`,
      iconType,
      text,
      sub,
      distanceMeter: dist,
      instruction,
    });
  }

  const matchedCw =
    ANYANG_CROSSWALKS.find(
      (cw) => `${originName} ${destName}`.includes(cw.dong) || `${originName} ${destName}`.includes(cw.dong.replace(/[0-9]/g, ''))
    ) || ANYANG_CROSSWALKS[0];

  if (result.length <= 2) {
    const totalDist = Math.round(getDistanceKm(fullPath[0][0], fullPath[0][1], fullPath[fullPath.length - 1][0], fullPath[fullPath.length - 1][1]) * 1000);
    result.push({
      id: 'step-crosswalk',
      iconType: 'crosswalk',
      text: `${matchedCw.dong} 안전 횡단보도 통과`,
      sub: `${matchedCw.dong} (${matchedCw.roadName || '교차로'}) - 자전거 하차 보행`,
      distanceMeter: 200,
      warn: true,
      instruction: `30m 앞 ${matchedCw.dong} 횡단보도입니다. 자전거에서 내려 안전하게 횡단하세요.`,
      crosswalkInfo: {
        dong: matchedCw.dong,
        widthM: matchedCw.widthM,
        lengthM: matchedCw.lengthM,
        roadName: matchedCw.roadName,
      },
    });

    result.push({
      id: 'step-main-lane',
      iconType: 'up',
      text: '안양 자전거 전용차로 직진 주행',
      sub: '평지 자전거길 (보행자 주의, 20km/h 권장)',
      distanceMeter: Math.max(300, totalDist - 400),
      instruction: '쾌적한 자전거 전용도로를 따라 목적지 방면으로 직진 주행하세요.',
    });
  } else {
    result.splice(1, 0, {
      id: 'step-crosswalk-inserted',
      iconType: 'crosswalk',
      text: `${matchedCw.dong} 횡단보도 통과`,
      sub: `${matchedCw.dong} (${matchedCw.roadName}) - 하차 보행 구간`,
      distanceMeter: 180,
      warn: true,
      instruction: `30m 앞 ${matchedCw.dong} 횡단보도입니다. 자전거에서 내려 안전하게 보행하세요.`,
      crosswalkInfo: {
        dong: matchedCw.dong,
        widthM: matchedCw.widthM,
        lengthM: matchedCw.lengthM,
        roadName: matchedCw.roadName,
      },
    });
  }

  result.push({
    id: 'step-arrive',
    iconType: 'arrive',
    text: `${destName} 도착`,
    sub: '목적지 자전거 거치대 및 안전 주차',
    distanceMeter: 0,
    instruction: `목적지인 ${destName}에 안전하게 도착했습니다. 즐거운 라이딩 되셨기를 바랍니다!`,
  });

  return result;
}

/**
 * High-Density Topological Road Routing in Anyang
 */
export function calculateAnyangDenseRoadRoute(
  originCoords: LatLng,
  destCoords: LatLng,
  originName: string,
  destName: string,
  preferredFilter?: string,
): RouteResult {
  const startLat = originCoords.lat;
  const startLng = originCoords.lng;
  const destLat = destCoords.lat;
  const destLng = destCoords.lng;

  // Find best matching road corridor
  let matchedCorridor: [number, number][] = [];

  // Check if both are along Simin-daero (Beomgye ~ Pyeongchon ~ Indeokwon)
  if (
    (startLat < 37.40 && startLat > 37.385 && startLng > 126.945 && startLng < 126.985) &&
    (destLat < 37.40 && destLat > 37.385 && destLng > 126.945 && destLng < 126.985)
  ) {
    matchedCorridor = ROAD_VECTORS['simin-daero'];
  } else if (
    // Artpark / Samsung stream area
    destName.includes('예술공원') || destName.includes('파빌리온') || originName.includes('예술공원')
  ) {
    matchedCorridor = [...ROAD_VECTORS['anyangcheon-main'].slice(8, 14), ...ROAD_VECTORS['artpark-samsung']];
  } else if (
    // Suamcheon / Byeongmok-an
    destName.includes('병목안') || destName.includes('삼덕') || originName.includes('병목안')
  ) {
    matchedCorridor = [...ROAD_VECTORS['anyangcheon-main'].slice(8, 15), ...ROAD_VECTORS['suamcheon-byeongmok']];
  } else if (
    // Hakui stream area
    destName.includes('학의') || destName.includes('쌍개울') || destName.includes('인덕원교') || destName.includes('동안교')
  ) {
    matchedCorridor = ROAD_VECTORS['haguicheon-main'];
  } else {
    // Keep the fallback on one continuous corridor. Concatenating unrelated
    // vectors creates large jumps that the curve interpolation exaggerates.
    const corridorCandidates = [
      ROAD_VECTORS['simin-daero'],
      ROAD_VECTORS['pyeongchon-daero'],
      ROAD_VECTORS['gwanak-daero'],
      ROAD_VECTORS['anyang-manan-ro'],
      ROAD_VECTORS['anyangcheon-main'],
      ROAD_VECTORS['haguicheon-main'],
    ];
    matchedCorridor = corridorCandidates.reduce((best, corridor) => {
      const startDistance = Math.min(...corridor.map((point) => getDistanceKm(startLat, startLng, point[0], point[1])));
      const endDistance = Math.min(...corridor.map((point) => getDistanceKm(destLat, destLng, point[0], point[1])));
      const bestStartDistance = Math.min(...best.map((point) => getDistanceKm(startLat, startLng, point[0], point[1])));
      const bestEndDistance = Math.min(...best.map((point) => getDistanceKm(destLat, destLng, point[0], point[1])));
      const riverBonus = preferredFilter === '경치 좋은' ? calculateRoadTypeBreakdown(corridor).riverPathRatio / 100 : 0;
      const bestRiverBonus = preferredFilter === '경치 좋은' ? calculateRoadTypeBreakdown(best).riverPathRatio / 100 : 0;
      return startDistance + endDistance - riverBonus * 0.5 < bestStartDistance + bestEndDistance - bestRiverBonus * 0.5
        ? corridor
        : best;
    });
  }

  // Slice corridor closest to origin and destination
  let startIdx = 0;
  let minStartD = Infinity;
  let endIdx = matchedCorridor.length - 1;
  let minEndD = Infinity;

  matchedCorridor.forEach((pt, idx) => {
    const d1 = getDistanceKm(startLat, startLng, pt[0], pt[1]);
    if (d1 < minStartD) {
      minStartD = d1;
      startIdx = idx;
    }
    const d2 = getDistanceKm(destLat, destLng, pt[0], pt[1]);
    if (d2 < minEndD) {
      minEndD = d2;
      endIdx = idx;
    }
  });

  const waypointList: [number, number][] = [[startLat, startLng]];

  if (startIdx <= endIdx) {
    for (let i = startIdx; i <= endIdx; i++) {
      waypointList.push(matchedCorridor[i]);
    }
  } else {
    for (let i = startIdx; i >= endIdx; i--) {
      waypointList.push(matchedCorridor[i]);
    }
  }

  waypointList.push([destLat, destLng]);

  // Generate dense, smooth road-following curve (25~50+ coordinates)
  const densePath = interpolateDenseRoadPath(waypointList, 30);

  let totalDistKm = 0;
  for (let i = 0; i < densePath.length - 1; i++) {
    totalDistKm += getDistanceKm(densePath[i][0], densePath[i][1], densePath[i + 1][0], densePath[i + 1][1]);
  }
  totalDistKm = Math.round((totalDistKm < 0.6 ? 1.0 : totalDistKm) * 10) / 10;
  const timeMinutes = Math.max(4, Math.round((totalDistKm / 15) * 60));
  const calories = Math.round(totalDistKm * 36);

  const matchedCw =
    ANYANG_CROSSWALKS.find(
      (cw) => `${originName} ${destName}`.includes(cw.dong) || `${originName} ${destName}`.includes(cw.dong.replace(/[0-9]/g, ''))
    ) || ANYANG_CROSSWALKS[0];

  const navSteps: NavStep[] = [
    {
      id: 'step-start',
      iconType: 'up',
      text: `${originName} 출발`,
      sub: '안양 자전거 전용도로 진입',
      distanceMeter: 150,
      instruction: `${originName}에서 출발하여 안전 자전거 주행로로 진입하세요.`,
    },
    {
      id: 'step-crosswalk',
      iconType: 'crosswalk',
      text: `${matchedCw.dong} 횡단보도 통과`,
      sub: `${matchedCw.dong} (${matchedCw.roadName || '주요 교차로'}) - 하차 보행 구간`,
      distanceMeter: 180,
      warn: true,
      instruction: `30m 앞 ${matchedCw.dong} 횡단보도입니다. 자전거에서 내려 안전하게 횡단하세요.`,
      crosswalkInfo: {
        dong: matchedCw.dong,
        widthM: matchedCw.widthM,
        lengthM: matchedCw.lengthM,
        roadName: matchedCw.roadName,
      },
    },
    {
      id: 'step-mid',
      iconType: 'up',
      text: `${destName} 방면 전용도로 직진 주행`,
      sub: '보행자 안전거리 1m 이상 유지 (제한속도 20km/h)',
      distanceMeter: Math.max(300, Math.round(totalDistKm * 1000 - 330)),
      instruction: `${destName} 방면으로 쾌적하게 직진 주행하세요.`,
    },
    {
      id: 'step-arrive',
      iconType: 'arrive',
      text: `${destName} 도착`,
      sub: '목적지 자전거 거치대 및 안전 주차',
      distanceMeter: 0,
      instruction: `목적지인 ${destName}에 안전하게 도착했습니다. 즐거운 라이딩 되세요!`,
    },
  ];

  const breakdown = calculateRoadTypeBreakdown(densePath);

  return {
    path: densePath,
    distanceKm: totalDistKm,
    timeMinutes,
    calories,
    navSteps,
    dedicatedBikeRatio: breakdown.dedicatedBikeRatio,
    sharedBikeRatio: breakdown.sharedBikeRatio,
    sidewalkRatio: breakdown.sidewalkRatio,
    riverPathRatio: breakdown.riverPathRatio,
    segregatedRatio: breakdown.segregatedRatio,
    unsegregatedRatio: breakdown.unsegregatedRatio,
  };
}
