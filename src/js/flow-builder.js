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
          title: 'Menu de Nicho',
          x: 400,
          y: 160,
          data: {
            message: 'Opa, tudo bem? Vi que tem interesse em transformar o atendimento do seu negócio! Qual é o seu segmento?',
            options: [
              { id: 'opt-2-1', label: 'E-commerce / Varejo' },
              { id: 'opt-2-2', label: 'Serviços / Consultório' }
            ]
          }
        },
        {
          id: 'node-ai-felipe',
          type: 'ai_agent',
          title: 'Assistente IA Vendas',
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
          title: 'Assistente IA Triagem',
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
        x: 60,
        y: 200,
        data: {
          subtitle: 'Seu fluxo começa por este bloco. Conecte-o com outro bloco.',
          trigger: bot.trigger || 'Primeira mensagem recebida',
          channel: bot.channel || 'WhatsApp'
        }
      },
      {
        id: 'node-ai-main',
        type: 'ai_agent',
        title: 'Assistente GPT',
        agentName: primaryAgent,
        agentRole: 'Especialista Virtual ZapChat',
        executions: bot.executions || 1240,
        x: 420,
        y: 120,
        data: {
          method: 'Assistente de IA',
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
        title: 'Ação',
        actionType: 'restart',
        actionLabel: 'Reiniciar automação',
        x: 880,
        y: 60,
        data: {
          description: 'Reinicia o fluxo após período de inatividade'
        }
      },
      {
        id: 'node-action-crm',
        type: 'action',
        title: 'Ação',
        actionType: 'crm_deal',
        actionLabel: 'Atribuir e abrir atendimento',
        targetPerson: 'Carlos Félix',
        x: 880,
        y: 260,
        data: {
          description: 'Cria oportunidade no CRM e notifica consultor'
        }
      },
      {
        id: 'node-action-human',
        type: 'human',
        title: 'Fila Humana',
        actionType: 'transfer_human',
        actionLabel: 'Fila de Atendimento Humano',
        targetPerson: 'Equipe Comercial',
        x: 880,
        y: 440,
        data: {
          description: 'Transfere conversa para operador humano disponível'
        }
      }
    ],
    connections: [
      { id: 'c-1', fromNode: 'node-start', fromPort: 'out', toNode: 'node-ai-main', toPort: 'in' },
      { id: 'c-2', fromNode: 'node-ai-main', fromPort: 'b-inactivity', toNode: 'node-action-restart', toPort: 'in' },
      { id: 'c-3', fromNode: 'node-ai-main', fromPort: 'b-success', toNode: 'node-action-crm', toPort: 'in' },
      { id: 'c-4', fromNode: 'node-ai-main', fromPort: 'b-human', toNode: 'node-action-human', toPort: 'in' }
    ]
  };
}

/**
 * Render Topbar Info
 */
