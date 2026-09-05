// GPS & Geolocation Helper Utility
// Provides robust 2-stage location acquisition (High Accuracy GPS -> Network/Wi-Fi Fallback)
// with permission monitoring, status reporting, and Anyang hub presets.

export type GpsStatus = 'idle' | 'searching' | 'active' | 'denied' | 'timeout' | 'unavailable' | 'error';

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  isHighAccuracy: boolean;
  timestamp: number;
  provider: 'gps' | 'network' | 'manual' | 'preset';
}

export interface GpsHubPreset {
  id: string;
  name: string;
  desc: string;
  lat: number;
  lng: number;
  address: string;
  badge: string;
}

export const ANYANG_GPS_PRESETS: GpsHubPreset[] = [
  {
    id: 'hub-ssanggaeul',
    name: '안양천 쌍개울 광장',
    desc: '안양천·학의천 합수부 라이더 공식 쉼터',
    lat: 37.3912,
    lng: 126.9388,
    address: '경기도 안양시 만안구 안양동 (쌍개울 합수부)',
    badge: '중앙 거점',
  },
  {
    id: 'hub-beomgye',
    name: '범계역 로데오 (동안구)',
    desc: '4호선 범계역 2번 출구 / 평촌 1번가',
    lat: 37.3900,
    lng: 126.9520,
    address: '경기도 안양시 동안구 시민대로 (범계역)',
    badge: '동안구 중심',
  },
  {
    id: 'hub-anyang-station',
    name: '안양역 1번 출구 (만안구)',
    desc: '1호선 안양역 / 안양 1번가 및 지하상가',
    lat: 37.4015,
    lng: 126.9230,
    address: '경기도 안양시 만안구 만안로 (안양역)',
    badge: '만안구 중심',
  },
  {
    id: 'hub-central-park',
    name: '평촌중앙공원',
    desc: '분수대 잔디마당 / 안양 3경',
    lat: 37.3908,
    lng: 126.9575,
    address: '경기도 안양시 동안구 관평로 149',
    badge: '공원 나들이',
  },
  {
    id: 'hub-art-park',
    name: '안양예술공원 입구',
    desc: '삼성천 계곡 / APAP 예술공원 / 안양 1경',
    lat: 37.4278,
    lng: 126.9272,
    address: '경기도 안양시 만안구 예술공원로 일대',
    badge: '예술·계곡',
  },
  {
    id: 'hub-indeogwon',
    name: '인덕원역 수변길',
    desc: '학의천 상류 / 4호선 인덕원역',
    lat: 37.4018,
    lng: 126.9765,
    address: '경기도 안양시 동안구 관악대로 (인덕원역)',
    badge: '학의천 상류',
  },
  {
    id: 'hub-chunghun',
    name: '충훈교 / 석수하류',
    desc: '충훈 벚꽃길 / 광명·한강 방향 안양천 하류',
    lat: 37.4140,
    lng: 126.9050,
    address: '경기도 안양시 만안구 석수동 (충훈교)',
    badge: '하류 벚꽃길',
  },
  {
    id: 'hub-byeongmokan',
    name: '병목안 시민공원',
    desc: '인공폭포 / 수리산 캠핑장 / 안양 8경',
    lat: 37.3872,
    lng: 126.9145,
    address: '경기도 안양시 만안구 병목안로 215',
    badge: '수리산 자락',
  },
];

/**
 * Checks if the app is currently running inside an iframe (e.g. preview environment)
 */
export function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Safely inspects current Geolocation permission status
 */
export async function getGeolocationPermissionState(): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

/**
 * 2-Stage Robust Geolocation Acquisition:
 * 1. High Accuracy (Hardware GPS/Sensors) with 7s timeout
 * 2. Network/Wi-Fi Fallback with 12s timeout if GPS times out
 * 3. Catches and explicitly differentiates PERMISSION_DENIED
 */
export async function getRobustCurrentPosition(
  onProgress?: (stage: 'high-accuracy' | 'network-fallback', message: string) => void
): Promise<LocationResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('BROWSER_NOT_SUPPORTED');
  }

  const querySingle = (options: PositionOptions, isHigh: boolean): Promise<LocationResult> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            isHighAccuracy: isHigh,
            timestamp: pos.timestamp || Date.now(),
            provider: isHigh ? 'gps' : 'network',
          });
        },
        (err) => reject(err),
        options
      );
    });
  };

  // Stage 1: Try Hardware High Accuracy
  onProgress?.('high-accuracy', '위성 GPS 정밀 위치 탐색 중...');
  try {
    const highResult = await querySingle(
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 },
      true
    );
    return highResult;
  } catch (err: any) {
    // If user explicitly clicked Block / Denied, throw PERMISSION_DENIED immediately
    if (err && err.code === 1) {
      throw new Error('PERMISSION_DENIED');
    }

    // Stage 2: Fallback to Network/Wi-Fi Location (works indoors, on laptops, and in dense areas)
    onProgress?.('network-fallback', 'Wi-Fi 및 통신망 기반 위치로 보정 중...');
    try {
      const netResult = await querySingle(
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 },
        false
      );
      return netResult;
    } catch (fallbackErr: any) {
      if (fallbackErr && fallbackErr.code === 1) {
        throw new Error('PERMISSION_DENIED');
      }
      if (fallbackErr && fallbackErr.code === 3) {
        throw new Error('TIMEOUT');
      }
      throw new Error('POSITION_UNAVAILABLE');
    }
  }
}

/**
 * Continuous GPS Watch with resilient fallback
 */
export function startRobustGpsWatch(
  onSuccess: (result: LocationResult) => void,
  onError: (errorType: 'PERMISSION_DENIED' | 'TIMEOUT' | 'UNAVAILABLE', err: any) => void
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError('UNAVAILABLE', new Error('Not supported'));
    return () => {};
  }

  let watchId: number | null = null;
  let isUsingHighAccuracy = true;
  let consecutiveTimeouts = 0;

  const launchWatch = (high: boolean) => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    isUsingHighAccuracy = high;

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          consecutiveTimeouts = 0;
          onSuccess({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            isHighAccuracy: high,
            timestamp: pos.timestamp || Date.now(),
            provider: high ? 'gps' : 'network',
          });
        },
        (err) => {
          if (err.code === 1) {
            onError('PERMISSION_DENIED', err);
          } else if (err.code === 3) {
            consecutiveTimeouts++;
            if (high && consecutiveTimeouts >= 2) {
              console.warn('GPS watch high accuracy timed out twice, falling back to standard accuracy.');
              launchWatch(false);
            } else {
              onError('TIMEOUT', err);
            }
          } else {
            onError('UNAVAILABLE', err);
          }
        },
        {
          enableHighAccuracy: high,
          maximumAge: high ? 2500 : 8000,
          timeout: high ? 12000 : 18000,
        }
      );
    } catch (e) {
      onError('UNAVAILABLE', e);
    }
  };

  launchWatch(true);

  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  };
}
