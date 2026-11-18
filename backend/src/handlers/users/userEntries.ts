import fp from 'fastify-plugin'

import { type UserEntriesQuerystring, userEntriesQuerystring } from '@schemas'

import { success } from '../../core/services/ServerResponse'

export const userEntries = fp(async (app) => {
	app.post<{ Querystring: UserEntriesQuerystring }>(
		'/api/v1/users/entries',
		{
			schema: {
				tags: ['Users'],
				querystring: userEntriesQuerystring,
			},
		},
		async (req, reply) => {
			const { limit, page, username } = req.query
			const skip = (page - 1) * limit
			return success(req, reply, 'ok')
		},
	)
})
