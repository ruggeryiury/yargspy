import z from 'zod'

import { genericEmail, genericPassword, genericUsername } from '../globals'

export const userRegisterBody = z.object({
	username: genericUsername,
	email: genericEmail,
	password: genericPassword,
	h: z.object({
		captcha: z.object({
			response: z.string(),
		}),
	}),
})
export type UserRegisterBody = z.infer<typeof userRegisterBody>
