import z from 'zod'

export const songUpdateBody = z.object({
	name: z.string().optional(),
	artist: z.string().optional(),
	charter: z.string().optional(),
	album: z.string().optional(),
	year: z.string().optional(),
	proDrums: z.boolean().optional(),
	fiveLaneDrums: z.boolean().optional(),
	sustainCutoffThreshold: z.number().optional(),
	hopoFrequency: z.number().optional(),
	multiplierNote: z.number().optional(),
	reason: z.string().nonempty().optional(),
})
export type SongUpdateBody = z.infer<typeof songUpdateBody>
