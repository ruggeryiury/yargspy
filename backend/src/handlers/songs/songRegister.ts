import fp from 'fastify-plugin'
import { ObjectId } from 'mongodb'
import { FilePath, parseReadableBytesSize } from 'node-lib'
import { pipeline } from 'node:stream/promises'
import z from 'zod'

import { createNewSongEntry } from '@lib/utils/createNewSongEntry'
import { genericServerResponse, songRegisterBody } from '@schemas'

import { YARGSPY } from '../../constants'
import { userBearerAuth } from '../../core/services/Auth'
import { FileIntegrity } from '../../core/services/FileIntegrity'
import { FileSystem } from '../../core/services/FileSystem'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'
import { YARGReplayValidatorAPI } from '../../core/services/YARGReplayValidatorAPI'

const songRegisterSuccessData = genericServerResponse.extend({ data: z.object({ song: z.instanceof(ObjectId) }) })

export const songRegister = fp(async (fastify) => {
	fastify.post(
		'/v1/songs/register',
		{
			schema: {
				tags: ['Songs'],
				summary: 'Registers a song chart and metadata to the database',
				description: '_This route needs administrator rights to access it._<br />This route uses `FormData` as request body: Up to 4 attached files, no fields.',
				consumes: ['multipart/form-data'],
				response: {
					200: Swagger.replySchema('ok', songRegisterSuccessData.shape.data).describe('Default response'),
					422: Swagger.replySchema('unprocessable_entity').describe('Song missing its chart/metadata file(s) to be processed, invalid signature of provided files'),
					501: Swagger.replySchema('not_implemented').describe('Trying to upload a song with chart updates. Chart merging is still not implemented on the server'),
				},
				body: songRegisterBody.nullable(),
				security: [
					{
						bearerAuth: [],
					},
				],
			},
			preHandler: fastify.auth([userBearerAuth({ admin: true })]),
		},
		async (req, reply) => {
			const { chartTemp, deleteAllTempFiles, dtaTemp, iniTemp, midiTemp, updateTemp, upgradeTemp } = await FileSystem.genFileRegisterTempPaths(req)

			let chart: FilePath | undefined, songData: FilePath | undefined, update: FilePath | undefined, upgrade: FilePath | undefined
			const incomingStreams: Promise<void>[] = []

			try {
				const parts = req.parts({ limits: { fileSize: parseReadableBytesSize('2MB'), files: 4, fields: 0, parts: 4 } })

				for await (const part of parts) {
					if (part.type === 'file') {
						let selectedTempPath: FilePath | undefined
						const ext = part.filename.toLowerCase().split('.').at(-1)

						if (part.fieldname === 'chartFile') {
							if (ext === 'mid' || ext === 'midi') selectedTempPath = midiTemp
							else if (ext === 'chart') selectedTempPath = chartTemp
						} else if (part.fieldname === 'songDataFile') {
							if (ext === 'ini') {
								selectedTempPath = iniTemp
							} else if (ext === 'dta') {
								selectedTempPath = dtaTemp
							}
						} else if (part.fieldname === 'updateFile' && (ext === 'mid' || ext === 'midi')) {
							selectedTempPath = updateTemp
						} else if (part.fieldname === 'upgradeFile' && (ext === 'mid' || ext === 'midi')) {
							selectedTempPath = upgradeTemp
						}

						if (!selectedTempPath) throw new ServerError('err_file_register_bad_request')

						if (part.fieldname === 'chartFile') chart = selectedTempPath
						else if (part.fieldname === 'songDataFile') songData = selectedTempPath
						else if (part.fieldname === 'updateFile') update = selectedTempPath
						else if (part.fieldname === 'upgradeFile') upgrade = selectedTempPath

						// Pipeline has to be sync to avoid race conditions with the underlying busboy parser
						incomingStreams.push(pipeline(part.file, selectedTempPath.createWriteStreamSync()))

						if (part.file.truncated) {
							await deleteAllTempFiles()
							throw new ServerError('err_song_register_payload_too_large')
						}
					}
				}

				await Promise.all(incomingStreams)

				// TODO: Implement SONGS_UPDATES/SONGS_UPGRADES
				if (update || upgrade) throw new ServerError({ code: 'err_not_implemented', messageValues: { feature: 'Songs updates/upgrades merging and parsing' } })

				// These files are required
				if (!chart || !songData) throw new ServerError('err_register_songdata_required')

				// Checking the existence of the same song on the database
				const chartFileHash = await chart.generateHash('sha1')
				if (await fastify.dbFuncs.songs.findByChartFileHash(chartFileHash)) throw new ServerError('err_register_duplicated_song')

				// Check provided files integrity
				await FileIntegrity.checkChartFiles(midiTemp, chartTemp)

				const entryOpts = await createNewSongEntry(req, chart, chartFileHash, songData)
				const validatorSongData = await YARGReplayValidatorAPI.getSongDataFromChartFile(req, chart, entryOpts.song, entryOpts.eighthNoteHopo, entryOpts.hopoFreq)

				if (entryOpts.song.hopoFrequency === undefined && validatorSongData.HopoFrequency >= 0) entryOpts.song.hopoFrequency = validatorSongData.HopoFrequency
				const instrKeys = Object.keys(validatorSongData.ChartData.NoteCount).map((val) => z.coerce.number().int().parse(val)) as (typeof YARGSPY.Instrument)[keyof typeof YARGSPY.Instrument][]
				for (const instrKey of instrKeys) {
					const diffKeys = Object.keys(validatorSongData.ChartData.NoteCount[instrKey]).map((val) => z.coerce.number().int().parse(val)) as (typeof YARGSPY.Difficulty)[keyof typeof YARGSPY.Difficulty][]

					for (const diffKey of diffKeys) {
						const noteCountArray = validatorSongData.ChartData.NoteCount[instrKey][diffKey]
						entryOpts.song.availableInstruments.push({
							instrument: instrKey,
							difficulty: diffKey,
							notes: noteCountArray[0], // Chord-based noteCount for 5L
							notes5LK: noteCountArray[1] ?? undefined, // Note-based noteCount for 5L, undefined for other instrument types
							starPowerPhrases: validatorSongData.ChartData.StarPowerCount[instrKey][diffKey],
						})
					}
				}

				if (fastify.env.DISABLE_AWS) {
					await chart.copy(fastify.fs.getChartFile(entryOpts.song))
				} else {
					// TO-DO: Implement AWS file hosting logic
					throw new ServerError({ code: 'err_not_implemented', messageValues: { feature: 'AWS for file hosting' } })
				}

				// Delete DTA/INI (might consider not delete this)
				if (songData.exists) await songData.delete()

				// Insert song to database
				await fastify.db.songs.insertOne(entryOpts.song)

				// Create log
				await fastify.db.adminLogs.insertOne({
					_id: new fastify.mongo.ObjectId(),
					admin: new fastify.mongo.ObjectId(req.user.sub),
					action: YARGSPY.AdminLogAction.SongAdd,
					item: entryOpts.song._id,
					createdAt: new Date(),
				})

				// Deleting all temp files: this can be async
				deleteAllTempFiles()

				return success<z.infer<typeof songRegisterSuccessData.shape.data>>(req, reply, { code: 'created', data: { song: entryOpts.song._id } })
			} catch (err) {
				if (err instanceof fastify.multipartErrors.RequestFileTooLargeError) throw new ServerError('err_song_register_payload_too_large')
				await deleteAllTempFiles()
				throw err
			}
		},
	)
})
