import { Command } from 'commander'
import { healthCommand } from './commands/health.ts'

const program = new Command('taktikon').description('Taktikon command-line client').version('0.0.0')

program.addCommand(healthCommand)

await program.parseAsync()
