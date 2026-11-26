import type { FastifyRequest } from 'fastify'
import { type FilePathLikeTypes, pathLikeToFilePath, spawnAsync } from 'node-lib'
import { platform } from 'node:os'

import { YARGSPY } from '../../constants'
import type { SongModel } from './Database'
import { ServerError } from './ServerResponse'

export interface ReplayDataObject {
	ReplayInfo: {
		FilePath: string
		ReplayName: string
		ReplayVersion: number
		EngineVersion: number
		ReplayChecksum: {
			HashBytes: string
		}
		SongName: string
		ArtistName: string
		CharterName: string
		SongSpeed: number
		BandScore: number
		BandStars: number
		ReplayLength: number
		Date: string
		SongChecksum: {
			HashBytes: string
		}
		Pauses: unknown[]
		Stats: {
			TotalNotes: number
			NumNotesHit: number
			PercentageHit: number
			Overstrums: number
			GhostInputs: number
			SoloBonuses: number
			PlayerName: string
			Score: number
			Stars: number
			TotalOverdrivePhrases: number
			NumOverdrivePhrasesHit: number
			NumOverdriveActivations: number
			AverageMultiplier: number
			NumPauses: number
			IsReplayPlayer: boolean
		}[]
	}
	ReplayData: {
		Profile: {
			Version: number
			Id: string
			Name: string
			IsBot: boolean
			GameMode: number
			NoteSpeed: number
			HighwayLength: number
			LeftyFlip: boolean
			RangeEnabled: boolean
			FourLaneDrumsHighwayOrderingLength: number
			FourLaneDrumsHighwayOrdering: number[]
			ProDrumsHighwayOrderingLength: number
			ProDrumsHighwayOrdering: number[]
			FiveLaneDrumsHighwayOrderingLength: number
			FiveLaneDrumsHighwayOrdering: number[]
			UseCymbalModels: boolean
			OpenLaneDisplayType: number
			StarPowerActivationType: number
			AutoConnectOrder: any
			InputCalibrationMilliseconds: number
			EnginePreset: string
			ThemePreset: string
			ColorProfile: string
			CameraPreset: string
			HighwayPreset: string
			RockMeterPreset: string
			CurrentInstrument: number
			PreferredInstrument: number
			CurrentDifficulty: number
			DifficultyFallback: number
			HarmonyIndex: number
			LastUsed: string
			SplitProTomsAndCymbals: boolean
			SwapSnareAndHiHat: boolean
			SwapCrashAndRide: boolean
			InputCalibrationSeconds: number
			HasValidInstrument: boolean
			CurrentModifiers: number
		}
		Stats: {
			Overstrums?: number
			Overhits?: number
			GhostInputs?: number
			SustainScore?: number
			GhostsHit?: number
			AccentsHit?: number
			HoposStrummed: number
			CommittedScore: number
			PendingScore: number
			NoteScore: number
			MultiplierScore: number
			BandBonusScore: number
			Combo: number
			MaxCombo: number
			ScoreMultiplier: number
			BandMultiplier: number
			NotesHit: number
			LanedNotesHit: number
			TotalNotes: number
			TotalChords: number
			StarPowerTickAmount: number
			TotalStarPowerTicks: number
			TotalStarPowerBarsFilled: number
			StarPowerActivationCount: number
			TimeInStarPower: number
			StarPowerWhammyTicks: number
			IsStarPowerActive: boolean
			StarPowerPhrasesHit: number
			TotalStarPowerPhrases: number
			SoloBonuses: number
			MaxSoloBonusPoints: number
			CodaBonuses: number
			StarPowerScore: number
			Stars: number
			TotalScore: number
			ComboInBandUnits: number
			BandComboUnits: number
			BandBonusMultiplier: number
			NotesMissed: number
			Percent: number
			StarPowerPhrasesMissed: number
			IsFullCombo: boolean
		}
		Engine: number
	}[]
}

export type ReplayCountObject = {
	[key in (typeof YARGSPY.Instrument)[keyof typeof YARGSPY.Instrument]]: {
		[key in (typeof YARGSPY.Difficulty)[keyof typeof YARGSPY.Difficulty]]: number[]
	}
}
export type ReplaySPCountObject = {
	[key in (typeof YARGSPY.Instrument)[keyof typeof YARGSPY.Instrument]]: {
		[key in (typeof YARGSPY.Difficulty)[keyof typeof YARGSPY.Difficulty]]: number
	}
}
export interface ChartDataObject {
	ChartData: {
		NoteCount: ReplayCountObject
		StarPowerCount: ReplaySPCountObject
	}
	HopoFrequency: number
}

export type GetReplayDataObject = ReplayDataObject &
	Partial<ChartDataObject> & {
		Hashes: {
			ReplayHash: string
			SongHash: string
		}
	}

export interface YARGReplayValidatorSongHashObject {
	SongChecksum: { HashBytes: string }
}
export type ReplayDataReadModes = 'replayOnly' | 'complete'

