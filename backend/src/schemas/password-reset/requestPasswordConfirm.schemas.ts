import z from 'zod'

import { genericPassword } from '../globals'

export const requestPasswordConfirmBody = z.object({
	token: z.base64url(),
	password: genericPassword,
	h: z.object({
		captcha: z.object({
			response: z.string(),
		}),
	}),
})
export type RequestPasswordConfirmBody = z.infer<typeof requestPasswordConfirmBody>
