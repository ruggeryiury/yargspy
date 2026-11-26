import fp from 'fastify-plugin'
import z from 'zod'

import { normalizeStr } from '@lib/utils/strnum'
import { type UserEntriesQuerystring, genericPaginationObject, genericServerResponse, userEntriesQuerystring } from '@schemas'

import { publicUserModel } from '../../core/services/Database'
import { success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

const userEntriesSuccessData = genericServerResponse.extend({
	data: z.object({
		pagination: genericPaginationObject,
		entries: z.array(publicUserModel),
	}),
})

export const userEntries = fp(async (fastify) => {
	fastify.get<{ Querystring: UserEntriesQuerystring }>(
		'/v1/users/entries',
		{
			schema: {
				tags: ['Users'],
				summary: 'Search for user entries using a provided username',
				response: {
					200: Swagger.replySchema('ok', userEntriesSuccessData.shape.data).describe('Default response'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors, wrong entry ID format'),
				},
				querystring: userEntriesQuerystring,
			},
		},
		async (req, reply) => {
			const { limit, page, username } = req.query
			const skip = (page - 1) * limit

			const filter = { usernameSearch: { $regex: normalizeStr(username) }, active: true }
			const [entries, totalResults] = await Promise.all([fastify.db.users.find(filter).skip(skip).limit(limit).toArray(), fastify.db.users.countDocuments(filter)])

			const totalPages = Math.ceil(totalResults / limit)
			const pagesLeft = Math.max(0, totalPages - page)

			const pagination = {
				page,
				limit,
				skip,
				totalResults,
				totalPages,
				pagesLeft,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			}
			return success<z.infer<typeof userEntriesSuccessData.shape.data>>(req, reply, {
				code: 'ok',
				data: {
					pagination,
					entries,
				},
			})
		},
	)
})
