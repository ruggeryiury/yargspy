import fp from 'fastify-plugin'
import type z from 'zod'

import { type GenericIdParams, type SongUpdateBody, genericIdParams, songUpdateBody, songUpdateSuccessData } from '@schemas'

import { YARGSPY } from '../../constants'
import { userBearerAuth } from '../../core/services/Auth'
import type { SongModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const songUpdate = fp(async (app) => {
	app.patch<{ Body: SongUpdateBody; Params: GenericIdParams }>(
		'/v1/songs/:id',
		{
			schema: {
				tags: ['Songs'],
				summary: 'Updates entry values from a specific song',
				description: '_This route needs administrator rights to access it. All body values are optional for updating._',
				response: {
					200: Swagger.replySchema('ok', songUpdateSuccessData.shape.data).describe('Default response'),
					400: Swagger.replySchema('bad_request').describe('No fields provided for update'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server, or with no administrator rights'),
					404: Swagger.replySchema('not_found').describe('Song not found using the provided ID'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors, wrong entry ID format'),
				},
				body: songUpdateBody,
				params: genericIdParams,
				security: [
					{
						bearerAuth: [],
					},
				],
			},
			preHandler: app.auth([userBearerAuth({ admin: true })]),
		},
		async (req, reply) => {
			if (Object.keys(req.body).length === 0) throw new ServerError('err_update_no_value')
			const { id: songId } = req.params
			const { album, artist, charter, fiveLaneDrums, hopoFrequency, multiplierNote, name, proDrums, reason, sustainCutoffThreshold, year } = req.body

			const song = await app.dbFuncs.songs.findById(songId)
			if (!song) throw new ServerError('err_song_not_found')

			const songUpdate: Partial<SongModel> = {}

			if (name !== undefined) songUpdate.name = name
			if (artist !== undefined) songUpdate.artist = artist
			if (charter !== undefined) songUpdate.charter = charter
			if (album !== undefined) songUpdate.album = album
			if (year !== undefined) songUpdate.year = year
			if (proDrums !== undefined) songUpdate.proDrums = proDrums
			if (fiveLaneDrums !== undefined) songUpdate.fiveLaneDrums = fiveLaneDrums
			if (sustainCutoffThreshold !== undefined) songUpdate.sustainCutoffThreshold = sustainCutoffThreshold
			if (hopoFrequency !== undefined) songUpdate.hopoFrequency = hopoFrequency
			if (multiplierNote !== undefined) songUpdate.multiplierNote = multiplierNote

			await app.db.songs.updateOne({ _id: new app.mongo.ObjectId(songId) }, songUpdate)

			await app.db.adminLogs.insertOne({
				_id: new app.mongo.ObjectId(),
				admin: req.userDocument._id,
				action: YARGSPY.AdminLogAction.SongUpdate,
				item: song._id,
				createdAt: new Date(),
				reason,
			})

			return success<z.infer<typeof songUpdateSuccessData.shape.data>>(req, reply, { code: 'ok', data: { song: songId } })
		},
	)
})
