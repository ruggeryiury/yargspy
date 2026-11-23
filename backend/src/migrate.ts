import Fastify, { LogController } from 'fastify'

import type { ZodTypeProvider } from '@fastify/type-provider-zod'

import { ServerInit } from './core/services/ServerInit'
import { ServerRoutes } from './core/services/ServerRoutes'
import { searchAndSortUpdate001 } from './migrations/001-search-and-sort-update'

let i = 0,
	id = -1

for (const arg of process.argv) {
	if (arg === '-a' || arg === '--action') id = i + 1
	i++
}

const actionId = parseInt(process.argv[id])
console.log('YARGSpy Migration Server:\n[INFO] Initializing service...')

if (id === -1) throw new Error('No migration index provided as argument for the script: use "db:migrate -a 1".')
if (!process.argv[id]) throw new Error('No migration action found with the provided ID')
if (Number.isNaN(actionId)) throw new Error('The migration must be a valid positive integer')

const app = Fastify({ logController: new LogController({ disableRequestLogging: true }), trustProxy: process.env.PROXY === 'true' }).withTypeProvider<ZodTypeProvider>()

await ServerInit.init(app)
await ServerRoutes.init(app)

await app.ready()

switch (actionId) {
	default:
		throw new Error('No migration step found using provided index')
	case 1: {
		await searchAndSortUpdate001(app)
		break
	}
}
process.exit(0)
