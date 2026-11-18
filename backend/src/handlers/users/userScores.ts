import fp from 'fastify-plugin'
import type { Filter } from 'mongodb'
import z from 'zod'

import { type GenericIdParams, type UserScoresQuerystring, genericIdParams, genericPaginationObject, genericServerResponse, userScoresQuerystring } from '@schemas'

import { YARGSPY } from '../../constants'
import { type ScoreModel, scoreModel, songModel } from '../../core/services/Database'
import { success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

const userScoresAggregationObject = scoreModel.extend({ song: songModel.pick({ _id: true, name: true, artist: true, charter: true, chartFileHash: true }) })
type UserScoresAggregationObject = z.infer<typeof userScoresAggregationObject>
const userScoresSuccessData = genericServerResponse.extend({
	data: z.object({
		pagination: genericPaginationObject,
		entries: z.array(userScoresAggregationObject),
	}),
})

export const userScores = fp(async (app) => {
	app.post<{ Params: GenericIdParams; Querystring: UserScoresQuerystring }>(
		'/api/v1/users/:id/scores',
		{
			schema: {
				tags: ['Users'],
				summary: "Gets paginated results of an user's scores",
				response: {
					200: Swagger.replySchema('ok', userScoresSuccessData.shape.data.extend({ entries: userScoresAggregationObject })).describe('Default response'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors, wrong entry ID format'),
				},
				querystring: userScoresQuerystring,
				params: genericIdParams,
			},
		},
		async (req, reply) => {
			const { id } = req.params
			const { limit, page } = req.query

			const skip = (page - 1) * limit

			const filter: Filter<ScoreModel> = { uploader: new app.mongo.ObjectId(id), hidden: false, instrument: { $ne: YARGSPY.Instrument.Band } }

			const [entries, totalResults] = await Promise.all([
				app.db.scores
					.aggregate<UserScoresAggregationObject>([
						{ $match: filter },
						{
							$sort: {
								createdAt: -1,
								_id: -1,
							},
						},
						{ $skip: skip },
						{ $limit: limit },
						{
							$lookup: {
								from: 'songs',
								let: {
									songId: '$song',
								},
								pipeline: [
									{
										$match: {
											$exp: {
												$eq: ['$_id', '$$songId'],
											},
										},
									},
									{
										$project: {
											_id: 1,
											name: 1,
											artist: 1,
											charter: 1,
											chartFileHash: 1,
										},
									},
								],
								as: 'song',
							},
						},
						{
							$unwind: {
								path: '$song',
								preserveNullAndEmptyArrays: true,
							},
						},
					])
					.toArray(),
				app.db.scores.countDocuments(filter),
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
			return success<z.infer<typeof userScoresSuccessData.shape.data>>(req, reply, {
				code: 'ok',
				data: {
					pagination,
					entries,
				},
			})
		},
	)
})
