import fp from 'fastify-plugin'
import type z from 'zod'

import { type GenericIdParams, type ScoreDeleteQuerystring, genericIdParams, scoreDeleteQuerystring, scoreDeleteSuccessData } from '@schemas'

import { YARGSPY } from '../../constants'
import { userBearerAuth } from '../../core/services/Auth'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const scoreDelete = fp(async (fastify) => {
	fastify.delete<{ Params: GenericIdParams; Querystring: ScoreDeleteQuerystring }>(
		'/v1/scores/:id',
		{
			schema: {
				tags: ['Scores'],
				summary: 'Deletes a score entry, its REPLAY file and all scores entries related to it from the server',
				description: '_This route needs administrator rights to access it._',
				response: {
					204: Swagger.replySchema('ok_delete_entry', scoreDeleteSuccessData.shape.data).describe('Default response'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server, or with no administrator rights'),
					404: Swagger.replySchema('not_found').describe('Score not found using the provided ID'),
					422: Swagger.replySchema('validation_error').describe('No reason provided, wrong entry ID format'),
				},
				params: genericIdParams,
				querystring: scoreDeleteQuerystring,
				security: [
					{
						bearerAuth: [],
					},
				],
			},
			preHandler: fastify.auth([userBearerAuth({ admin: true })]),
		},
		async (req, reply) => {
			const { id: scoreId } = req.params
			const { reason } = req.query

			const score = await fastify.dbFuncs.scores.findById(scoreId)
			if (!score) throw new ServerError('err_score_not_found')

			// Delete replay file
			if (fastify.isDev() || fastify.env.FILE_ROOT) {
				const replayFile = fastify.fs.getReplayFile(score.replayPath)
				if (replayFile.exists) await replayFile.delete()
			} else {
				// TODO: on prod, delete file in S3
			}

			// (DB) delete scores associated to that replay file, and update song player count
			const result = await fastify.db.scores.deleteMany({ replayPath: score.replayPath })

			// No await, this can be done async
			fastify.dbFuncs.songs.findById(score.song).then((song) => {
				if (song) fastify.dbFuncs.songs.updateSongPlayCount(song._id)
				fastify.db.adminLogs.insertOne({
					_id: new fastify.mongo.ObjectId(),
					admin: req.userDocument._id,
					action: YARGSPY.AdminLogAction.ScoreDelete,
					item: new fastify.mongo.ObjectId(scoreId),
					createdAt: new Date(),
					reason,
				})
			})

			return success<z.infer<typeof scoreDeleteSuccessData.shape.data>>(req, reply, { code: 'ok_delete_entry', data: { count: result.deletedCount } })
		},
	)
})
