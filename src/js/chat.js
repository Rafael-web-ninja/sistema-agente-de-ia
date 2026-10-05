import { zapChatData } from './data.js';
import { showToast } from './settings.js';
import { switchView, openModal, closeAllModals } from './navigation.js';

let activeThreadId = zapChatData.conversas.threads[0]?.id || null;

export function initChatView() {
  renderThreadList();
  renderActiveChat();
  setupChatInputs();
  setupThreadFilters();
  setupTransferModal();
  setupContactModals();

  document.getElementById('btn-close-chat-profile')?.addEventListener('click', () => {
    const layout = document.querySelector('.conversas-simplified-layout');
    if (layout) {
      layout.classList.remove('chat-profile-open');
    }
  });
}

export function getChannelBadgeHtml(channel) {
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

export const chatFilterState = {
  tab: 'all',          // 'all', 'unread', 'ongoing'
  searchQuery: '',     // text search
  channel: 'all',      // 'all', 'WhatsApp', 'Instagram', 'Widget'
  status: 'all',       // 'all', 'Em atendimento', 'Resolvido', 'Em andamento'
  attendant: 'all',    // 'all', 'ai', 'human'
  unreadOnly: false,   // boolean
  tag: 'all',          // 'all' or specific tag name
  sortBy: 'recent'     // 'recent', 'oldest', 'unread', 'name'
};

export function getFilteredThreads() {
  let list = [...zapChatData.conversas.threads];

  // 1. Tab filter
  if (chatFilterState.tab === 'unread') {
    list = list.filter(t => t.unread > 0);
  } else if (chatFilterState.tab === 'ongoing') {
    list = list.filter(t => t.status === 'Em atendimento');
  }

  // 2. Channel filter
  if (chatFilterState.channel !== 'all') {
    list = list.filter(t => (t.channel || '').toLowerCase() === chatFilterState.channel.toLowerCase());
  }

  // 3. Status filter
  if (chatFilterState.status !== 'all') {
    list = list.filter(t => t.status === chatFilterState.status);
  }

  // 4. Attendant filter
  if (chatFilterState.attendant === 'ai') {
    list = list.filter(t => t.isAiAttending === true || (t.attendingStatus && t.attendingStatus.toLowerCase().includes('ia')));
  } else if (chatFilterState.attendant === 'human') {
    list = list.filter(t => !t.isAiAttending && (!t.attendingStatus || !t.attendingStatus.toLowerCase().includes('ia')));
  }

  // 5. Unread only toggle
  if (chatFilterState.unreadOnly) {
    list = list.filter(t => t.unread > 0);
  }

  // 6. Tag filter
  if (chatFilterState.tag !== 'all') {
    list = list.filter(t => t.tags && t.tags.some(tag => tag.toLowerCase().includes(chatFilterState.tag.toLowerCase())));
  }

  // 7. Search query filter
  if (chatFilterState.searchQuery) {
    const q = chatFilterState.searchQuery.toLowerCase().trim();
    list = list.filter(t => {
      const name = (t.name || '').toLowerCase();
      const snippet = (t.snippet || '').toLowerCase();
      const phone = (t.phone || '').toLowerCase();
      const email = (t.email || '').toLowerCase();
      const tags = (t.tags || []).join(' ').toLowerCase();
      const messages = (t.messages || []).map(m => m.text).join(' ').toLowerCase();
      return name.includes(q) || snippet.includes(q) || phone.includes(q) || email.includes(q) || tags.includes(q) || messages.includes(q);
    });
  }

  // 8. Sorting
  if (chatFilterState.sortBy === 'oldest') {
    list = [...list].reverse();
  } else if (chatFilterState.sortBy === 'unread') {
    list = [...list].sort((a, b) => (b.unread || 0) - (a.unread || 0));
  } else if (chatFilterState.sortBy === 'name') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  }

  return list;
}

export function getActiveFilterCount() {
  let count = 0;
  if (chatFilterState.channel !== 'all') count++;
  if (chatFilterState.status !== 'all') count++;
  if (chatFilterState.attendant !== 'all') count++;
  if (chatFilterState.unreadOnly) count++;
  if (chatFilterState.tag !== 'all') count++;
  if (chatFilterState.sortBy !== 'recent') count++;
  return count;
}

