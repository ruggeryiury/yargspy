import z from 'zod'

export const userRegisterBody = z.object({
	username: z.string().min(3).max(32),
	email: z.email().transform((val) => val.toLowerCase()),
	password: z.string().min(8).max(48),
	h: z.object({
		captcha: z.object({
			response: z.string(),
		}),
	}),
})
export type UserRegisterBody = z.infer<typeof userRegisterBody>
