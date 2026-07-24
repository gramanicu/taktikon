import { z } from '@hono/zod-openapi'
import { body, ctx } from '../../kit/context.ts'
import { Body, Controller, Post, Produces, Status } from '../../kit/http.ts'
import type { Auth } from './auth.ts'
import { type EmailHasher, syntheticEmail } from './email-hash.ts'
import { runWithResetEmail } from './reset-email-context.ts'
import type { UserLookupRow } from './user-lookup.ts'

const RegisterBody = z.object({
  username: z.string().min(3).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})
const RegisteredResponse = z.object({ username: z.string() }).openapi('Registered')

const ForgotBody = z.object({
  username: z.string(),
  email: z.string().email(),
})
const AcceptedResponse = z.object({ status: z.literal('accepted') }).openapi('ForgotAccepted')

export type IdentityDeps = {
  auth: Auth
  hashEmail: EmailHasher
  findUserByUsername: (username: string) => Promise<UserLookupRow | undefined>
}

@Controller('/api/identity')
export class IdentityController {
  constructor(private readonly deps: IdentityDeps) {}

  // Register: store the email only as a peppered hash + a synthetic user.email.
  @Post('/register')
  @Body(RegisterBody)
  @Produces(Status.Created, RegisteredResponse)
  async register() {
    const { username, email, password } = await body(RegisterBody)
    try {
      await this.deps.auth.api.signUpEmail({
        body: {
          username,
          email: syntheticEmail(username),
          password,
          name: username,
          emailHash: this.deps.hashEmail(email),
        },
      })
    } catch {
      return ctx().json({ error: 'username is unavailable' }, Status.Conflict)
    }
    return { username }
  }

  // Forgot password: verify username + email hash, then trigger better-auth's reset while
  // stashing the plaintext address so the link is delivered there. Always responds the same.
  @Post('/forgot-password')
  @Body(ForgotBody)
  @Produces(Status.Accepted, AcceptedResponse)
  async forgotPassword() {
    const { username, email } = await body(ForgotBody)
    const found = await this.deps.findUserByUsername(username)
    if (found && found.emailHash === this.deps.hashEmail(email)) {
      await runWithResetEmail(email, () =>
        this.deps.auth.api.requestPasswordReset({ body: { email: syntheticEmail(username) } }),
      )
    }
    return { status: 'accepted' as const }
  }
}
