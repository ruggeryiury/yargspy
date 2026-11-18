import axios from 'axios'
import type { FastifyInstance } from 'fastify'

interface HCaptchaResponse {
	success: boolean
	'error-codes'?: string[]
	challenge_ts?: string
	hostname?: string
	credit?: boolean
}

export const validateHCaptcha = async (app: FastifyInstance, token: string): Promise<boolean> => {
	if (!token) return false
	const params = new URLSearchParams()
	params.append('response', token)
	params.append('secret', app.env.HCAPTCHA_SECRET ?? '')
	const res = await axios.post<HCaptchaResponse>('https://api.hcaptcha.com/siteverify', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

	return res.data.success
}
