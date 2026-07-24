import * as p from '@clack/prompts'
import { getHealth } from '@taktikon/contracts'
import { Command } from 'commander'
import { configureClient } from '../lib/client.ts'

const DEFAULT_URL = process.env.TAKTIKON_API_URL ?? 'http://localhost:3000'

export const healthCommand = new Command('health')
  .description('Check whether the API is reachable and healthy')
  .option('--url <url>', 'API base URL', DEFAULT_URL)
  .action(async (options: { url: string }) => {
    configureClient(options.url)

    const spinner = p.spinner()
    spinner.start(`Checking ${options.url}`)

    const result = await getHealth()
    if (result.error || !result.data) {
      spinner.stop('API is unreachable')
      p.log.error(String(result.error ?? 'no response body'))
      process.exitCode = 1
      return
    }

    spinner.stop(`API status: ${result.data.status}`)
  })
