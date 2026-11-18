import { useDefaultOptions } from 'use-default-options'

import type { FastifyAuthFunction } from '@fastify/auth'

import type { UserModel } from './Database'
import { ServerError } from './ServerResponse'

declare module 'fastify' {
	interface FastifyRequest {
		/**
		 * User document schema populated only on routes which uses `userBearerAuth` authorization handlers.
		 */
		userDocument: UserModel
	}
}

export interface UserBearerAuthFunctionOptions {
	/**
	 * Let only admin users to access the route. Default is `false`.
	 */
	admin?: boolean
	/**
	 * Let only active (non-banned) users to access the route. Default is `true`.
	 */
	active?: boolean
	/**
	 * Let only verified users to access the route. Default is `false`.
	 */
	verified?: boolean
}

/**
 * A wrapper that generates bearer authorization functions for a specific route. Returns a new function that handlers bearer token authorization.
 * - - - -
 * @param {UserBearerAuthFunctionOptions} [options] `OPTIONAL` An object with options that tweaks the generated authorization function rules of the returned authorization function.
 * @returns {FastifyAuthFunction}
 */
export const userBearerAuth = (options?: UserBearerAuthFunctionOptions): FastifyAuthFunction => {
	const { active, admin, verified } = useDefaultOptions<UserBearerAuthFunctionOptions>({ admin: false, active: true, verified: false }, options)
	return async (req) => {
		await req.jwtVerify()

		if (!req.user) throw new ServerError('err_auth_token')

		const user = await req.server.db.users.findOne({
			_id: new req.server.mongo.ObjectId(req.user.sub),
		})
		if (!user) throw new ServerError('err_auth_token')
		if (active && !user.active) throw new ServerError('err_banned_user')
		if (verified && !user.emailVerified) throw new ServerError({ code: 'err_unverified_user' })
		if (admin && !user.admin) throw new ServerError({ code: 'forbidden' })

		req.setDecorator('userDocument', user)
	}
}
