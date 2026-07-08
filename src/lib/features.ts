/**
 * Global feature flags for the Nexum frontend.
 * Flags should default to false.
 */

export const isObligationsV17Enabled = () =>
  process.env.NEXT_PUBLIC_NEXUM_OBLIGATIONS_V17_ENABLED === "true";
