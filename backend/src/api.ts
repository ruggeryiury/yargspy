import axios from 'axios'

import { type AdminEntriesSuccessData, type GenericServerResponse, type PatchSongEntryBody, type PatchUserStatusBody, type PatchUserStatusSuccessData, type SerializedObjectId, type SongDeleteQuerystring, type TokenString, type UserLoginBody, type UserLoginSuccessData, type UserRegisterBody, type UserResolveBody, type UserResolveSuccessData, type UserScoresQuerystring, type UserScoresSuccessData } from '@schemas'
import type { getSongDetailsSuccessData } from './schemas/songs/getSongDetails.schemas'

export const serverAPIAxios = axios.create({ baseURL: 'http://localhost:5000/api/v1', validateStatus: (status) => status < 500 })

export const serverAPI = {
	admin: {
		adminEntries: (token: TokenString) => serverAPIAxios.get<AdminEntriesSuccessData>('admin/entries', { headers: { Authorization: `Bearer ${token}` } }),
	},
	scores: {
		songDelete: (token: TokenString, songId: SerializedObjectId, params: SongDeleteQuerystring) => serverAPIAxios.delete<GenericServerResponse>(`scores/${songId}`, { params, headers: { Authorization: `Bearer ${token}` } }),
	},
	songs: {
		getSongDetails: (songId: SerializedObjectId) => serverAPIAxios.get<getSongDetailsSuccessData>(`songs/${songId}/data`),
		patchSongEntry: (token: TokenString, songId: SerializedObjectId, body: PatchSongEntryBody) => serverAPIAxios.patch(`songs/${songId}/data`, body, { headers: { Authorization: `Bearer ${token}` } }),
		songDelete: (token: TokenString, songId: SerializedObjectId, params: SongDeleteQuerystring) => serverAPIAxios.delete<GenericServerResponse>(`songs/${songId}`, { params, headers: { Authorization: `Bearer ${token}` } }),
	},
	users: {
		register: (body: UserRegisterBody) => serverAPIAxios.post<GenericServerResponse>('users/register', body),
		patchUserStatus: (token: TokenString, userId: SerializedObjectId, body: PatchUserStatusBody) => serverAPIAxios.patch<PatchUserStatusSuccessData>(`users/${userId}/status`, body, { headers: { Authorization: `Bearer ${token}` } }),
		login: (body: UserLoginBody) => serverAPIAxios.post<UserLoginSuccessData>('users/register', body),
		resolve: (body: UserResolveBody) => serverAPIAxios.post<UserResolveSuccessData>('users/resolve', body),
		scores: (userId: SerializedObjectId, params: UserScoresQuerystring) => serverAPIAxios.get<UserScoresSuccessData>(`users/${userId}/scores`, { params }),
	},
} as const
