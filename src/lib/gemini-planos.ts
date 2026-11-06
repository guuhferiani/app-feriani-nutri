import { GoogleGenerativeAI } from '@google/generative-ai'

export interface DiaPlano {
  dia: string
  refeicoes: {
    cafe_da_manha: string[]
    lanche_manha: string[]
    almoco: string[]
    lanche_tarde: string[]
    jantar: string[]
  }
}

export interface PlanoAlimentarResponse {
  plano_semanal: DiaPlano[]
}

const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
]

/**
 * Gera um plano nutricional padrão/manual estruturado rigorosamente no padrão do sistema
 */
export function gerarPlanoManualFallback(paciente: any): PlanoAlimentarResponse {
  const restricoes = paciente?.restricoes_alimentares || []
  const alergias = paciente?.alergias || []
  const hasLactose = restricoes.includes('Lactose') || alergias.includes('Leite')
  const hasGluten = restricoes.includes('Glúten') || alergias.includes('Trigo')

  const leiteOpt = hasLactose ? 'Bebida vegetal de aveia ou amêndoas' : 'Iogurte natural desnatado ou leite semidesnatado'
  const paoOpt = hasGluten ? 'Tapioca com sementes de chia' : 'Pão 100% integral ou torrada multigrãos'

  return {
    plano_semanal: DIAS_SEMANA.map((dia, idx) => ({
      dia,
      refeicoes: {
        cafe_da_manha: [
          `Opção 1: ${paoOpt} com ovos mexidos e tomate picado`,
          `Opção 2: ${leiteOpt} batido com banana e farelo de aveia`,
          'Opção 3: Omelete de 2 claras e 1 gema com espinafre e orégano',
          'Opção 4: Frutas frescas picadas (mamão e maçã) com sementes de linhaça',
          'Opção 5: Café preto ou chá verde sem adição de açúcar refinado',
        ],
        lanche_manha: [
          'Opção 1: 1 maçã gala ou pera fresca com casca',
          'Opção 2: Mix de castanhas do Pará e nozes (30g)',
          `Opção 3: 1 porção de ${hasLactose ? 'fruta fresca' : 'queijo branco magro fresco'}`,
          'Opção 4: Lascas de coco seco in natura',
          'Opção 5: Chá de hortelã ou camomila com raspas de gengibre',
        ],
        almoco: [
          `Opção 1: Peito de frango grelhado (${120 + (idx % 2) * 20}g) com ervas finas`,
          'Opção 2: Arroz integral ou arroz 7 grãos com feijão carioca bem temperado',
          'Opção 3: Salada colorida à vontade (rúcula, alface americana, tomate e pepino)',
          'Opção 4: Legumes cozidos no vapor (brócolis, cenoura e abobrinha italiana)',
          'Opção 5: 1 colher de sobremesa de azeite de oliva extravirgem para tempero',
        ],
        lanche_tarde: [
          `Opção 1: ${leiteOpt} com canela em pó e morangos frescos`,
          'Opção 2: 2 ovos de codorna cozidos com tomatinhos cereja',
          'Opção 3: Vitamina de frutas com água de coco e folhas de hortelã',
          `Opção 4: ${hasGluten ? 'Biscoito de arroz integral' : 'Torrada integral leve'} com pasta de ricota magra`,
          'Opção 5: Gelatina diet ou infusão fria de hibisco com limão',
        ],
        jantar: [
          'Opção 1: Filé de peixe grelhado (tilápia ou pescada) com limão e alecrim',
          'Opção 2: Sopa nutritiva de abóbora cabotiá com frango desfiado',
          'Opção 3: Omelete de forno recheada com legumes variados',
          'Opção 4: Prato farto de folhas verdes escuras com azeite extravirgem',
          'Opção 5: 1 fatia de melão fresco ou infusão calmante antes de dormir',
        ],
      },
    })),
  }
}

/**
 * Handler universal para gerar plano alimentar usando Gemini ou fallback
 */
export async function handlerGerarPlano(body: { paciente: any; apiKey?: string }): Promise<PlanoAlimentarResponse> {
  const { paciente, apiKey } = body
  const globalScope = typeof globalThis !== 'undefined' ? (globalThis as any) : {}
  const geminiApiKey =
    apiKey ||
    globalScope?.process?.env?.GEMINI_API_KEY ||
    globalScope?.process?.env?.VITE_GEMINI_API_KEY ||
    (import.meta as any)?.env?.VITE_GEMINI_API_KEY

  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY não configurada no ambiente. Usando construtor manual inteligente de plano alimentar.')
    return gerarPlanoManualFallback(paciente)
  }

  const dadosPacienteTexto = `
- Nome: ${paciente?.nome || 'Paciente'}
- Sexo: ${paciente?.sexo || 'Não informado'}
- Peso: ${paciente?.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'}
- Altura: ${paciente?.altura ? `${paciente.altura} m` : 'Não informada'}
- Objetivos: ${(paciente?.objetivos || []).join(', ') || paciente?.objetivo_texto || 'Melhora da saúde e hábitos alimentares'}
- Nível de Atividade Física: ${paciente?.nivel_atividade || 'Não informado'}
- Patologias/Condições: ${(paciente?.patologias || []).join(', ') || 'Nenhuma relatada'}
- Restrições Alimentares: ${(paciente?.restricoes_alimentares || []).join(', ') || 'Nenhuma relatada'}
- Alergias Alimentares: ${(paciente?.alergias || []).join(', ') || 'Nenhuma relatada'}
- Medicamentos Contínuos: ${paciente?.medicamentos || 'Nenhum'}
- Suplementos: ${paciente?.suplementos || 'Nenhum'}
- Refeições por dia: ${paciente?.refeicoes_por_dia || '3 a 5'}
- Horário que acorda: ${paciente?.horario_acorda || '07:00'} | Horário que dorme: ${paciente?.horario_dorme || '23:00'}
- Água/dia: ${paciente?.litros_agua ? `${paciente.litros_agua} litros` : 'Não informado'}
- Observações gerais: ${paciente?.observacoes || 'Nenhuma'}
`.trim()

  const prompt = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteTexto}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
`.trim()

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    if (!responseText) {
      throw new Error('Resposta vazia da API Gemini.')
    }

    // Limpa possíveis marcações residuais se houver
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    if (parsed && Array.isArray(parsed.plano_semanal) && parsed.plano_semanal.length > 0) {
      return parsed as PlanoAlimentarResponse
    }

    throw new Error('Estrutura de JSON do plano semanal não condizente com o esperado.')
  } catch (error) {
    console.error('Erro na chamada da API Gemini, aplicando fallback manual estruturado:', error)
    return gerarPlanoManualFallback(paciente)
  }
}
