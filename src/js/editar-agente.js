// Module: Editar Agente
import { zapChatData } from './data.js';
import { showToast } from './settings.js';

let currentAgentId = 'pedro';
let currentTone = 'normal';

export function initEditAgentView() {
  setupInternalTabs();
  setupBehaviorConfiguration();
  setupBehaviorCounter();
  setupAgentGreeting();
  setupSaveAction();
  setupBackToAgents();
  setupTrainingActions();
  setupAgentSchedule();
  setupAgentHumanTransfer();
  setupAgentStatusToggle();

  // Expose globally
  window.openEditAgent = openEditAgent;
  window.toggleCurrentAgentStatus = toggleCurrentAgentStatus;
  window.switchAgentInternalTab = switchAgentInternalTab;
}

/**
 * Open edit agent view and load agent details
 */
export function openEditAgent(agentId = 'pedro') {
  currentAgentId = agentId;
  const agent = zapChatData.agentes.list.find(a => a.id === agentId) || zapChatData.agentes.list[0];

  if (agent) {
    // Populate header and sidebar details
    const nameEl = document.getElementById('edit-agent-name-display');
    const roleEl = document.getElementById('edit-agent-role-display');
    const avatarEl = document.getElementById('edit-agent-avatar-circle');
    const inputNameEl = document.getElementById('input-agent-name');
    const inputRoleEl = document.getElementById('input-agent-role');

    if (nameEl) nameEl.textContent = agent.name;
    if (roleEl) roleEl.textContent = agent.role || 'Vendedor em Loja Download';
    if (inputNameEl) inputNameEl.value = agent.name;
    if (inputRoleEl) inputRoleEl.value = agent.role || 'Vendedor em Loja Download';

    if (avatarEl) {
      avatarEl.style.backgroundColor = agent.avatarBg || '#E9F7F1';
      avatarEl.style.color = agent.avatarColor || '#00A868';
      avatarEl.innerHTML = agent.name.charAt(0).toUpperCase();
    }

    updateAgentStatusDisplay(agent);
  }

  // Load schedule settings for this agent
  loadAgentSchedule(currentAgentId);

  // Load greeting message settings for this agent
  loadAgentGreeting(currentAgentId);

  // Load human transfer settings for this agent
  loadAgentTransferSettings(currentAgentId);

  // Switch to the edit agent view
  if (window.switchView) {
    window.switchView('editar-agente');
  }

  // Default to perfil tab
  switchAgentInternalTab('perfil');

  // Load and apply agent segment settings
  const agentSegment = agent?.segment || 'Clínica / Saúde';
  applySegmentConfiguration(agentSegment, !SEGMENT_CONFIGS[agentSegment], null, false);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Switch internal agent sub-tabs
 */
function switchAgentInternalTab(tabId) {
  const navBtns = document.querySelectorAll('.agent-internal-nav-btn[data-agent-tab]');
  const panes = document.querySelectorAll('.agent-tab-pane');

  navBtns.forEach(btn => {
    if (btn.getAttribute('data-agent-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  panes.forEach(pane => {
    if (pane.id === `agent-tab-pane-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Internal tab navigation bindings
 */
function setupInternalTabs() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.agent-internal-nav-btn[data-agent-tab]');
    if (btn) {
      e.preventDefault();
      const tabId = btn.getAttribute('data-agent-tab');
      switchAgentInternalTab(tabId);
    }
  });
}

// ========================================================
// SEGMENTOS DE NEGÓCIO: CONFIGURAÇÕES ESPECÍFICAS E GERAIS
// ========================================================
export const SEGMENT_CONFIGS = {
  'Clínica / Saúde': {
    name: 'Clínica / Saúde',
    icon: 'activity',
    category: 'Saúde & Bem-estar',
    rolePlaceholder: 'Atendente virtual da Clínica Médica',
    primaryObjective: 'agendamentos',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'transferir'],
    style: {
      tone: 'natural',
      length: 'medias',
      conversation: 'natural',
      emojis: 'moderado'
    },
    clientFields: ['nome', 'telefone', 'melhor-horario', 'tipo-atendimento'],
    bannerText: 'Boas práticas de Saúde & Clínicas aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Clínica / Saúde',
    rulesSubtitle: 'Regras de conduta, biossegurança e privacidade médica',
    rules: [
      {
        title: 'Sigilo & Privacidade Médica',
        desc: 'O agente nunca divulga diagnósticos ou dados clínicos sensíveis a terceiros (em conformidade com a LGPD e CFM).'
      },
      {
        title: 'Triagem de Urgência',
        desc: 'Casos graves de emergência ou dor aguda são imediatamente orientados a procurar o pronto-atendimento hospitalar.'
      },
      {
        title: 'Confirmação de Agendamentos',
        desc: 'Confirmação de especialidade, médico responsável, convênio aceito e lembretes com antecedência.'
      },
      {
        title: 'Transparência de Valores',
        desc: 'Informação clara sobre formas de pagamento e recibos para reembolso do plano de saúde.'
      }
    ]
  },
  'Advocacia / Jurídico': {
    name: 'Advocacia / Jurídico',
    icon: 'scale',
    category: 'Serviços Jurídicos',
    rolePlaceholder: 'Assistente virtual do Escritório de Advocacia',
    primaryObjective: 'atendimento',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'transferir'],
    style: {
      tone: 'profissional',
      length: 'medias',
      conversation: 'consultiva',
      emojis: 'nao-usar'
    },
    clientFields: ['nome', 'telefone', 'email', 'tipo-atendimento'],
    bannerText: 'Boas práticas do setor Jurídico aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Advocacia / Jurídico',
    rulesSubtitle: 'Diretrizes éticas e de conformidade com o Código de Ética da OAB',
    rules: [
      {
        title: 'Sigilo Profissional Absoluto',
        desc: 'Proteção irrestrita de dados e detalhes de casos em conformidade com o Estatuto da OAB e LGPD.'
      },
      {
        title: 'Vedação à Consulta Gratuita Indevida',
        desc: 'O agente orienta sobre áreas de atuação e triagem, agendando consulta formal sem emitir pareceres jurídicos definitivos.'
      },
      {
        title: 'Coleta Prévia de Dados Processuais',
        desc: 'Identificação de número de processo ou área do direito (Trabalhista, Cível, Família, Tributário) para direcionamento ao advogado certo.'
      },
      {
        title: 'Comunicação Sóbria e Formal',
        desc: 'Postura respeitosa, sem termos sensacionalistas e em estrito cumprimento às normas de publicidade da OAB.'
      }
    ]
  },
  'Imobiliária / Corretores': {
    name: 'Imobiliária / Corretores',
    icon: 'home',
    category: 'Mercado Imobiliário',
    rolePlaceholder: 'Corretor digital e atendimento imobiliário',
    primaryObjective: 'oportunidades',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'servicos', 'transferir'],
    style: {
      tone: 'profissional',
      length: 'medias',
      conversation: 'consultiva',
      emojis: 'moderado'
    },
    clientFields: ['nome', 'telefone', 'email', 'melhor-horario'],
    bannerText: 'Boas práticas do setor Imobiliário aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Imobiliária / Corretores',
    rulesSubtitle: 'Regras de qualificação de leads e agendamento de visitas',
    rules: [
      {
        title: 'Qualificação de Perfil & Orçamento',
        desc: 'Identificação do interesse (compra ou locação), faixa de valor e bairros de preferência.'
      },
      {
        title: 'Agendamento Ágil de Visitas',
        desc: 'Facilitação de datas e horários para visitas presenciais ou tours virtuais com o corretor responsável.'
      },
      {
        title: 'Envio Estruturado de Fichas de Imóveis',
        desc: 'Apresentação de links, fotos e detalhes de condomínio/IPTU de forma organizada no WhatsApp.'
      },
      {
        title: 'Transferência Rápida para o Corretor',
        desc: 'Notificação imediata ao corretor parceiro quando o cliente demonstrar intenção firme de visita ou proposta.'
      }
    ]
  },
  'Academia / Fitness': {
    name: 'Academia / Fitness',
    icon: 'dumbbell',
    category: 'Fitness & Bem-estar',
    rolePlaceholder: 'Consultor de matrículas e suporte da Academia',
    primaryObjective: 'vendas',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'servicos'],
    style: {
      tone: 'descontraido',
      length: 'curtas',
      conversation: 'direta',
      emojis: 'a-vontade'
    },
    clientFields: ['nome', 'telefone', 'melhor-horario'],
    bannerText: 'Boas práticas de Academias e Fitness aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Academia / Fitness',
    rulesSubtitle: 'Estratégias de conversão para aulas experimentais e planos',
    rules: [
      {
        title: 'Incentivo à Aula Experimental',
        desc: 'Foco em convidar o interessado para conhecer a estrutura e realizar uma aula experimental gratuita.'
      },
      {
        title: 'Apresentação Transparente de Planos',
        desc: 'Explicação clara sobre planos mensais, anuais, horários de pico e taxas de matrícula.'
      },
      {
        title: 'Tom Enérgico e Motivador',
        desc: 'Comunicação calorosa, incentivando o bem-estar e hábitos saudáveis.'
      },
      {
        title: 'Recuperação de Mensalistas',
        desc: 'Fluxo para tirar dúvidas de renovação, cancelamento e horários de funcionamento em feriados.'
      }
    ]
  },
  'Odontologia / Dentistas': {
    name: 'Odontologia / Dentistas',
    icon: 'smile',
    category: 'Saúde Bucal',
    rolePlaceholder: 'Atendente virtual da Clínica Odontológica',
    primaryObjective: 'agendamentos',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'transferir'],
    style: {
      tone: 'natural',
      length: 'medias',
      conversation: 'natural',
      emojis: 'moderado'
    },
    clientFields: ['nome', 'telefone', 'melhor-horario', 'tipo-atendimento'],
    bannerText: 'Boas práticas de Odontologia aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Odontologia',
    rulesSubtitle: 'Normas de biossegurança, acolhimento e confirmação de consultas',
    rules: [
      {
        title: 'Acolhimento de Urgências Odontológicas',
        desc: 'Identificação rápida de dores agudas ou traumas para encaixe imediato com o cirurgião-dentista.'
      },
      {
        title: 'Triagem de Especialidades',
        desc: 'Diferenciação de procedimentos (Ortodontia, Implantes, Clareamento, Endodontia, Limpeza).'
      },
      {
        title: 'Orientações Pré e Pós-Consulta',
        desc: 'Lembretes de jejum, repouso ou documentação necessária antes de procedimentos clínicos.'
      },
      {
        title: 'Conformidade com o CRO/CFO',
        desc: 'Cumprimento das normas de publicidade odontológica e sigilo de prontuários.'
      }
    ]
  },
  'Estética & Beleza': {
    name: 'Estética & Beleza',
    icon: 'sparkles',
    category: 'Beleza & Estética',
    rolePlaceholder: 'Atendente e consultora da Clínica de Estética',
    primaryObjective: 'agendamentos',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'servicos'],
    style: {
      tone: 'natural',
      length: 'curtas',
      conversation: 'consultiva',
      emojis: 'moderado'
    },
    clientFields: ['nome', 'telefone', 'melhor-horario', 'tipo-atendimento'],
    bannerText: 'Boas práticas de Estética e Beleza aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Estética & Beleza',
    rulesSubtitle: 'Atendimento consultivo e agendamento de avaliações',
    rules: [
      {
        title: 'Avaliação Personalizada',
        desc: 'Foco no agendamento de avaliação inicial para indicação do protocolo de tratamento mais adequado.'
      },
      {
        title: 'Orientações Pré-Procedimento',
        desc: 'Envio de cuidados prévios (como exposição solar e uso de dermocosméticos antes de lasers ou peelings).'
      },
      {
        title: 'Política de Cancelamento e Reagendamento',
        desc: 'Informação gentil sobre antecedência mínima para reagendamentos sem cobrança de taxa de reserva.'
      },
      {
        title: 'Pós-Venda e Acompanhamento',
        desc: 'Mensagens pós-procedimento para checar o bem-estar e a satisfação da cliente.'
      }
    ]
  },
  'E-commerce / Varejo': {
    name: 'E-commerce / Varejo',
    icon: 'shopping-bag',
    category: 'Comércio & Varejo',
    rolePlaceholder: 'Assistente de vendas e rastreio da Loja Virtual',
    primaryObjective: 'vendas',
    secondaryActions: ['duvidas', 'contatos', 'servicos', 'transferir'],
    style: {
      tone: 'natural',
      length: 'curtas',
      conversation: 'direta',
      emojis: 'moderado'
    },
    clientFields: ['nome', 'telefone', 'email'],
    bannerText: 'Boas práticas de E-commerce aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: E-commerce / Varejo',
    rulesSubtitle: 'Conversão de carrinho, rastreamento e suporte a pedidos',
    rules: [
      {
        title: 'Agilidade em Dúvidas de Produtos',
        desc: 'Respostas rápidas sobre tamanhos, especificações, prazos de entrega e frete.'
      },
      {
        title: 'Recuperação de Vendas e Boletos',
        desc: 'Lembretes não invasivos com link direto para pagamento via PIX ou cartão.'
      },
      {
        title: 'Status e Rastreio de Pedidos',
        desc: 'Facilidade para o cliente consultar o código de rastreio e previsão de entrega.'
      },
      {
        title: 'Trocas e Devoluções Descomplicadas',
        desc: 'Direcionamento claro sobre políticas de troca dentro do Código de Defesa do Consumidor.'
      }
    ]
  },
  'Educação / Cursos': {
    name: 'Educação / Cursos',
    icon: 'graduation-cap',
    category: 'Educação & Treinamentos',
    rolePlaceholder: 'Consultor educacional e suporte ao aluno',
    primaryObjective: 'vendas',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'servicos'],
    style: {
      tone: 'natural',
      length: 'medias',
      conversation: 'consultiva',
      emojis: 'moderado'
    },
    clientFields: ['nome', 'telefone', 'email', 'melhor-horario'],
    bannerText: 'Boas práticas de Educação aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Educação / Cursos',
    rulesSubtitle: 'Orientação pedagógica e conversão de matrículas',
    rules: [
      {
        title: 'Ementa e Metodologia Claras',
        desc: 'Apresentação detalhada da grade curricular, certificações e corpo docente.'
      },
      {
        title: 'Qualificação de Nível do Aluno',
        desc: 'Identificação de objetivos de carreira ou testes de nivelamento para cursos de idiomas/tecnologia.'
      },
      {
        title: 'Condições de Bolsas e Parcelamento',
        desc: 'Informação transparente sobre opções de pagamento, bolsas de estudo e início das aulas.'
      },
      {
        title: 'Canal de Dúvidas Acadêmicas',
        desc: 'Direcionamento de alunos matriculados para a secretaria acadêmica ou portal do aluno.'
      }
    ]
  },
  'Restaurante / Gastronomia': {
    name: 'Restaurante / Gastronomia',
    icon: 'utensils',
    category: 'Alimentação & Bares',
    rolePlaceholder: 'Atendente de pedidos e reservas do Restaurante',
    primaryObjective: 'atendimento',
    secondaryActions: ['duvidas', 'contatos', 'servicos'],
    style: {
      tone: 'descontraido',
      length: 'curtas',
      conversation: 'direta',
      emojis: 'a-vontade'
    },
    clientFields: ['nome', 'telefone', 'melhor-horario'],
    bannerText: 'Boas práticas de Gastronomia aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Restaurante / Gastronomia',
    rulesSubtitle: 'Cardápio digital, reservas e controle de pedidos',
    rules: [
      {
        title: 'Cardápio e Preços Atualizados',
        desc: 'Envio imediato do cardápio digital ou link de delivery com opções do dia.'
      },
      {
        title: 'Confirmação Rápida de Reservas',
        desc: 'Registro de número de pessoas, data, horário e restrições alimentares.'
      },
      {
        title: 'Alergênicos e Observações',
        desc: 'Atenção especial a perguntas sobre pratos vegetarianos, sem glúten ou lactose.'
      },
      {
        title: 'Tempo de Espera e Taxa de Entrega',
        desc: 'Informação clara do tempo estimado de entrega para evitar reclamações.'
      }
    ]
  },
  'Tecnologia & SaaS': {
    name: 'Tecnologia & SaaS',
    icon: 'cpu',
    category: 'Softwares & Startups',
    rolePlaceholder: 'Especialista em produto e suporte técnico',
    primaryObjective: 'oportunidades',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'transferir'],
    style: {
      tone: 'natural',
      length: 'medias',
      conversation: 'consultiva',
      emojis: 'moderado'
    },
    clientFields: ['nome', 'telefone', 'email', 'tipo-atendimento'],
    bannerText: 'Boas práticas de Tecnologia & SaaS aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Tecnologia & SaaS',
    rulesSubtitle: 'Qualificação técnica, demonstrações e suporte eficiente',
    rules: [
      {
        title: 'Agendamento de Demonstração (Demo)',
        desc: 'Qualificação do tamanho da equipe e agendamento de demonstração personalizada com especialista.'
      },
      {
        title: 'Compatibilidade e Integrações',
        desc: 'Respostas claras sobre APIs, requisitos de sistema e migração de dados.'
      },
      {
        title: 'Período de Teste Gratuito',
        desc: 'Orientações de ativação de trial sem atrito e envio de links de documentação.'
      },
      {
        title: 'Escalonamento de Bugs Críticos',
        desc: 'Transferência imediata para o time de suporte N2 quando houver relatos de indisponibilidade.'
      }
    ]
  },
  'Concessionária / Veículos': {
    name: 'Concessionária / Veículos',
    icon: 'car',
    category: 'Automotivo',
    rolePlaceholder: 'Consultor de vendas de veículos e test drive',
    primaryObjective: 'oportunidades',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'transferir'],
    style: {
      tone: 'profissional',
      length: 'medias',
      conversation: 'consultiva',
      emojis: 'moderado'
    },
    clientFields: ['nome', 'telefone', 'email', 'melhor-horario'],
    bannerText: 'Boas práticas Automotivas aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Concessionária / Veículos',
    rulesSubtitle: 'Agendamento de test-drive e simulação de financiamento',
    rules: [
      {
        title: 'Agendamento de Test Drive',
        desc: 'Confirmação do modelo desejado, disponibilidade de data e documentação (CNH).'
      },
      {
        title: 'Simulação Preliminar de Financiamento',
        desc: 'Coleta de dados para estimativa de entrada e parcelas sem compromisso.'
      },
      {
        title: 'Avaliação de Veículo Usado na Troca',
        desc: 'Solicitação de ano, modelo, quilometragem e fotos para pré-avaliação da equipe.'
      },
      {
        title: 'Direcionamento ao Vendedor Responsável',
        desc: 'Conexão rápida com o consultor de salão quando o cliente tiver interesse imediato.'
      }
    ]
  },
  'Pet Shop / Veterinária': {
    name: 'Pet Shop / Veterinária',
    icon: 'heart',
    category: 'Pets & Veterinária',
    rolePlaceholder: 'Atendente da Clínica Veterinária e Pet Shop',
    primaryObjective: 'agendamentos',
    secondaryActions: ['duvidas', 'contatos', 'qualificar', 'transferir'],
    style: {
      tone: 'natural',
      length: 'curtas',
      conversation: 'natural',
      emojis: 'a-vontade'
    },
    clientFields: ['nome', 'telefone', 'melhor-horario', 'tipo-atendimento'],
    bannerText: 'Boas práticas Veterinárias e Pet aplicadas automaticamente',
    rulesTitle: 'Boas Práticas: Pet Shop / Veterinária',
    rulesSubtitle: 'Bem-estar animal, agendamento de consultas e banho/tosa',
    rules: [
      {
        title: 'Triagem de Saúde Animal',
        desc: 'Identificação de sintomas de urgência (intoxicação, vômitos severos) para atendimento emergencial imediato.'
      },
      {
        title: 'Agendamento de Banho, Tosa e Vacinas',
        desc: 'Controle de porte do pet, raça e horários disponíveis na agenda estética.'
      },
      {
        title: 'Lembretes de Carteira de Vacinação',
        desc: 'Notificações antecipadas de reforço anual de vacinas (V10, Antirrábica).'
      },
      {
        title: 'Comunicação Carinhosa com Tutores',
        desc: 'Empatia e atenção constante aos cuidados e preocupações dos tutores de pets.'
      }
    ]
  }
};

export const GENERAL_SEGMENT_CONFIG = {
  name: 'Geral / Personalizado',
  icon: 'settings',
  category: 'Geral',
  rolePlaceholder: 'Atendente virtual inteligente',
  primaryObjective: 'atendimento',
  secondaryActions: ['duvidas', 'contatos', 'qualificar', 'transferir'],
  style: {
    tone: 'natural',
    length: 'medias',
    conversation: 'natural',
    emojis: 'moderado'
  },
  clientFields: ['nome', 'telefone', 'email'],
  bannerText: 'Boas práticas gerais aplicadas automaticamente',
  rulesTitle: 'Boas Práticas Gerais de Atendimento',
  rulesSubtitle: 'Diretrizes padrão de excelência, clareza e segurança',
  rules: [
    {
      title: 'Atendimento Ágil e Cortês',
      desc: 'Responda prontamente mantendo clareza, empatia e profissionalismo em todas as mensagens.'
    },
    {
      title: 'Privacidade e LGPD',
      desc: 'Trate os dados dos clientes com confidencialidade e solicite apenas informações necessárias para o atendimento.'
    },
    {
      title: 'Identificação Precisa de Necessidades',
      desc: 'Responda com base na base de conhecimento e certifique-se de solucionar a dúvida antes de concluir o contato.'
    },
    {
      title: 'Transição Suave para Humanos',
      desc: 'Em situações complexas, negociações sensíveis ou solicitações fora do escopo, ofereça encaminhamento imediato para a equipe humana.'
    }
  ]
};

export function applySegmentConfiguration(segmentName, isCustom = false, updateLiveSummary = null, showToastNotification = true) {
  const cleanName = (segmentName || '').trim();
  const isKnown = !isCustom && Boolean(SEGMENT_CONFIGS[cleanName]);
  const config = isKnown ? SEGMENT_CONFIGS[cleanName] : GENERAL_SEGMENT_CONFIG;

  const segmentInput = document.getElementById('input-agent-segment');
  if (segmentInput && segmentInput.value !== cleanName) {
    segmentInput.value = cleanName;
  }
  if (segmentInput) {
    segmentInput.setAttribute('data-selected-segment', cleanName);
  }

  // Suggestion Chips
  const segmentChips = document.querySelectorAll('.segment-chip[data-segment]');
  segmentChips.forEach(chip => {
    const chipSegment = chip.getAttribute('data-segment');
    if (chipSegment === cleanName) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // Banner
  const bannerTextEl = document.querySelector('.segment-rules-banner-left span');
  if (bannerTextEl) {
    bannerTextEl.textContent = isKnown
      ? config.bannerText
      : `Boas práticas gerais aplicadas para "${cleanName}"`;
  }

  // Rules Modal
  const titleModal = document.getElementById('segment-rules-modal-title');
  if (titleModal) {
    titleModal.textContent = isKnown
      ? config.rulesTitle
      : `Boas Práticas Gerais: ${cleanName}`;
  }

  const subtitleModal = document.getElementById('segment-rules-modal-subtitle');
  if (subtitleModal) {
    subtitleModal.textContent = isKnown
      ? config.rulesSubtitle
      : 'Regras gerais de conduta, segurança e atendimento excelente';
  }

  const modalBody = document.getElementById('segment-rules-modal-body');
  if (modalBody && config.rules) {
    modalBody.innerHTML = `
      <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
        ${config.rules.map(rule => `
          <li style="display:flex; gap:10px; align-items:flex-start; font-size:13px; color:var(--text-secondary);">
            <i data-lucide="check" style="width:16px;height:16px;color:#00A868;flex-shrink:0;margin-top:2px;"></i>
            <span><strong>${rule.title}:</strong> ${rule.desc}</span>
          </li>
        `).join('')}
      </ul>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // Role input placeholder
  const roleInput = document.getElementById('input-agent-role');
  if (roleInput) {
    roleInput.placeholder = isKnown
      ? `Ex: ${config.rolePlaceholder}`
      : `Ex: Atendente virtual especialista em ${cleanName}`;
  }

  // Objective Principal
  if (config.primaryObjective) {
    document.querySelectorAll('#objective-primary-options .btn-objective-item').forEach(btn => {
      const obj = btn.getAttribute('data-objective');
      btn.classList.toggle('active', obj === config.primaryObjective);
    });
  }

  // Objective Secondary
  if (config.secondaryActions) {
    document.querySelectorAll('#objective-secondary-options .btn-objective-subitem').forEach(btn => {
      const act = btn.getAttribute('data-action');
      const shouldBeActive = config.secondaryActions.includes(act);
      btn.classList.toggle('active', shouldBeActive);
      const checkIcon = btn.querySelector('.subitem-check');
      if (checkIcon) {
        checkIcon.setAttribute('data-lucide', shouldBeActive ? 'check-square' : 'square');
      }
    });
  }

  // Style Options
  if (config.style) {
    document.querySelectorAll('[data-style-group="tom-de-voz"] .btn-style-option').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-value') === config.style.tone);
    });
    document.querySelectorAll('[data-style-group="tamanho-respostas"] .btn-style-option').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-value') === config.style.length);
    });
    document.querySelectorAll('[data-style-group="forma-conversar"] .btn-style-option').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-value') === config.style.conversation);
    });
    document.querySelectorAll('[data-style-group="emojis"] .btn-style-option').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-value') === config.style.emojis);
    });
  }

  // Client Data Chips
  if (config.clientFields) {
    document.querySelectorAll('#client-data-chips-container .btn-data-chip[data-field]').forEach(chip => {
      const field = chip.getAttribute('data-field');
      const isActive = config.clientFields.includes(field);
      chip.classList.toggle('active', isActive);
      const checkIcon = chip.querySelector('.chip-check-icon');
      if (checkIcon) {
        checkIcon.setAttribute('data-lucide', isActive ? 'check-square' : 'square');
      }
    });
  }

  // Re-run summary
  if (typeof updateLiveSummary === 'function') {
    updateLiveSummary();
  }

  if (window.lucide) window.lucide.createIcons();

  if (showToastNotification) {
    if (isKnown) {
      showToast(`Segmento alterado para ${config.name}! Boas práticas específicas aplicadas.`);
    } else {
      showToast(`Segmento personalizado "${cleanName}" selecionado! Configurações gerais aplicadas.`);
    }
  }
}

