import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['src/index.ts', 'src/schemas.ts', 'src/api.ts', 'src/constants.ts'],
	fixedExtension: false,
	minify: true,
	unbundle: true,
	deps: {
		neverBundle: ['type-fest'],
	},
	alias: {
		'@schemas': './src/schemas.ts',
		'@lib/*': './src/lib/*',
	},
})
