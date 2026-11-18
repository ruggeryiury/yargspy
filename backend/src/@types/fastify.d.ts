import type { DecodedUserTokenObject, SignedUserTokenObject } from '@schemas'

declare module '@fastify/jwt' {
	interface FastifyJWT {
		/**
		 * The document schema accepted to be signed for a registered user.
		 */
		payload: SignedUserTokenObject
		/**
		 * The parsed `DecodedUserToken` object, decoded from bearer authorization header.
		 */
		user: DecodedUserTokenObject
	}
}
