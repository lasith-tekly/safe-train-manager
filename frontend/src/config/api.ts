/**
 * Single source of truth for API configuration.
 *
 * VITE_API_URL should be set to the base URL WITHOUT /api suffix.
 * Example: http://localhost:8000 or https://your-domain.com
 *
 * All API calls append /api/... themselves.
 */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Strip trailing slash if present
const BASE_URL = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;

/** Base URL without /api — use for auth endpoints */
export const API_BASE = BASE_URL;

/** Base URL with /api — use for all other endpoints */
export const API = `${BASE_URL}/api`;
