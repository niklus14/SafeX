/**
 * geolocate.ts — resolve the device's real position + an Azerbaijani address.
 *
 * Returns { lat, lng, location }. The `location` string is reverse-geocoded via
 * OpenStreetMap's Nominatim; if that fails it falls back to a coordinate label.
 * Requires a secure context (HTTPS or localhost) for navigator.geolocation.
 */

export interface ResolvedLocation {
  lat: number;
  lng: number;
  location: string;
}

function coordLabel(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&accept-language=az`,
    );
    if (!res.ok) return coordLabel(lat, lng);
    const data = await res.json();
    const a = data.address ?? {};
    const road = a.road || a.pedestrian || a.footway || a.residential || '';
    const area = a.suburb || a.neighbourhood || a.city_district || a.quarter || a.city || '';
    const parts = [road, area].filter(Boolean);
    return parts.length ? parts.join(', ') : coordLabel(lat, lng);
  } catch {
    return coordLabel(lat, lng);
  }
}

/** Resolve current position. Rejects if geolocation is unavailable or denied. */
export function resolveLocation(): Promise<ResolvedLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const location = await reverseGeocode(lat, lng);
        resolve({ lat, lng, location });
      },
      err => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}
