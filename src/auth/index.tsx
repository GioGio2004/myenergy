// ============================================================================
// AUTH TRACK ZONE (dev rules §1). GAME track does not edit below this header.
// Replace the passthrough with ClerkProvider + onboarding + merge dialog.
// HARD RULE: must render children untouched when VITE_CLERK_PUBLISHABLE_KEY is
// absent (guest-only keyless boot is the teammate-contract CI).
// ============================================================================

import type { ReactNode } from 'react'

export function AuthProvider({ children }: { children: ReactNode }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (!key) return <>{children}</>
  // TODO(auth): <ClerkProvider publishableKey={key}>{children}</ClerkProvider>
  return <>{children}</>
}
