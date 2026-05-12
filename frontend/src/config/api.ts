/**
 * API configuration for Amadeus Elevate.
 * Uses VITE_API_URL env var if set, otherwise falls back to production URL.
 * Local dev: Set VITE_API_URL=http://localhost:8000 in .env.local
 * Production: Defaults to Render deployment
 */

/** Base URL without /api — use for auth endpoints */
export const API_BASE = import.meta.env.VITE_API_URL
  || 'https://amadeus-elevate-api.onrender.com';

/** Base URL with /api — use for all other endpoints */
export const API = `${API_BASE}/api`;
