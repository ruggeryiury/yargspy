import fp from 'fastify-plugin'

import { type PatchUserStatusBody, type GenericIdParams, patchUserStatusBody, genericIdParams } from '@schemas'

import { YARGSPY } from '../../constants'
import { userBearerAuth } from '../../core/services/Auth'
import { ServerError, success } from '../../core/services/ServerResponse'
import { Swagger } from '../../core/services/Swagger'

export const songUpdate = fp(async (fastify) => {
  fastify.patch<>(
    '/api/v1',
    {
      schema: {
        tags: [''],
        response: {
          200: Swagger.replySchema('ok'),
          401: Swagger.replySchema('bad_request'),
          403: Swagger.replySchema('forbidden'),
          409: Swagger.replySchema('conflict'),
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      preHandler: fastify.auth([userBearerAuth({ admin: true })]),
    },
    async (req, reply) => {
      
    },
  )
})
