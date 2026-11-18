import bcrypt from 'bcryptjs'
import fp from 'fastify-plugin'
import { type Collection, type InsertOneResult, ObjectId } from 'mongodb'
import { randomBytesFromRanges } from 'node-lib'
import { createHash } from 'node:crypto'
import z from 'zod'

import { validatePassword } from '@lib/validators/validatePassword'

import { YARGSPY } from '../../constants'
import { ServerError } from './ServerResponse'

// #region Declarations
declare module 'fastify' {
	interface FastifyInstance {
		db: {
			users: Collection<UserModel>
			adminLogs: Collection<AdminLogModel>
			emailTokens: Collection<EmailTokenModel>
			scores: Collection<ScoreModel>
			songs: Collection<SongModel>
			migrations: Collection<MigrationModel>
		}
		dbFuncs: {
			users: {
				/**
				 * Validates a provided password string. Automatically throws a `ServerError` when any of the password criterias don't match for the provided password string.
				 * - - - -
				 * @param {string} password The password to be validated.
				 * @returns {void}
				 * @throws {ServerError} When any of the password criterias don't match
				 */
				validateUserPassword: (password: string) => void
				/**
				 * Hashes the provided password with `bcrypt` password hashing algorithm and returns the hashed password.
				 * - - - -
				 * @param {string} password The password to be hashed.
				 * @returns {Promise<string>}
				 */
				hashPassword: (password: string) => Promise<string>
				/**
				 * Asynchronously finds an user by its e-mail and returns its database entry object. Returns `null` if the e-mail is not registered for any user.
				 * - - - -
				 * @param {string} email An e-mail address to fetch the user document from.
				 * @returns {Promise<UserModel | null>}
				 */
				findByEmail: (email: string) => Promise<UserModel | null>
				/**
				 * Asynchronously finds an user by its ID and returns its database entry object. Returns `null` if the provided ID doesn't match any user on the database registry.
				 * - - - -
				 * @param {string | ObjectId} id An ID to fetch the user document from.
				 * @returns {Promise<UserModel | null>}
				 */
				findById: (id: string | ObjectId) => Promise<UserModel | null>
				/**
				 * Asynchronously finds an user by its username and returns its database entry object. Returns `null` if the provided ID doesn't match any user on the database registry.
				 * - - - -
				 * @param {string | ObjectId} id An username to fetch the user document from.
				 * @returns {Promise<UserModel | null>}
				 */
				findByUsername: (username: string) => Promise<UserModel | null>
				/**
				 * Asynchronously compares a user entry password (hashed) and a route-provided password (raw) to validate an user login. Automatically throws a `ServerError` (code `USER_LOGIN_WRONG_CREDENTIALS`) when the route-provided password and the user entry password hash don't match.
				 * - - - -
				 * @param {string} password The raw password provided by the login request body.
				 * @param {string} passwordHash The hashed password from a user database entry.
				 * @returns {Promise<void>}
				 * @throws {ServerError} When the route-provided password and the user entry password hash don't match.
				 */
				comparePasswordForLogin: (password: string, passwordHash: string) => Promise<void>
				/**
				 * Signs a token that will identify and authenticate the user of subsequent requests.
				 * - - - -
				 * @param {FastifyRequest} req The request instance of the login handler.
				 * @param {UserModel} user The user document you want to sign the token for.
				 */
				signToken(req: FastifyRequest, user: UserModel): string
			}
			songs: {
				/**
				 * Asynchronously finds a song by its ID and returns its database entry object. Returns `null` if the provided ID doesn't match any song on the database registry.
				 * - - - -
				 * @param {string | ObjectId} id An ID to fetch the song document from.
				 * @returns {Promise<UserModel | null>}
				 */
				findById: (id: string | ObjectId) => Promise<SongModel | null>
				/**
				 * Asynchronously finds a song by its chart file hash and returns its database entry object. Returns `null` if the provided chart file hash doesn't match any song on the database registry.
				 * - - - -
				 * @param {string} chartFileHash The hash of the song's chart file
				 * @returns {Promise<UserModel | null>}
				 */
				findByChartFileHash: (chartFileHash: string) => Promise<SongModel | null>
				updateSongPlayCount: (id: string | ObjectId) => Promise<void>
			}
			scores: {
				/**
				 * Asynchronously finds a score by its ID and returns its database entry object. Returns `null` if the provided ID doesn't match any score on the database registry.
				 * - - - -
				 * @param {string | ObjectId} id An ID to fetch the score document from.
				 * @returns {Promise<ScoreModel | null>}
				 */
				findById: (id: string | ObjectId) => Promise<ScoreModel | null>
			}
			emailTokens: {
				issue: (id: string | ObjectId, purpose: 'reset' | 'verify') => Promise<{ document: InsertOneResult<{ _id: ObjectId; user: ObjectId; purpose: 0 | 1; tokenHash: string; expiresAt: Date; usedAt?: Date | undefined }>; token: string; tokenHash: string }>
			}
		}
	}
}

