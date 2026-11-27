import fp from 'fastify-plugin'

import { type EmailVerifyBody, emailVerifyBody } from '@schemas'

import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const emailVerify = fp(async (fastify) => {
	fastify.post<{ Body: EmailVerifyBody }>(
		'/v1/email-verification/verify',
		{
			schema: {
				tags: ['E-mail Verification'],
				summary: 'Verifies an user account by its e-mail verification token',
				response: {
					200: Swagger.replySchema('ok').describe('Default response'),
					401: Swagger.replySchema('unauthorized').describe('Invalid token for verification'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server'),
				},
				body: emailVerifyBody,
			},
		},
		async (req, reply) => {
			const { token } = req.body

			const document = await fastify.dbFuncs.emailTokens.consume(token, 'verify')
			if (!document) throw new ServerError('err_invalid_auth_token')

			const user = await fastify.dbFuncs.users.findById(document._id)
			if (!user) throw new ServerError('err_invalid_auth_token')

			if (!user.active) throw new ServerError('err_banned_user')
			if (!user.emailVerified) await fastify.db.users.findOneAndUpdate({ _id: user._id }, { $set: { emailVerified: true } })

			return success(req, reply, 'email_verification_success')
		},
	)
})
