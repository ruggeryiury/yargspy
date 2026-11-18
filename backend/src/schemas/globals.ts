import z from 'zod'

// #region SerializedObjectId
export const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/
export const serializedObjectId = z
	.string()
	.regex(OBJECT_ID_REGEX)
	.transform((val) => val.toLowerCase())
export type SerializedObjectId = z.infer<typeof serializedObjectId>

// #region TokenString
export const tokenString = z.jwt({ alg: 'HS256' })
export type TokenString = z.infer<typeof tokenString>
// #region booleanValueAsString
export const booleanValueAsString = z.enum(['true', 'false', '0', '1']).transform((value) => value === 'true' || value === '1')
export type BooleanValueAsString = z.infer<typeof booleanValueAsString>

// #region officialPackageCodesSchema
export const officialPackageCodesSchema = z.union([z.literal('rb1'), z.literal('rb2'), z.literal('rb3'), z.literal('lego'), z.literal('greenday'), z.literal('rb4'), z.literal('rb3beta'), z.literal('rb1dlc'), z.literal('rb3dlc'), z.literal('rbb'), z.literal('rb4r'), z.literal('rbn'), z.literal('rbn2'), z.literal('tbbr'), z.literal('rbvr')])

// #region rb3CompatibleDTAFileSchema
export const rb3CompatibleDTAFileSchema = z.object({
	id: z.string(),
	name: z.string(),
	artist: z.string(),
	master: z.boolean(),
	fake: z.boolean().optional(),
	song_id: z.union([z.string(), z.number()]),
	upgrade_version: z.number().optional(),
	songname: z.string(),
	tracks_count: z.tuple([z.number().nonnegative().max(6), z.number().nonnegative().max(2), z.number().nonnegative().max(2), z.number().nonnegative().max(2), z.number().nonnegative().max(2), z.number().nonnegative().max(2), z.number().nonnegative().optional()]),
	pans: z.number().min(-2.5).max(2.5).array(),
	vols: z.number().min(-96).max(0).array(),
	cores: z.number().min(-1).max(1).array(),
	vocal_parts: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
	mute_volume: z.number().min(-96).max(0).optional(),
	mute_volume_vocals: z.number().min(-96).max(0).optional(),
	hopo_threshold: z.number().optional(),
	bank: z.union([z.literal('sfx/tambourine_bank.milo'), z.literal('sfx/cowbell_bank.milo'), z.literal('sfx/handclap_bank.milo'), z.literal('sfx/cowbell3_bank.milo')]),
	drum_bank: z.union([z.literal('sfx/kit01_bank.milo'), z.literal('sfx/kit02_bank.milo'), z.literal('sfx/kit03_bank.milo'), z.literal('sfx/kit04_bank.milo'), z.literal('sfx/kit05_bank.milo'), z.literal('sfx/rb2_kit01_bank.milo'), z.literal('sfx/rb1_kit_bank.milo'), z.literal('sfx/tbrb_kit_bank.milo')]).optional(),
	anim_tempo: z.number(),
	band_fail_cue: z.string().optional(),
	song_scroll_speed: z.number().optional(),
	preview: z.tuple([z.number(), z.number()]),
	song_length: z.number().positive(),
	rank_band: z.number().nonnegative(),
	rank_drum: z.number().nonnegative().optional(),
	rank_bass: z.number().nonnegative().optional(),
	rank_guitar: z.number().nonnegative().optional(),
	rank_vocals: z.number().nonnegative().optional(),
	rank_keys: z.number().nonnegative().optional(),
	rank_real_bass: z.number().nonnegative().optional(),
	rank_real_guitar: z.number().nonnegative().optional(),
	rank_real_keys: z.number().nonnegative().optional(),
	solo: z
		.union([z.literal('keys'), z.literal('drum'), z.literal('bass'), z.literal('guitar'), z.literal('vocal_percussion')])
		.array()
		.optional(),
	tuning_offset_cents: z.number().optional(),
	guide_pitch_volume: z.number().optional(),
	encoding: z.union([z.literal('utf8'), z.literal('latin1')]).optional(),
	format: z.number().nonnegative().optional(),
	version: z.number().nonnegative().optional(),
	game_origin: z.string(),
	rating: z.int().min(1).max(4),
	genre: z.string(),
	sub_genre: z.string().optional(),
	vocal_gender: z.union([z.literal('male'), z.literal('female')]),
	year_released: z.number(),
	year_recorded: z.number().optional(),
	album_art: z.boolean(),
	album_name: z.string().optional(),
	album_track_number: z.number().nonnegative().optional(),
	vocal_tonic_note: z.int().min(0).max(11).optional(),
	song_tonality: z.int().min(0).max(1).optional(),
	song_key: z.int().min(0).max(11).optional(),
	real_guitar_tuning: z.tuple([z.int(), z.int(), z.int(), z.int(), z.int(), z.int()]).optional(),
	real_bass_tuning: z.tuple([z.int(), z.int(), z.int(), z.int()]).optional(),
	extra_authoring: z.array(z.string()).optional(),
	alternate_path: z.boolean().optional(),
	context: z.int().optional(),
	pack_name: z.string().optional(),
	base_points: z.int().optional(),
	loading_phrase: z.string().optional(),
	strings_author: z.string().optional(),
	keys_author: z.string().optional(),
	covered_by: z.string().optional(),
	languages: z.string().array().optional(),
	multitrack: z.enum(['diy_stems', 'partial', 'karaoke', 'full'] as const).optional(),
	unpitchedVocals: z.boolean().optional(),
	convert: z.boolean().optional(),
	doubleKick: z.boolean().optional(),
	rhythmOn: z.enum(['keys', 'bass'] as const).nullish(),
	emh: z.enum(['cat', 'expert_only'] as const).nullish(),
	customsource: z
		.object({
			game_origin: z.string().optional(),
			genre: z.string().optional(),
			sub_genre: z.string().optional(),
		})
		.optional(),
	original_id: z.string().optional(),
})

// #region genericIdParam

export const genericIdParams = z.object({ id: serializedObjectId })
export type GenericIdParams = z.infer<typeof genericIdParams>

// #region GenericPaginationObject
export const genericPaginationObject = z.object({
	page: z.int(),
	limit: z.int(),
	skip: z.int(),
	totalResults: z.int(),
	totalPages: z.int(),
	pagesLeft: z.int(),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
})
export type GenericPaginationObject = z.infer<typeof genericPaginationObject>
