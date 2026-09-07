// Module: Editar Agente
import { zapChatData } from './data.js';
import { showToast } from './settings.js';

let currentAgentId = 'pedro';
let currentTone = 'normal';

export function initEditAgentView() {
  setupInternalTabs();
  setupToneButtons();
  setupBehaviorCounter();
  setupSaveAction();
  setupBackToAgents();
  setupTrainingActions();

  // Expose globally
  window.openEditAgent = openEditAgent;
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

    const statusBadge = document.getElementById('edit-agent-status-badge');
    if (statusBadge) {
      statusBadge.textContent = (agent.status === 'Ativo' || !agent.status) ? 'IA ativa' : agent.status;
      if (agent.statusType === 'testing') {
        statusBadge.className = 'badge badge-dot badge-testing';
      } else {
        statusBadge.className = 'badge badge-dot badge-active';
      }
    }
  }

  // Switch to the edit agent view
  if (window.switchView) {
    window.switchView('editar-agente');
  }

  // Default to perfil tab
  switchAgentInternalTab('perfil');

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
  const navBtns = document.querySelectorAll('.agent-internal-nav-btn[data-agent-tab]');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = btn.getAttribute('data-agent-tab');
      switchAgentInternalTab(tabId);
    });
  });
}

/**
 * Communication tone selector (Formal / Normal / Descontraída)
 */
function setupToneButtons() {
  const toneBtns = document.querySelectorAll('.tone-btn[data-tone]');
  toneBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toneBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTone = btn.getAttribute('data-tone');
    });
  });
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

  if (inputName && nameDisplay) {
    inputName.addEventListener('input', (e) => {
      nameDisplay.textContent = e.target.value.trim() || 'Agente';
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
      const newName = inputName ? inputName.value.trim() : '';
      const newRole = inputRole ? inputRole.value.trim() : '';

      // Update data item in zapChatData
      const agent = zapChatData.agentes.list.find(a => a.id === currentAgentId);
      if (agent) {
        if (newName) agent.name = newName;
        if (newRole) agent.role = newRole;
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

  // 6. Event delegation for Edit and Delete actions on knowledge list
  const knowledgeList = document.getElementById('knowledge-items-list');
  if (knowledgeList) {
    knowledgeList.addEventListener('click', (e) => {
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
          const nameEl = card.querySelector('.knowledge-item-name');
          const currentText = nameEl ? nameEl.textContent : '';
          const newText = prompt('Editar nome / título do conhecimento:', currentText);
          if (newText !== null && newText.trim() !== '') {
            nameEl.textContent = newText.trim();
            showToast('Conhecimento atualizado com sucesso!');
          }
        }
        return;
      }

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
