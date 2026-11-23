import fp from 'fastify-plugin'
import z from 'zod'

import { genericServerResponse } from '@schemas'

import { userBearerAuth } from '../../core/services/Auth'
import { userModel } from '../../core/services/Database'
import { success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

const adminEntriesSuccessData = genericServerResponse.extend({
	data: z.object({
		entries: z.array(userModel.pick({ _id: true, username: true })),
	}),
})

export const adminEntries = fp(async (app) => {
	app.get(
		'/v1/admin/entries',
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
			const entries = await app.db.users
				.aggregate<z.infer<typeof adminEntriesSuccessData.shape.data.shape.entries.element>>([
					{
						$match: {
							admin: true,
						},
					},
					{
						$project: {
							username: true,
						},
					},
				])
				.toArray()

			return success<z.infer<typeof adminEntriesSuccessData.shape.data>>(req, reply, { code: 'ok', data: { entries } })
		},
	)
})