export function setupSegmentCombobox(updateLiveSummary) {
  const wrap = document.getElementById('segment-input-wrap');
  const segmentInput = document.getElementById('input-agent-segment');
  const menu = document.getElementById('segment-dropdown-menu');
  const chevron = document.getElementById('segment-chevron-icon');
  const segmentChips = document.querySelectorAll('.segment-chip[data-segment]');

  if (!wrap || !segmentInput || !menu) return;

  let highlightedIndex = -1;

  function normalize(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function openDropdown() {
    wrap.classList.add('open');
    menu.classList.add('show');
    const card = wrap.closest('.agent-profile-card');
    if (card) card.style.zIndex = '50';
    const topGrid = wrap.closest('.agent-profile-top-grid');
    if (topGrid) topGrid.style.zIndex = '50';
    highlightedIndex = -1;
    renderOptions(segmentInput.value.trim());
  }

  function closeDropdown() {
    wrap.classList.remove('open');
    menu.classList.remove('show');
    const card = wrap.closest('.agent-profile-card');
    if (card) card.style.removeProperty('z-index');
    const topGrid = wrap.closest('.agent-profile-top-grid');
    if (topGrid) topGrid.style.removeProperty('z-index');
    highlightedIndex = -1;
  }

  const customSegmentsList = [];
  let editingSegmentName = null;

  function deleteCustomSegment(name) {
    const idx = customSegmentsList.indexOf(name);
    if (idx !== -1) {
      customSegmentsList.splice(idx, 1);
    }

    // Remove chip from suggestions container
    const chipsContainer = document.querySelector('.segment-suggestions-chips');
    if (chipsContainer) {
      const chip = chipsContainer.querySelector(`.segment-chip[data-segment="${escapeHtml(name)}"]`);
      if (chip) chip.remove();
    }

    // If currently selected, revert to default "Clínica / Saúde"
    if (segmentInput.value.trim() === name) {
      selectSegment('Clínica / Saúde', false);
    }

    showToast(`Segmento personalizado "${name}" excluído com sucesso.`);
    renderOptions(segmentInput.value);
  }

  function renameCustomSegment(oldName, newName) {
    const cleanNew = String(newName || '').trim();
    if (!cleanNew) {
      showToast('O nome do segmento não pode ficar vazio.');
      return;
    }
    if (cleanNew === oldName) {
      editingSegmentName = null;
      renderOptions(segmentInput.value);
      return;
    }

    const idx = customSegmentsList.indexOf(oldName);
    if (idx !== -1) {
      customSegmentsList[idx] = cleanNew;
    }

    // Update chip
    const chipsContainer = document.querySelector('.segment-suggestions-chips');
    if (chipsContainer) {
      const chip = chipsContainer.querySelector(`.segment-chip[data-segment="${escapeHtml(oldName)}"]`);
      if (chip) {
        chip.setAttribute('data-segment', cleanNew);
        chip.innerHTML = `
          <span>${escapeHtml(cleanNew)}</span>
          <span class="chip-delete-btn" title="Excluir segmento" data-delete-chip="${escapeHtml(cleanNew)}">&times;</span>
        `;
      }
    }

    // If currently selected, update input and re-apply
    if (segmentInput.value.trim() === oldName) {
      segmentInput.value = cleanNew;
      segmentInput.setAttribute('data-selected-segment', cleanNew);
      applySegmentConfiguration(cleanNew, true, updateLiveSummary, false);
    }

    editingSegmentName = null;
    showToast(`Segmento alterado para "${cleanNew}".`);
    renderOptions(segmentInput.value);
  }

  function addAndSelectCustomSegment(newSegment) {
    const clean = String(newSegment || '').trim();
    if (!clean) return;

    if (!customSegmentsList.includes(clean) && !SEGMENT_CONFIGS[clean]) {
      customSegmentsList.push(clean);
    }

    // Add quick chip to suggestions container if not already present
    const chipsContainer = document.querySelector('.segment-suggestions-chips');
    if (chipsContainer) {
      let existingChip = chipsContainer.querySelector(`.segment-chip[data-segment="${escapeHtml(clean)}"]`);
      if (!existingChip) {
        const newChip = document.createElement('button');
        newChip.type = 'button';
        newChip.className = 'segment-chip custom-chip active';
        newChip.setAttribute('data-segment', clean);
        newChip.innerHTML = `
          <span>${escapeHtml(clean)}</span>
          <span class="chip-delete-btn" title="Excluir segmento" data-delete-chip="${escapeHtml(clean)}">&times;</span>
        `;
        newChip.addEventListener('click', (e) => {
          if (e.target.closest('.chip-delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`Deseja excluir o segmento personalizado "${clean}"?`)) {
              deleteCustomSegment(clean);
            }
            return;
          }
          e.preventDefault();
          selectSegment(clean, !SEGMENT_CONFIGS[clean]);
        });
        chipsContainer.appendChild(newChip);
      }
    }

    selectSegment(clean, !SEGMENT_CONFIGS[clean]);
    showToast(`Segmento "${clean}" adicionado com sucesso!`);
  }

  function renderOptions(searchText) {
    const rawSearch = searchText ? searchText.trim() : '';
    const normSearch = normalize(rawSearch);
    const knownKeys = Object.keys(SEGMENT_CONFIGS);

    // If search text matches the currently selected segment completely, show all segments
    const currentSelected = segmentInput.getAttribute('data-selected-segment') || segmentInput.value.trim();
    const isShowingAll = !normSearch || normSearch === normalize(currentSelected);

    const filteredKnown = knownKeys.filter(k => {
      if (isShowingAll) return true;
      const config = SEGMENT_CONFIGS[k];
      return normalize(k).includes(normSearch) || normalize(config.category).includes(normSearch);
    });

    const filteredCustom = customSegmentsList.filter(k => {
      if (isShowingAll) return true;
      return normalize(k).includes(normSearch);
    });

    const hasExactMatch = knownKeys.some(k => normalize(k) === normSearch) || customSegmentsList.some(k => normalize(k) === normSearch);
    const currentVal = segmentInput.value.trim();
    const totalCount = filteredKnown.length + filteredCustom.length;

    let html = '';

    if (totalCount > 0) {
      html += `
        <div class="segment-dropdown-header">
          <span>${isShowingAll ? 'Segmentos recomendados' : 'Resultados da busca'}</span>
          <span>${totalCount}</span>
        </div>
      `;

      filteredKnown.forEach(key => {
        const item = SEGMENT_CONFIGS[key];
        const isSelected = key.toLowerCase() === currentVal.toLowerCase();
        html += `
          <button type="button" class="segment-dropdown-item ${isSelected ? 'selected' : ''}" data-segment-name="${escapeHtml(key)}">
            <div class="segment-item-left">
              <div class="segment-item-icon-wrap">
                <i data-lucide="${item.icon || 'tag'}"></i>
              </div>
              <div class="segment-item-text-wrap">
                <div class="segment-item-name">${escapeHtml(item.name)}</div>
                <div class="segment-item-category">${escapeHtml(item.category)}</div>
              </div>
            </div>
            ${isSelected ? '<i data-lucide="check" class="segment-item-check"></i>' : ''}
          </button>
        `;
      });

      filteredCustom.forEach(name => {
        const isSelected = name.toLowerCase() === currentVal.toLowerCase();
        const isEditingThis = editingSegmentName === name;

        if (isEditingThis) {
          html += `
            <div class="segment-rename-inline-box" data-custom-segment="${escapeHtml(name)}">
              <input type="text" class="segment-rename-inline-input" value="${escapeHtml(name)}" data-original-name="${escapeHtml(name)}" autocomplete="off">
              <button type="button" class="btn-confirm-rename-segment" data-save-rename="${escapeHtml(name)}" title="Salvar alteração">
                <i data-lucide="check" style="width: 13px; height: 13px;"></i>
                <span>Salvar</span>
              </button>
              <button type="button" class="btn-cancel-rename-segment" title="Cancelar">
                <i data-lucide="x" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
          `;
        } else {
          html += `
            <div class="segment-dropdown-item custom-segment-row ${isSelected ? 'selected' : ''}" data-custom-segment="${escapeHtml(name)}">
              <div class="segment-item-left" role="button" tabindex="0">
                <div class="segment-item-icon-wrap custom-icon">
                  <i data-lucide="sparkles"></i>
                </div>
                <div class="segment-item-text-wrap">
                  <div class="segment-item-name">${escapeHtml(name)}</div>
                  <div class="segment-item-category">Segmento personalizado</div>
                </div>
              </div>
              <div class="segment-custom-actions">
                <button type="button" class="btn-segment-action-edit" title="Editar nome do segmento" data-edit-segment="${escapeHtml(name)}">
                  <i data-lucide="pencil" style="width: 12px; height: 12px;"></i>
                </button>
                <button type="button" class="btn-segment-action-delete" title="Excluir segmento" data-delete-segment="${escapeHtml(name)}">
                  <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
                <span class="segment-badge-custom">Personalizado</span>
                ${isSelected ? '<i data-lucide="check" class="segment-item-check"></i>' : ''}
              </div>
            </div>
          `;
        }
      });
    } else {
      html += `
        <div class="segment-dropdown-empty">
          Nenhum segmento padrão encontrado para "<strong>${escapeHtml(rawSearch)}</strong>"
        </div>
      `;
    }

    // Always offer custom option if the user typed text that is not an exact match to a known segment!
    if (rawSearch && !hasExactMatch) {
      html += `
        <button type="button" class="segment-dropdown-item custom-segment-option" data-custom-segment="${escapeHtml(rawSearch)}">
          <div class="segment-item-left">
            <div class="segment-item-icon-wrap custom-icon">
              <i data-lucide="plus"></i>
            </div>
            <div class="segment-item-text-wrap">
              <div class="segment-item-name">+ Adicionar "<strong>${escapeHtml(rawSearch)}</strong>" como novo segmento</div>
              <div class="segment-item-category">Salvar nicho e aplicar configurações de atendimento</div>
            </div>
          </div>
          <span class="segment-badge-custom">+ Adicionar</span>
        </button>
      `;
    }

    // Dropdown footer for adding custom segment
    html += `
      <div class="segment-dropdown-footer">
        <button type="button" class="btn-open-add-segment" id="btn-open-add-segment">
          <div class="segment-footer-left">
            <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i>
            <span>Não encontrou seu nicho? <strong>Adicionar novo segmento</strong></span>
          </div>
          <i data-lucide="chevron-right" style="width: 13px; height: 13px; opacity: 0.7;"></i>
        </button>
        <div class="segment-add-inline-box" id="segment-add-inline-box">
          <div class="segment-add-input-wrap">
            <input type="text" id="segment-new-custom-input" class="segment-new-custom-input" placeholder="Nome do nicho (ex: Pet Shop, Contabilidade)..." autocomplete="off">
            <button type="button" id="btn-confirm-add-segment" class="btn-confirm-add-segment">
              <i data-lucide="plus" style="width: 13px; height: 13px;"></i>
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    `;

    menu.innerHTML = html;

    // Attach click events on standard dropdown items
    menu.querySelectorAll('.segment-dropdown-item:not(.custom-segment-row)').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (item.classList.contains('custom-segment-option') || item.hasAttribute('data-custom-segment')) {
          const customVal = item.getAttribute('data-custom-segment');
          addAndSelectCustomSegment(customVal);
        } else {
          const segName = item.getAttribute('data-segment-name');
          selectSegment(segName, false);
        }
      });
    });

    // Attach click on custom segment row body (left part) to select
    menu.querySelectorAll('.custom-segment-row .segment-item-left').forEach(rowLeft => {
      rowLeft.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const row = rowLeft.closest('.custom-segment-row');
        if (row) {
          const customVal = row.getAttribute('data-custom-segment');
          selectSegment(customVal, true);
        }
      });
    });

    // Edit custom segment
    menu.querySelectorAll('.btn-segment-action-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const segName = btn.getAttribute('data-edit-segment');
        editingSegmentName = segName;
        renderOptions(segmentInput.value);
        const renameInput = menu.querySelector('.segment-rename-inline-input');
        if (renameInput) {
          renameInput.focus();
          renameInput.select();
        }
      });
    });

    // Delete custom segment
    menu.querySelectorAll('.btn-segment-action-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const segName = btn.getAttribute('data-delete-segment');
        if (confirm(`Deseja excluir o segmento personalizado "${segName}"?`)) {
          deleteCustomSegment(segName);
        }
      });
    });

    // Save rename custom segment
    menu.querySelectorAll('.btn-confirm-rename-segment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const box = btn.closest('.segment-rename-inline-box');
        const input = box ? box.querySelector('.segment-rename-inline-input') : null;
        if (input) {
          const oldName = input.getAttribute('data-original-name');
          const newName = input.value.trim();
          renameCustomSegment(oldName, newName);
        }
      });
    });

    // Cancel rename
    menu.querySelectorAll('.btn-cancel-rename-segment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        editingSegmentName = null;
        renderOptions(segmentInput.value);
      });
    });

    // Keydown on rename input
    menu.querySelectorAll('.segment-rename-inline-input').forEach(input => {
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const oldName = input.getAttribute('data-original-name');
          const newName = input.value.trim();
          renameCustomSegment(oldName, newName);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          editingSegmentName = null;
          renderOptions(segmentInput.value);
        }
      });
    });

    // Attach footer inline creator events
    const openAddBtn = menu.querySelector('#btn-open-add-segment');
    const inlineBox = menu.querySelector('#segment-add-inline-box');
    const customInput = menu.querySelector('#segment-new-custom-input');
    const confirmAddBtn = menu.querySelector('#btn-confirm-add-segment');

    if (openAddBtn && inlineBox && customInput && confirmAddBtn) {
      openAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = inlineBox.classList.toggle('show');
        if (isOpen) {
          customInput.focus();
        }
      });

      const handleConfirm = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const val = customInput.value.trim();
        if (val) {
          addAndSelectCustomSegment(val);
        } else {
          customInput.focus();
        }
      };

      confirmAddBtn.addEventListener('click', handleConfirm);

      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirm(e);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          inlineBox.classList.remove('show');
        }
      });

      customInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function selectSegment(val, isCustom) {
    segmentInput.value = val;
    segmentInput.setAttribute('data-selected-segment', val);

    // Update chips active state
    document.querySelectorAll('.segment-suggestions-chips .segment-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-segment') === val);
    });

    applySegmentConfiguration(val, isCustom, updateLiveSummary, true);
    closeDropdown();
  }

  function updateHighlighted() {
    const items = menu.querySelectorAll('.segment-dropdown-item');
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === highlightedIndex);
      if (index === highlightedIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  // Input events
  segmentInput.addEventListener('focus', () => {
    openDropdown();
  });

  segmentInput.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!wrap.classList.contains('open')) {
      openDropdown();
    }
  });

  segmentInput.addEventListener('input', () => {
    if (!wrap.classList.contains('open')) {
      wrap.classList.add('open');
      menu.classList.add('show');
    }
    highlightedIndex = -1;
    renderOptions(segmentInput.value);
  });

  segmentInput.addEventListener('keydown', (e) => {
    if (!wrap.classList.contains('open')) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        openDropdown();
        return;
      }
    }

    const items = menu.querySelectorAll('.segment-dropdown-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      highlightedIndex = (highlightedIndex + 1) % items.length;
      updateHighlighted();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
      updateHighlighted();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && items[highlightedIndex]) {
        items[highlightedIndex].click();
      } else {
        const typed = segmentInput.value.trim();
        if (typed) {
          const knownKey = Object.keys(SEGMENT_CONFIGS).find(k => normalize(k) === normalize(typed));
          if (knownKey) {
            selectSegment(knownKey, false);
          } else {
            addAndSelectCustomSegment(typed);
          }
        }
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  // Chevron button toggle
  const chevronBtn = document.getElementById('segment-chevron-btn') || document.getElementById('segment-chevron-icon');
  if (chevronBtn) {
    chevronBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (wrap.classList.contains('open')) {
        closeDropdown();
      } else {
        segmentInput.focus();
        openDropdown();
      }
    });
  }

  // Quick suggestion chips click
  segmentChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const val = chip.getAttribute('data-segment');
      selectSegment(val, false);
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      closeDropdown();
    }
  });

  // Rules modal trigger & close handlers
  const btnViewRules = document.getElementById('btn-view-segment-rules');
  const modalRules = document.getElementById('modal-segment-rules');
  if (btnViewRules && modalRules) {
    btnViewRules.addEventListener('click', (e) => {
      e.preventDefault();
      modalRules.classList.add('open', 'active');
    });
  }

  // Initial apply for default value on load
  const initialVal = segmentInput.value.trim() || 'Clínica / Saúde';
  segmentInput.setAttribute('data-selected-segment', initialVal);
  applySegmentConfiguration(initialVal, !SEGMENT_CONFIGS[initialVal], updateLiveSummary, false);
}

