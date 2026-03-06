// Hatfield Square, Pretoria coordinates
const HATFIELD_SQUARE = { lat: -25.7479, lng: 28.2293 };

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine formula — returns distance in km */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Geocode an address using OpenStreetMap Nominatim (free, no key needed).
 * Returns { lat, lng } or null.
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(address + ", South Africa");
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "BeatKulture-App/1.0" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.length) return null;

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

/**
 * Calculate distance in km from Hatfield Square, Pretoria to a venue address.
 * Uses straight-line (Haversine) with a 1.3x road-factor approximation.
 * Returns the estimated road distance in km, or null on failure.
 */
export async function calculateDistanceFromBase(venueAddress: string): Promise<number | null> {
  const coords = await geocodeAddress(venueAddress);
  if (!coords) return null;

  const straightLine = haversineDistance(
    HATFIELD_SQUARE.lat, HATFIELD_SQUARE.lng,
    coords.lat, coords.lng
  );

  // Apply 1.3x road factor for a more realistic estimate
  const roadDistance = Math.round(straightLine * 1.3);
  return roadDistance;
}
