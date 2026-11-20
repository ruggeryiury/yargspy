import z from 'zod'

import { genericPaginationObject, genericServerResponse, scoreDocument } from '@schemas'

import { YARGSPY } from '../../constants'

export const getSongLeaderboardsQuerystring = z.object({
	instrument: z.coerce.number().int().optional().default(YARGSPY.Instrument.Band),
	difficulty: z.coerce.number().int().optional().default(YARGSPY.Difficulty.Expert),
	engine: z.coerce.number().int().optional().default(YARGSPY.Engine.Default),
	allowedModifiers: z
		.preprocess((value) => (Array.isArray(value) ? value : [value]), z.array(z.coerce.number().int()))
		.optional()
		.default([YARGSPY.Modifier.AllStrums, YARGSPY.Modifier.TapsToHopos, YARGSPY.Modifier.NoteShuffle, YARGSPY.Modifier.NoDynamics, YARGSPY.Modifier.NoVocalPercussion, YARGSPY.Modifier.RangeCompress]),
	allowSlowdowns: z.stringbool().optional().default(false),
	sortByAccuracy: z.stringbool().optional().default(false),
	page: z.int().positive().optional().default(1),
	limit: z.int().positive().optional().default(25),
})
export type GetSongLeaderboardsQuerystring = z.infer<typeof getSongLeaderboardsQuerystring>

export const getSongLeaderboardsSuccessData = genericServerResponse.extend({
	data: z.object({
		pagination: genericPaginationObject,
		entries: z.array(
			scoreDocument.extend({
				uploader: z.object({
					username: z.string(),
					country: z.string(),
				}),
				childrenScores: z.array(scoreDocument),
			}),
		),
	}),
})
export type GetSongLeaderboardsSuccessData = z.infer<typeof getSongLeaderboardsSuccessData>
