import type { FastifyInstance } from 'fastify'
import type { AnyBulkWriteOperation } from 'mongodb'

import { leadingArticleToTrailing } from '@lib/dta-parser/dta/textMethods'
import { normalizeStr } from '@lib/utils/strnum'

import type { SongModel, UserModel } from '../core/services/Database'

/*
----------------------------------------
Migration #001
- Adds normalized search and sort values
- Force lowercase e-mail
----------------------------------------
*/
export const searchAndSortUpdate001 = async (app: FastifyInstance) => {
	const userOperations: AnyBulkWriteOperation<UserModel>[] = []
	const userCursor = app.db.users.find({
		$or: [{ usernameSearch: { $exists: false } }, { usernameSort: { $exists: false } }],
	})

	for await (const user of userCursor) {
		userOperations.push({
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

	const songOperations: AnyBulkWriteOperation<SongModel>[] = []
	const songCursor = app.db.songs.find({
		$or: [{ nameSearch: { $exists: false } }, { nameSort: { $exists: false } }, { artistSearch: { $exists: false } }, { artistSort: { $exists: false } }, { albumSearch: { $exists: false } }, { album: { $exists: false } }],
	})

	for await (const song of songCursor) {
		songOperations.push({
			updateOne: {
				filter: { _id: song._id },
				update: {
					$set: {
						nameSearch: normalizeStr(song.name),
						nameSort: leadingArticleToTrailing(normalizeStr(song.name)),
						artistSearch: normalizeStr(song.artist),
						artistSort: leadingArticleToTrailing(normalizeStr(song.artist)),
						albumSearch: song.album ? normalizeStr(song.album) : undefined,
						albumSort: song.album ? leadingArticleToTrailing(normalizeStr(song.album)) : undefined,
					},
				},
			},
		})

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
}
