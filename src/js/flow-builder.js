import { zapChatData } from './data.js';

let currentBot = null;
let selectedNodeId = null;
let selectedCableId = null;

// Canvas Pan & Zoom State
let panX = 60;
let panY = 60;
let zoom = 1;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let isSpacePressed = false;
let panRafId = null;

// Node Dragging State
let isDraggingNode = false;
let draggedNodeId = null;
let dragStartX = 0;
let dragStartY = 0;
let nodeStartX = 0;
let nodeStartY = 0;
let nodeDragRafId = null;

// Port Wire Connection State
let isConnectingPort = false;
let connectingSource = null; // { nodeId, portId, portType, x, y }

// Cache of Port relative offsets to avoid getBoundingClientRect layout thrashing
// Key: `${nodeId}_${portId}` => { dx, dy }
let portOffsetCache = {};

/**
 * Open Visual Flow Builder Studio for a specific bot
 */
export function openFlowBuilder(botId) {
  const bot = zapChatData.chatbots.list.find(b => b.id === botId);
  if (!bot) return;

  currentBot = bot;
  window.getCurrentFlowBot = () => currentBot;
  ensureCanvasFlowData(bot);

  // Switch view to chatbot-builder only if not already on it
  const activePanel = document.querySelector('.view-panel.active');
  if (activePanel?.id !== 'view-chatbot-builder' && window.switchView) {
    window.switchView('chatbot-builder');
  }

  // Render Studio Topbar
  renderBuilderTopbar();

  // Reset Canvas View
  resetCanvasView();

  // Render Nodes
  renderCanvasNodes();

  // Setup interactions once
  setupBuilderInteractions();

  // Measure port offsets and render SVG cables
  requestAnimationFrame(() => {
    if (window.lucide) window.lucide.createIcons();
    cachePortOffsets();
    renderAllCables();
  });
}

/**
 * Ensure bot has canvasFlow structure
 */
function ensureCanvasFlowData(bot) {
  if (bot.canvasFlow && bot.canvasFlow.nodes && bot.canvasFlow.nodes.length > 0) {
    return;
  }

  if (bot.id === 'bot-2') {
    bot.canvasFlow = {
      nodes: [
        {
          id: 'node-start',
          type: 'start',
          title: 'Bloco Inicial',
          x: 60,
          y: 200,
          data: {
            subtitle: 'Entrada por mensagem direta no Instagram com palavras-chave.',
            trigger: 'Palavra-chave: "preço" ou "orçamento"',
            channel: 'Instagram'
          }
        },
        {
          id: 'node-menu',
          type: 'menu',
          title: 'Menu',
          executions: 0,
          clickRate: '0%',
          x: 400,
          y: 160,
          data: {
            format: 'list_button',
            question: 'Opa, tudo bem? Vi que tem interesse em transformar o atendimento do seu negócio! Qual é o seu segmento?',
            message: 'Opa, tudo bem? Vi que tem interesse em transformar o atendimento do seu negócio! Qual é o seu segmento?',
            buttonTitle: 'VER OPÇÕES',
            invalidMessage: 'Opção inválida. Por favor, escolha um dos números acima.',
            maxErrors: 3,
            timeoutDays: '1',
            options: [
              { id: 'opt-2-1', label: 'E-commerce / Varejo', description: 'Vendas online e lojas virtuais', ctr: 'CTR 0%' },
              { id: 'opt-2-2', label: 'Serviços / Consultório', description: 'Atendimento e agendamentos', ctr: 'CTR 0%' }
            ]
          }
        },
        {
          id: 'node-ai-felipe',
          type: 'ai_agent',
          title: 'Agente de IA Vendas',
          agentName: 'Felipe Costa',
          executions: 520,
          x: 780,
          y: 60,
          data: {
            method: 'Agente de IA Conversacional',
            instructions: 'Qualifique o dono do e-commerce pelo ticket médio e apresente os planos Pro com foco em retorno sobre investimento.',
            branches: [
              { id: 'b-success', label: 'Lead Pronto para Fechar', ctr: '78%' },
              { id: 'b-human', label: 'Transbordo Comercial', ctr: '22%' }
            ]
          }
        },
        {
          id: 'node-ai-carla',
          type: 'ai_agent',
          title: 'Agente de IA Triagem',
          agentName: 'Carla Menezes',
          executions: 340,
          x: 780,
          y: 360,
          data: {
            method: 'Agente de IA Conversacional',
            instructions: 'Apresente como a IA agenda consultas 24/7 automaticamente e envia lembretes para evitar no-show.',
            branches: [
              { id: 'b-success', label: 'Demonstração Agendada', ctr: '85%' },
              { id: 'b-human', label: 'Dúvidas Específicas', ctr: '15%' }
            ]
          }
        },
        {
          id: 'node-action-crm',
          type: 'action',
          title: 'Ação CRM',
          actionType: 'crm_deal',
          actionLabel: 'Mover lead para Proposta',
          targetPerson: 'Equipe Instagram',
          x: 1220,
          y: 200,
          data: { description: 'Registra oportunidade qualificada' }
        }
      ],
      connections: [
        { id: 'c-2-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-menu', toPort: 'in' },
        { id: 'c-2-2', fromNode: 'node-menu', fromPort: 'opt-2-1', toNode: 'node-ai-felipe', toPort: 'in' },
        { id: 'c-2-3', fromNode: 'node-menu', fromPort: 'opt-2-2', toNode: 'node-ai-carla', toPort: 'in' },
        { id: 'c-2-4', fromNode: 'node-ai-felipe', fromPort: 'b-success', toNode: 'node-action-crm', toPort: 'in' },
        { id: 'c-2-5', fromNode: 'node-ai-carla', fromPort: 'b-success', toNode: 'node-action-crm', toPort: 'in' }
      ]
    };
    return;
  }

  // Default flow matching BotConversa reference image exactly
  const primaryAgent = (bot.integratedAiAgents && bot.integratedAiAgents[0]) || 'Juliana Santos';

  bot.canvasFlow = {
    nodes: [
      {
        id: 'node-start',
        type: 'start',
        title: 'Bloco Inicial',
        x: 40,
        y: 200,
        data: {
          subtitle: 'Seu fluxo começa por este bloco. Conecte-o com outro bloco.',
          trigger: bot.trigger || 'Primeira mensagem recebida',
          channel: bot.channel || 'WhatsApp'
        }
      },
      {
        id: 'node-conteudo',
        type: 'message',
        title: 'Conteúdo',
        x: 340,
        y: 160,
        data: {
          items: [
            {
              id: 'item-demo-1',
              type: 'text',
              text: 'Olá {nome}! Seja muito bem-vindo ao nosso atendimento.',
              saved: true
            },
            {
              id: 'item-demo-2',
              type: 'delay',
              seconds: 2,
              typing: true
            },
            {
              id: 'item-demo-3',
              type: 'text',
              text: 'Nosso time preparou condições especiais para você hoje. O que você gostaria de ver?',
              saved: true
            }
          ]
        }
      },
      {
        id: 'node-ai-main',
        type: 'ai_agent',
        title: 'Agente de IA',
        agentName: primaryAgent,
        agentRole: 'Especialista Virtual ZapChat',
        executions: bot.executions || 1240,
        x: 700,
        y: 120,
        data: {
          method: 'Agente de IA Conversacional',
          instructions: `Você é o Assistente Virtual do ZapChat. Seu objetivo é resolver dúvidas, demonstrar planos e qualificar o contato.`,
          branches: [
            { id: 'b-inactivity', label: 'Inatividade (30 min)', ctr: '0%', targetNodeId: 'node-action-restart' },
            { id: 'b-success', label: 'Resposta bem-sucedida', ctr: '82%', targetNodeId: 'node-action-crm' },
            { id: 'b-human', label: 'Solicitação de atendente', ctr: '12%', targetNodeId: 'node-action-human' },
            { id: 'b-stop', label: 'Condição de parada', ctr: '6%', targetNodeId: null }
          ]
        }
      },
      {
        id: 'node-action-restart',
        type: 'action',
        title: 'Transferir Atendimento',
        actionType: 'transfer',
        actionLabel: 'Transferir atendimento',
        transferType: 'queue',
        transferTarget: 'Fila Geral (Triagem Automática)',
        x: 1080,
        y: 60,
        data: {
          description: 'Encaminha para fila geral'
        }
      },
      {
        id: 'node-action-crm',
        type: 'action',
        title: 'Transferir Atendimento',
        actionType: 'transfer',
        actionLabel: 'Transferir atendimento',
        transferType: 'human',
        transferTarget: 'Carlos Félix',
        x: 1080,
        y: 260,
        data: {
          description: 'Transfere para atendente humano'
        }
      },
      {
        id: 'node-action-human',
        type: 'human',
        title: 'Fila Humana',
        actionType: 'transfer_human',
        actionLabel: 'Fila de Atendimento Humano',
        targetPerson: 'Equipe Comercial',
        x: 1080,
        y: 440,
        data: {
          description: 'Transfere conversa para operador humano disponível'
        }
      }
    ],
    connections: [
      { id: 'c-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-conteudo', toPort: 'in' },
      { id: 'c-2', fromNode: 'node-conteudo', fromPort: 'out', toNode: 'node-ai-main', toPort: 'in' },
      { id: 'c-3', fromNode: 'node-ai-main', fromPort: 'b-inactivity', toNode: 'node-action-restart', toPort: 'in' },
      { id: 'c-4', fromNode: 'node-ai-main', fromPort: 'b-success', toNode: 'node-action-crm', toPort: 'in' },
      { id: 'c-5', fromNode: 'node-ai-main', fromPort: 'b-human', toNode: 'node-action-human', toPort: 'in' }
    ]
  };
}

/**
 * Render Topbar Info
 */
