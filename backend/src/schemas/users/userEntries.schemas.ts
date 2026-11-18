import z from 'zod'

export const userEntriesQuerystring = z.object({
	username: z.string().min(3).max(32).optional().default(''),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().default(15),
})
export type UserEntriesQuerystring = z.infer<typeof userEntriesQuerystring>
