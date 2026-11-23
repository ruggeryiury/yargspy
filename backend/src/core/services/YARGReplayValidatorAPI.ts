import type { FastifyRequest } from 'fastify'
import { type FilePathLikeTypes, pathLikeToFilePath, spawnAsync } from 'node-lib'
import { platform } from 'node:os'

import type { YARGSPY } from '../../constants'
import type { SongModel } from './Database'

export type ReplayCountObject = {
	[key in (typeof YARGSPY.Instrument)[keyof typeof YARGSPY.Instrument] as string]: {
		[key in (typeof YARGSPY.Difficulty)[keyof typeof YARGSPY.Difficulty] as string]: number[]
	}
}
export type ReplaySPCountObject = {
	[key in (typeof YARGSPY.Instrument)[keyof typeof YARGSPY.Instrument] as string]: {
		[key in (typeof YARGSPY.Difficulty)[keyof typeof YARGSPY.Difficulty] as string]: number
	}
}

export interface YARGSongResultsObject {
	ChartData: {
		NoteCount: ReplayCountObject
		StarPowerCount: ReplaySPCountObject
	}
	HopoFrequency: number
}

export class YARGReplayValidatorAPI {
	/**
	 * Enum for read-mode `-m` parameter.
	 */
	static readonly readMode = {
		replayOnly: 0,
		replayAndMidi: 1,
		midiOnly: 2,
		returnSongHash: 3,
	} as const

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

		return { command, args: commandArgs, options: { cwd: req.server.fs.getYARGReplayValidatorPath().root, windowsHide: true } }
	}

	static async getSongData(req: FastifyRequest, chartFilePath: FilePathLikeTypes, song: SongModel, eighthNoteHopo?: boolean, hopoFreq?: number): Promise<YARGSongResultsObject> {
		const validator = req.server.fs.getYARGReplayValidatorPath()
		const chart = pathLikeToFilePath(chartFilePath)
		const readMode = this.readMode.midiOnly // 2

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
		console.log(`Executing YARGReplayValidator: ${command} ${args.join(' ')}`)
		const { stderr, stdout } = await spawnAsync(command, args, options)
		console.log('stderr', stderr)

		return JSON.parse(stdout) as YARGSongResultsObject
	}
}
