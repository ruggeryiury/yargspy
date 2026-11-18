import fp from 'fastify-plugin'
import type z from 'zod'

import { type SongResolveBody, songResolveBody, songResolveSuccessData } from '@schemas'

import type { SongModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const songResolve = fp(async (app) => {
	app.post<{ Body: SongResolveBody }>(
		'/api/v1/users/resolve',
		{
			schema: {
				tags: ['Songs'],
				summary: 'Resolves a song entry value, returning another value from the same song',
				response: {
					200: Swagger.replySchema('ok', songResolveSuccessData.shape.data).describe('Default response'),
					404: Swagger.replySchema('not_found').describe('No user found using the provided parameters'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors'),
				},
				body: songResolveBody,
			},
		},
		async (req, reply) => {
			const { input, output, value } = req.body

			let song: SongModel | null

			switch (input) {
				case 'chartFileHash':
					song = await app.dbFuncs.songs.findByChartFileHash(value)
					break
				case 'id':
					song = await app.dbFuncs.songs.findById(value)
					break
			}

			if (!song) throw new ServerError('err_song_not_found')

			let outputValue: string = ''

			switch (output) {
				case 'chartFileHash':
					outputValue = song.chartFileHash
					break
				case 'id':
					outputValue = song._id.toHexString()
					break
			}

			return success<z.infer<typeof songResolveSuccessData.shape.data>>(req, reply, { code: 'ok', data: { output: outputValue } })
		},
	)
})