function updateTabCounts() {
  const allCountEl = document.getElementById('tab-count-all');
  const unreadCountEl = document.getElementById('tab-count-unread');
  const ongoingCountEl = document.getElementById('tab-count-ongoing');

  // Base list applying filters except tab
  const baseList = zapChatData.conversas.threads.filter(t => {
    if (chatFilterState.channel !== 'all' && (t.channel || '').toLowerCase() !== chatFilterState.channel.toLowerCase()) return false;
    if (chatFilterState.status !== 'all' && t.status !== chatFilterState.status) return false;
    if (chatFilterState.attendant === 'ai' && !t.isAiAttending && (!t.attendingStatus || !t.attendingStatus.toLowerCase().includes('ia'))) return false;
    if (chatFilterState.attendant === 'human' && (t.isAiAttending || (t.attendingStatus && t.attendingStatus.toLowerCase().includes('ia')))) return false;
    if (chatFilterState.unreadOnly && !(t.unread > 0)) return false;
    if (chatFilterState.tag !== 'all' && (!t.tags || !t.tags.some(tag => tag.toLowerCase().includes(chatFilterState.tag.toLowerCase())))) return false;
    if (chatFilterState.searchQuery) {
      const q = chatFilterState.searchQuery.toLowerCase().trim();
      const match = (t.name || '').toLowerCase().includes(q) ||
                    (t.snippet || '').toLowerCase().includes(q) ||
                    (t.phone || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const total = baseList.length;
  const unread = baseList.filter(t => t.unread > 0).length;
  const ongoing = baseList.filter(t => t.status === 'Em atendimento').length;

  if (allCountEl) allCountEl.textContent = total;
  if (unreadCountEl) unreadCountEl.textContent = unread;
  if (ongoingCountEl) ongoingCountEl.textContent = ongoing;
}

export function updateFilterUI() {
  const filterBtn = document.getElementById('chat-filter-btn');
  const filterBadge = document.getElementById('chat-filter-badge');
  const activeCount = getActiveFilterCount();

  if (filterBadge) {
    if (activeCount > 0) {
      filterBadge.textContent = activeCount;
      filterBadge.style.display = 'flex';
      filterBtn?.classList.add('has-active-filters');
    } else {
      filterBadge.style.display = 'none';
      filterBtn?.classList.remove('has-active-filters');
    }
  }

  // Update button label inside popover with live matching count
  const applyLabel = document.getElementById('btn-filter-apply-label');
  if (applyLabel) {
    const list = getFilteredThreads();
    applyLabel.textContent = `Ver ${list.length} conversa${list.length === 1 ? '' : 's'}`;
  }

  renderActiveFilterChips();
}

export function renderActiveFilterChips() {
  const bar = document.getElementById('chat-active-filters-bar');
  const list = document.getElementById('chat-active-chips-list');
  if (!bar || !list) return;

  const chips = [];

  if (chatFilterState.channel !== 'all') {
    chips.push({ key: 'channel', label: `Canal: ${chatFilterState.channel}` });
  }
  if (chatFilterState.status !== 'all') {
    chips.push({ key: 'status', label: `Status: ${chatFilterState.status}` });
  }
  if (chatFilterState.attendant !== 'all') {
    chips.push({ key: 'attendant', label: chatFilterState.attendant === 'ai' ? 'IA atendendo' : 'Humano' });
  }
  if (chatFilterState.unreadOnly) {
    chips.push({ key: 'unreadOnly', label: 'Não lidas' });
  }
  if (chatFilterState.tag !== 'all') {
    chips.push({ key: 'tag', label: `Tag: ${chatFilterState.tag}` });
  }
  if (chatFilterState.sortBy !== 'recent') {
    const sortLabels = { oldest: 'Mais antigas', unread: 'Mais não lidas', name: 'Nome (A-Z)' };
    chips.push({ key: 'sortBy', label: `Ordem: ${sortLabels[chatFilterState.sortBy] || chatFilterState.sortBy}` });
  }

  if (chips.length === 0) {
    bar.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  bar.style.display = 'flex';
  list.innerHTML = chips.map(c => `
    <span class="active-chip-pill">
      <span>${c.label}</span>
      <button type="button" class="active-chip-remove" data-clear-key="${c.key}" title="Remover filtro">&times;</button>
    </span>
  `).join('');

  list.querySelectorAll('.active-chip-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-clear-key');
      clearSpecificFilter(key);
    });
  });
}

export function clearSpecificFilter(key) {
  if (key === 'channel') {
    chatFilterState.channel = 'all';
    document.querySelectorAll('#filter-channel-group .chat-filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filterVal === 'all');
    });
  } else if (key === 'status') {
    chatFilterState.status = 'all';
    document.querySelectorAll('#filter-status-group .chat-filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filterVal === 'all');
    });
  } else if (key === 'attendant') {
    chatFilterState.attendant = 'all';
    document.querySelectorAll('#filter-attendant-group .chat-filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filterVal === 'all');
    });
  } else if (key === 'unreadOnly') {
    chatFilterState.unreadOnly = false;
    const unreadToggle = document.getElementById('filter-unread-toggle');
    if (unreadToggle) unreadToggle.checked = false;
  } else if (key === 'tag') {
    chatFilterState.tag = 'all';
    const tagSelect = document.getElementById('filter-tag-select');
    if (tagSelect) tagSelect.value = 'all';
  } else if (key === 'sortBy') {
    chatFilterState.sortBy = 'recent';
    const sortSelect = document.getElementById('filter-sort-select');
    if (sortSelect) sortSelect.value = 'recent';
  }

  renderThreadList();
}

export function resetAllFilters(silent = false) {
  chatFilterState.channel = 'all';
  chatFilterState.status = 'all';
  chatFilterState.attendant = 'all';
  chatFilterState.unreadOnly = false;
  chatFilterState.tag = 'all';
  chatFilterState.sortBy = 'recent';

  document.querySelectorAll('#filter-channel-group .chat-filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filterVal === 'all');
  });
  document.querySelectorAll('#filter-status-group .chat-filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filterVal === 'all');
  });
  document.querySelectorAll('#filter-attendant-group .chat-filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filterVal === 'all');
  });
  const unreadToggle = document.getElementById('filter-unread-toggle');
  if (unreadToggle) unreadToggle.checked = false;

  const tagSelect = document.getElementById('filter-tag-select');
  if (tagSelect) tagSelect.value = 'all';

  const sortSelect = document.getElementById('filter-sort-select');
  if (sortSelect) sortSelect.value = 'recent';

  renderThreadList();
  if (!silent) {
    showToast('Filtros redefinidos');
  }
}

export function openFilterPopover() {
  const popover = document.getElementById('chat-filter-popover');
  const btn = document.getElementById('chat-filter-btn');
  if (!popover || !btn) return;
  popover.classList.add('show');
  btn.classList.add('active');
  btn.setAttribute('aria-expanded', 'true');
  updateFilterUI();
  if (window.lucide) window.lucide.createIcons();
}

export function closeFilterPopover() {
  const popover = document.getElementById('chat-filter-popover');
  const btn = document.getElementById('chat-filter-btn');
  if (!popover || !btn) return;
  popover.classList.remove('show');
  btn.classList.remove('active');
  btn.setAttribute('aria-expanded', 'false');
}

