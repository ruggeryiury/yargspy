import z from 'zod'

import { genericEmail } from '../globals'

export const emailVerificationResendBody = z.object({
	email: genericEmail,
	h: z.object({
		captcha: z.object({
			response: z.string(),
		}),
	}),
})
export type EmailVerificationResendBody = z.infer<typeof emailVerificationResendBody>
