import z from 'zod'

import { serializedObjectId } from '../globals'
import { genericServerResponse } from '../response'

export const songRegisterBody = z.object({
	// Files
	chartFile: z.file().describe("The path to the song's chart file (in CHART or MIDI format)"),
	songDataFile: z.file().describe("The path to the song's metadata file (in INI or DTA format)"),
	updateFile: z.file().optional().describe('The path to the song update file. This chart will be merged with the main chart file'),
	upgradeFile: z.file().optional().describe('The path to the song upgrade file. This chart will be merged with the main chart file'),
})
export const songRegisterBodyNoFile = songRegisterBody.omit(['chartFile', 'songDataFile', 'updateFile', 'upgradeFile'])

export const songRegisterSuccessData = genericServerResponse.extend({
	data: z.object({
		song: serializedObjectId,
	}),
})
export type SongRegisterSuccessData = z.infer<typeof songRegisterSuccessData>
