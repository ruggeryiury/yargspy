import z from 'zod'

export const emailVerifyBody = z.object({
	token: z.base64url(),
})
export type EmailVerifyBody = z.infer<typeof emailVerifyBody>
