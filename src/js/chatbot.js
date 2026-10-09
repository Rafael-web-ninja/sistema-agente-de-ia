import { zapChatData } from './data.js';
import { openFlowBuilder } from './flow-builder.js';

let searchQuery = '';
let channelFilter = 'all';
let statusFilter = 'all';
let currentSimulatedBot = null;
let currentEditingBot = null;

export function initChatbotsView() {
  window.openSimulator = openSimulator;
  window.openFlowBuilder = openFlowBuilder;

  renderChatbotKpis();
  renderChatbotsList();
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

  if (kpiActiveEl) kpiActiveEl.textContent = `${activeBots}`;
  if (kpiExecutionsEl) kpiExecutionsEl.textContent = totalExecutions.toLocaleString('pt-BR');
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
    const isWa = bot.channel === 'WhatsApp';
    const channelIconSvg = isWa
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="#00A868"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`;

    const isActive = bot.status === 'Ativo';

    return `
      <div class="chatbot-card" data-bot-id="${bot.id}">
        <div class="chatbot-card-header">
          <div class="chatbot-header-left">
            <div class="chatbot-icon-wrap ${isWa ? 'channel-wa' : 'channel-ig'}">
              <i data-lucide="git-branch" style="width: 20px; height: 20px;"></i>
            </div>
            <div class="chatbot-title-box">
              <h3 class="chatbot-name" title="${bot.name}">${bot.name}</h3>
              <div class="chatbot-tags-row">
                <span class="bot-badge-channel ${isWa ? 'wa' : 'ig'}">
                  ${channelIconSvg}
                  <span>${bot.channel}</span>
                </span>
                <span class="bot-badge-metric">
                  <i data-lucide="zap" style="width: 11px; height: 11px;"></i>
                  <span>${(bot.executions || 0).toLocaleString('pt-BR')} disparos</span>
                </span>
              </div>
            </div>
          </div>
          <button type="button" class="bot-status-tag ${isActive ? 'status-active' : 'status-paused'} btn-toggle-bot-status" data-bot-id="${bot.id}" title="Clique para ${isActive ? 'pausar' : 'ativar'}">
            <span class="status-dot"></span>
            <span>${bot.status}</span>
          </button>
        </div>

        <p class="chatbot-desc">${bot.description}</p>

        <div class="chatbot-card-footer">
          <div class="chatbot-card-footer-left">
            <button type="button" class="btn btn-primary btn-sm btn-edit-flow" data-bot-id="${bot.id}">
              <i data-lucide="sliders" style="width: 13px; height: 13px;"></i>
              <span>Editar Fluxo</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm btn-simulate-bot" data-bot-id="${bot.id}">
              <i data-lucide="play" style="width: 13px; height: 13px; color: var(--primary);"></i>
              <span>Testar</span>
            </button>
          </div>
          <button type="button" class="crm-btn-card-action btn-delete-bot" data-bot-id="${bot.id}" title="Excluir Chatbot" style="color: var(--text-muted);">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
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
    : (zapChatData.chatbots.list.find(b => b.id === botId) || activeFlowBot);

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
      setSimulatorStatus('digitando...');
      showTypingIndicator(true);
      simSetTimeout(() => {
        showTypingIndicator(false);
        setSimulatorStatus('online');
        const text = (node.data?.message || 'Olá! Como posso te ajudar hoje?').replace(/\n/g, '<br>');
        appendBotBubble(text);

        // Find outgoing connection
        const nextConn = bot.canvasFlow?.connections?.find(c => c.fromNode === node.id && (c.fromPort === 'out' || !c.fromPort));
        if (nextConn) {
          simSetTimeout(() => {
            executeFlowNode(nextConn.toNode, bot);
          }, 800);
        }
      }, 700);
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
      const agentRole = node.agentRole || 'Especialista em Vendas';

      // 1. Alert that AI took over
      appendSystemAlert(`🤖 Agente de IA <strong>${agentName}</strong> assumiu o atendimento!`);

      setSimulatorStatus('digitando...');
      showTypingIndicator(true);

      simSetTimeout(() => {
        showTypingIndicator(false);
        setSimulatorStatus('online');

        const greeting = `Olá! Sou <strong>${agentName}</strong>, ${agentRole} do ZapChat. Estou à disposição para te auxiliar em tudo o que precisar!`;
        const branches = node.data?.branches || [];

        let branchesHtml = '';
        if (branches.length > 0) {
          branchesHtml = `
            <div class="sim-ai-branches-tray">
              <span class="sim-branches-tray-label">
                <i data-lucide="zap" style="width:12px; height:12px;"></i>
                Ramificações Inteligentes para testar:
              </span>
              ${branches.map(b => `
                <button type="button" class="sim-ai-branch-btn" data-node-id="${node.id}" data-branch-id="${b.id}">
                  <span>${b.label}</span>
                  <span class="sim-branch-ctr">${b.ctr || '85%'}</span>
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
                appendSystemAlert(`Caminho <strong>${branch.label}</strong> concluído com sucesso!`);
              }, 400);
            }
          });
        });
      }, 800);
      break;
    }

    case 'action': {
      const actionType = node.actionType || 'action';
      const target = node.targetPerson ? ` • Atribuído a <strong>${node.targetPerson}</strong>` : '';
      let alertText = `⚡ Ação executada: <strong>${node.actionLabel || node.title || 'Ação Automática'}</strong>`;

      if (actionType === 'crm_deal') {
        alertText = `💼 Oportunidade registrada no CRM${target}`;
      } else if (actionType === 'restart') {
        alertText = `🔄 Fluxo reiniciado automaticamente após período de inatividade`;
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

    const name = document.getElementById('new-bot-input-name').value;
    const channel = document.getElementById('new-bot-input-channel').value;
    const desc = document.getElementById('new-bot-input-desc').value;
    const trigger = document.getElementById('new-bot-input-trigger').value;
    const defaultAgent = document.getElementById('new-bot-input-agent').value;

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
