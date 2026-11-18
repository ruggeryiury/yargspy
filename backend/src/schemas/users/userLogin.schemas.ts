import z from 'zod'

import { tokenString } from '../globals'
import { genericServerResponse } from '../response'

export const userLoginBody = z.object({
	username: z.string().min(3).max(32),
	password: z.string().min(8).max(48),
})
export type UserLoginBody = z.infer<typeof userLoginBody>

export const userLoginSuccessData = genericServerResponse.extend({
	data: z.object({
		token: tokenString,
	}),
})
export type UserLoginSuccessData = z.infer<typeof userLoginSuccessData>
