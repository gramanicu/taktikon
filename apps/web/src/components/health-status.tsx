'use client'

import { getHealth } from '@taktikon/contracts'
import { useQuery } from '@tanstack/react-query'

export function HealthStatus() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data, error } = await getHealth()
      if (error) {
        throw error
      }
      return data
    },
  })

  if (isPending) {
    return <p>Checking API…</p>
  }
  if (isError) {
    return <p>API unreachable: {String(error)}</p>
  }
  return <p>API status: {data?.status}</p>
}
