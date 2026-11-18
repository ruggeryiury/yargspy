import fp from 'fastify-plugin'

import type { ServerEnvObject } from '@schemas'

declare module 'fastify' {
	interface FastifyInstance {
		// NodeEnv Plugin
		// src/app/plguins/nodeEnv.ts

		/**
		 * An object with parsed values from the `.env` file.
		 */
		env: ServerEnvObject
		/**
		 * Returns `true` is the environment is in development mode, false otherwise. The flag can be passed in the script execution argument level using `cross-env`.
		 *
		 * ```sh
		 * pnpm add cross-env tsx -D
		 * cross-env NODE_ENV=development tsx watch ./src/index.ts"
		 * ```
		 * - - - -
		 * @returns {boolean}
		 */
		isDev: () => boolean
	}
}

/**
 * ## Environment Plugin
 * - - - -
 * Populates the `fastify` instance with the environment variables and a `isDev` function. For `isDev` to work properly you need to set the environment variable `NODE_ENV` properly when running the script.
 *
 * ```sh
 * pnpm add cross-env tsx -D
 * cross-env NODE_ENV=development tsx watch ./src/index.ts"
 * ```
 */
export const ServerEnv = fp((fastify, _, done) => {
	fastify.decorate('env', fastify.getEnvs<ServerEnvObject>())
	fastify.decorate('isDev', function isDev(): boolean {
		const nodeEnv = (fastify.getEnvs<ServerEnvObject>().NODE_ENV as 'development' | 'production' | undefined) ?? 'production'
		return nodeEnv === 'development'
	})
	done()
})
