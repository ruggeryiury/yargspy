import type { FastifyInstance } from 'fastify'

import { adminEntries } from '../../handlers/admin/adminEntries'
import { scoreDelete } from '../../handlers/scores/scoreDelete'
import { getSongLeaderboards } from '../../handlers/songs/getLeaderboards'
import { getSongDetails } from '../../handlers/songs/getSongDetails'
import { songDelete } from '../../handlers/songs/songDelete'
import { songRegister } from '../../handlers/songs/songRegister'
import { songResolve } from '../../handlers/songs/songResolve'
import { songUpdate } from '../../handlers/songs/songUpdate'
import { getUserDetails } from '../../handlers/users/getUserDetails'
import { patchUserStatus } from '../../handlers/users/patchUserStatus'
import { userLogin } from '../../handlers/users/userLogin'
import { userRegister } from '../../handlers/users/userRegister'
import { userResolve } from '../../handlers/users/userResolve'
import { userScores } from '../../handlers/users/userScores'

export class ServerRoutes {
	static async init(app: FastifyInstance) {
		// Admin
		await app.register(adminEntries)

		// Scores
		await app.register(scoreDelete)

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
		// await app.register(userEntries)
		await app.register(userLogin)
		await app.register(userRegister)
		await app.register(userResolve)
		await app.register(userScores)
	}
}
