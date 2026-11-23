import type { FastifyRequest } from 'fastify'
import { parse as iniParser } from 'ini'
import type { FilePath } from 'node-lib'
import z from 'zod'

import { DTAParser } from '@lib/dta-parser'
import { leadingArticleToTrailing } from '@lib/dta-parser/dta/textMethods'

import { type SongModel, songModel } from '../../core/services/Database'
import { ServerError } from '../../core/services/ServerResponse'
import { normalizeStr } from './strnum'

export type BooleanStringValueTypes = 'true' | 'false' | '1' | '0'

export type INISongDataObject = {
	[key in 'song' | 'Song']?: {
		name: string
		artist: string
		charter?: string
		frets?: string
		album?: string
		year?: string
		pro_drums?: BooleanStringValueTypes
		pro_drum?: BooleanStringValueTypes
		five_lane_drums?: BooleanStringValueTypes
		sustain_cutoff_threshold?: string
		multiplier_note?: string
		star_power_note?: string
		hopo_frequency?: string
		eighthnote_hopo?: BooleanStringValueTypes
		hopofreq?: string
	}
}

export const createNewSongEntry = async (req: FastifyRequest, chartFilePath: FilePath, chartFileHash: string, songDataPath: FilePath) => {
	const isChart = chartFilePath.ext === '.chart'
	const isRb3con = !isChart && songDataPath.ext === '.dta'

	let newSong: Partial<SongModel> = {
		_id: new req.server.mongo.ObjectId(),
		chartFileHash,
		isChart,
		isRb3con,
		availableInstruments: [],
		playerCount: 0,
	}
	let eighthNoteHopo: boolean | undefined, hopoFreq: number | undefined

	if (isRb3con) {
		const parser = await DTAParser.fromFile(songDataPath)
		await parser.applyDXUpdatesOnSongs()

		const { name, artist, author, album_name, year_released, hopo_threshold } = parser.songs[0]
		newSong = {
			...newSong,
			name,
			nameSearch: normalizeStr(name),
			nameSort: leadingArticleToTrailing(normalizeStr(name)),
			artist,
			artistSearch: normalizeStr(artist),
			artistSort: leadingArticleToTrailing(normalizeStr(artist)),
			charter: author,
			album: album_name?.toLowerCase() === 'unknown album' ? undefined : album_name,
			albumSearch: album_name && album_name.toLowerCase() !== 'unknown album' ? normalizeStr(album_name) : undefined,
			albumSort: album_name && album_name.toLowerCase() !== 'unknown album' ? leadingArticleToTrailing(normalizeStr(album_name)) : undefined,
			year: year_released,
			proDrums: true,
			fiveLaneDrums: false,
			hopoFrequency: hopo_threshold ?? 170,
		}

		if (author) {
			newSong.charterSearch = normalizeStr(author)
			newSong.charterSort = leadingArticleToTrailing(normalizeStr(author))
		}

		if (album_name) {
			newSong.albumSearch = normalizeStr(album_name)
			newSong.albumSort = leadingArticleToTrailing(normalizeStr(album_name))
		}
	} else {
		// Replace is needed because # is a valid character in CH .inis
		const iniContents = (await songDataPath.read('utf8'))
			.replace(/^\uFEFF/g, '')
			.replaceAll('#', '\\#')
			.replaceAll('\\\\#', '\\#')
		const ini = iniParser(iniContents) as INISongDataObject

		if (!ini.song && !ini.Song) throw new ServerError('err_replay_invalid_ini_file')

		const { artist, name, album, charter, five_lane_drums, frets, hopo_frequency, multiplier_note, pro_drum, pro_drums, star_power_note, sustain_cutoff_threshold, year, eighthnote_hopo, hopofreq } = ini.song ?? ini.Song!

		newSong = {
			...newSong,
			name,
			nameSearch: normalizeStr(name),
			nameSort: leadingArticleToTrailing(normalizeStr(name)),
			artist,
			artistSearch: normalizeStr(artist),
			artistSort: leadingArticleToTrailing(normalizeStr(artist)),
			album: album?.toLowerCase() === 'unknown album' ? undefined : album,
			year: year && /^([0-9]{4})/.test(year) ? Number(year) : undefined,
		}

		if (album && album !== 'Unknown Album') {
			newSong.albumSearch = normalizeStr(album)
			newSong.albumSort = leadingArticleToTrailing(normalizeStr(album))
		}

		if (charter) {
			newSong.charter = charter
			newSong.charterSearch = normalizeStr(charter)
			newSong.charterSort = leadingArticleToTrailing(normalizeStr(charter))
		} else if (frets) {
			newSong.charter = frets
			newSong.charterSearch = normalizeStr(frets)
			newSong.charterSort = leadingArticleToTrailing(normalizeStr(frets))
		}

		if (pro_drums) newSong.proDrums = z.stringbool().parse(pro_drums)
		else if (pro_drum) newSong.proDrums = z.stringbool().parse(pro_drum)

		if (five_lane_drums) newSong.fiveLaneDrums = z.stringbool().parse(five_lane_drums)
		if (sustain_cutoff_threshold) newSong.sustainCutoffThreshold = z.coerce.number().parse(sustain_cutoff_threshold)

		if (multiplier_note) newSong.multiplierNote = z.coerce.number().parse(multiplier_note)
		else if (star_power_note) newSong.multiplierNote = z.coerce.number().parse(star_power_note)

		if (hopo_frequency) newSong.hopoFrequency = z.coerce.number().parse(hopo_frequency)
		else if (eighthnote_hopo) eighthNoteHopo = z.stringbool().parse(eighthnote_hopo)
		else if (hopofreq) hopoFreq = z.coerce.number().parse(hopofreq)
	}

	return { song: songModel.parse(newSong), eighthNoteHopo, hopoFreq }
}
