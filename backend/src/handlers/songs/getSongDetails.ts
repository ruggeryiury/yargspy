import fp from 'fastify-plugin'
import z from 'zod'

import { type GenericIdParams, genericIdParams, genericServerResponse } from '@schemas'

import { songModel } from '../../core/services/Database'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

const getSongDetailsSuccessData = genericServerResponse.extend({ data: z.object({ song: songModel }) })

export const getSongDetails = fp(async (fastify) => {
	fastify.get<{ Params: GenericIdParams }>(
		'/v1/songs/:id/data',
		{
			schema: {
				tags: ['Songs'],
				summary: 'Retrieves the details of a song',
				response: {
					200: Swagger.replySchema('ok', getSongDetailsSuccessData.shape.data).describe('Default response'),
					404: Swagger.replySchema('not_found').describe('Song not found using the provided ID'),
				},
				params: genericIdParams,
			},
		},
		async (req, reply) => {
			const { id: songId } = req.params

			const song = await fastify.dbFuncs.songs.findById(songId)
			if (!song) throw new ServerError('err_song_not_found')

			return success<z.infer<typeof getSongDetailsSuccessData.shape.data>>(req, reply, { code: 'ok', data: { song } })
		},
	)
})
