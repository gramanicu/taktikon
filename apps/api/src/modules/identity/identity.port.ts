/** The authenticated principal for a request, resolved from a session or bearer token. */
export type AuthContext = {
  userId: string
  role: string | null
}

/**
 * The boundary the rest of the app depends on for identity — never better-auth directly.
 * Swapping the auth provider means replacing the adapter behind this port.
 */
export type IdentityPort = {
  validate: (headers: Headers) => Promise<AuthContext | null>
}
