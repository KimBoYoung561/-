// Utility math functions for real-time bicycle navigation tracking

/**
 * Calculates Haversine distance in meters between two coordinates [lat, lng]
 */
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
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
 * Calculates compass bearing (0-360 degrees, 0 = North, 90 = East) between two points
 */
export function getBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;
  return Math.round(bearing);
}

/**
 * Calculates the total length in meters along an array of polyline points
 */
export function getPolylineLengthMeters(points: [number, number][]): number {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += getDistanceMeters(
      points[i][0],
      points[i][1],
      points[i + 1][0],
      points[i + 1][1]
    );
  }
  return total;
}

/**
 * Finds closest segment index on path for current rider position
 * and returns passed points and remaining points.
 */
export function splitPathAtRider(
  path: [number, number][],
  riderPos: { lat: number; lng: number }
): {
  closestIndex: number;
  passedPath: [number, number][];
  remainingPath: [number, number][];
  remainingDistanceMeters: number;
} {
  if (!path || path.length === 0) {
    return {
      closestIndex: 0,
      passedPath: [],
      remainingPath: [],
      remainingDistanceMeters: 0,
    };
  }

  if (path.length === 1) {
    return {
      closestIndex: 0,
      passedPath: [[riderPos.lat, riderPos.lng]],
      remainingPath: path,
      remainingDistanceMeters: 0,
    };
  }

  let minDistance = Infinity;
  let closestIdx = 0;

  for (let i = 0; i < path.length; i++) {
    const dist = getDistanceMeters(
      riderPos.lat,
      riderPos.lng,
      path[i][0],
      path[i][1]
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestIdx = i;
    }
  }

  // Passed: 0 ... closestIdx + current rider position
  const passedPath: [number, number][] = [
    ...path.slice(0, closestIdx + 1),
    [riderPos.lat, riderPos.lng],
  ];

  // Remaining: current rider position + closestIdx ... end
  const remainingPath: [number, number][] = [
    [riderPos.lat, riderPos.lng],
    ...path.slice(closestIdx + 1),
  ];

  const remainingDistanceMeters = getPolylineLengthMeters(remainingPath);

  return {
    closestIndex: closestIdx,
    passedPath,
    remainingPath,
    remainingDistanceMeters,
  };
}
