import { client } from '@taktikon/contracts'

// Points the shared contracts client at the API. NEXT_PUBLIC_ so the value is inlined into
// the browser bundle (fetching happens client-side via TanStack Query).
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
})

export { client }
