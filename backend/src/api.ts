import axios from 'axios'

import { type AdminEntriesSuccessData, type GenericServerResponse, type PatchUserStatusBody, type PatchUserStatusSuccessData, type PsongUpdateBody, type SerializedObjectId, type SongDeleteQuerystring, type TokenString, type UserLoginBody, type UserLoginSuccessData, type UserRegisterBody, type UserResolveQuerystring, type UserResolveSuccessData, type UserScoresQuerystring, type UserScoresSuccessData } from '@schemas'

import type { getSongDetailsSuccessData } from './schemas/songs/getSongDetails.schemas'

export const serverAPIAxios = axios.create({ baseURL: 'http://localhost:5000/api/v1', validateStatus: (status) => status < 500 })

export const serverAPI = {
	admin: {
		adminEntries: (token: TokenString) => serverAPIAxios.get<AdminEntriesSuccessData>('admin/entries', { headers: { Authorization: `Bearer ${token}` } }),
	},
	scores: {
		scoreDelete: (token: TokenString, scoreId: SerializedObjectId, body: SongDeleteQuerystring) => serverAPIAxios.post<GenericServerResponse>(`songs/${scoreId}/delete`, body, { headers: { Authorization: `Bearer ${token}` } }),
	},
	songs: {
		getSongDetails: (songId: SerializedObjectId) => serverAPIAxios.get<getSongDetailsSuccessData>(`songs/${songId}/data`),
		psongUpdate: (token: TokenString, songId: SerializedObjectId, body: PsongUpdateBody) => serverAPIAxios.patch(`songs/${songId}/data`, body, { headers: { Authorization: `Bearer ${token}` } }),
		songDelete: (token: TokenString, songId: SerializedObjectId, body: SongDeleteQuerystring) => serverAPIAxios.post<GenericServerResponse>(`songs/${songId}/delete`, body, { headers: { Authorization: `Bearer ${token}` } }),
		resolve: (body: UserResolveQuerystring) => serverAPIAxios.post<UserResolveSuccessData>('users/resolve', body),
	},
	users: {
		register: (body: UserRegisterBody) => serverAPIAxios.post<GenericServerResponse>('users/register', body),
		patchUserStatus: (token: TokenString, userId: SerializedObjectId, body: PatchUserStatusBody) => serverAPIAxios.patch<PatchUserStatusSuccessData>(`users/${userId}/status`, body, { headers: { Authorization: `Bearer ${token}` } }),
		login: (body: UserLoginBody) => serverAPIAxios.post<UserLoginSuccessData>('users/register', body),
		resolve: (body: UserResolveQuerystring) => serverAPIAxios.post<UserResolveSuccessData>('users/resolve', body),
		scores: (userId: SerializedObjectId, params: UserScoresQuerystring) => serverAPIAxios.get<UserScoresSuccessData>(`users/${userId}/scores`, { params }),
	},
} as const
