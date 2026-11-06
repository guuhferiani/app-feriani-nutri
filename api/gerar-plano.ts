import type { IncomingMessage, ServerResponse } from 'http'
import { handlerGerarPlano } from '../src/lib/gemini-planos'

export default async function handler(req: any, res: any) {
  // Configuração de CORS se necessário
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const { paciente } = body

    if (!paciente) {
      return res.status(400).json({ error: 'Dados do paciente são obrigatórios.' })
    }

    const plano = await handlerGerarPlano({ paciente })
    return res.status(200).json(plano)
  } catch (error: any) {
    console.error('Erro na rota /api/gerar-plano:', error)
    return res.status(500).json({
      error: 'Erro interno ao processar o plano alimentar.',
      message: error?.message,
    })
  }
}

