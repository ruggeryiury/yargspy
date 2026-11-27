import z from 'zod'

import { genericEmail, genericPassword, tokenString } from '../globals'
import { genericServerResponse } from '../response'

export const userLoginBody = z.object({
	email: genericEmail,
	password: genericPassword,
})
export type UserLoginBody = z.infer<typeof userLoginBody>

export const userLoginSuccessData = genericServerResponse.extend({
	data: z.object({
		token: tokenString,
	}),
})
export type UserLoginSuccessData = z.infer<typeof userLoginSuccessData>
