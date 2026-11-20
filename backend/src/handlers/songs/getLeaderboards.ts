import fp from 'fastify-plugin'
import z from 'zod'

import { type GenericIdParams, genericIdParams, genericPaginationObject, genericServerResponse } from '@schemas'

import { YARGSPY } from '../../constants'
import { type ScoreModel, scoreModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'
import { type GetSongLeaderboardsQuerystring, getSongLeaderboardsQuerystring } from '../../schemas/songs/getLeaderboards.schemas'

export const getSongLeaderboardsSuccessData = genericServerResponse.extend({
	data: z.object({
		pagination: genericPaginationObject,
		entries: z.array(
			scoreModel.extend({
				uploader: z.object({
					username: z.string(),
					country: z.string(),
				}),
				childrenScores: z.array(scoreModel),
			}),
		),
	}),
})

export const getSongLeaderboards = fp(async (fastify) => {
	fastify.get<{ Params: GenericIdParams; Querystring: GetSongLeaderboardsQuerystring }>(
		'/v1/songs/:id/leaderboards',
		{
			schema: {
				tags: ['Songs'],
				summary: 'Retrieves the leaderboards of a specific song',
				response: {
					200: Swagger.replySchema('ok', getSongLeaderboardsSuccessData.shape.data).describe('Default response'),
					404: Swagger.replySchema('not_found').describe('Song not found using the provided ID'),
				},
				params: genericIdParams,
				querystring: getSongLeaderboardsQuerystring,
			},
		},
		async (req, reply) => {
			const { id: songId } = req.params
			const { instrument, difficulty, engine, allowSlowdowns, allowedModifiers, limit, page, sortByAccuracy } = req.query
			const skip = (page - 1) * limit

			const song = await fastify.dbFuncs.songs.findById(songId)
			if (!song) throw new ServerError('err_song_not_found')

			const [entries, totalResults] = await Promise.all([
				fastify.db.scores
					.aggregate<z.infer<typeof getSongLeaderboardsSuccessData.shape.data.shape.entries.element>>([
						{
							$match: {
								song: new fastify.mongo.ObjectId(songId),
								instrument,
								modifiers: {
									$not: {
										$elemMatch: { $nin: allowedModifiers },
									},
								},
								hidden: false,
								difficulty: difficulty !== YARGSPY.Difficulty.Expert ? difficulty : undefined,
								engine: engine !== YARGSPY.Engine.Default ? engine : undefined,
								songSpeed: allowSlowdowns ? { $gte: 1 } : undefined,
							},
						},
						{ $sort: instrument !== YARGSPY.Instrument.Band && sortByAccuracy ? { percent: -1, maxCombo: -1, songSpeed: -1, createdAt: 1 } : { score: -1, songSpeed: -1, createdAt: 1 } },
						{
							$group: {
								_id: '$uploader', // group by uploader
								topScore: { $first: '$$ROOT' }, // take the first (thanks to sort order)
							},
						},
						{ $replaceRoot: { newRoot: '$topScore' } }, // flatten back
						{ $sort: instrument !== YARGSPY.Instrument.Band && sortByAccuracy ? { percent: -1, maxCombo: -1, songSpeed: -1, createdAt: 1 } : { score: -1, songSpeed: -1, createdAt: 1 } }, // re-sort since $group loses the order
						{ $skip: (page - 1) * limit },
						{ $limit: limit },
						{
							$lookup: {
								from: 'users',
								localField: 'uploader',
								foreignField: '_id',
								as: 'uploaderInfo',
							},
						},
						{ $unwind: '$uploaderInfo' },
						{
							$addFields: {
								uploader: {
									username: '$uploaderInfo.username',
									country: '$uploaderInfo.country',
								},
							},
						},
						{ $project: { uploaderInfo: 0 } },
						{
							$lookup: {
								from: 'scores',
								localField: 'childrenScores',
								foreignField: '_id',
								as: 'childrenScores',
								// As of right now, one user uploads a band score and all children scores are associated with this same user.
								// Which means we don't need to fetch uploader info for children scores since they're the same as the band score.
								// However, this might change in the future with i.e. online play. So, just uncomment the pipeline below to fetch uploader data for children scores.
								/*pipeline: [
                                // Populate uploader for each child score
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "uploader",
                                        foreignField: "_id",
                                        as: "uploaderInfo"
                                    }
                                },
                                { $unwind: "$uploaderInfo" },
                                {
                                    $addFields: {
                                        uploader: {
                                            username: "$uploaderInfo.username",
                                            country: "$uploaderInfo.country",
                                        }
                                    }
                                },
                                { $project: { uploaderInfo: 0 } }
                            ]*/
							},
						},
					])
					.toArray(),
				fastify.db.scores.countDocuments({
					song: new fastify.mongo.ObjectId(songId),
					instrument: instrument as ScoreModel['instrument'],
					modifiers: {
						$not: {
							$elemMatch: { $nin: allowedModifiers },
						},
					},
					hidden: false,
					difficulty: (difficulty as ScoreModel['difficulty']) !== YARGSPY.Difficulty.Expert ? (difficulty as ScoreModel['difficulty']) : undefined,
					engine: (engine as ScoreModel['engine']) !== YARGSPY.Engine.Default ? (engine as ScoreModel['engine']) : undefined,
					songSpeed: allowSlowdowns ? { $gte: 1 } : undefined,
				}),
			])

			const totalPages = Math.ceil(totalResults / limit)
			const pagesLeft = Math.max(0, totalPages - page)

			const pagination = {
				page,
				limit,
				skip,
				totalResults,
				totalPages,
				pagesLeft,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			}

			return success<z.infer<typeof getSongLeaderboardsSuccessData.shape.data>>(req, reply, { code: 'ok', data: { pagination, entries } })
		},
	)
})
