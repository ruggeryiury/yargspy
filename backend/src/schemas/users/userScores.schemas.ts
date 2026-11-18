import z from 'zod'

import { genericPaginationObject, genericServerResponse, scoreDocument, songDocument } from '@schemas'

export const userScoresQuerystring = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().default(15),
})
export type UserScoresQuerystring = z.infer<typeof userScoresQuerystring>

export const userScoresAggregationObject = scoreDocument.extend({ song: songDocument.pick({ _id: true, name: true, artist: true, charter: true, chartFileHash: true }) })
export type UserScoresAggregationObject = z.infer<typeof userScoresAggregationObject>

export const userScoresSuccessData = genericServerResponse.extend({
	data: z.object({
		pagination: genericPaginationObject,
		entries: z.array(userScoresAggregationObject),
	}),
})
export type UserScoresSuccessData = z.infer<typeof userScoresSuccessData>
