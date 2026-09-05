import { Course, LatLng, FilterCategory, Facility, NavStep, RouteType } from '../types';
import { ANYANG_CROSSWALKS } from '../data/crosswalkData';
import { OFFICIAL_STREAM_LINES } from '../data/courses';

// Network junction points for multi-stream transitions
const JUNCTIONS = {
  ssanggaeul: [37.39557, 126.93994] as [number, number], // Anyang stream & Hagui stream (Bisan bridge)
  chunhun: [37.40916, 126.91301] as [number, number],    // Anyang stream & Samseong stream (Anyang bridge)
  seoksu: [37.41296, 126.91323] as [number, number],     // Anyang stream & Sammak stream
  hagun: [37.39856, 126.94547] as [number, number],      // Hagui stream & Pyeongchon line (Hagun bridge)
};

/**
 * Finds the nearest point on any official bike line to a given coordinate.
 */
function findNearestBikeNode(coord: LatLng) {
  let minDistance = Infinity;
  let bestStreamId = '';
  let bestPointIndex = -1;
  let bestPoint: [number, number] = [coord.lat, coord.lng];

  for (const stream of OFFICIAL_STREAM_LINES) {
    for (let i = 0; i < stream.path.length; i++) {
      const pt = stream.path[i];
      const d = getDistanceKm(coord.lat, coord.lng, pt[0], pt[1]);
      if (d < minDistance) {
        minDistance = d;
        bestStreamId = stream.id;
        bestPointIndex = i;
        bestPoint = pt;
      }
    }
  }

  return { minDistance, bestStreamId, bestPointIndex, bestPoint };
}

/**
 * Generates a realistic bike path that snaps to the official Anyang bike paths
 * rather than cutting through buildings in a straight line.
 */
export function generateSmartBikeRoutePath(
  startCoords: LatLng,
  destCoords: LatLng
): [number, number][] {
  const directDist = getDistanceKm(startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng);
  if (directDist < 0.15) {
    return [
      [startCoords.lat, startCoords.lng],
      [destCoords.lat, destCoords.lng],
    ];
  }

  const startNode = findNearestBikeNode(startCoords);
  const destNode = findNearestBikeNode(destCoords);

  // If both are accessible to the bike paths (< 2.0km from stream network)
  if (startNode.minDistance < 2.0 && destNode.minDistance < 2.0) {
    // 1. Same stream line: use the exact curve path segment
    if (startNode.bestStreamId === destNode.bestStreamId) {
      const stream = OFFICIAL_STREAM_LINES.find((s) => s.id === startNode.bestStreamId);
      if (stream) {
        const subPath: [number, number][] = [];
        const startIdx = startNode.bestPointIndex;
        const endIdx = destNode.bestPointIndex;

        if (startIdx <= endIdx) {
          for (let i = startIdx; i <= endIdx; i++) {
            subPath.push(stream.path[i]);
          }
        } else {
          for (let i = startIdx; i >= endIdx; i--) {
            subPath.push(stream.path[i]);
          }
        }

        return [
          [startCoords.lat, startCoords.lng],
          ...subPath,
          [destCoords.lat, destCoords.lng],
        ];
      }
    }

    // 2. Different stream lines: connect via junction
    const stream1 = OFFICIAL_STREAM_LINES.find((s) => s.id === startNode.bestStreamId);
    const stream2 = OFFICIAL_STREAM_LINES.find((s) => s.id === destNode.bestStreamId);

    if (stream1 && stream2) {
      // Pick matching junction
      let junction = JUNCTIONS.ssanggaeul;
      if (stream1.id === 'stream-samseong' || stream2.id === 'stream-samseong') {
        junction = JUNCTIONS.chunhun;
      } else if (stream1.id === 'stream-sammak' || stream2.id === 'stream-sammak') {
        junction = JUNCTIONS.seoksu;
      } else if (stream1.id === 'urban-simin' || stream2.id === 'urban-simin') {
        junction = JUNCTIONS.hagun;
      }

      // Find nearest index on stream1 to junction
      let s1JuncIdx = 0;
      let minD1 = Infinity;
      stream1.path.forEach((pt, idx) => {
        const d = getDistanceKm(pt[0], pt[1], junction[0], junction[1]);
        if (d < minD1) {
          minD1 = d;
          s1JuncIdx = idx;
        }
      });

      // Find nearest index on stream2 to junction
      let s2JuncIdx = 0;
      let minD2 = Infinity;
      stream2.path.forEach((pt, idx) => {
        const d = getDistanceKm(pt[0], pt[1], junction[0], junction[1]);
        if (d < minD2) {
          minD2 = d;
          s2JuncIdx = idx;
        }
      });

      const path1: [number, number][] = [];
      const s1Start = startNode.bestPointIndex;
      if (s1Start <= s1JuncIdx) {
        for (let i = s1Start; i <= s1JuncIdx; i++) path1.push(stream1.path[i]);
      } else {
        for (let i = s1Start; i >= s1JuncIdx; i--) path1.push(stream1.path[i]);
      }

      const path2: [number, number][] = [];
      const s2End = destNode.bestPointIndex;
      if (s2JuncIdx <= s2End) {
        for (let i = s2JuncIdx; i <= s2End; i++) path2.push(stream2.path[i]);
      } else {
        for (let i = s2JuncIdx; i >= s2End; i--) path2.push(stream2.path[i]);
      }

      return [
        [startCoords.lat, startCoords.lng],
        ...path1,
        ...path2,
        [destCoords.lat, destCoords.lng],
      ];
    }
  }

  // 3. Urban street grid follow (L-shape waypoint to follow roads rather than cutting through buildings)
  const midLat = startCoords.lat;
  const midLng = destCoords.lng;
  return [
    [startCoords.lat, startCoords.lng],
    [startCoords.lat + (midLat - startCoords.lat) * 0.4, startCoords.lng],
    [midLat, midLng],
    [destCoords.lat, midLng + (destCoords.lng - midLng) * 0.4],
    [destCoords.lat, destCoords.lng],
  ];
}

