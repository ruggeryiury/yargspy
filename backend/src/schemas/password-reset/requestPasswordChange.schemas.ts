import z from 'zod'

import { genericEmail } from '../globals'

export const requestPasswordChangeBody = z.object({
	email: genericEmail,
	h: z.object({
		captcha: z.object({
			response: z.string(),
		}),
	}),
})
export type RequestPasswordChangeBody = z.infer<typeof requestPasswordChangeBody>
