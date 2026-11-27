import z from 'zod'

import { publicUserDocument } from '../db'
import { genericPaginationObject } from '../globals'
import { genericServerResponse } from '../response'

export const userEntriesQuerystring = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().default(15),
})
export type UserEntriesQuerystring = z.infer<typeof userEntriesQuerystring>

export const userEntriesSuccessData = genericServerResponse.extend({
	data: z.object({
		pagination: genericPaginationObject,
		entries: z.array(publicUserDocument),
	}),
})
export type UserEntriesSuccessData = z.infer<typeof userEntriesSuccessData>