export function generateTurnByTurnSteps(
  fullPath: (LatLng | [number, number])[],
  remainingPath: (LatLng | [number, number])[],
  destinationName: string = '목적지',
  crosswalksMap?: Record<string, any>
): NavStep[] {
  const steps: NavStep[] = [];
  const remCount = remainingPath?.length || 0;

  if (remCount <= 1) {
    return [
      {
        iconType: 'arrive',
        distanceMeter: 0,
        text: `${destinationName} 도착`,
        sub: '안내를 종료합니다',
        instruction: `${destinationName}에 도착했습니다. 안전하게 정차하세요.`,
        turnType: 'straight',
      },
    ];
  }

  // Next immediate action
  steps.push({
    iconType: 'up',
    distanceMeter: 150,
    text: '하천변 자전거전용도로 직진',
    sub: '안전속도 시속 20km 이하 유지',
    instruction: '하천변 자전거전용도로를 따라 직진하세요.',
    turnType: 'straight',
  });

  // Crosswalk warning step if applicable
  if (crosswalksMap && Object.keys(crosswalksMap).length > 0) {
    const firstCw = Object.values(crosswalksMap)[0];
    steps.push({
      iconType: 'crosswalk',
      distanceMeter: 350,
      text: `${firstCw?.name || '자전거 횡단도'} 통과`,
      sub: '자전거 하차 보행 권고 구간',
      instruction: '전방에 횡단보도가 있습니다. 서행하거나 자전거에서 내려 안전하게 건너세요.',
      warn: true,
      turnType: 'straight',
      crosswalkInfo: firstCw,
    });
  }

  // Midpoint guidance
  steps.push({
    iconType: 'right',
    distanceMeter: 800,
    text: '쌍개울·학의천 합류부 방면 우측 주행',
    sub: '수변 힐링 전용 자전거길',
    instruction: '우측 자전거 전용 진입로를 따라 주행하세요.',
    turnType: 'right',
  });

  // Final arrival step
  steps.push({
    iconType: 'arrive',
    distanceMeter: 0,
    text: `${destinationName} 도착`,
    sub: '목적지 전방 도착',
    instruction: `${destinationName}에 도착했습니다. 수고하셨습니다!`,
    turnType: 'straight',
  });

  return steps;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function getCalculatedArrivalTime(durationMinutes: number, departureTimeStr?: string): string {
  let h: number;
  let m: number;

  if (departureTimeStr && departureTimeStr.includes(':')) {
    const parts = departureTimeStr.split(':').map(Number);
    h = parts[0] || 0;
    m = parts[1] || 0;
  } else {
    const now = new Date();
    h = now.getHours();
    m = now.getMinutes();
  }

  const total = h * 60 + m + durationMinutes;
  const arrH = Math.floor(total / 60) % 24;
  const arrM = total % 60;
  return `${arrH.toString().padStart(2, '0')}:${arrM.toString().padStart(2, '0')}`;
}

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function createFacilityOptimalRoute(
  startCoords: LatLng,
  originName: string,
  facility: Facility
): Course {
  const destCoords: LatLng = { lat: facility.lat, lng: facility.lng };
  const distKm = Math.round(getDistanceKm(startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng) * 10) / 10;
  const timeMinutes = Math.max(4, Math.round((distKm / 15) * 60));

  const generatedPath = generateSmartBikeRoutePath(startCoords, destCoords);

  const curTime = getCurrentTimeString();
  const arrival = getCalculatedArrivalTime(timeMinutes, curTime);

  return {
    id: `fac-route-${facility.id}`,
    name: `${facility.name} 직통 경로`,
    tag: '단거리',
    badge: '편의시설 직통',
    categoryTitle: '편의시설 길찾기',
    distance: `${distKm}km`,
    distanceKm: distKm,
    time: `${timeMinutes}분`,
    timeMinutes,
    slope: '0.5% (완만)',
    calories: Math.round(distKm * 35),
    stairs: 0,
    arrival,
    bikePath: 90,
    road: 8,
    sidewalk: 2,
    dedicatedBikeRatio: 90,
    sharedBikeRatio: 8,
    sidewalkRatio: 2,
    riverPathRatio: 82,
    segregatedRatio: 14,
    unsegregatedRatio: 4,
    description: `${originName}에서 ${facility.name}(으)로 향하는 최적 자전거 도로 안내 경로입니다.`,
    startPoint: originName,
    endPoint: facility.name,
    path: generatedPath,
    navSteps: [
      {
        iconType: 'up',
        distanceMeter: 200,
        text: `${originName}에서 출발`,
        sub: '자전거 전용도로 접속',
        instruction: '자전거도로를 따라 출발하세요.',
      },
      {
        iconType: 'right',
        distanceMeter: Math.round((distKm * 1000) / 2),
        text: `${facility.categoryName} 방향 이동`,
        sub: `${facility.roadAddress || facility.address} 방면`,
        instruction: '목적지 방향으로 안전하게 주행하세요.',
      },
      {
        iconType: 'arrive',
        distanceMeter: 0,
        text: `${facility.name} 도착`,
        sub: facility.description,
        instruction: `${facility.name}에 도착했습니다.`,
      },
    ],
  };
}

export function createCustomOptimalRoute(
  origin: string,
  startCoords: LatLng,
  destination: string,
  destCoords: LatLng,
  routeType: RouteType = 'oneway',
  preferredFilter?: FilterCategory
): Course {
  const distKm = Math.round(getDistanceKm(startCoords.lat, startCoords.lng, destCoords.lat, destCoords.lng) * 10) / 10;
  const finalDistanceKm = routeType === 'roundtrip' ? Math.round(distKm * 2 * 10) / 10 : Math.max(1.2, distKm);
  const timeMinutes = Math.max(5, Math.round((finalDistanceKm / 16) * 60));

  let generatedPath = generateSmartBikeRoutePath(startCoords, destCoords);

  if (routeType === 'roundtrip') {
    const returnPath = [...generatedPath].reverse().slice(1);
    generatedPath = [...generatedPath, ...returnPath];
  }

  const curTime = getCurrentTimeString();
  const arrival = getCalculatedArrivalTime(timeMinutes, curTime);

  return {
    id: `custom-route-${Date.now()}`,
    name: `${origin.split(' ')[0]} ➔ ${destination} (${routeType === 'roundtrip' ? '왕복' : '편도'})`,
    tag: preferredFilter || '추천 코스',
    badge: routeType === 'roundtrip' ? '왕복 최적' : '맞춤 최적',
    categoryTitle: '실시간 맞춤 경로',
    distance: `${finalDistanceKm}km`,
    distanceKm: finalDistanceKm,
    time: `${timeMinutes}분`,
    timeMinutes,
    slope: '0.7% (평탄)',
    calories: Math.round(finalDistanceKm * 36),
    stairs: 0,
    arrival,
    bikePath: 91,
    road: 7,
    sidewalk: 2,
    dedicatedBikeRatio: 91,
    sharedBikeRatio: 7,
    sidewalkRatio: 2,
    riverPathRatio: 86,
    segregatedRatio: 10,
    unsegregatedRatio: 4,
    description: `${origin}에서 ${destination}까지 안양시 자전거 전용도로 우선 배정 최적 경로입니다.`,
    startPoint: origin,
    endPoint: destination,
    path: generatedPath,
    navSteps: [
      {
        iconType: 'up',
        distanceMeter: 300,
        text: `${origin}에서 자전거 전용도로 진입`,
        sub: '수변 및 분리형 자전거도로 우선 주행',
        instruction: `${origin}에서 직진하여 자전거 전용도로로 진입하세요.`,
      },
      {
        iconType: 'crosswalk',
        distanceMeter: 450,
        text: '접속 교차로 횡단보도 통과',
        sub: '자전거 하차 보행 구간 (안양시 실측 안전 규격)',
        instruction: '횡단보도에서는 자전거에서 내려 보행자로 건너세요.',
        warn: true,
        crosswalkInfo: ANYANG_CROSSWALKS['cw-bisan-1'],
      },
      {
        iconType: 'right',
        distanceMeter: 1200,
        text: `${destination} 방면 하천 전용로 직진`,
        sub: '신호등 없는 쾌속 자전거길',
        instruction: `${destination} 방향으로 안전하게 주행하세요.`,
      },
      {
        iconType: 'arrive',
        distanceMeter: 0,
        text: `${destination} 도착`,
        sub: '안내를 종료합니다',
        instruction: `${destination}에 도착했습니다. 수고하셨습니다!`,
      },
    ],
  };
}

export function createLoopRouteByDistance(
  origin: string,
  startCoords: LatLng,
  targetDistanceKm: number
): Course {
  const distKm = targetDistanceKm;
  const timeMinutes = Math.round((distKm / 15) * 60);

  const radiusLat = (distKm / 2) * 0.008;
  const radiusLng = (distKm / 2) * 0.01;

  const loopPointsCount = 14;
  const generatedPath: [number, number][] = [];

  for (let i = 0; i <= loopPointsCount; i++) {
    const angle = (i / loopPointsCount) * 2 * Math.PI;
    const lat = startCoords.lat + radiusLat * Math.sin(angle);
    const lng = startCoords.lng + radiusLng * (1 - Math.cos(angle));
    generatedPath.push([lat, lng]);
  }

  const curTime = getCurrentTimeString();
  const arrival = getCalculatedArrivalTime(timeMinutes, curTime);

  return {
    id: `loop-route-${Date.now()}`,
    name: `${origin.split(' ')[0]} AI ${distKm}km 힐링 순환 코스`,
    tag: '추천 코스',
    badge: `AI ${distKm}km 순환`,
    categoryTitle: '거리 맞춤 순환로',
    distance: `${distKm}km`,
    distanceKm: distKm,
    time: `${timeMinutes}분`,
    timeMinutes,
    slope: '0.4% (완전 평지)',
    calories: Math.round(distKm * 38),
    stairs: 0,
    arrival,
    bikePath: 96,
    road: 4,
    sidewalk: 0,
    dedicatedBikeRatio: 96,
    sharedBikeRatio: 4,
    sidewalkRatio: 0,
    riverPathRatio: 94,
    segregatedRatio: 6,
    unsegregatedRatio: 0,
    description: `${origin}에서 출발하여 원하는 거리(${distKm}km)만큼 수변 전용도로를 순환하여 원점으로 돌아오는 AI 자동 생성 코스입니다.`,
    startPoint: origin,
    endPoint: `${origin} (원점회귀)`,
    path: generatedPath,
    navSteps: [
      {
        iconType: 'up',
        distanceMeter: 500,
        text: '출발지에서 안양천·학의천 수변 순환로 진입',
        sub: '100% 무장애 평지 전용도로',
        instruction: '수변 자전거 순환로를 따라 직진하세요.',
      },
      {
        iconType: 'right',
        distanceMeter: Math.round((distKm * 1000) / 2),
        text: '반환 지점 통과 후 반대편 수변로 합류',
        sub: '원점 회귀 방향 주행',
        instruction: '반환 지점을 통과하여 원점 방향으로 주행하세요.',
      },
      {
        iconType: 'arrive',
        distanceMeter: 0,
        text: `${origin} 출발지 원점 회귀 완료`,
        sub: `총 ${distKm}km 순환 완료`,
        instruction: '출발지에 무사히 도착했습니다. 수고하셨습니다!',
      },
    ],
  };
}

export async function fetchCustomOptimalRouteAsync(
  origin: string,
  startCoords: LatLng,
  destination: string,
  destCoords: LatLng,
  routeType: RouteType = 'oneway',
  preferredFilter?: FilterCategory,
  avoidPoint?: { lat: number; lng: number },
  detourBias: number = 0
): Promise<Course> {
  // OSRM bicycle/car router API for real road coordinates fallback
  try {
    let url = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true`;
    if (avoidPoint && detourBias !== 0) {
      // Add a slight detour waypoint to avoid obstacle
      const detourLat = avoidPoint.lat + (detourBias > 0 ? 0.003 : -0.003);
      const detourLng = avoidPoint.lng + (detourBias > 0 ? 0.003 : -0.003);
      url = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${detourLng},${detourLat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Routing service error');
    }
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates;
      let pathCoords: [number, number][] = coordinates.map((c: [number, number]) => [c[1], c[0]]);

      const osrmDistKm = Math.round((route.distance / 1000) * 10) / 10;
      const finalDistKm = routeType === 'roundtrip' ? Math.round(osrmDistKm * 2 * 10) / 10 : osrmDistKm;
      const finalTimeMin = Math.max(5, Math.round((finalDistKm / 16) * 60));

      if (routeType === 'roundtrip') {
        const reversePath = [...pathCoords].reverse();
        pathCoords = [...pathCoords, ...reversePath];
      }

      const curTime = getCurrentTimeString();
      const arrival = getCalculatedArrivalTime(finalTimeMin, curTime);

      const navSteps: NavStep[] = (route.legs[0]?.steps || []).map((step: any, idx: number) => {
        let iconType: NavStep['iconType'] = 'up';
        const type = step.maneuver?.type;
        const modifier = step.maneuver?.modifier;

        if (type === 'arrive') iconType = 'arrive';
        else if (modifier?.includes('left')) iconType = 'left';
        else if (modifier?.includes('right')) iconType = 'right';
        else if (modifier?.includes('u-turn')) iconType = 'u-turn';

        return {
          iconType,
          distanceMeter: Math.round(step.distance),
          text: step.name || `${idx + 1}구간 직진`,
          sub: `${Math.round(step.distance)}m 이동`,
          instruction: `${step.name || '자전거길'} 방향으로 주행하세요.`,
        };
      });

      if (navSteps.length === 0) {
        navSteps.push({
          iconType: 'up',
          distanceMeter: 300,
          text: '자전거 전용도로 직진',
          sub: '최적 경로 주행',
        });
      }

      return {
        id: `osrm-route-${Date.now()}`,
        name: `${origin.split(' ')[0]} ➔ ${destination} (${routeType === 'roundtrip' ? '왕복' : '편도'})`,
        tag: preferredFilter || '추천 코스',
        badge: routeType === 'roundtrip' ? '실제 도로 왕복' : '실제 도로 최적',
        categoryTitle: '실시간 실제 도로망',
        distance: `${finalDistKm}km`,
        distanceKm: finalDistKm,
        time: `${finalTimeMin}분`,
        timeMinutes: finalTimeMin,
        slope: '0.6% (완만)',
        calories: Math.round(finalDistKm * 36),
        stairs: 0,
        arrival,
        bikePath: 93,
        road: 5,
        sidewalk: 2,
        dedicatedBikeRatio: 93,
        sharedBikeRatio: 5,
        sidewalkRatio: 2,
        riverPathRatio: 88,
        segregatedRatio: 8,
        unsegregatedRatio: 4,
        description: `${origin}에서 ${destination}까지 실제 도로망과 자전거 네트워크를 연결한 고정밀 실시간 경로입니다.`,
        startPoint: origin,
        endPoint: destination,
        path: pathCoords,
        navSteps,
      };
    }
  } catch (err) {
    console.warn('Real road routing fallback to generated route:', err);
  }

  return createCustomOptimalRoute(origin, startCoords, destination, destCoords, routeType, preferredFilter);
}
