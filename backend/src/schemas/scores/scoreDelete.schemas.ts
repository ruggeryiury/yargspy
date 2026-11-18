import z from 'zod'

import { genericServerResponse } from '@schemas'

export const scoreDeleteQuerystring = z.object({
	reason: z.string().nonempty(),
})
export type ScoreDeleteQuerystring = z.infer<typeof scoreDeleteQuerystring>

export const scoreDeleteSuccessData = genericServerResponse.extend({
	data: z.object({
		count: z.int(),
	}),
})
export type ScoreDeleteSuccessData = z.infer<typeof scoreDeleteSuccessData>
