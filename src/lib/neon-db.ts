import { neon } from '@neondatabase/serverless'

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL || ''

if (!DATABASE_URL && typeof window !== 'undefined') {
  console.warn(
    'Aviso: VITE_NEON_DATABASE_URL não configurada. Configure a variável no seu arquivo .env ou nas variáveis da Vercel.'
  )
}

export const sql = neon(DATABASE_URL)


export interface NutricionistaRecord {
  id: string
  nome: string
  email: string
  created_at: string
}

export interface PacienteRecord {
  id: string
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
  created_at: string
  ultima_consulta?: string | null
}

export interface ConsultaRecord {
  id: string
  paciente_id: string
  data_consulta: string
  peso?: number | null
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
  created_at: string
}

export interface PacienteSemRetorno {
  id: string
  nome: string
  email?: string | null
  telefone?: string | null
  whatsapp?: string | null
  ultima_consulta: string
  dias_sem_consulta: number
}

export interface DashboardMetrics {
  totalPacientesAtivos: number
  consultasSemana: number
  pacientesSemRetorno: PacienteSemRetorno[]
  semanaInicio: string
  semanaFim: string
}

export interface NutricionistaStats {
  pacientesCount: number
  consultasCount: number
  planosCount: number
}

/**
 * Salva ou atualiza os dados do nutricionista na tabela public.nutricionistas
 */
export async function syncNutricionista(data: {
  id?: string
  nome: string
  email: string
}): Promise<NutricionistaRecord | null> {
  try {
    const cleanEmail = data.email.trim().toLowerCase()
    const cleanNome = data.nome.trim()

    let rows: any[]

    if (data.id) {
      rows = await sql.query(
        `INSERT INTO public.nutricionistas (id, nome, email, created_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (email)
         DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id, nome, email, created_at;`,
        [data.id, cleanNome, cleanEmail]
      )
    } else {
      rows = await sql.query(
        `INSERT INTO public.nutricionistas (nome, email, created_at)
         VALUES ($1, $2, now())
         ON CONFLICT (email)
         DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id, nome, email, created_at;`,
        [cleanNome, cleanEmail]
      )
    }

    if (rows && rows.length > 0) {
      return rows[0] as NutricionistaRecord
    }
    return null
  } catch (error) {
    console.error('Erro ao sincronizar nutricionista no banco Neon:', error)
    return await getNutricionistaByEmail(data.email)
  }
}

/**
 * Busca registro do nutricionista pelo email
 */
export async function getNutricionistaByEmail(email: string): Promise<NutricionistaRecord | null> {
  try {
    const cleanEmail = email.trim().toLowerCase()
    const rows = await sql.query(
      `SELECT id, nome, email, created_at FROM public.nutricionistas WHERE lower(email) = lower($1) LIMIT 1;`,
      [cleanEmail]
    )
    if (rows && rows.length > 0) {
      return rows[0] as NutricionistaRecord
    }
    return null
  } catch (error) {
    console.error('Erro ao buscar nutricionista no Neon:', error)
    return null
  }
}

/**
 * Busca estatísticas do consultório para o nutricionista logado
 */
export async function getNutricionistaStats(nutricionistaId?: string): Promise<NutricionistaStats> {
  try {
    if (!nutricionistaId) {
      return { pacientesCount: 0, consultasCount: 0, planosCount: 0 }
    }

    const pacientesRes = await sql.query(
      `SELECT count(*)::int as count FROM public.pacientes WHERE nutricionista_id = $1;`,
      [nutricionistaId]
    )

    const consultasRes = await sql.query(
      `SELECT count(*)::int as count FROM public.consultas c
       JOIN public.pacientes p ON c.paciente_id = p.id
       WHERE p.nutricionista_id = $1;`,
      [nutricionistaId]
    )

    const planosRes = await sql.query(
      `SELECT count(*)::int as count FROM public.planos_alimentares pa
       JOIN public.pacientes p ON pa.paciente_id = p.id
       WHERE p.nutricionista_id = $1;`,
      [nutricionistaId]
    )

    return {
      pacientesCount: pacientesRes[0]?.count ?? 0,
      consultasCount: consultasRes[0]?.count ?? 0,
      planosCount: planosRes[0]?.count ?? 0,
    }
  } catch (err) {
    console.error('Erro ao buscar estatísticas do nutricionista:', err)
    return { pacientesCount: 0, consultasCount: 0, planosCount: 0 }
  }
}

