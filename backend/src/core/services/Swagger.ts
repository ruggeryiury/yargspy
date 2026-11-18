import { ZodAny, ZodNonOptional, ZodObject, ZodOptional, ZodUnknown, z } from 'zod'

import { genericServerResponse } from '@schemas'

import { type HTTPStatusCodes, type ServerErrorCodeType, httpCodes, serverCodeMap } from './ServerResponse'

/**
 * A class with helper methods to generate response schemas for Swagger documentation.
 */
export class Swagger {
	/**
	 * Generates a specific response schema with the exact status code and name provided from the response `code` argument.
	 *
	 * This is used to generate documented route responses for Swagger UI.
	 * - - - -
	 * @param {ServerErrorCodeType} code The code of the response you want to create the schema from.
	 * @param {ZodRawShape | undefined} [dataSchema] `OPTIONAL` An object with keys and value schemas to populate the response body `data` value.
	 * @link [Code map](./constants.ts).
	 */
	static replySchema(code: ServerErrorCodeType, dataSchema?: ZodObject | ZodNonOptional | ZodOptional | ZodAny | ZodUnknown) {
		const hasStatus = code in serverCodeMap
		const newStatusCode = hasStatus ? serverCodeMap[code as keyof typeof serverCodeMap][0] : (serverCodeMap.internal_server_error[0] as HTTPStatusCodes)
		let schema = genericServerResponse.extend({
			statusCode: z.literal(newStatusCode),
			statusName: z.literal(httpCodes[newStatusCode]),
		})

		if (dataSchema)
			schema = schema.extend({
				data: dataSchema,
			})
		return schema
	}

	/**
	 * Generates a specific response schema with the exact status code and name provided from the response `code` argument.
	 *
	 * This is used to generate documented route responses (that accept `multipart/form-data`) for Swagger UI.
	 * - - - -
	 * @param {string} mimeType The MIME type of the file sent by the response.
	 */
	static replySchemaWithFile(mimeType: string) {
		const schema = z.instanceof(Buffer).meta({ content: { [mimeType]: { schema: { type: 'string', format: 'binary' } } } })
		return schema
	}
}
