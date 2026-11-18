import z from 'zod'

import { genericServerResponse } from '../response'

export const adminEntriesSuccessData = genericServerResponse.extend({
	data: z.object({
		entries: z.array(z.string()),
	}),
})
export type AdminEntriesSuccessData = z.infer<typeof adminEntriesSuccessData>
