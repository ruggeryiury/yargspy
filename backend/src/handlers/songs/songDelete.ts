import fp from 'fastify-plugin'

import { type GenericIdParams, type SongDeleteQuerystring, genericIdParams, songDeleteQuerystring } from '@schemas'

import { YARGSPY } from '../../constants'
import { userBearerAuth } from '../../core/services/Auth'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const songDelete = fp(async (fastify) => {
	fastify.delete<{ Params: GenericIdParams; Querystring: SongDeleteQuerystring }>(
		'/api/v1/songs/:id',
		{
			schema: {
				tags: ['Songs'],
				summary: 'Deletes a song entry, its files and all scores entries related to it from the server',
				description: '_This route needs administrator rights to access it._',
				response: {
					204: Swagger.replySchema('ok_delete_entry').describe('Default response'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server, or with no administrator rights'),
					404: Swagger.replySchema('not_found').describe('Song not found using the provided ID'),
					422: Swagger.replySchema('validation_error').describe('No reason provided, wrong entry ID format'),
				},
				querystring: songDeleteQuerystring,
				params: genericIdParams,
				security: [
					{
						bearerAuth: [],
					},
				],
			},
			preHandler: fastify.auth([userBearerAuth({ admin: true })]),
		},
		async (req, reply) => {
			const { id: songId } = req.params
			const { reason } = req.query

			const song = await fastify.db.songs.findOne({ _id: new fastify.mongo.ObjectId(songId) })
			if (!song) throw new ServerError('err_song_not_found')

			// fetch scores for the song; delete their replay file (if it exists), and the DB entries
			const scores = await fastify.db.scores.find({ song: song._id }).toArray()
			for (const score of scores) {
				const replayFile = fastify.fs.getReplayFile(score.replayPath)
				if (replayFile.exists) await replayFile.delete()
				await fastify.db.scores.findOneAndDelete({ _id: score._id })
			}

			// after deleting the scores, delete the chart file and the song's DB entry
			const chartFilePath = fastify.fs.getChartFile(song)
			if (chartFilePath.exists) await chartFilePath.delete()
			await fastify.db.songs.findOneAndDelete({ _id: song._id })

			// No await, this can be done async
			fastify.db.adminLogs.insertOne({
				_id: new fastify.mongo.ObjectId(),
				admin: req.userDocument._id,
				action: YARGSPY.AdminAction.SongDelete,
				item: new fastify.mongo.ObjectId(songId),
				createdAt: new Date(),
				reason,
			})

			return success(req, reply, 'ok_delete_entry')
		},
	)
})
