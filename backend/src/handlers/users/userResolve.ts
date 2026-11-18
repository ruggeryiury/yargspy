import fp from 'fastify-plugin'
import type z from 'zod'

import { type UserResolveBody, userResolveBody, userResolveSuccessData } from '@schemas'

import type { UserModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const userResolve = fp(async (app) => {
	app.post<{ Body: UserResolveBody }>(
		'/api/v1/users/resolve',
		{
			schema: {
				tags: ['Users'],
				summary: 'Resolves an user entry value, returning another value from the same user',
				response: {
					200: Swagger.replySchema('ok', userResolveSuccessData.shape.data).describe('Default response'),
					404: Swagger.replySchema('not_found').describe('No user found using the provided parameters'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors'),
				},
				body: userResolveBody,
			},
		},
		async (req, reply) => {
			const { input, output, value } = req.body

			let user: UserModel | null

			switch (input) {
				case 'email':
					user = await app.dbFuncs.users.findByEmail(value)
					break
				case 'id':
					user = await app.dbFuncs.users.findById(value)
					break
				case 'username':
					user = await app.dbFuncs.users.findByUsername(value)
					break
			}

			if (!user) throw new ServerError('err_user_not_found')

			let outputValue: string

			switch (output) {
				case 'email':
					outputValue = user.email
					break
				case 'id':
					outputValue = user._id.toHexString()
					break
				case 'username':
					outputValue = user.username
					break
			}

			return success<z.infer<typeof userResolveSuccessData.shape.data>>(req, reply, { code: 'ok', data: { output: outputValue } })
		},
	)
})
