export const zapChatData = {
  // 1. Dashboard Data (Simplified)
  dashboard: {
    statusBadge: {
      connected: true,
      text: 'WhatsApp conectado — IA ativa'
    },
    kpis: [
      {
        id: 'conversas_atendidas',
        title: 'Conversas atendidas',
        value: '128',
        trend: '↑ 18% vs. período anterior',
        trendType: 'up',
        icon: 'message-square'
      },
      {
        id: 'resolvidas_ia',
        title: 'Resolvidas pela IA',
        value: '87,6%',
        trend: '↑ 12% vs. período anterior',
        trendType: 'up',
        icon: 'bot'
      },
      {
        id: 'novos_contatos',
        title: 'Novos contatos',
        value: '32',
        trend: '↑ 24% vs. período anterior',
        trendType: 'up',
        icon: 'user-plus'
      },
      {
        id: 'transferidas_humano',
        title: 'Transferidas para humano',
        value: '14',
        trend: '↓ 7% vs. período anterior',
        trendType: 'down',
        icon: 'headphones'
      }
    ],
    conversasChart: {
      labels: ['29/08', '30/08', '31/08', '01/09', '02/09', '03/09', '04/09'],
      values: [68, 105, 128, 148, 128, 110, 92]
    },
    planUsage: {
      percent: 49,
      used: '4.900',
      total: '10.000',
      text: '4.900 / 10.000 conversas utilizadas'
    },
    seusAgentes: [
      {
        name: 'Pedro',
        initials: 'P',
        bg: '#EAF8F1',
        color: '#00A868',
        status: 'Online',
        statusType: 'online',
        conversas: 48
      },
      {
        name: 'Atendente Loja',
        initials: 'AL',
        bg: '#F3E8FF',
        color: '#7C3AED',
        status: 'Online',
        statusType: 'online',
        conversas: 36
      },
      {
        name: 'Suporte IA',
        initials: 'IA',
        bg: '#F5F3FF',
        color: '#8B5CF6',
        status: 'IA ativa',
        statusType: 'active',
        conversas: 44
      }
    ],
    conversasRecentes: [
      {
        name: 'Juliana Santos',
        initials: 'JS',
        bg: '#EAF8F1',
        color: '#00A868',
        preview: 'Quero saber mais sobre o produto.',
        time: '11:24',
        channel: 'WhatsApp'
      },
      {
        name: 'Carlos Souza',
        initials: 'CS',
        bg: '#EFF6FF',
        color: '#2563EB',
        preview: 'Meu pedido ainda não chegou.',
        time: '10:47',
        channel: 'WhatsApp'
      },
      {
        name: 'Mariana Lima',
        initials: 'ML',
        bg: '#F3E8FF',
        color: '#7C3AED',
        preview: 'Preciso alterar meu endereço de entrega.',
        time: '09:15',
        channel: 'WhatsApp'
      },
      {
        name: 'Rafael Ferreira',
        initials: 'RF',
        bg: '#FEF3C7',
        color: '#D97706',
        preview: 'Qual o horário de funcionamento da loja?',
        time: 'Ontem',
        channel: 'WhatsApp'
      }
    ]
  },

  // 2. Agentes Data
  agentes: {
    kpis: [
      { title: 'Agentes ativos', value: '4', sub: 'de 6 criados', icon: 'users', color: 'green' },
      { title: 'Conversas hoje', value: '256', trend: '↗ 18% vs. ontem', trendType: 'up', icon: 'message-square', color: 'green' },
      { title: 'Taxa de resolução', value: '87,6%', trend: '↗ 6,3% vs. ontem', trendType: 'up', icon: 'check-circle', color: 'green' },
      { title: 'Transferências para humano', value: '14', trend: '↘ 8% vs. ontem', trendType: 'down', icon: 'headphones', color: 'green' }
    ],
    list: [
      {
        id: 'pedro',
        name: 'Pedro',
        role: 'Atendimento geral',
        channel: 'WhatsApp',
        status: 'Ativo',
        statusType: 'active',
        conversas: '86',
        conversasTrend: '↑ 12%',
        avatarBg: '#E9F7F1',
        avatarColor: '#00A868'
      },
      {
        id: 'atendente_loja',
        name: 'Atendente Loja',
        role: 'Suporte comercial',
        channel: 'WhatsApp',
        status: 'Ativo',
        statusType: 'active',
        conversas: '78',
        conversasTrend: '↑ 8%',
        avatarBg: '#F3E8FF',
        avatarColor: '#7C3AED'
      },
      {
        id: 'suporte_ia',
        name: 'Suporte IA',
        role: 'Suporte técnico',
        channel: 'WhatsApp',
        status: 'Ativo',
        statusType: 'active',
        conversas: '52',
        conversasTrend: '↑ 15%',
        avatarBg: '#EFF6FF',
        avatarColor: '#2563EB'
      },
      {
        id: 'qualificacao_leads',
        name: 'Qualificação Leads',
        role: 'Qualifica e direciona',
        channel: 'Instagram',
        status: 'Em teste',
        statusType: 'testing',
        conversas: '40',
        conversasTrend: '↑ 6%',
        avatarBg: '#FEF3C7',
        avatarColor: '#D97706'
      }
    ],
    performanceHistory: [
      { date: '21/05', conversas: 90, resolvidas: 75, transferencias: 15 },
      { date: '22/05', conversas: 110, resolvidas: 92, transferencias: 18 },
      { date: '23/05', conversas: 140, resolvidas: 122, transferencias: 18 },
      { date: '24/05', conversas: 130, resolvidas: 114, transferencias: 16 },
      { date: '25/05', conversas: 125, resolvidas: 108, transferencias: 17 },
      { date: '26/05', conversas: 115, resolvidas: 102, transferencias: 13 },
      { date: '27/05', conversas: 135, resolvidas: 121, transferencias: 14 }
    ],
    ultimasInteracoes: [
      {
        agent: 'Pedro',
        user: 'João Silva',
        text: 'Claro! Posso te ajudar com o rastreamento.',
        channel: 'WhatsApp',
        time: 'Hoje, 10:32',
        icon: 'whatsapp',
        iconBg: '#25D366'
      },
      {
        agent: 'Atendente Loja',
        user: 'Ana Clara',
        text: 'O pedido já foi enviado e está a caminho.',
        channel: 'Instagram',
        time: 'Hoje, 09:58',
        icon: 'instagram',
        iconBg: '#E1306C'
      },
      {
        agent: 'Qualificação Leads',
        user: 'novo lead',
        text: 'Lead qualificado: Interesse em Plano Pro',
        channel: 'Widget',
        time: 'Hoje, 09:41',
        icon: 'globe',
        iconBg: '#7C3AED'
      },
      {
        agent: 'Suporte IA',
        user: 'chamado #7842',
        text: 'Dúvida sobre integração com API resolvida',
        channel: 'Telegram',
        time: 'Hoje, 08:47',
        icon: 'send',
        iconBg: '#0088CC'
      }
    ]
  },

  // 3. Leads Data
  leads: {
    kpis: [
      { title: 'Leads totais', value: '1.248', trend: '↗ 18% vs. ontem', trendType: 'up', icon: 'users', color: 'green' },
      { title: 'Novos hoje', value: '86', trend: '↗ 22% vs. ontem', trendType: 'up', icon: 'user-plus', color: 'green' },
      { title: 'Qualificados', value: '412', trend: '↗ 16% vs. ontem', trendType: 'up', icon: 'award', color: 'green' },
      { title: 'Taxa de conversão', value: '23,4%', trend: '↗ 6,2% vs. ontem', trendType: 'up', icon: 'trending-up', color: 'green' }
    ],
    list: [
      {
        id: 'rafael_carvalho',
        name: 'Rafael Carvalho',
        initials: 'RC',
        phone: '+55 11 98765-4321',
        email: 'rafael.carvalho@email.com',
        channel: 'WhatsApp',
        status: 'Novo',
        statusKey: 'novo',
        score: 72,
        scoreLevel: 'Alto',
        agentName: 'Juliana Santos',
        agentImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        lastContact: '2 min atrás',
        primaryInterest: 'Plano Pro',
        interests: ['Plano Pro', 'Automação de atendimento'],
        tags: ['Interessado - Pro', 'Lead quente'],
        nextAction: { text: 'Follow-up por WhatsApp', time: 'Hoje às 14:00' },
        notes: 'Cliente demonstrou interesse em relatórios avançados e integração com CRM.'
      },
      {
        id: 'amanda_moreira',
        name: 'Amanda Moreira',
        initials: 'AM',
        phone: '+55 11 97654-3210',
        email: 'amanda.moreira@email.com',
        channel: 'Instagram',
        status: 'Em atendimento',
        statusKey: 'atendimento',
        score: 58,
        scoreLevel: 'Médio',
        agentName: 'Felipe Costa',
        agentImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        lastContact: '15 min atrás',
        primaryInterest: 'Plano Business',
        interests: ['Integração com Loja', 'Catálogo WhatsApp'],
        tags: ['E-commerce', 'Potencial'],
        nextAction: { text: 'Enviar demonstração gravada', time: 'Amanhã às 10:00' },
        notes: 'Dúvidas sobre volume de disparos simultâneos.'
      },
      {
        id: 'lucas_gomes',
        name: 'Lucas Gomes',
        initials: 'LG',
        phone: '+55 11 96543-2109',
        email: 'lucas.gomes@email.com',
        channel: 'Site',
        status: 'Qualificado',
        statusKey: 'qualificado',
        score: 85,
        scoreLevel: 'Alto',
        agentName: 'Carla Menezes',
        agentImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        lastContact: '1 h atrás',
        primaryInterest: 'Plano Enterprise',
        interests: ['Plano Enterprise', 'API dedicada'],
        tags: ['Enterprise', 'Lead quente', 'Urgente'],
        nextAction: { text: 'Apresentação de proposta técnica', time: 'Hoje às 16:30' },
        notes: 'Precisa de SLA de 99.9% e canal dedicado no Telegram.'
      },
      {
        id: 'beatriz_pacheco',
        name: 'Beatriz Pacheco',
        initials: 'BP',
        phone: '+55 11 95432-1058',
        email: 'beatriz.pacheco@email.com',
        channel: 'Facebook',
        status: 'Em atendimento',
        statusKey: 'atendimento',
        score: 48,
        scoreLevel: 'Médio',
        agentName: 'Rodrigo Almeida',
        agentImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        lastContact: '3 h atrás',
        primaryInterest: 'Plano Starter',
        interests: ['Plano Starter'],
        tags: ['Pequena Empresa'],
        nextAction: { text: 'Verificar resposta do e-mail comercial', time: 'Amanhã às 11:00' },
        notes: 'Aguardando validação da diretoria financeira.'
      },
      {
        id: 'victor_souza',
        name: 'Victor Souza',
        initials: 'VS',
        phone: '+55 11 94321-0987',
        email: 'victor.souza@email.com',
        channel: 'WhatsApp',
        status: 'Qualificado',
        statusKey: 'qualificado',
        score: 91,
        scoreLevel: 'Alto',
        agentName: 'Juliana Santos',
        agentImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        lastContact: '5 h atrás',
        primaryInterest: 'Plano Pro',
        interests: ['Automação 24/7', 'Múltiplos Atendentes'],
        tags: ['Lead quente', 'Alta prioridade'],
        nextAction: { text: 'Agendar call de onboarding', time: 'Hoje às 17:00' },
        notes: 'Pronto para fechar contrato anual com desconto.'
      },
      {
        id: 'thais_helena',
        name: 'Thais Helena',
        initials: 'TH',
        phone: '+55 11 93210-9876',
        email: 'thais.helena@email.com',
        channel: 'Instagram',
        status: 'Fechado',
        statusKey: 'fechado',
        score: 35,
        scoreLevel: 'Baixo',
        agentName: 'Felipe Costa',
        agentImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        lastContact: '1 dia atrás',
        primaryInterest: 'Plano Starter',
        interests: ['Consultoria IA'],
        tags: ['Iniciante'],
        nextAction: { text: 'Enviar material educativo', time: 'Sexta-feira' },
        notes: 'Ainda em estágio inicial de maturidade digital.'
      }
    ],
    pipeline: [
      { name: 'Novo lead', count: '448', trend: '↑ 12%', icon: 'message-circle', color: '#2563EB' },
      { name: 'Qualificação', count: '312', trend: '↑ 18%', icon: 'filter', color: '#3B82F6' },
      { name: 'Proposta', count: '278', trend: '↑ 15%', icon: 'file-text', color: '#7C3AED' },
      { name: 'Fechamento', count: '152', trend: '↑ 22%', icon: 'briefcase', color: '#10B981' },
      { name: 'Fechado', count: '58', trend: '↑ 25%', icon: 'thumbs-up', color: '#00A868' }
    ]
  },

  // 4. Canais Data (Simplified)
  canais: {
    list: [
      {
        id: 'loja_download',
        name: 'Loja Download',
        channelType: 'whatsapp',
        iconType: 'whatsapp',
        agentName: 'Pedro',
        agentType: 'photo',
        agentImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        identifier: '+55 11 98765-4321',
        department: 'Geral',
        status: 'Conectado',
        statusType: 'active'
      },
      {
        id: 'site_principal',
        name: 'Site principal',
        channelType: 'widget',
        iconType: 'widget',
        agentName: 'SDR IA',
        agentType: 'initials',
        agentInitials: 'SI',
        agentBg: '#EAF8F1',
        agentColor: '#00A868',
        identifier: 'widget.zapchat.app/site-principal',
        department: 'Comercial',
        status: 'Ativo',
        statusType: 'active'
      },
      {
        id: 'instagram_loja',
        name: 'Instagram Loja',
        channelType: 'instagram',
        iconType: 'instagram',
        agentName: 'Atendimento',
        agentType: 'initials',
        agentInitials: 'AT',
        agentBg: '#F3E8FF',
        agentColor: '#7C3AED',
        identifier: '@lojadownload',
        department: 'Vendas',
        status: 'Em breve',
        statusType: 'testing'
      },
      {
        id: 'clinica_vida',
        name: 'Clínica Vida',
        channelType: 'whatsapp',
        iconType: 'whatsapp',
        agentName: 'Suporte IA',
        agentType: 'initials',
        agentInitials: 'SI',
        agentBg: '#EFF6FF',
        agentColor: '#2563EB',
        identifier: '+55 21 99888-7766',
        department: 'Suporte',
        status: 'Conectado',
        statusType: 'active'
      }
    ]
  },

  // 5. Conversas Data
  conversas: {
    kpis: [
      { title: 'Conversas abertas', value: '54', trend: '↗ 18% vs. ontem', trendType: 'up', icon: 'message-square', color: 'green' },
      { title: 'Em atendimento', value: '22', trend: '↗ 15% vs. ontem', trendType: 'up', icon: 'users', color: 'green' },
      { title: 'Resolvidas hoje', value: '128', trend: '↗ 22% vs. ontem', trendType: 'up', icon: 'check-circle', color: 'green' },
      { title: 'Tempo médio de resposta', value: '1m 36s', trend: '↘ 8% vs. ontem', trendType: 'up', icon: 'clock', color: 'green' }
    ],
    threads: [
      {
        id: 'juliana_santos',
        name: 'Juliana Santos',
        channel: 'WhatsApp',
        time: '10:42',
        unread: 1,
        active: true,
        img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        snippet: 'Olá! Tenho interesse no plano Pro.',
        customerSince: 'Cliente desde Jan/2024',
        customerId: 'ID: 55021',
        phone: '+55 11 98765-4321',
        email: 'juliana.santos@email.com',
        origin: 'WhatsApp',
        originTime: '10:40 • Hoje',
        assignedAgent: 'Pedro',
        attendingStatus: 'IA atendendo',
        isAiAttending: true,
        tags: ['Interessado - Pro', 'Lead quente'],
        status: 'Em atendimento',
        aiSummary: [
          'Cliente demonstrou interesse no plano Pro.',
          'Perguntou sobre os principais benefícios do plano.',
          'Solicitou o valor mensal.',
          'Solicitou o link para teste grátis por 7 dias.'
        ],
        messages: [
          {
            sender: 'user',
            text: 'Olá! Tenho interesse no plano Pro. Quais são os principais benefícios?',
            time: '10:40'
          },
          {
            sender: 'bot',
            text: 'Olá, Juliana! 👋\nO plano Pro inclui atendimentos com IA avançada, integrações ilimitadas e relatórios completos.\nPosso te enviar mais detalhes e o link para teste grátis?',
            time: '10:41'
          },
          {
            sender: 'user',
            text: 'Perfeito! Qual o valor mensal?',
            time: '10:41'
          },
          {
            sender: 'bot',
            text: 'O plano Pro custa R$ 149,90/mês.\nPosso te enviar o link para teste grátis por 7 dias?',
            time: '10:42'
          }
        ]
      },
      {
        id: 'rodrigo_almeida',
        name: 'Rodrigo Almeida',
        channel: 'WhatsApp',
        time: '10:35',
        unread: 0,
        active: false,
        img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        snippet: 'Vocês integram com o RD Station?',
        customerSince: 'Cliente novo',
        customerId: 'ID: 55018',
        phone: '+55 21 99887-1122',
        email: 'rodrigo.almeida@email.com',
        origin: 'WhatsApp',
        originTime: '10:30 • Hoje',
        assignedAgent: 'Pedro',
        attendingStatus: 'IA atendendo',
        isAiAttending: true,
        tags: ['CRM', 'RD Station'],
        status: 'Em atendimento',
        aiSummary: [
          'Dúvidas sobre integração com RD Station CRM',
          'Aguardando envio do webhook de teste'
        ],
        messages: [
          { sender: 'user', text: 'Bom dia! Vocês integram com o RD Station?', time: '10:35' },
          { sender: 'bot', text: 'Olá Rodrigo! Sim, integramos nativamente com o RD Station para envio de leads e eventos de conversão.', time: '10:35' }
        ]
      },
      {
        id: 'carla_menezes',
        name: 'Carla Menezes',
        channel: 'Instagram',
        time: '10:18',
        unread: 2,
        active: false,
        img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        snippet: 'Qual o prazo de entrega do setup?',
        customerSince: 'Cliente desde Nov/2023',
        customerId: 'ID: 54980',
        phone: '+55 31 98877-6655',
        email: 'carla.m@email.com',
        origin: 'Instagram',
        originTime: '10:15 • Hoje',
        assignedAgent: 'Pedro',
        attendingStatus: 'IA atendendo',
        isAiAttending: true,
        tags: ['Setup', 'Prazo'],
        status: 'Em atendimento',
        aiSummary: ['Dúvida sobre prazo de ativação do agente no WhatsApp.'],
        messages: [
          { sender: 'user', text: 'Qual o prazo de entrega do setup?', time: '10:18' },
          { sender: 'bot', text: 'Olá Carla! Nosso onboarding guiado leva menos de 15 minutos e seu agente já fica 100% operacional!', time: '10:19' }
        ]
      },
      {
        id: 'carla_menezes',
        name: 'Carla Menezes',
        channel: 'WhatsApp',
        time: '10:18',
        unread: 0,
        active: false,
        img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        snippet: 'Qual o prazo de entrega do meu pedido?',
        customerSince: 'Cliente desde Nov/2023',
        customerId: 'ID: 54980',
        phone: '+55 31 98877-6655',
        email: 'carla.m@email.com',
        origin: 'WhatsApp Business',
        originTime: '10:15 • Hoje',
        assignedAgent: 'Pedro',
        tags: ['Pós-venda', 'Rastreio'],
        status: 'Resolvido',
        aiSummary: [
          'Consulta de rastreamento de pedido #4392',
          'Código de rastreio e prazo informados com sucesso'
        ],
        messages: [
          { sender: 'user', text: 'Olá, qual o prazo de entrega do meu pedido #4392?', time: '10:18' },
          { sender: 'bot', text: 'Olá Carla! Seu pedido está em rota de entrega e deve chegar até amanhã às 18h!', time: '10:19' }
        ]
      },
      {
        id: 'felipe_costa',
        name: 'Felipe Costa',
        channel: 'Widget',
        time: '09:56',
        unread: 3,
        active: false,
        img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        snippet: 'Preciso de ajuda para configurar o bot.',
        customerSince: 'Cliente novo',
        customerId: 'ID: 55002',
        phone: '+55 41 97766-5544',
        email: 'felipe.c@email.com',
        origin: 'Widget do Site',
        originTime: '09:50 • Hoje',
        assignedAgent: 'Suporte IA',
        tags: ['Setup', 'Ajuda Técnica'],
        status: 'Em andamento',
        aiSummary: ['Dúvidas no upload do documento da base de conhecimento.'],
        messages: [
          { sender: 'user', text: 'Preciso de ajuda para configurar o bot no meu site.', time: '09:56' },
          { sender: 'bot', text: 'Claro! Você pode adicionar o script do widget direto no cabeçalho do seu HTML ou via Google Tag Manager.', time: '09:57' }
        ]
      },
      {
        id: 'beatriz_lima',
        name: 'Beatriz Lima',
        channel: 'Instagram',
        time: '09:41',
        unread: 0,
        active: false,
        img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        snippet: 'Ainda disponível o cupom?',
        customerSince: 'Cliente desde Jan/2024',
        customerId: 'ID: 54890',
        phone: '+55 11 96655-4433',
        email: 'beatriz.lima@email.com',
        origin: 'Instagram',
        originTime: '09:40 • Hoje',
        assignedAgent: 'Atendente Loja',
        tags: ['Promoção', 'Cupom'],
        status: 'Resolvido',
        aiSummary: ['Cupom BEMVINDO10 enviado e utilizado.'],
        messages: [
          { sender: 'user', text: 'Ainda disponível o cupom de primeira compra?', time: '09:41' },
          { sender: 'bot', text: 'Sim Beatriz! Use o cupom ZAP10 para 10% de desconto na primeira fatura.', time: '09:41' }
        ]
      },
      {
        id: 'gustavo_nogueira',
        name: 'Gustavo Nogueira',
        channel: 'WhatsApp',
        time: '09:20',
        unread: 0,
        active: false,
        img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
        snippet: 'Quero cancelar minha assinatura.',
        customerSince: 'Cliente desde Mar/2023',
        customerId: 'ID: 52140',
        phone: '+55 19 95544-3322',
        email: 'gustavo.n@email.com',
        origin: 'WhatsApp Business',
        originTime: '09:15 • Hoje',
        assignedAgent: 'Juliana Silva',
        tags: ['Retenção', 'Cancelamento'],
        status: 'Em atendimento',
        aiSummary: ['Cliente solicitou cancelamento. Transmitido para equipe de retenção com proposta especial.'],
        messages: [
          { sender: 'user', text: 'Quero cancelar minha assinatura.', time: '09:20' },
          { sender: 'bot', text: 'Sentimos muito por isso Gustavo. Estou direcionando você para um de nossos especialistas para entender melhor como podemos ajudar.', time: '09:21' }
        ]
      },
      {
        id: 'mariana_rocha',
        name: 'Mariana Rocha',
        channel: 'Widget',
        time: 'Ontem',
        unread: 0,
        active: false,
        img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        snippet: 'Consegui resolver, obrigado!',
        customerSince: 'Cliente desde Dez/2023',
        customerId: 'ID: 53900',
        phone: '+55 48 94433-2211',
        email: 'mariana.rocha@email.com',
        origin: 'Widget do site',
        originTime: 'Ontem às 17:40',
        assignedAgent: 'Pedro',
        tags: ['Suporte', 'Resolvido'],
        status: 'Resolvido',
        aiSummary: ['Problema com redefinição de senha solucionado.'],
        messages: [
          { sender: 'user', text: 'Consegui resolver, obrigado!', time: 'Ontem 17:40' },
          { sender: 'bot', text: 'Que ótima notícia Mariana! Conte conosco sempre que precisar. Tenha um excelente dia! 🚀', time: 'Ontem 17:41' }
        ]
      }
    ]
  }
};