/**
 * Interactive behavior configuration (New Modular Profile Cards: Segment, Objectives, Style, Client Data, Safety & Live Summary)
 */
function setupBehaviorConfiguration() {
  // 1. Live Summary Generator
  function updateLiveSummary() {
    const summaryEl = document.getElementById('agent-behavior-live-summary');
    if (!summaryEl) return;

    const inputName = document.getElementById('input-agent-name');
    const agentName = inputName && inputName.value.trim() ? inputName.value.trim() : 'teste';

    // Tom de voz
    const toneBtn = document.querySelector('[data-style-group="tom-de-voz"] .btn-style-option.active span');
    const toneText = toneBtn ? toneBtn.textContent.trim().toLowerCase() : 'natural';

    // Tamanho das respostas
    const lengthBtn = document.querySelector('[data-style-group="tamanho-respostas"] .btn-style-option.active span');
    const lengthText = lengthBtn ? lengthBtn.textContent.trim().toLowerCase() : 'médias';

    // Emojis
    const emojiBtn = document.querySelector('[data-style-group="emojis"] .btn-style-option.active span');
    const emojiVal = emojiBtn ? emojiBtn.textContent.trim().toLowerCase() : 'moderado';
    let emojiDesc = 'poucos emojis';
    if (emojiVal.includes('não') || emojiVal.includes('sem')) emojiDesc = 'sem emojis';
    else if (emojiVal.includes('vontade') || emojiVal.includes('frequente')) emojiDesc = 'bastante emojis';

    // Objetivo principal
    const primaryBtn = document.querySelector('#objective-primary-options .btn-objective-item.active span');
    const primaryObj = primaryBtn ? primaryBtn.textContent.trim().toLowerCase() : 'agendamentos';
    let primaryDesc = `realizar ${primaryObj}`;
    if (primaryObj.includes('atendimento')) primaryDesc = 'fazer atendimento geral';
    else if (primaryObj.includes('oportunidade')) primaryDesc = 'gerar oportunidades de negócio';
    else if (primaryObj.includes('venda')) primaryDesc = 'realizar vendas';
    else if (primaryObj.includes('suporte')) primaryDesc = 'prestar suporte técnico';

    // Ações secundárias
    const secondaryItems = Array.from(document.querySelectorAll('#objective-secondary-options .btn-objective-subitem.active span'))
      .map(s => s.textContent.trim().toLowerCase());
    let secondaryDesc = '';
    if (secondaryItems.length > 0) {
      if (secondaryItems.length === 1) {
        secondaryDesc = ` Ela também poderá ${secondaryItems[0]}.`;
      } else {
        const last = secondaryItems.pop();
        secondaryDesc = ` Ela também poderá ${secondaryItems.join(', ')} e ${last}.`;
      }
    }

    // Segurança e atendimento humano
    const offerHuman = document.getElementById('check-safety-offer-human')?.checked;
    const safetyDesc = offerHuman 
      ? 'Quando não souber responder, oferecerá atendimento humano.'
      : 'Quando não souber responder, informará que não possui a informação.';

    summaryEl.textContent = `${agentName} atenderá clientes de forma ${toneText}, com respostas ${lengthText} e ${emojiDesc}. Seu foco principal será ${primaryDesc}.${secondaryDesc} ${safetyDesc}`;
  }

  const nameInputEl = document.getElementById('input-agent-name');
  if (nameInputEl) {
    nameInputEl.addEventListener('input', updateLiveSummary);
  }

  // 2. Searchable Segment Combobox with Free Custom Creation & Quick Suggestions
  setupSegmentCombobox(updateLiveSummary);


  // 3. Objective Primary Buttons (Single select)
  const primaryBtns = document.querySelectorAll('#objective-primary-options .btn-objective-item');
  primaryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      primaryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateLiveSummary();
    });
  });

  // 4. Objective Secondary Buttons (Multi select toggle)
  const secondaryBtns = document.querySelectorAll('#objective-secondary-options .btn-objective-subitem');
  secondaryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isActive = btn.classList.toggle('active');
      const checkIcon = btn.querySelector('.subitem-check');
      if (checkIcon) {
        checkIcon.setAttribute('data-lucide', isActive ? 'check-square' : 'square');
        if (window.lucide) window.lucide.createIcons();
      }
      updateLiveSummary();
    });
  });

  // 5. Style Options Stack (Single select per column)
  const styleColumns = document.querySelectorAll('.style-column[data-style-group]');
  styleColumns.forEach(col => {
    const options = col.querySelectorAll('.btn-style-option');
    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.preventDefault();
        options.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        updateLiveSummary();
      });
    });
  });

  // 6. Client Data Chips (Multi select toggle)
  function attachDataChipListener(chip) {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const isActive = chip.classList.toggle('active');
      const checkIcon = chip.querySelector('.chip-check-icon');
      if (checkIcon) {
        checkIcon.setAttribute('data-lucide', isActive ? 'check-square' : 'square');
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
  document.querySelectorAll('#client-data-chips-container .btn-data-chip').forEach(attachDataChipListener);

  // Add custom client field
  const btnAddField = document.getElementById('btn-add-client-field');
  const modalAddField = document.getElementById('modal-add-client-field');
  const formAddField = document.getElementById('form-add-client-field');
  const inputNewField = document.getElementById('new-client-field-name');

  if (btnAddField && modalAddField) {
    btnAddField.addEventListener('click', (e) => {
      e.preventDefault();
      modalAddField.classList.add('open');
      if (inputNewField) inputNewField.focus();
    });
  }

  if (formAddField) {
    formAddField.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = inputNewField ? inputNewField.value.trim() : '';
      if (!val) return;

      const container = document.getElementById('client-data-chips-container');
      if (container && btnAddField) {
        const newChip = document.createElement('button');
        newChip.type = 'button';
        newChip.className = 'btn-data-chip active';
        newChip.setAttribute('data-field', val.toLowerCase().replace(/\s+/g, '-'));
        newChip.innerHTML = `
          <i data-lucide="check-square" class="chip-check-icon"></i>
          <i data-lucide="tag" class="chip-field-icon"></i>
          <span>${val}</span>
        `;
        container.insertBefore(newChip, btnAddField);
        attachDataChipListener(newChip);
        if (window.lucide) window.lucide.createIcons();
      }

      modalAddField.classList.remove('open');
      formAddField.reset();
      showToast(`Campo "${val}" adicionado com sucesso!`);
    });
  }

  // Modal close handlers
  document.querySelectorAll('#modal-segment-rules .modal-close, #modal-add-client-field .modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalRules) modalRules.classList.remove('open');
      if (modalAddField) modalAddField.classList.remove('open');
    });
  });

  // 7. Safety Checkboxes listener
  const safetyInputs = document.querySelectorAll('.safety-check-item input[type="checkbox"]');
  safetyInputs.forEach(input => {
    input.addEventListener('change', updateLiveSummary);
  });

  // 8. Test Agent CTA in summary card
  const btnSummaryTest = document.getElementById('btn-summary-test-agent');
  if (btnSummaryTest) {
    btnSummaryTest.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openTestAiModal === 'function') {
        window.openTestAiModal(currentAgentId);
      }
    });
  }

  // Initialize live summary
  updateLiveSummary();
}

