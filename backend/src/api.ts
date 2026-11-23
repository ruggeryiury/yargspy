import axios from 'axios'

import { type AdminEntriesSuccessData, type GenericServerResponse, type GetSongDetailsSuccessData, type GetSongLeaderboardsQuerystring, type GetSongLeaderboardsSuccessData, type GetUserDetailsSuccessData, type PatchUserStatusBody, type PatchUserStatusSuccessData, type ScoreDeleteQuerystring, type ScoreDeleteSuccessData, type SerializedObjectId, type SongDeleteQuerystring, type SongRegisterSuccessData, type SongResolveQuerystring, type SongResolveSuccessData, type SongUpdateBody, type TokenString, type UserLoginBody, type UserLoginSuccessData, type UserRegisterBody, type UserResolveSuccessData, type UserScoresQuerystring, type UserScoresSuccessData } from '@schemas'

export const serverAxios = axios.create({ baseURL: 'http://localhost:5000/v1', validateStatus: (status) => status < 500 })

export const serverAPI = {
	admin: {
		/**
		 * Returns a list of all the registered users with administrator rights.
		 */
		entries: (token: TokenString) => serverAxios.get<AdminEntriesSuccessData>('admin/entries', { headers: { Authorization: `Bearer ${token}` } }),
	},
	scores: {
		delete: (token: TokenString, scoreId: SerializedObjectId, params: ScoreDeleteQuerystring) => serverAxios.delete<ScoreDeleteSuccessData>(`scores/${scoreId}`, { params, headers: { Authorization: `Bearer ${token}` } }),
	},
	songs: {
		data: (songId: SerializedObjectId) => serverAxios.get<GetSongDetailsSuccessData>(`songs/${songId}`),
		delete: (token: TokenString, songId: SerializedObjectId, params: SongDeleteQuerystring) => serverAxios.delete<GenericServerResponse>(`songs/${songId}`, { params, headers: { Authorization: `Bearer ${token}` } }),
		leaderboards: (songId: SerializedObjectId, params: GetSongLeaderboardsQuerystring) => serverAxios.get<GetSongLeaderboardsSuccessData>(`songs/${songId}/leaderboards`, { params }),
		register: (token: TokenString, body: FormData) => serverAxios.post<SongRegisterSuccessData>('/songs/register', body, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }),
		resolve: (params: SongResolveQuerystring) => serverAxios.get<SongResolveSuccessData>('songs/resolve', { params }),
		update: (token: TokenString, songId: SerializedObjectId, body: SongUpdateBody) => serverAxios.patch<GenericServerResponse>(`songs/${songId}`, body, { headers: { Authorization: `Bearer ${token}` } }),
	},
	users: {
		data: (userId: SerializedObjectId) => serverAxios.get<GetUserDetailsSuccessData>(`users/${userId}`),
		patchUserStatus: (token: TokenString, userId: SerializedObjectId, body: PatchUserStatusBody) => serverAxios.patch<PatchUserStatusSuccessData>(`users/${userId}/status`, body, { headers: { Authorization: `Bearer ${token}` } }),
		login: (body: UserLoginBody) => serverAxios.post<UserLoginSuccessData>('users/login', body),
		register: (body: UserRegisterBody) => serverAxios.post<GenericServerResponse>('users/login', body),
		resolve: (params: SongResolveQuerystring) => serverAxios.get<UserResolveSuccessData>('users/resolve', { params }),
		scores: (userId: SerializedObjectId, params: UserScoresQuerystring) => serverAxios.get<UserScoresSuccessData>(`/users/${userId}/scores`, { params }),
	},
} as const
