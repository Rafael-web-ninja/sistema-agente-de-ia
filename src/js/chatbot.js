import { zapChatData } from './data.js';
import { openFlowBuilder, createNodeElement, getBezierPathData } from './flow-builder.js';

let searchQuery = '';
let channelFilter = 'all';
let statusFilter = 'all';
let chatbotViewMode = 'cards';
let activeChatbotMainTab = 'my';
let tplSearchQuery = '';
let tplCategoryFilter = 'all';
let currentSimulatedBot = null;
let currentEditingBot = null;

export const CHATBOT_TEMPLATES = [
  {
    id: 'tpl-delivery',
    name: 'Cardápio Digital & Pedidos Delivery',
    category: 'Delivery',
    channel: 'WhatsApp',
    stepsBadge: '5 blocos',
    stepsFlow: ['Bloco Inicial', 'Menu de Opções', 'Agente IA', 'CRM', 'Fila Humana'],
    description: 'Recepciona o cliente faminto, apresenta cardápio/promoções do dia, tira dúvidas de taxa de entrega com IA e registra o pedido no CRM.',
    trigger: 'Primeira mensagem recebida',
    integratedAiAgents: ['Juliana Santos'],
    canvasFlow: {
      nodes: [
        { id: 'node-start', type: 'start', title: 'Bloco Inicial', x: 60, y: 200, data: { subtitle: 'Cliente envia mensagem pedindo cardápio.', trigger: 'Primeira mensagem recebida', channel: 'WhatsApp' } },
        { id: 'node-menu-1', type: 'menu', title: 'Menu Delivery', x: 370, y: 150, data: { format: 'list_button', question: 'Olá {nome}! 🍔 Bem-vindo ao nosso Delivery! O que você deseja fazer agora?', message: 'Olá {nome}! 🍔 Bem-vindo ao nosso Delivery! O que você deseja fazer agora?', buttonTitle: 'VER OPÇÕES', options: [{ id: 'opt-cardapio', label: '📖 Ver Cardápio & Combos', description: 'Promoções quentinhas de hoje', ctr: 'CTR 65%' }, { id: 'opt-status', label: '🛵 Acompanhar meu Pedido', description: 'Status de entrega em tempo real', ctr: 'CTR 25%' }, { id: 'opt-atendente', label: '💬 Falar com Atendente', description: 'Dúvidas ou alterações no pedido', ctr: 'CTR 10%' }] } },
        { id: 'node-ai-1', type: 'ai_agent', title: 'IA Anotadora de Pedidos', agentName: 'Juliana Santos', x: 750, y: 90, data: { method: 'Agente de IA Conversacional', instructions: 'Apresente os combos mais vendidos, tire dúvidas sobre ingredientes, calcule a taxa de entrega por bairro e confirme a forma de pagamento (PIX ou Cartão).', branches: [{ id: 'b-qualified', triggerType: 'goal_reached', label: 'Pedido montado / Pronto para cozinha' }, { id: 'b-human', triggerType: 'human_handoff', label: 'Pediu atendente humano' }] } },
        { id: 'node-crm-1', type: 'crm', title: 'Registrar Pedido no CRM', x: 1120, y: 60, data: { stageId: 'ganho', priority: 'Alta', value: 85, notes: 'Pedido de delivery anotado pela IA' } },
        { id: 'node-human-1', type: 'human', title: 'Balcão / Expedição', actionType: 'transfer_human', targetPerson: 'Equipe Comercial', x: 1120, y: 280, data: { priority: 'Alta', description: 'Encaminha pedido para produção e motoboy' } }
      ],
      connections: [
        { id: 'c-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-menu-1', toPort: 'in' },
        { id: 'c-2', fromNode: 'node-menu-1', fromPort: 'opt-cardapio', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-3', fromNode: 'node-menu-1', fromPort: 'opt-status', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-4', fromNode: 'node-menu-1', fromPort: 'opt-atendente', toNode: 'node-human-1', toPort: 'in' },
        { id: 'c-5', fromNode: 'node-ai-1', fromPort: 'b-qualified', toNode: 'node-crm-1', toPort: 'in' },
        { id: 'c-6', fromNode: 'node-crm-1', fromPort: 'out', toNode: 'node-human-1', toPort: 'in' }
      ]
    }
  },
  {
    id: 'tpl-academia',
    name: 'Captação de Alunos & Aula Experimental',
    category: 'Academia',
    channel: 'WhatsApp',
    stepsBadge: '5 blocos',
    stepsFlow: ['Bloco Inicial', 'Menu de Opções', 'Agente IA', 'CRM', 'Transferir'],
    description: 'Apresenta planos (Mensal, Trimestral e Anual), agenda aula experimental gratuita com IA e envia o lead para o funil comercial no CRM.',
    trigger: 'Interesse em planos ou aula experimental',
    integratedAiAgents: ['Felipe Costa'],
    canvasFlow: {
      nodes: [
        { id: 'node-start', type: 'start', title: 'Bloco Inicial', x: 60, y: 200, data: { subtitle: 'Lead pergunta sobre mensalidade ou horários.', trigger: 'Qualquer mensagem inicial', channel: 'WhatsApp' } },
        { id: 'node-menu-1', type: 'menu', title: 'Objetivo do Aluno', x: 380, y: 140, data: { format: 'list_button', question: 'Fala, {nome}! 💪 Que ótimo ver você dando esse passo! Como podemos te ajudar hoje na academia?', message: 'Fala, {nome}! 💪 Que ótimo ver você dando esse passo! Como podemos te ajudar hoje na academia?', buttonTitle: 'ESCOLHER OPÇÃO', options: [{ id: 'opt-planos', label: '🏋️ Conhecer Planos e Valores', description: 'Musculação, Cross e Coletivas', ctr: 'CTR 54%' }, { id: 'opt-free', label: '🎟️ Agendar Aula Experimental Grátis', description: 'Treine 1 dia por nossa conta', ctr: 'CTR 36%' }, { id: 'opt-aluno', label: '🙋 Já sou Aluno', description: 'Financeiro ou ficha de treino', ctr: 'CTR 10%' }] } },
        { id: 'node-ai-1', type: 'ai_agent', title: 'Consultor Fitness IA', agentName: 'Felipe Costa', x: 760, y: 80, data: { method: 'Agente de IA Conversacional', instructions: 'Descubra o objetivo do aluno (emagrecimento, hipertrofia ou saúde), apresente a vantagem do Plano Anual e colete o melhor dia para a aula experimental.', branches: [{ id: 'b-done', triggerType: 'goal_reached', label: 'Aula experimental agendada' }, { id: 'b-human', triggerType: 'human_handoff', label: 'Quer fechar matrícula agora' }] } },
        { id: 'node-crm-1', type: 'crm', title: 'Enviar para Qualificação', x: 1140, y: 80, data: { stageId: 'qualificacao', priority: 'Alta', value: 149, notes: 'Lead agendou aula experimental pela IA' } },
        { id: 'node-act-1', type: 'action', title: 'Recepção da Academia', actionType: 'transfer', actionLabel: 'Transferir atendimento', transferType: 'human', transferTarget: 'Carlos Félix', x: 1140, y: 290, data: { description: 'Confirma horário na recepção' } }
      ],
      connections: [
        { id: 'c-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-menu-1', toPort: 'in' },
        { id: 'c-2', fromNode: 'node-menu-1', fromPort: 'opt-planos', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-3', fromNode: 'node-menu-1', fromPort: 'opt-free', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-4', fromNode: 'node-menu-1', fromPort: 'opt-aluno', toNode: 'node-act-1', toPort: 'in' },
        { id: 'c-5', fromNode: 'node-ai-1', fromPort: 'b-done', toNode: 'node-crm-1', toPort: 'in' },
        { id: 'c-6', fromNode: 'node-ai-1', fromPort: 'b-human', toNode: 'node-act-1', toPort: 'in' }
      ]
    }
  },
  {
    id: 'tpl-salao-beleza',
    name: 'Agendamento de Horários & Catálogo de Serviços',
    category: 'Salão de Beleza',
    channel: 'Instagram',
    stepsBadge: '4 blocos',
    stepsFlow: ['Bloco Inicial', 'Menu de Opções', 'Agente IA', 'CRM'],
    description: 'Atende clientes no Direct ou WhatsApp, mostra valores de cabelo, manicure e estética, verifica disponibilidade com IA e salva no CRM.',
    trigger: 'Interação no Direct / WhatsApp',
    integratedAiAgents: ['Carla Menezes'],
    canvasFlow: {
      nodes: [
        { id: 'node-start', type: 'start', title: 'Bloco Inicial', x: 60, y: 180, data: { subtitle: 'Cliente chama no Direct ou WhatsApp para agendar.', trigger: 'Mensagem inicial', channel: 'Instagram' } },
        { id: 'node-menu-1', type: 'menu', title: 'Escolha o Procedimento', x: 380, y: 140, data: { format: 'list_button', question: 'Oi, maravilhosa(o) ✨ Bem-vinda ao nosso Espaço de Beleza! Qual serviço você gostaria de agendar?', message: 'Oi, maravilhosa(o) ✨ Bem-vinda ao nosso Espaço de Beleza! Qual serviço você gostaria de agendar?', buttonTitle: 'VER SERVIÇOS', options: [{ id: 'opt-cabelo', label: '💇‍♀️ Cabelo (Corte, Mechas, Escova)', description: 'Especialistas em loiros e tratamentos', ctr: 'CTR 58%' }, { id: 'opt-unhas', label: '💅 Unhas & Design de Sobrancelhas', description: 'Manicure, gel e micropigmentação', ctr: 'CTR 42%' }] } },
        { id: 'node-ai-1', type: 'ai_agent', title: 'Concierge de Beleza IA', agentName: 'Carla Menezes', x: 750, y: 120, data: { method: 'Agente de IA Conversacional', instructions: 'Informe a tabela de valores, pergunte qual dia e período a cliente prefere e ofereça combo de hidratação.', branches: [{ id: 'b-crm', triggerType: 'goal_reached', label: 'Horário pré-reservado pela cliente' }] } },
        { id: 'node-crm-1', type: 'crm', title: 'Reservar no Funil CRM', x: 1120, y: 150, data: { stageId: 'proposta', priority: 'Alta', value: 220, notes: 'Agendamento solicitado via Salão de Beleza' } }
      ],
      connections: [
        { id: 'c-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-menu-1', toPort: 'in' },
        { id: 'c-2', fromNode: 'node-menu-1', fromPort: 'opt-cabelo', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-3', fromNode: 'node-menu-1', fromPort: 'opt-unhas', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-4', fromNode: 'node-ai-1', fromPort: 'b-crm', toNode: 'node-crm-1', toPort: 'in' }
      ]
    }
  },
  {
    id: 'tpl-imobiliaria',
    name: 'Qualificação de Compra/Aluguel & Visita ao Imóvel',
    category: 'Imobiliária',
    channel: 'WhatsApp',
    stepsBadge: '5 blocos',
    stepsFlow: ['Bloco Inicial', 'Menu de Opções', 'Agente IA', 'CRM', 'Fila Humana'],
    description: 'Identifica se o cliente busca compra, aluguel ou lançamento, filtra faixa de valor e bairro com IA, cria oportunidade no CRM e passa ao corretor.',
    trigger: 'Lead vindo de portal ou anúncio',
    integratedAiAgents: ['Juliana Santos'],
    canvasFlow: {
      nodes: [
        { id: 'node-start', type: 'start', title: 'Bloco Inicial', x: 60, y: 190, data: { subtitle: 'Lead interessado em imóvel.', trigger: 'Anúncio de Imóvel', channel: 'WhatsApp' } },
        { id: 'node-menu-1', type: 'menu', title: 'Interesse Imobiliário', x: 360, y: 150, data: { format: 'list_button', question: 'Olá {nome}! 🏡 Seja bem-vindo à nossa Imobiliária. Que tipo de imóvel você está buscando?', message: 'Olá {nome}! 🏡 Seja bem-vindo à nossa Imobiliária. Que tipo de imóvel você está buscando?', buttonTitle: 'ESCOLHER PERFIL', options: [{ id: 'opt-compra', label: '🔑 Comprar um Imóvel', description: 'Casas, apartamentos e terrenos', ctr: 'CTR 49%' }, { id: 'opt-aluguel', label: '📄 Alugar sem Fiador', description: 'Locação rápida e digital', ctr: 'CTR 35%' }, { id: 'opt-lanc', label: '🏗️ Lançamentos na Planta', description: 'Condições direto com a construtora', ctr: 'CTR 16%' }] } },
        { id: 'node-ai-1', type: 'ai_agent', title: 'IA Qualificadora Imobiliária', agentName: 'Juliana Santos', x: 720, y: 120, data: { method: 'Agente de IA Conversacional', instructions: 'Pergunte a região de preferência, número de quartos, faixa de investimento e se pretende utilizar financiamento ou FGTS.', branches: [{ id: 'b-ok', triggerType: 'goal_reached', label: 'Cliente qualificado para visita' }, { id: 'b-hum', triggerType: 'human_handoff', label: 'Falar direto com corretor' }] } },
        { id: 'node-crm-1', type: 'crm', title: 'Cadastrar Lead no CRM', x: 1090, y: 80, data: { stageId: 'qualificacao', priority: 'Alta', value: 4500, notes: 'Perfil imobiliário qualificado pela IA' } },
        { id: 'node-human-1', type: 'human', title: 'Corretor de Plantão', actionType: 'transfer_human', targetPerson: 'Equipe Comercial', x: 1410, y: 140, data: { priority: 'Alta', description: 'Corretor assume para agendar visita' } }
      ],
      connections: [
        { id: 'c-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-menu-1', toPort: 'in' },
        { id: 'c-2', fromNode: 'node-menu-1', fromPort: 'opt-compra', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-3', fromNode: 'node-menu-1', fromPort: 'opt-aluguel', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-4', fromNode: 'node-menu-1', fromPort: 'opt-lanc', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-5', fromNode: 'node-ai-1', fromPort: 'b-ok', toNode: 'node-crm-1', toPort: 'in' },
        { id: 'c-6', fromNode: 'node-crm-1', fromPort: 'out', toNode: 'node-human-1', toPort: 'in' }
      ]
    }
  },
  {
    id: 'tpl-clinica',
    name: 'Triagem de Pacientes & Agendamento de Consultas',
    category: 'Clínica',
    channel: 'WhatsApp',
    stepsBadge: '5 blocos',
    stepsFlow: ['Bloco Inicial', 'Conteúdo', 'Agente IA', 'CRM', 'Fila Humana'],
    description: 'Atende pacientes para clínica médica, odontológica ou estética, verifica convênio ou particular com IA e encaminha para a recepção.',
    trigger: 'Solicitação de consulta ou exame',
    integratedAiAgents: ['Carla Menezes'],
    canvasFlow: {
      nodes: [
        { id: 'node-start', type: 'start', title: 'Bloco Inicial', x: 60, y: 190, data: { subtitle: 'Paciente entra em contato pelo WhatsApp.', trigger: 'Mensagem inicial', channel: 'WhatsApp' } },
        { id: 'node-msg-1', type: 'message', title: 'Acolhimento da Clínica', x: 360, y: 160, data: { items: [{ id: 'it-1', type: 'text', text: 'Olá {nome}! 🩺 Bem-vindo(a) à nossa Clínica. É um prazer cuidar da sua saúde e bem-estar.', saved: true }, { id: 'it-2', type: 'delay', seconds: 2, typing: true }, { id: 'it-3', type: 'text', text: 'Você busca agendar uma consulta particular, por convênio ou tirar dúvidas sobre procedimentos?', saved: true }] } },
        { id: 'node-ai-1', type: 'ai_agent', title: 'Secretária Virtual IA', agentName: 'Carla Menezes', x: 700, y: 130, data: { method: 'Agente de IA Conversacional', instructions: 'Identifique a especialidade desejada, informe os dias de atendimento do especialista e colete o nome completo e preferência de horário do paciente.', branches: [{ id: 'b-neg', triggerType: 'goal_reached', label: 'Pré-agendamento realizado' }] } },
        { id: 'node-crm-1', type: 'crm', title: 'Enviar Paciente ao CRM', x: 1080, y: 120, data: { stageId: 'proposta', priority: 'Alta', value: 350, notes: 'Paciente triado pela Secretária IA' } },
        { id: 'node-human-1', type: 'human', title: 'Recepção da Clínica', actionType: 'transfer_human', targetPerson: 'Suporte VIP', x: 1400, y: 120, data: { priority: 'Alta', description: 'Confirmação de guia/horário na agenda médica' } }
      ],
      connections: [
        { id: 'c-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-msg-1', toPort: 'in' },
        { id: 'c-2', fromNode: 'node-msg-1', fromPort: 'out', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-3', fromNode: 'node-ai-1', fromPort: 'b-neg', toNode: 'node-crm-1', toPort: 'in' },
        { id: 'c-4', fromNode: 'node-crm-1', fromPort: 'out', toNode: 'node-human-1', toPort: 'in' }
      ]
    }
  },
  {
    id: 'tpl-ecommerce',
    name: 'Recuperação de Carrinho, Rastreio & Pós-venda',
    category: 'E-commerce',
    channel: 'WhatsApp',
    stepsBadge: '4 blocos',
    stepsFlow: ['Bloco Inicial', 'Menu de Opções', 'Agente IA', 'Encerrar Atendimento'],
    description: 'Automatiza o suporte da loja virtual: consulta status de pedido, libera cupom para fechar compra com IA e encerra o atendimento.',
    trigger: 'Dúvida de compra ou rastreio',
    integratedAiAgents: ['Pedro'],
    canvasFlow: {
      nodes: [
        { id: 'node-start', type: 'start', title: 'Bloco Inicial', x: 60, y: 190, data: { subtitle: 'Cliente da loja online chama no WhatsApp.', trigger: 'Atendimento Loja', channel: 'WhatsApp' } },
        { id: 'node-menu-1', type: 'menu', title: 'Central da Loja', x: 370, y: 140, data: { format: 'list_button', question: 'Oi {nome}! 🛍️ Bem-vindo à nossa Loja Oficial! Escolha como podemos te ajudar:', message: 'Oi {nome}! 🛍️ Bem-vindo à nossa Loja Oficial! Escolha como podemos te ajudar:', buttonTitle: 'OPÇÕES DA LOJA', options: [{ id: 'opt-comprar', label: '🔥 Quero Comprar com Desconto', description: 'Cupom de primeira compra', ctr: 'CTR 48%' }, { id: 'opt-rastreio', label: '📦 Rastrear meu Pedido', description: 'Código de rastreio e prazo', ctr: 'CTR 37%' }, { id: 'opt-troca', label: '🔄 Trocas e Devoluções', description: 'Solicitar garantia ou troca', ctr: 'CTR 15%' }] } },
        { id: 'node-ai-1', type: 'ai_agent', title: 'Especialista E-commerce IA', agentName: 'Pedro', x: 740, y: 130, data: { method: 'Agente de IA Conversacional', instructions: 'Ajude o cliente a escolher tamanho/modelo, ofereça o cupom BEMVINDO10 ou consulte o status de entrega.', branches: [{ id: 'b-end', triggerType: 'goal_reached', label: 'Dúvida resolvida pela IA' }] } },
        { id: 'node-end-1', type: 'end_chat', title: 'Encerrar Atendimento', x: 1110, y: 160, data: { sendMessage: true, closingMessage: 'Seu atendimento foi encerrado! Obrigado por comprar conosco. Qualquer novidade, estamos à disposição! 🛍️' } }
      ],
      connections: [
        { id: 'c-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-menu-1', toPort: 'in' },
        { id: 'c-2', fromNode: 'node-menu-1', fromPort: 'opt-comprar', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-3', fromNode: 'node-menu-1', fromPort: 'opt-rastreio', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-4', fromNode: 'node-menu-1', fromPort: 'opt-troca', toNode: 'node-ai-1', toPort: 'in' },
        { id: 'c-5', fromNode: 'node-ai-1', fromPort: 'b-end', toNode: 'node-end-1', toPort: 'in' }
      ]
    }
  }
];

export function initChatbotsView() {
  window.openSimulator = openSimulator;
  window.openFlowBuilder = openFlowBuilder;
  window.renderChatbotsList = renderChatbotsList;
  window.getChatbotTemplate = (tplId) => CHATBOT_TEMPLATES.find(t => t.id === tplId);

  renderChatbotKpis();
  renderChatbotsList();
  renderChatbotTemplates();
  setupChatbotEvents();
  setupNewChatbotModal();
  setupFlowBuilderModal();
  setupSimulatorModal();
}

/**
 * Render KPIs
 */
export function renderChatbotKpis() {
  const bots = zapChatData.chatbots.list;
  const activeBots = bots.filter(b => b.status === 'Ativo').length;
  const totalExecutions = bots.reduce((acc, b) => acc + (b.executions || 0), 0);

  const kpiActiveEl = document.getElementById('chatbot-kpi-active-val');
  const kpiExecutionsEl = document.getElementById('chatbot-kpi-executions-val');
  const tabMyCountEl = document.getElementById('chatbot-tab-my-count');
  const tabTplCountEl = document.getElementById('chatbot-tab-tpl-count');

  if (kpiActiveEl) kpiActiveEl.textContent = `${activeBots}`;
  if (kpiExecutionsEl) kpiExecutionsEl.textContent = totalExecutions.toLocaleString('pt-BR');
  if (tabMyCountEl) tabMyCountEl.textContent = `${bots.length}`;
  if (tabTplCountEl) tabTplCountEl.textContent = `${CHATBOT_TEMPLATES.length}`;
}

/**
 * Get filtered bots
 */
function getFilteredBots() {
  return zapChatData.chatbots.list.filter(bot => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (bot.name || '').toLowerCase().includes(q) ||
                    (bot.description || '').toLowerCase().includes(q) ||
                    (bot.trigger || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (channelFilter !== 'all' && bot.channel !== channelFilter) {
      return false;
    }
    if (statusFilter !== 'all' && bot.status !== statusFilter) {
      return false;
    }
    return true;
  });
}

/**
 * Render cards list
 */
export function renderChatbotsList() {
  const container = document.getElementById('chatbots-cards-grid');
  if (!container) return;

  container.classList.toggle('is-list-view', chatbotViewMode === 'list');

  const bots = getFilteredBots();

  if (bots.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius-lg); color: var(--text-muted);">
        <i data-lucide="bot" style="width: 32px; height: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 0 0 4px 0;">Nenhum chatbot encontrado</h4>
        <p style="font-size: 13px; margin: 0;">Tente ajustar seus filtros de busca ou crie um novo fluxo de atendimento.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = bots.map(bot => {
    return `
      <div class="chatbot-card" data-bot-id="${bot.id}">
        <div class="chatbot-card-header">
          <div class="chatbot-header-left">
            <div class="chatbot-icon-wrap channel-wa">
              <i data-lucide="workflow" style="width: 20px; height: 20px;"></i>
            </div>
            <div class="chatbot-title-box">
              <h3 class="chatbot-name" data-bot-name-id="${bot.id}" title="${bot.name}">${bot.name}</h3>
              <input type="text" class="chatbot-name-inline-input" data-bot-input-id="${bot.id}" value="${bot.name}" style="display:none;" />
              <div class="chatbot-tags-row">
                <span class="bot-badge-metric">
                  <i data-lucide="zap" style="width: 11px; height: 11px;"></i>
                  <span>${(bot.executions || 0).toLocaleString('pt-BR')} disparos</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="chatbot-desc-wrap" data-bot-desc-wrap="${bot.id}">
          ${bot.description ? `
            <div class="chatbot-desc-display" data-bot-desc-display="${bot.id}">
              <p class="chatbot-desc" data-bot-desc-text="${bot.id}" title="Clique para editar a descrição">${bot.description}</p>
              <div class="chatbot-desc-actions">
                <button type="button" class="chatbot-desc-action-btn btn-edit-bot-desc" data-bot-id="${bot.id}" title="Editar descrição">
                  <i data-lucide="pencil" style="width: 12px; height: 12px;"></i>
                </button>
                <button type="button" class="chatbot-desc-action-btn danger btn-clear-bot-desc" data-bot-id="${bot.id}" title="Remover descrição">
                  <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
              </div>
            </div>
          ` : `
            <button type="button" class="chatbot-desc-empty-btn btn-edit-bot-desc" data-bot-id="${bot.id}" data-bot-desc-display="${bot.id}">
              <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
              <span>Adicionar descrição...</span>
            </button>
          `}
          <textarea class="chatbot-desc-inline-input" data-bot-desc-input="${bot.id}" rows="2" placeholder="Digite uma descrição para este fluxo..." style="display:none;">${bot.description || ''}</textarea>
        </div>

        <div class="chatbot-card-footer">
          <div class="chatbot-card-footer-left">
            <button type="button" class="btn btn-primary btn-sm btn-edit-flow" data-bot-id="${bot.id}">
              <i data-lucide="share-2" style="width: 13px; height: 13px;"></i>
              <span>Editar fluxo</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm btn-simulate-bot" data-bot-id="${bot.id}">
              <i data-lucide="play" style="width: 13px; height: 13px; color: var(--primary);"></i>
              <span>Testar</span>
            </button>
          </div>
          <div class="chatbot-more-wrap">
            <button type="button" class="chatbot-more-btn btn-toggle-bot-menu" data-bot-id="${bot.id}" title="Mais opções" aria-label="Mais opções">
              <i data-lucide="more-horizontal" style="width: 16px; height: 16px;"></i>
            </button>
            <div class="chatbot-more-dropdown" data-bot-menu="${bot.id}">
              <button type="button" class="chatbot-more-item btn-duplicate-bot" data-bot-id="${bot.id}">
                <i data-lucide="copy" style="width: 15px; height: 15px;"></i>
                <span>Duplicar</span>
              </button>
              <button type="button" class="chatbot-more-item btn-rename-bot" data-bot-id="${bot.id}">
                <i data-lucide="pencil" style="width: 15px; height: 15px;"></i>
                <span>Renomear</span>
              </button>
              <button type="button" class="chatbot-more-item danger btn-delete-bot" data-bot-id="${bot.id}">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
  setupCardButtons();
}

/**
 * Setup card specific button clicks
 */
function setupCardButtons() {
  // Toggle status
  document.querySelectorAll('.btn-toggle-bot-status').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const botId = btn.getAttribute('data-bot-id');
      const bot = zapChatData.chatbots.list.find(b => b.id === botId);
      if (bot) {
        bot.status = bot.status === 'Ativo' ? 'Pausado' : 'Ativo';
        renderChatbotKpis();
        renderChatbotsList();
        if (window.showToast) window.showToast(`Chatbot "${bot.name}" ${bot.status.toLowerCase()} com sucesso!`);
      }
    });
  });

  // Edit flow
  document.querySelectorAll('.btn-edit-flow').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const botId = btn.getAttribute('data-bot-id');
      openFlowBuilder(botId);
    });
  });

  // Simulate bot
  document.querySelectorAll('.btn-simulate-bot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const botId = btn.getAttribute('data-bot-id');
      openSimulator(botId);
    });
  });

  // 3-dots dropdown menu toggle
  document.querySelectorAll('.btn-toggle-bot-menu').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const botId = btn.getAttribute('data-bot-id');
      const menu = document.querySelector(`.chatbot-more-dropdown[data-bot-menu="${botId}"]`);
      const isOpen = menu?.classList.contains('show');

      document.querySelectorAll('.chatbot-more-dropdown.show').forEach(m => m.classList.remove('show'));
      document.querySelectorAll('.btn-toggle-bot-menu.active').forEach(b => b.classList.remove('active'));

      if (menu && !isOpen) {
        menu.classList.add('show');
        btn.classList.add('active');
      }
    });
  });

  // Duplicate bot
  document.querySelectorAll('.btn-duplicate-bot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const botId = btn.getAttribute('data-bot-id');
      const idx = zapChatData.chatbots.list.findIndex(b => b.id === botId);
      if (idx !== -1) {
        const original = zapChatData.chatbots.list[idx];
        const cloned = JSON.parse(JSON.stringify(original));
        cloned.id = `bot-${Date.now()}`;
        cloned.name = `${original.name} (Cópia)`;
        cloned.executions = 0;
        cloned.updatedAt = 'Agora mesmo';
        zapChatData.chatbots.list.splice(idx + 1, 0, cloned);
        renderChatbotKpis();
        renderChatbotsList();
        if (window.showToast) window.showToast(`Fluxo "${cloned.name}" duplicado com sucesso!`);
      }
    });
  });

  // Rename bot (inline editing right on the card title)
  document.querySelectorAll('.btn-rename-bot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const botId = btn.getAttribute('data-bot-id');
      document.querySelectorAll('.chatbot-more-dropdown.show').forEach(m => m.classList.remove('show'));
      document.querySelectorAll('.btn-toggle-bot-menu.active').forEach(b => b.classList.remove('active'));

      const bot = zapChatData.chatbots.list.find(b => b.id === botId);
      const titleEl = document.querySelector(`.chatbot-name[data-bot-name-id="${botId}"]`);
      const inputEl = document.querySelector(`.chatbot-name-inline-input[data-bot-input-id="${botId}"]`);
      if (!bot || !titleEl || !inputEl) return;

      titleEl.style.display = 'none';
      inputEl.style.display = 'block';
      inputEl.value = bot.name;
      inputEl.focus();
      inputEl.select();

      const commitRename = (save) => {
        if (inputEl.style.display === 'none') return;
        inputEl.style.display = 'none';
        titleEl.style.display = '';
        if (save) {
          const newName = inputEl.value.trim();
          if (newName && newName !== bot.name) {
            bot.name = newName;
            titleEl.textContent = newName;
            titleEl.title = newName;
            if (window.showToast) window.showToast(`Fluxo renomeado para "${newName}"!`);
          }
        }
      };

      inputEl.onkeydown = (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          commitRename(true);
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          commitRename(false);
        }
      };
      inputEl.onblur = () => commitRename(true);
    });
  });

  // Edit description (clicking on the description text or the edit icon)
  const startDescEdit = (botId) => {
    const bot = zapChatData.chatbots.list.find(b => b.id === botId);
    const displayEl = document.querySelector(`[data-bot-desc-display="${botId}"]`);
    const inputEl = document.querySelector(`.chatbot-desc-inline-input[data-bot-desc-input="${botId}"]`);
    if (!bot || !displayEl || !inputEl) return;

    displayEl.style.display = 'none';
    inputEl.style.display = 'block';
    inputEl.value = bot.description || '';
    inputEl.focus();
    inputEl.select();

    const commitDesc = (save) => {
      if (inputEl.style.display === 'none') return;
      inputEl.style.display = 'none';
      if (save) {
        const newDesc = inputEl.value.trim();
        if (newDesc !== (bot.description || '')) {
          bot.description = newDesc;
          if (window.showToast) {
            window.showToast(newDesc ? 'Descrição atualizada!' : 'Descrição removida.');
          }
        }
      }
      renderChatbotsList();
    };

    inputEl.onkeydown = (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault();
        commitDesc(true);
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        commitDesc(false);
      }
    };
    inputEl.onblur = () => commitDesc(true);
  };

  document.querySelectorAll('.btn-edit-bot-desc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      startDescEdit(btn.getAttribute('data-bot-id'));
    });
  });

  document.querySelectorAll('[data-bot-desc-text]').forEach(p => {
    p.addEventListener('click', (e) => {
      e.stopPropagation();
      startDescEdit(p.getAttribute('data-bot-desc-text'));
    });
  });

  // Clear / Delete description
  document.querySelectorAll('.btn-clear-bot-desc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const botId = btn.getAttribute('data-bot-id');
      const bot = zapChatData.chatbots.list.find(b => b.id === botId);
      if (bot) {
        bot.description = '';
        renderChatbotsList();
        if (window.showToast) window.showToast('Descrição removida.');
      }
    });
  });

  // Delete bot
  document.querySelectorAll('.btn-delete-bot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const botId = btn.getAttribute('data-bot-id');
      const idx = zapChatData.chatbots.list.findIndex(b => b.id === botId);
      if (idx !== -1) {
        const name = zapChatData.chatbots.list[idx].name;
        zapChatData.chatbots.list.splice(idx, 1);
        renderChatbotKpis();
        renderChatbotsList();
        if (window.showToast) window.showToast(`Chatbot "${name}" excluído.`);
      }
    });
  });
}

/**
 * Filter and toolbar events
 */
function setupChatbotEvents() {
  const searchInput = document.getElementById('chatbot-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderChatbotsList();
    });
  }

  const channelSelect = document.getElementById('chatbot-filter-channel');
  if (channelSelect) {
    channelSelect.addEventListener('change', (e) => {
      channelFilter = e.target.value;
      renderChatbotsList();
    });
  }

  const statusSelect = document.getElementById('chatbot-filter-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      renderChatbotsList();
    });
  }

  const btnViewCards = document.getElementById('chatbot-btn-view-cards');
  const btnViewList = document.getElementById('chatbot-btn-view-list');
  if (btnViewCards && btnViewList) {
    btnViewCards.addEventListener('click', () => {
      chatbotViewMode = 'cards';
      btnViewCards.classList.add('active');
      btnViewList.classList.remove('active');
      renderChatbotsList();
    });
    btnViewList.addEventListener('click', () => {
      chatbotViewMode = 'list';
      btnViewList.classList.add('active');
      btnViewCards.classList.remove('active');
      renderChatbotsList();
    });
  }

  // Main Tabs: Meus Chatbots | Templates
  document.querySelectorAll('[data-chatbot-tab]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const targetTab = tabBtn.getAttribute('data-chatbot-tab') || 'my';
      switchChatbotMainTab(targetTab);
    });
  });

  // Template Search Input
  const tplSearchInput = document.getElementById('chatbot-tpl-search-input');
  if (tplSearchInput) {
    tplSearchInput.addEventListener('input', (e) => {
      tplSearchQuery = e.target.value.trim();
      renderChatbotTemplates();
    });
  }

  // Template Category Pills
  document.querySelectorAll('[data-tpl-cat]').forEach(pill => {
    pill.addEventListener('click', () => {
      tplCategoryFilter = pill.getAttribute('data-tpl-cat') || 'all';
      document.querySelectorAll('[data-tpl-cat]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderChatbotTemplates();
    });
  });

  // Close 3-dots dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.chatbot-more-wrap')) {
      document.querySelectorAll('.chatbot-more-dropdown.show').forEach(m => m.classList.remove('show'));
      document.querySelectorAll('.btn-toggle-bot-menu.active').forEach(b => b.classList.remove('active'));
    }
  });
}

/**
 * Switch between "Meus Chatbots" and "Templates" tabs
 */
export function switchChatbotMainTab(tabKey) {
  activeChatbotMainTab = tabKey;
  const paneMy = document.getElementById('chatbot-pane-my');
  const paneTpl = document.getElementById('chatbot-pane-templates');
  const btnMy = document.getElementById('tab-btn-my-chatbots');
  const btnTpl = document.getElementById('tab-btn-templates');

  if (tabKey === 'templates') {
    if (paneMy) paneMy.style.display = 'none';
    if (paneTpl) paneTpl.style.display = 'block';
    btnMy?.classList.remove('active');
    btnTpl?.classList.add('active');
    renderChatbotTemplates();
  } else {
    if (paneMy) paneMy.style.display = 'block';
    if (paneTpl) paneTpl.style.display = 'none';
    btnMy?.classList.add('active');
    btnTpl?.classList.remove('active');
    renderChatbotsList();
  }
}

/**
 * Render Ready-to-Use Chatbot Templates Grid
 */
export function renderChatbotTemplates() {
  const container = document.getElementById('chatbots-templates-grid');
  if (!container) return;

  const filtered = CHATBOT_TEMPLATES.filter(tpl => {
    if (tplCategoryFilter !== 'all' && tpl.category !== tplCategoryFilter) return false;
    if (tplSearchQuery) {
      const q = tplSearchQuery.toLowerCase();
      const match = tpl.name.toLowerCase().includes(q) ||
                    tpl.description.toLowerCase().includes(q) ||
                    tpl.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius-lg); color: var(--text-muted);">
        <i data-lucide="layout-template" style="width: 32px; height: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 0 0 4px 0;">Nenhum template encontrado</h4>
        <p style="font-size: 13px; margin: 0;">Tente buscar por outro termo ou selecione a categoria "Todos".</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(tpl => {
    return `
      <div class="chatbot-card chatbot-template-card" data-tpl-id="${tpl.id}">
        <div class="chatbot-card-header">
          <div class="chatbot-header-left" style="align-items: center;">
            <div class="chatbot-icon-wrap channel-wa">
              <i data-lucide="sparkles" style="width: 19px; height: 19px;"></i>
            </div>
            <div class="chatbot-title-box">
              <h3 class="chatbot-name" title="${tpl.name}">${tpl.name}</h3>
            </div>
          </div>
          <span class="chatbot-tpl-category-tag">${tpl.category}</span>
        </div>

        <p class="chatbot-desc">${tpl.description}</p>

        <div class="chatbot-card-footer">
          <div class="chatbot-card-footer-left" style="width: 100%; justify-content: space-between; gap: 6px;">
            <button type="button" class="btn btn-primary btn-sm btn-use-template" data-tpl-id="${tpl.id}" style="flex: 1; justify-content: center;">
              <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i>
              <span>Usar Template</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm btn-view-template-flow" data-tpl-id="${tpl.id}" title="Pré-visualizar diagrama completo do fluxo">
              <i data-lucide="eye" style="width: 13px; height: 13px; color: var(--primary);"></i>
              <span>Ver Fluxo</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm btn-preview-template" data-tpl-id="${tpl.id}" title="Simular conversa no WhatsApp">
              <i data-lucide="play" style="width: 13px; height: 13px; color: var(--primary);"></i>
              <span>Testar</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();

  // "Usar Template": opens popup for the user to register the Chatbot name
  container.querySelectorAll('.btn-use-template').forEach(btn => {
    btn.addEventListener('click', () => {
      const tplId = btn.getAttribute('data-tpl-id');
      const tpl = CHATBOT_TEMPLATES.find(t => t.id === tplId);
      if (tpl) openUseTemplateModal(tpl);
    });
  });

  // "Ver Fluxo": opens popup showing the complete visual flow canvas without leaving the screen
  container.querySelectorAll('.btn-view-template-flow').forEach(btn => {
    btn.addEventListener('click', () => {
      const tplId = btn.getAttribute('data-tpl-id');
      const tpl = CHATBOT_TEMPLATES.find(t => t.id === tplId);
      if (tpl) openTemplatePreviewModal(tpl);
    });
  });

  // "Testar" Template in Live Simulator before using
  container.querySelectorAll('.btn-preview-template').forEach(btn => {
    btn.addEventListener('click', () => {
      const tplId = btn.getAttribute('data-tpl-id');
      const tpl = CHATBOT_TEMPLATES.find(t => t.id === tplId);
      if (!tpl) return;
      openSimulator(tpl.id);
    });
  });
}

/**
 * Open popup to register the Chatbot Name when clicking "Usar Template"
 */
function openUseTemplateModal(tpl) {
  let modal = document.getElementById('modal-use-chatbot-template');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-use-chatbot-template';
    document.body.appendChild(modal);
  }
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 480px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(0, 168, 104, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i data-lucide="sparkles" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <h3 class="modal-title" style="margin: 0; font-size: 16px;">Usar Template de Chatbot</h3>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Template base: <strong>${tpl.name}</strong></p>
          </div>
        </div>
        <button type="button" class="modal-close" id="btn-close-use-tpl" aria-label="Fechar">&times;</button>
      </div>

      <form id="form-use-chatbot-template">
        <div class="modal-body" style="padding: 4px 0 18px 0; display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group" style="margin: 0;">
            <label class="form-label" for="use-tpl-bot-name">Nome do seu Chatbot <span style="color: #EF4444;">*</span></label>
            <input type="text" id="use-tpl-bot-name" class="form-input" placeholder="Ex: Atendimento ${tpl.category} - Principal" value="${tpl.name}" required>
            <span style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; display: block;">Escolha um nome para identificar este fluxo na sua lista de chatbots.</span>
          </div>
        </div>

        <div class="modal-footer" style="padding: 14px 0 0 0; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-use-tpl">Cancelar</button>
          <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <i data-lucide="check" style="width: 15px; height: 15px;"></i>
            <span>Criar Chatbot</span>
          </button>
        </div>
      </form>
    </div>
  `;

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();

  const nameInput = modal.querySelector('#use-tpl-bot-name');
  if (nameInput) {
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 40);
  }

  const closeModal = () => modal.classList.remove('active');
  modal.querySelector('#btn-close-use-tpl')?.addEventListener('click', closeModal);
  modal.querySelector('#btn-cancel-use-tpl')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#form-use-chatbot-template')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const customName = (nameInput?.value || '').trim() || tpl.name;
    const customChannel = modal.querySelector('#use-tpl-bot-channel')?.value || tpl.channel;
    closeModal();
    applyChatbotTemplate(tpl.id, false, customName, customChannel);
  });
}

/**
 * Add a template to "Meus Chatbots" and switch to the "Meus Chatbots" tab highlighting it
 */
function applyChatbotTemplate(tplId, openEditorImmediately = false, customName = null, customChannel = null) {
  const tpl = CHATBOT_TEMPLATES.find(t => t.id === tplId);
  if (!tpl) return;

  const clonedFlow = JSON.parse(JSON.stringify(tpl.canvasFlow));
  const finalName = customName || tpl.name;
  const finalChannel = customChannel || tpl.channel;

  const newBot = {
    id: `bot-${Date.now()}`,
    name: finalName,
    channel: finalChannel,
    status: 'Ativo',
    trigger: tpl.trigger,
    description: tpl.description,
    executions: 0,
    conversionRate: '0%',
    stepsCount: clonedFlow.nodes.length,
    updatedAt: 'Agora mesmo',
    integratedAiAgents: [...(tpl.integratedAiAgents || ['Juliana Santos'])],
    canvasFlow: clonedFlow,
    flow: {
      triggerText: tpl.trigger,
      initialMessage: 'Olá! Como posso ajudar você hoje?',
      options: []
    }
  };

  zapChatData.chatbots.list.unshift(newBot);
  renderChatbotKpis();
  switchChatbotMainTab('my');

  if (openEditorImmediately) {
    openFlowBuilder(newBot.id);
  } else {
    requestAnimationFrame(() => {
      const newCard = document.querySelector(`.chatbot-card[data-bot-id="${newBot.id}"]`);
      if (newCard) {
        newCard.classList.add('chatbot-card-newly-added');
        newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => newCard.classList.remove('chatbot-card-newly-added'), 2200);
      }
    });
  }

  if (window.showToast) {
    window.showToast(`Chatbot "${finalName}" criado com sucesso!`);
  }
}

/**
 * Open Visual Flow Canvas Popup for a Template (shows all connected blocks on a canvas without leaving the screen)
 */
function openTemplatePreviewModal(tpl) {
  let modal = document.getElementById('modal-template-flow-preview');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-template-flow-preview';
    document.body.appendChild(modal);
  }
  modal.className = 'modal-backdrop';

  const nodes = tpl.canvasFlow?.nodes || [];
  const connections = tpl.canvasFlow?.connections || [];

  modal.innerHTML = `
    <div class="modal-dialog tpl-flow-preview-dialog">
      <div class="modal-header" style="padding: 14px 20px; border-bottom: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(0, 168, 104, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i data-lucide="workflow" style="width: 18px; height: 18px;"></i>
          </div>
          <div style="min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h3 class="modal-title" style="margin: 0; font-size: 16px;">${tpl.name}</h3>
              <span class="chatbot-tpl-category-tag">${tpl.category}</span>
            </div>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              Arraste o quadro para navegar pelo fluxo completo ou use o zoom
            </p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="tpl-canvas-zoom-controls">
            <button type="button" class="tpl-zoom-btn" id="tpl-zoom-out" title="Diminuir zoom">
              <i data-lucide="minus" style="width: 13px; height: 13px;"></i>
            </button>
            <button type="button" class="tpl-zoom-val" id="tpl-zoom-label" title="Clique para reenquadrar todo o fluxo">75%</button>
            <button type="button" class="tpl-zoom-btn" id="tpl-zoom-in" title="Aumentar zoom">
              <i data-lucide="plus" style="width: 13px; height: 13px;"></i>
            </button>
            <button type="button" class="tpl-zoom-btn" id="tpl-zoom-center" title="Enquadrar fluxo completo">
              <i data-lucide="scan" style="width: 13px; height: 13px;"></i>
            </button>
            <button type="button" class="tpl-zoom-btn" id="tpl-zoom-fit" title="Expandir tela cheia">
              <i data-lucide="maximize-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
          <button type="button" class="modal-close" id="btn-close-tpl-preview" aria-label="Fechar">&times;</button>
        </div>
      </div>

      <div class="tpl-flow-canvas-viewport" id="tpl-flow-viewport">
        <div class="tpl-flow-canvas-world" id="tpl-flow-world">
          <svg class="tpl-flow-svg-layer" id="tpl-flow-svg"></svg>
          <div class="tpl-flow-nodes-layer" id="tpl-flow-nodes"></div>
        </div>
      </div>

      <div class="modal-footer" style="padding: 12px 20px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 10px;">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-tpl-modal-simulate">
          <i data-lucide="play" style="width: 14px; height: 14px; color: var(--primary);"></i>
          <span>Testar no Simulador</span>
        </button>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-tpl-modal-close-footer">Fechar</button>
          <button type="button" class="btn btn-primary btn-sm" id="btn-tpl-modal-use">
            <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i>
            <span>Usar este Template</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');

  const viewportEl = modal.querySelector('#tpl-flow-viewport');
  const worldEl = modal.querySelector('#tpl-flow-world');
  const nodesLayer = modal.querySelector('#tpl-flow-nodes');
  const svgLayer = modal.querySelector('#tpl-flow-svg');
  const zoomLabel = modal.querySelector('#tpl-zoom-label');

  // Render visual node cards inside the preview world
  const clonedFlow = JSON.parse(JSON.stringify(tpl.canvasFlow));
  clonedFlow.nodes.forEach(node => {
    const nodeEl = createNodeElement(node, clonedFlow);
    nodeEl.removeAttribute('id');
    nodeEl.setAttribute('data-tpl-node-id', node.id);
    nodeEl.style.pointerEvents = 'none';
    nodesLayer.appendChild(nodeEl);
  });

  if (window.lucide) window.lucide.createIcons();

  let pZoom = 0.72;
  let pPanX = 36;
  let pPanY = 36;

  const updatePreviewTransform = (smooth = false) => {
    if (worldEl) {
      worldEl.style.transition = smooth ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      worldEl.style.transform = `translate3d(${pPanX}px, ${pPanY}px, 0) scale(${pZoom})`;
    }
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(pZoom * 100)}%`;
    }
  };

  // Zoom around a specific viewport point (cx, cy) so flow never jumps off-screen
  const zoomAtPoint = (newZoom, cx, cy, smooth = false) => {
    const clamped = Math.min(1.3, Math.max(0.4, newZoom));
    const worldX = (cx - pPanX) / pZoom;
    const worldY = (cy - pPanY) / pZoom;
    pZoom = clamped;
    pPanX = Math.round(cx - worldX * pZoom);
    pPanY = Math.round(cy - worldY * pZoom);
    updatePreviewTransform(smooth);
  };

  // Draw Bezier cables between ports inside the preview world (immune to modal CSS scale transition)
  const drawPreviewConnections = () => {
    if (!svgLayer || !worldEl) return;
    const worldRect = worldEl.getBoundingClientRect();
    let pathsHtml = '';

    connections.forEach(conn => {
      const fromNodeEl = nodesLayer.querySelector(`[data-tpl-node-id="${conn.fromNode}"]`);
      const toNodeEl = nodesLayer.querySelector(`[data-tpl-node-id="${conn.toNode}"]`);
      if (!fromNodeEl || !toNodeEl) return;

      const fromPortEl = fromNodeEl.querySelector(`.node-port[data-port-id="${conn.fromPort}"]`) || fromNodeEl.querySelector('.port-out');
      const toPortEl = toNodeEl.querySelector(`.node-port[data-port-id="${conn.toPort || 'in'}"]`) || toNodeEl.querySelector('.port-in');

      if (!fromPortEl || !toPortEl) return;

      const fromNodeRect = fromNodeEl.getBoundingClientRect();
      const effectiveScale = (fromNodeRect.width / (fromNodeEl.offsetWidth || 280)) || pZoom;

      const fromRect = fromPortEl.getBoundingClientRect();
      const toRect = toPortEl.getBoundingClientRect();

      const x1 = Math.round((fromRect.left + fromRect.width / 2 - worldRect.left) / effectiveScale);
      const y1 = Math.round((fromRect.top + fromRect.height / 2 - worldRect.top) / effectiveScale);
      const x2 = Math.round((toRect.left + toRect.width / 2 - worldRect.left) / effectiveScale);
      const y2 = Math.round((toRect.top + toRect.height / 2 - worldRect.top) / effectiveScale);

      const sourceNode = clonedFlow.nodes.find(n => n.id === conn.fromNode);
      const cableType = sourceNode ? sourceNode.type : 'default';
      const d = getBezierPathData(x1, y1, x2, y2);
      pathsHtml += `<path d="${d}" class="builder-cable ${cableType}" fill="none" />`;
    });

    svgLayer.innerHTML = pathsHtml;
  };

  // Auto-fit flow into modal viewport
  const fitFlowToViewport = (smooth = false) => {
    if (!viewportEl || clonedFlow.nodes.length === 0) return;
    const vRect = viewportEl.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    clonedFlow.nodes.forEach(n => {
      const el = nodesLayer.querySelector(`[data-tpl-node-id="${n.id}"]`);
      const w = el ? el.offsetWidth : 280;
      const h = el ? el.offsetHeight : 180;
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + w > maxX) maxX = n.x + w;
      if (n.y + h > maxY) maxY = n.y + h;
    });

    const contentW = Math.max(400, maxX - minX + 100);
    const contentH = Math.max(260, maxY - minY + 100);
    const scaleX = (vRect.width - 56) / contentW;
    const scaleY = (vRect.height - 56) / contentH;
    pZoom = Math.min(0.88, Math.max(0.46, Math.min(scaleX, scaleY)));
    pPanX = Math.round((vRect.width - (maxX - minX) * pZoom) / 2 - minX * pZoom);
    pPanY = Math.round((vRect.height - (maxY - minY) * pZoom) / 2 - minY * pZoom);
    updatePreviewTransform(smooth);
    drawPreviewConnections();
  };

  requestAnimationFrame(() => {
    fitFlowToViewport(false);
  });

  // Pan & Zoom interactions inside the preview viewport
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  viewportEl?.addEventListener('mousedown', (e) => {
    isPanning = true;
    startX = e.clientX - pPanX;
    startY = e.clientY - pPanY;
    viewportEl.classList.add('is-panning');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    pPanX = e.clientX - startX;
    pPanY = e.clientY - startY;
    updatePreviewTransform(false);
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      viewportEl?.classList.remove('is-panning');
    }
  });

  viewportEl?.addEventListener('wheel', (e) => {
    e.preventDefault();
    const vRect = viewportEl.getBoundingClientRect();
    const cx = e.clientX - vRect.left;
    const cy = e.clientY - vRect.top;
    const delta = e.deltaY < 0 ? 0.07 : -0.07;
    zoomAtPoint(pZoom + delta, cx, cy, false);
  }, { passive: false });

  modal.querySelector('#tpl-zoom-in')?.addEventListener('click', () => {
    const vRect = viewportEl.getBoundingClientRect();
    zoomAtPoint(pZoom + 0.1, vRect.width / 2, vRect.height / 2, true);
  });

  modal.querySelector('#tpl-zoom-out')?.addEventListener('click', () => {
    const vRect = viewportEl.getBoundingClientRect();
    zoomAtPoint(pZoom - 0.1, vRect.width / 2, vRect.height / 2, true);
  });

  modal.querySelector('#tpl-zoom-center')?.addEventListener('click', () => fitFlowToViewport(true));
  modal.querySelector('#tpl-zoom-label')?.addEventListener('click', () => fitFlowToViewport(true));

  modal.querySelector('#tpl-zoom-fit')?.addEventListener('click', () => {
    const dialogEl = modal.querySelector('.tpl-flow-preview-dialog');
    const fitBtn = modal.querySelector('#tpl-zoom-fit');
    if (dialogEl) {
      const isExpanded = dialogEl.classList.toggle('is-expanded');
      if (fitBtn) {
        fitBtn.title = isExpanded ? 'Restaurar tamanho' : 'Expandir tela cheia';
        fitBtn.innerHTML = `<i data-lucide="${isExpanded ? 'minimize-2' : 'maximize-2'}" style="width: 13px; height: 13px;"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
      setTimeout(() => {
        fitFlowToViewport();
      }, 60);
    } else {
      fitFlowToViewport();
    }
  });

  const closeModal = () => modal.classList.remove('active');
  modal.querySelector('#btn-close-tpl-preview')?.addEventListener('click', closeModal);
  modal.querySelector('#btn-tpl-modal-close-footer')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#btn-tpl-modal-simulate')?.addEventListener('click', () => {
    closeModal();
    openSimulator(tpl.id);
  });

  modal.querySelector('#btn-tpl-modal-use')?.addEventListener('click', () => {
    closeModal();
    openUseTemplateModal(tpl);
  });
}

