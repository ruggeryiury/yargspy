import fp from 'fastify-plugin'
import { ZodError } from 'zod'

import type { GenericServerResponse } from '@schemas'

import { ServerError, httpCodes } from './ServerResponse'

/**
 * Formats the first Zod validation issue into a Fastify-compatible validation error response.
 * - - - -
 * @param {ZodError} error The Zod error containing the validation issue.
 * @param {string} [location] `OPTIONAL` The location of the validated data, such as `body`, `querystring`, or `params`. Default is `body`.
 * @returns {GenericServerResponse}
 */
export const formatZodValidationError = (error: ZodError, location: string = 'body'): GenericServerResponse => {
	const issue = error.issues[0]!

	const path = issue.path.map((value) => String(value)).join('/')

	return {
		statusCode: 422,
		statusName: 'Unprocessable Entity',
		code: 'validation_error',
		message: `${location}/${path} ${issue.message}`,
	}
}

/**
 * ## Error Handler Plugin
 * - - - -
 * Customizes the Fastify default error handler function to detect thrown `ServerError` instances. It also configures the 404 NOT FOUND routes.
 */
export const ErrorHandlers = fp((fastify, _, done) => {
	fastify.setErrorHandler((error, _, reply) => {
		console.error(error)
		if (error instanceof ServerError) {
			const responseData = {
				statusCode: error.statusCode,
				statusName: error.statusName,
				code: error.code,
				message: error.message,
			}
			return reply.status(responseData.statusCode).send(responseData)
		} else if (error instanceof ZodError) {
			const responseData = formatZodValidationError(error)
			return reply.status(responseData.statusCode).send(responseData)
		} else if (error instanceof Error && 'code' in error && 'statusCode' in error) {
			if (fastify.isDev() && JSON.parse(JSON.stringify(error)).cause?.message) console.log(JSON.parse(JSON.stringify(error)).cause?.message)
			const responseData = { statusCode: error.statusCode, statusName: httpCodes[error.statusCode as keyof typeof httpCodes], code: (error.code as string).toLowerCase(), message: error.message } as GenericServerResponse

			return reply.status(responseData.statusCode as number).send(responseData)
		} else if (error instanceof Error) {
			const responseData = { statusCode: 500, statusName: httpCodes[500], code: 'unknown_server_error', message: 'An unknown error has occurred', error: !fastify.isDev() ? undefined : { ...error } }
			return reply.status(responseData.statusCode).send(responseData)
		} else {
			const responseData = { statusCode: 500, statusName: httpCodes[500], code: 'unknown_server_error', message: 'An unknown error has occurred', error: !fastify.isDev() ? undefined : typeof error === 'object' ? { ...error } : undefined }

			return reply.status(responseData.statusCode).send(responseData)
		}
	})
	fastify.setNotFoundHandler(
		{
			preHandler: fastify.rateLimit({
				max: 20,
				timeWindow: 3600 * 2,
			}),
		},
		(req) => {
			throw new ServerError({ code: 'route_not_found', messageValues: { method: req.method, url: req.url } })
		},
	)
	done()
})
