import z from 'zod'

import { genericServerResponse } from '../response'

export const songResolveQuerystring = z.object({
	input: z.coerce.number().int().optional().default(0),
	output: z.coerce.number().int().optional().default(1),
	value: z.coerce.string(),
})
export type SongResolveQuerystring = z.infer<typeof songResolveQuerystring>

export const songResolveSuccessData = genericServerResponse.extend({
	data: z.object({
		output: z.string(),
	}),
})
export type SongResolveSuccessData = z.infer<typeof songResolveSuccessData>