/**
 * Open Legacy Modal Flow Builder (fallback)
 */
export function openLegacyModalFlowBuilder(botId) {
  const bot = zapChatData.chatbots.list.find(b => b.id === botId);
  if (!bot) return;
  currentEditingBot = bot;

  document.getElementById('flow-builder-bot-name').textContent = bot.name;
  document.getElementById('flow-builder-bot-channel').textContent = bot.channel;
  document.getElementById('flow-input-trigger').value = bot.flow.triggerText || bot.trigger;
  document.getElementById('flow-input-message').value = bot.flow.initialMessage;

  renderFlowOptionsEditor(bot);

  if (window.openModal) window.openModal('modal-flow-builder');
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Render options in Flow Builder
 */
function renderFlowOptionsEditor(bot) {
  const container = document.getElementById('flow-builder-options-container');
  if (!container) return;

  const agents = zapChatData.agentes.list;

  container.innerHTML = bot.flow.options.map((opt, index) => {
    return `
      <div class="flow-option-card">
        <div class="flow-option-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="flow-option-num">${opt.number}</span>
            <input type="text" class="form-input flow-option-label-input" value="${opt.label}" data-index="${index}" style="height:32px; font-weight:600; width: 220px;" />
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:11px; color:var(--text-muted); font-weight:600;">Destino:</span>
            <select class="flow-option-target-select" data-index="${index}">
              <optgroup label="Agentes de IA">
                ${agents.map(ag => `
                  <option value="ai_${ag.name}" ${opt.targetAgent.includes(ag.name) ? 'selected' : ''}>🤖 IA: ${ag.name} (${ag.role})</option>
                `).join('')}
              </optgroup>
              <optgroup label="Outros">
                <option value="human" ${opt.actionType === 'transfer_human' ? 'selected' : ''}>👥 Atendente Humano</option>
                <option value="crm" ${opt.actionType === 'create_crm_deal' ? 'selected' : ''}>💼 Criar Oportunidade no CRM</option>
              </optgroup>
            </select>
          </div>
        </div>
        <div>
          <label style="font-size:11px; color:var(--text-muted); font-weight:600; display:block; margin-bottom:3px;">Mensagem de Resposta Imediata:</label>
          <input type="text" class="form-input flow-option-reply-input" value="${opt.replyMessage}" data-index="${index}" style="height:30px; font-size:12px;" />
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Setup Flow Builder Modal
 */
function setupFlowBuilderModal() {
  const form = document.getElementById('form-save-flow-builder');
  if (!form) return;

  // Add Option button
  const btnAddOption = document.getElementById('btn-flow-add-option');
  if (btnAddOption) {
    btnAddOption.addEventListener('click', () => {
      if (!currentEditingBot) return;
      const nextNum = currentEditingBot.flow.options.length + 1;
      currentEditingBot.flow.options.push({
        id: `opt-${Date.now()}`,
        number: `${nextNum}`,
        label: `Nova Opção ${nextNum}`,
        actionType: 'transfer_ai_agent',
        targetAgent: 'Juliana Santos',
        targetAgentRole: 'Vendas',
        replyMessage: 'Entendido! Transferindo seu atendimento...'
      });
      renderFlowOptionsEditor(currentEditingBot);
    });
  }

  // Save Flow
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentEditingBot) return;

    currentEditingBot.flow.triggerText = document.getElementById('flow-input-trigger').value;
    currentEditingBot.flow.initialMessage = document.getElementById('flow-input-message').value;

    // Collect options
    const labelInputs = document.querySelectorAll('.flow-option-label-input');
    const replyInputs = document.querySelectorAll('.flow-option-reply-input');
    const targetSelects = document.querySelectorAll('.flow-option-target-select');

    currentEditingBot.flow.options.forEach((opt, idx) => {
      if (labelInputs[idx]) opt.label = labelInputs[idx].value;
      if (replyInputs[idx]) opt.replyMessage = replyInputs[idx].value;
      if (targetSelects[idx]) {
        const val = targetSelects[idx].value;
        if (val.startsWith('ai_')) {
          opt.actionType = 'transfer_ai_agent';
          opt.targetAgent = val.replace('ai_', '');
        } else if (val === 'human') {
          opt.actionType = 'transfer_human';
          opt.targetAgent = 'Atendimento Humano';
        } else if (val === 'crm') {
          opt.actionType = 'create_crm_deal';
          opt.targetAgent = 'CRM Automático';
        }
      }
    });

    // Update integrated AI list
    const aiAgents = [];
    currentEditingBot.flow.options.forEach(opt => {
      if (opt.actionType === 'transfer_ai_agent' && !aiAgents.includes(opt.targetAgent)) {
        aiAgents.push(opt.targetAgent);
      }
    });
    currentEditingBot.integratedAiAgents = aiAgents.length > 0 ? aiAgents : ['Nenhum'];

    renderChatbotKpis();
    renderChatbotsList();

    if (window.closeAllModals) window.closeAllModals();
    if (window.showToast) window.showToast(`Fluxo do chatbot "${currentEditingBot.name}" salvo com sucesso!`);
  });
}

/**
 * ==========================================================================
 * DYNAMIC WHATSAPP FLOW SIMULATOR ENGINE
 * ==========================================================================
 */

let activeSimAiNode = null;
let activeSimMenuNode = null;
let activeSimTimeouts = [];

function clearSimTimeouts() {
  activeSimTimeouts.forEach(t => clearTimeout(t));
  activeSimTimeouts = [];
}

function simSetTimeout(fn, delay) {
  const t = setTimeout(fn, delay);
  activeSimTimeouts.push(t);
  return t;
}

function getFormattedTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getCheckmarksSvg() {
  return `<svg class="sim-wa-checkmarks" viewBox="0 0 16 11" width="15" height="10" fill="none">
    <path d="M11 1.5L5.5 7.5L3 5" stroke="#53bdeb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.5 1.5L9 7.5L8.5 7" stroke="#53bdeb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function setSimulatorStatus(statusText) {
  const statusEl = document.getElementById('sim-phone-status-text');
  if (statusEl) statusEl.textContent = statusText;
}

function setSimulatorCurrentNode(nodeTitle) {
  const nodeEl = document.getElementById('sim-current-node-name');
  if (nodeEl) nodeEl.textContent = nodeTitle;
}

function showTypingIndicator(show) {
  const container = document.getElementById('sim-phone-messages');
  if (!container) return;

  const existing = document.getElementById('sim-typing-bubble');
  if (existing) existing.remove();

  if (show) {
    const bubble = document.createElement('div');
    bubble.className = 'sim-typing-bubble';
    bubble.id = 'sim-typing-bubble';
    bubble.innerHTML = `
      <div class="sim-typing-dots">
        <span class="sim-typing-dot"></span>
        <span class="sim-typing-dot"></span>
        <span class="sim-typing-dot"></span>
      </div>
    `;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }
}

function appendUserBubble(text) {
  const container = document.getElementById('sim-phone-messages');
  if (!container) return;

  const time = getFormattedTime();
  const bubble = document.createElement('div');
  bubble.className = 'phone-bubble user';
  bubble.innerHTML = `
    <span>${text}</span>
    <span class="sim-bubble-meta">
      <span>${time}</span>
      ${getCheckmarksSvg()}
    </span>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function appendBotBubble(htmlContent) {
  const container = document.getElementById('sim-phone-messages');
  if (!container) return;

  const time = getFormattedTime();
  const bubble = document.createElement('div');
  bubble.className = 'phone-bubble bot';
  bubble.innerHTML = `
    <div>${htmlContent}</div>
    <span class="sim-bubble-meta">
      <span>${time}</span>
    </span>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  if (window.lucide) window.lucide.createIcons();
  return bubble;
}

function appendSystemAlert(htmlContent) {
  const container = document.getElementById('sim-phone-messages');
  if (!container) return;

  const alert = document.createElement('div');
  alert.className = 'phone-bubble system-alert';
  alert.innerHTML = htmlContent;
  container.appendChild(alert);
  container.scrollTop = container.scrollHeight;
}

function appendVoiceNoteBubble(isUser = true, duration = '0:05') {
  const container = document.getElementById('sim-phone-messages');
  if (!container) return;

  const time = getFormattedTime();
  const bubble = document.createElement('div');
  bubble.className = `phone-bubble ${isUser ? 'user' : 'bot'}`;
  bubble.innerHTML = `
    <div class="sim-wa-audio-player">
      <button type="button" class="sim-audio-play-btn" title="Ouvir áudio">
        <i data-lucide="play" style="width:14px; height:14px; margin-left:2px;"></i>
      </button>
      <div class="sim-audio-waveform">
        <span class="sim-audio-bar" style="height:35%;"></span>
        <span class="sim-audio-bar" style="height:65%;"></span>
        <span class="sim-audio-bar" style="height:100%;"></span>
        <span class="sim-audio-bar" style="height:55%;"></span>
        <span class="sim-audio-bar" style="height:80%;"></span>
        <span class="sim-audio-bar" style="height:45%;"></span>
        <span class="sim-audio-bar" style="height:90%;"></span>
        <span class="sim-audio-bar" style="height:60%;"></span>
        <span class="sim-audio-bar" style="height:75%;"></span>
        <span class="sim-audio-bar" style="height:40%;"></span>
        <span class="sim-audio-bar" style="height:70%;"></span>
        <span class="sim-audio-bar" style="height:30%;"></span>
      </div>
      <div class="sim-audio-avatar-wrap">
        <div class="sim-audio-avatar">${isUser ? '👤' : '🤖'}</div>
        <span class="sim-audio-mic-badge"><i data-lucide="mic" style="width:8px; height:8px;"></i></span>
      </div>
    </div>
    <span class="sim-bubble-meta">
      <span style="margin-right:6px; font-weight:600;">${duration}</span>
      <span>${time}</span>
      ${isUser ? getCheckmarksSvg() : ''}
    </span>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  if (window.lucide) window.lucide.createIcons();

  const playBtn = bubble.querySelector('.sim-audio-play-btn');
  const player = bubble.querySelector('.sim-wa-audio-player');
  if (playBtn && player) {
    playBtn.addEventListener('click', () => {
      const isPlaying = player.classList.toggle('playing');
      playBtn.innerHTML = isPlaying
        ? `<i data-lucide="pause" style="width:14px; height:14px;"></i>`
        : `<i data-lucide="play" style="width:14px; height:14px; margin-left:2px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    });
  }
}

/**
 * Open Simulator Modal
 */
export function openSimulator(botId) {
  // If active in flow builder studio, prioritize currentBot with live unsaved changes
  const activeFlowBot = (window.getCurrentFlowBot && window.getCurrentFlowBot());
  const bot = (activeFlowBot && activeFlowBot.id === botId)
    ? activeFlowBot
    : (zapChatData.chatbots.list.find(b => b.id === botId) || CHATBOT_TEMPLATES.find(t => t.id === botId) || activeFlowBot);

  if (!bot) return;
  currentSimulatedBot = bot;

  // Update hardware & WhatsApp headers
  const botNameEl = document.getElementById('sim-phone-bot-name');
  if (botNameEl) botNameEl.textContent = bot.name || 'Chatbot ZapChat';

  const avatarEl = document.getElementById('sim-phone-avatar');
  if (avatarEl) {
    avatarEl.textContent = bot.channel === 'Instagram' ? '📸' : '🤖';
  }

  const clockEl = document.getElementById('sim-clock-time');
  if (clockEl) clockEl.textContent = getFormattedTime();

  setSimulatorStatus('online');

  // Open modal
  if (window.openModal) window.openModal('modal-simulate-chatbot');

  // Start execution of flow
  startSimulation(bot);

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Start or reset simulation for bot
 */
function startSimulation(bot) {
  clearSimTimeouts();
  activeSimAiNode = null;
  activeSimMenuNode = null;

  const messagesContainer = document.getElementById('sim-phone-messages');
  if (!messagesContainer) return;
  messagesContainer.innerHTML = '';

  // 1. WhatsApp End-to-end Encryption Security Pill
  const secPill = document.createElement('div');
  secPill.className = 'sim-wa-security-pill';
  secPill.innerHTML = `🔒 As mensagens e as chamadas são protegidas com a criptografia de ponta a ponta e ficam somente entre você e o ZapChat.`;
  messagesContainer.appendChild(secPill);

  // 2. Date Pill
  const datePill = document.createElement('div');
  datePill.className = 'sim-wa-date-pill';
  datePill.textContent = 'HOJE';
  messagesContainer.appendChild(datePill);

  // 3. User Trigger Initial Message
  const triggerText = bot.canvasFlow?.nodes?.find(n => n.type === 'start')?.data?.trigger
    || bot.flow?.triggerText
    || 'Olá, gostaria de informações!';

  appendUserBubble(triggerText);

  // 4. Begin Flow Execution
  if (bot.canvasFlow && bot.canvasFlow.nodes && bot.canvasFlow.nodes.length > 0) {
    const startNode = bot.canvasFlow.nodes.find(n => n.type === 'start') || bot.canvasFlow.nodes[0];
    setSimulatorCurrentNode(startNode.title || 'Bloco Inicial');

    const firstConn = bot.canvasFlow.connections?.find(c => c.fromNode === startNode.id);
    if (firstConn) {
      simSetTimeout(() => {
        executeFlowNode(firstConn.toNode, bot);
      }, 500);
    } else {
      simSetTimeout(() => {
        appendBotBubble(`👋 Olá! Seja bem-vindo ao <strong>${bot.name}</strong>.<br><small style="color:#667781;">(Dica: Conecte o Bloco Inicial a outros blocos no construtor visual para expandir este fluxo!)</small>`);
      }, 600);
    }
  } else if (bot.flow) {
    // Fallback legacy flow
    setSimulatorCurrentNode('Menu Principal');
    simSetTimeout(() => {
      renderLegacyFlow(bot);
    }, 600);
  }
}

/**
 * Execute node dynamically by following connections
 */
function executeFlowNode(nodeId, bot) {
  const node = bot.canvasFlow?.nodes?.find(n => n.id === nodeId);
  if (!node) return;

  setSimulatorCurrentNode(node.title || node.type);

  switch (node.type) {
    case 'message': {
      const items = (node.data?.items && node.data.items.length > 0)
        ? node.data.items
        : [{ type: 'text', text: node.data?.text || node.data?.message || 'Olá! Como posso te ajudar hoje?' }];

      let cumulativeDelay = 0;
      items.forEach((item, idx) => {
        if (item.type === 'delay') {
          const waitMs = Math.min((Number(item.seconds) || 2) * 400, 1500);
          simSetTimeout(() => {
            setSimulatorStatus(item.typing !== false ? 'digitando...' : 'online');
            if (item.typing !== false) showTypingIndicator(true);
          }, cumulativeDelay);
          cumulativeDelay += waitMs;
          simSetTimeout(() => {
            showTypingIndicator(false);
            setSimulatorStatus('online');
          }, cumulativeDelay);
        } else {
          simSetTimeout(() => {
            setSimulatorStatus(item.type === 'audio' ? 'gravando áudio...' : 'digitando...');
            showTypingIndicator(true);
          }, cumulativeDelay);
          cumulativeDelay += 550;
          simSetTimeout(() => {
            showTypingIndicator(false);
            setSimulatorStatus('online');
            if (item.type === 'text') {
              const formatted = (item.text || 'Olá! Como posso te ajudar hoje?')
                .replace(/\{nome\}/gi, 'Visitante')
                .replace(/\n/g, '<br>');
              appendBotBubble(formatted);
            } else if (item.type === 'audio') {
              appendVoiceNoteBubble(false, '0:07');
            } else if (item.type === 'image') {
              appendBotBubble(`🖼️ <strong>${item.fileName || 'Imagem enviada'}</strong>${item.caption ? `<br><span style="font-size:12px;">${item.caption}</span>` : ''}`);
            } else if (item.type === 'video') {
              appendBotBubble(`🎬 <strong>${item.fileName || 'Vídeo enviado'}</strong>${item.caption ? `<br><span style="font-size:12px;">${item.caption}</span>` : ''}`);
            } else if (item.type === 'file') {
              appendBotBubble(`📄 <strong>${item.fileName || 'Documento PDF'}</strong>`);
            } else if (item.type === 'link') {
              appendBotBubble(`🔗 <strong>${item.buttonText || 'Acessar Link'}</strong><br><span style="color:#0284C7; font-size:12px; text-decoration:underline;">${item.url || 'https://zapchat.com.br'}</span>`);
            } else if (item.type === 'location') {
              appendBotBubble(`📍 <strong>${item.locationName || 'Nossa Localização'}</strong><br><span style="font-size:12px; color:#667781;">${item.address || 'Ver no mapa'}</span>`);
            } else if (item.type === 'contact') {
              appendBotBubble(`👤 <strong>${item.contactName || 'Contato Comercial'}</strong><br><span style="font-size:12px; color:#667781;">${item.contactPhone || '+55 11 99999-9999'}</span>`);
            }
          }, cumulativeDelay);
          cumulativeDelay += 250;
        }
      });

      const nextConn = bot.canvasFlow?.connections?.find(c => c.fromNode === node.id && (c.fromPort === 'out' || !c.fromPort));
      if (nextConn) {
        simSetTimeout(() => {
          executeFlowNode(nextConn.toNode, bot);
        }, cumulativeDelay + 400);
      }
      break;
    }

    case 'delay': {
      const delaySec = Math.min(Number(node.data?.delaySeconds) || 2, 2.5);
      const isAudio = node.data?.delayType === 'recording';
      setSimulatorStatus(isAudio ? 'gravando áudio...' : 'digitando...');
      showTypingIndicator(true);

      simSetTimeout(() => {
        showTypingIndicator(false);
        setSimulatorStatus('online');

        if (isAudio) {
          appendVoiceNoteBubble(false, `0:0${Math.floor(delaySec * 2) + 2}`);
        }

        const nextConn = bot.canvasFlow?.connections?.find(c => c.fromNode === node.id && (c.fromPort === 'out' || !c.fromPort));
        if (nextConn) {
          simSetTimeout(() => {
            executeFlowNode(nextConn.toNode, bot);
          }, 400);
        }
      }, delaySec * 1000);
      break;
    }

    case 'menu': {
      activeSimMenuNode = node;
      setSimulatorStatus('digitando...');
      showTypingIndicator(true);

      simSetTimeout(() => {
        showTypingIndicator(false);
        setSimulatorStatus('online');

        const messageText = (node.data?.message || 'Escolha uma opção para continuarmos:').replace(/\n/g, '<br>');
        const options = node.data?.options || [
          { id: 'opt-1', label: 'Opção 1' },
          { id: 'opt-2', label: 'Opção 2' }
        ];

        const optionsHtml = `
          <span>${messageText}</span>
          <div class="sim-interactive-buttons">
            ${options.map((opt, idx) => `
              <button type="button" class="sim-btn-option sim-node-choice-btn" data-node-id="${node.id}" data-opt-id="${opt.id}">
                <span class="sim-btn-option-num">${idx + 1}</span>
                <span class="sim-btn-option-text">${opt.label}</span>
                <i data-lucide="chevron-right" style="width:13px; height:13px;"></i>
              </button>
            `).join('')}
          </div>
        `;

        const bubble = appendBotBubble(optionsHtml);

        // Bind interactive clicks
        bubble.querySelectorAll('.sim-node-choice-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const optId = btn.getAttribute('data-opt-id');
            const chosen = options.find(o => o.id === optId);
            if (!chosen) return;

            // Disable all buttons in this bubble
            bubble.querySelectorAll('.sim-node-choice-btn').forEach(b => b.disabled = true);

            // User sends response
            appendUserBubble(chosen.label);

            // Find matching connection from menu port
            const conn = bot.canvasFlow?.connections?.find(c =>
              c.fromNode === node.id && (c.fromPort === optId || c.fromPort === 'out')
            );

            if (conn) {
              simSetTimeout(() => {
                executeFlowNode(conn.toNode, bot);
              }, 500);
            } else {
              simSetTimeout(() => {
                appendSystemAlert(`Opção selecionada: <strong>${chosen.label}</strong> (Sem bloco conectado no fluxo)`);
              }, 400);
            }
          });
        });
      }, 600);
      break;
    }

    case 'ai_agent': {
      activeSimAiNode = node;
      const agentName = node.agentName || 'Juliana Santos';
      const matchedAgent = zapChatData?.agentes?.list?.find(a => a.name === agentName);
      const agentRole = matchedAgent?.role || node.agentRole || 'Especialista em Atendimento';

      // 1. Alert that AI took over
      appendSystemAlert(`🤖 Agente de IA <strong>${agentName}</strong> assumiu o atendimento!`);

      setSimulatorStatus('digitando...');
      showTypingIndicator(true);

      simSetTimeout(() => {
        showTypingIndicator(false);
        setSimulatorStatus('online');

        const greeting = `Olá! Sou <strong>${agentName}</strong> (${agentRole}). Como posso te ajudar agora?`;
        const branches = node.data?.branches || [];

        let branchesHtml = '';
        if (branches.length > 0) {
          branchesHtml = `
            <div class="sim-ai-branches-tray">
              <span class="sim-branches-tray-label">
                <i data-lucide="workflow" style="width:12px; height:12px;"></i>
                Simular caminho de saída da IA:
              </span>
              ${branches.map(b => `
                <button type="button" class="sim-ai-branch-btn" data-node-id="${node.id}" data-branch-id="${b.id}">
                  <span>${b.label}</span>
                  <i data-lucide="arrow-right" style="width:12px; height:12px; opacity:0.7;"></i>
                </button>
              `).join('')}
            </div>
          `;
        }

        const bubble = appendBotBubble(`<span>${greeting}</span>${branchesHtml}`);

        // Handle branch clicks
        bubble.querySelectorAll('.sim-ai-branch-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const branchId = btn.getAttribute('data-branch-id');
            const branch = branches.find(b => b.id === branchId);
            if (!branch) return;

            // Disable buttons
            bubble.querySelectorAll('.sim-ai-branch-btn').forEach(b => b.disabled = true);

            // User response
            appendUserBubble(branch.label);

            // Find connection from branch port
            const conn = bot.canvasFlow?.connections?.find(c =>
              c.fromNode === node.id && (c.fromPort === branchId || c.fromPort === 'out')
            );

            if (conn) {
              simSetTimeout(() => {
                executeFlowNode(conn.toNode, bot);
              }, 500);
            } else if (branch.targetNodeId) {
              simSetTimeout(() => {
                executeFlowNode(branch.targetNodeId, bot);
              }, 500);
            } else {
              simSetTimeout(() => {
                appendSystemAlert(`Caminho <strong>${branch.label}</strong> acionado (nenhum bloco conectado a esta saída).`);
              }, 400);
            }
          });
        });
      }, 700);
      break;
    }

    case 'action': {
      const actionType = node.actionType || 'transfer';
      const transferDest = node.transferTarget || node.targetPerson || 'Fila Geral';
      let alertText = `↪️ Atendimento transferido para <strong>${transferDest}</strong>`;

      if (actionType === 'finish') {
        alertText = `✅ <strong>${node.actionLabel || 'Atendimento finalizado'}</strong> • Conversa encerrada`;
      } else if (actionType === 'crm_deal') {
        alertText = `💼 Oportunidade registrada no CRM`;
      } else if (actionType === 'restart') {
        alertText = `🔄 Fluxo reiniciado automaticamente`;
      } else if (actionType === 'tag') {
        alertText = `🏷️ Tag <strong>${node.actionLabel || 'Lead Qualificado'}</strong> aplicada ao contato`;
      }

      appendSystemAlert(alertText);

      // Follow outgoing connection
      const nextConn = bot.canvasFlow?.connections?.find(c => c.fromNode === node.id && (c.fromPort === 'out' || !c.fromPort));
      if (nextConn) {
        simSetTimeout(() => {
          executeFlowNode(nextConn.toNode, bot);
        }, 500);
      }
      break;
    }

    case 'crm': {
      const stages = zapChatData.crm?.stages || [];
      const stageObj = stages.find(s => s.id === node.data?.stageId) || stages[0] || { name: 'Prospecção' };
      const val = Number(node.data?.value) || 0;
      const valText = val > 0 ? ` • R$ ${val.toLocaleString('pt-BR')}` : '';
      appendSystemAlert(`💼 Contato enviado ao CRM na etapa <strong>${stageObj.name}</strong>${valText}`);

      const nextConn = bot.canvasFlow?.connections?.find(c => c.fromNode === node.id && (c.fromPort === 'out' || !c.fromPort));
      if (nextConn) {
        simSetTimeout(() => {
          executeFlowNode(nextConn.toNode, bot);
        }, 500);
      }
      break;
    }

    case 'end_chat': {
      const sendMsg = node.data?.sendMessage !== false;
      const closingMsg = (node.data?.closingMessage || 'Seu atendimento foi encerrado! Agradecemos o seu contato.').replace(/\{nome\}/gi, 'Lucas');
      const reason = node.data?.reason || 'Resolvido';

      if (sendMsg && closingMsg.trim()) {
        setSimulatorStatus('digitando...');
        showTypingIndicator(true);
        simSetTimeout(() => {
          showTypingIndicator(false);
          setSimulatorStatus('atendimento encerrado');
          appendBotBubble(formatSimText(closingMsg));
          appendSystemAlert(`✅ <strong>Atendimento encerrado</strong> • ${reason}`);
        }, 650);
      } else {
        setSimulatorStatus('atendimento encerrado');
        appendSystemAlert(`✅ <strong>Atendimento encerrado</strong> • ${reason}`);
      }
      break;
    }

    case 'human': {
      const team = node.targetPerson || 'Equipe Geral';
      appendSystemAlert(`👥 Conversa transferida para a fila humana (${team})`);

      setSimulatorStatus('digitando...');
      showTypingIndicator(true);

      simSetTimeout(() => {
        showTypingIndicator(false);
        setSimulatorStatus('aguardando atendente...');
        appendBotBubble(`Um dos nossos consultores da equipe <strong>${team}</strong> foi notificado e já vai assumir seu atendimento. Aguarde um instante!`);
      }, 700);
      break;
    }

    default: {
      const nextConn = bot.canvasFlow?.connections?.find(c => c.fromNode === node.id && (c.fromPort === 'out' || !c.fromPort));
      if (nextConn) {
        simSetTimeout(() => {
          executeFlowNode(nextConn.toNode, bot);
        }, 500);
      }
    }
  }
}

