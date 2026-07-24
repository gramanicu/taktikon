/**
 * Outbound email. Kept behind a port so the transactional provider (SMTP / Resend /
 * Postmark) is a swappable detail; the domain only knows this interface.
 */
export type EmailPort = {
  sendPasswordReset: (to: string, resetUrl: string) => Promise<void>
}
