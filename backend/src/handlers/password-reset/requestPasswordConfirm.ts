import fp from 'fastify-plugin'

import { validateHCaptcha } from '@lib/validators/validateHCaptcha'
import { type RequestPasswordConfirmBody, requestPasswordConfirmBody } from '@schemas'

import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const requestPasswordConfirm = fp(async (fastify) => {
	fastify.post<{ Body: RequestPasswordConfirmBody }>(
		'/v1/password-reset/confirm',
		{
			schema: {
				tags: ['Password Reset'],
				summary: 'Changes the password of an user using a password reset token',
				response: {
					200: Swagger.replySchema('ok').describe('Default response'),
					401: Swagger.replySchema('unauthorized').describe('Invalid captcha, invalid token for validation, unrequited password requirements'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server'),
				},
				body: requestPasswordConfirmBody,
			},
		},
		async (req, reply) => {
			const { h, password, token } = req.body

			// Validate HCaptcha
			if (!fastify.env.DISABLE_CAPTCHA_VALIDATION) {
				const captchaSuccess = await validateHCaptcha(fastify, h.captcha.response)
				if (!captchaSuccess) throw new ServerError('err_captcha_validation')
			}

			// Validate provided password with lowercase and uppercase letters, numbers, and symbols
			// This function automatically throws a ServerError if not valid
			if (!fastify.env.DISABLE_PASSWORD_VALIDATOR) fastify.dbFuncs.users.validateUserPassword(password)

			const document = await fastify.dbFuncs.emailTokens.consume(token, 'reset')
			if (!document) throw new ServerError('err_invalid_auth_token')

			const user = await fastify.dbFuncs.users.findById(document.user)
			if (!user) throw new ServerError('err_invalid_auth_token')
			if (!user.active) throw new ServerError('err_banned_user')

			// Hash the password using bcrypt
			const hashedPassword = await fastify.dbFuncs.users.hashPassword(password)

			// Save the hashed password
			await fastify.db.users.findOneAndUpdate({ _id: document._id }, { $set: { password: hashedPassword } })

			return success(req, reply, 'password_reset_success')
		},
	)
})
