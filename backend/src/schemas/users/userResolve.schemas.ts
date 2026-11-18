import z from 'zod'

import { genericServerResponse } from '../response'

export const userResolveBody = z.discriminatedUnion('input', [
	z.object({
		input: z.literal('id'),
		output: z.enum(['username', 'email']),
		value: z.string().nonempty(),
	}),
	z.object({
		input: z.literal('username'),
		output: z.enum(['id', 'email']),
		value: z.string().nonempty(),
	}),
	z.object({
		input: z.literal('email'),
		output: z.enum(['id', 'username']),
		value: z.string().nonempty(),
	}),
])
export type UserResolveBody = z.infer<typeof userResolveBody>

export const userResolveSuccessData = genericServerResponse.extend({
	data: z.object({
		output: z.string(),
	}),
})
export type UserResolveSuccessData = z.infer<typeof userResolveSuccessData>
