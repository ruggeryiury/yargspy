import z from 'zod'

// #region genericServerResponse
export const genericServerResponse = z.object({
	statusCode: z.int(),
	statusName: z.string(),
	code: z.string(),
	message: z.string(),
})
export type GenericServerResponse = z.infer<typeof genericServerResponse>