function renderBuilderTopbar() {
  const nameEl = document.getElementById('builder-bot-name');
  const channelBadgeEl = document.getElementById('builder-channel-badge');
  const statusBadgeEl = document.getElementById('builder-status-badge');

  if (nameEl) nameEl.textContent = currentBot.name;

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
          <div class="node-trigger-pill">
            <i data-lucide="zap" style="width: 11px; height: 11px;"></i>
            <span>${node.data?.trigger || 'Primeira mensagem'}</span>
          </div>
        </div>
        <div class="node-port port-out" data-node-id="${node.id}" data-port-id="out" data-port-type="out" title="Conectar ao próximo bloco">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>
      </div>
    `;
  } else if (node.type === 'ai_agent') {
    const branches = node.data?.branches || [
      { id: 'b-success', label: 'Resposta bem-sucedida', ctr: '82%' },
      { id: 'b-inactivity', label: 'Inatividade (30 min)', ctr: '0%' },
      { id: 'b-human', label: 'Solicitação de atendente', ctr: '12%' },
      { id: 'b-stop', label: 'Condição de parada', ctr: '6%' }
    ];

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
            <span class="node-header-title">${node.agentName || 'Assistente GPT'}</span>
            <span class="node-header-badge">${node.executions || 1240} Enviado</span>
          </div>
        </div>

        <div class="node-body">
          <div class="node-meta-row">
            <span class="node-meta-label">Método</span>
            <span class="node-meta-val">${node.data?.method || 'Assistente de IA'}</span>
          </div>
          <div class="node-meta-block">
            <span class="node-meta-label">Instruções do assistente</span>
            <p class="node-instructions-preview">${(node.data?.instructions || 'Você é a IA especialista...').substring(0, 75)}...</p>
          </div>

          <div class="node-branches-list">
            ${branches.map(b => `
              <div class="node-branch-item">
                <span class="branch-label">${b.label}</span>
                <span class="branch-ctr">${b.ctr || '0%'}</span>
                <div class="node-port port-out-branch" data-node-id="${node.id}" data-port-id="${b.id}" data-port-type="out" title="Conectar saída: ${b.label}">
                  <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (node.type === 'action') {
    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon action">
            <i data-lucide="zap" style="width: 14px; height: 14px;"></i>
          </div>
          <span class="node-header-title">${node.title || 'Ação'}</span>
        </div>

        <div class="node-body">
          <div class="node-action-card">
            <span>${node.actionLabel || 'Ação Automatizada'}</span>
            ${node.targetPerson ? `<strong class="node-target-tag">${node.targetPerson}</strong>` : ''}
          </div>
        </div>

        <div class="node-port port-out" data-node-id="${node.id}" data-port-id="out" data-port-type="out" title="Próximo passo">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>
      </div>
    `;
  } else if (node.type === 'menu') {
    const options = node.data?.options || [
      { id: 'opt-1', label: 'Opção 1' },
      { id: 'opt-2', label: 'Opção 2' }
    ];

    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon menu">
            <i data-lucide="layout-list" style="width: 14px; height: 14px;"></i>
          </div>
          <span class="node-header-title">${node.title || 'Menu de Opções'}</span>
        </div>

        <div class="node-body">
          <p class="node-desc">${node.data?.message || 'Escolha uma opção:'}</p>
          <div class="node-branches-list">
            ${options.map((opt, i) => `
              <div class="node-branch-item">
                <span class="branch-label">${i + 1}. ${opt.label}</span>
                <div class="node-port port-out-branch" data-node-id="${node.id}" data-port-id="${opt.id}" data-port-type="out" title="Conectar opção: ${opt.label}">
                  <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (node.type === 'message') {
    contentHtml = `
      <div class="flow-node-inner">
        <div class="node-port port-in" data-node-id="${node.id}" data-port-id="in" data-port-type="in" title="Entrada">
          <i data-lucide="chevron-right" style="width: 10px; height: 10px;"></i>
        </div>

        <div class="node-header">
          <div class="node-header-icon message">
            <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
          </div>
          <span class="node-header-title">${node.title || 'Mensagem'}</span>
        </div>

        <div class="node-body">
          <div class="node-message-bubble">
            ${node.data?.text || 'Olá! Como posso ajudar você hoje?'}
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
    renderAllCables();
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
 * Populate Inspector Drawer with node properties
 */
function populateInspector(node) {
  const titleEl = document.getElementById('inspector-node-title');
  const typeEl = document.getElementById('inspector-node-type');
  const bodyEl = document.getElementById('inspector-body');
  if (!bodyEl) return;

  if (titleEl) titleEl.textContent = node.title;
  if (typeEl) typeEl.textContent = getNodeTypeLabel(node.type);

  let formHtml = '';

  if (node.type === 'start') {
    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title}" />
      </div>
      <div class="form-group">
        <label class="form-label">Canal de Entrada</label>
        <select class="form-select" id="insp-input-channel">
          <option value="WhatsApp" ${node.data?.channel === 'WhatsApp' ? 'selected' : ''}>🟢 WhatsApp Oficial</option>
          <option value="Instagram" ${node.data?.channel === 'Instagram' ? 'selected' : ''}>📸 Instagram Direct</option>
          <option value="Webchat" ${node.data?.channel === 'Webchat' ? 'selected' : ''}>🌐 Chat no Site (Widget)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Gatilho de Disparo</label>
        <select class="form-select" id="insp-input-trigger">
          <option value="Primeira mensagem recebida" ${node.data?.trigger?.includes('Primeira') ? 'selected' : ''}>⚡ Primeira mensagem recebida (Qualquer contato)</option>
          <option value="Palavra-chave: preço ou orçamento" ${node.data?.trigger?.includes('Palavra') ? 'selected' : ''}>🔑 Palavra-chave específica (ex: "preço", "orçamento")</option>
          <option value="Anúncio do Instagram (Click-to-WhatsApp)" ${node.data?.trigger?.includes('Anúncio') ? 'selected' : ''}>📢 Anúncio de Tráfego Pago (Instagram Ads)</option>
          <option value="Início Manual por Atendente" ${node.data?.trigger?.includes('Manual') ? 'selected' : ''}>👤 Início Manual por Atendente</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição / Observações</label>
        <textarea class="form-textarea" rows="2" id="insp-input-desc">${node.data?.subtitle || ''}</textarea>
      </div>
    `;
  } else if (node.type === 'ai_agent') {
    const agentsList = zapChatData.agentes?.list || [
      { name: 'Juliana Santos', role: 'Vendas' },
      { name: 'Pedro', role: 'Suporte' },
      { name: 'Carla Menezes', role: 'Triagem' },
      { name: 'Felipe Costa', role: 'Qualificação' }
    ];

    if (!node.data) node.data = {};
    if (!node.data.branches) {
      node.data.branches = [
        { id: `b-${Date.now().toString(36)}-1`, label: 'Resposta bem-sucedida', ctr: '82%' },
        { id: `b-${Date.now().toString(36)}-2`, label: 'Inatividade (15 min)', ctr: '0%' },
        { id: `b-${Date.now().toString(36)}-3`, label: 'Solicitação de atendente', ctr: '12%' },
        { id: `b-${Date.now().toString(36)}-4`, label: 'Condição de parada', ctr: '6%' }
      ];
    }

    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title}" />
      </div>

      <div class="form-group">
        <label class="form-label">Agente de IA Integrado</label>
        <select class="form-select" id="insp-input-agent">
          ${agentsList.map(ag => `
            <option value="${ag.name}" ${ag.name === node.agentName ? 'selected' : ''}>
              🤖 ${ag.name} (${ag.role})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Modelo de IA</label>
        <select class="form-select" id="insp-input-ai-model">
          <option value="gpt-4o-mini" ${(!node.data?.model || node.data?.model === 'gpt-4o-mini') ? 'selected' : ''}>⚡ GPT-4o Mini (Ultra Rápido & Econômico)</option>
          <option value="gpt-4o" ${node.data?.model === 'gpt-4o' ? 'selected' : ''}>🧠 GPT-4o (Raciocínio Avançado)</option>
          <option value="claude-3-5" ${node.data?.model === 'claude-3-5' ? 'selected' : ''}>🎯 Claude 3.5 Sonnet (Precisão Comercial)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Modo de Operação</label>
        <select class="form-select" id="insp-input-ai-mode">
          <option value="conversational" ${(!node.data?.mode || node.data?.mode === 'conversational') ? 'selected' : ''}>💬 Conversação Natural & Vendas</option>
          <option value="qualification" ${node.data?.mode === 'qualification' ? 'selected' : ''}>🎯 Triagem & Qualificação Rigorosa</option>
          <option value="support" ${node.data?.mode === 'support' ? 'selected' : ''}>🛠️ Suporte Técnico & Resolução de Dúvidas</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Instruções / Prompt do Assistente</label>
        <textarea class="form-textarea" rows="4" id="insp-input-instructions" placeholder="Defina persona, objetivos e instruções específicas...">${node.data?.instructions || ''}</textarea>
        <span class="form-hint">Oriente a IA sobre limites e condições de encaminhamento.</span>
      </div>

      <div class="form-group">
        <div class="insp-list-header">
          <label class="form-label" style="margin:0;">Ramificações & Saídas (${node.data.branches.length})</label>
          <button type="button" class="btn btn-secondary btn-xs" id="btn-insp-add-branch">
            <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
            <span>Nova Saída</span>
          </button>
        </div>
        <div id="insp-branches-container" class="insp-items-list">
          ${node.data.branches.map((b) => `
            <div class="insp-item-row" data-branch-id="${b.id}">
              <span class="insp-item-dot ai"></span>
              <input type="text" class="form-input insp-branch-input" data-branch-id="${b.id}" value="${b.label}" placeholder="Condição de saída" />
              <button type="button" class="insp-btn-delete-item insp-btn-delete-branch" data-branch-id="${b.id}" title="Excluir Condição">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <span class="form-hint">Cada ramificação cria um ponto de conexão roxo no card.</span>
      </div>

      <div class="form-group">
        <label class="form-label">Tempo Limite de Inatividade</label>
        <select class="form-select" id="insp-input-timeout">
          <option value="15" ${(!node.data?.timeout || node.data?.timeout === '15') ? 'selected' : ''}>15 minutos (Padrão)</option>
          <option value="30" ${node.data?.timeout === '30' ? 'selected' : ''}>30 minutos</option>
          <option value="60" ${node.data?.timeout === '60' ? 'selected' : ''}>1 hora</option>
          <option value="1440" ${node.data?.timeout === '1440' ? 'selected' : ''}>24 horas</option>
        </select>
      </div>
    `;
  } else if (node.type === 'action') {
    if (!node.data) node.data = {};
    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title}" />
      </div>

      <div class="form-group">
        <label class="form-label">Tipo de Ação</label>
        <select class="form-select" id="insp-input-action-type">
          <option value="crm_deal" ${(!node.actionType || node.actionType === 'crm_deal') ? 'selected' : ''}>💼 Criar / Mover Lead no CRM</option>
          <option value="tag" ${node.actionType === 'tag' ? 'selected' : ''}>🏷️ Aplicar / Remover Tag no Contato</option>
          <option value="restart" ${node.actionType === 'restart' ? 'selected' : ''}>🔄 Reiniciar Automação</option>
          <option value="assign" ${node.actionType === 'assign' ? 'selected' : ''}>👤 Atribuir a um Consultor Específico</option>
          <option value="webhook" ${node.actionType === 'webhook' ? 'selected' : ''}>🌐 Disparar Webhook Externo</option>
        </select>
      </div>

      <div class="form-group" id="insp-action-stage-group" style="${(!node.actionType || node.actionType === 'crm_deal') ? '' : 'display:none;'}">
        <label class="form-label">Etapa do Funil CRM</label>
        <select class="form-select" id="insp-input-stage">
          <option value="Primeiro Contato" ${node.data?.stage === 'Primeiro Contato' ? 'selected' : ''}>1. Primeiro Contato</option>
          <option value="Qualificação" ${node.data?.stage === 'Qualificação' ? 'selected' : ''}>2. Qualificação</option>
          <option value="Apresentação" ${node.data?.stage === 'Apresentação' ? 'selected' : ''}>3. Apresentação</option>
          <option value="Proposta Enviada" ${node.data?.stage === 'Proposta Enviada' ? 'selected' : ''}>4. Proposta Enviada</option>
          <option value="Negociação" ${node.data?.stage === 'Negociação' ? 'selected' : ''}>5. Negociação</option>
          <option value="Fechamento" ${node.data?.stage === 'Fechamento' ? 'selected' : ''}>6. Fechamento (Ganho)</option>
        </select>
      </div>

      <div class="form-group" id="insp-action-tag-group" style="${node.actionType === 'tag' ? '' : 'display:none;'}">
        <label class="form-label">Tag do Lead</label>
        <select class="form-select" id="insp-input-tag">
          <option value="Lead Quente" ${node.data?.tag === 'Lead Quente' ? 'selected' : ''}>🔥 Lead Quente</option>
          <option value="VIP" ${node.data?.tag === 'VIP' ? 'selected' : ''}>⭐ Cliente VIP</option>
          <option value="Interesse Planos" ${node.data?.tag === 'Interesse Planos' ? 'selected' : ''}>📦 Interesse Planos</option>
          <option value="Aguardando Pagamento" ${node.data?.tag === 'Aguardando Pagamento' ? 'selected' : ''}>💳 Aguardando Pagamento</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Rótulo Exibido no Bloco</label>
        <input type="text" class="form-input" id="insp-input-action-label" value="${node.actionLabel || 'Atribuir e abrir atendimento'}" />
      </div>

      <div class="form-group">
        <label class="form-label">Responsável / Consultor</label>
        <select class="form-select" id="insp-input-target-person">
          <option value="Carlos Félix" ${node.targetPerson === 'Carlos Félix' ? 'selected' : ''}>Carlos Félix (Consultor Comercial)</option>
          <option value="Equipe Comercial" ${node.targetPerson === 'Equipe Comercial' ? 'selected' : ''}>Equipe Comercial (Geral)</option>
          <option value="Juliana Santos" ${node.targetPerson === 'Juliana Santos' ? 'selected' : ''}>Juliana Santos (Vendas)</option>
          <option value="Pedro Henrique" ${node.targetPerson === 'Pedro Henrique' ? 'selected' : ''}>Pedro Henrique (Suporte)</option>
        </select>
      </div>
    `;
  } else if (node.type === 'menu') {
    if (!node.data) node.data = {};
    if (!node.data.options) {
      node.data.options = [
        { id: `opt-${Date.now().toString(36)}-1`, label: 'Quero comprar um plano' },
        { id: `opt-${Date.now().toString(36)}-2`, label: 'Preciso de suporte técnico' }
      ];
    }

    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Menu</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title}" />
      </div>

      <div class="form-group">
        <label class="form-label">Mensagem enviada ao cliente</label>
        <textarea class="form-textarea" rows="3" id="insp-input-message" placeholder="Como podemos te ajudar hoje?">${node.data?.message || ''}</textarea>
      </div>

      <div class="form-group">
        <div class="insp-list-header">
          <label class="form-label" style="margin:0;">Opções do Menu (${node.data.options.length})</label>
          <button type="button" class="btn btn-secondary btn-xs" id="btn-insp-add-option">
            <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
            <span>Adicionar Opção</span>
          </button>
        </div>
        <div id="insp-options-container" class="insp-items-list">
          ${node.data.options.map((opt, i) => `
            <div class="insp-item-row" data-opt-id="${opt.id}">
              <span class="insp-item-num">${i + 1}</span>
              <input type="text" class="form-input insp-option-input" data-opt-id="${opt.id}" value="${opt.label}" placeholder="Texto da opção" />
              <button type="button" class="insp-btn-delete-item insp-btn-delete-opt" data-opt-id="${opt.id}" title="Excluir Opção">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <span class="form-hint">Cada opção cria um ponto de saída numerado no card para conectar a outro bloco.</span>
      </div>

      <div class="form-group">
        <label class="form-label">Tempo Limite para Escolha</label>
        <select class="form-select" id="insp-input-timeout">
          <option value="5" ${node.data?.timeout === '5' ? 'selected' : ''}>5 minutos</option>
          <option value="15" ${(!node.data?.timeout || node.data?.timeout === '15') ? 'selected' : ''}>15 minutos (Padrão)</option>
          <option value="30" ${node.data?.timeout === '30' ? 'selected' : ''}>30 minutos</option>
          <option value="60" ${node.data?.timeout === '60' ? 'selected' : ''}>1 hora</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Mensagem para Opção Inválida</label>
        <input type="text" class="form-input" id="insp-input-invalid-msg" value="${node.data?.invalidMessage || 'Opção inválida. Por favor, escolha um dos números acima.'}" />
      </div>
    `;
  } else if (node.type === 'message') {
    if (!node.data) node.data = {};
    formHtml = `
      <div class="form-group">
        <label class="form-label">Título do Bloco</label>
        <input type="text" class="form-input" id="insp-input-title" value="${node.title}" />
      </div>

      <div class="form-group">
        <label class="form-label">Tipo de Mensagem</label>
        <select class="form-select" id="insp-input-msg-type">
          <option value="text" ${(!node.data?.msgType || node.data?.msgType === 'text') ? 'selected' : ''}>💬 Mensagem de Texto</option>
          <option value="image" ${node.data?.msgType === 'image' ? 'selected' : ''}>🖼️ Imagem com Legenda</option>
          <option value="audio" ${node.data?.msgType === 'audio' ? 'selected' : ''}>🎙️ Áudio Gravado</option>
          <option value="doc" ${node.data?.msgType === 'doc' ? 'selected' : ''}>📄 Documento / PDF</option>
        </select>
      </div>

      <div class="form-group">
        <div class="insp-list-header">
          <label class="form-label" style="margin:0;">Texto da Mensagem</label>
          <div style="display:flex; gap:4px;">
            <button type="button" class="btn btn-secondary btn-xs insp-btn-var" data-var="{nome}" title="Inserir {nome}">+ {nome}</button>
            <button type="button" class="btn btn-secondary btn-xs insp-btn-var" data-var="{telefone}" title="Inserir {telefone}">+ {telefone}</button>
          </div>
        </div>
        <textarea class="form-textarea" rows="4" id="insp-input-message-text" placeholder="Digite a mensagem enviada ao cliente...">${node.data?.text || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Simular Digitação Prévia</label>
        <select class="form-select" id="insp-input-typing-delay">
          <option value="0" ${(!node.data?.typingDelay || node.data?.typingDelay === '0') ? 'selected' : ''}>Envio imediato (0s)</option>
          <option value="2" ${node.data?.typingDelay === '2' ? 'selected' : ''}>2 segundos ("Digitando...")</option>
          <option value="4" ${node.data?.typingDelay === '4' ? 'selected' : ''}>4 segundos ("Digitando...")</option>
          <option value="7" ${node.data?.typingDelay === '7' ? 'selected' : ''}>7 segundos ("Digitando...")</option>
        </select>
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

  // Attach interactive events for dynamic controls in Inspector
  if (node.type === 'menu') {
    // Add Option
    document.getElementById('btn-insp-add-option')?.addEventListener('click', () => {
      if (!node.data) node.data = {};
      if (!node.data.options) node.data.options = [];
      const newOptId = `opt-${Date.now().toString(36)}`;
      node.data.options.push({
        id: newOptId,
        label: `Opção ${node.data.options.length + 1}`
      });
      renderCanvasNodes();
      renderAllCables();
      populateInspector(node);
      if (window.showToast) window.showToast('Nova opção adicionada!');
    });

    // Delete Option
    bodyEl.querySelectorAll('.insp-btn-delete-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const optId = btn.getAttribute('data-opt-id');
        if (!node.data?.options || node.data.options.length <= 1) {
          if (window.showToast) window.showToast('O menu precisa ter pelo menos 1 opção.');
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
        if (window.showToast) window.showToast('Opção removida do menu.');
      });
    });

    // Realtime option input sync
    bodyEl.querySelectorAll('.insp-option-input').forEach(input => {
      input.addEventListener('input', () => {
        const optId = input.getAttribute('data-opt-id');
        const opt = node.data?.options?.find(o => o.id === optId);
        if (opt) {
          opt.label = input.value;
          const optEl = document.querySelector(`#canvas-node-${node.id} [data-port-id="${optId}"]`)?.closest('.node-branch-item');
          if (optEl) {
            const idx = node.data.options.findIndex(o => o.id === optId);
            const labelEl = optEl.querySelector('.branch-label');
            if (labelEl) labelEl.textContent = `${idx + 1}. ${opt.label}`;
          }
        }
      });
    });
  } else if (node.type === 'ai_agent') {
    // Add Branch
    document.getElementById('btn-insp-add-branch')?.addEventListener('click', () => {
      if (!node.data) node.data = {};
      if (!node.data.branches) node.data.branches = [];
      const newBranchId = `b-${Date.now().toString(36)}`;
      node.data.branches.push({
        id: newBranchId,
        label: `Condição ${node.data.branches.length + 1}`,
        ctr: '0%'
      });
      renderCanvasNodes();
      renderAllCables();
      populateInspector(node);
      if (window.showToast) window.showToast('Nova condição de saída adicionada!');
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
    // Action Type toggle
    document.getElementById('insp-input-action-type')?.addEventListener('change', (e) => {
      const stageGroup = document.getElementById('insp-action-stage-group');
      const tagGroup = document.getElementById('insp-action-tag-group');
      const labelInput = document.getElementById('insp-input-action-label');
      if (stageGroup) stageGroup.style.display = e.target.value === 'crm_deal' ? 'block' : 'none';
      if (tagGroup) tagGroup.style.display = e.target.value === 'tag' ? 'block' : 'none';
      if (labelInput) {
        if (e.target.value === 'crm_deal') labelInput.value = 'Atribuir e abrir atendimento';
        else if (e.target.value === 'tag') labelInput.value = 'Aplicar Tag no Lead';
        else if (e.target.value === 'restart') labelInput.value = 'Reiniciar Automação';
        else if (e.target.value === 'assign') labelInput.value = 'Encaminhar para Consultor';
        else if (e.target.value === 'webhook') labelInput.value = 'Disparar Webhook';
      }
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
    // Variable insertion
    bodyEl.querySelectorAll('.insp-btn-var').forEach(btn => {
      btn.addEventListener('click', () => {
        const varText = btn.getAttribute('data-var');
        const txtArea = document.getElementById('insp-input-message-text');
        if (txtArea && varText) {
          const start = txtArea.selectionStart || txtArea.value.length;
          const end = txtArea.selectionEnd || txtArea.value.length;
          txtArea.value = txtArea.value.substring(0, start) + varText + txtArea.value.substring(end);
          txtArea.focus();
          txtArea.selectionStart = txtArea.selectionEnd = start + varText.length;
        }
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
    const triggerSelect = document.getElementById('insp-input-trigger');
    const channelSelect = document.getElementById('insp-input-channel');
    const descInput = document.getElementById('insp-input-desc');
    if (!node.data) node.data = {};
    if (triggerSelect) node.data.trigger = triggerSelect.value;
    if (channelSelect) node.data.channel = channelSelect.value;
    if (descInput) node.data.subtitle = descInput.value.trim();
  } else if (node.type === 'ai_agent') {
    const agentSelect = document.getElementById('insp-input-agent');
    const modelSelect = document.getElementById('insp-input-ai-model');
    const modeSelect = document.getElementById('insp-input-ai-mode');
    const instrInput = document.getElementById('insp-input-instructions');
    const timeoutSelect = document.getElementById('insp-input-timeout');
    if (!node.data) node.data = {};
    if (agentSelect) {
      node.agentName = agentSelect.value;
      if (!currentBot.integratedAiAgents.includes(agentSelect.value)) {
        currentBot.integratedAiAgents.push(agentSelect.value);
      }
    }
    if (modelSelect) node.data.model = modelSelect.value;
    if (modeSelect) node.data.mode = modeSelect.value;
    if (instrInput) node.data.instructions = instrInput.value.trim();
    if (timeoutSelect) node.data.timeout = timeoutSelect.value;

    document.querySelectorAll('.insp-branch-input').forEach(inp => {
      const bId = inp.getAttribute('data-branch-id');
      const b = node.data?.branches?.find(item => item.id === bId);
      if (b) b.label = inp.value.trim();
    });
  } else if (node.type === 'action') {
    const typeSelect = document.getElementById('insp-input-action-type');
    const labelInput = document.getElementById('insp-input-action-label');
    const targetSelect = document.getElementById('insp-input-target-person');
    const stageSelect = document.getElementById('insp-input-stage');
    const tagSelect = document.getElementById('insp-input-tag');
    if (!node.data) node.data = {};
    if (typeSelect) node.actionType = typeSelect.value;
    if (labelInput) node.actionLabel = labelInput.value.trim();
    if (targetSelect) node.targetPerson = targetSelect.value.trim();
    if (stageSelect) node.data.stage = stageSelect.value;
    if (tagSelect) node.data.tag = tagSelect.value;
  } else if (node.type === 'menu') {
    const msgInput = document.getElementById('insp-input-message');
    const timeoutSelect = document.getElementById('insp-input-timeout');
    const invalidInput = document.getElementById('insp-input-invalid-msg');
    if (!node.data) node.data = {};
    if (msgInput) node.data.message = msgInput.value.trim();
    if (timeoutSelect) node.data.timeout = timeoutSelect.value;
    if (invalidInput) node.data.invalidMessage = invalidInput.value.trim();

    document.querySelectorAll('.insp-option-input').forEach(inp => {
      const optId = inp.getAttribute('data-opt-id');
      const opt = node.data?.options?.find(item => item.id === optId);
      if (opt) opt.label = inp.value.trim();
    });
  } else if (node.type === 'message') {
    const msgTypeSelect = document.getElementById('insp-input-msg-type');
    const textInput = document.getElementById('insp-input-message-text');
    const typingSelect = document.getElementById('insp-input-typing-delay');
    if (!node.data) node.data = {};
    if (msgTypeSelect) node.data.msgType = msgTypeSelect.value;
    if (textInput) node.data.text = textInput.value.trim();
    if (typingSelect) node.data.typingDelay = typingSelect.value;
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
    newNode = {
      id: newId,
      type: 'ai_agent',
      title: 'Assistente de IA',
      agentName: 'Carla Menezes',
      agentRole: 'Triagem e Qualificação',
      executions: 0,
      x,
      y,
      data: {
        method: 'Agente de IA Conversacional',
        instructions: 'Você é a Assistente Virtual. Tire dúvidas e conduza o cliente.',
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
      title: 'Ação CRM',
      actionType: 'crm_deal',
      actionLabel: 'Atribuir e abrir atendimento',
      targetPerson: 'Equipe de Vendas',
      x,
      y,
      data: { description: 'Ação executada no CRM' }
    };
  } else if (type === 'menu') {
    newNode = {
      id: newId,
      type: 'menu',
      title: 'Menu de Opções',
      x,
      y,
      data: {
        message: 'Como podemos te ajudar hoje?',
        options: [
          { id: `opt-${Date.now()}-1`, label: 'Quero comprar um plano' },
          { id: `opt-${Date.now()}-2`, label: 'Preciso de suporte técnico' }
        ]
      }
    };
  } else if (type === 'message') {
    newNode = {
      id: newId,
      type: 'message',
      title: 'Mensagem',
      x,
      y,
      data: { text: 'Olá! Seja muito bem-vindo ao nosso atendimento.' }
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
    message: 'Mensagem de Texto',
    human: 'Fila Humana',
    condition: 'Condição Lógica',
    delay: 'Atraso / Espera'
  };
  return map[type] || 'Bloco';
}