/**
 * Busca as métricas completas do Dashboard do Prompt 3:
 * Card 1: Total de pacientes ativos
 * Card 2: Consultas da semana
 * Card 3: Pacientes sem retorno (>30 dias e sem próximo retorno agendado)
 */
export async function getDashboardMetrics(nutricionistaId: string): Promise<DashboardMetrics> {
  try {
    if (!nutricionistaId) {
      return {
        totalPacientesAtivos: 0,
        consultasSemana: 0,
        pacientesSemRetorno: [],
        semanaInicio: '',
        semanaFim: '',
      }
    }

    // 1. Total de pacientes cadastrados pela nutricionista logada
    const totalPacientesPromise = sql.query(
      `SELECT count(*)::int as count FROM public.pacientes WHERE nutricionista_id = $1;`,
      [nutricionistaId]
    )

    // 2. Consultas na semana atual + datas de início e fim da semana
    const consultasSemanaPromise = sql.query(
      `SELECT 
         count(*)::int as count,
         to_char(date_trunc('week', CURRENT_DATE)::date, 'DD/MM') as semana_inicio,
         to_char((date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date, 'DD/MM') as semana_fim
       FROM public.consultas c
       JOIN public.pacientes p ON c.paciente_id = p.id
       WHERE p.nutricionista_id = $1
         AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
         AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date;`,
      [nutricionistaId]
    )

    // 3. Pacientes cuja última consulta foi há mais de 30 dias e não possuem próximo retorno agendado
    const pacientesSemRetornoPromise = sql.query(
      `SELECT 
         p.id,
         p.nome,
         p.email,
         p.telefone,
         p.whatsapp,
         to_char(MAX(c.data_consulta), 'YYYY-MM-DD') as ultima_consulta,
         (CURRENT_DATE - MAX(c.data_consulta))::int as dias_sem_consulta
       FROM public.pacientes p
       JOIN public.consultas c ON c.paciente_id = p.id
       WHERE p.nutricionista_id = $1
       GROUP BY p.id, p.nome, p.email, p.telefone, p.whatsapp
       HAVING MAX(c.data_consulta) < CURRENT_DATE - INTERVAL '30 days'
         AND NOT EXISTS (
           SELECT 1 FROM public.consultas c2 
           WHERE c2.paciente_id = p.id 
             AND c2.proximo_retorno >= CURRENT_DATE
         )
       ORDER BY ultima_consulta ASC;`,
      [nutricionistaId]
    )

    // Executa as 3 consultas simultaneamente em tempo real
    const [totalPacientesRes, consultasSemanaRes, semRetornoRes] = await Promise.all([
      totalPacientesPromise,
      consultasSemanaPromise,
      pacientesSemRetornoPromise,
    ])

    const totalPacientes = totalPacientesRes[0]?.count ?? 0
    const consultasSemana = consultasSemanaRes[0]?.count ?? 0
    const semanaInicio = consultasSemanaRes[0]?.semana_inicio || ''
    const semanaFim = consultasSemanaRes[0]?.semana_fim || ''

    const pacientesSemRetorno: PacienteSemRetorno[] = (semRetornoRes || []).map((row: any) => ({
      id: String(row.id),
      nome: String(row.nome),
      email: row.email ? String(row.email) : null,
      telefone: row.telefone ? String(row.telefone) : null,
      whatsapp: row.whatsapp ? String(row.whatsapp) : null,
      ultima_consulta: String(row.ultima_consulta),
      dias_sem_consulta: Number(row.dias_sem_consulta),
    }))

    return {
      totalPacientesAtivos: totalPacientes,
      consultasSemana: consultasSemana,
      pacientesSemRetorno,
      semanaInicio,
      semanaFim,
    }
  } catch (error) {
    console.error('Erro ao carregar métricas do dashboard do Neon:', error)
    return {
      totalPacientesAtivos: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
      semanaInicio: '',
      semanaFim: '',
    }
  }
}

/**
 * Lista todos os pacientes cadastrados pela nutricionista logada
 */
export async function getPacientesList(nutricionistaId: string): Promise<PacienteRecord[]> {
  try {
    const rows = await sql.query(
      `SELECT 
         p.*,
         to_char(MAX(c.data_consulta), 'YYYY-MM-DD') as ultima_consulta
       FROM public.pacientes p
       LEFT JOIN public.consultas c ON c.paciente_id = p.id
       WHERE p.nutricionista_id = $1 
       GROUP BY p.id
       ORDER BY p.nome ASC;`,
      [nutricionistaId]
    )
    return rows as PacienteRecord[]
  } catch (error) {
    console.error('Erro ao buscar lista de pacientes:', error)
    return []
  }
}