function renderBuilderTopbar() {
  const nameEl = document.getElementById('builder-bot-name');
  const inputEl = document.getElementById('builder-bot-name-input');
  const wrapper = document.getElementById('builder-title-wrapper');
  const channelBadgeEl = document.getElementById('builder-channel-badge');
  const statusBadgeEl = document.getElementById('builder-status-badge');

  if (nameEl) nameEl.textContent = currentBot.name;
  if (inputEl) inputEl.value = currentBot.name;
  if (wrapper) wrapper.classList.remove('is-editing');

  if (channelBadgeEl) {
    const isWa = currentBot.channel === 'WhatsApp';
    channelBadgeEl.className = `chatbot-channel-badge ${isWa ? 'whatsapp' : 'instagram'}`;
    channelBadgeEl.innerHTML = isWa
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="#00A868"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg> <span>WhatsApp</span>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> <span>Instagram</span>`;
  }

  if (statusBadgeEl) {
    const isActive = currentBot.status === 'Ativo';
    statusBadgeEl.className = `builder-status-badge ${isActive ? 'active' : 'paused'}`;
    statusBadgeEl.textContent = currentBot.status;
  }
}

/**
 * Reset Canvas viewport position and scale
 */
function resetCanvasView() {
  panX = 60;
  panY = 60;
  zoom = 1;
  applyCanvasTransform();
}

/**
 * Hardware-accelerated Canvas Transform
 */
function applyCanvasTransform() {
  const worldEl = document.getElementById('builder-canvas-world');
  const zoomTextEl = document.getElementById('builder-zoom-level');
  if (worldEl) {
    worldEl.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
  }
  if (zoomTextEl) {
    zoomTextEl.textContent = `${Math.round(zoom * 100)}%`;
  }
}

/**
 * Cache port relative offsets (dx, dy) inside each node
 * Measures precise port circle centers in world coordinates
 */
function cachePortOffsets() {
  portOffsetCache = {};
  if (!currentBot) return;

  const worldEl = document.getElementById('builder-canvas-world');
  if (!worldEl) return;
  const worldRect = worldEl.getBoundingClientRect();

  currentBot.canvasFlow.nodes.forEach(node => {
    const nodeEl = document.getElementById(`canvas-node-${node.id}`);
    if (!nodeEl) return;

    const ports = nodeEl.querySelectorAll('.node-port');
    ports.forEach(port => {
      const portId = port.getAttribute('data-port-id');
      const portRect = port.getBoundingClientRect();

      // Exact center of the port circle in world coordinates (unscaled by zoom)
      const portCenterX = (portRect.left + portRect.width / 2 - worldRect.left) / zoom;
      const portCenterY = (portRect.top + portRect.height / 2 - worldRect.top) / zoom;

      portOffsetCache[`${node.id}_${portId}`] = {
        dx: Math.round(portCenterX - node.x),
        dy: Math.round(portCenterY - node.y)
      };
    });
  });
}

/**
 * Render all nodes in the canvas
 */
export function renderCanvasNodes() {
  const container = document.getElementById('builder-nodes-container');
  if (!container || !currentBot) return;

  container.innerHTML = '';

  currentBot.canvasFlow.nodes.forEach(node => {
    const nodeEl = createNodeElement(node);
    container.appendChild(nodeEl);
  });

  cachePortOffsets();
}

/**
 * Normalize AI Agent branches so generic "Condição X" labels become intuitive
 */
function normalizeAiAgentBranches(branches) {
  const smartDefaults = [
    { triggerType: 'goal_reached', label: 'Atendimento concluído pela IA' },
    { triggerType: 'human_handoff', label: 'Pediu atendente humano' },
    { triggerType: 'custom_intent', label: 'Cliente quer fechar / Orçamento' },
    { triggerType: 'inactivity', label: 'Cliente parou de responder' }
  ];

  return branches.map((b, idx) => {
    const rawLabel = (b.label || '').trim();
    const isGeneric = /^condi[çc][aã]o\s*\d*$/i.test(rawLabel) || !rawLabel;
    const fallback = smartDefaults[idx % smartDefaults.length];

    if (isGeneric) {
      b.label = fallback.label;
      b.triggerType = b.triggerType || fallback.triggerType;
    } else if (!b.triggerType) {
      const lower = rawLabel.toLowerCase();
      if (lower.includes('humano') || lower.includes('atendente') || lower.includes('transbordo')) {
        b.triggerType = 'human_handoff';
      } else if (lower.includes('inativ') || lower.includes('parou') || lower.includes('tempo') || lower.includes('min')) {
        b.triggerType = 'inactivity';
      } else if (lower.includes('fechar') || lower.includes('proposta') || lower.includes('agend') || lower.includes('orçamento')) {
        b.triggerType = 'custom_intent';
      } else {
        b.triggerType = 'goal_reached';
      }
    }
    return b;
  });
}

function getBranchTriggerMeta(triggerType) {
  const map = {
    goal_reached: { icon: 'check-circle-2', color: '#00A868', badge: 'Concluído', hint: 'Quando a IA responder tudo e concluir o objetivo' },
    human_handoff: { icon: 'user-check', color: '#EC4899', badge: 'Humano', hint: 'Quando o cliente pedir uma pessoa ou a IA não souber responder' },
    custom_intent: { icon: 'sparkles', color: '#8B5CF6', badge: 'Intenção', hint: 'Quando a IA identificar um interesse específico na conversa' },
    inactivity: { icon: 'clock', color: '#F59E0B', badge: 'Ausência', hint: 'Quando o cliente ficar sem responder pelo tempo limite' }
  };
  return map[triggerType] || map.custom_intent;
}
/**
 * Create HTML element for a node
 */
function createNodeElement(node) {
  const el = document.createElement('div');
  el.className = `flow-canvas-node node-${node.type} ${selectedNodeId === node.id ? 'selected' : ''}`;
  el.id = `canvas-node-${node.id}`;
  el.setAttribute('data-node-id', node.id);
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;

  let contentHtml = '';

  if (node.type === 'start') {
    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-header">
          <div class="node-header-icon start">
            <i data-lucide="rocket" style="width: 14px; height: 14px;"></i>
          </div>
          <span class="node-header-title">${node.title || 'Bloco Inicial'}</span>
        </div>
        <div class="node-body">
          <p class="node-desc">${node.data?.subtitle || 'Seu fluxo começa por este bloco. Conecte-o com outro bloco.'}</p>
        </div>
        <div class="node-port port-out" data-node-id="${node.id}" data-port-id="out" data-port-type="out" title="Conectar ao próximo bloco">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>
      </div>
    `;
  } else if (node.type === 'ai_agent') {
    if (!node.data) node.data = {};
    if (!node.data.branches || node.data.branches.length === 0) {
      node.data.branches = [
        { id: 'b-success', triggerType: 'goal_reached', label: 'Atendimento concluído pela IA' },
        { id: 'b-human', triggerType: 'human_handoff', label: 'Pediu atendente humano' },
        { id: 'b-inactivity', triggerType: 'inactivity', label: 'Cliente parou de responder' }
      ];
    }
    const branches = normalizeAiAgentBranches(node.data.branches);

    const agentName = node.agentName || node.title || 'Agente de IA';
    const agentsList = zapChatData?.agentes?.list || [];
    const matchedAgent = agentsList.find(a => a.name === agentName || a.id === node.agentId);

    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon ai">
            <i data-lucide="bot" style="width: 14px; height: 14px;"></i>
          </div>
          <div class="node-header-title-wrap">
            <span class="node-header-title">${agentName}</span>
            <span class="node-header-badge">IA Conversacional 24/7</span>
          </div>
        </div>

        <div class="node-body">
          <div class="node-meta-block">
            <span class="node-meta-label">Agente responsável pelo atendimento</span>
            <p class="node-instructions-preview" style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
              <strong style="color:var(--text-main);">${agentName}</strong>
              <span style="font-size:10px; color:var(--text-muted);">${matchedAgent ? matchedAgent.role : 'Ativo'}</span>
            </p>
          </div>

          <div class="node-branches-section-label">
            <span>Caminhos de saída (Quando avançar):</span>
          </div>

          <div class="node-branches-list">
            ${branches.map(b => {
              const meta = getBranchTriggerMeta(b.triggerType);
              const conn = currentBot?.canvasFlow?.connections?.find(c => c.fromNode === node.id && c.fromPort === b.id);
              const targetNode = conn ? currentBot?.canvasFlow?.nodes?.find(n => n.id === conn.toNode) : null;
              return `
                <div class="node-branch-item">
                  <div class="node-branch-left">
                    <i data-lucide="${meta.icon}" style="width: 12px; height: 12px; color: ${meta.color}; flex-shrink: 0;"></i>
                    <span class="branch-label">${b.label}</span>
                  </div>
                  <span class="branch-target-pill ${targetNode ? 'connected' : ''}" title="${targetNode ? `Conectado a: ${targetNode.title}` : 'Arraste o ponto ao lado para conectar'}">
                    ${targetNode ? targetNode.title : 'Conectar →'}
                  </span>
                  <div class="node-port port-out-branch" data-node-id="${node.id}" data-port-id="${b.id}" data-port-type="out" title="Arraste para conectar a saída: ${b.label}">
                    <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (node.type === 'action') {
    const isFinish = node.actionType === 'finish';
    const label = node.actionLabel || (isFinish ? 'Finalizar atendimento' : 'Transferir atendimento');
    const target = isFinish ? 'Encerrar conversa' : (node.transferTarget || node.targetPerson || '');
    const iconName = isFinish ? 'check-circle-2' : 'corner-up-right';
    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon action">
            <i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i>
          </div>
          <span class="node-header-title">${node.title || (isFinish ? 'Finalizar Atendimento' : 'Ação')}</span>
        </div>

        <div class="node-body">
          <div class="node-action-card">
            <span>${label}</span>
            ${target ? `<strong class="node-target-tag">${target}</strong>` : ''}
          </div>
        </div>

        <div class="node-port port-out" data-node-id="${node.id}" data-port-id="out" data-port-type="out" title="Próximo passo">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>
      </div>
    `;
  } else if (node.type === 'menu') {
    const format = node.data?.format || 'list_button';
    const questionText = node.data?.question || node.data?.message || 'Texto da pergunta';
    const buttonTitle = node.data?.buttonTitle || 'VER OPÇÕES';
    const invalidText = node.data?.invalidMessage || 'Opção inválida. Por favor, escolha um dos números acima.';
    const maxErrors = node.data?.maxErrors || 3;
    const options = node.data?.options || [
      { id: 'opt-1', label: 'Resposta 1', ctr: 'CTR 0%' }
    ];

    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon menu" style="background: rgba(0, 168, 104, 0.1); color: var(--primary);">
            <i data-lucide="layout-grid" style="width: 14px; height: 14px;"></i>
          </div>
          <div class="node-header-title-wrap">
            <span class="node-header-title">${node.title || 'Menu'}</span>
            <span class="node-header-badge">${format === 'list_button' ? 'Botão de Lista' : 'Numérico'}</span>
          </div>
        </div>

        <div class="node-body">
          <!-- Métricas de Envio / Clique -->
          <div class="node-menu-stats-bar">
            <div class="node-menu-stat-item">
              <span class="node-menu-stat-val">${node.executions || 0}</span>
              <span class="node-menu-stat-lbl">Enviado</span>
            </div>
            <div class="node-menu-stat-item">
              <span class="node-menu-stat-val">${node.clickRate || '0%'}</span>
              <span class="node-menu-stat-lbl">Clicada</span>
            </div>
          </div>

          <div class="node-menu-text-preview">${questionText}</div>

          ${format === 'list_button' ? `
            <div class="node-menu-btn-name">
              <span>Nome da lista de botões:</span><br>
              <strong>${buttonTitle}</strong>
            </div>
          ` : `
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:6px;">
              <span>Entrada inválida: <em>${invalidText.substring(0, 28)}...</em></span><br>
              <span>Saída de erro: limite <strong>${maxErrors} tentativas</strong></span>
            </div>
          `}

          <div class="node-branches-list">
            ${options.map((opt, i) => `
              <div class="node-branch-item">
                <span class="branch-label">${format === 'number' ? `${i + 1}. ` : ''}${opt.label}</span>
                <span class="branch-ctr">${opt.ctr || 'CTR 0%'}</span>
                <div class="node-port port-out-branch" data-node-id="${node.id}" data-port-id="${opt.id}" data-port-type="out" title="Conectar opção: ${opt.label}">
                  <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
                </div>
              </div>
            `).join('')}

            <!-- Saída por Inatividade / Se usuário não responder -->
            <div class="node-branch-item node-menu-timeout-branch">
              <span style="font-size:10px; color:var(--text-muted);">Se usuário não responder</span>
              <div class="node-port port-out-branch" data-node-id="${node.id}" data-port-id="timeout" data-port-type="out" title="Conectar se usuário não responder">
                <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (node.type === 'message') {
    const items = node.data?.items || (node.data?.text ? [{ type: 'text', text: node.data.text }] : []);
    let previewHtml = '';

    if (items.length === 0) {
      previewHtml = `<div class="node-message-bubble empty" style="color:var(--text-muted); font-style:italic;">Clique para adicionar mensagens...</div>`;
    } else {
      previewHtml = items.map(item => {
        if (item.type === 'text') {
          return `<div class="node-message-bubble">${item.text || 'Mensagem de texto'}</div>`;
        } else if (item.type === 'image') {
          return `
            <div class="node-media-preview image">
              <i data-lucide="image" style="width: 12px; height: 12px;"></i>
              <span>${item.caption || item.fileName || 'Imagem anexada'}</span>
            </div>
          `;
        } else if (item.type === 'video') {
          return `
            <div class="node-media-preview video">
              <i data-lucide="video" style="width: 12px; height: 12px;"></i>
              <span>${item.caption || item.fileName || 'Vídeo MP4'}</span>
            </div>
          `;
        } else if (item.type === 'file') {
          return `
            <div class="node-media-preview file">
              <i data-lucide="file-text" style="width: 12px; height: 12px;"></i>
              <span>${item.fileName || 'Documento / Arquivo'}</span>
            </div>
          `;
        } else if (item.type === 'audio') {
          return `
            <div class="node-media-preview audio">
              <i data-lucide="volume-2" style="width: 12px; height: 12px;"></i>
              <span>${item.fileName || 'Mensagem de voz'}</span>
            </div>
          `;
        } else if (item.type === 'delay') {
          return `
            <div class="node-media-preview delay">
              <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
              <span>Aguardar ${item.seconds || 3}s (Digitando...)</span>
            </div>
          `;
        } else if (item.type === 'link') {
          return `
            <div class="node-media-preview link">
              <i data-lucide="link" style="width: 12px; height: 12px;"></i>
              <span>${item.buttonText || item.url || 'Link / Botão'}</span>
            </div>
          `;
        } else if (item.type === 'location') {
          return `
            <div class="node-media-preview location">
              <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
              <span>${item.locationName || item.address || 'Localização'}</span>
            </div>
          `;
        } else if (item.type === 'contact') {
          return `
            <div class="node-media-preview contact">
              <i data-lucide="user-check" style="width: 12px; height: 12px;"></i>
              <span>${item.contactName || item.contactPhone || 'Cartão de Contato'}</span>
            </div>
          `;
        }
        return '';
      }).join('');
    }

    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon message" style="background: rgba(0, 168, 104, 0.1); color: var(--primary);">
            <i data-lucide="star" style="width: 14px; height: 14px; fill: var(--primary); color: var(--primary);"></i>
          </div>
          <div class="node-header-title-wrap">
            <span class="node-header-title">${node.title || 'Conteúdo'}</span>
            <span class="node-header-badge">${items.length} ${items.length === 1 ? 'item' : 'itens'}</span>
          </div>
        </div>

        <div class="node-body">
          <div class="node-content-items-stack">
            ${previewHtml}
          </div>
        </div>

        <div class="node-port port-out" data-node-id="${node.id}" data-port-id="out" data-port-type="out" title="Próximo passo">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>
      </div>
    `;
  } else if (node.type === 'human') {
    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon human">
            <i data-lucide="users" style="width: 14px; height: 14px;"></i>
          </div>
          <span class="node-header-title">${node.title || 'Fila Humana'}</span>
        </div>

        <div class="node-body">
          <div class="node-action-card">
            <span>Transferir para Atendente</span>
            <strong class="node-target-tag">${node.targetPerson || 'Equipe Geral'}</strong>
          </div>
        </div>

        <div class="node-port port-out" data-node-id="${node.id}" data-port-id="out" data-port-type="out" title="Próximo passo">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>
      </div>
    `;
  } else if (node.type === 'delay') {
    const delayVal = node.data?.value || 2;
    const delayUnit = node.data?.unit || 'minutos';
    const delayType = node.data?.delayType || 'wait';
    const isTyping = delayType === 'typing';
    const isRecording = delayType === 'recording';

    let displayLabel = `Aguardar ${delayVal} ${delayUnit}`;
    let iconName = 'clock';
    if (isTyping) {
      displayLabel = `✍️ Digitando (${delayVal}s)`;
      iconName = 'message-circle';
    } else if (isRecording) {
      displayLabel = `🎙️ Gravando áudio (${delayVal}s)`;
      iconName = 'mic';
    }

    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon delay">
            <i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i>
          </div>
          <span class="node-header-title">${node.title || 'Atraso Inteligente'}</span>
        </div>

        <div class="node-body">
          <div class="node-delay-card">
            <div class="delay-icon-pulse">
              <i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i>
            </div>
            <div class="delay-card-info">
              <strong class="delay-card-value">${displayLabel}</strong>
              <span class="delay-card-sub">${node.data?.respectBusinessHours ? '🕒 Horário comercial' : '⚡ Pausa no fluxo'}</span>
            </div>
          </div>
        </div>

        <div class="node-port port-out" data-node-id="${node.id}" data-port-id="out" data-port-type="out" title="Próximo passo">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>
      </div>
    `;
  } else {
    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in"><i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i></div>
        <div class="node-header"><span class="node-header-title">${node.title}</span></div>
        <div class="node-body"><p class="node-desc">${node.data?.description || 'Bloco personalizado'}</p></div>
        <div class="node-port port-out" data-node-id="${node.id}" data-port-id="out" data-port-type="out"><i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i></div>
      </div>
    `;
  }

  el.innerHTML = contentHtml;
  return el;
}

/**
 * Get port coordinates in canvas world coordinate space
 * Uses cached offsets for 60fps performance!
 */
function getPortWorldCoords(nodeId, portId) {
  const node = currentBot.canvasFlow.nodes.find(n => n.id === nodeId);
  if (!node) return null;

  const key = `${nodeId}_${portId}`;
  let offset = portOffsetCache[key];

  if (!offset) {
    // If not cached, dynamically measure from DOM
    const portEl = document.querySelector(`#canvas-node-${nodeId} .node-port[data-port-id="${portId}"]`);
    const worldEl = document.getElementById('builder-canvas-world');
    if (portEl && worldEl) {
      const portRect = portEl.getBoundingClientRect();
      const worldRect = worldEl.getBoundingClientRect();
      const portCenterX = (portRect.left + portRect.width / 2 - worldRect.left) / zoom;
      const portCenterY = (portRect.top + portRect.height / 2 - worldRect.top) / zoom;
      offset = {
        dx: Math.round(portCenterX - node.x),
        dy: Math.round(portCenterY - node.y)
      };
      portOffsetCache[key] = offset;
    } else {
      const nodeEl = document.getElementById(`canvas-node-${nodeId}`);
      const width = nodeEl ? nodeEl.offsetWidth : 280;
      const height = nodeEl ? nodeEl.offsetHeight : 120;
      const isOut = portId !== 'in';
      offset = {
        dx: isOut ? width : 0,
        dy: Math.round(height / 2)
      };
    }
  }

  return {
    x: Math.round(node.x + offset.dx),
    y: Math.round(node.y + offset.dy)
  };
}

/**
 * Compute Bezier Path String
 */
function getBezierPathData(x1, y1, x2, y2) {
  const dx = Math.max(45, Math.abs(x2 - x1) * 0.55);
  const cx1 = x1 + dx;
  const cy1 = y1;
  const cx2 = x2 - dx;
  const cy2 = y2;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

/**
 * Select a cable connection
 */
function selectCable(connId) {
  selectedCableId = connId;

  // Deselect node if any
  if (selectedNodeId) {
    document.querySelectorAll('.flow-canvas-node.selected').forEach(el => el.classList.remove('selected'));
    selectedNodeId = null;
  }

  // Update visual state of all cable groups
  document.querySelectorAll('.builder-cable-group').forEach(grp => {
    const isThis = grp.getAttribute('data-conn-id') === connId;
    if (isThis) {
      grp.classList.add('selected');
      const badge = grp.querySelector('.builder-cable-badge');
      if (badge) badge.style.display = 'block';
    } else {
      grp.classList.remove('selected');
      const badge = grp.querySelector('.builder-cable-badge');
      if (badge) badge.style.display = 'none';
    }
  });

  if (window.showToast) {
    window.showToast('Linha selecionada. Pressione Delete ou dê 2 cliques para excluir.');
  }
}

/**
 * Deselect any active cable
 */
function deselectCable() {
  if (!selectedCableId) return;
  selectedCableId = null;
  document.querySelectorAll('.builder-cable-group.selected').forEach(grp => {
    grp.classList.remove('selected');
    const badge = grp.querySelector('.builder-cable-badge');
    if (badge) badge.style.display = 'none';
  });
}

/**
 * Render all SVG cables (initial / full rebuild)
 */
export function renderAllCables() {
  const group = document.getElementById('builder-connections-group');
  if (!group || !currentBot) return;

  group.innerHTML = '';

  currentBot.canvasFlow.connections.forEach(conn => {
    const p1 = getPortWorldCoords(conn.fromNode, conn.fromPort);
    const p2 = getPortWorldCoords(conn.toNode, conn.toPort);
    if (!p1 || !p2) return;

    const pathData = getBezierPathData(p1.x, p1.y, p2.x, p2.y);

    const dx = Math.max(45, Math.abs(p2.x - p1.x) * 0.55);
    const cx1 = p1.x + dx;
    const cy1 = p1.y;
    const cx2 = p2.x - dx;
    const cy2 = p2.y;
    const midX = 0.125 * p1.x + 0.375 * cx1 + 0.375 * cx2 + 0.125 * p2.x;
    const midY = 0.125 * p1.y + 0.375 * cy1 + 0.375 * cy2 + 0.125 * p2.y;

    const sourceNode = currentBot.canvasFlow.nodes.find(n => n.id === conn.fromNode);
    const cableType = sourceNode ? sourceNode.type : 'default';

    const groupEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    groupEl.setAttribute('class', `builder-cable-group ${selectedCableId === conn.id ? 'selected' : ''}`);
    groupEl.setAttribute('id', `cable-group-${conn.id}`);
    groupEl.setAttribute('data-conn-id', conn.id);

    // Thick hitarea path (22px) for effortless clicking & double-clicking
    const hitEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitEl.setAttribute('class', 'builder-cable-hitarea');
    hitEl.setAttribute('id', `cable-hit-${conn.id}`);
    hitEl.setAttribute('d', pathData);

    // Visible styled cable path
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('class', `builder-cable ${cableType}`);
    pathEl.setAttribute('id', `cable-line-${conn.id}`);
    pathEl.setAttribute('d', pathData);

    // Midpoint delete badge (circle with ✕)
    const badgeEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badgeEl.setAttribute('class', 'builder-cable-badge');
    badgeEl.setAttribute('id', `cable-badge-${conn.id}`);
    badgeEl.setAttribute('transform', `translate(${midX}, ${midY})`);
    badgeEl.style.display = selectedCableId === conn.id ? 'block' : 'none';
    badgeEl.innerHTML = `
      <circle r="10" fill="#EF4444" stroke="#ffffff" stroke-width="2" />
      <text fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" dominant-baseline="central">✕</text>
    `;

    // Append order: pathEl first (bottom), hitEl second (top hitarea), badgeEl last (front badge)
    groupEl.appendChild(pathEl);
    groupEl.appendChild(hitEl);
    groupEl.appendChild(badgeEl);

    const onCableSelect = (e) => {
      e.stopPropagation();
      selectCable(conn.id);
    };

    const onCableDelete = (e) => {
      e.stopPropagation();
      e.preventDefault();
      deleteConnection(conn.id);
    };

    // Prevent canvas pan on cable pointerdown
    hitEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });

    // Single click: select the line
    hitEl.addEventListener('click', onCableSelect);

    // Double click: delete the line immediately!
    hitEl.addEventListener('dblclick', onCableDelete);

    // Badge click: delete the line
    badgeEl.addEventListener('click', onCableDelete);

    group.appendChild(groupEl);
  });
}

export const drawAllCables = renderAllCables;

/**
 * High-performance incremental cable update for a single moving node
 */
function updateCablesForNode(nodeId) {
  if (!currentBot) return;

  currentBot.canvasFlow.connections.forEach(conn => {
    if (conn.fromNode === nodeId || conn.toNode === nodeId) {
      const p1 = getPortWorldCoords(conn.fromNode, conn.fromPort);
      const p2 = getPortWorldCoords(conn.toNode, conn.toPort);
      if (!p1 || !p2) return;

      const pathData = getBezierPathData(p1.x, p1.y, p2.x, p2.y);
      const hitEl = document.getElementById(`cable-hit-${conn.id}`);
      const lineEl = document.getElementById(`cable-line-${conn.id}`);
      const badgeEl = document.getElementById(`cable-badge-${conn.id}`);

      if (hitEl) hitEl.setAttribute('d', pathData);
      if (lineEl) lineEl.setAttribute('d', pathData);

      if (badgeEl) {
        const dx = Math.max(45, Math.abs(p2.x - p1.x) * 0.55);
        const cx1 = p1.x + dx;
        const cy1 = p1.y;
        const cx2 = p2.x - dx;
        const cy2 = p2.y;
        const midX = 0.125 * p1.x + 0.375 * cx1 + 0.375 * cx2 + 0.125 * p2.x;
        const midY = 0.125 * p1.y + 0.375 * cy1 + 0.375 * cy2 + 0.125 * p2.y;
        badgeEl.setAttribute('transform', `translate(${midX}, ${midY})`);
      }
    }
  });
}

/**
 * Delete connection
 */
function deleteConnection(connId) {
  if (!currentBot) return;
  const idx = currentBot.canvasFlow.connections.findIndex(c => c.id === connId);
  if (idx !== -1) {
    currentBot.canvasFlow.connections.splice(idx, 1);
    const grp = document.getElementById(`cable-group-${connId}`);
    if (grp) grp.remove();
    if (selectedCableId === connId) selectedCableId = null;
    if (window.showToast) window.showToast('Linha de conexão excluída com sucesso!');
  }
}

/**
 * Setup Event Listeners for Canvas, Nodes, Trackpad, Keyboard & Dock
 */
function setupBuilderInteractions() {
  const viewport = document.getElementById('builder-canvas-viewport');
  if (!viewport || viewport._builderSetupDone) return;
  viewport._builderSetupDone = true;

  // 1. Natural Mac Trackpad (2-finger pan & pinch-zoom) and Mouse Wheel
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom / Ctrl+wheel zoom anchored at mouse cursor
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      const newZoom = Math.min(2.0, Math.max(0.4, zoom * zoomFactor));

      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust pan so the point under cursor remains fixed
      panX = mouseX - (mouseX - panX) * (newZoom / zoom);
      panY = mouseY - (mouseY - panY) * (newZoom / zoom);
      zoom = newZoom;
    } else {
      // 2-finger swipe pan
      panX -= e.deltaX;
      panY -= e.deltaY;
    }

    applyCanvasTransform();
  }, { passive: false });

  // 2. Spacebar Key Listener & Delete/Backspace to delete selected cable
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (document.activeElement?.isContentEditable) return;

    if (e.code === 'Space' && !isSpacePressed) {
      isSpacePressed = true;
      viewport.style.cursor = 'grab';
    }

    // Delete or Backspace key to delete selected cable
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedCableId) {
        e.preventDefault();
        deleteConnection(selectedCableId);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      isSpacePressed = false;
      if (!isPanning) viewport.style.cursor = 'default';
    }
  });

  // 3. Viewport Pointerdown (Pan canvas & deselect cable)
  viewport.addEventListener('pointerdown', (e) => {
    // Deselect cable if clicked away
    if (!e.target.closest('.builder-cable-group')) {
      deselectCable();
    }

    // If clicked on cable, node, dock, or inspector, ignore pan
    if (e.target.closest('.builder-cable-group') ||
        e.target.closest('.builder-cable-hitarea') ||
        e.target.closest('.builder-cable') ||
        e.target.closest('.builder-cable-badge') ||
        e.target.closest('.flow-canvas-node') ||
        e.target.closest('.builder-floating-dock') ||
        e.target.closest('.builder-inspector-drawer')) {
      return;
    }

    // Left click or Middle click
    if (e.button === 0 || e.button === 1 || isSpacePressed) {
      isPanning = true;
      startPanX = e.clientX - panX;
      startPanY = e.clientY - panY;
      viewport.style.cursor = 'grabbing';
      viewport.setPointerCapture(e.pointerId);
    }
  });

  viewport.addEventListener('pointermove', (e) => {
    if (isPanning) {
      panX = e.clientX - startPanX;
      panY = e.clientY - startPanY;
      applyCanvasTransform();
    }
  });

  viewport.addEventListener('pointerup', (e) => {
    if (isPanning) {
      isPanning = false;
      viewport.style.cursor = isSpacePressed ? 'grab' : 'default';
      try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  });

  // 4. Global Mousemove for Node Dragging & Wire Connection
  window.addEventListener('mousemove', (e) => {
    if (isDraggingNode && draggedNodeId) {
      const node = currentBot.canvasFlow.nodes.find(n => n.id === draggedNodeId);
      if (node) {
        const deltaX = (e.clientX - dragStartX) / zoom;
        const deltaY = (e.clientY - dragStartY) / zoom;
        node.x = Math.round(nodeStartX + deltaX);
        node.y = Math.round(nodeStartY + deltaY);

        const nodeEl = document.getElementById(`canvas-node-${node.id}`);
        if (nodeEl) {
          nodeEl.style.left = `${node.x}px`;
          nodeEl.style.top = `${node.y}px`;
        }

        // Fast incremental cable update
        updateCablesForNode(node.id);
      }
      return;
    }

    if (isConnectingPort && connectingSource) {
      updateTempCable(e.clientX, e.clientY);
      return;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingNode) {
      const movedNodeId = draggedNodeId;
      isDraggingNode = false;
      const nodeEl = document.getElementById(`canvas-node-${movedNodeId}`);
      if (nodeEl) nodeEl.classList.remove('dragging');
      draggedNodeId = null;
      cachePortOffsets();
      updateCablesForNode(movedNodeId);
    }

    if (isConnectingPort) {
      cancelConnectingPort();
    }
  });

  // 5. Zoom Buttons
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    zoom = Math.min(2.0, zoom + 0.15);
    applyCanvasTransform();
  });

  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    zoom = Math.max(0.4, zoom - 0.15);
    applyCanvasTransform();
  });

  document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
    resetCanvasView();
  });

  // 6. Topbar Studio Navigation Buttons
  document.getElementById('btn-builder-back')?.addEventListener('click', () => {
    if (window.switchView) window.switchView('chatbots');
  });

  document.getElementById('btn-builder-save')?.addEventListener('click', () => {
    saveCanvasFlow();
  });

  document.getElementById('btn-builder-preview')?.addEventListener('click', () => {
    if (window.openSimulator) window.openSimulator(currentBot.id);
  });

  // 7. Setup Node Click/Drag Delegation
  setupNodesDelegation();

  // 8. Setup Right Floating Dock (Palette)
  setupDockDragDrop();

  // 9. Setup Left Inspector Drawer
  setupInspectorDrawer();

  // 10. Setup Flow Name Inline Editing
  setupFlowNameEditing();
}

