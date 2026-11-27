import fp from 'fastify-plugin'

import { validateHCaptcha } from '@lib/validators/validateHCaptcha'
import { type EmailVerificationResendBody, emailVerificationResendBody } from '@schemas'

import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const emailVerificationResend = fp(async (fastify) => {
	fastify.post<{ Body: EmailVerificationResendBody }>(
		'/v1/email-verification/resend',
		{
			schema: {
				tags: ['E-mail Verification'],
				summary: 'Resends the verification e-mail to an user',
				response: {
					200: Swagger.replySchema('resend_verification_email_accepted').describe('Default response, meaning that the request is valid and it was accepted'),
					401: Swagger.replySchema('unauthorized').describe('Invalid captcha'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server'),
					503: Swagger.replySchema('service_unavailable').describe("Server's mailing service disabled momentarily"),
				},
				body: emailVerificationResendBody,
			},
		},
		async (req, reply) => {
			const { h, email } = req.body
			// Validate HCaptcha
			if (!fastify.env.DISABLE_CAPTCHA_VALIDATION) {
				const captchaSuccess = await validateHCaptcha(fastify, h.captcha.response)
				if (!captchaSuccess) throw new ServerError('err_captcha_validation')
			}

			const user = await fastify.db.users.findOne({ email })
			if (user && !user.emailVerified) {
				if (fastify.mailer && !fastify.env.DISABLE_MAIL_SERVICE) {
					// Issue e-mail token
					const { token } = await fastify.dbFuncs.emailTokens.issue(user._id, 'verify')

					const url = `${fastify.env.CLIENT_URL}/${fastify.env.CLIENT_VERIFY}`
					const link = `${url}/${encodeURIComponent(token)}`

					await fastify.mailer.sendMail({
						from: process.env.SMTP_FROM,
						to: user.email,
						subject: 'Confirm your email',
						text: `Confirm your email: ${link}`,
						html: `
      <p>Hi,</p>
      <p>Please confirm your email by clicking the link below:</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>This link expires in 60 minutes.</p>
    `,
					})
				} else {
					throw new ServerError('email_verification_disabled')
				}
			}

			return success(req, reply, 'resend_verification_email_accepted')
		},
	)
})
