import chalk from 'chalk'
import type { FastifyInstance } from 'fastify'
import { hostname, networkInterfaces } from 'node:os'
import { format } from 'node:util'
import stripAnsi from 'strip-ansi'
import type { Primitive } from 'type-fest'

/**
 * Decodes escaped characters commonly found in Chalk-formatted strings
 * and removes ANSI escape sequences.
 *
 * The following escape sequences are decoded:
 * - `\\uXXXX` - A four-digit Unicode escape sequence.
 * - `\\n` - A newline character.
 * - `\\r` - A carriage return character.
 *
 * ANSI escape sequences are removed from the resulting string.
 * - - - -
 * @param {string} value The encoded string to decode and sanitize.
 * @returns {string} The decoded string with ANSI escape sequences removed.
 */
export const decodeChalkString = (value: string): string => {
	return stripAnsi(
		value
			.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
			.replace(/\\n/g, '\n')
			.replace(/\\r/g, '\r'),
	)
}

export interface LogData {
	time: number
	msg: string
	pid: number
	hostname: string
	v: number
}

/**
 * A class with static methods related to logging.
 */
export class ServerLog {
	/**
	 * A wrapper to the `chalk` module, that cointains methods to stylize the logging messages.
	 */
	static chalk = chalk.bind(chalk)

	/**
	 * Generates a log data object containing information about the time and the machine which the logging were summoned.
	 * - - - -
	 * @param {string | undefined} [msg] `OPTIONAL` The message that will be embed to the log data object.
	 * @returns {LogData}
	 */
	static genLogData(msg: string = ''): LogData {
		return {
			time: Date.now(),
			msg,
			pid: process.pid,
			hostname: hostname(),
			v: 1,
		}
	}

	/**
	 * Retrieve the local internet url of the server.
	 * - - - -
	 * @param {FastifyInstance} fastify The Fastify instance of the server.
	 * @returns {string}
	 */
	static getNetInterfacePort(fastify: FastifyInstance): string {
		if (fastify.env.HOST) return `http://${fastify.env.HOST}:${fastify.env.PORT}`

		if (!fastify.isDev()) return `http://localhost:${fastify.env.PORT}`

		let url: string = ''
		const interfaces = networkInterfaces()

		const ips = Object.values(interfaces)
			.flatMap((addresses) => addresses ?? [])
			.filter((address) => address.family === 'IPv4' && !address.internal)
			.map((address) => address.address)

		for (const ip of ips) {
			url = `http://${ip}:${fastify.env.PORT}`
		}

		return url
	}

	static log(...args: any[]) {
		console.log(...args)
	}
	static write(...args: any[]) {
		process.stdout.write(format(...args))
	}

	/**
	 * Logs primitive values with highlighted values.
	 * - - - -
	 * @param val The value you want to log.
	 */
	static logPrimitive(val: Primitive): void {
		switch (typeof val) {
			case 'string':
				this.write(this.chalk.green(val))
				break
			case 'boolean':
			case 'undefined':
				this.write(this.chalk.yellow(val))
				break
			case 'number':
			case 'bigint':
				this.write(this.chalk.cyan(val))
				break
			case 'symbol':
			default:
				this.write(this.chalk.magenta(val))
				break
		}
	}
}
