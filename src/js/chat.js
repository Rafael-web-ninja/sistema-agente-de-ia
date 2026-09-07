import { zapChatData } from './data.js';

let activeThreadId = zapChatData.conversas.threads[0].id;
let currentTabFilter = 'all';

export function initChatView() {
  renderThreadList();
  renderActiveChat();
  setupChatInputs();
  setupThreadFilters();

  document.getElementById('btn-close-chat-profile')?.addEventListener('click', () => {
    const layout = document.querySelector('.conversas-simplified-layout');
    if (layout) {
      layout.classList.remove('chat-profile-open');
    }
  });
}

function getChannelBadgeHtml(channel) {
  if (channel === 'WhatsApp') {
    return `
      <span class="chat-channel-badge whatsapp">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg>
        <span>WhatsApp</span>
      </span>
    `;
  }
  if (channel === 'Instagram') {
    return `
      <span class="chat-channel-badge instagram">
        <i data-lucide="instagram" style="width: 12px; height: 12px;"></i>
        <span>Instagram</span>
      </span>
    `;
  }
  return `
    <span class="chat-channel-badge widget">
      <i data-lucide="message-square" style="width: 12px; height: 12px;"></i>
      <span>Widget</span>
    </span>
  `;
}

export function renderThreadList() {
  const container = document.getElementById('chat-threads-container');
  if (!container) return;

  let threads = zapChatData.conversas.threads;
  if (currentTabFilter === 'unread') {
    threads = threads.filter(t => t.unread > 0);
  } else if (currentTabFilter === 'ongoing') {
    threads = threads.filter(t => t.status === 'Em atendimento');
  }

  container.innerHTML = threads.map(thread => {
    const isActive = thread.id === activeThreadId;

    return `
      <div class="chat-thread-item ${isActive ? 'active' : ''}" data-thread-id="${thread.id}">
        <div class="thread-avatar-wrap">
          <img src="${thread.img}" alt="${thread.name}" class="thread-avatar">
        </div>
        <div class="thread-content">
          <div class="thread-top-row">
            <div class="thread-name-group">
              <span class="thread-name">${thread.name}</span>
              ${getChannelBadgeHtml(thread.channel)}
            </div>
            <span class="thread-time">${thread.time}</span>
          </div>
          <div class="thread-bottom-row">
            <span class="thread-snippet">${thread.snippet}</span>
            ${thread.unread > 0 ? `<span class="thread-unread-pill">${thread.unread}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.chat-thread-item').forEach(item => {
    item.addEventListener('click', () => {
      const threadId = item.getAttribute('data-thread-id');
      const thread = zapChatData.conversas.threads.find(t => t.id === threadId);
      if (thread) {
        activeThreadId = threadId;
        thread.unread = 0; // Mark as read
        renderThreadList();
        renderActiveChat();

        // Switch to active chat arena on mobile
        const layout = document.querySelector('.conversas-simplified-layout');
        if (layout) {
          layout.classList.add('in-active-chat');
        }
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

export function renderActiveChat() {
  const thread = zapChatData.conversas.threads.find(t => t.id === activeThreadId);
  if (!thread) return;

  // 1. Header
  const header = document.getElementById('chat-arena-header');
  if (header) {
    header.innerHTML = `
      <div class="chat-contact-banner">
        <button class="mobile-chat-back-btn" id="mobile-chat-back-btn" title="Voltar para conversas" aria-label="Voltar para conversas">
          <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
        </button>
        <div class="chat-contact-avatar-wrap">
          <img src="${thread.img}" alt="${thread.name}" class="chat-contact-avatar">
          <span class="chat-online-indicator"></span>
        </div>
        <div class="chat-contact-meta">
          <div class="chat-contact-name-row">
            <span class="chat-contact-name">${thread.name}</span>
            ${getChannelBadgeHtml(thread.channel)}
          </div>
          <div class="chat-status-ia-tag">
            <span class="sparkle-dot"></span>
            <span>${thread.attendingStatus || 'IA atendendo'}</span>
          </div>
        </div>
      </div>

      <div class="chat-header-actions">
        <button class="btn btn-primary btn-sm chat-action-btn" id="btn-header-assume">
          <i data-lucide="user-check" style="width: 14px; height: 14px;"></i>
          <span>Assumir</span>
        </button>
        <button class="btn btn-secondary btn-sm chat-action-btn" id="btn-header-transfer">
          <i data-lucide="corner-up-right" style="width: 14px; height: 14px;"></i>
          <span>Transferir</span>
        </button>
        <button class="btn btn-secondary btn-sm chat-action-btn chat-action-close" id="btn-header-close">
          <i data-lucide="x-circle" style="width: 14px; height: 14px;"></i>
          <span>Encerrar</span>
        </button>
        <div class="chat-header-divider"></div>
        <button class="btn-action-round chat-icon-btn" id="btn-toggle-chat-profile" title="Ver detalhes do contato" aria-label="Ver detalhes do contato">
          <i data-lucide="info" style="width: 15px; height: 15px;"></i>
        </button>
      </div>
    `;

    // Toggle contact profile drawer handler
    header.querySelector('#btn-toggle-chat-profile')?.addEventListener('click', () => {
      const layout = document.querySelector('.conversas-simplified-layout');
      if (layout) {
        layout.classList.toggle('chat-profile-open');
      }
    });

    // Mobile back button handler
    header.querySelector('#mobile-chat-back-btn')?.addEventListener('click', () => {
      const layout = document.querySelector('.conversas-simplified-layout');
      if (layout) {
        layout.classList.remove('in-active-chat');
        layout.classList.remove('chat-profile-open');
      }
    });

    header.querySelector('#btn-header-assume')?.addEventListener('click', () => {
      assumeAttendance(thread);
    });

    header.querySelector('#btn-header-transfer')?.addEventListener('click', () => {
      alert(`Transferir atendimento de ${thread.name} para outro atendente ou setor.`);
    });

    header.querySelector('#btn-header-close')?.addEventListener('click', () => {
      if (confirm(`Deseja realmente encerrar o atendimento de ${thread.name}?`)) {
        thread.status = 'Resolvido';
        alert('Atendimento encerrado com sucesso.');
        renderThreadList();
        renderActiveChat();
      }
    });
  }

  // 2. Messages List
  const messagesScroll = document.getElementById('chat-messages-scroll');
  if (messagesScroll) {
    messagesScroll.innerHTML = `
      <div class="chat-date-divider">
        <span>Hoje</span>
      </div>

      ${thread.messages.map(msg => {
        const isBot = msg.sender === 'bot';
        return `
          <div class="message-row ${isBot ? 'bot' : 'user'}">
            <div class="message-bubble">
              <div style="white-space: pre-line;">${msg.text}</div>
              <div class="message-meta">
                <span>${msg.time}</span>
                ${isBot ? '<span class="check-read-icon">✓✓</span>' : ''}
              </div>
            </div>
            ${isBot ? `
              <div class="bot-sparkle-avatar" title="Resposta da IA">
                <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    `;

    setTimeout(() => {
      messagesScroll.scrollTop = messagesScroll.scrollHeight;
    }, 40);
  }

  // 3. AI Attending Strip
  const strip = document.getElementById('ai-attending-strip');
  if (strip) {
    if (thread.isAiAttending) {
      strip.style.display = 'flex';
      strip.innerHTML = `
        <div class="ai-strip-left">
          <div class="ai-strip-bot-icon">
            <i data-lucide="bot" style="width: 16px; height: 16px;"></i>
          </div>
          <span class="ai-strip-text"><strong>Pedro</strong> está atendendo esta conversa</span>
        </div>
        <button class="btn btn-secondary btn-sm ai-strip-assume-btn" id="btn-strip-assume">
          <i data-lucide="user-check" style="width: 14px; height: 14px;"></i>
          Assumir atendimento
        </button>
      `;
      strip.querySelector('#btn-strip-assume')?.addEventListener('click', () => {
        assumeAttendance(thread);
      });
    } else {
      strip.innerHTML = `
        <div class="ai-strip-left">
          <div class="ai-strip-bot-icon" style="background-color: var(--primary); color: white;">
            <i data-lucide="user" style="width: 16px; height: 16px;"></i>
          </div>
          <span class="ai-strip-text"><strong>Você</strong> está atendendo esta conversa</span>
        </div>
        <button class="btn btn-secondary btn-sm" style="font-size: 12px;" onclick="alert('Devolvendo controle para a IA...');">
          Devolver para IA
        </button>
      `;
    }
  }

  // 4. Update Input State
  const inputStrip = document.getElementById('chat-input-strip');
  const inputField = document.getElementById('chat-input-textarea');
  if (inputField && inputStrip) {
    if (thread.isAiAttending) {
      inputField.placeholder = "A IA está respondendo. Você pode assumir o atendimento para enviar mensagens.";
      inputStrip.classList.remove('active-input');
    } else {
      inputField.placeholder = "Digite sua mensagem... (Pressione Enter para enviar)";
      inputStrip.classList.add('active-input');
    }
  }

  // 5. Right Column 3 Cards
  renderRightColumnCards(thread);

  if (window.lucide) window.lucide.createIcons();
}

function assumeAttendance(thread) {
  thread.isAiAttending = false;
  thread.attendingStatus = 'Humano atendendo';
  thread.assignedAgent = 'Você (Rafael Mota)';
  renderActiveChat();
  const inputField = document.getElementById('chat-input-textarea');
  if (inputField) {
    inputField.focus();
  }
}

function renderRightColumnCards(thread) {
  // Card 1: Contato
  const cardContato = document.getElementById('chat-profile-card');
  if (cardContato) {
    cardContato.innerHTML = `
      <div class="profile-card-top-bar">
        <span class="profile-card-top-title">Contato</span>
        <button class="btn-action-round" style="width: 26px; height: 26px;">
          <i data-lucide="more-horizontal" style="width: 13px; height: 13px;"></i>
        </button>
      </div>

      <div class="profile-contact-row">
        <img src="${thread.img}" alt="${thread.name}" class="profile-contact-avatar">
        <span class="profile-contact-name">${thread.name}</span>
      </div>

      <div class="contact-info-list">
        <div class="contact-info-item">
          <span style="color: #25D366; font-size: 15px;">🟢</span>
          <span>${thread.phone}</span>
        </div>
        <div class="contact-info-item">
          <i data-lucide="mail" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
          <span>${thread.email}</span>
        </div>
      </div>
    `;
  }

  // Card 2: Atendimento
  const cardAtendimento = document.getElementById('chat-attendance-card');
  if (cardAtendimento) {
    cardAtendimento.innerHTML = `
      <div class="profile-card-top-title" style="margin-bottom: 10px;">Atendimento</div>
      <div class="attendance-meta-group">
        <div class="attendance-row">
          <span class="attendance-label">Agente</span>
          <div class="attendance-agent-pill">
            <div class="agent-icon-avatar" style="width: 22px; height: 22px; background: #E9F7F1; color: #00A868; border-radius: 6px;">
              <i data-lucide="bot" style="width: 14px; height: 14px;"></i>
            </div>
            <span>${thread.assignedAgent || 'Pedro'}</span>
          </div>
        </div>

        <div class="attendance-row">
          <span class="attendance-label">Status</span>
          <div class="attendance-status-badge">
            <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i>
            <span>${thread.attendingStatus || 'IA atendendo'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Card 3: Resumo da IA
  const cardResumo = document.getElementById('chat-ai-summary-card');
  if (cardResumo) {
    cardResumo.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13.5px; color: var(--text-main);">
        <i data-lucide="sparkles" style="width: 15px; height: 15px; color: var(--primary);"></i>
        <span>Resumo da IA</span>
      </div>
      <ul class="ai-summary-points-simplified">
        ${thread.aiSummary.map(pt => `<li>${pt}</li>`).join('')}
      </ul>
    `;
  }
}

function setupChatInputs() {
  const input = document.getElementById('chat-input-textarea');
  const sendBtn = document.getElementById('btn-send-chat-msg');

  if (!input || !sendBtn) return;

  const sendMessage = () => {
    const text = input.value.trim();
    if (!text) return;

    const thread = zapChatData.conversas.threads.find(t => t.id === activeThreadId);
    if (!thread) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add user message
    thread.messages.push({
      sender: 'user',
      text: text,
      time: timeStr
    });
    thread.snippet = text;
    thread.time = timeStr;

    input.value = '';
    renderActiveChat();
    renderThreadList();

    // Trigger auto reply
    setTimeout(() => {
      const replies = [
        'Perfeito! Registrei sua solicitação no sistema. Algo mais em que posso ajudar?',
        'Entendi perfeitamente. Estou consultando os detalhes e já te respondo com a melhor solução!',
        'Excelente! Um link exclusivo com as condições especiais foi gerado para você.',
        'Obrigado pelo retorno! Se desejar falar com um especialista humano, posso transferir agora.'
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      thread.messages.push({
        sender: 'bot',
        text: randomReply,
        time: timeStr
      });
      thread.snippet = randomReply;
      renderActiveChat();
      renderThreadList();
    }, 1100);
  };

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });

  // Clicking on input when IA is attending prompts to assume
  input.addEventListener('focus', () => {
    const thread = zapChatData.conversas.threads.find(t => t.id === activeThreadId);
    if (thread && thread.isAiAttending) {
      assumeAttendance(thread);
    }
  });
}

function setupThreadFilters() {
  const tabs = document.querySelectorAll('.chat-tab-pill');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTabFilter = tab.getAttribute('data-tab');
      renderThreadList();
    });
  });

  const search = document.getElementById('chat-search-input');
  const searchWrap = document.getElementById('chat-search-wrap');
  const clearBtn = document.getElementById('chat-search-clear-btn');
  const filterBtn = document.getElementById('chat-filter-btn');

  function applySearchFilter(query) {
    const q = query.toLowerCase().trim();
    const container = document.getElementById('chat-threads-container');
    if (!container) return;

    if (searchWrap) {
      if (q.length > 0) {
        searchWrap.classList.add('has-value');
      } else {
        searchWrap.classList.remove('has-value');
      }
    }

    const items = container.querySelectorAll('.chat-thread-item');
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(q)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  if (search) {
    search.addEventListener('input', (e) => {
      applySearchFilter(e.target.value);
    });

    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        search.value = '';
        applySearchFilter('');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (search) {
        search.value = '';
        applySearchFilter('');
        search.focus();
      }
    });
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      filterBtn.classList.toggle('active');
      const tabsWrap = document.querySelector('.chat-simplified-tabs');
      if (tabsWrap) {
        tabsWrap.classList.toggle('highlight-tabs');
      }
    });
  }
}

