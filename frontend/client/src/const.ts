/**
 * Client-side constants and helpers.
 */

/** Redirect to login page / trigger login flow. */
export function startLogin() {
  // The main.tsx uses tRPC with cookie-based auth.
  // For now, scroll to / or redirect to an auth page.
  window.location.href = "/";
}
