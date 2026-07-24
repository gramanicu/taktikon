import { logger } from '../../lib/logger.ts'
import type { EmailPort } from './email.port.ts'

/** Dev adapter: logs the reset link instead of sending mail. Replace with a real provider. */
export const consoleEmailAdapter = (): EmailPort => ({
  sendPasswordReset: async (to, resetUrl) => {
    logger.info('email.password-reset', { to, resetUrl })
  },
})
