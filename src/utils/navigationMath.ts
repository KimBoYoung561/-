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

/** Returns the closest distance from a report point to a route polyline. */
export function getPointToPolylineDistanceMeters(
  point: { lat: number; lng: number },
  path: [number, number][]
): number {
  if (!path || path.length === 0) return Infinity;
  if (path.length === 1) return getDistanceMeters(point.lat, point.lng, path[0][0], path[0][1]);

  const latitudeScale = 111320;
  const longitudeScale = Math.cos((point.lat * Math.PI) / 180) * latitudeScale;
  let minimumDistance = Infinity;

  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const startX = (start[1] - point.lng) * longitudeScale;
    const startY = (start[0] - point.lat) * latitudeScale;
    const endX = (end[1] - point.lng) * longitudeScale;
    const endY = (end[0] - point.lat) * latitudeScale;
    const dx = endX - startX;
    const dy = endY - startY;
    const segmentLengthSquared = dx * dx + dy * dy;
    const projection = segmentLengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, -(startX * dx + startY * dy) / segmentLengthSquared));
    const closestX = startX + projection * dx;
    const closestY = startY + projection * dy;
    minimumDistance = Math.min(minimumDistance, Math.hypot(closestX, closestY));
  }

  return minimumDistance;
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
