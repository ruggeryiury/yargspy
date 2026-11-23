import z from 'zod'

import { serializedObjectId } from './globals'

// ---------------------------------------------------------------------------------------------------------
export const serverEnvObject = z.object({
	// Server configuration
	NODE_ENV: z.union([z.literal('development'), z.literal('production')]),
	PORT: z.number().positive(),
	HOST: z.string().optional(),
	JWT_SECRET: z.string(),
	HCAPTCHA_SECRET: z.string(),

	// Client configuration
	CLIENT_URL: z.string(),
	CLIENT_VERIFY: z.string(),
	CLIENT_RESET: z.string(),

	// File System configuration
	FS_SERVER_ROOT: z.string().optional(),
	FS_FILES_ROOT: z.string().optional(),
	FS_DOTNET: z.string().optional(),

	// Connection configuration
	PROXY: z.boolean().optional(),

	// Mailing Service (Simple Mail Transfer Protocol)
	SMTP_HOST: z.string(),
	SMTP_PORT: z.int(),
	SMTP_SECURE: z.boolean(),
	SMTP_USERNAME: z.string(),
	SMTP_PASSWORD: z.string(),
	SMTP_FROM: z.string(),

	// Modifiers
	DISABLE_TOKEN_EXPIRATION: z.boolean().optional(),
	DISABLE_PASSWORD_VALIDATOR: z.boolean().optional(),
	DISABLE_CAPTCHA_VALIDATION: z.boolean().optional(),
	DISABLE_MAIL_SERVICE: z.boolean().optional(),
	DISABLE_AWS: z.boolean().optional(),
})

export type ServerEnvObject = z.infer<typeof serverEnvObject>

// ---------------------------------------------------------------------------------------------------------

export const signedUserTokenObjectSchema = z.object({
	sub: serializedObjectId,
})
export type SignedUserTokenObject = z.infer<typeof signedUserTokenObjectSchema>

export const decodedUserTokenObjectSchema = z.object({
	sub: serializedObjectId,
	iat: z.int(),
	exp: z.int(),
})
export type DecodedUserTokenObject = z.infer<typeof decodedUserTokenObjectSchema>
