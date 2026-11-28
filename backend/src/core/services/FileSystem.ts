import type { FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { DirPath, FilePath, randomBytesFromRanges } from 'node-lib'

import type { ScoreModel, SongModel } from './Database'

const serverRoot = (overwriteRoot?: string) => (overwriteRoot ? DirPath.of(overwriteRoot) : DirPath.of(process.cwd()))

declare module 'fastify' {
	interface FastifyInstance {
		fs: {
			serverRoot: () => DirPath
			tempDir: () => DirPath
			filesDir: () => DirPath
			replaysDir: () => DirPath
			chartsDir: () => DirPath
			getReplayFile: (score: ScoreModel) => FilePath
			getChartFile: (song: SongModel) => FilePath
			getYARGReplayValidatorPath: () => FilePath
		}
	}
}

export interface FileRegisterTempPathsObject {
	replayTemp: FilePath
	midiTemp: FilePath
	chartTemp: FilePath
	iniTemp: FilePath
	dtaTemp: FilePath
	updateTemp: FilePath
	upgradeTemp: FilePath
	deleteAllTempFiles: () => Promise<void>
}

/**
 * A class with static methods related to the server file system.
 */
export class FileSystem {
	/**
	 * ## File System Plugin
	 *
	 * Creates folders used by the server and decorates the server's instance with quick file system resolvers.
	 */
	static plugin = fp(async (fastify): Promise<void> => {
		const temp = serverRoot(fastify.env.FS_SERVER_ROOT).gotoDir('temp')
		const replays = serverRoot(fastify.env.FS_FILES_ROOT || fastify.env.FS_SERVER_ROOT).gotoDir('files/replay')
		const charts = serverRoot(fastify.env.FS_FILES_ROOT || fastify.env.FS_SERVER_ROOT).gotoDir('files/chart')

		if (!temp.exists) await temp.mkDir()
		if (!replays.exists) await replays.mkDir(true)
		if (!charts.exists) await charts.mkDir(true)

		fastify.decorate('fs', {
			serverRoot: () => serverRoot(fastify.env.FS_SERVER_ROOT),
			tempDir: () => serverRoot(fastify.env.FS_SERVER_ROOT).gotoDir('temp'),
			filesDir: () => serverRoot(fastify.env.FS_FILES_ROOT || fastify.env.FS_SERVER_ROOT).gotoDir(`${!fastify.env.FS_FILES_ROOT ? 'files' : ''}`),
			replaysDir: () => serverRoot(fastify.env.FS_FILES_ROOT || fastify.env.FS_SERVER_ROOT).gotoDir(`${!fastify.env.FS_FILES_ROOT ? 'files/' : ''}replay`),
			chartsDir: () => serverRoot(fastify.env.FS_FILES_ROOT || fastify.env.FS_SERVER_ROOT).gotoDir(`${!fastify.env.FS_FILES_ROOT ? 'files/' : ''}chart`),
			getReplayFile: (score: ScoreModel) => serverRoot(fastify.env.FS_FILES_ROOT || fastify.env.FS_SERVER_ROOT).gotoFile(`${!fastify.env.FS_FILES_ROOT ? 'files/' : ''}replay/${score.replayPath}.replay`),
			getChartFile: (song: SongModel) => serverRoot(fastify.env.FS_FILES_ROOT || fastify.env.FS_SERVER_ROOT).gotoFile(`${!fastify.env.FS_FILES_ROOT ? 'files/' : ''}chart/${song.chartFileHash}.${song.isChart ? 'chart' : 'mid'}`),
			getYARGReplayValidatorPath: () => {
				const ext = process.platform === 'win32' ? 'exe' : 'dll'
				return serverRoot(fastify.env.FS_SERVER_ROOT).gotoFile(`${fastify.isDev() ? 'src' : 'dist'}/bin/YARGReplayValidator.${ext}`)
			},
		})
	})

	/**
	 * Generates a unique filename.
	 * - - - -
	 * @param extension The extension of the new file. Default is no extension.
	 * @returns {Promise<string>}
	 */
	static async genUniqueFilename(extension?: string): Promise<string> {
		const timestamp = Date.now().toString()
		const random = (await randomBytesFromRanges(3)).toString('hex')
		return `${timestamp}_${random.toUpperCase()}${extension ? (extension.startsWith('.') ? extension : `.${extension}`) : ''}`
	}

	/**
	 * Returns an object with file path pointers for several temporary files used on song/score registering routes.
	 * - - - -
	 * @param {FastifyRequest} req The request instance of a route handler
	 * @returns {Promise<FileRegisterTempPathsObject>}
	 */
	static async genFileRegisterTempPaths(req: FastifyRequest): Promise<FileRegisterTempPathsObject> {
		const temp = req.server.fs.tempDir()
		const uid = await this.genUniqueFilename()

		const replayTemp = temp.gotoFile(`${uid}.replay`)
		const midiTemp = temp.gotoFile(`${uid}.mid`)
		const chartTemp = temp.gotoFile(`${uid}.chart`)
		const iniTemp = temp.gotoFile(`${uid}.ini`)
		const dtaTemp = temp.gotoFile(`${uid}.dta`)
		const updateTemp = temp.gotoFile(`${uid}.update.mid`)
		const upgradeTemp = temp.gotoFile(`${uid}.upgrade.mid`)

		const deleteAllTempFiles = async (): Promise<void> => {
			if (replayTemp.exists) await replayTemp.delete()
			if (midiTemp.exists) await midiTemp.delete()
			if (chartTemp.exists) await chartTemp.delete()
			if (iniTemp.exists) await iniTemp.delete()
			if (dtaTemp.exists) await dtaTemp.delete()
			if (updateTemp.exists) await updateTemp.delete()
			if (upgradeTemp.exists) await upgradeTemp.delete()
		}
		return { replayTemp, midiTemp, chartTemp, iniTemp, dtaTemp, updateTemp, upgradeTemp, deleteAllTempFiles }
	}
}
