import stripAnsi from 'strip-ansi'

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