/**
 * Handle user messages typed in WhatsApp footer input
 */
function handleUserSimulatorInput(text) {
  if (activeSimAiNode) {
    const agentName = activeSimAiNode.agentName || 'Juliana Santos';
    setSimulatorStatus('digitando...');
    showTypingIndicator(true);

    simSetTimeout(() => {
      showTypingIndicator(false);
      setSimulatorStatus('online');

      const lower = text.toLowerCase();
      let reply = '';
      if (lower.includes('preço') || lower.includes('valor') || lower.includes('plano') || lower.includes('quanto')) {
        reply = `Temos planos a partir de <strong>R$ 149,00/mês</strong> que incluem automações ilimitadas, agentes de IA 24/7 e gestão completa de leads no CRM. Gostaria de agendar uma demonstração ou receber a proposta?`;
      } else if (lower.includes('atendente') || lower.includes('humano') || lower.includes('pessoa')) {
        reply = `Com certeza! Posso te transferir para nossa equipe comercial agora mesmo. Deseja que eu faça o transbordo?`;
      } else {
        reply = `Entendido! Compreendi sua solicitação. Como especialista <strong>${agentName}</strong>, estou pronto para conduzir o seu atendimento da melhor forma. Como prefere prosseguir?`;
      }

      appendBotBubble(reply);
    }, 900);
  } else if (activeSimMenuNode) {
    // Check if user typed number or option text
    const options = activeSimMenuNode.data?.options || [];
    const matchIndex = parseInt(text) - 1;
    let matchedOpt = null;

    if (!isNaN(matchIndex) && options[matchIndex]) {
      matchedOpt = options[matchIndex];
    } else {
      matchedOpt = options.find(o => text.toLowerCase().includes(o.label.toLowerCase()));
    }

    if (matchedOpt) {
      const conn = currentSimulatedBot?.canvasFlow?.connections?.find(c =>
        c.fromNode === activeSimMenuNode.id && (c.fromPort === matchedOpt.id || c.fromPort === 'out')
      );
      if (conn) {
        simSetTimeout(() => {
          executeFlowNode(conn.toNode, currentSimulatedBot);
        }, 500);
      }
    } else {
      setSimulatorStatus('digitando...');
      showTypingIndicator(true);
      simSetTimeout(() => {
        showTypingIndicator(false);
        setSimulatorStatus('online');
        appendBotBubble(`Por favor, clique em uma das opções do menu acima para continuarmos. 😊`);
      }, 600);
    }
  } else {
    // Generic bot response
    setSimulatorStatus('digitando...');
    showTypingIndicator(true);
    simSetTimeout(() => {
      showTypingIndicator(false);
      setSimulatorStatus('online');
      appendBotBubble(`Mensagem recebida! Nossa automação está pronta para processar. Teste interagindo com os blocos do fluxo.`);
    }, 600);
  }
}