// #region Models
export const userModel = z.object({
	_id: z.instanceof(ObjectId),
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
	createdAt: z.date(),
	updatedAt: z.date(),
})
export type UserModel = z.infer<typeof userModel>

export const adminLogModel = z.object({
	_id: z.instanceof(ObjectId),
	admin: z.instanceof(ObjectId),
	/**
	 * UserBan: 0
	 * UserUnban: 1
	 * SongAdd: 2
	 * SongUpdate: 3
	 * SongDelete: 4
	 * ScoreDelete: 5
	 * UserUpdate: 6
	 */
	action: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
	item: z.instanceof(ObjectId), // ObjectID for any table
	reason: z.string().nonempty().optional(),
	createdAt: z.date(),
})
export type AdminLogModel = z.infer<typeof adminLogModel>

export const emailTokenModel = z.object({
	_id: z.instanceof(ObjectId),
	user: z.instanceof(ObjectId),
	/**
	 * Verify: 0
	 * Reset: 1
	 */
	purpose: z.union([z.literal(0), z.literal(1)]),
	tokenHash: z.hash('sha256'),
	usedAt: z.date().optional(),
	expiresAt: z.date(),
})
export type EmailTokenModel = z.infer<typeof emailTokenModel>

export const scoreModel = z.object({
	_id: z.instanceof(ObjectId),
	song: z.instanceof(ObjectId),
	uploader: z.instanceof(ObjectId),
	replayPath: z.string(),
	replayFileHash: z.hash('sha1'),
	childrenScores: z.array(z.instanceof(ObjectId)),
	/*
	v0_13_1: 0,
  v0_13_2: 1,
  v0_14: 2,
  v0_15: 3,
	*/
	version: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
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
	instrument: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(10), z.literal(11), z.literal(12), z.literal(13), z.literal(20), z.literal(21), z.literal(22), z.literal(23), z.literal(30), z.literal(31), z.literal(32), z.literal(33), z.literal(34), z.literal(40), z.literal(41), z.literal(255)]),
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
	gamemode: z.union([z.literal(0), z.literal(1), z.literal(5), z.literal(6), z.literal(7), z.literal(10), z.literal(11), z.literal(15)]),
	/*
	Beginner: 0,
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Expert: 4,
  ExpertPlus: 5,
	*/
	difficulty: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
	/*
	Default: 0,
  Casual: 1,
  Precision: 2,
	*/
	engine: z.union([z.literal(0), z.literal(1), z.literal(2)]),
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
	modifiers: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9), z.literal(10)]),
	songSpeed: z.number(),
	createdAt: z.date(),
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
export type ScoreModel = z.infer<typeof scoreModel>

export const songModel = z.object({
	_id: z.instanceof(ObjectId),
	name: z.string(),
	nameSearch: z.string(),
	nameSort: z.string(),
	artist: z.string(),
	artistSearch: z.string(),
	artistSort: z.string(),
	charter: z.string().optional(),
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
			instrument: scoreModel.shape.instrument,
			difficulty: scoreModel.shape.difficulty,
			notes: z.number(),
			notes5LK: z.number().optional(),
			starPowerPhrases: z.number(),
		}),
	),
	playerCount: z.number(),
})
export type SongModel = z.infer<typeof songModel>

export const migrationModel = z.object({
	_id: z.instanceof(ObjectId),
})
export type MigrationModel = z.infer<typeof migrationModel>

