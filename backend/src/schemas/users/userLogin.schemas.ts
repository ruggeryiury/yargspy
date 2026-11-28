import z from 'zod'

import { genericPassword, genericUsername, tokenString } from '../globals'
import { genericServerResponse } from '../response'

export const userLoginBody = z.object({
	username: genericUsername,
	password: genericPassword,
})
export type UserLoginBody = z.infer<typeof userLoginBody>

export const userLoginSuccessData = genericServerResponse.extend({
	data: z.object({
		token: tokenString,
	}),
})
export type UserLoginSuccessData = z.infer<typeof userLoginSuccessData>