/**
 * Simulate user sending a voice note
 */
function simulateUserVoiceNote() {
  setSimulatorStatus('gravando áudio...');
  simSetTimeout(() => {
    setSimulatorStatus('online');
    appendVoiceNoteBubble(true, '0:04');

    simSetTimeout(() => {
      setSimulatorStatus('digitando...');
      showTypingIndicator(true);
      simSetTimeout(() => {
        showTypingIndicator(false);
        setSimulatorStatus('online');
        appendBotBubble(`🎙️ <em>Áudio transcrito por IA:</em> "Olá, gostaria de saber mais informações sobre os serviços."<br><br>Entendido! Como posso te ajudar hoje?`);
      }, 900);
    }, 800);
  }, 1000);
}

/**
 * Fallback legacy flow simulator
 */
function renderLegacyFlow(bot) {
  const initialMsg = (bot.flow?.initialMessage || 'Olá! Como posso ajudar você hoje?').replace(/\n/g, '<br>');
  const options = bot.flow?.options || [];

  const html = `
    <span>${initialMsg}</span>
    <div class="sim-interactive-buttons">
      ${options.map((opt, i) => `
        <button type="button" class="sim-btn-option sim-legacy-opt-btn" data-opt-id="${opt.id}">
          <span class="sim-btn-option-num">${opt.number || (i + 1)}</span>
          <span class="sim-btn-option-text">${opt.label}</span>
          <i data-lucide="chevron-right" style="width:13px; height:13px;"></i>
        </button>
      `).join('')}
    </div>
  `;

  const bubble = appendBotBubble(html);

  bubble.querySelectorAll('.sim-legacy-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-opt-id');
      const opt = options.find(o => o.id === optId);
      if (!opt) return;

      bubble.querySelectorAll('.sim-legacy-opt-btn').forEach(b => b.disabled = true);
      appendUserBubble(`${opt.number ? opt.number + '. ' : ''}${opt.label}`);

      simSetTimeout(() => {
        setSimulatorStatus('digitando...');
        showTypingIndicator(true);

        simSetTimeout(() => {
          showTypingIndicator(false);
          setSimulatorStatus('online');
          appendBotBubble(opt.replyMessage || 'Opção registrada com sucesso!');

          simSetTimeout(() => {
            if (opt.actionType === 'transfer_ai_agent') {
              appendSystemAlert(`🤖 Agente de IA <strong>${opt.targetAgent}</strong> assumiu o atendimento!`);
            } else if (opt.actionType === 'transfer_human') {
              appendSystemAlert(`👥 Conversa transferida para a fila humana com sucesso!`);
            } else {
              appendSystemAlert(`💼 Oportunidade registrada no CRM automaticamente!`);
            }
          }, 400);
        }, 700);
      }, 400);
    });
  });
}

