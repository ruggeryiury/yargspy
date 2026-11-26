import type { FilePath } from 'node-lib'

import { ServerError } from './ServerResponse'

export class FileIntegrity {
	static async checkChartFiles(midiTemp: FilePath, chartTemp: FilePath) {
		if (midiTemp.exists) {
			const midSignature = (await midiTemp.readOffset(0, 4)).toString()
			if (midSignature !== 'MThd') throw new ServerError('err_replay_invalid_midi_file')
		}

		if (chartTemp.exists) {
			let chartSignature = (await chartTemp.readOffset(0, 9)).toString('hex')

			// Excluding BOM from UTF-8 files (if any)
			if (chartSignature.startsWith('efbbbf')) chartSignature = Buffer.from(chartSignature.substring(6), 'hex').toString()
			if (chartSignature.toLowerCase() !== '[song]') throw new ServerError('err_replay_invalid_chart_file')
		}
	}

	static async checkReplayFile(replayTemp: FilePath) {
		// Might need to make a more robust checking, maybe calculate header size?
		const replayMagic = (await replayTemp.readOffset(0, 8)).toString()
		if (replayMagic !== 'YARGPLAY' && replayMagic !== 'YAREPLAY') throw new ServerError('err_replay_invalid_replay_file')
	}
}
