import fp from 'fastify-plugin'
import { DirPath } from 'node-lib'

import type { SongModel } from './Database'

const serverRoot = () => DirPath.of(process.cwd())
const tempDir = () => serverRoot().gotoDir('temp')
const filesDir = () => serverRoot().gotoDir('files')
const replaysDir = () => serverRoot().gotoDir('files/replay')
const chartsDir = () => serverRoot().gotoDir('files/chart')

const fs = {
	init: async () => {
		const temp = tempDir()
		const replays = replaysDir()
		const charts = chartsDir()
		if (!temp.exists) await temp.mkDir()

		if (!replays.exists) await temp.mkDir(true)
		if (!charts.exists) await temp.mkDir(true)
	},
	serverRoot,
	tempDir,
	filesDir,
	replaysDir,
	chartsDir,
	getReplayFile: (replayFileName: string) => replaysDir().gotoFile(`${replayFileName}.replay`),
	getChartFile: (song: SongModel) => chartsDir().gotoFile(`${song.chartFileHash}.${song.isChart ? 'chart' : 'mid'}`),
} as const

declare module 'fastify' {
	interface FastifyInstance {
		fs: typeof fs
	}
}

export const FileSystem = fp(async (fastify) => {
	await fs.init()
	fastify.decorate('fs', fs)
})