export function renderThreadList() {
  const container = document.getElementById('chat-threads-container');
  if (!container) return;

  updateTabCounts();
  updateFilterUI();

  const threads = getFilteredThreads();

  if (threads.length === 0) {
    container.innerHTML = `
      <div class="chat-threads-empty">
        <div class="chat-empty-icon">
          <i data-lucide="filter-x" style="width: 24px; height: 24px;"></i>
        </div>
        <h4 class="chat-empty-title">Nenhuma conversa encontrada</h4>
        <p class="chat-empty-subtitle">Nenhum atendimento corresponde aos filtros aplicados.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-empty-clear-filters">
          <i data-lucide="rotate-ccw" style="width: 13px; height: 13px;"></i>
          <span>Limpar filtros</span>
        </button>
      </div>
    `;

    const emptyClearBtn = document.getElementById('btn-empty-clear-filters');
    if (emptyClearBtn) {
      emptyClearBtn.addEventListener('click', () => {
        resetAllFilters();
      });
    }

    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Preserve or update active thread
  const hasActiveInList = threads.some(t => t.id === activeThreadId);
  if (!hasActiveInList && threads.length > 0) {
    activeThreadId = threads[0].id;
    renderActiveChat();
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
              ${thread.isMuted ? '<i data-lucide="bell-off" style="width: 12px; height: 12px; color: var(--text-muted); opacity: 0.8;" title="Silenciado"></i>' : ''}
              ${thread.isBlocked ? '<span style="font-size: 9px; font-weight: 700; background: rgba(239, 68, 68, 0.15); color: #EF4444; padding: 1px 5px; border-radius: 4px;">BLOQUEADO</span>' : ''}
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
  if (!thread) {
    const messagesScroll = document.getElementById('chat-messages-scroll');
    if (messagesScroll) {
      messagesScroll.innerHTML = `
        <div class="chat-threads-empty" style="height: 100%;">
          <div class="chat-empty-icon"><i data-lucide="message-square" style="width: 24px; height: 24px;"></i></div>
          <div style="font-weight: 600; color: var(--text-main);">Nenhuma conversa selecionada</div>
          <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Selecione uma conversa ao lado para visualizar os detalhes.</p>
        </div>
      `;
    }
    const cardContato = document.getElementById('chat-profile-card');
    if (cardContato) cardContato.innerHTML = '';
    const cardAtendimento = document.getElementById('chat-attendance-card');
    if (cardAtendimento) cardAtendimento.innerHTML = '';
    const cardResumo = document.getElementById('chat-ai-summary-card');
    if (cardResumo) cardResumo.innerHTML = '';
    const strip = document.getElementById('ai-attending-strip');
    if (strip) strip.style.display = 'none';
    const header = document.getElementById('chat-arena-header');
    if (header) header.innerHTML = '';
    if (window.lucide) window.lucide.createIcons();
    return;
  }

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
      openTransferModal(thread);
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
        if (msg.sender === 'system') {
          return `
            <div class="message-row system">
              <div class="system-event-bubble">
                <i data-lucide="corner-up-right" style="width: 13px; height: 13px;"></i>
                <span>${msg.text}</span>
              </div>
            </div>
          `;
        }
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
  const sendBtn = document.getElementById('btn-send-chat-msg');
  if (inputField && inputStrip) {
    if (thread.isBlocked) {
      inputField.value = '';
      inputField.disabled = true;
      inputField.placeholder = "⛔ Este contato está bloqueado. Desbloqueie no menu do contato para conversar.";
      inputStrip.classList.remove('active-input');
      inputStrip.style.opacity = '0.6';
      if (sendBtn) sendBtn.disabled = true;
    } else {
      inputField.disabled = false;
      inputStrip.style.opacity = '1';
      if (sendBtn) sendBtn.disabled = false;
      if (thread.isAiAttending) {
        inputField.placeholder = "A IA está respondendo. Você pode assumir o atendimento para enviar mensagens.";
        inputStrip.classList.remove('active-input');
      } else {
        inputField.placeholder = "Digite sua mensagem... (Pressione Enter para enviar)";
        inputStrip.classList.add('active-input');
      }
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
    const isMuted = !!thread.isMuted;
    const isBlocked = !!thread.isBlocked;
    const tags = thread.tags || [];

    cardContato.innerHTML = `
      <div class="profile-card-top-bar">
        <span class="profile-card-top-title">Contato</span>
        <div class="contact-actions-wrap" style="position: relative;">
          <button class="btn-action-round" id="btn-contact-menu-toggle" aria-label="Opções do contato" title="Opções do contato" style="width: 28px; height: 28px;">
            <i data-lucide="more-horizontal" style="width: 14px; height: 14px;"></i>
          </button>
          <div class="contact-actions-dropdown" id="contact-actions-dropdown">
            <button type="button" class="contact-dropdown-item" id="btn-action-edit-contact">
              <i data-lucide="user-cog"></i>
              <span>Editar dados do contato</span>
            </button>
            <button type="button" class="contact-dropdown-item" id="btn-action-copy-phone">
              <i data-lucide="phone"></i>
              <span>Copiar telefone</span>
            </button>
            <button type="button" class="contact-dropdown-item" id="btn-action-copy-email">
              <i data-lucide="mail"></i>
              <span>Copiar e-mail</span>
            </button>
            <button type="button" class="contact-dropdown-item" id="btn-action-manage-tags">
              <i data-lucide="tag"></i>
              <span>Gerenciar etiquetas</span>
            </button>
            <button type="button" class="contact-dropdown-item" id="btn-action-view-crm">
              <i data-lucide="external-link"></i>
              <span>Ver cadastro no CRM</span>
            </button>
            <button type="button" class="contact-dropdown-item" id="btn-action-export-chat">
              <i data-lucide="download"></i>
              <span>Exportar conversa (.txt)</span>
            </button>
            <button type="button" class="contact-dropdown-item" id="btn-action-toggle-mute">
              <i data-lucide="${isMuted ? 'bell' : 'bell-off'}"></i>
              <span>${isMuted ? 'Reativar notificações' : 'Silenciar notificações'}</span>
            </button>
            <div class="contact-dropdown-divider"></div>
            <button type="button" class="contact-dropdown-item item-danger" id="btn-action-block-contact">
              <i data-lucide="ban"></i>
              <span>${isBlocked ? 'Desbloquear contato' : 'Bloquear contato'}</span>
            </button>
            <button type="button" class="contact-dropdown-item item-danger" id="btn-action-delete-conversa">
              <i data-lucide="trash-2"></i>
              <span>Excluir conversa</span>
            </button>
          </div>
        </div>
      </div>

      <div class="profile-contact-row">
        <img src="${thread.img}" alt="${thread.name}" class="profile-contact-avatar">
        <div style="display: flex; flex-direction: column; min-width: 0;">
          <span class="profile-contact-name">${thread.name}</span>
          ${isBlocked ? '<span style="font-size: 11px; color: var(--status-danger); font-weight: 600; margin-top: 2px;">⛔ Bloqueado</span>' : (isMuted ? '<span style="font-size: 11px; color: var(--text-muted); font-weight: 500; margin-top: 2px;">🔕 Silenciado</span>' : '')}
        </div>
      </div>

      <div class="contact-info-list">
        <div class="contact-info-item">
          <span style="color: #25D366; font-size: 15px;">🟢</span>
          <span>${thread.phone || 'Sem telefone'}</span>
        </div>
        <div class="contact-info-item">
          <i data-lucide="mail" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
          <span>${thread.email || 'Sem e-mail'}</span>
        </div>
      </div>

      ${tags.length > 0 ? `
        <div class="contact-tags-display" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-light);">
          ${tags.map(t => `<span class="contact-tag-pill"><i data-lucide="tag" style="width: 10px; height: 10px;"></i>${t}</span>`).join('')}
        </div>
      ` : ''}
    `;

    setupContactActions(thread);
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
  // Tabs
  const tabs = document.querySelectorAll('.chat-tab-pill');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      chatFilterState.tab = tab.getAttribute('data-tab') || 'all';
      renderThreadList();
    });
  });

  // Search input & clear button
  const search = document.getElementById('chat-search-input');
  const searchWrap = document.getElementById('chat-search-wrap');
  const clearBtn = document.getElementById('chat-search-clear-btn');

  if (search) {
    search.addEventListener('input', (e) => {
      chatFilterState.searchQuery = e.target.value;
      if (searchWrap) {
        if (e.target.value.trim().length > 0) {
          searchWrap.classList.add('has-value');
        } else {
          searchWrap.classList.remove('has-value');
        }
      }
      renderThreadList();
    });

    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        search.value = '';
        chatFilterState.searchQuery = '';
        if (searchWrap) searchWrap.classList.remove('has-value');
        renderThreadList();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (search) {
        search.value = '';
        chatFilterState.searchQuery = '';
        if (searchWrap) searchWrap.classList.remove('has-value');
        search.focus();
        renderThreadList();
      }
    });
  }

  // Filter Button Toggle
  const filterBtn = document.getElementById('chat-filter-btn');
  const popover = document.getElementById('chat-filter-popover');

  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popover && popover.classList.contains('show')) {
        closeFilterPopover();
      } else {
        openFilterPopover();
      }
    });
  }

  // Close button in popover header
  const closePopoverBtn = document.getElementById('btn-close-filter-popover');
  if (closePopoverBtn) {
    closePopoverBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeFilterPopover();
    });
  }

  // Reset in popover header
  const resetHeaderBtn = document.getElementById('btn-filter-reset-header');
  if (resetHeaderBtn) {
    resetHeaderBtn.addEventListener('click', () => {
      resetAllFilters();
    });
  }

  // Clear all in popover footer
  const clearFooterBtn = document.getElementById('btn-filter-clear-all');
  if (clearFooterBtn) {
    clearFooterBtn.addEventListener('click', () => {
      resetAllFilters();
    });
  }

  // Quick clear in active chips bar
  const quickClearBtn = document.getElementById('btn-quick-clear-filters');
  if (quickClearBtn) {
    quickClearBtn.addEventListener('click', () => {
      resetAllFilters();
    });
  }

  // Apply button in popover
  const applyBtn = document.getElementById('btn-filter-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      closeFilterPopover();
      const filtered = getFilteredThreads();
      showToast(`Filtros aplicados (${filtered.length} conversas)`);
    });
  }

  // Channel Chips
  const channelChips = document.querySelectorAll('#filter-channel-group .chat-filter-chip');
  channelChips.forEach(chip => {
    chip.addEventListener('click', () => {
      channelChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      chatFilterState.channel = chip.getAttribute('data-filter-val') || 'all';
      renderThreadList();
    });
  });

  // Status Chips
  const statusChips = document.querySelectorAll('#filter-status-group .chat-filter-chip');
  statusChips.forEach(chip => {
    chip.addEventListener('click', () => {
      statusChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      chatFilterState.status = chip.getAttribute('data-filter-val') || 'all';
      renderThreadList();
    });
  });

  // Attendant Chips
  const attendantChips = document.querySelectorAll('#filter-attendant-group .chat-filter-chip');
  attendantChips.forEach(chip => {
    chip.addEventListener('click', () => {
      attendantChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      chatFilterState.attendant = chip.getAttribute('data-filter-val') || 'all';
      renderThreadList();
    });
  });

  // Unread Toggle
  const unreadToggle = document.getElementById('filter-unread-toggle');
  if (unreadToggle) {
    unreadToggle.addEventListener('change', (e) => {
      chatFilterState.unreadOnly = e.target.checked;
      renderThreadList();
    });
  }

  // Tag Select
  const tagSelect = document.getElementById('filter-tag-select');
  if (tagSelect) {
    tagSelect.addEventListener('change', (e) => {
      chatFilterState.tag = e.target.value;
      renderThreadList();
    });
  }

  // Sort Select
  const sortSelect = document.getElementById('filter-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      chatFilterState.sortBy = e.target.value;
      renderThreadList();
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (popover && popover.classList.contains('show')) {
      if (!popover.contains(e.target) && !filterBtn?.contains(e.target)) {
        closeFilterPopover();
      }
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popover && popover.classList.contains('show')) {
      closeFilterPopover();
    }
  });
}

