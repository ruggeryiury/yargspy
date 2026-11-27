import type { FastifyReply, FastifyRequest } from 'fastify'
import type { LiteralUnion } from 'type-fest'

import { interpolateStr } from '../../lib/utils/strnum'

// #region HTTP Codes

export const httpCodes = {
	// 1xx: Informational
	100: 'Continue',
	101: 'Switching Protocols',
	102: 'Processing',
	103: 'Early Hints',

	// 2xx: Success
	200: 'OK',
	201: 'Created',
	202: 'Accepted',
	203: 'Non-Authoritative Information',
	204: 'No Content',
	205: 'Reset Content',
	206: 'Partial Content',
	207: 'Multi-Status',
	208: 'Already Reported',
	226: 'IM Used',

	// 3xx: Redirection
	300: 'Multiple Choices',
	301: 'Moved Permanently',
	302: 'Found',
	303: 'See Other',
	304: 'Not Modified',
	305: 'Use Proxy',
	307: 'Temporary Redirect',
	308: 'Permanent Redirect',

	// 4xx: Client Errors
	400: 'Bad Request',
	401: 'Unauthorized',
	402: 'Payment Required',
	403: 'Forbidden',
	404: 'Not Found',
	405: 'Method Not Allowed',
	406: 'Not Acceptable',
	407: 'Proxy Authentication Required',
	408: 'Request Timeout',
	409: 'Conflict',
	410: 'Gone',
	411: 'Length Required',
	412: 'Precondition Failed',
	413: 'Payload Too Large',
	414: 'URI Too Long',
	415: 'Unsupported Media Type',
	416: 'Range Not Satisfiable',
	417: 'Expectation Failed',
	418: "I'm a Teapot",
	421: 'Misdirected Request',
	422: 'Unprocessable Entity',
	423: 'Locked',
	424: 'Failed Dependency',
	425: 'Too Early',
	426: 'Upgrade Required',
	428: 'Precondition Required',
	429: 'Too Many Requests',
	431: 'Request Header Fields Too Large',
	451: 'Unavailable For Legal Reasons',

	// 5xx: Server Errors
	500: 'Internal Server Error',
	501: 'Not Implemented',
	502: 'Bad Gateway',
	503: 'Service Unavailable',
	504: 'Gateway Timeout',
	505: 'HTTP Version Not Supported',
	506: 'Variant Also Negotiates',
	507: 'Insufficient Storage',
	508: 'Loop Detected',
	510: 'Not Extended',
	511: 'Network Authentication Required',
} as const

export type HTTPStatusCodes = keyof typeof httpCodes
export type HTTPCodeNames = (typeof httpCodes)[HTTPStatusCodes]
export type CodeMapObject = Record<string, [HTTPStatusCodes, string]>

