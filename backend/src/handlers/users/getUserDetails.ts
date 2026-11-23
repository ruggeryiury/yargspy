import fp from 'fastify-plugin'
import z from 'zod'

import { type GenericIdParams, genericIdParams, genericServerResponse } from '@schemas'

import { publicUserModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

const getUserDetailsSuccessData = genericServerResponse.extend({
	data: z.object({
		user: publicUserModel,
	}),
})

export const getUserDetails = fp(async (fastify) => {
	fastify.get<{ Params: GenericIdParams }>(
		'/v1/users/:id/data',
		{
			schema: {
				tags: ['Users'],
				summary: 'Retrieves the details of an user',
				response: {
					200: Swagger.replySchema('ok', getUserDetailsSuccessData.shape.data).describe('Default response'),
					404: Swagger.replySchema('not_found').describe('User not found using the provided ID'),
				},
				params: genericIdParams,
			},
		},
		async (req, reply) => {
			const { id: userId } = req.params

			const user = await fastify.dbFuncs.users.findById(userId)
			if (!user) throw new ServerError('err_user_not_found')

			return success<z.infer<typeof getUserDetailsSuccessData.shape.data>>(req, reply, { code: 'ok', data: { user: publicUserModel.parse(user) } })
		},
	)
})