/**
 * Setup New Chatbot Modal
 */
function setupNewChatbotModal() {
  const form = document.getElementById('form-new-chatbot');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('new-bot-input-name')?.value || 'Novo Chatbot';
    const channel = document.getElementById('new-bot-input-channel')?.value || 'WhatsApp';
    const desc = document.getElementById('new-bot-input-desc')?.value || '';
    const trigger = document.getElementById('new-bot-input-trigger')?.value || 'Primeira mensagem recebida';
    const defaultAgent = document.getElementById('new-bot-input-agent')?.value || 'Juliana Santos';

    const newBot = {
      id: 'bot_' + Date.now(),
      name,
      description: desc || 'Fluxo de atendimento automatizado com integração de inteligência artificial.',
      channel,
      trigger,
      triggerType: 'custom',
      status: 'Ativo',
      executions: 0,
      completionRate: '100%',
      integratedAiAgents: [`${defaultAgent}`],
      stepsCount: 3,
      updatedAt: 'Agora mesmo',
      flow: {
        triggerText: trigger,
        initialMessage: `Olá! Bem-vindo ao atendimento automatizado. Escolha uma opção para continuarmos:`,
        options: [
          {
            id: 'opt-new-1',
            number: '1',
            label: 'Falar com Agente de IA',
            actionType: 'transfer_ai_agent',
            targetAgent: defaultAgent,
            targetAgentRole: 'Especialista',
            replyMessage: `Perfeito! Conectando você agora com nosso Agente de IA ${defaultAgent}.`
          },
          {
            id: 'opt-new-2',
            number: '2',
            label: 'Atendimento Humano',
            actionType: 'transfer_human',
            targetAgent: 'Fila Geral',
            targetAgentRole: 'Humano',
            replyMessage: 'Aguarde um instante enquanto chamamos um atendente disponível.'
          }
        ]
      }
    };

    zapChatData.chatbots.list.unshift(newBot);
    renderChatbotKpis();
    renderChatbotsList();

    if (window.closeAllModals) window.closeAllModals();
    form.reset();

    if (window.showToast) window.showToast(`Chatbot "${name}" criado! Abrindo construtor visual de fluxo...`);
    setTimeout(() => {
      openFlowBuilder(newBot.id);
    }, 250);
  });
}