// #region Server Code Map
export const serverCodeMap = {
	// ACC_VERIFICATION_INVALID_OR_EXPIRED: [400, 'Invalid or expired account verification token'],
	// ALBUM_ID_NOT_FOUND: [404, 'No album entry found using the provided ID'],
	// AUTH_REQUIRED: [400, 'No user authorization token found on request headers'],
	// AUTH_TOKEN_ERROR: [401, 'An error occured while trying to decode provided user authorization token'],
	// AUTH_TOKEN_EXPIRED: [401, 'Provided authorization token has expired'],
	// AUTH_TOKEN_INVALID: [401, 'The provided token signature is invalid'],
	// BAD_REQUEST_NO_UPDATE: [400, 'Provided body sent no document fields to update'],
	// DUPLICATED_EMAIL: [409, `Provided e-mail is already being used`],
	// DUPLICATED_ID: [409, 'A song has the same entry ID from the provided song'],
	// DUPLICATED_INTERNAL_SONGNAME: [409, 'A song has the same internal songname from the provided song'],
	// DUPLICATED_SONG_ID: [409, 'A song has the same song ID from the provided song'],
	// DUPLICATED_USERNAME: [409, 'Provided username is already being used'],
	// FORBIDDEN_BANNED_USER: [403, 'User banned'],
	// FORBIDDEN_UNVERIFIED_USER: [403, 'You need to verify this account to use this resource'],
	// FORBIDDEN_NO_PRIVILEGES: [403, 'You have no privileges to access this route'],
	// IMAGE_PROCESSING_INVALID_CROP_DIMENSIONS: [400, 'Crop area exceeds image dimensions'],
	// INVALID_RB3_FILE: [400, 'The provided RB3 file is invalid or corrupted'],
	// INVALID_SONG_FORMAT_VERSION: [400, 'Only Rock Band 3 customs are allowed on Rockshelf Music Store'],
	// NO_PROFILE_IMAGE_UPLOADED: [400, 'No profile image uploaded for this request'],
	// PASSWORD_UPDATED_SUCCESS: [200, 'Password updated successfully.'],
	// RB3_PACK_NOT_SUPPORTED: [400, 'Provided RB3 file is a song package, only single song RB3 files are supported'],
	// RB3_SONG_FILES_ENCRYPTED: [400, "The song files can't be encrypted"],
	// RB3_SONG_PACKAGE_FILE_PROCESSING_ERROR: [400, 'Invalid or corrupted Rock Band 3 Song Package file'],
	// RESEND_RESET_PASSWORD_EMAIL_ACCEPTED: [200, 'Reset password e-mail sent to the provided user e-mail'],
	// RESEND_VERIFICATION_EMAIL_ACCEPTED: [200, 'If this account exists and needs verification, a new e-mail has been sent'],
	// ROUTE_NOT_FOUND: [404, 'Route: {{url}} ({{method}}) not found'],
	// SONG_FILE_TOO_LARGE: [413, 'Provided song file is too large'],
	// SONG_ID_NOT_FOUND: [404, 'No registered song found using the provided ID'],
	// SONGNAME_NOT_FOUND: [404, 'No registered song found using the provided songname'],
	// SUCCESS_AVATAR_UPLOAD: [200, 'Provided avatar uploaded'],
	// SUCCESS_GET_MYUSER_DETAILS: [200, 'Userdata retrieved'],
	// SUCCESS_GET_USER_DETAILS: [200, 'Userdata retrieved'],
	// SUCCESS_SONG_REGISTER: [201, 'Song entry registered'],
	// SUCCESS_USER_ACC_VERIFICATION: [200, 'User account verified'],
	// SUCCESS_USER_AVATAR_DELETED: [200, 'User avatar deleted'],
	// SUCCESS_USER_BANNED: [200, 'User {{user}} banned from the server'],
	// SUCCESS_USER_LOGIN: [200, 'Authorized login'],
	// SUCCESS_USER_REGISTER: [201, 'User account registered'],
	// UNAVAILABLE_SONG_FILE: [423, "The requested song file is being processed or modified and it's unavailable at the moment"],
	// USER_LOGIN_EMAIL_NOT_REGISTERED: [404, 'No registered account found using the provided e-mail'],
	// USER_LOGIN_WRONG_CREDENTIALS: [401, 'The provided credentials for user login is invalid'],
	// USER_NOT_FOUND: [404, 'No registered user found using the provided credentials'],
	// USER_PASSWORD_NO_LOWERCASE: [401, 'Provided user password has no lowercase letters'],
	// USER_PASSWORD_NO_NUMBERS: [401, 'Provided user password has no numbers'],
	// USER_PASSWORD_NO_SPECIAL_CHARS: [401, 'Provided user password has no special characters'],
	// USER_PASSWORD_NO_UPPERCASE: [401, 'Provided user password has no uppercase letters'],
	// USER_PASSWORD_TOO_BIG: [401, 'Provided user password is too big'],
	// USER_PASSWORD_TOO_SMALL: [401, 'Provided user password is too small'],
	// RB3_FILE_ALREADY_UPLOADED: [409, 'Provided RB3 file contents hash matches an already uploaded song'],
	// SONG_ID_NO_ARTWORK: [404, "The song doesn't have an artwork file"],
	// ARTIST_ID_NOT_FOUND: [404, 'No registered artist/band found using the provided ID'],

	err_auth_token: [401, 'An error occured while trying to decode provided user authorization token'],
	err_banned_user: [403, 'User banned'],
	err_captcha_validation: [401, 'The provided response to the captcha validation is invalid'],
	err_email_not_verified: [401, "The registered user's email address has not been verified yet"],
	err_file_register_bad_request: [400, 'One or more provided files are invalid'],
	err_login_wrong_credentials: [401, 'The provided credentials for user login are invalid'],
	err_not_implemented: [501, '{{feature}} not implemented yet'],
	err_password_no_lowercase: [401, 'Provided user password has no lowercase letters'],
	err_password_no_numbers: [401, 'Provided user password has no numbers'],
	err_password_no_special_chars: [401, 'Provided user password has no special characters'],
	err_password_no_uppercase: [401, 'Provided user password has no uppercase letters'],
	err_password_too_big: [401, 'Provided user password is too big'],
	err_password_too_small: [401, 'Provided user password is too small'],
	err_register_duplicated_email: [409, `Provided e-mail "{{email}}" is already being used`],
	err_register_duplicated_score: [409, 'Provided score is already registered on the database'],
	err_register_duplicated_song: [409, 'Provided song has already been registered'],
	err_register_duplicated_username: [409, 'Provided username "{{username}}" is already being used'],
	err_register_songdata_required: [422, 'Song not registered in the server database, the MIDI/CHART file and the song metadata file is required to register this song'],
	err_register_unmatched_chart_with_replay: [400, 'Provided CHART/MIDI file does not match with REPLAY chart file hash'],
	err_replay_invalid_chart_file: [422, 'Provided CHART file is not a valid CHART file'],
	err_replay_invalid_ini_file: [422, "Provided Clone Hero's INI file is not a valid INI file"],
	err_replay_invalid_midi_file: [422, 'Provided MIDI file is not a valid MIDI file'],
	err_replay_invalid_replay_file: [422, 'Provided REPLAY file is not a valid YARG REPLAY file'],
	err_score_not_found: [404, 'No registered score found using the provided credentials'],
	err_score_register_payload_too_large: [413, 'Provided files for song registered surpasses the 16MB payload limit'],
	err_score_register_songdata_required: [422, 'Song not registered in the server database, the MIDI/CHART file and the song metadata file is required to validate YARG Replay file and register new song'],
	err_song_not_found: [404, 'No registered song found using the provided credentials'],
	err_song_register_payload_too_large: [413, 'Provided files for song registered surpasses the 2MB payload limit'],
	err_unverified_user: [403, 'You need to verify this account to use this resource'],
	err_update_no_value: [400, 'At least one field must be provided for entry updating'],
	err_user_not_found: [404, 'No registered user found using the provided credentials'],
	ok_delete_entry: [204, 'Entry deleted successfully'],
	user_already_active: [200, 'User is already active'],
	user_already_banned: [200, 'User is already banned'],
	err_register_band_score_zeroed: [400, 'Provided score is zeroed on all played instruments'],
	err_replay_no_valid_players: [400, 'Provided YARG REPLAY file only contains players that played using custom engines unsupported by the server'],
	resend_verification_email_accepted: [200, 'If this account exists and needs verification, a new e-mail has been sent'],
	password_change_req_accepted: [200, 'If an account with that email exists, a password reset link has been sent'],
	err_invalid_auth_token: [401, 'Provided authorization token is invalid'],
	email_verification_success: [200, 'Your e-mail has been successfully verified'],
	password_reset_success: [200, 'Your password has been successfully reset'],
	reset_password_disabled: [503, 'The password reset function is disabled momentarily. Please try again later'],
	email_verification_disabled: [503, 'The e-mail verification function is disabled momentarily. Please try again later'],

	// Generic codes
	ok: [200, 'OK'],
	created: [201, 'Created'],
	bad_request: [400, 'Bad Request'],
	unauthorized: [401, 'Unauthorized'],
	forbidden: [403, 'Forbidden'],
	not_found: [404, 'Not Found'],
	route_not_found: [404, 'Route [{{method}}] "{{url}}" not found'],
	conflict: [409, 'Conflict'],
	unprocessable_entity: [422, 'Unprocessable Entity'],
	validation_error: [422, 'Provided request values have one of more validation errors'],
	payload_too_large: [413, 'Payload Too Large'],
	too_many_requests: [429, 'Too many requests, try again in {{count}}'],
	internal_server_error: [500, 'An unknown error occurred'],
	unknown_server_error: [500, 'An unknown error occurred'],
	not_implemented: [501, 'Not Implemented'],
	service_unavailable: [503, 'Service Unavailable'],
} satisfies CodeMapObject

