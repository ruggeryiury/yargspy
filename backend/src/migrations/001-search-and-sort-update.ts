import type { FastifyInstance } from 'fastify'
import type { AnyBulkWriteOperation } from 'mongodb'

import { leadingArticleToTrailing } from '@lib/dta-parser/dta/textMethods'
import { normalizeStr } from '@lib/utils/strnum'

import type { AdminLogModel, ScoreModel, SongModel, UserModel } from '../core/services/Database'

/*
----------------------------------------
Migration #001
- Adds normalized search and sort values
- Force lowercase e-mail
- Force year to number
- Remove "Unknown Charter" from 'charter', "Unknown Year" and other non-number year from 'year', "Unknown Album" for 'album'
- Remove "color" HTML tags inherited from INI files
- Remove "__v" value on all collections (unused on Fastify MongoDB plugin)
----------------------------------------
*/
export const searchAndSortUpdate001 = async (app: FastifyInstance) => {
	const adminLogsCount = await app.db.adminLogs.countDocuments()

	const adminLogOperations: AnyBulkWriteOperation<AdminLogModel>[] = []
	console.log(`[admin_logs] | (UNSET) Iterating through ${adminLogsCount} entr${adminLogsCount === 1 ? 'y' : 'ies'}...`)
	const adminLogCursor = app.db.adminLogs.find()

	for await (const admin of adminLogCursor) {
		adminLogOperations.push({
			updateOne: {
				filter: { _id: admin._id },
				update: { $unset: { __v: true } },
			},
		})

		// Execute in batches of 500
		if (adminLogOperations.length >= 500) {
			await app.db.adminLogs.bulkWrite(adminLogOperations)
			adminLogOperations.length = 0
		}
	}

	// Execute remaining operations
	if (adminLogOperations.length > 0) {
		await app.db.adminLogs.bulkWrite(adminLogOperations)
		adminLogOperations.length = 0
	}

	// ------------------------------------------------------------------------------------------------------------------------------
	const scoreCount = await app.db.scores.countDocuments()

	const scoreOperations: AnyBulkWriteOperation<ScoreModel>[] = []
	console.log(`[scores] | (UNSET) Iterating through ${scoreCount} entr${scoreCount === 1 ? 'y' : 'ies'}...`)
	const scoreCursor = app.db.scores.find()

	for await (const score of scoreCursor) {
		scoreOperations.push({
			updateOne: {
				filter: { _id: score._id },
				update: { $unset: { __v: true } },
			},
		})

		// Execute in batches of 500
		if (scoreOperations.length >= 500) {
			await app.db.scores.bulkWrite(scoreOperations)
			scoreOperations.length = 0
		}
	}

	// Execute remaining operations
	if (scoreOperations.length > 0) {
		await app.db.scores.bulkWrite(scoreOperations)
		scoreOperations.length = 0
	}

	// ------------------------------------------------------------------------------------------------------------------------------

	const usersCount = await app.db.users.countDocuments()

	const userOperations: AnyBulkWriteOperation<UserModel>[] = []
	console.log(`[users] | (UNSET) Iterating through ${usersCount} entr${usersCount === 1 ? 'y' : 'ies'}...`)
	const userCursor = app.db.users.find()

	for await (const user of userCursor) {
		userOperations.push({
			updateOne: {
				filter: { _id: user._id },
				update: {
					$unset: {
						__v: true,
					},
				},
			},
		})

		// Execute in batches of 500
		if (userOperations.length >= 500) {
			await app.db.users.bulkWrite(userOperations)
			userOperations.length = 0
		}
	}

	// Execute remaining operations
	if (userOperations.length > 0) {
		await app.db.users.bulkWrite(userOperations)
		userOperations.length = 0
	}

	const userOperations2: AnyBulkWriteOperation<UserModel>[] = []
	console.log(`[users] | (SET) Iterating through ${usersCount} entr${usersCount === 1 ? 'y' : 'ies'}...`)
	const userCursor2 = app.db.users.find()

	for await (const user of userCursor2) {
		userOperations2.push({
			updateOne: {
				filter: { _id: user._id },
				update: {
					$set: {
						usernameSearch: normalizeStr(user.username),
						usernameSort: leadingArticleToTrailing(normalizeStr(user.username)),
						email: user.email.toLowerCase(),
					},
				},
			},
		})

		// Execute in batches of 500
		if (userOperations2.length >= 500) {
			await app.db.users.bulkWrite(userOperations2)
			userOperations2.length = 0
		}
	}

	// Execute remaining operations
	if (userOperations2.length > 0) {
		await app.db.users.bulkWrite(userOperations2)
		userOperations2.length = 0
	}

	// ------------------------------------------------------------------------------------------------------------------------------

	const songsCount = await app.db.songs.countDocuments()
	console.log(`[songs] | (UNSET) Iterating through ${songsCount} entr${songsCount === 1 ? 'y' : 'ies'}...`)

	const songOperations: AnyBulkWriteOperation<SongModel>[] = []
	const songCursor = app.db.songs.find()

	for await (const song of songCursor) {
		const unset: Partial<Record<keyof SongModel | '__v', true>> = { __v: true }
		if (song.charter && song.charter.toLowerCase() === 'unknown charter') {
			unset.charter = true
			unset.charterSearch = true
			unset.charterSort = true
		}
		if (song.album && song.album.toLowerCase() === 'unknown album') {
			unset.album = true
			unset.albumSearch = true
			unset.albumSort = true
		}
		if (song.year && Number.isNaN(Number(song.year))) unset.year = true

		if (Object.keys(unset).length > 0) {
			songOperations.push({
				updateOne: {
					filter: { _id: song._id },
					update: {
						$unset: unset,
					},
				},
			})
		}

		// Execute in batches of 500
		if (songOperations.length >= 500) {
			await app.db.songs.bulkWrite(songOperations)
			songOperations.length = 0
		}
	}

	// Execute remaining operations
	if (songOperations.length > 0) {
		await app.db.songs.bulkWrite(songOperations)
		songOperations.length = 0
	}

	console.log(`[songs] | (SET) Iterating through ${songsCount} entr${songsCount === 1 ? 'y' : 'ies'}...`)

	const songOperations2: AnyBulkWriteOperation<SongModel>[] = []
	const songCursor2 = app.db.songs.find()

	for await (const song of songCursor2) {
		songOperations2.push({
			updateOne: {
				filter: { _id: song._id },
				update: {
					$set: {
						nameSearch: normalizeStr(song.name),
						nameSort: leadingArticleToTrailing(normalizeStr(song.name)),
						artistSearch: normalizeStr(song.artist),
						artistSort: leadingArticleToTrailing(normalizeStr(song.artist)),
						charter: song.charter ? song.charter.replace(/<\/?color(?:=[^>]*)?>/g, '') : undefined,
						charterSearch: song.charter ? normalizeStr(song.charter?.replace(/<\/?color(?:=[^>]*)?>/g, '')) : undefined,
						charterSort: song.charter ? leadingArticleToTrailing(normalizeStr(song.charter?.replace(/<\/?color(?:=[^>]*)?>/g, ''))) : undefined,
						album: song.album ? song.album.replace(/<\/?color(?:=[^>]*)?>/g, '') : undefined,
						albumSearch: song.album ? normalizeStr(song.album?.replace(/<\/?color(?:=[^>]*)?>/g, '')) : undefined,
						albumSort: song.album ? leadingArticleToTrailing(normalizeStr(song.album?.replace(/<\/?color(?:=[^>]*)?>/g, ''))) : undefined,
						year: !Number.isNaN(Number(song.year)) ? Number(song.year) : undefined,
					},
				},
			},
		})

		// Execute in batches of 500
		if (songOperations2.length >= 500) {
			await app.db.songs.bulkWrite(songOperations2)
			songOperations2.length = 0
		}
	}

	// Execute remaining operations
	if (songOperations2.length > 0) {
		await app.db.songs.bulkWrite(songOperations2)
		songOperations2.length = 0
	}
}