/* ==========================================================================
   Transfer Modal Logic & Destinations Data
   ========================================================================== */

export const transferDestinations = [
  // Atendentes Humanos
  {
    id: 'juliana_santos',
    name: 'Juliana Santos',
    type: 'human',
    typeLabel: 'Humano',
    role: 'Comercial & Vendas (WhatsApp / E-commerce)',
    department: 'Comercial',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'Disponível',
    workload: '2 atendimentos ativos'
  },
  {
    id: 'felipe_costa',
    name: 'Felipe Costa',
    type: 'human',
    typeLabel: 'Humano',
    role: 'Suporte Comercial & Pós-Venda (Instagram)',
    department: 'Vendas',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'Disponível',
    workload: '3 atendimentos ativos'
  },
  {
    id: 'rodrigo_almeida',
    name: 'Rodrigo Almeida',
    type: 'human',
    typeLabel: 'Humano',
    role: 'Suporte Técnico N2 & Integrações de API',
    department: 'Suporte Técnico',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'Disponível',
    workload: '4 atendimentos ativos'
  },
  {
    id: 'carla_menezes',
    name: 'Carla Menezes',
    type: 'human',
    typeLabel: 'Humano',
    role: 'Gerente de Contas Enterprise & Key Accounts',
    department: 'Enterprise',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    status: 'away',
    statusLabel: 'Em pausa',
    workload: '1 atendimento'
  },
  {
    id: 'rafael_mota',
    name: 'Rafael Mota (Você)',
    type: 'human',
    typeLabel: 'Humano',
    role: 'Administrador & Atendimento Geral',
    department: 'Gestão',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'Disponível agora',
    workload: 'Fila pessoal'
  },

  // Agentes de IA
  {
    id: 'pedro_ia',
    name: 'Pedro',
    type: 'ai',
    typeLabel: 'IA',
    role: 'Especialista em Vendas & Atendimento Comercial',
    department: 'Comercial',
    img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'IA Ativa (24/7)',
    workload: 'Capacidade livre'
  },
  {
    id: 'sdr_ia',
    name: 'SDR IA',
    type: 'ai',
    typeLabel: 'IA',
    role: 'Qualificação Rápida & Agendamento de Demonstração',
    department: 'Comercial',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'IA Ativa (24/7)',
    workload: 'Capacidade livre'
  },
  {
    id: 'suporte_ia',
    name: 'Suporte IA',
    type: 'ai',
    typeLabel: 'IA',
    role: 'Resolução Técnica de Dúvidas & FAQ Instantâneo',
    department: 'Suporte Técnico',
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'IA Ativa (24/7)',
    workload: 'Capacidade livre'
  },

  // Filas / Departamentos
  {
    id: 'dept_comercial',
    name: 'Fila Comercial & Vendas',
    type: 'dept',
    typeLabel: 'Fila',
    role: 'Distribuição automática para o próximo vendedor livre',
    department: 'Comercial',
    icon: 'briefcase',
    status: 'online',
    statusLabel: 'Fila Ativa',
    workload: '2 operadores online · Espera < 2 min'
  },
  {
    id: 'dept_suporte',
    name: 'Fila de Suporte Técnico',
    type: 'dept',
    typeLabel: 'Fila',
    role: 'Distribuição para atendentes técnicos especializados',
    department: 'Suporte Técnico',
    icon: 'headphones',
    status: 'online',
    statusLabel: 'Fila Ativa',
    workload: '2 operadores online · Espera < 1 min'
  },
  {
    id: 'dept_financeiro',
    name: 'Fila Financeiro & Cobrança',
    type: 'dept',
    typeLabel: 'Fila',
    role: '2ª via de boleto, notas fiscais e upgrade de planos',
    department: 'Financeiro',
    icon: 'credit-card',
    status: 'online',
    statusLabel: 'Fila Ativa',
    workload: '1 operador online'
  }
];

