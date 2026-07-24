import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport'
import winston from 'winston'
import { env } from '../env.ts'

// Structured JSON logging. The OpenTelemetry transport correlates logs with the active
// trace when OTEL is enabled, and is a harmless no-op when it isn't.
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.json(),
  transports: [new winston.transports.Console(), new OpenTelemetryTransportV3()],
})
