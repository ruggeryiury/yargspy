import fp from 'fastify-plugin'
import nodemailer, { type Mail } from 'nodemailer'

declare module 'fastify' {
	interface FastifyInstance {
		mailer?: Mail
	}
}

/**
 * ## Mailer Plugin
 *
 * Creates a NodeMailer's instance with configurations provided on the server's environment variables and serve it as a server's decorator.
 */
export const MailerPlugin = fp(async (fastify) => {
	if (!fastify.env.DISABLE_MAIL_SERVICE) {
		const transporter = nodemailer.createTransport({
			host: fastify.env.SMTP_HOST,
			port: fastify.env.SMTP_PORT,
			secure: fastify.env.SMTP_SECURE,
			auth: {
				user: fastify.env.SMTP_USERNAME,
				pass: fastify.env.SMTP_PASSWORD,
			},
		})

		// Optional: verify SMTP configuration on startup
		await transporter.verify()

		fastify.decorate('mailer', transporter)
	}
})
