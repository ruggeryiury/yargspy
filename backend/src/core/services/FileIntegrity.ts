import { type FilePathLikeTypes, pathLikeToFilePath } from 'node-lib'

import { ServerError } from './ServerResponse'

/**
 * A class with static methods to verify integrity of specific file types used on the server.
 */
export class FileIntegrity {
	/**
	 * Checks the integrity of user-provided chart files (both `.chart` and `.mid`).
	 * - - - -
	 * @param {FilePathLikeTypes} midiPath The path to the MIDI file to be checked.
	 * @param {FilePathLikeTypes} chartPath The path to the CHART file to be checked.
	 */
	static async checkChartFiles(midiPath: FilePathLikeTypes, chartPath: FilePathLikeTypes): Promise<void> {
		const midi = pathLikeToFilePath(midiPath)
		const chart = pathLikeToFilePath(chartPath)
		if (midi.exists) {
			const midSignature = (await midi.readOffset(0, 4)).toString()
			if (midSignature !== 'MThd') throw new ServerError('err_replay_invalid_midi_file')
		}

		if (chart.exists) {
			let chartSignature = (await chart.readOffset(0, 9)).toString('hex')

			// Excluding BOM from UTF-8 files (if any)
			if (chartSignature.startsWith('efbbbf')) chartSignature = Buffer.from(chartSignature.substring(6), 'hex').toString()
			if (chartSignature.toLowerCase() !== '[song]') throw new ServerError('err_replay_invalid_chart_file')
		}
	}

	/**
	 * Checks the integrity of user-provided YARG REPLAY files.
	 * - - - -
	 * @param {FilePathLikeTypes} replayPath The path to the REPLAY path to be checked.
	 */
	static async checkReplayFile(replayPath: FilePathLikeTypes): Promise<void> {
		const replay = pathLikeToFilePath(replayPath)

		// Might need to make a more robust checking, maybe calculate header size?
		const replayMagic = (await replay.readOffset(0, 8)).toString()
		if (replayMagic !== 'YARGPLAY' && replayMagic !== 'YAREPLAY') throw new ServerError('err_replay_invalid_replay_file')
	}
}