/**
 * Behavior textarea character counter & syncing
 */
function setupBehaviorCounter() {
  const textarea = document.getElementById('agent-behavior-textarea');
  const counter = document.getElementById('behavior-char-count');
  const inputName = document.getElementById('input-agent-name');
  const nameDisplay = document.getElementById('edit-agent-name-display');
  const inputRole = document.getElementById('input-agent-role');
  const roleDisplay = document.getElementById('edit-agent-role-display');

  if (textarea && counter) {
    const updateCount = () => {
      const len = textarea.value.length;
      counter.textContent = `${len}/3000`;
    };

    textarea.addEventListener('input', updateCount);
    updateCount();
  }

  if (inputName) {
    inputName.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (nameDisplay) nameDisplay.textContent = val || 'Agente';
      const avatarCircle = document.getElementById('edit-agent-avatar-circle');
      if (avatarCircle) avatarCircle.textContent = (val[0] || 'A').toUpperCase();
      const summaryEl = document.getElementById('agent-behavior-live-summary');
      if (summaryEl && typeof updateLiveSummary === 'function') {
        // Will be picked up on event
        inputName.dispatchEvent(new CustomEvent('namechange'));
      }
    });
  }

  if (inputRole && roleDisplay) {
    inputRole.addEventListener('input', (e) => {
      roleDisplay.textContent = e.target.value.trim() || 'Atendimento com IA';
    });
  }
}

/**
 * Save button action
 */
function setupSaveAction() {
  const saveBtns = document.querySelectorAll('.btn-save-agent');
  saveBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const inputName = document.getElementById('input-agent-name');
      const inputRole = document.getElementById('input-agent-role');
      const inputSegment = document.getElementById('input-agent-segment');
      const newName = inputName ? inputName.value.trim() : '';
      const newRole = inputRole ? inputRole.value.trim() : '';
      const newSegment = inputSegment ? inputSegment.value.trim() : '';

      // Update data item in zapChatData
      const agent = zapChatData.agentes.list.find(a => a.id === currentAgentId);
      if (agent) {
        if (newName) agent.name = newName;
        if (newRole) agent.role = newRole;
        if (newSegment) agent.segment = newSegment;
      }

      // Save agent greeting preferences
      saveAgentGreeting(currentAgentId);

      // Save agent schedule preferences
      saveAgentSchedule(currentAgentId);

      // Save agent human transfer preferences
      saveAgentTransferSettings(currentAgentId);

      if (window.refreshAgentsTable) {
        window.refreshAgentsTable();
      }

      showToast('Configurações do agente salvas com sucesso!');

      const origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Salvo!';
      if (window.lucide) window.lucide.createIcons();

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = origHtml;
        if (window.lucide) window.lucide.createIcons();
      }, 1800);
    });
  });

  // Simulator CTA button
  const testBtn = document.getElementById('btn-agent-test-ai');
  if (testBtn) {
    testBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openTestAiModal(currentAgentId);
    });
  }

  setupTestAiModal();
}

/**
 * Open Test AI interactive modal
 */
export function openTestAiModal(agentId) {
  const targetId = agentId || currentAgentId;
  const agent = zapChatData.agentes.list.find(a => a.id === targetId) || zapChatData.agentes.list[0];

  const modal = document.getElementById('modal-test-ai');
  if (!modal) return;

  // Update modal header with agent data
  const avatarEl = document.getElementById('modal-test-avatar');
  const nameEl = document.getElementById('modal-test-agent-name');
  const roleEl = document.getElementById('modal-test-agent-role');

  if (agent) {
    if (avatarEl) {
      avatarEl.style.backgroundColor = agent.avatarBg || '#E9F7F1';
      avatarEl.style.color = agent.avatarColor || '#00A868';
      avatarEl.textContent = agent.name.charAt(0).toUpperCase();
    }
    if (nameEl) nameEl.textContent = agent.name;
    if (roleEl) roleEl.textContent = agent.role || 'Vendedor em Loja Download';
  }

  modal.classList.add('open');
  if (window.lucide) window.lucide.createIcons();

  // Focus message input
  setTimeout(() => {
    const input = document.getElementById('input-test-chat-message');
    if (input) input.focus();
  }, 120);
}

window.openTestAiModal = openTestAiModal;

/**
 * Setup Test AI chat interactions and sessions
 */
function setupTestAiModal() {
  const form = document.getElementById('form-test-chat');
  const input = document.getElementById('input-test-chat-message');
  const chatBody = document.getElementById('modal-test-chat-body');
  const newChatBtn = document.getElementById('btn-modal-test-new-chat');
  const clearBtn = document.getElementById('btn-modal-clear-chats');
  const sessionItems = document.querySelectorAll('.modal-test-session-item');

  const cannedSessions = {
    '1': [
      { sender: 'user', text: 'Olá, quais são os pacotes disponíveis na loja?', time: '14:18' },
      { sender: 'agent', text: 'Olá! Seja bem-vindo à Loja Download. Temos nosso catálogo completo de soluções digitais. O produto mais recomendado é o <strong>Pacote de Automações Pro</strong> por R$ 197. Gostaria de saber mais?', time: '14:19' }
    ],
    '2': [
      { sender: 'user', text: 'Qual o prazo de entrega dos serviços?', time: '16:10' },
      { sender: 'agent', text: 'Para informar corretamente, preciso confirmar o tipo de ativação. Se for integração via API ZapChat, a liberação e sincronização são imediatas!', time: '16:11' }
    ]
  };

  function renderMessages(messages) {
    if (!chatBody) return;
    const agent = zapChatData.agentes.list.find(a => a.id === currentAgentId) || zapChatData.agentes.list[0];
    const initial = agent ? agent.name.charAt(0).toUpperCase() : 'P';

    chatBody.innerHTML = messages.map(m => `
      <div class="test-chat-msg ${m.sender}">
        ${m.sender === 'agent' ? `<div class="test-msg-avatar">${initial}</div>` : ''}
        <div class="test-msg-bubble">
          ${m.text}
          <span class="test-msg-time">${m.time}</span>
        </div>
      </div>
    `).join('');

    chatBody.scrollTop = chatBody.scrollHeight;
    if (window.lucide) window.lucide.createIcons();
  }

  // Session click
  sessionItems.forEach(item => {
    item.addEventListener('click', () => {
      sessionItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const sid = item.getAttribute('data-session-id');
      if (cannedSessions[sid]) {
        renderMessages(cannedSessions[sid]);
      }
    });
  });

  // Start new chat button
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      sessionItems.forEach(i => i.classList.remove('active'));
      const agent = zapChatData.agentes.list.find(a => a.id === currentAgentId) || zapChatData.agentes.list[0];
      const agentName = agent ? agent.name : 'Pedro';

      if (chatBody) {
        chatBody.innerHTML = `
          <div class="modal-test-empty-state" id="modal-test-empty-state">
            <div class="modal-test-empty-title">Converse com ${agentName}</div>
            <p class="modal-test-empty-sub">Simule um atendimento em tempo real para avaliar as respostas e o comportamento da IA.</p>
          </div>
        `;
      }
      if (input) {
        input.value = '';
        input.focus();
      }
    });
  }

  // Clear chats button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const list = document.getElementById('modal-test-sessions-list');
      if (list) {
        list.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:14px 4px;">Nenhuma conversa anterior</div>';
      }
      if (newChatBtn) newChatBtn.click();
      showToast('Histórico de testes limpo com sucesso.');
    });
  }

  // Submit test message
  if (form && input && chatBody) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const agent = zapChatData.agentes.list.find(a => a.id === currentAgentId) || zapChatData.agentes.list[0];
      const agentName = agent ? agent.name : 'Pedro';
      const initial = agentName.charAt(0).toUpperCase();

      // Remove empty state if present
      const emptyState = document.getElementById('modal-test-empty-state');
      if (emptyState) emptyState.remove();

      // Append user bubble
      const userMsg = document.createElement('div');
      userMsg.className = 'test-chat-msg user';
      userMsg.innerHTML = `
        <div class="test-msg-bubble">
          ${escapeHtml(text)}
          <span class="test-msg-time">${timeStr}</span>
        </div>
      `;
      chatBody.appendChild(userMsg);
      input.value = '';
      chatBody.scrollTop = chatBody.scrollHeight;

      // Append typing indicator
      const typingEl = document.createElement('div');
      typingEl.className = 'test-chat-msg agent';
      typingEl.id = 'active-typing-indicator';
      typingEl.innerHTML = `
        <div class="test-msg-avatar">${initial}</div>
        <div class="test-typing-indicator">
          <span class="test-typing-dot"></span>
          <span class="test-typing-dot"></span>
          <span class="test-typing-dot"></span>
        </div>
      `;
      chatBody.appendChild(typingEl);
      chatBody.scrollTop = chatBody.scrollHeight;

      // Simulated AI response delay
      setTimeout(() => {
        const indicator = document.getElementById('active-typing-indicator');
        if (indicator) indicator.remove();

        const responseText = generateAgentReply(text, agentName);
        const replyTime = new Date();
        const replyTimeStr = `${String(replyTime.getHours()).padStart(2, '0')}:${String(replyTime.getMinutes()).padStart(2, '0')}`;

        const agentMsg = document.createElement('div');
        agentMsg.className = 'test-chat-msg agent';
        agentMsg.innerHTML = `
          <div class="test-msg-avatar">${initial}</div>
          <div class="test-msg-bubble">
            ${responseText}
            <span class="test-msg-time">${replyTimeStr}</span>
          </div>
        `;
        chatBody.appendChild(agentMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 850);
    });
  }
}

