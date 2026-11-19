import { getGeofence, saveGeofence } from '../services/geofenceService.js';

/**
 * Admin: read the office geofence used to restrict student self punch in/out
 */
export const getAttendanceGeofence = async (req, res) => {
  try {
    return res.status(200).json(await getGeofence());
  } catch (error) {
    console.error('[GEOFENCE] Fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load location settings' });
  }
};

/**
 * Admin: update the office geofence
 * Body: { enabled: boolean, latitude: number, longitude: number, radiusMeters: number }
 */
export const updateAttendanceGeofence = async (req, res) => {
  try {
    const enabled = Boolean(req.body?.enabled);
    const latitude = req.body?.latitude === '' || req.body?.latitude == null ? null : Number(req.body.latitude);
    const longitude = req.body?.longitude === '' || req.body?.longitude == null ? null : Number(req.body.longitude);
    const radiusMeters = Math.round(Number(req.body?.radiusMeters ?? 100));

    if (latitude != null && (!Number.isFinite(latitude) || Math.abs(latitude) > 90)) {
      return res.status(400).json({ success: false, message: 'Latitude must be between -90 and 90.' });
    }
    if (longitude != null && (!Number.isFinite(longitude) || Math.abs(longitude) > 180)) {
      return res.status(400).json({ success: false, message: 'Longitude must be between -180 and 180.' });
    }
    if (!Number.isFinite(radiusMeters) || radiusMeters < 10 || radiusMeters > 5000) {
      return res.status(400).json({ success: false, message: 'Radius must be between 10 and 5000 meters.' });
    }
    if (enabled && (latitude == null || longitude == null)) {
      return res.status(400).json({ success: false, message: 'Set office latitude and longitude before enabling the location restriction.' });
    }

    const fence = await saveGeofence({ enabled, latitude, longitude, radiusMeters }, req.user?.userId);
    return res.status(200).json({ success: true, message: 'Location settings saved', ...fence });
  } catch (error) {
    console.error('[GEOFENCE] Update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save location settings' });
  }
};
