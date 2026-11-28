import type { FastifyInstance } from 'fastify'

import { adminEntries } from '../../handlers/admin/adminEntries'
import { emailVerificationResend } from '../../handlers/email-verification/emailVerificationResend'
import { emailVerify } from '../../handlers/email-verification/emailVerify'
import { requestPasswordChange } from '../../handlers/password-reset/requestPasswordChange'
import { requestPasswordConfirm } from '../../handlers/password-reset/requestPasswordConfirm'
import { scoreDelete } from '../../handlers/scores/scoreDelete'
import { scoreRegister } from '../../handlers/scores/scoreRegister'
import { getSongLeaderboards } from '../../handlers/songs/getLeaderboards'
import { getSongDetails } from '../../handlers/songs/getSongDetails'
import { songDelete } from '../../handlers/songs/songDelete'
import { songRegister } from '../../handlers/songs/songRegister'
import { songResolve } from '../../handlers/songs/songResolve'
import { songUpdate } from '../../handlers/songs/songUpdate'
import { getUserDetails } from '../../handlers/users/getUserDetails'
import { patchUserStatus } from '../../handlers/users/patchUserStatus'
import { userEntries } from '../../handlers/users/userEntries'
import { userLogin } from '../../handlers/users/userLogin'
import { userRegister } from '../../handlers/users/userRegister'
import { userResolve } from '../../handlers/users/userResolve'
import { userScores } from '../../handlers/users/userScores'

/**
 * A class with static methods related to server routing.
 */
export class ServerRoutes {
	/**
	 * Initializes all the server routes.
	 * - - - -
	 * @param {FastifyInstance} app The Fastify instance of the server.
	 */
	static async init(app: FastifyInstance) {
		// Admin
		await app.register(adminEntries)

		// E-mail verification
		await app.register(emailVerificationResend)
		await app.register(emailVerify)

		// Password reset
		await app.register(requestPasswordChange)
		await app.register(requestPasswordConfirm)

		// Scores
		await app.register(scoreDelete)
		await app.register(scoreRegister)

		// Songs
		await app.register(getSongDetails)
		await app.register(getSongLeaderboards)
		await app.register(songDelete)
		await app.register(songRegister)
		await app.register(songResolve)
		await app.register(songUpdate)

		// Users
		await app.register(getUserDetails)
		await app.register(patchUserStatus)
		await app.register(userEntries)
		await app.register(userLogin)
		await app.register(userRegister)
		await app.register(userResolve)
		await app.register(userScores)
	}
}
