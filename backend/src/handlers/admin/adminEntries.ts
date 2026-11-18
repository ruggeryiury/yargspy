import fp from 'fastify-plugin'

import { adminEntriesSuccessData } from '@schemas'

import { userBearerAuth } from '../../core/services/Auth'
import { success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const adminEntries = fp(async (app) => {
	app.get(
		'/api/v1/admin/entries',
		{
			schema: {
				tags: ['Admin'],
				summary: 'Returns a list of all the registered users with administrator rights',
				description: '_This route needs administrator rights to access it._',
				response: {
					200: Swagger.replySchema('ok', adminEntriesSuccessData.shape.data).describe('Default response'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server, or with no administrator rights'),
				},
				security: [
					{
						bearerAuth: [],
					},
				],
			},
			preHandler: app.auth([userBearerAuth({ admin: true })]),
		},
		async (req, reply) => {
			const entries = (await app.db.users.find({ admin: true }).toArray()).map((entry) => entry.username)
			return success(req, reply, { code: 'ok', data: { entries } })
		},
	)
})
