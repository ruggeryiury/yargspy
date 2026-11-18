import z from 'zod'

import { serializedObjectId } from '../globals'
import { genericServerResponse } from '../response'

export const patchUserStatusBody = z.object({
	active: z.boolean(),
	reason: z.string().nonempty(),
})
export type PatchUserStatusBody = z.infer<typeof patchUserStatusBody>

export const patchUserStatusSuccessData = genericServerResponse.extend({
	data: z.object({
		user: serializedObjectId,
		active: z.boolean(),
	}),
})
export type PatchUserStatusSuccessData = z.infer<typeof patchUserStatusSuccessData>
