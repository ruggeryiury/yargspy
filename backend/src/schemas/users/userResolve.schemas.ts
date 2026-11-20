import z from 'zod'

import { genericServerResponse } from '../response'

export const userResolveQuerystring = z.object({
	input: z.coerce.number().int().optional().default(0),
	output: z.coerce.number().int().optional().default(1),
	value: z.coerce.string(),
})
export type UserResolveQuerystring = z.infer<typeof userResolveQuerystring>

export const userResolveSuccessData = genericServerResponse.extend({
	data: z.object({
		output: z.string(),
	}),
})
export type UserResolveSuccessData = z.infer<typeof userResolveSuccessData>
