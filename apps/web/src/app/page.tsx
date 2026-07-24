import { HealthStatus } from '@/components/health-status'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Taktikon</h1>
      <HealthStatus />
    </main>
  )
}
