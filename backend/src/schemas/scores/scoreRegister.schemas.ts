import z from 'zod'

import { YARGSPY } from '../../constants'
import { genericServerResponse } from '../response'

export const scoreRegisterBody = z.object({
	// Files
	replayFile: z.file().describe('The path to the REPLAY file to be validated and registered'),
	chartFile: z.file().optional().describe("The path to the song's chart file (in CHART or MIDI format)"),
	songDataFile: z.file().optional().describe("The path to the song's metadata file (in INI or DTA format)"),
	updateFile: z.file().optional().describe('The path to the song update file. This chart will be merged with the main chart file'),
	upgradeFile: z.file().optional().describe('The path to the song upgrade file. This chart will be merged with the main chart file'),

	// Fields
	reqType: z.coerce.number().pipe(z.enum(YARGSPY.ScoreRegisterReqType)),
})
export const scoreRegisterBodyNoFile = scoreRegisterBody.pick({ reqType: true })
export type ScoreRegisterBodyNoFile = z.infer<typeof scoreRegisterBodyNoFile>

export const scoreRegisterSuccessData = genericServerResponse.extend({
	data: z.object({}),
})
export type scoreRegisterSuccessData = z.infer<typeof scoreRegisterSuccessData>