function generateAgentReply(userText, agentName) {
  const lower = userText.toLowerCase();
  if (lower.includes('olá') || lower.includes('ola') || lower.includes('oi') || lower.includes('bom dia') || lower.includes('boa tarde')) {
    return `Olá! Muito prazer. Sou o <strong>${agentName}</strong>, atendente virtual da Loja Download. Como posso ajudar você hoje?`;
  }
  if (lower.includes('preço') || lower.includes('preco') || lower.includes('quanto') || lower.includes('valor')) {
    return `Nossos planos e produtos possuem valores a partir de R$ 97,00/mês com garantia de 7 dias e suporte total via WhatsApp! Gostaria do catálogo em PDF?`;
  }
  if (lower.includes('suporte') || lower.includes('humano') || lower.includes('atendente')) {
    return `Compreendo perfeitamente! Se você preferir, posso transferir este atendimento imediatamente para um de nossos especialistas humanos. Deseja que eu faça a transferência?`;
  }
  if (lower.includes('pix') || lower.includes('pagar') || lower.includes('comprar') || lower.includes('cartao') || lower.includes('cartão')) {
    return `Aceitamos Pix com liberação instantânea e Cartão de Crédito em até 12x. Posso gerar o link de pagamento exclusivo para você agora mesmo!`;
  }
  return `Entendi perfeitamente sua pergunta sobre "${escapeHtml(userText)}". Estou configurado para responder com agilidade de acordo com as instruções cadastradas. Deseja saber mais detalhes?`;
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

/**
 * Back to agents button
 */
function setupBackToAgents() {
  const backBtns = document.querySelectorAll('.btn-back-to-agents');
  backBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.switchView) {
        window.switchView('agentes');
      }
    });
  });
}

/**
 * Training & knowledge actions (Unified Agent Knowledge Base)
 */
function setupTrainingActions() {
  // 1. Switch between the 4 knowledge types (Texto, Site/URL, Arquivos, Perguntas e Respostas)
  const typeButtons = document.querySelectorAll('.knowledge-type-btn[data-knowledge-type]');
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-knowledge-type');
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.knowledge-input-form-pane').forEach(pane => {
        pane.classList.remove('active');
      });

      const targetPane = document.getElementById(`pane-knowledge-${type}`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // Helper to update knowledge count badge
  function updateKnowledgeCount() {
    const badge = document.getElementById('knowledge-count-badge');
    const items = document.querySelectorAll('#knowledge-items-list .knowledge-item-card');
    if (badge) badge.textContent = items.length;
  }

  // 2. Dropzone for Files (Arquivos)
  const uploadDropzone = document.getElementById('training-dropzone');
  if (uploadDropzone) {
    let fileInput = document.getElementById('hidden-knowledge-file-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'hidden-knowledge-file-input';
      fileInput.multiple = true;
      fileInput.accept = '.pdf,.txt,.docx,.csv';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);

      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const list = document.getElementById('knowledge-items-list');
        files.forEach(file => {
          const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
          const ext = file.name.split('.').pop().toUpperCase();
          addKnowledgeCardToList({
            icon: 'file-text',
            iconType: 'arquivo',
            name: file.name,
            meta: `Arquivo ${ext} • ${sizeMb > 0 ? sizeMb + ' MB' : Math.round(file.size / 1024) + ' KB'} • Adicionado agora`
          });
        });

        fileInput.value = '';
        showToast(`${files.length} arquivo(s) adicionado(s) à base de conhecimento!`);
      });
    }

    uploadDropzone.addEventListener('click', () => {
      fileInput.click();
    });
  }

  // 3. Add Text Knowledge (Texto)
  const btnAddText = document.getElementById('btn-add-k-text');
  if (btnAddText) {
    btnAddText.addEventListener('click', () => {
      const titleInput = document.getElementById('input-k-text-title');
      const contentInput = document.getElementById('input-k-text-content');
      const title = titleInput?.value.trim();
      const content = contentInput?.value.trim();

      if (!title && !content) {
        showToast('Preencha o título ou conteúdo da instrução.');
        return;
      }

      addKnowledgeCardToList({
        icon: 'file-text',
        iconType: 'texto',
        name: title || (content.length > 50 ? content.substring(0, 47) + '...' : content),
        meta: 'Texto / Instrução • Cadastrado agora'
      });

      if (titleInput) titleInput.value = '';
      if (contentInput) contentInput.value = '';
      showToast('Instrução adicionada à base de conhecimento!');
    });
  }

  // 4. Add Site/URL Knowledge
  const btnAddSite = document.getElementById('btn-add-k-site');
  if (btnAddSite) {
    btnAddSite.addEventListener('click', () => {
      const urlInput = document.getElementById('input-k-site-url');
      const url = urlInput?.value.trim();

      if (!url) {
        showToast('Insira uma URL válida para indexar.');
        return;
      }

      addKnowledgeCardToList({
        icon: 'globe',
        iconType: 'site',
        name: url.startsWith('http') ? url : `https://${url}`,
        meta: 'Site / URL • Sincronizado agora'
      });

      if (urlInput) urlInput.value = '';
      showToast(`URL indexada com sucesso!`);
    });
  }

  // 5. Add Perguntas e Respostas (FAQ)
  const btnAddFaq = document.getElementById('btn-add-k-faq');
  if (btnAddFaq) {
    btnAddFaq.addEventListener('click', () => {
      const qInput = document.getElementById('input-k-faq-q');
      const aInput = document.getElementById('input-k-faq-a');
      const question = qInput?.value.trim();
      const answer = aInput?.value.trim();

      if (!question || !answer) {
        showToast('Preencha a pergunta e a resposta.');
        return;
      }

      addKnowledgeCardToList({
        icon: 'help-circle',
        iconType: 'faq',
        name: question,
        meta: 'Perguntas e Respostas • 1 par cadastrado agora'
      });

      if (qInput) qInput.value = '';
      if (aInput) aInput.value = '';
      showToast('Pergunta e resposta cadastradas com sucesso!');
    });
  }

  // Helper to dynamically prepend knowledge card
  function addKnowledgeCardToList(item) {
    const list = document.getElementById('knowledge-items-list');
    if (!list) return;

    const card = document.createElement('div');
    card.className = 'knowledge-item-card';
    card.dataset.knowledgeId = 'k_' + Date.now();
    card.innerHTML = `
      <div class="knowledge-item-left">
        <div class="knowledge-item-icon-box ${item.iconType}" title="${item.iconType}">
          <i data-lucide="${item.icon}" style="width:18px;height:18px;"></i>
        </div>
        <div class="knowledge-item-details">
          <div class="knowledge-item-name">${escapeHtml(item.name)}</div>
          <div class="knowledge-item-meta">${escapeHtml(item.meta)}</div>
        </div>
      </div>
      <div class="knowledge-item-right">
        <span class="badge badge-dot badge-active">Ativo</span>
        <div class="knowledge-item-actions">
          <button type="button" class="btn-knowledge-action btn-edit-knowledge" title="Editar">
            <i data-lucide="edit-3" style="width:13px;height:13px;"></i>
          </button>
          <button type="button" class="btn-knowledge-action delete btn-delete-knowledge" title="Excluir">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
          </button>
        </div>
      </div>
    `;

    list.insertBefore(card, list.firstChild);
    if (window.lucide) window.lucide.createIcons();
    updateKnowledgeCount();
  }

  // 6. Contextual Knowledge Edit Modal and Event delegation
  let currentEditingKnowledgeCard = null;
  const knowledgeModal = document.getElementById('modal-edit-knowledge');
  const formEditKnowledge = document.getElementById('form-edit-knowledge');

  // Detect knowledge item type
  function getKnowledgeCardType(card) {
    if (!card) return 'arquivo';
    if (card.querySelector('.knowledge-item-icon-box.arquivo')) return 'arquivo';
    if (card.querySelector('.knowledge-item-icon-box.site')) return 'site';
    if (card.querySelector('.knowledge-item-icon-box.faq')) return 'faq';
    if (card.querySelector('.knowledge-item-icon-box.texto')) return 'texto';

    const name = (card.querySelector('.knowledge-item-name')?.textContent || '').toLowerCase();
    const meta = (card.querySelector('.knowledge-item-meta')?.textContent || '').toLowerCase();

    if (name.startsWith('http') || meta.includes('site') || meta.includes('url')) return 'site';
    if (meta.includes('pergunta') || meta.includes('par cadastrado')) return 'faq';
    if (meta.includes('texto')) return 'texto';
    return 'arquivo';
  }

  // Handle file re-upload inside modal
  const btnReupload = document.getElementById('btn-reupload-file');
  const fileHiddenInput = document.getElementById('edit-file-hidden-input');
  if (btnReupload && fileHiddenInput) {
    btnReupload.addEventListener('click', () => {
      fileHiddenInput.click();
    });

    fileHiddenInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const nameInp = document.getElementById('edit-file-name');
      const labelEl = document.getElementById('edit-file-current-label');
      const metaEl = document.getElementById('edit-file-current-meta');
      const feedbackEl = document.getElementById('edit-file-reupload-feedback');

      if (nameInp) nameInp.value = file.name;
      if (labelEl) labelEl.textContent = file.name;

      const sizeStr = file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        : (file.size / 1024).toFixed(0) + ' KB';
      const ext = file.name.split('.').pop()?.toUpperCase() || 'ARQUIVO';

      if (metaEl) metaEl.textContent = `Arquivo ${ext} • ${sizeStr}`;
      if (feedbackEl) {
        feedbackEl.textContent = `✓ Novo arquivo selecionado: ${file.name} (${sizeStr}) pronto para salvar.`;
        feedbackEl.style.color = 'var(--primary)';
      }
    });
  }

  // Handle site sync button inside modal
  const btnSyncSite = document.getElementById('btn-sync-site-now');
  if (btnSyncSite) {
    btnSyncSite.addEventListener('click', () => {
      const icon = document.getElementById('icon-sync-site');
      const text = document.getElementById('text-sync-site');
      const statusEl = document.getElementById('edit-site-sync-status');

      if (icon) icon.classList.add('spin-anim');
      if (text) text.textContent = 'Sincronizando...';
      btnSyncSite.disabled = true;

      setTimeout(() => {
        if (icon) icon.classList.remove('spin-anim');
        if (text) text.textContent = 'Puxar dados atualizados';
        btnSyncSite.disabled = false;
        if (statusEl) statusEl.textContent = 'Sincronizado agora mesmo';
        showToast('Conteúdo do site sincronizado com sucesso!');
      }, 850);
    });
  }

  // Form submit handler
  if (formEditKnowledge) {
    formEditKnowledge.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentEditingKnowledgeCard) return;

      const type = document.getElementById('edit-knowledge-type')?.value || 'arquivo';
      const nameEl = currentEditingKnowledgeCard.querySelector('.knowledge-item-name');
      const metaEl = currentEditingKnowledgeCard.querySelector('.knowledge-item-meta');
      const badge = currentEditingKnowledgeCard.querySelector('.badge-dot');
      const statusVal = document.getElementById('edit-knowledge-status')?.value;
      const notesVal = document.getElementById('edit-knowledge-notes')?.value.trim();

      if (type === 'arquivo') {
        const fileName = document.getElementById('edit-file-name')?.value.trim();
        const fileMeta = document.getElementById('edit-file-current-meta')?.textContent.trim();
        if (nameEl && fileName) nameEl.textContent = fileName;
        if (metaEl && fileMeta) metaEl.textContent = fileMeta;
      } else if (type === 'site') {
        const siteUrl = document.getElementById('edit-site-url')?.value.trim();
        const syncStatus = document.getElementById('edit-site-sync-status')?.textContent.trim() || 'Sincronizado agora mesmo';
        if (nameEl && siteUrl) nameEl.textContent = siteUrl;
        if (metaEl) metaEl.textContent = `Site / URL • ${syncStatus}`;
      } else if (type === 'faq') {
        const question = document.getElementById('edit-faq-question')?.value.trim();
        const answer = document.getElementById('edit-faq-answer')?.value.trim();
        if (nameEl && question) nameEl.textContent = question;
        if (answer) currentEditingKnowledgeCard.setAttribute('data-faq-answer', answer);
      } else if (type === 'texto') {
        const textTitle = document.getElementById('edit-text-title')?.value.trim();
        const textBody = document.getElementById('edit-text-body')?.value.trim();
        if (nameEl && textTitle) nameEl.textContent = textTitle;
        if (textBody) currentEditingKnowledgeCard.setAttribute('data-text-body', textBody);
      }

      if (badge && statusVal) {
        if (statusVal === 'active') {
          badge.className = 'badge badge-dot badge-active';
          badge.textContent = 'Ativo';
        } else {
          badge.className = 'badge badge-dot badge-gray';
          badge.textContent = 'Pausado';
        }
      }

      if (notesVal) {
        currentEditingKnowledgeCard.setAttribute('data-notes', notesVal);
      }

      if (knowledgeModal) {
        knowledgeModal.classList.remove('open');
        knowledgeModal.classList.remove('active');
      }
      showToast('Conhecimento atualizado com sucesso!');
    });
  }

  // Handle Edit and Delete on document level so it works reliably everywhere
  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.btn-delete-knowledge');
    if (delBtn) {
      e.preventDefault();
      const card = delBtn.closest('.knowledge-item-card');
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.96)';
        card.style.transition = 'all 0.2s ease';
        setTimeout(() => {
          card.remove();
          updateKnowledgeCount();
          showToast('Conhecimento excluído com sucesso.');
        }, 200);
      }
      return;
    }

    const editBtn = e.target.closest('.btn-edit-knowledge');
    if (editBtn) {
      e.preventDefault();
      const card = editBtn.closest('.knowledge-item-card');
      if (card) {
        currentEditingKnowledgeCard = card;
        const type = getKnowledgeCardType(card);
        const nameEl = card.querySelector('.knowledge-item-name');
        const metaEl = card.querySelector('.knowledge-item-meta');
        const badge = card.querySelector('.badge-dot');

        const name = nameEl ? nameEl.textContent.trim() : '';
        const meta = metaEl ? metaEl.textContent.trim() : '';

        // Configure modal header & context block by type
        const typeInput = document.getElementById('edit-knowledge-type');
        if (typeInput) typeInput.value = type;

        const titleEl = document.getElementById('modal-edit-knowledge-title');
        const descEl = document.getElementById('modal-edit-knowledge-desc');
        const iconEl = document.getElementById('modal-edit-knowledge-icon');

        document.querySelectorAll('.edit-knowledge-context-block').forEach(b => (b.style.display = 'none'));
        const targetBlock = document.getElementById(`edit-block-${type}`);
        if (targetBlock) targetBlock.style.display = 'block';

        if (type === 'arquivo') {
          if (titleEl) titleEl.textContent = 'Editar Arquivo de Conhecimento';
          if (descEl) descEl.textContent = 'Renomeie ou substitua o arquivo de treinamento do agente';
          if (iconEl) iconEl.setAttribute('data-lucide', 'file-text');

          const nameInp = document.getElementById('edit-file-name');
          const labelEl = document.getElementById('edit-file-current-label');
          const metaCurrEl = document.getElementById('edit-file-current-meta');
          const feedbackEl = document.getElementById('edit-file-reupload-feedback');

          if (nameInp) nameInp.value = name;
          if (labelEl) labelEl.textContent = name;
          if (metaCurrEl) metaCurrEl.textContent = meta || 'Arquivo carregado';
          if (feedbackEl) {
            feedbackEl.textContent = 'Formatos suportados: PDF, DOCX, TXT ou CSV até 25MB.';
            feedbackEl.style.color = 'var(--text-muted)';
          }
        } else if (type === 'site') {
          if (titleEl) titleEl.textContent = 'Editar Site / URL de Conhecimento';
          if (descEl) descEl.textContent = 'Altere a URL ou puxe os dados mais recentes da página';
          if (iconEl) iconEl.setAttribute('data-lucide', 'globe');

          const urlInp = document.getElementById('edit-site-url');
          const syncStatusEl = document.getElementById('edit-site-sync-status');
          if (urlInp) urlInp.value = name;
          if (syncStatusEl) {
            syncStatusEl.textContent = meta.includes('•') ? meta.split('•')[1]?.trim() : (meta || 'Sincronizado recentemente');
          }
        } else if (type === 'faq') {
          if (titleEl) titleEl.textContent = 'Editar Pergunta e Resposta';
          if (descEl) descEl.textContent = 'Altere a dúvida cadastrada e a resposta padrão da IA';
          if (iconEl) iconEl.setAttribute('data-lucide', 'help-circle');

          const qInp = document.getElementById('edit-faq-question');
          const aInp = document.getElementById('edit-faq-answer');
          if (qInp) qInp.value = name;
          if (aInp) {
            aInp.value = card.getAttribute('data-faq-answer') ||
              'O prazo de entrega varia de 3 a 7 dias úteis dependendo da sua localidade. O código de rastreamento é enviado automaticamente para o seu WhatsApp e e-mail assim que o pedido for despachado.';
          }
        } else if (type === 'texto') {
          if (titleEl) titleEl.textContent = 'Editar Texto de Conhecimento';
          if (descEl) descEl.textContent = 'Modifique o título e as instruções do texto livre';
          if (iconEl) iconEl.setAttribute('data-lucide', 'align-left');

          const tInp = document.getElementById('edit-text-title');
          const bInp = document.getElementById('edit-text-body');
          if (tInp) tInp.value = name;
          if (bInp) bInp.value = card.getAttribute('data-text-body') || '';
        }

        const statusSelect = document.getElementById('edit-knowledge-status');
        const notesInput = document.getElementById('edit-knowledge-notes');
        if (statusSelect) statusSelect.value = (badge && badge.classList.contains('badge-active')) ? 'active' : 'paused';
        if (notesInput) notesInput.value = card.getAttribute('data-notes') || '';

        const modal = document.getElementById('modal-edit-knowledge');
        if (modal) {
          modal.classList.add('open');
          modal.classList.add('active');
          if (window.lucide) window.lucide.createIcons();
        }
      }
      return;
    }
  });

  const knowledgeList = document.getElementById('knowledge-items-list');
  if (knowledgeList) {
    knowledgeList.addEventListener('click', (e) => {

      // Allow clicking on badge to toggle Ativo / Pausado status
      const badge = e.target.closest('.badge-dot');
      if (badge) {
        if (badge.classList.contains('badge-active')) {
          badge.classList.remove('badge-active');
          badge.classList.add('badge-gray');
          badge.textContent = 'Pausado';
          showToast('Status alterado para Pausado.');
        } else {
          badge.classList.remove('badge-gray');
          badge.classList.add('badge-active');
          badge.textContent = 'Ativo';
          showToast('Status alterado para Ativo.');
        }
      }
    });
  }
}