export type ReplyCodeNames = keyof typeof serverCodeMap

export type ServerErrorCodeType = LiteralUnion<ReplyCodeNames, string>

export interface ServerErrorOptions<T extends Record<string, unknown> = Record<string, unknown>> {
	/**
	 * The code of the error, you can use declared error codes from the internal `serverCodeMap` object or use a custom error code.
	 *
	 * All custom error codes (not present on the `serverCodeMap` object) will have status code `500 INTERNAL SERVER ERROR`.
	 */
	code: ServerErrorCodeType
	/**
	 * A custom message that will override the default code message.
	 */
	message?: string
	/**
	 * An object with values that will interpolate on the provided code default message.
	 */
	messageValues?: Record<string, string>
	/**
	 * An object with values that can be appended to the server error instance.
	 */
	data?: T
}

/**
 * An error class used to properly assign values structured for default Fastify error handler.
 */
export class ServerError extends Error {
	override readonly name = 'ServerError'
	/**
	 * The status code of the error.
	 */
	statusCode: HTTPStatusCodes
	/**
	 * The status name of the error.
	 */
	statusName: HTTPCodeNames
	/**
	 * A formatted code description of the error
	 */
	code: ServerErrorCodeType
	/**
	 * An object with values to be send on the error response.
	 */
	data?: Record<string, unknown>
	error: undefined
	constructor(options: ServerErrorCodeType | ServerErrorOptions) {
		if (typeof options === 'string') {
			super(options in serverCodeMap ? serverCodeMap[options as ReplyCodeNames][1] : serverCodeMap.unknown_server_error[1])
			this.error = undefined
			this.statusCode = options in serverCodeMap ? serverCodeMap[options as ReplyCodeNames][0] : serverCodeMap.unknown_server_error[0]
			this.statusName = httpCodes[this.statusCode]
			this.code = options

			this.name = 'ServerError'
			Error.captureStackTrace(this, ServerError)
			return
		}
		const { code: c, message: m, messageValues: mv, data: d } = options
		super(m || (c in serverCodeMap ? interpolateStr(serverCodeMap[c as ReplyCodeNames][1], mv) : serverCodeMap.unknown_server_error[1]))
		this.error = undefined
		this.statusCode = c in serverCodeMap ? serverCodeMap[c as ReplyCodeNames][0] : serverCodeMap.unknown_server_error[0]
		this.statusName = httpCodes[this.statusCode]
		this.code = c
		if (d) this.data = d

		this.name = 'ServerError'
		Error.captureStackTrace(this, ServerError)
	}
}

