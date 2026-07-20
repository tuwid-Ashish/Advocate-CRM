/**
 * dashboardCache.js
 *
 * A module-level (singleton) cache for dashboard data.
 * Lives in browser memory for the duration of the session.
 *
 * Strategy: Stale-While-Revalidate
 *  - If data is FRESH  (< TTL)        → return cache, skip network
 *  - If data is STALE  (TTL..MAX_AGE) → return cache immediately, revalidate in background
 *  - If data is EXPIRED (> MAX_AGE)   → block on fetch, then update cache
 */

const CACHE_TTL_MS = 3 * 60 * 1000;      // 3 minutes  — consider data "fresh"
const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes — hard expiry

const _state = {
  records: null,
  clients: null,
  employees: null,
  timestamp: 0,
};

/** Returns true when cache has data that is still within the hard expiry window */
function _hasData() {
  return (
    _state.records !== null &&
    _state.clients !== null &&
    Date.now() - _state.timestamp < CACHE_MAX_AGE_MS
  );
}

/** How old the cached data is in milliseconds, or Infinity if empty */
function _ageMs() {
  return _state.timestamp > 0 ? Date.now() - _state.timestamp : Infinity;
}

/**
 * Returns cached dashboard data if available, along with a freshness hint.
 * @returns {{ data: { records, clients, employees } | null, isFresh: boolean, isStale: boolean }}
 */
export function getCachedDashboardData() {
  if (!_hasData()) {
    return { data: null, isFresh: false, isStale: false };
  }

  const age = _ageMs();
  const isFresh = age < CACHE_TTL_MS;
  const isStale = !isFresh; // within max-age but past TTL

  return {
    data: {
      records: _state.records,
      clients: _state.clients,
      employees: _state.employees,
    },
    isFresh,
    isStale,
  };
}

/**
 * Stores fresh dashboard data in the cache.
 */
export function setCachedDashboardData({ records, clients, employees }) {
  _state.records = records;
  _state.clients = clients;
  _state.employees = employees ?? _state.employees; // keep old employees if not provided
  _state.timestamp = Date.now();
}

/**
 * Wipes the cache, forcing a fresh fetch on the next load.
 * Call this after mutations (add/edit/delete record or client).
 */
export function invalidateDashboardCache() {
  _state.records = null;
  _state.clients = null;
  _state.employees = null;
  _state.timestamp = 0;
}

/** Returns how many seconds old the cache is, or null if empty. */
export function getCacheAgeSeconds() {
  return _state.timestamp > 0
    ? Math.floor(_ageMs() / 1000)
    : null;
}
