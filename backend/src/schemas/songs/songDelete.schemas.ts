import z from 'zod'

export const songDeleteQuerystring = z.object({
	reason: z.string().nonempty(),
})
export type SongDeleteQuerystring = z.infer<typeof songDeleteQuerystring>
