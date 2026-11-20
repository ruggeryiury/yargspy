import fp from 'fastify-plugin'
import z from 'zod'

import { type GenericIdParams, type PatchUserStatusBody, genericIdParams, patchUserStatusBody, patchUserStatusSuccessData } from '@schemas'

import { YARGSPY } from '../../constants'
import { userBearerAuth } from '../../core/services/Auth'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const patchUserStatus = fp(async (app) => {
	app.patch<{ Body: PatchUserStatusBody; Params: GenericIdParams }>(
		'/v1/users/:id/status',
		{
			schema: {
				tags: ['Users'],
				summary: 'Changes an user active status on the server',
				description: '_This route needs administrator rights to access it._',
				response: {
					200: Swagger.replySchema('ok', patchUserStatusSuccessData.shape.data).describe('Default response. It also returns OK when the request is redundant (already active/banned)'),
					403: Swagger.replySchema('forbidden').describe('User banned for the server, or with no administrator rights'),
					404: Swagger.replySchema('not_found').describe('User not found using the provided ID'),
					422: Swagger.replySchema('validation_error').describe('Request body with validation errors, wrong entry ID format'),
				},
				body: patchUserStatusBody,
				params: genericIdParams,
				security: [
					{
						bearerAuth: [],
					},
				],
			},
			preHandler: app.auth([userBearerAuth({ admin: true })]),
		},
		async (req, reply) => {
			const { active, reason } = req.body
			const { id } = req.params

			const user = await app.dbFuncs.users.findById(id)

			// Check user existence and active status
			if (!user) throw new ServerError('err_user_not_found')
			if (user.active === active) {
				if (active) throw new ServerError('user_already_active')
				else throw new ServerError('user_already_banned')
			}

			// Toogle user scores visibility, no await because this can be async
			app.db.scores.updateMany({ uploader: new app.mongo.ObjectId(id) }, { $set: { hidden: !active } })

			await app.db.users.updateOne({ _id: new app.mongo.ObjectId(id) }, { active })

			await app.db.adminLogs.insertOne({
				_id: new app.mongo.ObjectId(),
				action: active ? YARGSPY.AdminLogAction.UserUnban : YARGSPY.AdminLogAction.UserBan,
				admin: req.userDocument._id,
				createdAt: new Date(),
				item: user._id,
				reason,
			})

			return success<z.infer<typeof patchUserStatusSuccessData.shape.data>>(req, reply, {
				code: 'ok',
				data: {
					user: id,
					active,
				},
			})
		},
	)
})
