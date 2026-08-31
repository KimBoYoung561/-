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

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FacilityLocationSearch {
  original: string;
  searchKeyword: string;
  detail: string;
}

/** Separates searchable landmarks from installation-specific positional details. */
export function refineFacilitySearchKeyword(original: string): FacilityLocationSearch {
  const normalized = original.replace(/\s+/g, ' ').trim();
  const withoutDistrictPrefix = normalized.replace(/^안양시\s+/, '');
  const detailPattern = /\s+(정문|후문|앞|옆|부근|입구|내|일원|하천진입로|육교아래|보도|맞은편)(.*)$/;
  const match = withoutDistrictPrefix.match(detailPattern);
  const detail = match ? `${match[1]}${match[2] || ''}`.trim() : '';
  const searchKeyword = (match ? withoutDistrictPrefix.slice(0, match.index) : withoutDistrictPrefix)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(\d+)\s*번\s*출구/g, '$1번출구');
  return { original: normalized, searchKeyword, detail };
}

function normalizeGeocodingText(value: string): string {
  return value
    .replace(/\uFEFF/g, '')
    .replace(/안\s*양\s*시/g, '안양시')
    .replace(/\s+/g, ' ')
    .trim();
}

function toCoordinates(result: any): Coordinates | null {
  const lat = Number(result?.y);
  const lng = Number(result?.x);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** Resolves a facility address or installation place, then returns only valid coordinates. */
export async function geocodeFacilityLocation(name: string, address: string, preferPlaceSearch = false): Promise<Coordinates | null> {
  const normalizedAddress = normalizeGeocodingText(address);
  if (!normalizedAddress) return null;

  try {
    const maps = await loadKakaoMapsServices();
    if (!maps?.services) return null;

    const placeSearch = async (): Promise<Coordinates | null> => {
      if (!maps.services.Places) return null;
      const places = new maps.services.Places();
      return new Promise<Coordinates | null>((resolve) => {
        places.keywordSearch(`${name} ${normalizedAddress}`, (result: any[], status: any) => {
          resolve(status === maps.services.Status.OK && result?.[0] ? toCoordinates(result[0]) : null);
        }, { location: new maps.LatLng(37.3943, 126.9568), radius: 20000 });
      });
    };

    const addressSearch = async (): Promise<Coordinates | null> => {
      const geocoder = new maps.services.Geocoder();
      return new Promise<Coordinates | null>((resolve) => {
        geocoder.addressSearch(normalizedAddress, (result: any[], status: any) => {
          resolve(status === maps.services.Status.OK && result?.[0] ? toCoordinates(result[0]) : null);
        });
      });
    };

    const preferredResult = preferPlaceSearch ? await placeSearch() : await addressSearch();
    if (preferredResult) return preferredResult;
    const secondaryResult = await (preferPlaceSearch ? addressSearch() : placeSearch());
    if (secondaryResult) return secondaryResult;
  } catch (err) {
    console.warn('Kakao facility geocoding error:', err);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=kr&q=${encodeURIComponent(normalizedAddress)}`,
      { signal: controller.signal, headers: { Accept: 'application/json' } },
    );
    clearTimeout(timeoutId);
    const result = await response.json();
    const lat = Number(result?.[0]?.lat);
    const lng = Number(result?.[0]?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  } catch {
    // Preserve the existing coordinate if both geocoders are unavailable.
  }

  console.warn(`No real coordinate found for facility address: ${normalizedAddress}`);
  return null;
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
      const placeResults = await new Promise<PlaceSearchResult[]>((resolve) => {
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

        if (placeResults.length > 0) return placeResults;

        // Keyword search can miss a raw road or lot-number address. Try the
        // address geocoder before reporting that there are no results.
        if (maps.services.Geocoder) {
          const geocoder = new maps.services.Geocoder();
          return new Promise<PlaceSearchResult[]>((resolve) => {
            geocoder.addressSearch(keyword.trim(), (data: any[], status: any) => {
              if (status !== maps.services.Status.OK || !data?.[0]) {
                resolve([]);
                return;
              }

              const result = data[0];
              resolve([{
                id: `address-${result.x}-${result.y}`,
                place_name: keyword.trim(),
                road_address_name: result.road_address?.address_name,
                address_name: result.address?.address_name || keyword.trim(),
                x: result.x,
                y: result.y,
              }]);
            });
          });
        }

        return [];
    }
  } catch (err) {
    console.warn('Kakao keywordSearch error:', err);
  }

  return [];
}