/**
 * Setup inline editing for Flow name in Studio Topbar
 */
function setupFlowNameEditing() {
  const wrapper = document.getElementById('builder-title-wrapper');
  const nameEl = document.getElementById('builder-bot-name');
  const btnEdit = document.getElementById('btn-edit-flow-name');
  const inputEl = document.getElementById('builder-bot-name-input');
  if (!wrapper || !nameEl || !inputEl || wrapper._setupDone) return;
  wrapper._setupDone = true;

  function startEditing() {
    if (!currentBot) return;
    wrapper.classList.add('is-editing');
    inputEl.value = currentBot.name || nameEl.textContent.trim();
    inputEl.style.display = 'inline-block';
    inputEl.focus();
    inputEl.select();
  }

  function finishEditing(save = true) {
    if (!wrapper.classList.contains('is-editing')) return;
    wrapper.classList.remove('is-editing');
    inputEl.style.display = 'none';

    if (save && currentBot) {
      const newName = inputEl.value.trim();
      if (newName && newName !== currentBot.name) {
        currentBot.name = newName;
        nameEl.textContent = newName;
        const botInList = zapChatData?.chatbots?.list?.find(b => b.id === currentBot.id);
        if (botInList) botInList.name = newName;
        if (window.renderChatbotsList) window.renderChatbotsList();
        if (window.showToast) {
          window.showToast(`Nome do fluxo alterado para "${newName}"`);
        }
      } else {
        nameEl.textContent = currentBot.name;
        inputEl.value = currentBot.name;
      }
    } else if (currentBot) {
      nameEl.textContent = currentBot.name;
      inputEl.value = currentBot.name;
    }
  }

  wrapper.addEventListener('click', (e) => {
    if (wrapper.classList.contains('is-editing')) return;
    e.stopPropagation();
    startEditing();
  });

  btnEdit?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!wrapper.classList.contains('is-editing')) {
      startEditing();
    }
  });

  inputEl.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finishEditing(false);
    }
  });

  inputEl.addEventListener('blur', () => {
    finishEditing(true);
  });
}

/**
 * Setup mouse events on nodes (drag, click to inspect, port connect)
 */
function setupNodesDelegation() {
  const container = document.getElementById('builder-nodes-container');
  if (!container) return;

  container.addEventListener('mousedown', (e) => {
    // Check if clicked on a port
    const portEl = e.target.closest('.node-port');
    if (portEl) {
      e.stopPropagation();
      e.preventDefault();
      startConnectingPort(portEl);
      return;
    }

    // Check if clicked on node
    const nodeEl = e.target.closest('.flow-canvas-node');
    if (!nodeEl) return;

    const nodeId = nodeEl.getAttribute('data-node-id');
    const node = currentBot.canvasFlow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Start dragging node
    isDraggingNode = true;
    draggedNodeId = nodeId;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    nodeStartX = node.x;
    nodeStartY = node.y;
    nodeEl.classList.add('dragging');

    // Select node in Left Inspector
    selectNode(nodeId);
  });

  // Handle port drop to connect
  container.addEventListener('mouseup', (e) => {
    if (!isConnectingPort || !connectingSource) return;

    const targetPortEl = e.target.closest('.node-port');
    if (targetPortEl) {
      const targetType = targetPortEl.getAttribute('data-port-type');
      const targetNodeId = targetPortEl.getAttribute('data-node-id');
      const targetPortId = targetPortEl.getAttribute('data-port-id');

      if (targetNodeId !== connectingSource.nodeId) {
        if (connectingSource.portType === 'out' && targetType === 'in') {
          createConnection(connectingSource.nodeId, connectingSource.portId, targetNodeId, targetPortId);
        } else if (connectingSource.portType === 'in' && targetType === 'out') {
          createConnection(targetNodeId, targetPortId, connectingSource.nodeId, connectingSource.portId);
        }
      }
    }

    cancelConnectingPort();
  });
}

/**
 * Start dragging wire from port
 */
function startConnectingPort(portEl) {
  const nodeId = portEl.getAttribute('data-node-id');
  const portId = portEl.getAttribute('data-port-id');
  const portType = portEl.getAttribute('data-port-type') || 'out';

  const p = getPortWorldCoords(nodeId, portId);
  if (!p) return;

  isConnectingPort = true;
  connectingSource = { nodeId, portId, portType, x: p.x, y: p.y };

  const tempCable = document.getElementById('builder-temp-cable');
  if (tempCable) {
    tempCable.style.display = 'block';
  }
}

/**
 * Update live temporary cable while connecting
 */
function updateTempCable(clientX, clientY) {
  const tempCable = document.getElementById('builder-temp-cable');
  const worldEl = document.getElementById('builder-canvas-world');
  if (!tempCable || !worldEl || !connectingSource) return;

  const worldRect = worldEl.getBoundingClientRect();
  const xMouse = (clientX - worldRect.left) / zoom;
  const yMouse = (clientY - worldRect.top) / zoom;

  if (connectingSource.portType === 'in') {
    tempCable.setAttribute('d', getBezierPathData(xMouse, yMouse, connectingSource.x, connectingSource.y));
  } else {
    tempCable.setAttribute('d', getBezierPathData(connectingSource.x, connectingSource.y, xMouse, yMouse));
  }
}

/**
 * Cancel temporary wire
 */
function cancelConnectingPort() {
  isConnectingPort = false;
  connectingSource = null;
  const tempCable = document.getElementById('builder-temp-cable');
  if (tempCable) {
    tempCable.style.display = 'none';
  }
}

/**
 * Create connection in data model
 */
function createConnection(fromNode, fromPort, toNode, toPort) {
  if (!currentBot) return;

  const exists = currentBot.canvasFlow.connections.some(c =>
    c.fromNode === fromNode && c.fromPort === fromPort && c.toNode === toNode && c.toPort === toPort
  );

  if (!exists) {
    const newConn = {
      id: `conn-${Date.now()}`,
      fromNode,
      fromPort,
      toNode,
      toPort
    };
    currentBot.canvasFlow.connections.push(newConn);
    renderCanvasNodes();
    if (window.lucide) window.lucide.createIcons();
    renderAllCables();
    if (selectedNodeId) {
      const selNode = currentBot.canvasFlow.nodes.find(n => n.id === selectedNodeId);
      if (selNode) populateInspector(selNode);
    }
    if (window.showToast) window.showToast('Blocos conectados com sucesso!');
  }
}

/**
 * Select node and open Left Inspector Drawer
 */
function selectNode(nodeId) {
  deselectCable();
  selectedNodeId = nodeId;

  document.querySelectorAll('.flow-canvas-node').forEach(el => {
    if (el.getAttribute('data-node-id') === nodeId) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });

  const node = currentBot.canvasFlow.nodes.find(n => n.id === nodeId);
  if (node) {
    populateInspector(node);
    openInspector();
  }
}

function openInspector() {
  const drawer = document.getElementById('builder-inspector');
  if (drawer) drawer.classList.add('open');
}

function closeInspector() {
  const drawer = document.getElementById('builder-inspector');
  if (drawer) drawer.classList.remove('open');
  selectedNodeId = null;
  document.querySelectorAll('.flow-canvas-node').forEach(el => el.classList.remove('selected'));
}

/**
 * Render individual item card inside Conteúdo Drawer
 */