// ==========================================================================
// HORÁRIO DE ATENDIMENTO DA IA (DISPONIBILIDADE)
// ==========================================================================

const DEFAULT_DAYS = [
  { id: 'seg', name: 'Segunda-feira', short: 'Seg', enabled: true, start: '18:00', end: '08:00', allDay: false },
  { id: 'ter', name: 'Terça-feira', short: 'Ter', enabled: true, start: '18:00', end: '08:00', allDay: false },
  { id: 'qua', name: 'Quarta-feira', short: 'Qua', enabled: true, start: '18:00', end: '08:00', allDay: false },
  { id: 'qui', name: 'Quinta-feira', short: 'Qui', enabled: true, start: '18:00', end: '08:00', allDay: false },
  { id: 'sex', name: 'Sexta-feira', short: 'Sex', enabled: true, start: '18:00', end: '08:00', allDay: false },
  { id: 'sab', name: 'Sábado', short: 'Sáb', enabled: true, start: '00:00', end: '23:59', allDay: true },
  { id: 'dom', name: 'Domingo', short: 'Dom', enabled: true, start: '00:00', end: '23:59', allDay: true }
];

let agentSchedule = {
  enabled: false,
  preset: 'night_weekend',
  outOfHoursAction: 'silent',
  outOfHoursMessage: 'Olá! No momento nossa equipe e assistente virtual estão fora do horário de atendimento. Sua mensagem foi recebida com sucesso e responderemos assim que retornarmos!',
  days: JSON.parse(JSON.stringify(DEFAULT_DAYS))
};

function setupAgentSchedule() {
  const toggle = document.getElementById('toggle-agent-schedule');
  if (!toggle) return;

  // Load initial data for current agent
  loadAgentSchedule(currentAgentId);

  // Toggle change listener
  toggle.addEventListener('change', () => {
    agentSchedule.enabled = toggle.checked;
    updateScheduleVisibility();
    updateLiveStatusBadge();
  });

  // Presets buttons
  const presetBtns = document.querySelectorAll('.schedule-preset-btn[data-preset]');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const presetKey = btn.getAttribute('data-preset');
      applySchedulePreset(presetKey);
    });
  });

  // Copy weekdays button
  const copyBtn = document.getElementById('btn-copy-weekdays');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      copyMondayToWeekdays();
    });
  }

  // Radio cards for out of hours action
  const radioSilent = document.querySelector('input[name="agent_out_action"][value="silent"]');
  const radioReply = document.querySelector('input[name="agent_out_action"][value="auto_reply"]');
  const replyBox = document.getElementById('schedule-auto-reply-box');
  const cardSilent = document.getElementById('label-action-silent');
  const cardReply = document.getElementById('label-action-reply');

  function updateRadioSelection() {
    if (radioReply && radioReply.checked) {
      if (replyBox) replyBox.style.display = 'block';
      if (cardReply) cardReply.classList.add('active');
      if (cardSilent) cardSilent.classList.remove('active');
      agentSchedule.outOfHoursAction = 'auto_reply';
    } else {
      if (replyBox) replyBox.style.display = 'none';
      if (cardSilent) cardSilent.classList.add('active');
      if (cardReply) cardReply.classList.remove('active');
      agentSchedule.outOfHoursAction = 'silent';
    }
  }

  if (radioSilent) radioSilent.addEventListener('change', updateRadioSelection);
  if (radioReply) radioReply.addEventListener('change', updateRadioSelection);

  // Auto reply message input
  const msgTextarea = document.getElementById('schedule-out-message-text');
  if (msgTextarea) {
    msgTextarea.addEventListener('input', () => {
      agentSchedule.outOfHoursMessage = msgTextarea.value;
    });
  }
}

function updateScheduleVisibility() {
  const toggle = document.getElementById('toggle-agent-schedule');
  const banner247 = document.getElementById('schedule-banner-247');
  const panelCustom = document.getElementById('schedule-panel-custom');

  if (!toggle) return;

  if (toggle.checked) {
    if (banner247) banner247.style.display = 'none';
    if (panelCustom) panelCustom.style.display = 'flex';
  } else {
    if (banner247) banner247.style.display = 'flex';
    if (panelCustom) panelCustom.style.display = 'none';
  }
  if (window.lucide) window.lucide.createIcons();
}

