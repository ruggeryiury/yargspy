import z from 'zod'

import { userDocument } from '../db'
import { genericServerResponse } from '../response'

export const adminEntriesSuccessData = genericServerResponse.extend({
	data: z.object({
		entries: z.array(userDocument.pick({ _id: true, username: true })),
	}),
})
export type AdminEntriesSuccessData = z.infer<typeof adminEntriesSuccessData>