/**
 * Busca detalhes completos de um paciente junto com seu histórico de consultas
 */
export async function getPacienteComHistorico(
  pacienteId: string,
  nutricionistaId: string
): Promise<{ paciente: PacienteRecord; consultas: ConsultaRecord[] } | null> {
  try {
    const pacienteRows = await sql.query(
      `SELECT * FROM public.pacientes 
       WHERE id = $1 AND nutricionista_id = $2 
       LIMIT 1;`,
      [pacienteId, nutricionistaId]
    )

    if (!pacienteRows || pacienteRows.length === 0) {
      return null
    }

    const consultaRows = await sql.query(
      `SELECT 
         id,
         paciente_id,
         to_char(data_consulta, 'YYYY-MM-DD') as data_consulta,
         peso,
         cintura,
         quadril,
         percentual_gordura,
         observacoes,
         to_char(proximo_retorno, 'YYYY-MM-DD') as proximo_retorno,
         created_at
       FROM public.consultas 
       WHERE paciente_id = $1 
       ORDER BY data_consulta DESC;`,
      [pacienteId]
    )

    return {
      paciente: pacienteRows[0] as PacienteRecord,
      consultas: (consultaRows || []) as ConsultaRecord[],
    }
  } catch (error) {
    console.error('Erro ao buscar histórico do paciente:', error)
    return null
  }
}

/**
 * Cadastra um novo paciente para a nutricionista logada com todos os campos do Prompt 4
 */
export async function createPaciente(
  nutricionistaId: string,
  data: Partial<PacienteRecord>
): Promise<PacienteRecord | null> {
  try {
    const rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id,
         nome,
         data_nascimento,
         sexo,
         telefone,
         whatsapp,
         email,
         peso_inicial,
         altura,
         objetivos,
         objetivo_texto,
         nivel_atividade,
         patologias,
         restricoes_alimentares,
         alergias,
         medicamentos,
         suplementos,
         refeicoes_por_dia,
         horario_acorda,
         horario_dorme,
         litros_agua,
         atividade_fisica,
         atividade_fisica_descricao,
         observacoes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING *;`,
      [
        nutricionistaId,
        data.nome?.trim(),
        data.data_nascimento || null,
        data.sexo || null,
        data.telefone?.trim() || null,
        data.whatsapp?.trim() || null,
        data.email?.trim().toLowerCase() || null,
        data.peso_inicial != null && !isNaN(Number(data.peso_inicial)) ? Number(data.peso_inicial) : null,
        data.altura != null && !isNaN(Number(data.altura)) ? Number(data.altura) : null,
        data.objetivos && data.objetivos.length > 0 ? data.objetivos : null,
        data.objetivo_texto?.trim() || null,
        data.nivel_atividade || null,
        data.patologias && data.patologias.length > 0 ? data.patologias : null,
        data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null,
        data.alergias && data.alergias.length > 0 ? data.alergias : null,
        data.medicamentos?.trim() || null,
        data.suplementos?.trim() || null,
        data.refeicoes_por_dia != null && !isNaN(Number(data.refeicoes_por_dia)) ? Number(data.refeicoes_por_dia) : null,
        data.horario_acorda?.trim() || null,
        data.horario_dorme?.trim() || null,
        data.litros_agua != null && !isNaN(Number(data.litros_agua)) ? Number(data.litros_agua) : null,
        typeof data.atividade_fisica === 'boolean' ? data.atividade_fisica : null,
        data.atividade_fisica_descricao?.trim() || null,
        data.observacoes?.trim() || null,
      ]
    )
    return (rows[0] as PacienteRecord) || null
  } catch (error) {
    console.error('Erro ao cadastrar novo paciente no Neon:', error)
    throw error
  }
}

/**
 * Registra uma nova consulta para um paciente
 */
export async function createConsulta(
  pacienteId: string,
  data: {
    data_consulta: string
    peso?: number | null
    cintura?: number | null
    quadril?: number | null
    percentual_gordura?: number | null
    observacoes?: string | null
    proximo_retorno?: string | null
  }
): Promise<ConsultaRecord | null> {
  try {
    const rows = await sql.query(
      `INSERT INTO public.consultas (
         paciente_id,
         data_consulta,
         peso,
         cintura,
         quadril,
         percentual_gordura,
         observacoes,
         proximo_retorno
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        pacienteId,
        data.data_consulta,
        data.peso || null,
        data.cintura || null,
        data.quadril || null,
        data.percentual_gordura || null,
        data.observacoes || null,
        data.proximo_retorno || null,
      ]
    )
    return (rows[0] as ConsultaRecord) || null
  } catch (error) {
    console.error('Erro ao registrar consulta no Neon:', error)
    throw error
  }
}

