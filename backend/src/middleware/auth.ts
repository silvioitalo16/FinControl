import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../integrations/supabase'
import { createError } from './errorHandler'

// Estende o tipo Request para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
      userMetadata?: Record<string, unknown>
    }
  }
}

/**
 * Middleware que valida o JWT do Supabase no header Authorization.
 * Use nas rotas que precisam de autenticação.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) throw createError('Token não fornecido.', 401, 'UNAUTHORIZED')

    const token = header.slice(7)
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data.user) throw createError('Token inválido ou expirado.', 401, 'INVALID_TOKEN')

    req.userId = data.user.id
    req.userEmail = data.user.email
    req.userMetadata = data.user.user_metadata
    next()
  } catch (err) {
    next(err)
  }
}
