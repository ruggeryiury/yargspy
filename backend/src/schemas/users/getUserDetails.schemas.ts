import z from 'zod'

import { publicUserDocument } from '../db'
import { genericServerResponse } from '../response'

export const getUserDetailsSuccessData = genericServerResponse.extend({
	data: z.object({ user: publicUserDocument }),
})
export type GetUserDetailsSuccessData = z.infer<typeof getUserDetailsSuccessData>
