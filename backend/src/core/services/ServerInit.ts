import type { FastifyInstance } from 'fastify'
import { DirPath } from 'node-lib'
import z from 'zod'

import authPlugin from '@fastify/auth'
import corsPlugin from '@fastify/cors'
import envPlugin from '@fastify/env'
import jwtPlugin from '@fastify/jwt'
import mongodbPlugin from '@fastify/mongodb'
import multipartPlugin from '@fastify/multipart'
import rateLimitPlugin from '@fastify/rate-limit'
import staticPlugin from '@fastify/static'
import swaggerPlugin from '@fastify/swagger'
import swaggerUIPlugin from '@fastify/swagger-ui'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from '@fastify/type-provider-zod'
import { type ServerEnvObject, serverEnvObject } from '@schemas'

import { DatabasePlugin } from './Database'
import { ErrorHandlers } from './ErrorHandlers'
import { FileSystem } from './FileSystem'
import { MailerPlugin } from './MailerPlugin'
import { ServerEnv } from './ServerEnv'
import { ServerError } from './ServerResponse'

/**
 * A class with static methods that initializes all the server's functionality.
 */
export class ServerInit {
	/**
	 * Settles the server's schema validator and serializer.
	 * - - - -
	 * @param {FastifyInstance} app The Fastify instance of the server.
	 */
	static initSerializersAndValidators(app: FastifyInstance): void {
		// Validator and serizalizer init
		app.setValidatorCompiler(validatorCompiler)
		app.setSerializerCompiler(serializerCompiler)
	}

	/**
	 * Initializes all the official plugins from the Fastify ecosystem.
	 * - - - -
	 * @param {FastifyInstance} app The Fastify instance of the server.
	 */
	static async initFastifyEcosystemPlugins(app: FastifyInstance): Promise<void> {
		// Validate env
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { $schema: _, ...envSchema } = z.toJSONSchema(serverEnvObject)
		try {
			await app.register(envPlugin, { dotenv: true, schema: envSchema })
		} catch (err) {
			if (err && typeof err === 'object' && 'message' in err) {
				console.error(`ERROR: ${err.message}\nThis error happens when some Zod schema type adds values that is not compatible with the Fastify .env plugin, try to keep the typing simplified for the schema itself and validate specific attributes outside of schema`)
			}
			process.exit(1)
		}

		await app.register(mongodbPlugin, { url: 'mongodb://localhost:27017/yargspy', forceClose: true, ignoreUndefined: true })
		await app.register(jwtPlugin, { secret: app.getEnvs<ServerEnvObject>().JWT_SECRET })
		await app.register(authPlugin)
		await app.register(multipartPlugin)
		await app.register(staticPlugin, {
			root: DirPath.of(process.cwd()).gotoDir('files/replay').path,
			prefix: '/file/replay',
		})
		await app.register(corsPlugin, {
			origin: app.getEnvs<ServerEnvObject>().NODE_ENV === 'development' ? true : ['https://beta.yargspy.com'],
			methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		})
		await app.register(rateLimitPlugin, {
			max: 50,
			timeWindow: 3600 * 1, // 1 Minute
			errorResponseBuilder(_, context) {
				throw new ServerError({ code: 'TOO_MANY_REQUESTS', messageValues: { count: context.after } })
			},
		})
	}

	/**
	 * Initializes all the plugins created specifically for the server.
	 * - - - -
	 * @param {FastifyInstance} app The Fastify instance of the server.
	 */
	static async initServerEcosystemPlugins(app: FastifyInstance) {
		await app.register(ServerEnv)
		await app.register(DatabasePlugin)
		await app.register(ErrorHandlers)
		await app.register(MailerPlugin)
		await app.register(FileSystem.plugin)
	}

	/**
	 * Initializes the Swagger documentation page plugin.
	 * - - - -
	 * @param {FastifyInstance} app The Fastify instance of the server.
	 */
	static async initSwaggerUI(app: FastifyInstance) {
		if (app.isDev === undefined) throw new Error('Swagger Plugin init error: NodeEnvPlugin needs to be initialized, please init ServerInit.initServerPlugins() and make sure NoveEnvPlugin is initialized there')
		if (app.isDev()) {
			await app.register(swaggerPlugin, {
				openapi: {
					openapi: '3.0.0',
					info: {
						title: 'YARGSpy API',
						version: '0.1.0',
						description: 'An unofficial YARG leaderboard with REPLAY file validation.',
					},
					servers: [{ url: 'http://localhost:5000', description: 'Development server' }],
					tags: [
						{ name: 'Login/Register', description: 'Endpoints to register and authorize users to the system' },
						{ name: 'E-mail Verification', description: 'Endpoints to verify and resend verification tokens' },
						{ name: 'Password Reset', description: 'Endpoints to change and confirm password reset requests' },
						{ name: 'Admin', description: 'Endpoints related to administrator data and operations' },
						{ name: 'Users', description: 'Endpoints related to user data and operations' },
						{ name: 'Scores', description: 'Endpoints related to score data and operations' },
						{ name: 'Songs', description: 'Endpoints related to song data and operations' },
					],
					components: {
						securitySchemes: {
							bearerAuth: {
								type: 'http',
								scheme: 'bearer',
								bearerFormat: 'JWT',
							},
						},
					},
				},
				transform: jsonSchemaTransform,
			})
			await app.register(swaggerUIPlugin, {
				routePrefix: '/docs',
				uiConfig: { persistAuthorization: true },
			})
		}
	}

	/**
	 * Initializes all the server systems.
	 * - - - -
	 * @param {FastifyInstance} app The Fastify instance of the server.
	 */
	static async init(app: FastifyInstance) {
		this.initSerializersAndValidators(app)
		await this.initFastifyEcosystemPlugins(app)
		await this.initServerEcosystemPlugins(app)
		await this.initSwaggerUI(app)
	}
}
