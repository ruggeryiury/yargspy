import fp from 'fastify-plugin'
import type z from 'zod'

import { type UserResolveQuerystring, userResolveQuerystring, userResolveSuccessData } from '@schemas'

import { YARGSPY } from '../../constants'
import type { UserModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const userResolve = fp(async (app) => {
	app.get<{ Querystring: UserResolveQuerystring }>(
		'/v1/users/resolve',
		{
			schema: {
				tags: ['Users'],
				summary: 'Resolves an user entry value, returning another value from the same user',
				response: {
					200: Swagger.replySchema('ok', userResolveSuccessData.shape.data).describe('Default response'),
					404: Swagger.replySchema('not_found').describe('No user found using the provided parameters'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors'),
				},
				querystring: userResolveQuerystring,
			},
		},
		async (req, reply) => {
			const { input, output, value } = req.query

			let user: UserModel | null

			switch (input) {
				case YARGSPY.UserResolver.Email:
					user = await app.dbFuncs.users.findByEmail(value)
					break
				case YARGSPY.UserResolver.ID:
				default:
					user = await app.dbFuncs.users.findById(value)
					break
				case YARGSPY.UserResolver.Username:
					user = await app.dbFuncs.users.findByUsername(value)
					break
			}

			if (!user) throw new ServerError('err_user_not_found')

			let outputValue: string

			switch (output) {
				case YARGSPY.UserResolver.Email:
					outputValue = user.email
					break
				case YARGSPY.UserResolver.ID:
					outputValue = user._id.toHexString()
					break
				case YARGSPY.UserResolver.Username:
				default:
					outputValue = user.username
					break
			}

			return success<z.infer<typeof userResolveSuccessData.shape.data>>(req, reply, { code: 'ok', data: { output: outputValue } })
		},
	)
})