export class YARGReplayValidatorAPI {
	/**
	 * Builds the command and arguments required to spawn a .NET executable process and returns an object containing the command, its arguments, and the spawn options, including the environment variables, working directory, and window visibility settings.
	 *
	 * On Linux, the executable is launched through Wine. On other platforms,
	 * the executable is launched directly. The function also configures the
	 * environment variables and working directory required to execute the
	 * binary from the appropriate development or packaged application path.
	 * - - - -
	 * @param {string} exeName The name or path of the executable to launch.
	 * @param {string[]} args The command-line arguments to pass to the executable.
	 */
	private static _buildDotnetSpawnCommand(req: FastifyRequest, exeName: string, args: string[]) {
		let command = ''
		const commandArgs: string[] = []

		if (platform() === 'linux') {
			command = req.server.env.FS_DOTNET || 'dotnet'
			commandArgs.push(exeName)
		} else command = exeName

		commandArgs.push(...args)

		return { command, args: commandArgs, options: { cwd: req.server.fs.getYARGReplayValidatorPath().root, windowsHide: true }, commandFull: `${command} ${commandArgs.join(' ')}` }
	}

	static async getSongDataFromChartFile(req: FastifyRequest, chartFilePath: FilePathLikeTypes, song: SongModel, eighthNoteHopo?: boolean, hopoFreq?: number): Promise<ChartDataObject> {
		const validator = req.server.fs.getYARGReplayValidatorPath()
		const chart = pathLikeToFilePath(chartFilePath)
		const readMode = YARGSPY.ReplayValidatorReadMode.MidiOnly

		const rawArgs: string[] = ['_', chart.path, '-m', readMode.toString()]

		// Input parameters from Song model
		if (song.isRb3con) rawArgs.push('-c')
		if (song.proDrums) rawArgs.push('-p')
		if (song.fiveLaneDrums) rawArgs.push('-g')
		if (song.sustainCutoffThreshold !== undefined) rawArgs.push('-s', song.sustainCutoffThreshold.toString())
		if (song.multiplierNote !== undefined) rawArgs.push('-n', song.multiplierNote.toString())

		// Other input params
		if (eighthNoteHopo) rawArgs.push('-e')
		if (hopoFreq !== undefined) rawArgs.push('-f', hopoFreq.toString())

		// rawArgs.push(chart.path)

		const { args, command, options } = this._buildDotnetSpawnCommand(req, validator.fullname, rawArgs)
		const { stderr, stdout } = await spawnAsync(command, args, options)
		if (stderr) throw new ServerError('unknown_server_error')

		return JSON.parse(stdout) as ChartDataObject
	}

	static async getSongHashFromReplayFile(req: FastifyRequest, replayFilePath: FilePathLikeTypes): Promise<string> {
		const validator = req.server.fs.getYARGReplayValidatorPath()
		const replay = pathLikeToFilePath(replayFilePath)

		const rawArgs: string[] = [replay.path, '-m', YARGSPY.ReplayValidatorReadMode.ReturnSongHash.toString()]
		const { args, command, options } = this._buildDotnetSpawnCommand(req, validator.fullname, rawArgs)
		const { stderr, stdout } = await spawnAsync(command, args, options)
		if (stderr) throw new ServerError('unknown_server_error')

		const {
			SongChecksum: { HashBytes },
		} = JSON.parse(stdout) as YARGReplayValidatorSongHashObject
		return Buffer.from(HashBytes, 'base64').toHex()
	}

	static async getReplayData(req: FastifyRequest, readMode: ReplayDataReadModes, replayFilePath: FilePathLikeTypes, chartFilePath: FilePathLikeTypes, song: SongModel | null, eighthNoteHopo?: boolean, hopoFreq?: number): Promise<GetReplayDataObject> {
		const validator = req.server.fs.getYARGReplayValidatorPath()
		const replay = pathLikeToFilePath(replayFilePath)
		const chart = pathLikeToFilePath(chartFilePath)
		const mode = readMode === 'replayOnly' ? YARGSPY.ReplayValidatorReadMode.ReplayOnly : YARGSPY.ReplayValidatorReadMode.ReplayAndMidi

		const rawArgs: string[] = [replay.path, chart.path, '-m', mode.toString()]

		if (song) {
			// Input parameters from Song model
			if (song.isRb3con) rawArgs.push('-c')
			if (song.proDrums) rawArgs.push('-p')
			if (song.fiveLaneDrums) rawArgs.push('-g')
			if (song.sustainCutoffThreshold !== undefined) rawArgs.push('-s', song.sustainCutoffThreshold.toString())
			if (song.multiplierNote !== undefined) rawArgs.push('-n', song.multiplierNote.toString())
			if (song.hopoFrequency !== undefined) rawArgs.push('-h', song.hopoFrequency.toString())
		}

		// Other input params
		if (eighthNoteHopo) rawArgs.push('-e')
		if (song && song.hopoFrequency === undefined && hopoFreq !== undefined) rawArgs.push('-f', hopoFreq.toString())

		const { args, command, options, commandFull } = this._buildDotnetSpawnCommand(req, validator.fullname, rawArgs)
		console.log(commandFull)
		const { stderr, stdout } = await spawnAsync(command, args, options)
		if (stderr) throw new ServerError('unknown_server_error')

		const data = JSON.parse(stdout) as ReplayDataObject

		return {
			...data,
			Hashes: {
				ReplayHash: Buffer.from(data.ReplayInfo.ReplayChecksum.HashBytes, 'base64').toHex(),
				SongHash: Buffer.from(data.ReplayInfo.SongChecksum.HashBytes, 'base64').toHex(),
			},
		}
	}
}
