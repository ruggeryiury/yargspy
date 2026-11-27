import fp from 'fastify-plugin'
import z from 'zod'

import { type UserLoginBody, userLoginBody, userLoginSuccessData } from '@schemas'

import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const userLogin = fp(async (fastify) => {
	fastify.post<{ Body: UserLoginBody }>(
		'/v1/users/login',
		{
			schema: {
				tags: ['Login/Register'],
				summary: 'Authenticates an user, returning an access token',
				body: userLoginBody,
				response: {
					200: Swagger.replySchema('ok', userLoginSuccessData.shape.data).describe('Default response'),
					401: Swagger.replySchema('unauthorized').describe('User with unverified e-mail, invalid credentials (password unmatched)'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server'),
					404: Swagger.replySchema('not_found').describe('User not found using the provided credentials'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors'),
				},
			},
		},
		async (req, reply) => {
			const { password, email } = req.body

			// Check the existence of the user. Unregistered, inactive (banned) and unverified users won't be able to login
			const user = await fastify.dbFuncs.users.findByEmail(email)
			if (!user) throw new ServerError('err_user_not_found')
			if (!user.active) throw new ServerError('err_banned_user')
			if (!user.emailVerified) throw new ServerError('err_email_not_verified')

			// Compare provided password with the hashed password, automatically throws error when the password doesn't match
			await fastify.dbFuncs.users.comparePasswordForLogin(password, user.password)

			// Sign a valid token to be used on subsequent requests from the user
			const token = fastify.dbFuncs.users.signToken(req, user)

			return success<z.infer<typeof userLoginSuccessData.shape.data>>(req, reply, { code: 'ok', data: { token } })
		},
	)
})
