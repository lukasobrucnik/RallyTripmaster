// Geodeticke a formatovaci pomocne funkce.

const R = 6371008.8; // stredni polomer Zeme v metrech (WGS84)

/** Vzdalenost dvou bodu v metrech (haversine). */
export function haversine(a, b) {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const la1 = a.lat * toRad;
  const la2 = b.lat * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const M_PER_MILE = 1609.344;
export const M_PER_FOOT = 0.3048;

/** Hlavni odometr: 12.34 km nebo 7.67 mi. */
export function formatDistance(meters, units = 'metric', decimals = 2) {
  const v = units === 'imperial' ? meters / M_PER_MILE : meters / 1000;
  return v.toFixed(decimals);
}

/** Kratka vzdalenost mezi zatackami - v metrech / stopach, bez desetin. */
export function formatShort(meters, units = 'metric') {
  if (units === 'imperial') return `${Math.round(meters / M_PER_FOOT)} ft`;
  return `${Math.round(meters)} m`;
}

/** Rychlost z m/s na km/h nebo mph. */
export function toSpeed(mps, units = 'metric') {
  return units === 'imperial' ? mps * 2.2369362921 : mps * 3.6;
}
export function fromSpeed(v, units = 'metric') {
  return units === 'imperial' ? v / 2.2369362921 : v / 3.6;
}
export const speedUnit = (units) => (units === 'imperial' ? 'mph' : 'km/h');
export const distUnit = (units) => (units === 'imperial' ? 'mi' : 'km');
export const shortUnit = (units) => (units === 'imperial' ? 'ft' : 'm');

/** mm:ss.d nebo h:mm:ss.d */
export function formatClock(ms, tenths = true) {
  const neg = ms < 0;
  const t = Math.abs(ms);
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  const d = Math.floor((t % 1000) / 100);
  const two = (n) => String(n).padStart(2, '0');
  const base = h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
  return `${neg ? '-' : ''}${base}${tenths ? '.' + d : ''}`;
}

/** Odchylka v sekundach se znamenkem: +3.4 / -12.0 */
export function formatDelta(ms) {
  const s = ms / 1000;
  const sign = s > 0.05 ? '+' : s < -0.05 ? '' : '';
  return `${sign}${s.toFixed(1)}s`;
}

/** Cas dne HH:MM:SS. */
export function formatTimeOfDay(date) {
  const two = (n) => String(n).padStart(2, '0');
  return `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`;
}
