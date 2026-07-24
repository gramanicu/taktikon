import { eq } from 'drizzle-orm'
import { user } from './auth.table.ts'
import type { AuthDb } from './auth.ts'

export type UserLookupRow = { id: string; emailHash: string | null }

/** Looks up a user by username, returning just what the forgot-password check needs. */
export const makeFindUserByUsername =
  (db: AuthDb) =>
  async (username: string): Promise<UserLookupRow | undefined> => {
    const rows = await db
      .select({ id: user.id, emailHash: user.emailHash })
      .from(user)
      .where(eq(user.username, username))
      .limit(1)
    return rows[0]
  }
