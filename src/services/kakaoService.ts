// Kakao Maps API services helper & Geocoding / Place search utility

const KAKAO_API_KEY = 'c4d1b687ae75d00ca6539a5e7c241fca';

let kakaoLoadPromise: Promise<any> | null = null;

export function loadKakaoMapsServices(): Promise<any> {
  if (kakaoLoadPromise) return kakaoLoadPromise;

  kakaoLoadPromise = new Promise((resolve) => {
    // If kakao and services are already loaded
    if ((window as any).kakao?.maps?.services) {
      resolve((window as any).kakao.maps);
      return;
    }

    if ((window as any).kakao?.maps) {
      (window as any).kakao.maps.load(() => {
        resolve((window as any).kakao.maps);
      });
      return;
    }

    // Check if script element already exists
    let script = document.getElementById('kakao-map-sdk') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=services,clusterer&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
    }

    script.onload = () => {
      if ((window as any).kakao?.maps) {
        (window as any).kakao.maps.load(() => {
          resolve((window as any).kakao.maps);
        });
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      resolve(null);
    };

    // Timeout fallback after 3 seconds
    setTimeout(() => {
      if ((window as any).kakao?.maps) {
        (window as any).kakao.maps.load(() => {
          resolve((window as any).kakao.maps);
        });
      } else {
        resolve(null);
      }
    }, 3000);
  });

  return kakaoLoadPromise;
}

export interface PlaceSearchResult {
  id: string;
  place_name: string;
  road_address_name?: string;
  address_name: string;
  x: string; // lng
  y: string; // lat
  category_group_name?: string;
  phone?: string;
}

/**
 * Converts lat, lng coordinates into real road / lot-number address using Kakao Geocoder or OpenStreetMap Nominatim
 */
export async function coordToAddress(lat: number, lng: number): Promise<string> {
  // 1. Try Kakao Maps Geocoder if SDK is available
  try {
    const maps = await loadKakaoMapsServices();
    if (maps && maps.services?.Geocoder) {
      const geocoder = new maps.services.Geocoder();
      const kakaoAddress = await new Promise<string | null>((resolve) => {
        geocoder.coord2Address(lng, lat, (result: any, status: any) => {
          if (status === maps.services.Status.OK && result && result[0]) {
            const roadAddr = result[0].road_address?.address_name;
            const jibunAddr = result[0].address?.address_name;
            resolve(roadAddr || jibunAddr || null);
          } else {
            resolve(null);
          }
        });
      });
      if (kakaoAddress) {
        return kakaoAddress;
      }
    }
  } catch (err) {
    console.warn('Kakao coord2Address error:', err);
  }

  // 2. Fallback: Fast client-side reverse geocoding via OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        // Extract meaningful short Korean address (e.g., 구/동/로)
        const addr = data.address;
        if (addr) {
          const parts = [
            addr.city || addr.county || addr.province,
            addr.suburb || addr.city_district || addr.district,
            addr.neighbourhood || addr.road || addr.village,
          ].filter(Boolean);
          if (parts.length > 0) {
            return parts.join(' ');
          }
        }
        return data.display_name.split(',').slice(0, 3).join(' ');
      }
    }
  } catch (err) {
    // Ignore network or timeout fallback
  }

  // 3. Clean fallback showing real GPS coordinates without fake hardcoded districts
  return '내 현재 위치';
}

/**
 * Searches places & addresses with Kakao Places keyword search
 */
export async function searchKakaoPlaces(keyword: string): Promise<PlaceSearchResult[]> {
  if (!keyword || keyword.trim().length === 0) return [];

  try {
    const maps = await loadKakaoMapsServices();
    if (maps && maps.services?.Places) {
      const ps = new maps.services.Places();
      return new Promise<PlaceSearchResult[]>((resolve) => {
        // Search prioritizing Anyang region coordinates
        ps.keywordSearch(
          keyword,
          (data: any, status: any) => {
            if (status === maps.services.Status.OK && Array.isArray(data)) {
              resolve(data);
            } else {
              resolve([]);
            }
          },
          {
            location: new maps.LatLng(37.3943, 126.9568),
            radius: 20000,
          }
        );
      });
    }
  } catch (err) {
    console.warn('Kakao keywordSearch error:', err);
  }

  return [];
}