let currentTransferThread = null;
let currentTransferFilter = 'all';
let selectedTransferDestId = null;

export function openTransferModal(thread) {
  if (!thread) return;
  currentTransferThread = thread;

  const modal = document.getElementById('modal-transfer-chat');
  if (!modal) return;

  // 1. Populate Contact Banner
  const avatarEl = document.getElementById('transfer-contact-avatar');
  const nameEl = document.getElementById('transfer-contact-name');
  const phoneEl = document.getElementById('transfer-contact-phone');
  const channelEl = document.getElementById('transfer-contact-channel');
  const channelLabelEl = document.getElementById('transfer-contact-channel-label');
  const currentAgentEl = document.getElementById('transfer-current-agent-name');

  if (avatarEl) avatarEl.src = thread.img;
  if (nameEl) nameEl.textContent = thread.name;
  if (phoneEl) phoneEl.textContent = thread.phone || '+55 11 98765-4321';
  if (currentAgentEl) currentAgentEl.textContent = `${thread.assignedAgent || 'Pedro'} (${thread.attendingStatus || 'IA atendendo'})`;

  if (channelEl) {
    channelEl.className = `transfer-channel-pill ${(thread.channel || 'whatsapp').toLowerCase()}`;
  }
  if (channelLabelEl) {
    channelLabelEl.textContent = thread.channel || 'WhatsApp';
  }

  // 2. Reset Filter, Search and Inputs
  currentTransferFilter = 'all';
  const searchInput = document.getElementById('transfer-search-input');
  if (searchInput) searchInput.value = '';

  const noteInput = document.getElementById('transfer-internal-note');
  if (noteInput) noteInput.value = '';

  // Select first eligible target (avoid current agent if possible)
  const defaultDest = transferDestinations.find(d => d.name !== (thread.assignedAgent || 'Pedro')) || transferDestinations[0];
  selectedTransferDestId = defaultDest ? defaultDest.id : transferDestinations[0].id;

  const hidId = document.getElementById('transfer-selected-dest-id');
  const hidName = document.getElementById('transfer-selected-dest-name');
  const hidType = document.getElementById('transfer-selected-dest-type');
  if (hidId) hidId.value = defaultDest.id;
  if (hidName) hidName.value = defaultDest.name;
  if (hidType) hidType.value = defaultDest.type;

  // Reset tab buttons
  document.querySelectorAll('.transfer-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-transfer-tab') === 'all');
  });

  renderTransferDestinationsList();

  // 3. Open Modal
  modal.classList.add('open');
  if (window.lucide) window.lucide.createIcons();
}