/**
 * Cria pacientes e consultas de exemplo para demonstração e testes imediatos
 */
export async function seedDemoData(nutricionistaId: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!nutricionistaId) {
      return { success: false, message: 'ID do nutricionista inválido' }
    }

    // 1. Paciente sem retorno (última consulta há 45 dias, sem retorno agendado)
    const p1Rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id, nome, email, telefone, whatsapp, peso_inicial, altura, objetivo_texto, nivel_atividade
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;`,
      [
        nutricionistaId,
        'Mariana Souza',
        'mariana.souza@email.com',
        '(11) 98765-4321',
        '(11) 98765-4321',
        68.5,
        1.65,
        'Emagrecimento e melhora da disposição',
        'Moderado',
      ]
    )
    const p1Id = p1Rows[0].id

    // Consulta de Mariana há 45 dias SEM próximo retorno agendado
    await sql.query(
      `INSERT INTO public.consultas (
         paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
       ) VALUES ($1, CURRENT_DATE - INTERVAL '45 days', 68.5, 78, 102, 28.5, 'Primeira avaliação. Meta de perda de 4kg em 60 dias.', NULL);`,
      [p1Id]
    )

    // 2. Paciente com consulta na semana atual
    const p2Rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id, nome, email, telefone, whatsapp, peso_inicial, altura, objetivo_texto, nivel_atividade
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;`,
      [
        nutricionistaId,
        'Carlos Eduardo Silva',
        'carlos.silva@email.com',
        '(11) 99123-5566',
        '(11) 99123-5566',
        84.0,
        1.78,
        'Hipertrofia muscular e reeducação alimentar',
        'Intenso',
      ]
    )
    const p2Id = p2Rows[0].id

    // Consulta de Carlos na semana atual COM retorno agendado
    await sql.query(
      `INSERT INTO public.consultas (
         paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
       ) VALUES ($1, CURRENT_DATE, 83.2, 86, 98, 17.5, 'Evolução positiva. Aumento da ingestão proteica.', CURRENT_DATE + INTERVAL '30 days');`,
      [p2Id]
    )

    // 3. Paciente com consulta recente (<30 dias) e retorno agendado
    const p3Rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id, nome, email, telefone, whatsapp, peso_inicial, altura, objetivo_texto, nivel_atividade
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;`,
      [
        nutricionistaId,
        'Beatriz Oliveira',
        'beatriz.oliveira@email.com',
        '(11) 97654-1234',
        '(11) 97654-1234',
        61.0,
        1.62,
        'Manutenção de peso e controle de colesterol',
        'Leve',
      ]
    )
    const p3Id = p3Rows[0].id

    await sql.query(
      `INSERT INTO public.consultas (
         paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
       ) VALUES ($1, CURRENT_DATE - INTERVAL '12 days', 61.0, 72, 96, 23.0, 'Exames de sangue revisados. Dieta anti-inflamatória prescrita.', CURRENT_DATE + INTERVAL '18 days');`,
      [p3Id]
    )

    // 4. Paciente recém-cadastrado
    await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id, nome, email, telefone, whatsapp, peso_inicial, altura, objetivo_texto, nivel_atividade
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        nutricionistaId,
        'Lucas Ferreira',
        'lucas.ferreira@email.com',
        '(11) 98111-2233',
        '(11) 98111-2233',
        77.5,
        1.75,
        'Melhora da performance esportiva',
        'Muito Intenso',
      ]
    )

    return {
      success: true,
      message: 'Dados de demonstração inseridos com sucesso no Neon!',
    }
  } catch (error: any) {
    console.error('Erro ao gerar dados de demonstração:', error)
    return {
      success: false,
      message: error?.message || 'Falha ao inserir dados de demonstração',
    }
  }
}
