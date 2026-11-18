import z from 'zod'

import { genericServerResponse, songDocument } from '@schemas'

export const getSongDetailsSuccessData = genericServerResponse.extend({ data: z.object({ song: songDocument }) })
export type getSongDetailsSuccessData = z.infer<typeof getSongDetailsSuccessData>
