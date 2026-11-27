import axios from 'axios'

import {
	type AdminEntriesSuccessData,
	type EmailVerificationResendBody,
	type EmailVerifyBody,
	type GenericServerResponse,
	type GetSongDetailsSuccessData,
	type GetSongLeaderboardsQuerystring,
	type GetSongLeaderboardsSuccessData,
	type GetUserDetailsSuccessData,
	type PatchUserStatusBody,
	type PatchUserStatusSuccessData,
	type RequestPasswordChangeBody,
	type RequestPasswordConfirmBody,
	type ScoreDeleteQuerystring,
	type ScoreDeleteSuccessData,
	type SerializedObjectId,
	type SongDeleteQuerystring,
	type SongRegisterSuccessData,
	type SongResolveQuerystring,
	type SongResolveSuccessData,
	type SongUpdateBody,
	type TokenString,
	type UserEntriesQuerystring,
	type UserEntriesSuccessData,
	type UserLoginBody,
	type UserLoginSuccessData,
	type UserRegisterBody,
	type UserResolveSuccessData,
	type UserScoresQuerystring,
	type UserScoresSuccessData,
} from '@schemas'

import { scoreRegisterSuccessData } from './schemas/scores/scoreRegister.schemas'

export const serverAxios = axios.create({ baseURL: 'http://localhost:5000/v1', validateStatus: (status) => status < 500 })

export const serverAPI = {
	admin: {
		/**
		 * Returns a list of all the registered users with administrator rights.
		 */
		entries: (token: TokenString) => serverAxios.get<AdminEntriesSuccessData>('admin/entries', { headers: { Authorization: `Bearer ${token}` } }),
	},
	emailVerification: {
		resend: (token: TokenString, body: EmailVerificationResendBody) => serverAxios.post<GenericServerResponse>(`email-verification/resend`, body, { headers: { Authorization: `Bearer ${token}` } }),
		verify: (body: EmailVerifyBody) => serverAxios.post<GenericServerResponse>('email-verification/verify', body),
	},
	passwordReset: {
		change: (body: RequestPasswordChangeBody) => serverAxios.post<GenericServerResponse>('password-reset/change', body),
		confirm: (body: RequestPasswordConfirmBody) => serverAxios.post<GenericServerResponse>('password-reset/confirm', body),
	},
	scores: {
		delete: (token: TokenString, scoreId: SerializedObjectId, params: ScoreDeleteQuerystring) => serverAxios.delete<ScoreDeleteSuccessData>(`scores/${scoreId}`, { params, headers: { Authorization: `Bearer ${token}` } }),
		register: (token: TokenString, body: FormData) => serverAxios.post<scoreRegisterSuccessData>('scores/register', body, { headers: { Authorization: `Bearer ${token}` } }),
	},
	songs: {
		delete: (token: TokenString, songId: SerializedObjectId, params: SongDeleteQuerystring) => serverAxios.delete<GenericServerResponse>(`songs/${songId}`, { params, headers: { Authorization: `Bearer ${token}` } }),
		getLeaderboards: (songId: SerializedObjectId, params: GetSongLeaderboardsQuerystring) => serverAxios.get<GetSongLeaderboardsSuccessData>(`songs/${songId}/leaderboards`, { params }),
		getSongDetails: (songId: SerializedObjectId) => serverAxios.get<GetSongDetailsSuccessData>(`songs/${songId}`),
		register: (token: TokenString, body: FormData) => serverAxios.post<SongRegisterSuccessData>('/songs/register', body, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }),
		resolve: (params: SongResolveQuerystring) => serverAxios.get<SongResolveSuccessData>('songs/resolve', { params }),
		update: (token: TokenString, songId: SerializedObjectId, body: SongUpdateBody) => serverAxios.patch<GenericServerResponse>(`songs/${songId}`, body, { headers: { Authorization: `Bearer ${token}` } }),
	},
	users: {
		entries: (params: UserEntriesQuerystring) => serverAxios.get<UserEntriesSuccessData>('users/entries', { params }),
		getUserDetails: (userId: SerializedObjectId) => serverAxios.get<GetUserDetailsSuccessData>(`users/${userId}`),
		login: (body: UserLoginBody) => serverAxios.post<UserLoginSuccessData>('users/login', body),
		patchUserStatus: (token: TokenString, userId: SerializedObjectId, body: PatchUserStatusBody) => serverAxios.patch<PatchUserStatusSuccessData>(`users/${userId}/status`, body, { headers: { Authorization: `Bearer ${token}` } }),
		register: (body: UserRegisterBody) => serverAxios.post<GenericServerResponse>('users/login', body),
		resolve: (params: SongResolveQuerystring) => serverAxios.get<UserResolveSuccessData>('users/resolve', { params }),
		scores: (userId: SerializedObjectId, params: UserScoresQuerystring) => serverAxios.get<UserScoresSuccessData>(`/users/${userId}/scores`, { params }),
	},
} as const