function renderTransferDestinationsList() {
  const container = document.getElementById('transfer-dest-list');
  if (!container) return;

  const searchInput = document.getElementById('transfer-search-input');
  const term = (searchInput ? searchInput.value : '').toLowerCase().trim();

  let list = transferDestinations.filter(item => {
    if (currentTransferFilter !== 'all' && item.type !== currentTransferFilter) {
      return false;
    }
    if (term) {
      const matchName = item.name.toLowerCase().includes(term);
      const matchRole = item.role.toLowerCase().includes(term);
      const matchDept = (item.department || '').toLowerCase().includes(term);
      return matchName || matchRole || matchDept;
    }
    return true;
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 28px 12px; color: var(--text-muted); font-size: 13px;">
        <i data-lucide="search-x" style="width: 24px; height: 24px; margin-bottom: 6px; display: inline-block;"></i>
        <div>Nenhum atendente ou departamento encontrado para esta busca.</div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = list.map(item => {
    const isSelected = item.id === selectedTransferDestId;
    const isCurrent = currentTransferThread && currentTransferThread.assignedAgent === item.name;

    let visualElement = '';
    if (item.type === 'dept') {
      visualElement = `
        <div class="transfer-dest-icon-box dept">
          <i data-lucide="${item.icon || 'briefcase'}" style="width: 17px; height: 17px;"></i>
        </div>
      `;
    } else if (item.type === 'ai') {
      visualElement = `
        <div class="transfer-dest-icon-box ai">
          <i data-lucide="bot" style="width: 17px; height: 17px;"></i>
        </div>
      `;
    } else {
      visualElement = `
        <img src="${item.img}" alt="${item.name}" class="transfer-dest-avatar">
      `;
    }

    const dotClass = item.status === 'away' ? 'status-dot-indicator away' : 'status-dot-indicator';

    return `
      <div class="transfer-dest-card ${isSelected ? 'selected' : ''}" data-dest-id="${item.id}">
        <div class="transfer-dest-radio"></div>
        ${visualElement}
        <div class="transfer-dest-info">
          <div class="transfer-dest-header">
            <span class="transfer-dest-name">${item.name}</span>
            <span class="transfer-dest-tag ${item.type}">${item.typeLabel}</span>
            ${isCurrent ? '<span class="badge" style="font-size: 10px; padding: 1px 5px; background: rgba(0, 168, 104, 0.1); color: var(--primary);">Atual</span>' : ''}
          </div>
          <div class="transfer-dest-role">${item.role}</div>
        </div>
        <div class="transfer-dest-meta">
          <span class="transfer-dest-status-badge">
            <span class="${dotClass}"></span>
            <span>${item.statusLabel}</span>
          </span>
          <span class="transfer-dest-workload">${item.workload}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.transfer-dest-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedTransferDestId = card.getAttribute('data-dest-id');
      container.querySelectorAll('.transfer-dest-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const destObj = transferDestinations.find(d => d.id === selectedTransferDestId);
      if (destObj) {
        const hidId = document.getElementById('transfer-selected-dest-id');
        const hidName = document.getElementById('transfer-selected-dest-name');
        const hidType = document.getElementById('transfer-selected-dest-type');
        if (hidId) hidId.value = destObj.id;
        if (hidName) hidName.value = destObj.name;
        if (hidType) hidType.value = destObj.type;
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function setupTransferModal() {
  // Category tabs
  document.querySelectorAll('.transfer-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.transfer-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTransferFilter = btn.getAttribute('data-transfer-tab') || 'all';
      renderTransferDestinationsList();
    });
  });

  // Search input
  const searchInput = document.getElementById('transfer-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderTransferDestinationsList();
    });
  }

  // Form Submission
  const form = document.getElementById('form-transfer-chat');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentTransferThread) return;

      const destObj = transferDestinations.find(d => d.id === selectedTransferDestId);
      if (!destObj) {
        alert('Por favor, selecione um atendente ou departamento de destino.');
        return;
      }

      const optNotify = document.getElementById('transfer-opt-notify-client')?.checked;
      const noteInput = document.getElementById('transfer-internal-note');
      const noteText = noteInput ? noteInput.value.trim() : '';

      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // 1. Add system transfer record message
      currentTransferThread.messages.push({
        sender: 'system',
        text: `Atendimento transferido para ${destObj.name} por Rafael Mota`,
        time: nowTime
      });

      // 2. If client notification is enabled, append user-facing transfer message
      if (optNotify) {
        currentTransferThread.messages.push({
          sender: 'bot',
          text: `Você foi transferido(a) para nosso especialista ${destObj.name}. Em instantes daremos continuidade ao seu atendimento!`,
          time: nowTime
        });
      }

      // 3. Update thread state
      currentTransferThread.assignedAgent = destObj.name;
      if (destObj.type === 'ai') {
        currentTransferThread.isAiAttending = true;
        currentTransferThread.attendingStatus = 'IA atendendo';
      } else if (destObj.type === 'human') {
        currentTransferThread.isAiAttending = false;
        currentTransferThread.attendingStatus = `${destObj.name} atendendo`;
      } else {
        currentTransferThread.isAiAttending = false;
        currentTransferThread.attendingStatus = `Fila ${destObj.department || 'Geral'}`;
      }

      // 4. Update snippet in thread list
      currentTransferThread.snippet = `Transferido para ${destObj.name}`;
      currentTransferThread.time = nowTime;

      // 5. Close modal
      const modal = document.getElementById('modal-transfer-chat');
      if (modal) modal.classList.remove('open');

      // 6. Refresh views
      renderThreadList();
      renderActiveChat();

      showToast(`Atendimento com ${currentTransferThread.name} transferido para ${destObj.name} com sucesso!`);
    });
  }
}

// ==========================================
// Contact Profile Actions & Modals Handling
// ==========================================

function setupContactActions(thread) {
  const toggleBtn = document.getElementById('btn-contact-menu-toggle');
  const dropdown = document.getElementById('contact-actions-dropdown');

  if (toggleBtn && dropdown) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
  }

  // 1. Editar dados do contato
  document.getElementById('btn-action-edit-contact')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    openEditContactModal(thread);
  });

  // 2. Copiar telefone
  document.getElementById('btn-action-copy-phone')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    if (thread.phone) {
      copyToClipboard(thread.phone);
      showToast(`Telefone copiado: ${thread.phone}`);
    } else {
      showToast('Nenhum telefone informado para este contato.');
    }
  });

  // 3. Copiar e-mail
  document.getElementById('btn-action-copy-email')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    if (thread.email) {
      copyToClipboard(thread.email);
      showToast(`E-mail copiado: ${thread.email}`);
    } else {
      showToast('Nenhum e-mail informado para este contato.');
    }
  });

  // 4. Gerenciar etiquetas
  document.getElementById('btn-action-manage-tags')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    openManageTagsModal(thread);
  });

  // 5. Ver cadastro no CRM
  document.getElementById('btn-action-view-crm')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    viewInCRM(thread);
  });

  // 6. Exportar histórico (.txt)
  document.getElementById('btn-action-export-chat')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    exportChatTranscript(thread);
  });

  // 7. Silenciar notificações
  document.getElementById('btn-action-toggle-mute')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    thread.isMuted = !thread.isMuted;
    renderRightColumnCards(thread);
    renderThreadList();
    showToast(thread.isMuted ? `Notificações silenciadas para ${thread.name}` : `Notificações reativadas para ${thread.name}`);
    if (window.lucide) window.lucide.createIcons();
  });

  // 8. Bloquear contato
  document.getElementById('btn-action-block-contact')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    if (thread.isBlocked) {
      thread.isBlocked = false;
      renderRightColumnCards(thread);
      renderActiveChat();
      renderThreadList();
      showToast(`Contato ${thread.name} foi desbloqueado com sucesso.`);
    } else {
      openBlockContactModal(thread);
    }
  });

  // 9. Excluir conversa
  document.getElementById('btn-action-delete-conversa')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.remove('show');
    openDeleteConversaModal(thread);
  });
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  document.body.removeChild(textarea);
}

function openEditContactModal(thread) {
  const idInput = document.getElementById('edit-contact-thread-id');
  const nameInput = document.getElementById('edit-contact-name');
  const phoneInput = document.getElementById('edit-contact-phone');
  const emailInput = document.getElementById('edit-contact-email');
  const tagsInput = document.getElementById('edit-contact-tags');
  const notesInput = document.getElementById('edit-contact-notes');

  if (idInput) idInput.value = thread.id;
  if (nameInput) nameInput.value = thread.name || '';
  if (phoneInput) phoneInput.value = thread.phone || '';
  if (emailInput) emailInput.value = thread.email || '';
  if (tagsInput) tagsInput.value = (thread.tags || []).join(', ');
  if (notesInput) notesInput.value = thread.notes || '';

  openModal('modal-edit-contact');
  if (window.lucide) window.lucide.createIcons();
}

function openManageTagsModal(thread) {
  const subtitle = document.getElementById('modal-manage-tags-subtitle');
  if (subtitle) {
    subtitle.textContent = `Gerenciando etiquetas de ${thread.name}`;
  }
  renderManageTagsList(thread);
  openModal('modal-manage-contact-tags');
  if (window.lucide) window.lucide.createIcons();
}

function renderManageTagsList(thread) {
  const container = document.getElementById('manage-tags-list');
  if (!container) return;

  const tags = thread.tags || [];
  if (tags.length === 0) {
    container.innerHTML = `<span style="font-size: 12px; color: var(--text-muted); font-style: italic;">Nenhuma etiqueta vinculada a este contato.</span>`;
    return;
  }

  container.innerHTML = tags.map((t, idx) => `
    <span class="manage-tag-item" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; color: var(--text-main);">
      <span>${t}</span>
      <button type="button" class="btn-remove-tag" data-tag-index="${idx}" aria-label="Remover etiqueta" style="background: none; border: none; padding: 0; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; font-size: 13px; line-height: 1;">✕</button>
    </span>
  `).join('');

  container.querySelectorAll('.btn-remove-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-tag-index'), 10);
      if (!isNaN(idx) && thread.tags) {
        const removed = thread.tags.splice(idx, 1);
        renderManageTagsList(thread);
        renderRightColumnCards(thread);
        showToast(`Etiqueta "${removed[0]}" removida.`);
        if (window.lucide) window.lucide.createIcons();
      }
    });
  });
}

function viewInCRM(thread) {
  // Check if lead already exists in zapChatData.leads.list
  let lead = zapChatData.leads.list.find(l => 
    l.id === thread.id || 
    (l.email && thread.email && l.email.toLowerCase() === thread.email.toLowerCase()) ||
    (l.phone && thread.phone && l.phone.replace(/\D/g, '') === thread.phone.replace(/\D/g, ''))
  );

  if (!lead) {
    const nameParts = (thread.name || 'Contato').split(' ');
    const initials = nameParts.length > 1 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() : nameParts[0].substring(0, 2).toUpperCase();
    lead = {
      id: thread.id,
      name: thread.name,
      initials: initials,
      phone: thread.phone || '+55 11 98888-0000',
      email: thread.email || 'contato@zapchat.com',
      channel: thread.channel || 'WhatsApp',
      status: thread.status || 'Novo',
      statusKey: 'novo',
      score: 85,
      scoreLevel: 'Alto',
      agentName: thread.assignedAgent || 'Pedro',
      agentImg: thread.img,
      lastContact: 'Agora',
      tags: thread.tags || ['Conversa']
    };
    zapChatData.leads.list.unshift(lead);
  }

  // Switch to leads view
  switchView('leads');
  showToast(`Exibindo cadastro de ${thread.name} no CRM de Leads.`);
}

function exportChatTranscript(thread) {
  const dateStr = new Date().toLocaleString('pt-BR');
  const divider = '==============================================================';
  const subDivider = '--------------------------------------------------------------';

  let content = `${divider}\n`;
  content += `ZAPCHAT - HISTÓRICO DE ATENDIMENTO\n`;
  content += `${divider}\n\n`;
  content += `Contato: ${thread.name}\n`;
  content += `Telefone: ${thread.phone || 'Não informado'}\n`;
  content += `E-mail: ${thread.email || 'Não informado'}\n`;
  content += `Canal: ${thread.channel}\n`;
  content += `Atendente Atual: ${thread.assignedAgent || 'Não atribuído'}\n`;
  content += `Status do Atendimento: ${thread.attendingStatus || thread.status}\n`;
  content += `Etiquetas: ${(thread.tags || []).join(', ') || 'Nenhuma'}\n`;
  content += `Data da Exportação: ${dateStr}\n\n`;
  content += `${subDivider}\n`;
  content += `HISTÓRICO DE MENSAGENS (${thread.messages ? thread.messages.length : 0} mensagens)\n`;
  content += `${subDivider}\n\n`;

  if (thread.messages && thread.messages.length > 0) {
    thread.messages.forEach(msg => {
      let senderName = 'Desconhecido';
      if (msg.sender === 'user') senderName = thread.name;
      else if (msg.sender === 'bot') senderName = `${thread.assignedAgent || 'IA'} (ZapChat)`;
      else if (msg.sender === 'system') senderName = '[EVENTO DO SISTEMA]';

      content += `[${msg.time || '00:00'}] ${senderName}:\n${msg.text}\n\n`;
    });
  } else {
    content += `Nenhuma mensagem registrada nesta conversa.\n\n`;
  }

  content += `${subDivider}\n`;
  content += `Fim do histórico exportado - ZapChat Atendimento Inteligente\n`;
  content += `${divider}\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (thread.name || 'conversa').toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.download = `zapchat_${safeName}_${Date.now()}.txt`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Histórico da conversa com ${thread.name} exportado com sucesso!`);
}

function openBlockContactModal(thread) {
  const nameEl = document.getElementById('block-contact-name');
  if (nameEl) nameEl.textContent = thread.name;
  openModal('modal-block-contact');
  if (window.lucide) window.lucide.createIcons();
}

function openDeleteConversaModal(thread) {
  const nameEl = document.getElementById('delete-conversa-name');
  if (nameEl) nameEl.textContent = thread.name;
  openModal('modal-delete-conversa');
  if (window.lucide) window.lucide.createIcons();
}

function setupContactModals() {
  // 1. Edit Contact Form
  const formEdit = document.getElementById('form-edit-contact');
  if (formEdit) {
    formEdit.addEventListener('submit', (e) => {
      e.preventDefault();
      const threadId = document.getElementById('edit-contact-thread-id')?.value;
      const thread = zapChatData.conversas.threads.find(t => t.id === threadId);
      if (!thread) return;

      const nameVal = document.getElementById('edit-contact-name')?.value.trim();
      const phoneVal = document.getElementById('edit-contact-phone')?.value.trim();
      const emailVal = document.getElementById('edit-contact-email')?.value.trim();
      const tagsVal = document.getElementById('edit-contact-tags')?.value.trim();
      const notesVal = document.getElementById('edit-contact-notes')?.value.trim();

      if (nameVal) thread.name = nameVal;
      if (phoneVal) thread.phone = phoneVal;
      if (emailVal) thread.email = emailVal;
      thread.notes = notesVal;

      if (tagsVal) {
        thread.tags = tagsVal.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        thread.tags = [];
      }

      closeAllModals();
      renderActiveChat();
      renderThreadList();
      showToast(`Dados de ${thread.name} atualizados com sucesso!`);
    });
  }

  // 2. Manage Tags Modal
  const addTagBtn = document.getElementById('btn-add-tag-to-contact');
  const tagInput = document.getElementById('input-new-tag-name');
  if (addTagBtn && tagInput) {
    const handleAdd = () => {
      const tagText = tagInput.value.trim();
      if (!tagText) return;
      const thread = zapChatData.conversas.threads.find(t => t.id === activeThreadId);
      if (!thread) return;
      if (!thread.tags) thread.tags = [];
      if (!thread.tags.includes(tagText)) {
        thread.tags.push(tagText);
        tagInput.value = '';
        renderManageTagsList(thread);
        renderRightColumnCards(thread);
        showToast(`Etiqueta "${tagText}" adicionada.`);
      } else {
        showToast(`A etiqueta "${tagText}" já existe neste contato.`);
      }
    };
    addTagBtn.addEventListener('click', handleAdd);
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    });
  }

  // Suggestions row
  document.querySelectorAll('.tag-suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tagText = chip.getAttribute('data-tag');
      if (!tagText) return;
      const thread = zapChatData.conversas.threads.find(t => t.id === activeThreadId);
      if (!thread) return;
      if (!thread.tags) thread.tags = [];
      if (!thread.tags.includes(tagText)) {
        thread.tags.push(tagText);
        renderManageTagsList(thread);
        renderRightColumnCards(thread);
        showToast(`Etiqueta "${tagText}" adicionada.`);
      }
    });
  });

  // Done button in Manage Tags Modal
  document.getElementById('btn-save-tags-modal')?.addEventListener('click', () => {
    closeAllModals();
    renderThreadList();
  });

  // 3. Block Contact Confirm
  document.getElementById('btn-confirm-block-contact')?.addEventListener('click', () => {
    const thread = zapChatData.conversas.threads.find(t => t.id === activeThreadId);
    if (!thread) return;
    thread.isBlocked = true;
    closeAllModals();
    renderRightColumnCards(thread);
    renderActiveChat();
    renderThreadList();
    showToast(`Contato ${thread.name} foi bloqueado.`);
  });

  // 4. Delete Conversa Confirm
  document.getElementById('btn-confirm-delete-conversa')?.addEventListener('click', () => {
    const threadIdx = zapChatData.conversas.threads.findIndex(t => t.id === activeThreadId);
    if (threadIdx === -1) return;
    const thread = zapChatData.conversas.threads[threadIdx];
    const threadName = thread.name;

    zapChatData.conversas.threads.splice(threadIdx, 1);
    closeAllModals();

    if (zapChatData.conversas.threads.length > 0) {
      activeThreadId = zapChatData.conversas.threads[0].id;
    } else {
      activeThreadId = null;
    }

    renderThreadList();
    renderActiveChat();
    showToast(`Conversa com ${threadName} excluída com sucesso.`);
  });

  // Global click outside to close contact dropdown
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.contact-actions-wrap')) {
      const dropdown = document.getElementById('contact-actions-dropdown');
      if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
      }
    }
  });
}


