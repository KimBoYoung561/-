export interface PlaceSearchResult {
  id: string;
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string;
  y: string;
  category_name?: string;
  phone?: string;
}

const KAKAO_MAP_KEY = 'c4d1b687ae75d00ca6539a5e7c241fca';

let kakaoMapsPromise: Promise<boolean> | null = null;

export function loadKakaoMapsServices(): Promise<boolean> {
  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise((resolve) => {
    const kakao = (window as any).kakao;
    if (kakao?.maps) {
      if (kakao.maps.services) {
        resolve(true);
        return;
      }
      kakao.maps.load(() => resolve(true));
      return;
    }

    // If script is already in document
    const existingScript = document.getElementById('kakao-maps-sdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'kakao-maps-sdk';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services,clusterer&autoload=false`;
      script.onload = () => {
        const k = (window as any).kakao;
        if (k?.maps) {
          k.maps.load(() => resolve(true));
        } else {
          resolve(false);
        }
      };
      script.onerror = (err) => {
        console.warn('Failed to load Kakao Maps SDK:', err);
        resolve(false);
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => {
        const k = (window as any).kakao;
        if (k?.maps) {
          k.maps.load(() => resolve(true));
        } else {
          resolve(false);
        }
      });
    }
  });

  return kakaoMapsPromise;
}

export async function searchKakaoPlaces(keyword: string): Promise<PlaceSearchResult[]> {
  if (!keyword || !keyword.trim()) return [];

  const kakao = (window as any).kakao;
  if (!kakao?.maps?.services?.Places) {
    return [];
  }

  return new Promise((resolve) => {
    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(
      keyword,
      (data: any[], status: any) => {
        if (status === kakao.maps.services.Status.OK) {
          resolve(data as PlaceSearchResult[]);
        } else {
          resolve([]);
        }
      },
      {
        location: new kakao.maps.LatLng(37.3943, 126.9568), // Anyang focus
        radius: 15000,
      }
    );
  });
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export function refineFacilitySearchKeyword(name: string): { original: string; searchKeyword: string; detail: string } {
  let searchKeyword = name;
  let detail = '';
  if (name.includes('(')) {
    const parts = name.split('(');
    searchKeyword = parts[0].trim();
    detail = parts[1].replace(')', '').trim();
  }
  return { original: name, searchKeyword, detail };
}

export async function geocodeFacilityLocation(
  keyword: string,
  address?: string,
  _isPrecise?: boolean
): Promise<Coordinates | null> {
  const kakao = (window as any).kakao;
  if (!kakao?.maps?.services) return null;

  if (address && kakao.maps.services.Geocoder) {
    const coord = await new Promise<Coordinates | null>((resolve) => {
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (result: any[], status: any) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
        } else {
          resolve(null);
        }
      });
    });
    if (coord) return coord;
  }

  if (keyword && kakao.maps.services.Places) {
    const coord = await new Promise<Coordinates | null>((resolve) => {
      const places = new kakao.maps.services.Places();
      places.keywordSearch(
        keyword,
        (result: any[], status: any) => {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
          } else {
            resolve(null);
          }
        },
        { location: new kakao.maps.LatLng(37.3943, 126.9568), radius: 15000 }
      );
    });
    if (coord) return coord;
  }

  return null;
}

export async function coordToAddress(lat: number, lng: number): Promise<string> {
  // 1. Ensure Kakao Maps services SDK is loaded
  await loadKakaoMapsServices().catch(() => false);

  const kakao = (window as any).kakao;
  if (kakao?.maps?.services?.Geocoder) {
    try {
      const addressFromKakao = await new Promise<string | null>((resolve) => {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, (result: any[], status: any) => {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            const road = result[0].road_address?.address_name;
            const jibun = result[0].address?.address_name;
            resolve(road || jibun || null);
          } else {
            // Try region code (행정동 / 법정동)
            geocoder.coord2RegionCode(lng, lat, (regResult: any[], regStatus: any) => {
              if (regStatus === kakao.maps.services.Status.OK && regResult.length > 0) {
                // Prefer 'H' (행정동) or 'B' (법정동)
                const dong = regResult.find((r) => r.region_type === 'H') || regResult[0];
                resolve(dong?.address_name || null);
              } else {
                resolve(null);
              }
            });
          }
        });
      });

      if (addressFromKakao && addressFromKakao.trim()) {
        return addressFromKakao;
      }
    } catch (e) {
      console.warn('Kakao geocoder error:', e);
    }
  }

  // 2. OpenStreetMap Nominatim Reverse Geocoding Fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { signal: controller.signal, headers: { 'Accept-Language': 'ko,en' } }
    );
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address;
      if (addr) {
        const province = addr.province || addr.state || addr.city || '';
        const city = addr.city || addr.county || addr.district || '';
        const borough = addr.borough || addr.suburb || addr.city_district || '';
        const neighbourhood = addr.neighbourhood || addr.quarter || addr.village || addr.road || '';
        const parts = [province, city, borough, neighbourhood].filter(
          (p, i, arr) => p && arr.indexOf(p) === i
        );
        if (parts.length > 0) {
          return parts.join(' ');
        }
      }
    }
  } catch (e) {
    // ignore fetch error
  }

  // 3. Anyang Dong Coordinate Proximity Estimator Fallback
  // If coordinates are in Anyang / Gyeonggi area
  if (lat >= 37.35 && lat <= 37.45 && lng >= 126.85 && lng <= 127.05) {
    if (lng < 126.93) {
      return lat > 37.41 ? '경기도 안양시 만안구 석수동 (안양천변)' : '경기도 안양시 만안구 박달동';
    } else if (lng < 126.96) {
      return lat > 37.40 ? '경기도 안양시 만안구 안양동 (안양예술공원 인근)' : '경기도 안양시 만안구 안양동 (안양천 쌍개울)';
    } else {
      return lat > 37.40 ? '경기도 안양시 동안구 비산동 (학의천로)' : '경기도 안양시 동안구 평촌동 (중앙공원 인근)';
    }
  }

  return '경기도 안양시 안양천로';
}

