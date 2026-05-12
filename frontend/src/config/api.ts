/**
 * API configuration for Amadeus Elevate.
 * Hardcoded for production deployment (personal demo).
 */

/** Base URL without /api — use for auth endpoints */
export const API_BASE = 'https://amadeus-elevate-api.onrender.com';

/** Base URL with /api — use for all other endpoints */
export const API = `${API_BASE}/api`;
