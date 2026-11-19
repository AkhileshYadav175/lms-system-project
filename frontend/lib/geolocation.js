// Browser geolocation helper used for attendance punch in/out.
// Resolves to { latitude, longitude, accuracy } or rejects with an Error whose message is user-friendly.

export const getCurrentLocation = ({ timeout = 15000, maximumAge = 0 } = {}) =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Your browser does not support location. Please use a modern browser on your phone."));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error("Location needs a secure (https) connection. Please open the portal over https."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
        }),
      (err) => {
        if (err.code === 1) {
          reject(new Error("Location permission denied. Please allow location access in your browser settings to punch attendance."));
        } else if (err.code === 3) {
          reject(new Error("Getting your location took too long. Please turn on GPS and try again."));
        } else {
          reject(new Error("Could not detect your location. Please turn on GPS / location and try again."));
        }
      },
      { enableHighAccuracy: true, timeout, maximumAge }
    );
  });

// Fetch location only if the admin has enabled the geofence; returns {} when not needed.
export const getPunchLocationPayload = async (fetchApi) => {
  let fence = null;
  try {
    const res = await fetchApi("/student/attendance/geofence", { skipCache: true });
    if (res.ok) fence = await res.json();
  } catch (e) {}

  // If the setting can't be loaded, still try to send location so the backend can validate.
  if (fence && !fence.enabled) return {};

  try {
    const { latitude, longitude, accuracy } = await getCurrentLocation();
    return { latitude, longitude, accuracy };
  } catch (err) {
    if (fence?.enabled) throw err;
    return {};
  }
};
