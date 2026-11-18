import AttendanceGeofence from "../models/AttendanceGeofence.js";

const CACHE_TTL_MS = 30 * 1000;
let cached = null;
let cachedAt = 0;

const toPublic = (doc) => ({
  enabled: Boolean(doc?.enabled),
  latitude: doc?.latitude ?? null,
  longitude: doc?.longitude ?? null,
  radiusMeters: doc?.radiusMeters ?? 100,
  updatedAt: doc?.updatedAt ?? null,
});

export const getGeofence = async () => {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;
  const doc = await AttendanceGeofence.findOne({ key: "default" }).lean();
  cached = toPublic(doc);
  cachedAt = Date.now();
  return cached;
};

export const saveGeofence = async ({ enabled, latitude, longitude, radiusMeters }, adminId) => {
  const doc = await AttendanceGeofence.findOneAndUpdate(
    { key: "default" },
    { $set: { enabled, latitude, longitude, radiusMeters, updatedBy: adminId || null } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  cached = toPublic(doc);
  cachedAt = Date.now();
  return cached;
};

// Great-circle distance in meters (haversine)
export const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const isValidCoord = (lat, lon) =>
  Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

/**
 * Checks a student's reported position against the office geofence.
 * Returns { ok: true } or { ok: false, code, error, distance? }.
 */
export const checkGeofence = async (body = {}) => {
  const fence = await getGeofence();
  if (!fence.enabled || !isValidCoord(fence.latitude, fence.longitude)) {
    return { ok: true, fence };
  }

  const lat = Number(body.latitude);
  const lon = Number(body.longitude);
  if (body.latitude == null || body.longitude == null || !isValidCoord(lat, lon)) {
    return {
      ok: false,
      code: "LOCATION_REQUIRED",
      error: "Location is required to punch attendance. Please allow location access and try again.",
    };
  }

  const distance = Math.round(distanceMeters(lat, lon, fence.latitude, fence.longitude));
  if (distance > fence.radiusMeters) {
    return {
      ok: false,
      code: "OUTSIDE_GEOFENCE",
      distance,
      radiusMeters: fence.radiusMeters,
      error: `You are ${distance} m away from the institute. Attendance can only be punched within ${fence.radiusMeters} m of the institute.`,
    };
  }

  return { ok: true, distance, fence };
};