function renderScheduleDays() {
  const container = document.getElementById('schedule-days-container');
  if (!container) return;

  container.innerHTML = agentSchedule.days.map((day, idx) => {
    const isOvernight = isTimeOvernight(day.start, day.end) && !day.allDay;
    return `
      <div class="schedule-day-row ${day.enabled ? '' : 'inactive'}" data-day-id="${day.id}">
        <div class="schedule-day-left">
          <label class="day-switch-toggle" title="${day.enabled ? 'Desativar este dia' : 'Ativar este dia'}">
            <input type="checkbox" class="input-day-enable" data-day-idx="${idx}" ${day.enabled ? 'checked' : ''}>
            <span class="day-switch-slider"></span>
          </label>
          <span class="schedule-day-name">${day.name}</span>
        </div>
        <div class="schedule-day-right">
          ${day.enabled ? `
            <div class="schedule-time-box">
              <input type="time" class="schedule-time-input input-time-start" data-day-idx="${idx}" value="${day.start}" ${day.allDay ? 'disabled' : ''}>
              <span>até</span>
              <input type="time" class="schedule-time-input input-time-end" data-day-idx="${idx}" value="${day.end}" ${day.allDay ? 'disabled' : ''}>
            </div>
            ${isOvernight ? `<span class="badge-overnight" title="O atendimento se estende até a manhã do dia seguinte"><i data-lucide="moon" style="width:12px;height:12px;"></i> Turno noturno (+1 dia)</span>` : ''}
            ${day.allDay ? `<span class="badge-allday"><i data-lucide="sun" style="width:12px;height:12px;"></i> 24 Horas</span>` : ''}
            <button type="button" class="btn-day-24h ${day.allDay ? 'active' : ''}" data-day-idx="${idx}" title="Configurar este dia para atender o dia todo">
              ${day.allDay ? 'Definir horário' : '24h'}
            </button>
          ` : `
            <span class="schedule-inactive-label">IA não atende neste dia</span>
          `}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();

  // Attach day listeners
  container.querySelectorAll('.input-day-enable').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.dayIdx, 10);
      agentSchedule.days[idx].enabled = e.target.checked;
      agentSchedule.preset = 'custom';
      updatePresetButtons();
      renderScheduleDays();
      updateLiveStatusBadge();
    });
  });

  container.querySelectorAll('.input-time-start').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.dayIdx, 10);
      agentSchedule.days[idx].start = e.target.value;
      agentSchedule.preset = 'custom';
      updatePresetButtons();
      renderScheduleDays();
      updateLiveStatusBadge();
    });
  });

  container.querySelectorAll('.input-time-end').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.dayIdx, 10);
      agentSchedule.days[idx].end = e.target.value;
      agentSchedule.preset = 'custom';
      updatePresetButtons();
      renderScheduleDays();
      updateLiveStatusBadge();
    });
  });

  container.querySelectorAll('.btn-day-24h').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(btn.dataset.dayIdx, 10);
      const isCurrentlyAllDay = agentSchedule.days[idx].allDay;
      if (isCurrentlyAllDay) {
        agentSchedule.days[idx].allDay = false;
        agentSchedule.days[idx].start = '08:00';
        agentSchedule.days[idx].end = '18:00';
      } else {
        agentSchedule.days[idx].allDay = true;
        agentSchedule.days[idx].start = '00:00';
        agentSchedule.days[idx].end = '23:59';
      }
      agentSchedule.preset = 'custom';
      updatePresetButtons();
      renderScheduleDays();
      updateLiveStatusBadge();
    });
  });
}

function isTimeOvernight(start, end) {
  if (!start || !end) return false;
  return end < start;
}

function applySchedulePreset(presetKey) {
  agentSchedule.preset = presetKey;
  if (presetKey === 'night_weekend') {
    // Seg a Sex: 18h às 08h noturno | Sáb e Dom: 24h
    agentSchedule.days.forEach(day => {
      if (['seg', 'ter', 'qua', 'qui', 'sex'].includes(day.id)) {
        day.enabled = true;
        day.start = '18:00';
        day.end = '08:00';
        day.allDay = false;
      } else {
        day.enabled = true;
        day.start = '00:00';
        day.end = '23:59';
        day.allDay = true;
      }
    });
  } else if (presetKey === 'weekend_only') {
    // Seg a Sex: desativado | Sáb e Dom: 24h
    agentSchedule.days.forEach(day => {
      if (['seg', 'ter', 'qua', 'qui', 'sex'].includes(day.id)) {
        day.enabled = false;
        day.start = '18:00';
        day.end = '08:00';
        day.allDay = false;
      } else {
        day.enabled = true;
        day.start = '00:00';
        day.end = '23:59';
        day.allDay = true;
      }
    });
  } else if (presetKey === 'business_hours') {
    // Seg a Sex: 08:00 às 18:00 | Sáb e Dom: desativado
    agentSchedule.days.forEach(day => {
      if (['seg', 'ter', 'qua', 'qui', 'sex'].includes(day.id)) {
        day.enabled = true;
        day.start = '08:00';
        day.end = '18:00';
        day.allDay = false;
      } else {
        day.enabled = false;
        day.start = '08:00';
        day.end = '18:00';
        day.allDay = false;
      }
    });
  }
  updatePresetButtons();
  renderScheduleDays();
  updateLiveStatusBadge();
  showToast(`Atalho "${getPresetTitle(presetKey)}" aplicado!`);
}

function getPresetTitle(key) {
  if (key === 'night_weekend') return 'Plantão Noturno & Fins de Semana';
  if (key === 'weekend_only') return 'Apenas Fins de Semana';
  if (key === 'business_hours') return 'Horário Comercial';
  return 'Personalizado';
}

function updatePresetButtons() {
  const presetBtns = document.querySelectorAll('.schedule-preset-btn[data-preset]');
  presetBtns.forEach(btn => {
    if (btn.getAttribute('data-preset') === agentSchedule.preset) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function copyMondayToWeekdays() {
  const mon = agentSchedule.days.find(d => d.id === 'seg');
  if (!mon) return;

  agentSchedule.days.forEach(day => {
    if (['ter', 'qua', 'qui', 'sex'].includes(day.id)) {
      day.enabled = mon.enabled;
      day.start = mon.start;
      day.end = mon.end;
      day.allDay = mon.allDay;
    }
  });

  renderScheduleDays();
  updateLiveStatusBadge();
  showToast('Horário de Segunda replicado para Terça a Sexta!');
}

function updateLiveStatusBadge() {
  const badge = document.getElementById('schedule-live-status-badge');
  const text = document.getElementById('schedule-live-status-text');
  if (!badge || !text) return;

  if (!agentSchedule.enabled) {
    badge.className = 'schedule-live-badge online';
    text.textContent = 'IA ativa 24/7 (Sempre online)';
    return;
  }

  const isOnlineNow = checkIsAgentActiveNow();
  if (isOnlineNow) {
    badge.className = 'schedule-live-badge online';
    text.textContent = 'IA em horário de atendimento (Online)';
  } else {
    badge.className = 'schedule-live-badge offline';
    text.textContent = 'IA fora do expediente (Em repouso)';
  }
}

function checkIsAgentActiveNow() {
  if (!agentSchedule.enabled) return true;

  const now = new Date();
  const dayIndex = now.getDay(); // 0 is Dom, 1 is Seg...
  const dayIdMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const todayId = dayIdMap[dayIndex];
  const todayConfig = agentSchedule.days.find(d => d.id === todayId);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  if (todayConfig && todayConfig.enabled) {
    if (todayConfig.allDay) return true;
    const startM = toMinutes(todayConfig.start);
    const endM = toMinutes(todayConfig.end);

    if (startM <= endM) {
      if (currentMinutes >= startM && currentMinutes <= endM) return true;
    } else {
      // Overnight (e.g. 18:00 to 08:00)
      if (currentMinutes >= startM || currentMinutes <= endM) return true;
    }
  }

  // Check if yesterday had an overnight shift that covers early morning today
  const prevDayIndex = (dayIndex + 6) % 7;
  const prevDayId = dayIdMap[prevDayIndex];
  const prevConfig = agentSchedule.days.find(d => d.id === prevDayId);

  if (prevConfig && prevConfig.enabled && !prevConfig.allDay) {
    const pStartM = toMinutes(prevConfig.start);
    const pEndM = toMinutes(prevConfig.end);
    if (pEndM < pStartM) {
      if (currentMinutes <= pEndM) return true;
    }
  }

  return false;
}

function loadAgentSchedule(agentId) {
  const saved = localStorage.getItem(`zapchat_agent_schedule_${agentId}`);
  if (saved) {
    try {
      agentSchedule = JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading agent schedule', e);
    }
  } else {
    // Reset to defaults
    agentSchedule = {
      enabled: false,
      preset: 'night_weekend',
      outOfHoursAction: 'silent',
      outOfHoursMessage: 'Olá! No momento nossa equipe e assistente virtual estão fora do horário de atendimento. Sua mensagem foi recebida com sucesso e responderemos assim que retornarmos!',
      days: JSON.parse(JSON.stringify(DEFAULT_DAYS))
    };
  }

  // Update UI components
  const toggle = document.getElementById('toggle-agent-schedule');
  if (toggle) toggle.checked = agentSchedule.enabled;

  const radioSilent = document.querySelector('input[name="agent_out_action"][value="silent"]');
  const radioReply = document.querySelector('input[name="agent_out_action"][value="auto_reply"]');
  const replyBox = document.getElementById('schedule-auto-reply-box');
  const cardSilent = document.getElementById('label-action-silent');
  const cardReply = document.getElementById('label-action-reply');
  const msgTextarea = document.getElementById('schedule-out-message-text');

  if (agentSchedule.outOfHoursAction === 'auto_reply') {
    if (radioReply) radioReply.checked = true;
    if (replyBox) replyBox.style.display = 'block';
    if (cardReply) cardReply.classList.add('active');
    if (cardSilent) cardSilent.classList.remove('active');
  } else {
    if (radioSilent) radioSilent.checked = true;
    if (replyBox) replyBox.style.display = 'none';
    if (cardSilent) cardSilent.classList.add('active');
    if (cardReply) cardReply.classList.remove('active');
  }

  if (msgTextarea && agentSchedule.outOfHoursMessage) {
    msgTextarea.value = agentSchedule.outOfHoursMessage;
  }

  updateScheduleVisibility();
  updatePresetButtons();
  renderScheduleDays();
  updateLiveStatusBadge();
}

function saveAgentSchedule(agentId) {
  const toggle = document.getElementById('toggle-agent-schedule');
  if (toggle) agentSchedule.enabled = toggle.checked;

  const msgTextarea = document.getElementById('schedule-out-message-text');
  if (msgTextarea) agentSchedule.outOfHoursMessage = msgTextarea.value;

  localStorage.setItem(`zapchat_agent_schedule_${agentId}`, JSON.stringify(agentSchedule));
}

/* ==========================================================================
   AGENT GREETING MESSAGE (MENSAGEM DE SAUDAÇÃO & PERÍODOS)
   ========================================================================== */

let agentGreetingSettings = {
  enabled: true,
  mode: 'fixed', // 'fixed' | 'dynamic'
  message: 'Olá! Seja muito bem-vindo(a). Como posso te ajudar hoje?',
  morning: 'Bom dia! Seja muito bem-vindo(a). Como posso te ajudar hoje?',
  afternoon: 'Boa tarde! Seja muito bem-vindo(a). Como posso te ajudar hoje?',
  night: 'Boa noite! Seja muito bem-vindo(a). Como posso te ajudar hoje?'
};

function setupAgentGreeting() {
  const toggles = [
    document.getElementById('toggle-agent-greeting'),
    document.getElementById('toggle-agent-greeting-config')
  ].filter(Boolean);

  const contents = [
    document.getElementById('agent-greeting-content'),
    document.getElementById('agent-greeting-content-config')
  ].filter(Boolean);

  // Sync Toggles
  toggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      agentGreetingSettings.enabled = toggle.checked;
      toggles.forEach(t => (t.checked = toggle.checked));
      contents.forEach(c => c.classList.toggle('is-disabled', !toggle.checked));
      showToast(toggle.checked ? 'Mensagem de saudação ativada.' : 'Mensagem de saudação desativada.');
    });
  });

  // Sync Mode Pills
  const allModePills = document.querySelectorAll('.greeting-mode-pill');
  allModePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const mode = pill.getAttribute('data-greeting-mode') || 'fixed';
      agentGreetingSettings.mode = mode;
      applyGreetingModeUI(mode);
    });
  });

  // Sync Textareas (Fixed mode)
  const textareas = [
    document.getElementById('agent-greeting-textarea'),
    document.getElementById('agent-greeting-textarea-config')
  ].filter(Boolean);

  const counters = [
    document.getElementById('greeting-char-count'),
    document.getElementById('greeting-char-count-config')
  ].filter(Boolean);

  textareas.forEach(textarea => {
    textarea.addEventListener('input', () => {
      agentGreetingSettings.message = textarea.value;
      textareas.forEach(ta => { if (ta !== textarea) ta.value = textarea.value; });
      counters.forEach(c => (c.textContent = `${textarea.value.length}/500`));
    });
  });

  // Sync Period Inputs
  const morningInputs = [
    document.getElementById('greeting-input-morning'),
    document.getElementById('greeting-input-morning-config')
  ].filter(Boolean);
  morningInputs.forEach(input => {
    input.addEventListener('input', () => {
      agentGreetingSettings.morning = input.value;
      morningInputs.forEach(other => { if (other !== input) other.value = input.value; });
    });
  });

  const afternoonInputs = [
    document.getElementById('greeting-input-afternoon'),
    document.getElementById('greeting-input-afternoon-config')
  ].filter(Boolean);
  afternoonInputs.forEach(input => {
    input.addEventListener('input', () => {
      agentGreetingSettings.afternoon = input.value;
      afternoonInputs.forEach(other => { if (other !== input) other.value = input.value; });
    });
  });

  const nightInputs = [
    document.getElementById('greeting-input-night'),
    document.getElementById('greeting-input-night-config')
  ].filter(Boolean);
  nightInputs.forEach(input => {
    input.addEventListener('input', () => {
      agentGreetingSettings.night = input.value;
      nightInputs.forEach(other => { if (other !== input) other.value = input.value; });
    });
  });

  // Tag Insert Buttons
  document.querySelectorAll('.btn-tag-insert').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (!tag) return;
      textareas.forEach(ta => {
        const start = ta.selectionStart || ta.value.length;
        const end = ta.selectionEnd || ta.value.length;
        const val = ta.value;
        ta.value = val.substring(0, start) + tag + val.substring(end);
        ta.focus();
        ta.setSelectionRange(start + tag.length, start + tag.length);
        agentGreetingSettings.message = ta.value;
      });
      counters.forEach(c => (c.textContent = `${agentGreetingSettings.message.length}/500`));
      showToast(`Tag ${tag} adicionada!`);
    });
  });
}

function applyGreetingModeUI(mode) {
  document.querySelectorAll('.greeting-mode-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-greeting-mode') === mode);
  });

  const fixedBoxes = [
    document.getElementById('greeting-box-fixed-perfil'),
    document.getElementById('greeting-box-fixed-config')
  ].filter(Boolean);

  const dynamicBoxes = [
    document.getElementById('greeting-box-dynamic-perfil'),
    document.getElementById('greeting-box-dynamic-config')
  ].filter(Boolean);

  fixedBoxes.forEach(b => (b.style.display = mode === 'fixed' ? 'block' : 'none'));
  dynamicBoxes.forEach(b => (b.style.display = mode === 'dynamic' ? 'block' : 'none'));

  if (window.lucide) window.lucide.createIcons();
}

function loadAgentGreeting(agentId) {
  const saved = localStorage.getItem(`zapchat_agent_greeting_${agentId}`);
  const agent = zapChatData.agentes?.list?.find(a => a.id === agentId);

  if (saved) {
    try {
      agentGreetingSettings = { ...agentGreetingSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Error loading greeting settings', e);
    }
  } else if (agent && agent.greetingMessage) {
    agentGreetingSettings.enabled = agent.greetingEnabled !== false;
    agentGreetingSettings.message = agent.greetingMessage;
    if (agent.greetingMode) agentGreetingSettings.mode = agent.greetingMode;
    if (agent.greetingMorning) agentGreetingSettings.morning = agent.greetingMorning;
    if (agent.greetingAfternoon) agentGreetingSettings.afternoon = agent.greetingAfternoon;
    if (agent.greetingNight) agentGreetingSettings.night = agent.greetingNight;
  }

  // Update UI Elements
  const toggles = [
    document.getElementById('toggle-agent-greeting'),
    document.getElementById('toggle-agent-greeting-config')
  ].filter(Boolean);
  toggles.forEach(t => (t.checked = agentGreetingSettings.enabled));

  const contents = [
    document.getElementById('agent-greeting-content'),
    document.getElementById('agent-greeting-content-config')
  ].filter(Boolean);
  contents.forEach(c => c.classList.toggle('is-disabled', !agentGreetingSettings.enabled));

  const textareas = [
    document.getElementById('agent-greeting-textarea'),
    document.getElementById('agent-greeting-textarea-config')
  ].filter(Boolean);
  textareas.forEach(ta => (ta.value = agentGreetingSettings.message || ''));

  const counters = [
    document.getElementById('greeting-char-count'),
    document.getElementById('greeting-char-count-config')
  ].filter(Boolean);
  counters.forEach(c => (c.textContent = `${(agentGreetingSettings.message || '').length}/500`));

  const morningInputs = [
    document.getElementById('greeting-input-morning'),
    document.getElementById('greeting-input-morning-config')
  ].filter(Boolean);
  morningInputs.forEach(i => (i.value = agentGreetingSettings.morning || ''));

  const afternoonInputs = [
    document.getElementById('greeting-input-afternoon'),
    document.getElementById('greeting-input-afternoon-config')
  ].filter(Boolean);
  afternoonInputs.forEach(i => (i.value = agentGreetingSettings.afternoon || ''));

  const nightInputs = [
    document.getElementById('greeting-input-night'),
    document.getElementById('greeting-input-night-config')
  ].filter(Boolean);
  nightInputs.forEach(i => (i.value = agentGreetingSettings.night || ''));

  applyGreetingModeUI(agentGreetingSettings.mode || 'fixed');
}

function saveAgentGreeting(agentId) {
  const toggle = document.getElementById('toggle-agent-greeting') || document.getElementById('toggle-agent-greeting-config');
  const textarea = document.getElementById('agent-greeting-textarea') || document.getElementById('agent-greeting-textarea-config');
  const morning = document.getElementById('greeting-input-morning') || document.getElementById('greeting-input-morning-config');
  const afternoon = document.getElementById('greeting-input-afternoon') || document.getElementById('greeting-input-afternoon-config');
  const night = document.getElementById('greeting-input-night') || document.getElementById('greeting-input-night-config');

  if (toggle) agentGreetingSettings.enabled = toggle.checked;
  if (textarea) agentGreetingSettings.message = textarea.value;
  if (morning) agentGreetingSettings.morning = morning.value;
  if (afternoon) agentGreetingSettings.afternoon = afternoon.value;
  if (night) agentGreetingSettings.night = night.value;

  const agent = zapChatData.agentes?.list?.find(a => a.id === agentId);
  if (agent) {
    agent.greetingEnabled = agentGreetingSettings.enabled;
    agent.greetingMode = agentGreetingSettings.mode;
    agent.greetingMessage = agentGreetingSettings.message;
    agent.greetingMorning = agentGreetingSettings.morning;
    agent.greetingAfternoon = agentGreetingSettings.afternoon;
    agent.greetingNight = agentGreetingSettings.night;
  }

  localStorage.setItem(`zapchat_agent_greeting_${agentId}`, JSON.stringify(agentGreetingSettings));
}

/* ==========================================================================
   HUMAN TRANSFER DESTINATION MANAGEMENT (CENTRALIZED & SIMPLIFIED)
   ========================================================================== */

let agentTransferSettings = {
  enabled: true,
  transferTriggers: {
    requested: true,
    sensitive: true,
    notfound: true
  },
  customMessage: 'Aguarde um instante! Estou transferindo seu atendimento para um de nossos especialistas.',
  attachSummary: true
};

function setupAgentHumanTransfer() {
  // 1. Toggle switch "Transferir para humano"
  const toggle = document.getElementById('toggle-agent-transfer-human');
  const configBox = document.getElementById('agent-transfer-config-box');

  if (toggle && configBox) {
    toggle.addEventListener('change', () => {
      agentTransferSettings.enabled = toggle.checked;
      if (toggle.checked) {
        configBox.style.display = 'flex';
        showToast('Transbordo para atendimento humano ativado.');
      } else {
        configBox.style.display = 'none';
        showToast('Transbordo para atendimento humano desativado.');
      }
    });
  }

  // 2. Transfer triggers (centralizados da aba Perfil)
  const trigRequested = document.getElementById('check-transfer-requested');
  const trigSensitive = document.getElementById('check-transfer-sensitive');
  const trigNotfound = document.getElementById('check-transfer-notfound');

  if (trigRequested) {
    trigRequested.addEventListener('change', () => {
      if (!agentTransferSettings.transferTriggers) agentTransferSettings.transferTriggers = {};
      agentTransferSettings.transferTriggers.requested = trigRequested.checked;
    });
  }
  if (trigSensitive) {
    trigSensitive.addEventListener('change', () => {
      if (!agentTransferSettings.transferTriggers) agentTransferSettings.transferTriggers = {};
      agentTransferSettings.transferTriggers.sensitive = trigSensitive.checked;
    });
  }
  if (trigNotfound) {
    trigNotfound.addEventListener('change', () => {
      if (!agentTransferSettings.transferTriggers) agentTransferSettings.transferTriggers = {};
      agentTransferSettings.transferTriggers.notfound = trigNotfound.checked;
    });
  }

  // 3. Custom transfer message
  const msgInput = document.getElementById('transfer-custom-message');
  if (msgInput) {
    msgInput.addEventListener('input', () => {
      agentTransferSettings.customMessage = msgInput.value;
    });
  }

  // 4. Attach conversation summary checkbox
  const optAttach = document.getElementById('transfer-opt-attach-summary');
  if (optAttach) {
    optAttach.addEventListener('change', () => {
      agentTransferSettings.attachSummary = optAttach.checked;
    });
  }
}

function loadAgentTransferSettings(agentId) {
  const saved = localStorage.getItem(`zapchat_agent_transfer_${agentId}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      agentTransferSettings = {
        enabled: parsed.enabled !== false,
        transferTriggers: {
          requested: parsed.transferTriggers?.requested !== false,
          sensitive: parsed.transferTriggers?.sensitive !== false,
          notfound: parsed.transferTriggers?.notfound !== false
        },
        customMessage: parsed.customMessage || 'Aguarde um instante! Estou transferindo seu atendimento para um de nossos especialistas.',
        attachSummary: parsed.attachSummary !== false
      };
    } catch (e) {
      console.warn('Error loading agent transfer settings', e);
    }
  } else {
    agentTransferSettings = {
      enabled: true,
      transferTriggers: {
        requested: true,
        sensitive: true,
        notfound: true
      },
      customMessage: 'Aguarde um instante! Estou transferindo seu atendimento para um de nossos especialistas.',
      attachSummary: true
    };
  }

  // Update Toggle
  const toggle = document.getElementById('toggle-agent-transfer-human');
  const configBox = document.getElementById('agent-transfer-config-box');
  if (toggle) toggle.checked = agentTransferSettings.enabled;
  if (configBox) configBox.style.display = agentTransferSettings.enabled ? 'flex' : 'none';

  // Triggers
  const trigRequested = document.getElementById('check-transfer-requested');
  const trigSensitive = document.getElementById('check-transfer-sensitive');
  const trigNotfound = document.getElementById('check-transfer-notfound');
  if (trigRequested) trigRequested.checked = agentTransferSettings.transferTriggers?.requested !== false;
  if (trigSensitive) trigSensitive.checked = agentTransferSettings.transferTriggers?.sensitive !== false;
  if (trigNotfound) trigNotfound.checked = agentTransferSettings.transferTriggers?.notfound !== false;

  // Custom message
  const msgInput = document.getElementById('transfer-custom-message');
  if (msgInput && agentTransferSettings.customMessage) {
    msgInput.value = agentTransferSettings.customMessage;
  }

  // Summary
  const optAttach = document.getElementById('transfer-opt-attach-summary');
  if (optAttach) optAttach.checked = agentTransferSettings.attachSummary !== false;
}

