import Fastify, { LogController } from 'fastify'

import type { ZodTypeProvider } from '@fastify/type-provider-zod'

import { ServerInit } from './core/services/ServerInit'
import { ServerRoutes } from './core/services/ServerRoutes'

const app = Fastify({ logController: new LogController({ disableRequestLogging: true }), trustProxy: process.env.PROXY === 'true' }).withTypeProvider<ZodTypeProvider>()

await ServerInit.init(app)
await ServerRoutes.init(app)

try {
	await app.ready()

	const localHostPort = await app.listen({ port: app.env.PORT, host: app.env.HOST ?? 'localhost' })
	console.log(localHostPort, app.env)
} catch (err) {
	console.error(err)
	process.exit(1)
}