// #region Plugin
export const DatabasePlugin = fp(async (fastify) => {
	if (!fastify.mongo.db) throw new Error('Database decorator not implemented. Please start the MongoDB Plugin for Fastify first.')
	const adminLogs = fastify.mongo.db.collection<AdminLogModel>('admin_logs')
	const emailTokens = fastify.mongo.db.collection<EmailTokenModel>('email_tokens')
	const scores = fastify.mongo.db.collection<ScoreModel>('scores')
	const songs = fastify.mongo.db.collection<SongModel>('songs')
	const users = fastify.mongo.db.collection<UserModel>('users')
	const migrations = fastify.mongo.db.collection<MigrationModel>('migrations')
	if (!users || !adminLogs || !emailTokens || !scores || !songs || !migrations) throw new Error("Couldn't estabilish schema documents for the database")

	await users.createIndex('email', { unique: true, collation: { locale: 'en', strength: 2 } }, {})
	await users.createIndex('username', { unique: true, collation: { locale: 'en', strength: 2 } }, {})

	await emailTokens.createIndex('expiresAt', { expireAfterSeconds: 0 }, {})
	await songs.createIndex('chartFileHash', { unique: true }, {})

	fastify.decorateRequest('userDocument')

	fastify.decorate('db', { users, adminLogs, emailTokens, scores, songs, migrations })
	fastify.decorate('dbFuncs', {
		users: {
			validateUserPassword: (password) => {
				const { error: userPasswordError } = validatePassword(password, { minLength: 8, maxLength: 48 })

				if (userPasswordError) {
					switch (userPasswordError) {
						case 'tooSmall':
							throw new ServerError('err_password_too_small')
						case 'tooBig':
							throw new ServerError('err_password_too_big')
						case 'noUppercase':
							throw new ServerError('err_password_no_uppercase')
						case 'noLowercase':
							throw new ServerError('err_password_no_lowercase')
						case 'noNumbers':
							throw new ServerError('err_password_no_numbers')
						case 'noSpecialChars':
							throw new ServerError('err_password_no_special_chars')
					}
				}
			},
			hashPassword: async (password) => {
				const salt = await bcrypt.genSalt(12)
				const hashedPassword = await bcrypt.hash(password, salt)
				return hashedPassword
			},
			findByEmail: async (email) => await fastify.db.users.findOne({ email }),
			findById: async (id) => await fastify.db.users.findOne({ _id: new fastify.mongo.ObjectId(id) }),
			findByUsername: async (username) => await fastify.db.users.findOne({ username }),
			comparePasswordForLogin: async (password, passwordHash) => {
				const isCorrectPassword = await bcrypt.compare(password, passwordHash)
				if (!isCorrectPassword) throw new ServerError('err_login_wrong_credentials')
			},
			signToken: (req, user) => {
				return req.server.jwt.sign({ sub: user._id.toString() }, req.server.env.DISABLE_TOKEN_EXPIRATION && req.server.env.NODE_ENV === 'development' ? {} : { expiresIn: '30 days' })
			},
		},
		songs: {
			findById: async (id) => await fastify.db.songs.findOne({ _id: new fastify.mongo.ObjectId(id) }),
			findByChartFileHash: async (chartFileHash) => await fastify.db.songs.findOne({ chartFileHash }),
			updateSongPlayCount: async (id) => {
				const uniqueUsers = await fastify.db.scores.distinct('uploader', {
					song: new fastify.mongo.ObjectId(id),
					hidden: false,
					instrument: YARGSPY.Instrument.Band,
				})

				await fastify.db.songs.findOneAndUpdate(
					{ _id: new fastify.mongo.ObjectId(id) },
					{
						$set: {
							playerCount: uniqueUsers.length,
						},
					},
				)
			},
		},
		scores: {
			findById: async (id) => await fastify.db.scores.findOne({ _id: new fastify.mongo.ObjectId(id) }),
		},
		emailTokens: {
			issue: async (id, purpose) => {
				const token = (await randomBytesFromRanges(32)).toString('base64url')
				const tokenHash = createHash('sha256').update(token).digest('base64url')
				const ttl = purpose === 'verify' ? 60 : 30

				const document = await fastify.db.emailTokens.insertOne({
					_id: new fastify.mongo.ObjectId(),
					user: new fastify.mongo.ObjectId(id),
					purpose: purpose === 'verify' ? YARGSPY.UserTokenPurpose.Verify : YARGSPY.UserTokenPurpose.Reset,
					tokenHash,
					expiresAt: new Date(Date.now() + ttl * 60_000),
				})

				return { document, token, tokenHash }
			},
		},
	})
})
