import z from 'zod'

import { genericServerResponse } from '../response'

export const songResolveBody = z.discriminatedUnion('input', [
	z.object({
		input: z.literal('id'),
		output: z.enum(['chartFileHash']),
		value: z.string().nonempty(),
	}),
	z.object({
		input: z.literal('chartFileHash'),
		output: z.enum(['id']),
		value: z.string().nonempty(),
	}),
])
export type SongResolveBody = z.infer<typeof songResolveBody>

export const songResolveSuccessData = genericServerResponse.extend({
	data: z.object({
		output: z.string(),
	}),
})
export type SongResolveSuccessData = z.infer<typeof songResolveSuccessData>
