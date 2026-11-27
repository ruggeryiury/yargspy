import fp from 'fastify-plugin'
import { ObjectId } from 'mongodb'
import { FilePath, parseReadableBytesSize } from 'node-lib'
import { pipeline } from 'node:stream/promises'
import z from 'zod'

import { createNewSongEntry } from '@lib/utils/createNewSongEntry'
import { genericServerResponse } from '@schemas'

import { YARGSPY } from '../../constants'
import { userBearerAuth } from '../../core/services/Auth'
import type { ScoreModel, SongModel } from '../../core/services/Database'
import { FileIntegrity } from '../../core/services/FileIntegrity'
import { FileSystem } from '../../core/services/FileSystem'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'
import { YARGReplayValidatorAPI } from '../../core/services/YARGReplayValidatorAPI'
import { scoreRegisterBody, scoreRegisterBodyNoFile } from '../../schemas/scores/scoreRegister.schemas'

const scoreRegisterSuccessData = genericServerResponse.extend({
	data: z.object({
		song: z.instanceof(ObjectId),
	}),
})

export const scoreRegister = fp(async (fastify) => {
	fastify.post(
		'/v1/scores/register',
		{
			schema: {
				tags: ['Scores'],
				summary: 'Register a REPLAY file as score to the database. Might register its song files as well',
				response: {
					201: Swagger.replySchema('created', scoreRegisterSuccessData.shape.data).describe('Default response'),
					400: Swagger.replySchema('bad_request').describe('Bad request body fields naming, provided CHART/MIDI file does not match REPLAY chart file hash'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server'),
					409: Swagger.replySchema('conflict').describe('Provided score is already registered on the database'),
					413: Swagger.replySchema('payload_too_large').describe('All files size surpassing the 16MB size limit of the route'),
					422: Swagger.replySchema('unprocessable_entity').describe('REPLAY register requires song chart and metadata files, invalid REPLAY, CHART/MIDI and/or INI/DTA file signature'),
					501: Swagger.replySchema('not_implemented').describe('Trying to upload scores of songs with songs_updates/songs_upgrades'),
				},
				consumes: ['multipart/form-data'],
				body: scoreRegisterBody.nullable(),
				security: [
					{
						bearerAuth: [],
					},
				],
			},
			preHandler: fastify.auth([userBearerAuth()]),
		},
		async (req, reply) => {
			const { chartTemp, deleteAllTempFiles, dtaTemp, iniTemp, midiTemp, updateTemp, upgradeTemp, replayTemp } = await FileSystem.genFileRegisterTempPaths(req)
			const playerScores: ScoreModel[] = []

			let chart: FilePath | undefined, songData: FilePath | undefined, update: FilePath | undefined, upgrade: FilePath | undefined, replay: FilePath | undefined
			const incomingStreams: Promise<void>[] = []
			const rawFields: Record<string, unknown> = {}

			try {
				const parts = req.parts({ limits: { files: 5, fileSize: parseReadableBytesSize('16MB'), fields: 1, parts: 6 } })

				for await (const part of parts) {
					if (part.type === 'file') {
						let selectedTempPath: FilePath | undefined
						const ext = part.filename.toLowerCase().split('.').at(-1)

						if (part.fieldname === 'replayFile') {
							selectedTempPath = replayTemp
						}
						if (part.fieldname === 'chartFile') {
							if (ext === 'mid' || ext === 'midi') {
								selectedTempPath = midiTemp
							} else if (ext === 'chart') {
								selectedTempPath = chartTemp
							}
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

						if (part.fieldname === 'replayFile') replay = selectedTempPath
						else if (part.fieldname === 'chartFile') chart = selectedTempPath
						else if (part.fieldname === 'songDataFile') songData = selectedTempPath
						else if (part.fieldname === 'updateFile') update = selectedTempPath
						else if (part.fieldname === 'upgradeFile') upgrade = selectedTempPath

						// Pipeline has to be sync to avoid race conditions with the underlying busboy parser
						incomingStreams.push(pipeline(part.file, selectedTempPath.createWriteStreamSync()))

						if (part.file.truncated) {
							await deleteAllTempFiles()
							throw new ServerError('err_song_register_payload_too_large')
						}

						continue
					}

					rawFields[part.fieldname] = part.value
				}

				await Promise.all(incomingStreams)

				const { reqType } = scoreRegisterBodyNoFile.parse(rawFields)
				const isReplayReqOnly = reqType === YARGSPY.ScoreRegisterReqType.ReplayOnly

				// TODO: Implement SONGS_UPDATES/SONGS_UPGRADES
				if (update || upgrade) throw new ServerError({ code: 'err_not_implemented', messageValues: { feature: 'Songs updates/upgrades merging and parsing' } })

				// These files are required
				if (!replay) throw new ServerError('err_register_songdata_required')
				const scoreHash = await replay.generateHash()
				const scoreEntry = await fastify.dbFuncs.scores.findByReplayFileHash(scoreHash)
				if (scoreEntry) throw new ServerError('err_register_duplicated_score')

				// Check provided files integrity
				await FileIntegrity.checkReplayFile(replayTemp)

				const chartFileHash = await YARGReplayValidatorAPI.getSongHashFromReplayFile(req, replay)
				let songEntry: SongModel | null = await fastify.dbFuncs.songs.findByChartFileHash(chartFileHash)
				const readMode: 'replayOnly' | 'complete' = songEntry ? 'replayOnly' : 'complete'
				let eighthNoteHopo: boolean | undefined
				let hopoFreq: number | undefined

				if (isReplayReqOnly && readMode === 'complete') throw new ServerError('err_register_songdata_required')

				// Here is when we know all needed files are provided
				// and the request will register both song and score,
				// so we have to do a LOT of checks!

				await FileIntegrity.checkChartFiles(midiTemp, chartTemp)
				// TODO: Since text is very hard to check integrity, maybe trying to parse both INI and DTA and reassure these files even
				//       exists would be a good idea to avoid any malicious file being injected in the server

				if (readMode === 'replayOnly' && songEntry) {
					if (fastify.env.DISABLE_AWS) {
						chart = fastify.fs.getChartFile(songEntry)
					} else {
						// TO-DO: Implement AWS file hosting logic
						throw new ServerError({ code: 'err_not_implemented', messageValues: { feature: 'AWS for file hosting' } })
					}
				} else {
					// If song isn't in database already...
					// Narrowing down: For this path, chart and song data are required and must return an error if now provided
					if (!chart || !songData) throw new ServerError('err_register_songdata_required')

					if (chartFileHash !== (await chart.generateHash('sha1'))) throw new ServerError('err_register_unmatched_chart_with_replay')
					const entryOpts = await createNewSongEntry(req, chart, chartFileHash, songData)

					songEntry = entryOpts.song
					eighthNoteHopo = entryOpts.eighthNoteHopo
					hopoFreq = entryOpts.hopoFreq
				}

				const replayData = await YARGReplayValidatorAPI.getReplayData(req, readMode, replay, chart, songEntry, eighthNoteHopo, hopoFreq)
				const now = new Date()

				if (!replayData.ReplayInfo.BandScore) throw new ServerError('err_register_band_score_zeroed')

				if (readMode === 'complete') {
					const { HopoFrequency, ChartData } = replayData
					if (HopoFrequency && songEntry.hopoFrequency === undefined && HopoFrequency >= 0) songEntry.hopoFrequency = HopoFrequency

					if (ChartData) {
						const instrKeys = Object.keys(ChartData.NoteCount).map((val) => z.coerce.number().int().parse(val)) as (typeof YARGSPY.Instrument)[keyof typeof YARGSPY.Instrument][]

						for (const instrKey of instrKeys) {
							const diffKeys = Object.keys(ChartData.NoteCount[instrKey]).map((val) => z.coerce.number().int().parse(val)) as (typeof YARGSPY.Difficulty)[keyof typeof YARGSPY.Difficulty][]

							for (const diffKey of diffKeys) {
								const [notes, notes5LK] = ChartData.NoteCount[instrKey][diffKey] as [number, number?]
								songEntry.availableInstruments.push({
									instrument: instrKey,
									difficulty: diffKey,
									notes,
									notes5LK,
									starPowerPhrases: ChartData.StarPowerCount[instrKey][diffKey],
								})
							}
						}
					}

					if (fastify.env.DISABLE_AWS) {
						const newChart = await chart.copy(fastify.fs.getChartFile(songEntry))
						await chart.delete()
						chart = newChart
					} else {
						// TO-DO: Implement AWS file hosting logic
						throw new ServerError({ code: 'err_not_implemented', messageValues: { feature: 'AWS for file hosting' } })
					}

					if (songData?.exists) await songData.delete()
					await fastify.db.songs.insertOne(songEntry)
				}

				const currentGameVersion = YARGSPY.GameVersion.v0_15 // hardcoded: change on each stable update

				const bandScore: ScoreModel = {
					_id: new fastify.mongo.ObjectId(),
					song: songEntry._id,
					uploader: new fastify.mongo.ObjectId(req.user.sub),
					replayPath: replay.name,
					replayFileHash: scoreHash,
					version: currentGameVersion,
					songSpeed: replayData.ReplayInfo.SongSpeed,
					instrument: YARGSPY.Instrument.Band,
					score: replayData.ReplayInfo.BandScore,
					stars: replayData.ReplayInfo.BandStars,
					hidden: false,
					childrenScores: [],
					createdAt: now,
				}

				let bandScoreValid = true
				let validPlayers = 0
				let i = 0

				// Create player scores for each player (save)
				const childrenScores: ObjectId[] = []
				const bandModifiers: (typeof YARGSPY.Modifier)[keyof typeof YARGSPY.Modifier][] = []

				for (const player of replayData.ReplayData) {
					const playerData = player.Stats
					const playerStats = replayData.ReplayInfo.Stats[i]
					i++
					if (playerData.TotalScore === 0) continue // Don't save "non-players"

					const engine = player.Engine as (typeof YARGSPY.Engine)[keyof typeof YARGSPY.Engine] | -1
					const playerProfile = player.Profile

					if (engine === -1 || playerProfile.IsBot || playerStats.IsReplayPlayer) {
						// TODO: can we return additional info with player rejection reason?
						bandScoreValid = false
						continue
					}

					const playerInstrument = Number(playerProfile.CurrentInstrument) as (typeof YARGSPY.Instrument)[keyof typeof YARGSPY.Instrument]
					let playerModifiers: ScoreModel['modifiers'] | undefined
					if (playerProfile.CurrentModifiers !== 0) {
						const modifiers: ScoreModel['modifiers'] = []
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						for (const [_, index] of Object.entries(YARGSPY.Modifier)) {
							if ((playerProfile.CurrentModifiers >> index) % 2) modifiers.push(index)
						}

						playerModifiers = modifiers
					}

					const playerScore: ScoreModel = {
						_id: new fastify.mongo.ObjectId(),
						song: songEntry._id,
						uploader: new fastify.mongo.ObjectId(req.user.sub),
						replayPath: replay.name,
						replayFileHash: scoreHash,
						version: currentGameVersion,
						songSpeed: replayData.ReplayInfo.SongSpeed,
						instrument: playerInstrument,
						gamemode: playerProfile.GameMode as (typeof YARGSPY.GameMode)[keyof typeof YARGSPY.GameMode],
						difficulty: playerProfile.CurrentDifficulty as (typeof YARGSPY.Difficulty)[keyof typeof YARGSPY.Difficulty],
						engine,
						modifiers: playerModifiers,
						profileName: playerProfile.Name,
						score: playerData.TotalScore,
						stars: playerData.Stars,
						notesHit: playerData.NotesHit,
						maxCombo: playerData.MaxCombo,
						starPowerPhrasesHit: playerData.StarPowerPhrasesHit,
						starPowerActivationCount: playerData.StarPowerActivationCount,
						//averageMultiplier: playerStats.AverageMultiplier,
						soloBonuses: playerData.SoloBonuses,
						//numPauses: playerStats.numPauses,
						percent: playerData.Percent,
						childrenScores: [],
						createdAt: now,
						hidden: false,
					}

					// Overstrum if 5/6-fret, overhit if drums/keys, neither if vocals
					if (playerData.Overstrums !== undefined) playerScore.overhits = playerData.Overstrums
					else if (playerData.Overhits !== undefined) playerScore.overhits = playerData.Overhits

					// These two values are 5/6-fret only
					if (playerData.GhostInputs !== undefined) playerScore.ghostInputs = playerData.GhostInputs
					if (playerData.SustainScore !== undefined) playerScore.sustainScore = playerData.SustainScore

					// These values are drums only
					if (playerData.GhostsHit !== undefined) playerScore.ghostNotesHit = playerData.GhostsHit
					if (playerData.AccentsHit !== undefined) playerScore.accentNotesHit = playerData.AccentsHit

					playerScores.push(playerScore)
					await fastify.db.scores.insertOne(playerScore)

					childrenScores.push(playerScore._id)

					// Add modifiers to band score if there are any
					// (making sure there are no repeats if multiple players used the same modifier)
					// TODO: test with multiple players
					if (bandScoreValid && playerModifiers && playerModifiers.length > 0) {
						for (const playerModifier of playerModifiers) {
							if (!bandModifiers.find((mod) => mod === playerModifier)) bandModifiers.push(playerModifier)
						}
					}

					validPlayers++
				}

				if (validPlayers === 0) throw new ServerError('err_replay_no_valid_players')

				bandScore.childrenScores = childrenScores
				bandScore.modifiers = bandModifiers

				// Move replay file
				if (fastify.env.DISABLE_AWS) {
					await replay.copy(fastify.fs.filesDir().gotoFile(`replay/${replay.fullname}`))
					await replay.delete()
				} else {
					// TO-DO: Implement AWS file hosting logic
					throw new ServerError({ code: 'err_not_implemented', messageValues: { feature: 'AWS for file hosting' } })
				}

				// Save band score (if valid)
				if (bandScoreValid) await fastify.db.scores.insertOne(bandScore)

				// Delete temp files if the player needlessly uploaded chart/metadata files despite the song already existing
				if (readMode === 'replayOnly' && !isReplayReqOnly) await deleteAllTempFiles()

				return success<z.infer<typeof scoreRegisterSuccessData.shape.data>>(req, reply, { code: 'created', data: { song: songEntry._id } })
			} catch (err) {
				if (err instanceof fastify.multipartErrors.RequestFileTooLargeError) throw new ServerError('err_score_register_payload_too_large')
				// await deleteAllTempFiles()
				throw err
			}
		},
	)
})