function setupSimulatorModal() {
  // 1. Restart Simulation Button
  const btnRestart = document.getElementById('btn-restart-simulation');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      if (currentSimulatedBot) {
        startSimulation(currentSimulatedBot);
      }
    });
  }

  // 2. WhatsApp Theme Toggle (Light / Dark)
  const btnToggleTheme = document.getElementById('btn-toggle-wa-theme');
  const chassis = document.getElementById('sim-phone-chassis');
  const themeText = document.getElementById('sim-theme-text');
  const themeIcon = document.getElementById('sim-theme-icon');

  if (btnToggleTheme && chassis) {
    btnToggleTheme.addEventListener('click', () => {
      const isDark = chassis.getAttribute('data-wa-theme') === 'dark';
      if (isDark) {
        chassis.setAttribute('data-wa-theme', 'light');
        if (themeText) themeText.textContent = 'Escuro';
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
      } else {
        chassis.setAttribute('data-wa-theme', 'dark');
        if (themeText) themeText.textContent = 'Claro';
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun-medium');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // 3. WhatsApp Message Input & Send / Mic
  const inputEl = document.getElementById('sim-input-text');
  const sendBtn = document.getElementById('sim-btn-send');
  const sendIcon = document.getElementById('sim-send-icon');

  if (inputEl && sendBtn) {
    inputEl.addEventListener('input', () => {
      const hasText = inputEl.value.trim().length > 0;
      if (sendIcon) {
        sendIcon.setAttribute('data-lucide', hasText ? 'send' : 'mic');
        if (window.lucide) window.lucide.createIcons();
      }
    });

    const handleSendMessage = () => {
      const text = inputEl.value.trim();
      if (!text) {
        simulateUserVoiceNote();
        return;
      }

      appendUserBubble(text);
      inputEl.value = '';
      if (sendIcon) {
        sendIcon.setAttribute('data-lucide', 'mic');
        if (window.lucide) window.lucide.createIcons();
      }

      handleUserSimulatorInput(text);
    };

    sendBtn.addEventListener('click', handleSendMessage);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  // 4. Emoji Button
  const btnEmoji = document.getElementById('sim-btn-emoji');
  if (btnEmoji && inputEl) {
    btnEmoji.addEventListener('click', () => {
      const emojis = ['👋', '😊', '🚀', '👍', '🙏', '💡', '✅', '⭐'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      inputEl.value += (inputEl.value ? ' ' : '') + randomEmoji;
      inputEl.focus();
      if (sendIcon) {
        sendIcon.setAttribute('data-lucide', 'send');
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // 5. Attachment & Camera Buttons
  const btnAttach = document.getElementById('sim-btn-attach');
  const btnCamera = document.getElementById('sim-btn-camera');
  [btnAttach, btnCamera].forEach(btn => {
    btn?.addEventListener('click', () => {
      if (window.showToast) window.showToast('Envio de foto/arquivo simulado no WhatsApp!', 'info');
    });
  });
}
