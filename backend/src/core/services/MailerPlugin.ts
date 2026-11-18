import fp from 'fastify-plugin'
import nodemailer, { type Mail } from 'nodemailer'

declare module 'fastify' {
	interface FastifyInstance {
		mailer?: Mail
	}
}

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
