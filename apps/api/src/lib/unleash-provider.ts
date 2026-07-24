import {
  ErrorCode,
  type EvaluationContext,
  type Provider,
  type ResolutionDetails,
} from '@openfeature/server-sdk'
import { startUnleash, type Unleash } from 'unleash-client'

export type UnleashProviderConfig = {
  url: string
  appName: string
  token: string
}

const toUnleashContext = (context: EvaluationContext) => {
  const targetingKey = context.targetingKey
  return typeof targetingKey === 'string' ? { userId: targetingKey } : {}
}

/**
 * A minimal OpenFeature provider backed by Unleash's official Node client. Boolean flags
 * map to `unleash.isEnabled`; variant (string/number/object) flags fall back to the caller
 * default for now. Swapped in at the composition root when UNLEASH_URL is configured.
 */
export const createUnleashProvider = (config: UnleashProviderConfig): Provider => {
  let unleash: Unleash | undefined

  const notReady = <T>(defaultValue: T): ResolutionDetails<T> => ({
    value: defaultValue,
    reason: 'ERROR',
    errorCode: ErrorCode.PROVIDER_NOT_READY,
  })

  const passthrough = <T>(defaultValue: T): ResolutionDetails<T> => ({
    value: defaultValue,
    reason: 'DEFAULT',
  })

  return {
    metadata: { name: 'unleash' },

    async initialize() {
      unleash = await startUnleash({
        url: config.url,
        appName: config.appName,
        customHeaders: { Authorization: config.token },
      })
    },

    async onClose() {
      unleash?.destroy()
    },

    async resolveBooleanEvaluation(flagKey, defaultValue, context) {
      if (!unleash) {
        return notReady(defaultValue)
      }
      return {
        value: unleash.isEnabled(flagKey, toUnleashContext(context)),
        reason: 'TARGETING_MATCH',
      }
    },

    async resolveStringEvaluation(_flagKey, defaultValue) {
      return passthrough(defaultValue)
    },

    async resolveNumberEvaluation(_flagKey, defaultValue) {
      return passthrough(defaultValue)
    },

    async resolveObjectEvaluation(_flagKey, defaultValue) {
      return passthrough(defaultValue)
    },
  }
}
