import { LatLng } from '../types';

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = toRadians(lng2 - lng1);
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);

  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);

  let brng = toDegrees(Math.atan2(y, x));
  return Math.round((brng + 360) % 360);
}

export function calculateBearing(
  p1: LatLng | [number, number],
  p2: LatLng | [number, number]
): number {
  const lat1 = Array.isArray(p1) ? p1[0] : p1.lat;
  const lng1 = Array.isArray(p1) ? p1[1] : p1.lng;
  const lat2 = Array.isArray(p2) ? p2[0] : p2.lat;
  const lng2 = Array.isArray(p2) ? p2[1] : p2.lng;
  return getBearing(lat1, lng1, lat2, lng2);
}

export function formatRemainingDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function splitPathAtRider(
  path: (LatLng | [number, number])[],
  riderPos: LatLng
): {
  passedPath: [number, number][];
  remainingPath: [number, number][];
  closestIndex: number;
  remainingDistanceMeters: number;
  remainingDistanceKm: number;
} {
  if (!path || path.length === 0) {
    return {
      passedPath: [],
      remainingPath: [],
      closestIndex: 0,
      remainingDistanceMeters: 0,
      remainingDistanceKm: 0,
    };
  }

  const normalizedPath: [number, number][] = path.map((p) =>
    Array.isArray(p) ? [p[0], p[1]] : [p.lat, p.lng]
  );

  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < normalizedPath.length; i++) {
    const dist = getDistanceMeters(
      riderPos.lat,
      riderPos.lng,
      normalizedPath[i][0],
      normalizedPath[i][1]
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  const passedPath: [number, number][] = normalizedPath.slice(0, closestIndex + 1);
  passedPath.push([riderPos.lat, riderPos.lng]);

  const remainingPath: [number, number][] = [
    [riderPos.lat, riderPos.lng],
    ...normalizedPath.slice(closestIndex + 1),
  ];

  let remainingDistanceMeters = 0;
  for (let i = 0; i < remainingPath.length - 1; i++) {
    remainingDistanceMeters += getDistanceMeters(
      remainingPath[i][0],
      remainingPath[i][1],
      remainingPath[i + 1][0],
      remainingPath[i + 1][1]
    );
  }

  const remainingDistanceKm = Math.round((remainingDistanceMeters / 1000) * 10) / 10;

  return {
    passedPath,
    remainingPath,
    closestIndex,
    remainingDistanceMeters,
    remainingDistanceKm,
  };
}

export function getPointToPolylineDistanceMeters(
  point: { lat: number; lng: number } | [number, number],
  polyline: (LatLng | [number, number])[]
): number {
  if (!polyline || polyline.length === 0) return Infinity;
  const pLat = Array.isArray(point) ? point[0] : point.lat;
  const pLng = Array.isArray(point) ? point[1] : point.lng;

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length; i++) {
    const node = polyline[i];
    const nLat = Array.isArray(node) ? node[0] : node.lat;
    const nLng = Array.isArray(node) ? node[1] : node.lng;
    const d = getDistanceMeters(pLat, pLng, nLat, nLng);
    if (d < minDistance) {
      minDistance = d;
    }
  }
  return minDistance;
}