function saveAgentTransferSettings(agentId) {
  const toggle = document.getElementById('toggle-agent-transfer-human');
  if (toggle) agentTransferSettings.enabled = toggle.checked;

  const trigRequested = document.getElementById('check-transfer-requested');
  const trigSensitive = document.getElementById('check-transfer-sensitive');
  const trigNotfound = document.getElementById('check-transfer-notfound');
  agentTransferSettings.transferTriggers = {
    requested: trigRequested ? trigRequested.checked : true,
    sensitive: trigSensitive ? trigSensitive.checked : true,
    notfound: trigNotfound ? trigNotfound.checked : true
  };

  const msgInput = document.getElementById('transfer-custom-message');
  if (msgInput) agentTransferSettings.customMessage = msgInput.value;

  const optAttach = document.getElementById('transfer-opt-attach-summary');
  if (optAttach) agentTransferSettings.attachSummary = optAttach.checked;

  localStorage.setItem(`zapchat_agent_transfer_${agentId}`, JSON.stringify(agentTransferSettings));
}

/**
 * Update UI controls for agent active / paused status across all views:
 * - Configurações tab (master card, toggle switch, banner, action button)
 * - Sidebar profile (status badge pill, quick pause button, avatar dot)
 * - Header action bar (toggle button)
 */
export function updateAgentStatusDisplay(agent) {
  if (!agent) {
    agent = zapChatData.agentes.list.find(a => a.id === currentAgentId) || zapChatData.agentes.list[0];
  }
  if (!agent) return;

  const isActive = agent.status === 'Ativo';

  // 1. Sidebar status badge & avatar dot
  const statusBadge = document.getElementById('edit-agent-status-badge');
  const avatarStatusDot = document.querySelector('.agent-avatar-status-dot');
  const sidebarQuickBtn = document.getElementById('btn-sidebar-quick-pause');
  const sidebarQuickIcon = document.getElementById('sidebar-quick-pause-icon');
  const sidebarQuickText = document.getElementById('sidebar-quick-pause-text');

  if (statusBadge) {
    if (isActive) {
      statusBadge.className = 'badge badge-dot badge-active agent-sidebar-status-pill is-active';
      statusBadge.textContent = 'IA ativa';
      statusBadge.title = 'Status: IA ativa — Clique para alternar';
    } else {
      statusBadge.className = 'badge badge-dot badge-paused agent-sidebar-status-pill is-paused';
      statusBadge.textContent = 'Pausado';
      statusBadge.title = 'Status: Pausado — Clique para alternar';
    }
  }

  if (avatarStatusDot) {
    if (isActive) {
      avatarStatusDot.classList.remove('paused');
      avatarStatusDot.title = 'Online';
    } else {
      avatarStatusDot.classList.add('paused');
      avatarStatusDot.title = 'Pausado';
    }
  }

  if (sidebarQuickBtn) {
    if (isActive) {
      sidebarQuickBtn.className = 'agent-sidebar-switcher is-active';
      sidebarQuickBtn.setAttribute('role', 'switch');
      sidebarQuickBtn.setAttribute('aria-checked', 'true');
      sidebarQuickBtn.title = 'Status: Ativo — Clique para pausar';
      if (sidebarQuickIcon) sidebarQuickIcon.setAttribute('data-lucide', 'pause');
      if (sidebarQuickText) sidebarQuickText.textContent = 'Pausar';
    } else {
      sidebarQuickBtn.className = 'agent-sidebar-switcher is-paused';
      sidebarQuickBtn.setAttribute('role', 'switch');
      sidebarQuickBtn.setAttribute('aria-checked', 'false');
      sidebarQuickBtn.title = 'Status: Pausado — Clique para ativar';
      if (sidebarQuickIcon) sidebarQuickIcon.setAttribute('data-lucide', 'play');
      if (sidebarQuickText) sidebarQuickText.textContent = 'Ativar';
    }
  }

  // 2. Top Header status button
  const headerBtn = document.getElementById('btn-header-toggle-agent-status');
  const headerIcon = document.getElementById('header-status-icon');
  const headerText = document.getElementById('header-status-text');

  if (headerBtn) {
    if (isActive) {
      headerBtn.className = 'btn btn-outline-status btn-sm is-active';
      headerBtn.title = 'Pausar respostas automáticas deste agente';
      if (headerIcon) headerIcon.setAttribute('data-lucide', 'pause-circle');
      if (headerText) headerText.textContent = 'Pausar agente';
    } else {
      headerBtn.className = 'btn btn-outline-status btn-sm is-paused';
      headerBtn.title = 'Reativar atendimento automático deste agente';
      if (headerIcon) headerIcon.setAttribute('data-lucide', 'play-circle');
      if (headerText) headerText.textContent = 'Ativar agente';
    }
  }

  // 3. Configurações Tab Master Status Card
  const masterCard = document.getElementById('card-agent-status-control');
  const configToggle = document.getElementById('toggle-agent-status-master');
  const configBadge = document.getElementById('config-agent-status-badge');
  const configIconBox = document.getElementById('agent-status-icon-box');
  const configCardIcon = document.getElementById('agent-status-card-icon');
  const configBtn = document.getElementById('btn-config-toggle-agent-status');
  const configBtnIcon = document.getElementById('btn-config-status-icon');
  const configBtnText = document.getElementById('btn-config-status-text');
  const callout = document.getElementById('agent-status-callout');
  const calloutIcon = document.getElementById('agent-status-callout-icon');
  const calloutHeading = document.getElementById('agent-status-callout-heading');
  const calloutText = document.getElementById('agent-status-callout-text');

  if (masterCard) {
    if (isActive) {
      masterCard.classList.remove('is-paused');
    } else {
      masterCard.classList.add('is-paused');
    }
  }

  if (configToggle) {
    configToggle.checked = isActive;
  }

  if (configBadge) {
    configBadge.className = isActive ? 'badge badge-dot badge-active' : 'badge badge-dot badge-paused';
    configBadge.textContent = isActive ? 'IA ativa' : 'Pausado';
  }

  if (configIconBox) {
    configIconBox.className = isActive ? 'agent-status-avatar-icon active' : 'agent-status-avatar-icon paused';
    if (configCardIcon) {
      configCardIcon.setAttribute('data-lucide', isActive ? 'power' : 'pause');
    }
  }

  if (configBtn) {
    if (isActive) {
      configBtn.className = 'btn-status-pill-toggle';
      if (configBtnIcon) configBtnIcon.setAttribute('data-lucide', 'pause-circle');
      if (configBtnText) configBtnText.textContent = 'Pausar agente';
    } else {
      configBtn.className = 'btn-status-pill-toggle btn-status-activate';
      if (configBtnIcon) configBtnIcon.setAttribute('data-lucide', 'play-circle');
      if (configBtnText) configBtnText.textContent = 'Ativar agente';
    }
  }

  if (callout) {
    callout.className = isActive ? 'agent-status-callout active' : 'agent-status-callout paused';
  }

  if (calloutIcon) {
    calloutIcon.innerHTML = isActive 
      ? '<i data-lucide="check-circle-2" style="width: 17px; height: 17px;"></i>' 
      : '<i data-lucide="alert-triangle" style="width: 17px; height: 17px;"></i>';
  }

  if (calloutHeading) {
    calloutHeading.textContent = isActive 
      ? 'Agente em operação normal' 
      : 'Atendimento automático pausado';
  }

  if (calloutText) {
    calloutText.innerHTML = isActive
      ? `O assistente <strong>${agent.name}</strong> está ativo e responderá os clientes normalmente nos canais vinculados.`
      : `O assistente <strong>${agent.name}</strong> está pausado. Nenhuma mensagem automática será enviada pela IA e os clientes aguardarão atendimento humano.`;
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Toggle active / paused status for the currently edited agent
 */
export function toggleCurrentAgentStatus() {
  const agent = zapChatData.agentes.list.find(a => a.id === currentAgentId) || zapChatData.agentes.list[0];
  if (!agent) return;

  if (agent.status === 'Ativo') {
    agent.status = 'Pausado';
    agent.statusType = 'paused';
    showToast(`Agente "${agent.name}" foi pausado.`);
  } else {
    agent.status = 'Ativo';
    agent.statusType = 'active';
    showToast(`Agente "${agent.name}" ativado com sucesso!`);
  }

  updateAgentStatusDisplay(agent);

  if (window.refreshAgentsTable) {
    window.refreshAgentsTable();
  }
}

/**
 * Setup event listeners for agent status controls
 */
function setupAgentStatusToggle() {
  // 1. Sidebar badge click
  const statusBadge = document.getElementById('edit-agent-status-badge');
  if (statusBadge) {
    statusBadge.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCurrentAgentStatus();
    });
  }

  // 2. Sidebar quick pause button
  const sidebarQuickBtn = document.getElementById('btn-sidebar-quick-pause');
  if (sidebarQuickBtn) {
    sidebarQuickBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCurrentAgentStatus();
    });
  }

  // 3. Header toggle button
  const headerBtn = document.getElementById('btn-header-toggle-agent-status');
  if (headerBtn) {
    headerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCurrentAgentStatus();
    });
  }

  // 4. Config tab button
  const configBtn = document.getElementById('btn-config-toggle-agent-status');
  if (configBtn) {
    configBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCurrentAgentStatus();
    });
  }

  // 5. Config tab iOS switch
  const configToggle = document.getElementById('toggle-agent-status-master');
  if (configToggle) {
    configToggle.addEventListener('change', () => {
      const agent = zapChatData.agentes.list.find(a => a.id === currentAgentId) || zapChatData.agentes.list[0];
      if (!agent) return;

      const shouldBeActive = configToggle.checked;
      if (shouldBeActive && agent.status !== 'Ativo') {
        agent.status = 'Ativo';
        agent.statusType = 'active';
        showToast(`Agente "${agent.name}" ativado com sucesso!`);
      } else if (!shouldBeActive && agent.status === 'Ativo') {
        agent.status = 'Pausado';
        agent.statusType = 'paused';
        showToast(`Agente "${agent.name}" foi pausado.`);
      }

      updateAgentStatusDisplay(agent);

      if (window.refreshAgentsTable) {
        window.refreshAgentsTable();
      }
    });
  }
}