function renderConteudoItemHtml(item, index, total) {
  if (item.type === 'text') {
    return `
      <div class="conteudo-item-card ${item.saved ? '' : 'editing'}" data-item-id="${item.id}" data-item-type="text">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge text">
            <i data-lucide="type" style="width: 11px; height: 11px;"></i> Texto ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Mensagem">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        <div class="conteudo-text-box">
          <textarea class="conteudo-textarea" rows="3" placeholder="Insira texto" data-item-id="${item.id}">${item.text || ''}</textarea>
          <div class="conteudo-format-toolbar">
            <button type="button" class="conteudo-fmt-btn fmt-bold" data-item-id="${item.id}" title="Negrito (*)"><strong>B</strong></button>
            <button type="button" class="conteudo-fmt-btn fmt-italic" data-item-id="${item.id}" title="Itálico (_)"><em>I</em></button>
            <button type="button" class="conteudo-fmt-btn fmt-strike" data-item-id="${item.id}" title="Tachado (~)"><s>S</s></button>
            <button type="button" class="conteudo-fmt-btn var fmt-brackets" data-item-id="${item.id}" title="Inserir Variável">{ }</button>
          </div>
        </div>

        <div class="conteudo-card-actions">
          <button type="button" class="btn-conteudo-cancel" data-item-id="${item.id}">Cancelar</button>
          <button type="button" class="btn-conteudo-save" data-item-id="${item.id}">Salvar</button>
        </div>
      </div>
    `;
  } else if (item.type === 'image') {
    return `
      <div class="conteudo-item-card" data-item-id="${item.id}" data-item-type="image">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge image">
            <i data-lucide="image" style="width: 11px; height: 11px;"></i> Imagem ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Imagem">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        ${item.url ? `
          <div class="conteudo-preview-card">
            <img src="${item.url}" alt="Preview" class="conteudo-preview-img" />
            <input type="text" class="conteudo-caption-input" placeholder="Legenda da imagem (opcional)..." value="${item.caption || ''}" data-item-id="${item.id}" />
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10px; color:var(--text-muted);">${item.fileName || 'Imagem carregada'}</span>
              <button type="button" class="btn-xs btn btn-secondary btn-upload-trigger" data-item-id="${item.id}">Trocar Imagem</button>
            </div>
          </div>
        ` : `
          <div class="conteudo-upload-box btn-upload-trigger" data-item-id="${item.id}">
            <div class="conteudo-upload-icon">
              <i data-lucide="image" style="width: 28px; height: 28px;"></i>
            </div>
            <p class="conteudo-upload-subtext">Tamanho máximo permitido: 2MB, Tipos de arquivos aceitos: jpg, jpeg, png, webp</p>
            <span class="conteudo-upload-action">Subir Imagem</span>
          </div>
        `}
        <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" class="conteudo-file-input" data-item-id="${item.id}" style="display:none;" />
      </div>
    `;
  } else if (item.type === 'video') {
    return `
      <div class="conteudo-item-card" data-item-id="${item.id}" data-item-type="video">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge video">
            <i data-lucide="video" style="width: 11px; height: 11px;"></i> Vídeo ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Vídeo">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        ${item.fileName ? `
          <div class="conteudo-preview-card">
            <div class="conteudo-media-pill">
              <div style="display:flex; align-items:center; gap:8px;">
                <i data-lucide="film" style="width:16px;height:16px;color:#7C3AED;"></i>
                <strong>${item.fileName}</strong>
              </div>
              <button type="button" class="btn-xs btn btn-secondary btn-upload-trigger" data-item-id="${item.id}">Alterar</button>
            </div>
            <input type="text" class="conteudo-caption-input" placeholder="Legenda do vídeo (opcional)..." value="${item.caption || ''}" data-item-id="${item.id}" />
          </div>
        ` : `
          <div class="conteudo-upload-box btn-upload-trigger" data-item-id="${item.id}">
            <div class="conteudo-upload-icon" style="color:#7C3AED;">
              <i data-lucide="play-square" style="width: 28px; height: 28px;"></i>
            </div>
            <span class="conteudo-upload-action" style="color:#7C3AED;">Clique Aqui Para Subir Video</span>
            <p class="conteudo-upload-subtext">Tamanho do Vídeo deve ser abaixo de 15MB e tipo pode ser .mp4</p>
          </div>
        `}
        <input type="file" accept="video/mp4" class="conteudo-file-input" data-item-id="${item.id}" style="display:none;" />
      </div>
    `;
  } else if (item.type === 'file') {
    return `
      <div class="conteudo-item-card" data-item-id="${item.id}" data-item-type="file">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge file">
            <i data-lucide="file-text" style="width: 11px; height: 11px;"></i> Arquivo ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Arquivo">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        ${item.fileName ? `
          <div class="conteudo-media-pill">
            <div style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="file" style="width:16px;height:16px;color:#D97706;"></i>
              <span>${item.fileName}</span>
            </div>
            <button type="button" class="btn-xs btn btn-secondary btn-upload-trigger" data-item-id="${item.id}">Alterar</button>
          </div>
        ` : `
          <div class="conteudo-upload-box btn-upload-trigger" data-item-id="${item.id}">
            <div class="conteudo-upload-icon" style="color:#D97706;">
              <i data-lucide="file-text" style="width: 28px; height: 28px;"></i>
            </div>
            <span class="conteudo-upload-action" style="color:#D97706;">Clique Aqui Para Subir Arquivo</span>
            <p class="conteudo-upload-subtext">Tamanho máximo permitido: 25MB (PDF, DOCX, XLSX)</p>
          </div>
        `}
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" class="conteudo-file-input" data-item-id="${item.id}" style="display:none;" />
      </div>
    `;
  } else if (item.type === 'audio') {
    return `
      <div class="conteudo-item-card" data-item-id="${item.id}" data-item-type="audio">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge audio">
            <i data-lucide="volume-2" style="width: 11px; height: 11px;"></i> Áudio ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Áudio">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        ${item.fileName ? `
          <div class="conteudo-media-pill">
            <div style="display:flex; align-items:center; gap:8px;">
              <i data-lucide="mic" style="width:16px;height:16px;color:#0891B2;"></i>
              <span>${item.fileName}</span>
            </div>
            <button type="button" class="btn-xs btn btn-secondary btn-upload-trigger" data-item-id="${item.id}">Alterar</button>
          </div>
        ` : `
          <div class="conteudo-upload-box btn-upload-trigger" data-item-id="${item.id}">
            <div class="conteudo-upload-icon" style="color:#0891B2;">
              <i data-lucide="volume-2" style="width: 28px; height: 28px;"></i>
            </div>
            <span class="conteudo-upload-action" style="color:#0891B2;">Clique Aqui Para Subir Áudio</span>
            <p class="conteudo-upload-subtext">Formatos aceitos: .mp3, .ogg, .wav (Enviado como mensagem de voz)</p>
          </div>
        `}
        <input type="file" accept="audio/*" class="conteudo-file-input" data-item-id="${item.id}" style="display:none;" />
        
        <div style="margin-top:8px;">
          <label class="form-check-label" style="display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" class="conteudo-audio-ptt" data-item-id="${item.id}" ${item.simulatedVoice !== false ? 'checked' : ''} />
            <span style="font-size:11px; font-weight:500;">Simular gravação de voz na hora (PTT WhatsApp)</span>
          </label>
        </div>
      </div>
    `;
  } else if (item.type === 'delay') {
    return `
      <div class="conteudo-item-card" data-item-id="${item.id}" data-item-type="delay">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge delay">
            <i data-lucide="clock" style="width: 11px; height: 11px;"></i> Atraso ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Atraso">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        <div class="conteudo-delay-box">
          <div class="conteudo-delay-row">
            <label style="font-size:12px; font-weight:500; min-width:80px;">Duração:</label>
            <input type="number" min="1" max="60" class="form-input conteudo-delay-seconds" data-item-id="${item.id}" value="${item.seconds || 3}" style="width:70px; text-align:center;" />
            <span style="font-size:12px; color:var(--text-muted);">segundos</span>
          </div>
          <div>
            <label class="form-check-label" style="display:flex; align-items:center; gap:6px; cursor:pointer;">
              <input type="checkbox" class="conteudo-delay-typing" data-item-id="${item.id}" ${item.typing !== false ? 'checked' : ''} />
              <span style="font-size:11px; font-weight:500;">Simular "Digitando..." no WhatsApp</span>
            </label>
          </div>
        </div>
      </div>
    `;
  } else if (item.type === 'link') {
    return `
      <div class="conteudo-item-card" data-item-id="${item.id}" data-item-type="link">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge link">
            <i data-lucide="link" style="width: 11px; height: 11px;"></i> Link / Botão ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Link / Botão">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div>
            <label style="font-size:11px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:3px;">Texto do Botão / Chamada</label>
            <input type="text" class="form-input conteudo-link-text" data-item-id="${item.id}" value="${item.buttonText || ''}" placeholder="Ex: Acessar Catálogo / Site" />
          </div>
          <div>
            <label style="font-size:11px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:3px;">URL de Destino</label>
            <input type="url" class="form-input conteudo-link-url" data-item-id="${item.id}" value="${item.url || ''}" placeholder="https://seusite.com.br" />
          </div>
        </div>
      </div>
    `;
  } else if (item.type === 'location') {
    return `
      <div class="conteudo-item-card" data-item-id="${item.id}" data-item-type="location">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge location">
            <i data-lucide="map-pin" style="width: 11px; height: 11px;"></i> Localização ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Localização">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div>
            <label style="font-size:11px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:3px;">Nome do Local / Estabelecimento</label>
            <input type="text" class="form-input conteudo-loc-name" data-item-id="${item.id}" value="${item.locationName || ''}" placeholder="Ex: Matriz São Paulo" />
          </div>
          <div>
            <label style="font-size:11px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:3px;">Endereço ou Link do Google Maps</label>
            <input type="text" class="form-input conteudo-loc-address" data-item-id="${item.id}" value="${item.address || ''}" placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP" />
          </div>
        </div>
      </div>
    `;
  } else if (item.type === 'contact') {
    return `
      <div class="conteudo-item-card" data-item-id="${item.id}" data-item-type="contact">
        <div class="conteudo-item-header">
          <span class="conteudo-type-badge contact">
            <i data-lucide="user-check" style="width: 11px; height: 11px;"></i> Contato ${total > 1 ? `#${index + 1}` : ''}
          </span>
          <div class="conteudo-item-actions">
            ${index > 0 ? `<button type="button" class="conteudo-btn-action btn-move-item-up" data-item-id="${item.id}" title="Mover para cima"><i data-lucide="arrow-up" style="width:12px;height:12px;"></i></button>` : ''}
            ${index < total - 1 ? `<button type="button" class="conteudo-btn-action btn-move-item-down" data-item-id="${item.id}" title="Mover para baixo"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i></button>` : ''}
            <button type="button" class="conteudo-btn-action delete btn-delete-conteudo-item" data-item-id="${item.id}" title="Excluir Contato">
              <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
            </button>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div>
            <label style="font-size:11px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:3px;">Nome do Contato (Cartão vCard)</label>
            <input type="text" class="form-input conteudo-contact-name" data-item-id="${item.id}" value="${item.contactName || ''}" placeholder="Ex: Consultor Comercial ZapChat" />
          </div>
          <div>
            <label style="font-size:11px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:3px;">Telefone / WhatsApp</label>
            <input type="text" class="form-input conteudo-contact-phone" data-item-id="${item.id}" value="${item.contactPhone || ''}" placeholder="Ex: +55 11 99999-9999" />
          </div>
        </div>
      </div>
    `;
  }
  return '';
}

/**
 * Populate Inspector Drawer with node properties
 */
function populateInspector(node) {
  const titleEl = document.getElementById('inspector-node-title');
  const typeEl = document.getElementById('inspector-node-type');
  const bodyEl = document.getElementById('inspector-body');
  const iconWrap = document.getElementById('inspector-icon-wrap');
  if (!bodyEl) return;

  if (node.type === 'message') {
    if (iconWrap) {
      iconWrap.innerHTML = '<i data-lucide="star" style="width: 16px; height: 16px; color: var(--primary); fill: var(--primary);"></i>';
      iconWrap.style.background = 'rgba(0, 168, 104, 0.1)';
      iconWrap.style.color = 'var(--primary)';
    }
    if (titleEl) titleEl.textContent = 'Conteúdo';
    if (typeEl) typeEl.textContent = node.title || 'Sequência de Mensagens';
  } else if (node.type === 'menu') {
    if (iconWrap) {
      iconWrap.innerHTML = '<i data-lucide="layout-grid" style="width: 16px; height: 16px; color: var(--primary);"></i>';
      iconWrap.style.background = 'rgba(0, 168, 104, 0.1)';
      iconWrap.style.color = 'var(--primary)';
    }
    if (titleEl) titleEl.textContent = 'Menu';
    if (typeEl) typeEl.textContent = node.data?.format === 'number' ? 'Menu Numérico' : 'Menu de Botão de Lista';
  } else if (node.type === 'ai_agent') {
    if (iconWrap) {
      iconWrap.innerHTML = '<i data-lucide="bot" style="width: 16px; height: 16px; color: var(--primary);"></i>';
      iconWrap.style.background = 'rgba(0, 168, 104, 0.1)';
      iconWrap.style.color = 'var(--primary)';
    }
    if (titleEl) titleEl.textContent = 'Agente de IA';
    if (typeEl) typeEl.textContent = 'Agente de Inteligência Artificial';
  } else {
    if (iconWrap) {
      iconWrap.innerHTML = '<i data-lucide="sliders" style="width: 16px; height: 16px;"></i>';
      iconWrap.style.background = 'var(--primary-light)';
      iconWrap.style.color = 'var(--primary)';
    }
    if (titleEl) titleEl.textContent = node.title;
    if (typeEl) typeEl.textContent = getNodeTypeLabel(node.type);
  }

  let formHtml = '';

  if (node.type === 'start') {
    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title}" />
      </div>
      <div class="form-group">
        <label class="form-label">Descrição / Observações</label>
        <textarea class="form-textarea" rows="3" id="insp-input-desc" placeholder="Descreva o propósito deste bloco inicial...">${node.data?.subtitle || ''}</textarea>
      </div>
    `;
  } else if (node.type === 'ai_agent') {
    const agentsList = zapChatData.agentes?.list || [
      { id: 'pedro', name: 'Pedro', role: 'Atendimento geral', channel: 'WhatsApp', status: 'Ativo' },
      { id: 'juliana', name: 'Juliana Santos', role: 'Vendas', channel: 'WhatsApp', status: 'Ativo' },
      { id: 'carla', name: 'Carla Menezes', role: 'Triagem', channel: 'WhatsApp', status: 'Ativo' },
      { id: 'felipe', name: 'Felipe Costa', role: 'Qualificação', channel: 'WhatsApp', status: 'Ativo' }
    ];

    if (!node.agentName && agentsList.length > 0) {
      node.agentName = agentsList[0].name;
    }

    const currentAgent = agentsList.find(ag => ag.name === node.agentName || ag.id === node.agentId) || agentsList[0];

    if (!node.data) node.data = {};
    if (!node.data.branches || node.data.branches.length === 0) {
      node.data.branches = [
        { id: `b-${Date.now().toString(36)}-1`, triggerType: 'goal_reached', label: 'Atendimento concluído pela IA' },
        { id: `b-${Date.now().toString(36)}-2`, triggerType: 'human_handoff', label: 'Pediu atendente humano' },
        { id: `b-${Date.now().toString(36)}-3`, triggerType: 'inactivity', label: 'Cliente parou de responder' }
      ];
    }
    node.data.branches = normalizeAiAgentBranches(node.data.branches);

    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title || 'Agente de IA'}" />
      </div>

      <div class="form-group">
        <label class="form-label">Qual Agente de IA vai atender?</label>
        <select class="form-select" id="insp-input-agent">
          ${agentsList.map(ag => `
            <option value="${ag.name}" ${ag.name === node.agentName ? 'selected' : ''}>
              🤖 ${ag.name} (${ag.role || 'Agente'}${ag.channel ? ` - ${ag.channel}` : ''})
            </option>
          `).join('')}
        </select>
        <span class="form-hint">O agente usará o treinamento e instruções definidos na aba <strong>Agentes</strong>.</span>
      </div>

      <!-- Preview do Agente Selecionado -->
      <div class="agent-preview-box" style="background: var(--bg-main); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 16px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:30px; height:30px; border-radius:50%; background:rgba(0,168,104,0.12); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">
              ${(currentAgent?.name || 'A').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <strong style="font-size:13px; color:var(--text-main); display:block; line-height:1.2;">${currentAgent?.name || 'Agente de IA'}</strong>
              <span style="font-size:11px; color:var(--text-muted);">${currentAgent?.role || 'Atendimento Geral'}</span>
            </div>
          </div>
          <span class="badge badge-success" style="font-size:10px;">${currentAgent?.status || 'Ativo'}</span>
        </div>
        <div style="font-size:11px; color:var(--text-secondary); line-height:1.4; padding-top:6px; border-top:1px dashed var(--border); display:flex; align-items:center; justify-content:space-between;">
          <span>Canal: <strong>${currentAgent?.channel || 'WhatsApp'}</strong></span>
          <span style="color:var(--text-muted); font-size:10px;">Responde dúvidas livremente</span>
        </div>
      </div>

      <!-- Seção Intuitiva de Caminhos de Saída da IA -->
      <div class="form-group">
        <div class="insp-list-header" style="margin-bottom: 6px;">
          <div>
            <label class="form-label" style="margin:0; display:flex; align-items:center; gap:5px;">
              <i data-lucide="git-branch" style="width: 14px; height: 14px; color: var(--ai-purple);"></i>
              <span>Caminhos de Saída da IA (${node.data.branches.length})</span>
            </label>
          </div>
          <button type="button" class="btn btn-secondary btn-xs" id="btn-insp-add-branch">
            <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
            <span>Adicionar Saída</span>
          </button>
        </div>

        <div class="ai-exit-explainer-box">
          <i data-lucide="info" style="width: 14px; height: 14px; color: #7C3AED; flex-shrink: 0; margin-top: 1px;"></i>
          <span>Defina <strong>quando a IA deve encerrar sua participação</strong> e encaminhar o cliente para outro bloco (ex: transferir para humano ou criar negócio no CRM).</span>
        </div>

        <div id="insp-branches-container" class="ai-exit-cards-list">
          ${node.data.branches.map((b, idx) => {
            const tType = b.triggerType || 'custom_intent';
            const meta = getBranchTriggerMeta(tType);
            const conn = currentBot?.canvasFlow?.connections?.find(c => c.fromNode === node.id && c.fromPort === b.id);
            const targetNode = conn ? currentBot?.canvasFlow?.nodes?.find(n => n.id === conn.toNode) : null;

            return `
              <div class="ai-exit-card" data-branch-id="${b.id}">
                <div class="ai-exit-card-top">
                  <span class="ai-exit-step-badge" style="color: ${meta.color}; background: ${meta.color}18;">
                    <i data-lucide="${meta.icon}" style="width: 11px; height: 11px;"></i>
                    Saída ${idx + 1}
                  </span>
                  <span class="ai-exit-conn-status ${targetNode ? 'is-connected' : ''}">
                    ${targetNode ? `🔗 Vai para: <strong>${targetNode.title}</strong>` : '⚪ Ponto disponível no card'}
                  </span>
                  <button type="button" class="insp-btn-delete-item insp-btn-delete-branch" data-branch-id="${b.id}" title="Remover este caminho de saída">
                    <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                  </button>
                </div>

                <div class="ai-exit-field">
                  <label class="ai-exit-mini-label">Quando acionar esta saída?</label>
                  <select class="form-select insp-branch-trigger-select" data-branch-id="${b.id}">
                    <option value="goal_reached" ${tType === 'goal_reached' ? 'selected' : ''}>✅ Quando a IA concluir o atendimento / objetivo</option>
                    <option value="human_handoff" ${tType === 'human_handoff' ? 'selected' : ''}>👤 Quando o cliente pedir atendente humano</option>
                    <option value="custom_intent" ${tType === 'custom_intent' ? 'selected' : ''}>🎯 Quando o cliente demonstrar uma intenção específica</option>
                    <option value="inactivity" ${tType === 'inactivity' ? 'selected' : ''}>⏰ Quando o cliente parar de responder (Inatividade)</option>
                  </select>
                </div>

                <div class="ai-exit-field">
                  <label class="ai-exit-mini-label">Nome da saída / O que identificar:</label>
                  <input type="text" class="form-input insp-branch-input" data-branch-id="${b.id}" value="${b.label}" placeholder="Ex: Cliente quer fechar plano Pro..." />
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Tempo Limite de Inatividade</label>
        <select class="form-select" id="insp-input-timeout">
          <option value="15" ${(!node.data?.timeout || node.data?.timeout === '15') ? 'selected' : ''}>15 minutos sem resposta (Padrão)</option>
          <option value="30" ${node.data?.timeout === '30' ? 'selected' : ''}>30 minutos sem resposta</option>
          <option value="60" ${node.data?.timeout === '60' ? 'selected' : ''}>1 hora sem resposta</option>
          <option value="1440" ${node.data?.timeout === '1440' ? 'selected' : ''}>24 horas sem resposta</option>
        </select>
        <span class="form-hint">Tempo que a IA aguarda caso você utilize uma saída por inatividade.</span>
      </div>
    `;
  } else if (node.type === 'action') {
    if (!node.data) node.data = {};
    if (!node.actionType) node.actionType = 'transfer';
    const isFinish = node.actionType === 'finish';
    if (!node.transferType) node.transferType = 'human';
    if (!node.transferTarget) node.transferTarget = 'Carlos Félix';
    if (!node.actionLabel) node.actionLabel = isFinish ? 'Finalizar atendimento' : 'Transferir atendimento';

    const aiAgents = (zapChatData?.agentes?.list && zapChatData.agentes.list.length > 0)
      ? zapChatData.agentes.list
      : [
          { id: 'pedro', name: 'Pedro', role: 'Atendimento geral' },
          { id: 'juliana', name: 'Juliana Santos', role: 'Vendas' },
          { id: 'carla', name: 'Carla Menezes', role: 'Triagem' },
          { id: 'felipe', name: 'Felipe Costa', role: 'Qualificação' }
        ];

    const humanAgents = [
      { id: 'carlos_felix', name: 'Carlos Félix', role: 'Consultor Comercial' },
      { id: 'juliana_santos', name: 'Juliana Santos', role: 'Vendas' },
      { id: 'pedro_henrique', name: 'Pedro Henrique', role: 'Suporte Técnico' },
      { id: 'rodrigo_almeida', name: 'Rodrigo Almeida', role: 'Suporte N2' },
      { id: 'carla_menezes', name: 'Carla Menezes', role: 'Enterprise' },
      { id: 'rafael_mota', name: 'Rafael Mota', role: 'Administrador' }
    ];

    const queues = [
      { id: 'fila_geral', name: 'Fila Geral (Triagem Automática)' },
      { id: 'fila_vendas', name: 'Fila Comercial & Vendas' },
      { id: 'fila_suporte', name: 'Fila de Suporte Técnico N1' },
      { id: 'fila_financeiro', name: 'Fila Financeiro & Cobrança' }
    ];

    const currentVal = `${node.transferType || 'human'}:${node.transferTarget || 'Carlos Félix'}`;

    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title || (isFinish ? 'Finalizar Atendimento' : 'Ação')}" />
      </div>

      <div class="form-group">
        <label class="form-label">Tipo de Ação</label>
        <select class="form-select" id="insp-input-action-type">
          <option value="transfer" ${!isFinish ? 'selected' : ''}>Transferir atendimento</option>
          <option value="finish" ${isFinish ? 'selected' : ''}>Finalizar atendimento</option>
        </select>
        <span class="form-hint">Ação executada quando o contato passar por este bloco.</span>
      </div>

      <div class="form-group" id="insp-transfer-target-group" style="${isFinish ? 'display: none;' : ''}">
        <label class="form-label">Destino da Transferência</label>
        <select class="form-select" id="insp-input-transfer-target">
          <optgroup label="🤖 Agentes de IA">
            ${aiAgents.map(ag => {
              const val = `ai:${ag.name}`;
              return `<option value="${val}" ${val === currentVal ? 'selected' : ''}>🤖 ${ag.name} (${ag.role || 'Agente de IA'})</option>`;
            }).join('')}
          </optgroup>
          <optgroup label="👤 Atendentes Humanos">
            ${humanAgents.map(hu => {
              const val = `human:${hu.name}`;
              return `<option value="${val}" ${val === currentVal ? 'selected' : ''}>👤 ${hu.name} (${hu.role})</option>`;
            }).join('')}
          </optgroup>
          <optgroup label="👥 Filas de Atendimento">
            ${queues.map(q => {
              const val = `queue:${q.name}`;
              return `<option value="${val}" ${val === currentVal ? 'selected' : ''}>👥 ${q.name}</option>`;
            }).join('')}
          </optgroup>
        </select>
        <span class="form-hint">Selecione um Agente de IA, um atendente humano ou uma fila.</span>
      </div>

      <div class="form-group">
        <label class="form-label">Rótulo Exibido no Bloco</label>
        <input type="text" class="form-input" id="insp-input-action-label" value="${node.actionLabel || (isFinish ? 'Finalizar atendimento' : 'Transferir atendimento')}" />
      </div>
    `;
  } else if (node.type === 'menu') {
    if (!node.data) node.data = {};
    if (!node.data.format) node.data.format = 'list_button';
    if (node.data.question === undefined) node.data.question = node.data.message || 'Texto da pergunta';
    if (!node.data.buttonTitle) node.data.buttonTitle = 'VER OPÇÕES';
    if (!node.data.invalidMessage) node.data.invalidMessage = 'Opção inválida. Por favor, escolha um dos números acima.';
    if (!node.data.maxErrors) node.data.maxErrors = 3;
    if (!node.data.timeoutDays) node.data.timeoutDays = '1';
    if (!node.data.options) {
      node.data.options = [
        { id: `opt-${Date.now().toString(36)}-1`, label: 'Resposta 1', description: '', ctr: 'CTR 0%' }
      ];
    }

    formHtml = `
      <div class="conteudo-panel-wrap">
        <!-- Título do Bloco -->
        <div class="form-group" style="margin-bottom: 2px;">
          <label class="form-label">Título do Bloco</label>
          <input type="text" class="form-input" id="insp-input-title" value="${node.title || 'Menu'}" placeholder="Nome do menu..." />
        </div>

        <!-- 1. Seletor de Formato: Botão de lista vs Número -->
        <div class="menu-format-selector">
          <label class="menu-radio-label">
            <input type="radio" name="menu-format" value="list_button" ${node.data.format === 'list_button' ? 'checked' : ''} />
            <span>Botão de lista</span>
          </label>
          <label class="menu-radio-label">
            <input type="radio" name="menu-format" value="number" ${node.data.format === 'number' ? 'checked' : ''} />
            <span>Número</span>
          </label>
        </div>

        <!-- 2. Texto da pergunta -->
        <div class="form-group" style="margin-top: 6px;">
          <label class="form-label" style="margin-bottom: 4px;">Texto da pergunta</label>
          <div class="conteudo-text-box">
            <textarea class="conteudo-textarea" id="insp-menu-question" rows="3" placeholder="Insira o texto da pergunta">${node.data.question || ''}</textarea>
            <div class="conteudo-format-toolbar">
              <button type="button" class="conteudo-fmt-btn fmt-menu-bold" data-target="insp-menu-question" title="Negrito (*)"><strong>B</strong></button>
              <button type="button" class="conteudo-fmt-btn fmt-menu-italic" data-target="insp-menu-question" title="Itálico (_)"><em>I</em></button>
              <button type="button" class="conteudo-fmt-btn fmt-menu-strike" data-target="insp-menu-question" title="Tachado (~)"><s>S</s></button>
              <button type="button" class="conteudo-fmt-btn var fmt-menu-var" data-target="insp-menu-question" title="Inserir Variável">{ }</button>
            </div>
          </div>
          <div class="conteudo-card-actions">
            <button type="button" class="btn-conteudo-cancel" id="btn-cancel-menu-question">Cancelar</button>
            <button type="button" class="btn-conteudo-save" id="btn-save-menu-question">Salvar</button>
          </div>
        </div>

        <!-- Campos específicos quando 'Botão de lista' -->
        ${node.data.format === 'list_button' ? `
          <div class="form-group">
            <label class="form-label" style="margin-bottom: 4px;">Título do botão</label>
            <div class="conteudo-text-box">
              <input type="text" class="form-input" id="insp-menu-button-title" value="${node.data.buttonTitle || 'VER OPÇÕES'}" style="border:none; padding:4px 0; background:transparent;" placeholder="Ex: VER OPÇÕES" />
              <div class="conteudo-format-toolbar">
                <button type="button" class="conteudo-fmt-btn var fmt-menu-var" data-target="insp-menu-button-title" title="Inserir Variável">{ }</button>
              </div>
            </div>
            <div class="conteudo-card-actions">
              <button type="button" class="btn-conteudo-cancel" id="btn-cancel-menu-btntitle">Cancelar</button>
              <button type="button" class="btn-conteudo-save" id="btn-save-menu-btntitle">Salvar</button>
            </div>
          </div>
        ` : `
          <!-- Campos específicos quando 'Número' -->
          <div class="form-group">
            <label class="form-label" style="margin-bottom: 4px;">Texto para entrada inválida</label>
            <div class="conteudo-text-box">
              <textarea class="conteudo-textarea" id="insp-menu-invalid-msg" rows="3" placeholder="Mensagem de entrada inválida...">${node.data.invalidMessage || 'Opção inválida. Por favor, escolha um dos números acima.'}</textarea>
              <div class="conteudo-format-toolbar">
                <button type="button" class="conteudo-fmt-btn fmt-menu-bold" data-target="insp-menu-invalid-msg" title="Negrito (*)"><strong>B</strong></button>
                <button type="button" class="conteudo-fmt-btn fmt-menu-italic" data-target="insp-menu-invalid-msg" title="Itálico (_)"><em>I</em></button>
                <button type="button" class="conteudo-fmt-btn fmt-menu-strike" data-target="insp-menu-invalid-msg" title="Tachado (~)"><s>S</s></button>
                <button type="button" class="conteudo-fmt-btn var fmt-menu-var" data-target="insp-menu-invalid-msg" title="Inserir Variável">{ }</button>
              </div>
            </div>
            <div class="conteudo-card-actions">
              <button type="button" class="btn-conteudo-cancel" id="btn-cancel-menu-invalid">Cancelar</button>
              <button type="button" class="btn-conteudo-save" id="btn-save-menu-invalid">Salvar</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" style="margin-bottom: 4px;">Limitar a quantidade de erros que depois usam saída adicional</label>
            <select class="form-select" id="insp-menu-max-errors">
              <option value="1" ${node.data.maxErrors === 1 ? 'selected' : ''}>1 tentativa</option>
              <option value="2" ${node.data.maxErrors === 2 ? 'selected' : ''}>2 tentativas</option>
              <option value="3" ${(!node.data.maxErrors || node.data.maxErrors === 3) ? 'selected' : ''}>3 tentativas (Recomendado)</option>
              <option value="5" ${node.data.maxErrors === 5 ? 'selected' : ''}>5 tentativas</option>
            </select>
          </div>
        `}

        <!-- Divisor Respostas -->
        <div class="menu-section-divider">
          <span>Respostas</span>
        </div>

        <!-- Lista de Respostas / Opções -->
        <div id="insp-menu-options-container">
          ${node.data.options.map((opt, i) => `
            <div class="menu-response-card" data-opt-id="${opt.id}">
              <div class="menu-response-header">
                <span>Resposta ${i + 1}</span>
                <button type="button" class="conteudo-btn-action delete btn-delete-menu-opt" data-opt-id="${opt.id}" title="Excluir Opção">
                  <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
              </div>

              <div class="conteudo-text-box">
                <input type="text" class="form-input insp-menu-opt-input" data-opt-id="${opt.id}" value="${opt.label}" placeholder="Texto da opção..." style="border:none; padding:4px 0; background:transparent;" />
                <div class="conteudo-format-toolbar">
                  <button type="button" class="conteudo-fmt-btn fmt-menu-bold" data-target="opt-${opt.id}" title="Negrito (*)"><strong>B</strong></button>
                  <button type="button" class="conteudo-fmt-btn fmt-menu-italic" data-target="opt-${opt.id}" title="Itálico (_)"><em>I</em></button>
                  <button type="button" class="conteudo-fmt-btn fmt-menu-strike" data-target="opt-${opt.id}" title="Tachado (~)"><s>S</s></button>
                  <button type="button" class="conteudo-fmt-btn var fmt-menu-var" data-target="opt-${opt.id}" title="Inserir Variável">{ }</button>
                </div>
              </div>

              <div class="conteudo-card-actions">
                <button type="button" class="btn-conteudo-cancel btn-cancel-menu-opt" data-opt-id="${opt.id}">Cancelar</button>
                <button type="button" class="btn-conteudo-save btn-save-menu-opt" data-opt-id="${opt.id}">Salvar</button>
              </div>

              ${node.data.format === 'list_button' ? `
                <div style="margin-top: 8px;">
                  <label class="form-check-label" style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                    <input type="checkbox" class="chk-menu-desc" data-opt-id="${opt.id}" ${opt.description ? 'checked' : ''} />
                    <span style="font-size:11px; font-weight:500;">Adicionar descrição</span>
                  </label>
                  <div class="menu-desc-wrap" data-opt-id="${opt.id}" style="${opt.description ? 'display:block;' : 'display:none;'} margin-top:6px;">
                    <input type="text" class="form-input insp-menu-desc-input" data-opt-id="${opt.id}" value="${opt.description || ''}" placeholder="Descrição curta (subtítulo do item)..." style="font-size:11px;" />
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <button type="button" class="btn-add-menu-response" id="btn-add-menu-response">
          <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
          <span>Adicionar nova resposta</span>
        </button>

        <!-- Seção: Se usuário não responder -->
        <div class="menu-timeout-card">
          <span class="menu-timeout-title">Se usuário não responder</span>
          <p class="menu-timeout-desc">Mensagem expira em:</p>
          <select class="form-select" id="insp-menu-timeout-days" style="font-size:12px;">
            <option value="1" ${(!node.data.timeoutDays || node.data.timeoutDays === '1') ? 'selected' : ''}>1 Dia</option>
            <option value="2" ${node.data.timeoutDays === '2' ? 'selected' : ''}>2 Dias</option>
            <option value="3" ${node.data.timeoutDays === '3' ? 'selected' : ''}>3 Dias</option>
            <option value="7" ${node.data.timeoutDays === '7' ? 'selected' : ''}>7 Dias</option>
          </select>
          <p class="menu-timeout-desc" style="margin-top:2px;">
            Você pode iniciar outra Automação quando o tempo expirar sem resposta:
          </p>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-menu-connect-timeout" style="width:100%; font-size:11px; gap:6px;">
            <i data-lucide="git-branch" style="width:13px; height:13px; color:var(--primary);"></i>
            <span>Conecte no fluxo (Saída de Inatividade)</span>
          </button>
        </div>
      </div>
    `;
  } else if (node.type === 'message') {
    if (!node.data) node.data = {};
    if (!node.data.items) {
      if (node.data.text) {
        node.data.items = [
          {
            id: `item-${Date.now().toString(36)}-1`,
            type: 'text',
            text: node.data.text,
            saved: true
          }
        ];
      } else {
        node.data.items = [
          {
            id: `item-${Date.now().toString(36)}-1`,
            type: 'text',
            text: '',
            saved: false
          }
        ];
      }
    }

    const items = node.data.items;

    formHtml = `
      <div class="conteudo-panel-wrap">
        <!-- Título do Bloco -->
        <div class="form-group" style="margin-bottom: 2px;">
          <label class="form-label">Título do Bloco</label>
          <input type="text" class="form-input" id="insp-input-title" value="${node.title || 'Conteúdo'}" placeholder="Nome do bloco..." />
        </div>

        <!-- Lista de Mensagens / Mídias Adicionadas -->
        <div class="conteudo-items-container" id="conteudo-items-container">
          ${items.map((item, index) => renderConteudoItemHtml(item, index, items.length)).join('')}
        </div>

        <!-- Grid de 6 Opções de Adição (Texto, Imagem, Video, Arquivo, Audio, Atraso) -->
        <div class="conteudo-add-section">
          <span class="conteudo-add-title">Adicionar Mensagem / Mídia</span>
          <div class="conteudo-add-grid">
            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="text" title="Adicionar Bloco de Texto">
              <div class="conteudo-add-icon">
                <i data-lucide="type" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Texto</span>
            </button>

            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="image" title="Adicionar Imagem">
              <div class="conteudo-add-icon">
                <i data-lucide="image" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Imagem</span>
            </button>

            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="video" title="Adicionar Vídeo">
              <div class="conteudo-add-icon">
                <i data-lucide="video" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Video</span>
            </button>

            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="file" title="Adicionar Arquivo">
              <div class="conteudo-add-icon">
                <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Arquivo</span>
            </button>

            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="audio" title="Adicionar Áudio">
              <div class="conteudo-add-icon">
                <i data-lucide="volume-2" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Audio</span>
            </button>

            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="delay" title="Adicionar Atraso">
              <div class="conteudo-add-icon">
                <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Atraso</span>
            </button>

            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="link" title="Adicionar Link ou Botão">
              <div class="conteudo-add-icon">
                <i data-lucide="link" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Link/Botão</span>
            </button>

            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="location" title="Adicionar Localização">
              <div class="conteudo-add-icon">
                <i data-lucide="map-pin" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Localização</span>
            </button>

            <button type="button" class="conteudo-add-btn btn-add-conteudo-type" data-add-type="contact" title="Adicionar Cartão de Contato">
              <div class="conteudo-add-icon">
                <i data-lucide="contact" style="width: 20px; height: 20px;"></i>
              </div>
              <span class="conteudo-add-label">Contato</span>
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (node.type === 'human') {
    if (!node.data) node.data = {};
    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title || 'Fila Humana'}" />
      </div>

      <div class="form-group">
        <label class="form-label">Departamento de Destino</label>
        <select class="form-select" id="insp-input-target-person">
          <option value="Equipe Comercial" ${node.targetPerson === 'Equipe Comercial' ? 'selected' : ''}>💼 Equipe Comercial / Vendas</option>
          <option value="Suporte Técnico N1" ${node.targetPerson === 'Suporte Técnico N1' ? 'selected' : ''}>🛠️ Suporte Técnico N1</option>
          <option value="Suporte VIP" ${node.targetPerson === 'Suporte VIP' ? 'selected' : ''}>⭐ Atendimento VIP</option>
          <option value="Financeiro" ${node.targetPerson === 'Financeiro' ? 'selected' : ''}>💳 Financeiro / Cobrança</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Prioridade do Ticket</label>
        <select class="form-select" id="insp-input-priority">
          <option value="Normal" ${node.data?.priority === 'Normal' ? 'selected' : ''}>Normal</option>
          <option value="Média" ${node.data?.priority === 'Média' ? 'selected' : ''}>Média</option>
          <option value="Alta" ${(!node.data?.priority || node.data?.priority === 'Alta') ? 'selected' : ''}>🔥 Alta</option>
          <option value="Urgente" ${node.data?.priority === 'Urgente' ? 'selected' : ''}>🚨 Urgente</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Mensagem Automática de Transbordo</label>
        <textarea class="form-textarea" rows="3" id="insp-input-desc" placeholder="Aviso ao cliente">${node.data?.description || 'Transferindo para nossa equipe humana. Aguarde um instante que já vamos te atender!'}</textarea>
      </div>

      <div class="form-group">
        <label class="form-check-label" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" id="insp-input-pause-ai" ${node.data?.pauseAi !== false ? 'checked' : ''} />
          <span style="font-size:12px; font-weight:500;">Pausar Agente de IA para este cliente após transferência</span>
        </label>
      </div>
    `;
  } else if (node.type === 'delay') {
    if (!node.data) node.data = {};
    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title || 'Atraso Inteligente'}" />
      </div>

      <div class="form-group">
        <label class="form-label">Tipo de Espera / Simulação</label>
        <select class="form-select" id="insp-input-delay-type">
          <option value="wait" ${(!node.data?.delayType || node.data?.delayType === 'wait') ? 'selected' : ''}>⏳ Pausa Programada no Fluxo</option>
          <option value="typing" ${node.data?.delayType === 'typing' ? 'selected' : ''}>✍️ Simular "Digitando..." no WhatsApp</option>
          <option value="recording" ${node.data?.delayType === 'recording' ? 'selected' : ''}>🎙️ Simular "Gravando áudio..." no WhatsApp</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Duração do Atraso</label>
        <div style="display:flex; gap:8px;">
          <input type="number" min="1" max="999" class="form-input" id="insp-input-delay-value" value="${node.data?.value || 2}" style="flex:1;" />
          <select class="form-select" id="insp-input-delay-unit" style="flex:1.4;">
            <option value="segundos" ${node.data?.unit === 'segundos' ? 'selected' : ''}>Segundos</option>
            <option value="minutos" ${(!node.data?.unit || node.data?.unit === 'minutos') ? 'selected' : ''}>Minutos</option>
            <option value="horas" ${node.data?.unit === 'horas' ? 'selected' : ''}>Horas</option>
            <option value="dias" ${node.data?.unit === 'dias' ? 'selected' : ''}>Dias</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-check-label" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" id="insp-input-delay-business" ${node.data?.respectBusinessHours ? 'checked' : ''} />
          <span style="font-size:12px; font-weight:500;">Pausar fora do horário comercial (08:00 às 18:00)</span>
        </label>
      </div>

      <div class="form-group">
        <label class="form-check-label" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" id="insp-input-delay-presence" ${node.data?.showPresence !== false ? 'checked' : ''} />
          <span style="font-size:12px; font-weight:500;">Exibir presença online no WhatsApp durante a espera</span>
        </label>
      </div>
    `;
  } else {
    formHtml = `
      <div class="form-group">
        <label class="form-label">Título</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title}" />
      </div>
      <div class="form-group">
        <label class="form-label">Responsável</label>
        <input type="text" class="form-input" id="insp-input-target-person" value="${node.targetPerson || ''}" />
      </div>
    `;
  }

  bodyEl.innerHTML = formHtml;
  if (window.lucide) window.lucide.createIcons();

  // Helper for text formatting (bold, italic, strikethrough)
  function wrapTextInTextarea(txtArea, symbolLeft, symbolRight = symbolLeft) {
    if (!txtArea) return;
    const start = txtArea.selectionStart || 0;
    const end = txtArea.selectionEnd || 0;
    const val = txtArea.value;
    const selected = val.substring(start, end);
    const replacement = selected ? `${symbolLeft}${selected}${symbolRight}` : `${symbolLeft}texto${symbolRight}`;
    txtArea.value = val.substring(0, start) + replacement + val.substring(end);
    txtArea.focus();
    txtArea.selectionStart = start + symbolLeft.length;
    txtArea.selectionEnd = start + replacement.length - symbolRight.length;
    txtArea.dispatchEvent(new Event('input'));
  }

  // Attach interactive events for dynamic controls in Inspector
  if (node.type === 'start') {
    document.getElementById('insp-input-title')?.addEventListener('input', (e) => {
      node.title = e.target.value;
      renderCanvasNodes();
    });
    document.getElementById('insp-input-desc')?.addEventListener('input', (e) => {
      if (!node.data) node.data = {};
      node.data.subtitle = e.target.value;
      renderCanvasNodes();
    });
  }

  if (node.type === 'action') {
    document.getElementById('insp-input-action-type')?.addEventListener('change', (e) => {
      const val = e.target.value;
      node.actionType = val;
      const targetGroup = document.getElementById('insp-transfer-target-group');
      const titleInput = document.getElementById('insp-input-title');
      const labelInput = document.getElementById('insp-input-action-label');

      if (val === 'finish') {
        if (targetGroup) targetGroup.style.display = 'none';
        if (!node.title || node.title === 'Transferir Atendimento' || node.title === 'Ação') {
          node.title = 'Finalizar Atendimento';
          if (titleInput) titleInput.value = node.title;
          if (titleEl) titleEl.textContent = node.title;
        }
        if (!node.actionLabel || node.actionLabel === 'Transferir atendimento') {
          node.actionLabel = 'Finalizar atendimento';
          if (labelInput) labelInput.value = node.actionLabel;
        }
      } else {
        if (targetGroup) targetGroup.style.display = '';
        if (!node.title || node.title === 'Finalizar Atendimento') {
          node.title = 'Transferir Atendimento';
          if (titleInput) titleInput.value = node.title;
          if (titleEl) titleEl.textContent = node.title;
        }
        if (!node.actionLabel || node.actionLabel === 'Finalizar atendimento') {
          node.actionLabel = 'Transferir atendimento';
          if (labelInput) labelInput.value = node.actionLabel;
        }
      }
      renderCanvasNodes();
      if (window.lucide) window.lucide.createIcons();
    });

    document.getElementById('insp-input-transfer-target')?.addEventListener('change', (e) => {
      const parts = e.target.value.split(':');
      node.transferType = parts[0];
      node.transferTarget = parts.slice(1).join(':');
      renderCanvasNodes();
      if (window.lucide) window.lucide.createIcons();
    });

    document.getElementById('insp-input-action-label')?.addEventListener('input', (e) => {
      node.actionLabel = e.target.value;
      renderCanvasNodes();
      if (window.lucide) window.lucide.createIcons();
    });
  }

  if (node.type === 'menu') {
    // 1. Format toggle (Botão de lista vs Número)
    bodyEl.querySelectorAll('input[name="menu-format"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        node.data.format = e.target.value;
        renderCanvasNodes();
        renderAllCables();
        populateInspector(node);
      });
    });

    // 2. Add Response
    document.getElementById('btn-add-menu-response')?.addEventListener('click', () => {
      if (!node.data) node.data = {};
      if (!node.data.options) node.data.options = [];
      const newOptId = `opt-${Date.now().toString(36)}`;
      node.data.options.push({
        id: newOptId,
        label: `Resposta ${node.data.options.length + 1}`,
        description: '',
        ctr: 'CTR 0%'
      });
      renderCanvasNodes();
      renderAllCables();
      populateInspector(node);
      if (window.showToast) window.showToast('Nova resposta adicionada ao menu!');
    });

    // 3. Delete Response
    bodyEl.querySelectorAll('.btn-delete-menu-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const optId = btn.getAttribute('data-opt-id');
        if (!node.data?.options || node.data.options.length <= 1) {
          if (window.showToast) window.showToast('O menu precisa ter pelo menos 1 resposta.');
          return;
        }
        node.data.options = node.data.options.filter(o => o.id !== optId);
        if (currentBot?.canvasFlow?.connections) {
          currentBot.canvasFlow.connections = currentBot.canvasFlow.connections.filter(c =>
            !(c.fromNode === node.id && c.fromPort === optId)
          );
        }
        renderCanvasNodes();
        renderAllCables();
        populateInspector(node);
        if (window.showToast) window.showToast('Resposta removida do menu.');
      });
    });

    // 4. Realtime Question Text
    const questionTextarea = document.getElementById('insp-menu-question');
    if (questionTextarea) {
      questionTextarea.addEventListener('input', () => {
        node.data.question = questionTextarea.value;
        node.data.message = questionTextarea.value;
        renderCanvasNodes();
      });
    }

    // 5. Button Title (quando lista)
    const btnTitleInput = document.getElementById('insp-menu-button-title');
    if (btnTitleInput) {
      btnTitleInput.addEventListener('input', () => {
        node.data.buttonTitle = btnTitleInput.value;
        renderCanvasNodes();
      });
    }

    // 6. Invalid text & Max errors (quando número)
    const invalidTextarea = document.getElementById('insp-menu-invalid-msg');
    if (invalidTextarea) {
      invalidTextarea.addEventListener('input', () => {
        node.data.invalidMessage = invalidTextarea.value;
        renderCanvasNodes();
      });
    }
    const maxErrorsSelect = document.getElementById('insp-menu-max-errors');
    if (maxErrorsSelect) {
      maxErrorsSelect.addEventListener('change', () => {
        node.data.maxErrors = parseInt(maxErrorsSelect.value) || 3;
        renderCanvasNodes();
      });
    }

    // 7. Timeout Days select & Connect Timeout
    const timeoutDaysSelect = document.getElementById('insp-menu-timeout-days');
    if (timeoutDaysSelect) {
      timeoutDaysSelect.addEventListener('change', () => {
        node.data.timeoutDays = timeoutDaysSelect.value;
      });
    }
    document.getElementById('btn-menu-connect-timeout')?.addEventListener('click', () => {
      if (window.showToast) window.showToast('Conecte o ponto "Se usuário não responder" no bloco de destino!');
    });

    // 8. Realtime Option Input & Description sync
    bodyEl.querySelectorAll('.insp-menu-opt-input').forEach(input => {
      input.addEventListener('input', () => {
        const optId = input.getAttribute('data-opt-id');
        const opt = node.data?.options?.find(o => o.id === optId);
        if (opt) {
          opt.label = input.value;
          renderCanvasNodes();
        }
      });
    });

    bodyEl.querySelectorAll('.chk-menu-desc').forEach(chk => {
      chk.addEventListener('change', () => {
        const optId = chk.getAttribute('data-opt-id');
        const wrap = bodyEl.querySelector(`.menu-desc-wrap[data-opt-id="${optId}"]`);
        if (wrap) wrap.style.display = chk.checked ? 'block' : 'none';
        const opt = node.data?.options?.find(o => o.id === optId);
        if (opt && !chk.checked) opt.description = '';
      });
    });

    bodyEl.querySelectorAll('.insp-menu-desc-input').forEach(input => {
      input.addEventListener('input', () => {
        const optId = input.getAttribute('data-opt-id');
        const opt = node.data?.options?.find(o => o.id === optId);
        if (opt) opt.description = input.value;
      });
    });

    // 9. Format buttons (B, I, S, {}) in Menu
    bodyEl.querySelectorAll('.fmt-menu-bold').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const el = targetId.startsWith('opt-') 
          ? bodyEl.querySelector(`.insp-menu-opt-input[data-opt-id="${targetId.replace('opt-', '')}"]`)
          : document.getElementById(targetId);
        wrapTextInTextarea(el, '*');
      });
    });

    bodyEl.querySelectorAll('.fmt-menu-italic').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const el = targetId.startsWith('opt-') 
          ? bodyEl.querySelector(`.insp-menu-opt-input[data-opt-id="${targetId.replace('opt-', '')}"]`)
          : document.getElementById(targetId);
        wrapTextInTextarea(el, '_');
      });
    });

    bodyEl.querySelectorAll('.fmt-menu-strike').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const el = targetId.startsWith('opt-') 
          ? bodyEl.querySelector(`.insp-menu-opt-input[data-opt-id="${targetId.replace('opt-', '')}"]`)
          : document.getElementById(targetId);
        wrapTextInTextarea(el, '~');
      });
    });

    bodyEl.querySelectorAll('.fmt-menu-var').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const el = targetId.startsWith('opt-') 
          ? bodyEl.querySelector(`.insp-menu-opt-input[data-opt-id="${targetId.replace('opt-', '')}"]`)
          : document.getElementById(targetId);
        if (el) {
          const varText = '{nome}';
          const start = el.selectionStart || el.value.length;
          const end = el.selectionEnd || el.value.length;
          el.value = el.value.substring(0, start) + varText + el.value.substring(end);
          el.focus();
          el.selectionStart = el.selectionEnd = start + varText.length;
          el.dispatchEvent(new Event('input'));
          if (window.showToast) window.showToast('Variável {nome} inserida!');
        }
      });
    });

    // 10. Salvar & Cancelar buttons
    bodyEl.querySelectorAll('.btn-save-menu-opt, #btn-save-menu-question, #btn-save-menu-btntitle, #btn-save-menu-invalid').forEach(btn => {
      btn.addEventListener('click', () => {
        renderCanvasNodes();
        renderAllCables();
        if (window.showToast) window.showToast('Salvo com sucesso!');
      });
    });

    bodyEl.querySelectorAll('.btn-cancel-menu-opt, #btn-cancel-menu-question, #btn-cancel-menu-btntitle, #btn-cancel-menu-invalid').forEach(btn => {
      btn.addEventListener('click', () => {
        populateInspector(node);
        if (window.showToast) window.showToast('Alterações descartadas.');
      });
    });
  } else if (node.type === 'ai_agent') {
    // Agent selection change
    document.getElementById('insp-input-agent')?.addEventListener('change', (e) => {
      node.agentName = e.target.value;
      if (currentBot && !currentBot.integratedAiAgents.includes(e.target.value)) {
        currentBot.integratedAiAgents.push(e.target.value);
      }
      renderCanvasNodes();
      renderAllCables();
      populateInspector(node);
      if (window.showToast) window.showToast(`Agente "${e.target.value}" conectado ao bloco!`);
    });

    // Block title change
    document.getElementById('insp-input-title')?.addEventListener('input', (e) => {
      node.title = e.target.value;
      renderCanvasNodes();
    });

    // Timeout select change
    document.getElementById('insp-input-timeout')?.addEventListener('change', (e) => {
      if (!node.data) node.data = {};
      node.data.timeout = e.target.value;
    });

    // Add Branch with smart presets instead of "Condição X"
    document.getElementById('btn-insp-add-branch')?.addEventListener('click', () => {
      if (!node.data) node.data = {};
      if (!node.data.branches) node.data.branches = [];
      const newBranchId = `b-${Date.now().toString(36)}`;

      const presets = [
        { triggerType: 'custom_intent', label: 'Cliente quer orçamento / fechar' },
        { triggerType: 'human_handoff', label: 'Pediu atendente humano' },
        { triggerType: 'goal_reached', label: 'Atendimento concluído pela IA' },
        { triggerType: 'inactivity', label: 'Cliente parou de responder' }
      ];
      const existingTypes = node.data.branches.map(b => b.triggerType);
      const nextPreset = presets.find(p => !existingTypes.includes(p.triggerType)) || {
        triggerType: 'custom_intent',
        label: 'Intenção específica identificada'
      };

      node.data.branches.push({
        id: newBranchId,
        triggerType: nextPreset.triggerType,
        label: nextPreset.label,
        ctr: '0%'
      });
      renderCanvasNodes();
      renderAllCables();
      populateInspector(node);
      if (window.showToast) window.showToast('Novo caminho de saída adicionado!');
    });

    // Trigger Type Select change
    bodyEl.querySelectorAll('.insp-branch-trigger-select').forEach(select => {
      select.addEventListener('change', () => {
        const branchId = select.getAttribute('data-branch-id');
        const branch = node.data?.branches?.find(b => b.id === branchId);
        if (!branch) return;

        branch.triggerType = select.value;
        const defaultLabelsByType = {
          goal_reached: 'Atendimento concluído pela IA',
          human_handoff: 'Pediu atendente humano',
          custom_intent: 'Cliente quer orçamento / fechar',
          inactivity: 'Cliente parou de responder'
        };
        if (defaultLabelsByType[select.value]) {
          branch.label = defaultLabelsByType[select.value];
        }

        renderCanvasNodes();
        renderAllCables();
        populateInspector(node);
      });
    });

    // Delete Branch
    bodyEl.querySelectorAll('.insp-btn-delete-branch').forEach(btn => {
      btn.addEventListener('click', () => {
        const branchId = btn.getAttribute('data-branch-id');
        if (!node.data?.branches || node.data.branches.length <= 1) {
          if (window.showToast) window.showToast('O assistente precisa ter pelo menos 1 saída.');
          return;
        }
        node.data.branches = node.data.branches.filter(b => b.id !== branchId);
        if (currentBot?.canvasFlow?.connections) {
          currentBot.canvasFlow.connections = currentBot.canvasFlow.connections.filter(c =>
            !(c.fromNode === node.id && c.fromPort === branchId)
          );
        }
        renderCanvasNodes();
        renderAllCables();
        populateInspector(node);
        if (window.showToast) window.showToast('Condição de saída removida.');
      });
    });

    // Realtime branch input sync
    bodyEl.querySelectorAll('.insp-branch-input').forEach(input => {
      input.addEventListener('input', () => {
        const branchId = input.getAttribute('data-branch-id');
        const branch = node.data?.branches?.find(b => b.id === branchId);
        if (branch) {
          branch.label = input.value;
          const branchEl = document.querySelector(`#canvas-node-${node.id} [data-port-id="${branchId}"]`)?.closest('.node-branch-item');
          if (branchEl) {
            const labelEl = branchEl.querySelector('.branch-label');
            if (labelEl) labelEl.textContent = branch.label;
          }
        }
      });
    });
  } else if (node.type === 'action') {
    document.getElementById('insp-input-title')?.addEventListener('input', (e) => {
      node.title = e.target.value;
      renderCanvasNodes();
    });

    document.getElementById('insp-input-action-label')?.addEventListener('input', (e) => {
      node.actionLabel = e.target.value;
      renderCanvasNodes();
    });

    document.getElementById('insp-input-transfer-target')?.addEventListener('change', (e) => {
      const parts = e.target.value.split(':');
      node.transferType = parts[0];
      node.transferTarget = parts.slice(1).join(':');
      node.actionType = 'transfer';
      renderCanvasNodes();
      populateInspector(node);
      if (window.showToast) window.showToast(`Destino alterado para ${node.transferTarget}!`);
    });
  } else if (node.type === 'delay') {
    // Delay type toggle
    document.getElementById('insp-input-delay-type')?.addEventListener('change', (e) => {
      const unitSelect = document.getElementById('insp-input-delay-unit');
      const valInput = document.getElementById('insp-input-delay-value');
      if (e.target.value === 'typing' || e.target.value === 'recording') {
        if (unitSelect) unitSelect.value = 'segundos';
        if (valInput && (Number(valInput.value) > 30 || Number(valInput.value) <= 0)) valInput.value = '4';
      } else {
        if (unitSelect) unitSelect.value = 'minutos';
        if (valInput && Number(valInput.value) < 1) valInput.value = '2';
      }
    });
  } else if (node.type === 'message') {
    if (!node.data) node.data = {};
    if (!node.data.items) node.data.items = [];

    // 1. Botões de Adicionar Novo Tipo de Mensagem (Grid de 6 Opções)
    bodyEl.querySelectorAll('.btn-add-conteudo-type').forEach(btn => {
      btn.addEventListener('click', () => {
        const addType = btn.getAttribute('data-add-type');
        const newId = `item-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

        let newItem = { id: newId, type: addType };

        if (addType === 'text') {
          newItem.text = '';
          newItem.saved = false;
        } else if (addType === 'image') {
          newItem.url = '';
          newItem.caption = '';
          newItem.fileName = '';
        } else if (addType === 'video') {
          newItem.fileName = '';
          newItem.caption = '';
          newItem.fileSize = '';
        } else if (addType === 'file') {
          newItem.fileName = '';
          newItem.fileSize = '';
        } else if (addType === 'audio') {
          newItem.fileName = '';
          newItem.simulatedVoice = true;
        } else if (addType === 'delay') {
          newItem.seconds = 3;
          newItem.typing = true;
        } else if (addType === 'link') {
          newItem.buttonText = 'Acessar Site';
          newItem.url = 'https://';
        } else if (addType === 'location') {
          newItem.locationName = 'Nossa Unidade';
          newItem.address = '';
        } else if (addType === 'contact') {
          newItem.contactName = 'Consultor ZapChat';
          newItem.contactPhone = '+55 11 99999-9999';
        }

        node.data.items.push(newItem);
        renderCanvasNodes();
        renderAllCables();
        populateInspector(node);

        // Auto-scroll to newly added block
        const container = document.getElementById('conteudo-items-container');
        if (container) {
          const lastCard = container.querySelector(`[data-item-id="${newId}"]`);
          if (lastCard) {
            lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            const textarea = lastCard.querySelector('textarea');
            if (textarea) textarea.focus();
          }
        }

        if (window.showToast) window.showToast(`Novo bloco de ${addType} adicionado!`);
      });
    });

    // 2. Excluir Bloco de Mensagem
    bodyEl.querySelectorAll('.btn-delete-conteudo-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.getAttribute('data-item-id');
        node.data.items = node.data.items.filter(i => i.id !== itemId);
        renderCanvasNodes();
        renderAllCables();
        populateInspector(node);
        if (window.showToast) window.showToast('Item removido do conteúdo.');
      });
    });

    // 3. Reordenar Itens (Mover para Cima e para Baixo)
    bodyEl.querySelectorAll('.btn-move-item-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.getAttribute('data-item-id');
        const idx = node.data.items.findIndex(i => i.id === itemId);
        if (idx > 0) {
          const temp = node.data.items[idx];
          node.data.items[idx] = node.data.items[idx - 1];
          node.data.items[idx - 1] = temp;
          renderCanvasNodes();
          renderAllCables();
          populateInspector(node);
        }
      });
    });

    bodyEl.querySelectorAll('.btn-move-item-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.getAttribute('data-item-id');
        const idx = node.data.items.findIndex(i => i.id === itemId);
        if (idx !== -1 && idx < node.data.items.length - 1) {
          const temp = node.data.items[idx];
          node.data.items[idx] = node.data.items[idx + 1];
          node.data.items[idx + 1] = temp;
          renderCanvasNodes();
          renderAllCables();
          populateInspector(node);
        }
      });
    });

    // 4. Formatação de Texto (Bold, Italic, Strikethrough, Variáveis)
    function wrapTextInTextarea(txtArea, symbolLeft, symbolRight = symbolLeft) {
      if (!txtArea) return;
      const start = txtArea.selectionStart || 0;
      const end = txtArea.selectionEnd || 0;
      const val = txtArea.value;
      const selected = val.substring(start, end);
      const replacement = selected ? `${symbolLeft}${selected}${symbolRight}` : `${symbolLeft}texto${symbolRight}`;
      txtArea.value = val.substring(0, start) + replacement + val.substring(end);
      txtArea.focus();
      txtArea.selectionStart = start + symbolLeft.length;
      txtArea.selectionEnd = start + replacement.length - symbolRight.length;
      txtArea.dispatchEvent(new Event('input'));
    }

    bodyEl.querySelectorAll('.fmt-bold').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-item-id');
        const txtArea = bodyEl.querySelector(`textarea[data-item-id="${itemId}"]`);
        wrapTextInTextarea(txtArea, '*');
      });
    });

    bodyEl.querySelectorAll('.fmt-italic').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-item-id');
        const txtArea = bodyEl.querySelector(`textarea[data-item-id="${itemId}"]`);
        wrapTextInTextarea(txtArea, '_');
      });
    });

    bodyEl.querySelectorAll('.fmt-strike').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-item-id');
        const txtArea = bodyEl.querySelector(`textarea[data-item-id="${itemId}"]`);
        wrapTextInTextarea(txtArea, '~');
      });
    });

    bodyEl.querySelectorAll('.fmt-brackets').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-item-id');
        const txtArea = bodyEl.querySelector(`textarea[data-item-id="${itemId}"]`);
        if (txtArea) {
          const varText = '{nome}';
          const start = txtArea.selectionStart || txtArea.value.length;
          const end = txtArea.selectionEnd || txtArea.value.length;
          txtArea.value = txtArea.value.substring(0, start) + varText + txtArea.value.substring(end);
          txtArea.focus();
          txtArea.selectionStart = txtArea.selectionEnd = start + varText.length;
          txtArea.dispatchEvent(new Event('input'));
          if (window.showToast) window.showToast('Variável {nome} inserida!');
        }
      });
    });

    // 5. Botões Salvar e Cancelar do Bloco de Texto
    bodyEl.querySelectorAll('.btn-conteudo-save').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-item-id');
        const card = bodyEl.querySelector(`.conteudo-item-card[data-item-id="${itemId}"]`);
        const item = node.data.items.find(i => i.id === itemId);
        const txtArea = card?.querySelector('.conteudo-textarea');
        if (item && txtArea) {
          item.text = txtArea.value.trim();
          item.saved = true;
          card.classList.remove('editing');
          renderCanvasNodes();
          renderAllCables();
          if (window.showToast) window.showToast('Mensagem salva com sucesso!');
        }
      });
    });

    bodyEl.querySelectorAll('.btn-conteudo-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-item-id');
        const item = node.data.items.find(i => i.id === itemId);
        if (item) {
          if (!item.text || !item.text.trim()) {
            node.data.items = node.data.items.filter(i => i.id !== itemId);
            renderCanvasNodes();
            renderAllCables();
            populateInspector(node);
          } else {
            const card = bodyEl.querySelector(`.conteudo-item-card[data-item-id="${itemId}"]`);
            const txtArea = card?.querySelector('.conteudo-textarea');
            if (txtArea) txtArea.value = item.text;
            card?.classList.remove('editing');
            if (window.showToast) window.showToast('Edição cancelada.');
          }
        }
      });
    });

    // 6. Atualização em Tempo Real do Textarea
    bodyEl.querySelectorAll('.conteudo-textarea').forEach(txt => {
      txt.addEventListener('input', () => {
        const itemId = txt.getAttribute('data-item-id');
        const item = node.data.items.find(i => i.id === itemId);
        const card = txt.closest('.conteudo-item-card');
        if (card) card.classList.add('editing');
        if (item) {
          item.text = txt.value;
          item.saved = false;
          // Sync directly to first text on node for compatibility
          const firstText = node.data.items.find(i => i.type === 'text');
          if (firstText) node.data.text = firstText.text;
          renderCanvasNodes();
        }
      });
    });

    // 7. Gatilho de Upload para Imagem, Vídeo, Arquivo e Áudio
    bodyEl.querySelectorAll('.btn-upload-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const itemId = trigger.getAttribute('data-item-id');
        const fileInput = bodyEl.querySelector(`.conteudo-file-input[data-item-id="${itemId}"]`);
        if (fileInput) fileInput.click();
      });
    });

    bodyEl.querySelectorAll('.conteudo-file-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const itemId = input.getAttribute('data-item-id');
        const item = node.data.items.find(i => i.id === itemId);
        const file = e.target.files && e.target.files[0];
        if (!file || !item) return;

        item.fileName = file.name;
        item.fileSize = (file.size / 1024 / 1024).toFixed(1) + 'MB';

        if (item.type === 'image') {
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            item.url = loadEvt.target.result;
            renderCanvasNodes();
            renderAllCables();
            populateInspector(node);
            if (window.showToast) window.showToast('Imagem carregada com sucesso!');
          };
          reader.readAsDataURL(file);
        } else {
          renderCanvasNodes();
          renderAllCables();
          populateInspector(node);
          if (window.showToast) window.showToast(`${item.type.toUpperCase()}: ${file.name} carregado!`);
        }
      });
    });

    // 8. Legendas de Mídias e Atraso em Tempo Real
    bodyEl.querySelectorAll('.conteudo-caption-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const itemId = inp.getAttribute('data-item-id');
        const item = node.data.items.find(i => i.id === itemId);
        if (item) {
          item.caption = inp.value;
          renderCanvasNodes();
        }
      });
    });

    bodyEl.querySelectorAll('.conteudo-delay-seconds').forEach(inp => {
      inp.addEventListener('input', () => {
        const itemId = inp.getAttribute('data-item-id');
        const item = node.data.items.find(i => i.id === itemId);
        if (item) {
          item.seconds = Math.max(1, parseInt(inp.value) || 3);
          renderCanvasNodes();
        }
      });
    });

    bodyEl.querySelectorAll('.conteudo-delay-typing').forEach(chk => {
      chk.addEventListener('change', () => {
        const itemId = chk.getAttribute('data-item-id');
        const item = node.data.items.find(i => i.id === itemId);
        if (item) {
          item.typing = chk.checked;
          renderCanvasNodes();
        }
      });
    });

    bodyEl.querySelectorAll('.conteudo-audio-ptt').forEach(chk => {
      chk.addEventListener('change', () => {
        const itemId = chk.getAttribute('data-item-id');
        const item = node.data.items.find(i => i.id === itemId);
        if (item) {
          item.simulatedVoice = chk.checked;
        }
      });
    });

    // 9. Link/Botão, Localização e Contato em Tempo Real
    bodyEl.querySelectorAll('.conteudo-link-text').forEach(inp => {
      inp.addEventListener('input', () => {
        const item = node.data.items.find(i => i.id === inp.getAttribute('data-item-id'));
        if (item) { item.buttonText = inp.value; renderCanvasNodes(); if (window.lucide) window.lucide.createIcons(); }
      });
    });
    bodyEl.querySelectorAll('.conteudo-link-url').forEach(inp => {
      inp.addEventListener('input', () => {
        const item = node.data.items.find(i => i.id === inp.getAttribute('data-item-id'));
        if (item) { item.url = inp.value; renderCanvasNodes(); if (window.lucide) window.lucide.createIcons(); }
      });
    });
    bodyEl.querySelectorAll('.conteudo-loc-name').forEach(inp => {
      inp.addEventListener('input', () => {
        const item = node.data.items.find(i => i.id === inp.getAttribute('data-item-id'));
        if (item) { item.locationName = inp.value; renderCanvasNodes(); if (window.lucide) window.lucide.createIcons(); }
      });
    });
    bodyEl.querySelectorAll('.conteudo-loc-address').forEach(inp => {
      inp.addEventListener('input', () => {
        const item = node.data.items.find(i => i.id === inp.getAttribute('data-item-id'));
        if (item) { item.address = inp.value; renderCanvasNodes(); if (window.lucide) window.lucide.createIcons(); }
      });
    });
    bodyEl.querySelectorAll('.conteudo-contact-name').forEach(inp => {
      inp.addEventListener('input', () => {
        const item = node.data.items.find(i => i.id === inp.getAttribute('data-item-id'));
        if (item) { item.contactName = inp.value; renderCanvasNodes(); if (window.lucide) window.lucide.createIcons(); }
      });
    });
    bodyEl.querySelectorAll('.conteudo-contact-phone').forEach(inp => {
      inp.addEventListener('input', () => {
        const item = node.data.items.find(i => i.id === inp.getAttribute('data-item-id'));
        if (item) { item.contactPhone = inp.value; renderCanvasNodes(); if (window.lucide) window.lucide.createIcons(); }
      });
    });
  }
}

/**
 * Setup Inspector Save & Close buttons
 */
function setupInspectorDrawer() {
  document.getElementById('btn-inspector-close')?.addEventListener('click', () => {
    closeInspector();
  });

  document.getElementById('btn-inspector-delete')?.addEventListener('click', () => {
    if (!selectedNodeId || !currentBot) return;

    if (selectedNodeId === 'node-start') {
      if (window.showToast) window.showToast('O Bloco Inicial não pode ser excluído.');
      return;
    }

    const idx = currentBot.canvasFlow.nodes.findIndex(n => n.id === selectedNodeId);
    if (idx !== -1) {
      currentBot.canvasFlow.nodes.splice(idx, 1);
      currentBot.canvasFlow.connections = currentBot.canvasFlow.connections.filter(c =>
        c.fromNode !== selectedNodeId && c.toNode !== selectedNodeId
      );

      closeInspector();
      renderCanvasNodes();
      renderAllCables();
      if (window.showToast) window.showToast('Bloco excluído com sucesso');
    }
  });

  document.getElementById('btn-inspector-apply')?.addEventListener('click', () => {
    applyInspectorChanges();
  });
}

/**
 * Apply changes from Inspector form to node in data model
 */
function applyInspectorChanges() {
  if (!selectedNodeId || !currentBot) return;
  const node = currentBot.canvasFlow.nodes.find(n => n.id === selectedNodeId);
  if (!node) return;

  const titleInput = document.getElementById('insp-input-title');
  if (titleInput) node.title = titleInput.value.trim();

  if (node.type === 'start') {
    const descInput = document.getElementById('insp-input-desc');
    if (!node.data) node.data = {};
    if (descInput) node.data.subtitle = descInput.value.trim();
  } else if (node.type === 'ai_agent') {
    const agentSelect = document.getElementById('insp-input-agent');
    const timeoutSelect = document.getElementById('insp-input-timeout');
    if (!node.data) node.data = {};
    if (agentSelect) {
      node.agentName = agentSelect.value;
      if (!currentBot.integratedAiAgents.includes(agentSelect.value)) {
        currentBot.integratedAiAgents.push(agentSelect.value);
      }
    }
    if (timeoutSelect) node.data.timeout = timeoutSelect.value;

    document.querySelectorAll('.insp-branch-input').forEach(inp => {
      const bId = inp.getAttribute('data-branch-id');
      const b = node.data?.branches?.find(item => item.id === bId);
      if (b) b.label = inp.value.trim();
    });
  } else if (node.type === 'action') {
    const actionTypeSelect = document.getElementById('insp-input-action-type');
    const labelInput = document.getElementById('insp-input-action-label');
    const targetSelect = document.getElementById('insp-input-transfer-target');
    if (!node.data) node.data = {};
    node.actionType = actionTypeSelect ? actionTypeSelect.value : (node.actionType || 'transfer');
    if (labelInput) node.actionLabel = labelInput.value.trim();
    if (node.actionType === 'transfer' && targetSelect) {
      const parts = targetSelect.value.split(':');
      node.transferType = parts[0];
      node.transferTarget = parts.slice(1).join(':');
    }
  } else if (node.type === 'menu') {
    if (!node.data) node.data = {};
    const formatRadio = document.querySelector('input[name="menu-format"]:checked');
    if (formatRadio) node.data.format = formatRadio.value;

    const questionInput = document.getElementById('insp-menu-question') || document.getElementById('insp-input-message');
    if (questionInput) {
      node.data.question = questionInput.value.trim();
      node.data.message = questionInput.value.trim();
    }

    const btnTitleInput = document.getElementById('insp-menu-button-title');
    if (btnTitleInput) node.data.buttonTitle = btnTitleInput.value.trim();

    const invalidInput = document.getElementById('insp-menu-invalid-msg') || document.getElementById('insp-input-invalid-msg');
    if (invalidInput) node.data.invalidMessage = invalidInput.value.trim();

    const maxErrorsSelect = document.getElementById('insp-menu-max-errors');
    if (maxErrorsSelect) node.data.maxErrors = parseInt(maxErrorsSelect.value) || 3;

    const timeoutDaysSelect = document.getElementById('insp-menu-timeout-days') || document.getElementById('insp-input-timeout');
    if (timeoutDaysSelect) node.data.timeoutDays = timeoutDaysSelect.value;

    document.querySelectorAll('.insp-menu-opt-input, .insp-option-input').forEach(inp => {
      const optId = inp.getAttribute('data-opt-id');
      const opt = node.data?.options?.find(item => item.id === optId);
      if (opt) opt.label = inp.value.trim();
    });

    document.querySelectorAll('.insp-menu-desc-input').forEach(inp => {
      const optId = inp.getAttribute('data-opt-id');
      const opt = node.data?.options?.find(item => item.id === optId);
      if (opt) opt.description = inp.value.trim();
    });

    document.querySelectorAll('.chk-menu-desc').forEach(chk => {
      const optId = chk.getAttribute('data-opt-id');
      const opt = node.data?.options?.find(item => item.id === optId);
      if (opt && !chk.checked) opt.description = '';
    });
  } else if (node.type === 'message') {
    if (!node.data) node.data = {};
    if (!node.data.items) node.data.items = [];

    document.querySelectorAll('.conteudo-item-card[data-item-id]').forEach(card => {
      const itemId = card.getAttribute('data-item-id');
      const item = node.data.items.find(i => i.id === itemId);
      if (!item) return;

      if (item.type === 'text') {
        const txtArea = card.querySelector('.conteudo-textarea');
        if (txtArea) {
          item.text = txtArea.value;
          item.saved = true;
        }
      } else if (item.type === 'image' || item.type === 'video') {
        const captionInp = card.querySelector('.conteudo-caption-input');
        if (captionInp) item.caption = captionInp.value;
      } else if (item.type === 'audio') {
        const pttChk = card.querySelector('.conteudo-audio-ptt');
        if (pttChk) item.simulatedVoice = pttChk.checked;
      } else if (item.type === 'delay') {
        const secInp = card.querySelector('.conteudo-delay-seconds');
        const typChk = card.querySelector('.conteudo-delay-typing');
        if (secInp) item.seconds = parseInt(secInp.value) || 3;
        if (typChk) item.typing = typChk.checked;
      }
    });

    const firstText = node.data.items.find(i => i.type === 'text');
    if (firstText) node.data.text = firstText.text;
  } else if (node.type === 'human') {
    const targetSelect = document.getElementById('insp-input-target-person');
    const prioritySelect = document.getElementById('insp-input-priority');
    const descInput = document.getElementById('insp-input-desc');
    const pauseAiCheck = document.getElementById('insp-input-pause-ai');
    if (!node.data) node.data = {};
    if (targetSelect) node.targetPerson = targetSelect.value;
    if (prioritySelect) node.data.priority = prioritySelect.value;
    if (descInput) node.data.description = descInput.value.trim();
    if (pauseAiCheck) node.data.pauseAi = pauseAiCheck.checked;
  } else if (node.type === 'delay') {
    const delayTypeSelect = document.getElementById('insp-input-delay-type');
    const valInput = document.getElementById('insp-input-delay-value');
    const unitSelect = document.getElementById('insp-input-delay-unit');
    const businessCheck = document.getElementById('insp-input-delay-business');
    const presenceCheck = document.getElementById('insp-input-delay-presence');
    if (!node.data) node.data = {};
    if (delayTypeSelect) node.data.delayType = delayTypeSelect.value;
    if (valInput) node.data.value = Math.max(1, parseInt(valInput.value) || 2);
    if (unitSelect) node.data.unit = unitSelect.value;
    if (businessCheck) node.data.respectBusinessHours = businessCheck.checked;
    if (presenceCheck) node.data.showPresence = presenceCheck.checked;
  }

  renderCanvasNodes();
  cachePortOffsets();
  renderAllCables();
  if (window.showToast) window.showToast(`Alterações salvas no bloco "${node.title}"!`);
}

/**
 * Setup Right Floating Dock (drag-and-drop or click to create nodes)
 */
function setupDockDragDrop() {
  const dock = document.getElementById('builder-dock');
  const viewport = document.getElementById('builder-canvas-viewport');
  const world = document.getElementById('builder-canvas-world');
  if (!dock || !viewport || !world) return;

  const toggleBtn = document.getElementById('btn-dock-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      dock.classList.toggle('minimized');
    });
  }

  dock.querySelectorAll('.dock-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.getAttribute('data-node-type');
      const posX = Math.round((-panX + 500) / zoom);
      const posY = Math.round((-panY + 250) / zoom);
      spawnNewNode(type, posX, posY);
    });

    item.addEventListener('dragstart', (e) => {
      const type = item.getAttribute('data-node-type');
      e.dataTransfer.setData('application/zapchat-node-type', type);
    });
  });

  viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/zapchat-node-type');
    if (!type) return;

    const worldRect = world.getBoundingClientRect();
    const x = Math.round((e.clientX - worldRect.left) / zoom);
    const y = Math.round((e.clientY - worldRect.top) / zoom);
    spawnNewNode(type, x, y);
  });
}

/**
 * Spawn a new node into the flow
 */
function spawnNewNode(type, x, y) {
  if (!currentBot) return;

  const newId = `node-${type}-${Date.now().toString(36)}`;
  let newNode = null;

  if (type === 'ai_agent') {
    const agentsList = zapChatData?.agentes?.list || [];
    const defaultAgent = agentsList.length > 0 ? agentsList[0] : { name: 'Pedro', role: 'Atendimento geral' };

    newNode = {
      id: newId,
      type: 'ai_agent',
      title: 'Agente de IA',
      agentName: defaultAgent.name,
      agentRole: defaultAgent.role || 'Atendimento Geral',
      executions: 0,
      x,
      y,
      data: {
        method: 'Agente de IA Conversacional',
        branches: [
          { id: 'b-success', label: 'Resposta bem-sucedida', ctr: '100%' },
          { id: 'b-inactivity', label: 'Inatividade (15 min)', ctr: '0%' },
          { id: 'b-human', label: 'Transbordo Humano', ctr: '0%' }
        ]
      }
    };
  } else if (type === 'action') {
    newNode = {
      id: newId,
      type: 'action',
      title: 'Transferir Atendimento',
      actionType: 'transfer',
      actionLabel: 'Transferir atendimento',
      transferType: 'human',
      transferTarget: 'Carlos Félix',
      x,
      y,
      data: { description: 'Transferência de atendimento' }
    };
  } else if (type === 'menu') {
    newNode = {
      id: newId,
      type: 'menu',
      title: 'Menu',
      executions: 0,
      clickRate: '0%',
      x,
      y,
      data: {
        format: 'list_button',
        question: 'Texto da pergunta',
        message: 'Texto da pergunta',
        buttonTitle: 'VER OPÇÕES',
        invalidMessage: 'Opção inválida. Por favor, escolha um dos números acima.',
        maxErrors: 3,
        timeoutDays: '1',
        options: [
          { id: `opt-${Date.now().toString(36)}-1`, label: 'Resposta 1', description: '', ctr: 'CTR 0%' }
        ]
      }
    };
  } else if (type === 'message') {
    newNode = {
      id: newId,
      type: 'message',
      title: 'Conteúdo',
      x,
      y,
      data: {
        items: [
          {
            id: `item-${Date.now().toString(36)}-1`,
            type: 'text',
            text: 'Olá! Seja muito bem-vindo ao nosso atendimento.',
            saved: true
          }
        ]
      }
    };
  } else if (type === 'human') {
    newNode = {
      id: newId,
      type: 'human',
      title: 'Fila Humana',
      actionType: 'transfer_human',
      targetPerson: 'Fila Geral',
      x,
      y,
      data: { description: 'Transferência para equipe humana' }
    };
  } else if (type === 'delay') {
    newNode = {
      id: newId,
      type: 'delay',
      title: 'Atraso Inteligente',
      x,
      y,
      data: {
        delayType: 'wait',
        value: 2,
        unit: 'minutos',
        respectBusinessHours: true,
        showPresence: true
      }
    };
  } else {
    newNode = {
      id: newId,
      type: 'delay',
      title: 'Atraso Inteligente',
      x,
      y,
      data: {
        delayType: 'wait',
        value: 2,
        unit: 'minutos',
        respectBusinessHours: true,
        showPresence: true
      }
    };
  }

  currentBot.canvasFlow.nodes.push(newNode);
  renderCanvasNodes();
  renderAllCables();
  selectNode(newId);

  if (window.showToast) window.showToast(`Bloco "${newNode.title}" adicionado!`);
}

/**
 * Save canvas flow back to data model
 */
function saveCanvasFlow() {
  if (!currentBot) return;

  const inputEl = document.getElementById('builder-bot-name-input');
  const wrapper = document.getElementById('builder-title-wrapper');
  if (wrapper?.classList.contains('is-editing') && inputEl) {
    const newName = inputEl.value.trim();
    if (newName) {
      currentBot.name = newName;
      const nameEl = document.getElementById('builder-bot-name');
      if (nameEl) nameEl.textContent = newName;
      const botInList = zapChatData?.chatbots?.list?.find(b => b.id === currentBot.id);
      if (botInList) botInList.name = newName;
      if (window.renderChatbotsList) window.renderChatbotsList();
    }
    wrapper.classList.remove('is-editing');
    inputEl.style.display = 'none';
  }

  currentBot.updatedAt = 'Agora mesmo';
  currentBot.stepsCount = currentBot.canvasFlow.nodes.length;

  if (window.showToast) {
    window.showToast(`Fluxo do chatbot "${currentBot.name}" salvo com sucesso!`);
  }
}

function getNodeTypeLabel(type) {
  const map = {
    start: 'Gatilho de Entrada',
    ai_agent: 'Agente de Inteligência Artificial',
    menu: 'Menu Interativo',
    action: 'Ação Automatizada',
    message: 'Conteúdo (Texto, Mídia e Atraso)',
    human: 'Fila Humana',
    condition: 'Condição Lógica',
    delay: 'Atraso / Espera'
  };
  return map[type] || 'Bloco';
}