export function success<T extends Record<string, unknown>>(_: FastifyRequest, reply: FastifyReply, options: ServerErrorCodeType | ServerErrorOptions<T>) {
	if (typeof options === 'string') {
		const message = options in serverCodeMap ? serverCodeMap[options as ReplyCodeNames][1] : serverCodeMap.unknown_server_error[1]
		const statusCode = options in serverCodeMap ? serverCodeMap[options as ReplyCodeNames][0] : serverCodeMap.unknown_server_error[0]
		const statusName = httpCodes[statusCode]
		const code = options

		const responseData = {
			statusCode,
			statusName,
			code,
			message,
		}

		// if (reply.server.env.LOG_SUCCESS) ServerLog.logResponse(req, responseData)

		return reply.status(statusCode).send(responseData)
	}
	const { code: c, message: m, messageValues, data } = options
	const message = m || (c in serverCodeMap ? interpolateStr(serverCodeMap[c as ReplyCodeNames][1], messageValues) : serverCodeMap.unknown_server_error[1])
	const statusCode = c in serverCodeMap ? serverCodeMap[c as ReplyCodeNames][0] : serverCodeMap.unknown_server_error[0]
	const statusName = httpCodes[statusCode]
	const code = c

	const responseData = {
		statusCode,
		statusName,
		code,
		message,
		data,
	}

	// if (reply.server.env.LOG_SUCCESS) ServerLog.logResponse(req, responseData)

	return reply.status(statusCode).send(responseData)
}
