import z from 'zod'

import { YARGSPY } from '../constants'
import { serializedObjectId } from './globals'

export const userDocument = z.object({
	_id: serializedObjectId,
	username: z.string().min(3).max(32),
	usernameSearch: z.string(),
	usernameSort: z.string(),
	email: z.email(),
	password: z.string(),
	emailVerified: z.boolean(),
	active: z.boolean(),
	admin: z.boolean(),
	/**
	 * ISO 3166-1 alpha-2.
	 */
	country: z.union([z.string().regex(/^[A-Z]{2}$/), z.literal('T1')]),
	profilePhotoURL: z.string().optional(),
	bannerURL: z.string().optional(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
})
export type UserDocument = z.infer<typeof userDocument>

export const adminLogDocument = z.object({
	_id: serializedObjectId,
	admin: serializedObjectId,
	/**
	 * UserBan: 0
	 * UserUnban: 1
	 * SongAdd: 2
	 * SongUpdate: 3
	 * SongDelete: 4
	 * ScoreDelete: 5
	 * UserUpdate: 6
	 */
	action: z.enum(YARGSPY.AdminLogAction),
	item: serializedObjectId, // ObjectID for any table
	reason: z.string().nonempty().optional(),
	createdAt: z.iso.datetime(),
})
export type AdminLogDocument = z.infer<typeof adminLogDocument>

export const emailTokenDocument = z.object({
	_id: serializedObjectId,
	user: serializedObjectId,
	/**
	 * Verify: 0
	 * Reset: 1
	 */
	purpose: z.enum(YARGSPY.EmailTokenPurpose),
	tokenHash: z.hash('sha256'),
	usedAt: z.iso.datetime().optional(),
	expiresAt: z.iso.datetime(),
})
export type EmailTokenDocument = z.infer<typeof emailTokenDocument>

export const scoreDocument = z.object({
	_id: serializedObjectId,
	song: serializedObjectId,
	uploader: serializedObjectId,
	replayPath: z.string(),
	replayFileHash: z.hash('sha256'),
	childrenScores: z.array(serializedObjectId),
	/*
  v0_13_1: 0,
  v0_13_2: 1,
  v0_14: 2,
  v0_15: 3,
  */
	version: z.enum(YARGSPY.GameVersion),
	hidden: z.boolean(),
	/*
  // Instruments are reserved in multiples of 10
  // 0-9: 5-fret guitar
  FiveFretGuitar: 0,
  FiveFretBass: 1,
  FiveFretRhythm: 2,
  FiveFretCoopGuitar: 3,
  Keys: 4,
  // 10-19: 6-fret guitar
  SixFretGuitar: 10,
  SixFretBass: 11,
  SixFretRhythm: 12,
  SixFretCoopGuitar: 13,
  // 20-29: Drums
  FourLaneDrums: 20,
  ProDrums: 21,
  FiveLaneDrums: 22,
  EliteDrums: 23,
  // 30-39: Pro instruments
  ProGuitar_17Fret: 30,
  ProGuitar_22Fret: 31,
  ProBass_17Fret: 32,
  ProBass_22Fret: 33,
  ProKeys: 34,
  // 40-49: Vocals
  Vocals: 40,
  Harmony: 41,
  // 50-59: DJ
  // DjSingle: 50,
  // DjDouble: 51,
  Band: 255, // byte.MaxValue
  */
	instrument: z.enum(YARGSPY.Instrument),
	/*
  // Game modes are reserved in multiples of 5
  // 0-4: Guitar
  FiveFretGuitar: 0,
  SixFretGuitar: 1,

  // 5-9: Drums
  FourLaneDrums: 5,
  FiveLaneDrums: 6,
  EliteDrums: 7,

  // 10-14: Pro instruments
  ProGuitar: 10,
  ProKeys: 11, // Includes Pro and Five-Lane

  // 15-19: Vocals
  Vocals: 15,

  // 20-24: Other
  // Dj = 20,
  */
	gamemode: z.enum(YARGSPY.GameMode).optional(),
	/*
  Beginner: 0,
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Expert: 4,
  ExpertPlus: 5,
  */
	difficulty: z.enum(YARGSPY.Difficulty).optional(),
	/*
  Default: 0,
  Casual: 1,
  Precision: 2,
  */
	engine: z.enum(YARGSPY.Engine).optional(),
	/*
  AllStrums: 0,
  AllHopos: 1,
  AllTaps: 2,
  HoposToTaps: 3,
  TapsToHopos: 4,
  NoteShuffle: 5,
  NoKicks: 6,
  UnpitchedOnly: 7,
  NoDynamics: 8,
  NoVocalPercussion: 9,
  RangeCompress: 10,
  */
	modifiers: z.array(z.enum(YARGSPY.Modifier)),
	songSpeed: z.number(),
	createdAt: z.iso.datetime(),
	profileName: z.string().optional(),
	score: z.number(),
	stars: z.number(),
	notesHit: z.number().optional(),
	maxCombo: z.number().optional(),
	percent: z.number().optional(),
	starPowerPhrasesHit: z.number().optional(),
	starPowerActivationCount: z.number().optional(),
	overhits: z.number().optional(),
	ghostInputs: z.number().optional(),
	sustainScore: z.number().optional(),
	// averageMultiplier: z.number().optional(),
	soloBonuses: z.number().optional(),
	// numPauses: z.number().optional(),
	ghostNotesHit: z.number().optional(),
	accentNotesHit: z.number().optional(),
})
export type ScoreDocument = z.infer<typeof scoreDocument>

export const songDocument = z.object({
	_id: serializedObjectId,
	name: z.string(),
	nameSearch: z.string(),
	nameSort: z.string(),
	artist: z.string(),
	artistSearch: z.string(),
	artistSort: z.string(),
	charter: z.string().optional(),
	charterSearch: z.string().optional(),
	charterSort: z.string().optional(),
	album: z.string().optional(),
	albumSearch: z.string().optional(),
	albumSort: z.string().optional(),
	year: z.string().optional(),
	proDrums: z.boolean().optional(),
	fiveLaneDrums: z.boolean().optional(),
	sustainCutoffThreshold: z.number().optional(),
	hopoFrequency: z.number().optional(),
	multiplierNote: z.number().optional(),
	chartFileHash: z.hash('sha1'),
	isChart: z.boolean(),
	isRb3con: z.boolean(),
	availableInstruments: z.array(
		z.object({
			instrument: scoreDocument.shape.instrument,
			difficulty: scoreDocument.shape.difficulty,
			notes: z.number(),
			notes5LK: z.number().optional(),
			starPowerPhrases: z.number(),
		}),
	),
	playerCount: z.number(),
})
export type SongDocument = z.infer<typeof songDocument>
