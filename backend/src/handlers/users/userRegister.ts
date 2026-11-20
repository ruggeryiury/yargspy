import fp from 'fastify-plugin'
import { MongoServerError } from 'mongodb'
import type z from 'zod'

import { leadingArticleToTrailing } from '@lib/dta-parser/dta/textMethods'
import { normalizeStr } from '@lib/utils/strnum'
import { validateHCaptcha } from '@lib/validators/validateHCaptcha'
import { type UserRegisterBody, userRegisterBody } from '@schemas'

import { userModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const userRegister = fp((fastify, _, done) => {
	fastify.post<{ Body: UserRegisterBody }>(
		'/v1/users/register',
		{
			schema: {
				tags: ['Login/Register'],
				summary: 'Registers a new user',
				body: userRegisterBody,
				response: {
					201: Swagger.replySchema('created').describe('Default response'),
					401: Swagger.replySchema('unauthorized').describe('Invalid captcha, unrequited password requirements'),
					409: Swagger.replySchema('conflict').describe('Duplicated e-mail or username'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors'),
				},
			},
		},
		async (req, reply) => {
			const { email, h, password, username } = req.body

			// Validate HCaptcha
			if (!fastify.env.DISABLE_CAPTCHA_VALIDATION) {
				const captchaSuccess = await validateHCaptcha(fastify, h.captcha.response)
				if (!captchaSuccess) throw new ServerError('err_captcha_validation')
			}
			// Validate provided password with lowercase and uppercase letters, numbers, and symbols
			// This function automatically throws a ServerError if not valid
			if (!fastify.env.DISABLE_PASSWORD_VALIDATOR) fastify.dbFuncs.users.validateUserPassword(password)

			// Hash the password using bcrypt
			const hashedPassword = await fastify.dbFuncs.users.hashPassword(password)

			// Assign a country for the registered user
			let country: z.infer<typeof userModel.shape.country>
			if (req.headers['cf-ipcountry']) country = req.headers['cf-ipcountry'] === 'T1' ? 'XX' : (req.headers['cf-ipcountry'] as string)
			else country = (req.headers['cloudfront-viewer-country'] as string | undefined) ?? 'XX'

			try {
				const now = new Date()
				const document = await fastify.db.users.insertOne({ _id: new fastify.mongo.ObjectId(), username, usernameSearch: normalizeStr(username), usernameSort: leadingArticleToTrailing(normalizeStr(username)), email, password: hashedPassword, active: true, admin: false, createdAt: now, updatedAt: now, country, emailVerified: !fastify.env.DISABLE_MAIL_SERVICE })

				if (fastify.mailer && !fastify.env.DISABLE_MAIL_SERVICE) {
					// Issue e-mail token
					const { token } = await fastify.dbFuncs.emailTokens.issue(document.insertedId, 'verify')

					const url = `${fastify.env.CLIENT_URL}/${fastify.env.CLIENT_VERIFY}`
					const link = `${url}/${encodeURIComponent(token)}`

					await fastify.mailer.sendMail({
						from: process.env.SMTP_FROM,
						to: email,
						subject: 'Confirm your email',
						text: `Confirm your email: ${link}`,
						html: `
      <p>Hi,</p>
      <p>Please confirm your email by clicking the link below:</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>This link expires in 60 minutes.</p>
    `,
					})
				}

				return success(req, reply, 'created')
			} catch (err) {
				if (err instanceof MongoServerError && err.code === 11000) {
					console.log(err)
					if (typeof err.keyValue.email === 'string') throw new ServerError({ code: 'err_register_duplicated_email', messageValues: { email: err.keyValue.email as string } })
					else if (typeof err.keyValue.username === 'string') throw new ServerError({ code: 'err_register_duplicated_username', messageValues: { username: err.keyValue.email as string } })
				}

				throw new ServerError({ code: 'unknown_server_error' })
			}
		},
	)
	done()
})
