import fp from 'fastify-plugin'

import { validateHCaptcha } from '@lib/validators/validateHCaptcha'
import { type RequestPasswordChangeBody, requestPasswordChangeBody } from '@schemas'

import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const requestPasswordChange = fp(async (fastify) => {
	fastify.post<{ Body: RequestPasswordChangeBody }>(
		'/v1/password-reset/change',
		{
			schema: {
				tags: ['Password Reset'],
				summary: 'Sends a password reset e-mail to an user',
				response: {
					200: Swagger.replySchema('resend_verification_email_accepted').describe('Default response, meaning that the request is valid and it was accepted'),
					401: Swagger.replySchema('unauthorized').describe('Invalid captcha'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server'),
					503: Swagger.replySchema('service_unavailable').describe("Server's mailing service disabled momentarily"),
				},
				body: requestPasswordChangeBody,
			},
		},
		async (req, reply) => {
			const { h, email } = req.body

			// Validate HCaptcha
			if (!fastify.env.DISABLE_CAPTCHA_VALIDATION) {
				const captchaSuccess = await validateHCaptcha(fastify, h.captcha.response)
				if (!captchaSuccess) throw new ServerError('err_captcha_validation')
			}

			const user = await fastify.db.users.findOne({ email, active: true })
			if (user) {
				if (fastify.mailer && !fastify.env.DISABLE_MAIL_SERVICE) {
					// Issue e-mail token
					const { token } = await fastify.dbFuncs.emailTokens.issue(user._id, 'reset')

					const url = `${fastify.env.CLIENT_URL}/#/${fastify.env.CLIENT_RESET}`
					const link = `${url}/${encodeURIComponent(token)}`

					await fastify.mailer.sendMail({
						to: email,
						subject: 'Reset your password',
						html: `
    <p>We received a request to reset your password.</p>
    <p><a href="${link}">Reset password</a></p>
    <p>If you didn't request this, you can ignore this email. The link expires in 30 minutes.</p>
    `,
						text: `Reset your password: ${link}`,
					})
				} else {
					throw new ServerError('reset_password_disabled')
				}
			}

			return success(req, reply, 'password_change_req_accepted')
		},
	)
})
