import { client } from '@taktikon/contracts'

/** Points the shared contracts client at an API and optionally attaches a bearer token. */
export const configureClient = (baseUrl: string, token?: string) => {
  client.setConfig({
    baseUrl,
    ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
  })
}
