import Fastify, { LogController } from 'fastify'

import type { ZodTypeProvider } from '@fastify/type-provider-zod'

import { ServerInit } from './core/services/ServerInit'
import { ServerLog } from './core/services/ServerLog'
import { ServerRoutes } from './core/services/ServerRoutes'

const app = Fastify({ logController: new LogController({ disableRequestLogging: true }), trustProxy: process.env.PROXY === 'true' }).withTypeProvider<ZodTypeProvider>()

await ServerInit.init(app)
await ServerRoutes.init(app)

ServerLog.log(`YARGSpy v1.0.0${app.isDev() ? ` ${ServerLog.chalk.bgYellow(ServerLog.chalk.black(' DEVELOPMENT MODE '))}` : ''}\n${ServerLog.chalk.italic(ServerLog.chalk.gray('Developed by Ruggy & raphaelgoulart'))}\n`)
try {
	await app.ready()
	await app.listen({ port: app.env.PORT, host: app.env.HOST ?? (app.isDev() ? '0.0.0.0' : 'localhost') })

	ServerLog.log(`Server listening at:\n${ServerLog.chalk.gray(ServerLog.getNetInterfacePort(app))}\n`)

	ServerLog.log('Server environment variables:')
	for (const [key, value] of Object.entries(app.env)) {
		ServerLog.write(`${ServerLog.chalk.gray(key)} `)
		ServerLog.logPrimitive(value)
		ServerLog.log()
	}
	ServerLog.log()

	const [usersCount, songsCount, scoresCount] = await Promise.all([app.db.users.countDocuments(), app.db.songs.countDocuments(), app.db.scores.countDocuments()])
	ServerLog.log('Server status:')
	ServerLog.log(`${usersCount} User${usersCount === 1 ? '' : 's'}`)
	ServerLog.log(`${songsCount} Song${songsCount === 1 ? '' : 's'}`)
	ServerLog.log(`${scoresCount} Score${scoresCount === 1 ? '' : 's'}`)
} catch (err) {
	console.error(err)
	process.exit(1)
}
