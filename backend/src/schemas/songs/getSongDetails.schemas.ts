import z from 'zod'

import { songDocument } from '../db'
import { genericServerResponse } from '../response'

export const getSongDetailsSuccessData = genericServerResponse.extend({ data: z.object({ song: songDocument }) })
export type GetSongDetailsSuccessData = z.infer<typeof getSongDetailsSuccessData>
