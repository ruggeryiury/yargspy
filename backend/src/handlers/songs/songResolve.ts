import fp from 'fastify-plugin'
import type z from 'zod'

import { type SongResolveQuerystring, songResolveQuerystring, songResolveSuccessData } from '@schemas'

import { YARGSPY } from '../../constants'
import type { SongModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const songResolve = fp(async (app) => {
	app.get<{ Querystring: SongResolveQuerystring }>(
		'/v1/songs/resolve',
		{
			schema: {
				tags: ['Songs'],
				summary: 'Resolves a song entry value, returning another value from the same song',
				response: {
					200: Swagger.replySchema('ok', songResolveSuccessData.shape.data).describe('Default response'),
					404: Swagger.replySchema('not_found').describe('No user found using the provided parameters'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors'),
				},
				querystring: songResolveQuerystring,
			},
		},
		async (req, reply) => {
			const { input, output, value } = req.query

			let song: SongModel | null

			switch (input) {
				case YARGSPY.SongResolver.ID:
				default:
					song = await app.dbFuncs.songs.findById(value)
					break
				case YARGSPY.SongResolver.ChartFileHash:
					song = await app.dbFuncs.songs.findByChartFileHash(value)
					break
			}

			if (!song) throw new ServerError('err_song_not_found')

			let outputValue: string = ''

			switch (output) {
				case YARGSPY.SongResolver.ChartFileHash:
				default:
					outputValue = song.chartFileHash
					break
				case YARGSPY.SongResolver.ID:
					outputValue = song._id.toHexString()
					break
			}

			return success<z.infer<typeof songResolveSuccessData.shape.data>>(req, reply, { code: 'ok', data: { output: outputValue } })
		},
	)
})
