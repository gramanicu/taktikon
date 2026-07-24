import {
  type EvaluationContext,
  InMemoryProvider,
  OpenFeature,
  type Provider,
} from '@openfeature/server-sdk'

// Flags are written against the OpenFeature standard interface; the backing provider is
// swappable (InMemory by default for dev/tests; Unleash in real environments — see
// unleash-provider.ts). Feature flags — not branches — gate what each environment sees.
const emptyProvider = new InMemoryProvider({})

export const initFlags = async (provider: Provider = emptyProvider) => {
  await OpenFeature.setProviderAndWait(provider)
}

export const flags = () => OpenFeature.getClient()

export const isEnabled = (flag: string, defaultValue = false, context?: EvaluationContext) =>
  flags().getBooleanValue(flag, defaultValue, context)
