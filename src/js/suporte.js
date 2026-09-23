// Suporte & Central de Chamados Module

import { showToast } from './settings.js';

let tickets = [];
let currentOpenTicketId = null;

export function initSuporteView() {
  loadTickets();
  renderTickets();
  setupTicketForm();
  setupOpenTicketButton();
  setupTicketDetailInteractions();
}

function setupOpenTicketButton() {
  const btn = document.getElementById('btn-open-new-ticket');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('modal-new-ticket');
      if (modal) {
        modal.classList.add('open');
      }
    });
  }
}

/**
 * Generate 8-character protocol like #6WKE9HD0
 */
function generateProtocol() {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#${code}`;
}

/**
 * Format date time as DD/MM/YYYY HH:mm
 */
function formatDateTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Calculate relative time
 */
function getRelativeTime(timestamp) {
  if (!timestamp) return 'há poucos segundos';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return `há ${diffSec <= 5 ? 'poucos' : diffSec} segundos`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `há ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  const diffDay = Math.floor(diffHour / 24);
  return `há ${diffDay} dia${diffDay > 1 ? 's' : ''}`;
}

/**
 * Load tickets from LocalStorage or initialize
 */
function loadTickets() {
  const saved = localStorage.getItem('zapchat_tickets');
  if (saved) {
    try {
      tickets = JSON.parse(saved);
      tickets.forEach(t => {
        if (!t.createdAtTimestamp) {
          t.createdAtTimestamp = Date.now() - 60000;
        }
        if (!t.messages || t.messages.length === 0) {
          t.messages = [
            {
              sender: 'Rafael Mota',
              text: t.descricao || 'Mensagem inicial do chamado',
              time: t.createdAt || formatDateTime(),
              isUser: true
            }
          ];
        }
        if (!t.status) t.status = 'Aberto';
        if (t.status === 'Em aberto') t.status = 'Aberto';
        if (!t.atendente) t.atendente = 'Aguardando atribuição';
      });
    } catch (e) {
      tickets = [];
    }
  } else {
    tickets = [
      {
        id: '#6WKE9HD0',
        tipo: 'Técnico',
        titulo: 'Teste',
        descricao: 'TesteTesteTeste',
        status: 'Aberto',
        atendente: 'Aguardando atribuição',
        createdAt: '23/09/2026 17:19',
        createdAtTimestamp: Date.now() - 33000,
        messages: [
          {
            sender: 'Rafael Mota',
            text: 'TesteTesteTeste',
            time: '23/09/2026 17:19',
            isUser: true
          }
        ]
      }
    ];
    saveTickets();
  }
}

/**
 * Save tickets to LocalStorage
 */
function saveTickets() {
  localStorage.setItem('zapchat_tickets', JSON.stringify(tickets));
}

/**
 * Update the 4 Metric Cards in Suporte
 */
function updateStats() {
  const openCount = tickets.filter(t => t.status === 'Aberto' || t.status === 'Em aberto').length;
  const techCount = tickets.filter(t => t.tipo === 'Técnico').length;
  const commCount = tickets.filter(t => t.tipo === 'Comercial').length;
  const totalCount = tickets.length;

  const elOpen = document.getElementById('stat-tickets-open');
  const elTech = document.getElementById('stat-tickets-tech');
  const elComm = document.getElementById('stat-tickets-comm');
  const elTotal = document.getElementById('stat-tickets-total');

  if (elOpen) elOpen.textContent = openCount;
  if (elTech) elTech.textContent = techCount;
  if (elComm) elComm.textContent = commCount;
  if (elTotal) elTotal.textContent = totalCount;
}

/**
 * Render tickets list as cards or empty state
 */
export function renderTickets() {
  updateStats();

  const emptyState = document.getElementById('suporte-empty-state');
  const cardsList = document.getElementById('suporte-tickets-cards-list');

  if (!emptyState || !cardsList) return;

  if (tickets.length === 0) {
    emptyState.style.display = 'flex';
    cardsList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    cardsList.style.display = 'flex';

    cardsList.innerHTML = tickets.map(t => {
      const isAberto = t.status === 'Aberto' || t.status === 'Em aberto';
      const statusClass = isAberto ? 'aberto' : 'resolvido';
      const statusText = isAberto ? 'ABERTO' : 'RESOLVIDO';
      const msgCount = (t.messages && t.messages.length) ? t.messages.length : 1;
      const relTime = getRelativeTime(t.createdAtTimestamp);

      return `
        <div class="suporte-ticket-item-card" data-ticket-id="${t.id}">
          <div class="ticket-card-row-top">
            <h3 class="ticket-card-title">${escapeHtml(t.titulo)}</h3>
            <span class="ticket-card-badge-status ${statusClass}">${statusText}</span>
          </div>
          <div class="ticket-card-row-mid">
            Ticket ${t.id} · ${msgCount} mensagem(ns)
          </div>
          <div class="ticket-card-row-bottom">
            <span class="ticket-card-type">
              <i data-lucide="tag" style="width: 12px; height: 12px;"></i>
              ${escapeHtml(t.tipo)}
            </span>
            <span class="ticket-card-time">${relTime}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    cardsList.querySelectorAll('.suporte-ticket-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const ticketId = card.getAttribute('data-ticket-id');
        openTicketDetail(ticketId);
      });
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Open Ticket Detail Screen (Screenshot 2)
 */
export function openTicketDetail(ticketId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  currentOpenTicketId = ticketId;

  const listContainer = document.getElementById('suporte-list-container');
  const detailContainer = document.getElementById('suporte-detail-container');

  if (listContainer) listContainer.style.display = 'none';
  if (detailContainer) detailContainer.style.display = 'block';

  // Populate Header
  const titleProtocol = document.getElementById('ticket-detail-title-protocol');
  if (titleProtocol) titleProtocol.textContent = `Ticket ${ticket.id}`;

  // Populate Left Column
  const convTitle = document.getElementById('ticket-detail-conv-title');
  const convType = document.getElementById('ticket-detail-conv-type');
  const statusPill = document.getElementById('ticket-detail-status-pill');

  if (convTitle) convTitle.textContent = ticket.titulo;
  if (convType) convType.textContent = ticket.tipo;
  if (statusPill) {
    const isAberto = ticket.status === 'Aberto' || ticket.status === 'Em aberto';
    statusPill.textContent = isAberto ? 'Aberto' : 'Resolvido';
    statusPill.className = `ticket-conv-status-pill ${isAberto ? 'aberto' : 'resolvido'}`;
  }

  // Populate Messages Thread
  renderMessagesThread(ticket);

  // Populate Right Column
  const sideProtocol = document.getElementById('sidebar-ticket-protocol');
  const sideStatus = document.getElementById('sidebar-ticket-status');
  const sideAgent = document.getElementById('sidebar-ticket-agent');
  const sideDate = document.getElementById('sidebar-ticket-date');
  const btnResolve = document.getElementById('btn-ticket-resolve-detail');

  if (sideProtocol) sideProtocol.textContent = ticket.id;
  if (sideStatus) sideStatus.textContent = ticket.status === 'Resolvido' ? 'Resolvido' : 'Aberto';
  if (sideAgent) sideAgent.textContent = ticket.atendente || 'Aguardando atribuição';
  if (sideDate) sideDate.textContent = ticket.createdAt;

  if (btnResolve) {
    const isResolvido = ticket.status === 'Resolvido';
    btnResolve.disabled = isResolvido;
    if (isResolvido) {
      btnResolve.innerHTML = `
        <i data-lucide="check" style="width: 16px; height: 16px;"></i>
        <span>Ticket resolvido</span>
      `;
    } else {
      btnResolve.innerHTML = `
        <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
        <span>Marcar como resolvido</span>
      `;
    }
  }

  // Scroll to top
  const mainArea = document.querySelector('.app-main');
  if (mainArea) mainArea.scrollTop = 0;

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Return to Suporte List Screen
 */
export function backToSuporteList() {
  currentOpenTicketId = null;
  const listContainer = document.getElementById('suporte-list-container');
  const detailContainer = document.getElementById('suporte-detail-container');

  if (detailContainer) detailContainer.style.display = 'none';
  if (listContainer) listContainer.style.display = 'block';

  renderTickets();
}

function renderMessagesThread(ticket) {
  const thread = document.getElementById('ticket-detail-messages-thread');
  if (!thread) return;

  if (!ticket.messages || ticket.messages.length === 0) {
    ticket.messages = [
      {
        sender: 'Rafael Mota',
        text: ticket.descricao || '',
        time: ticket.createdAt || formatDateTime(),
        isUser: true
      }
    ];
  }

  thread.innerHTML = ticket.messages.map(msg => {
    const isUser = msg.isUser !== false;
    return `
      <div class="ticket-msg-row ${isUser ? 'user' : 'support'}">
        <div class="ticket-msg-bubble">
          <div class="ticket-msg-meta">
            ${escapeHtml(msg.sender)} · ${msg.time}
          </div>
          <div class="ticket-msg-body">${escapeHtml(msg.text)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function setupTicketDetailInteractions() {
  // Back button
  const backBtn = document.getElementById('btn-back-to-suporte');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      backToSuporteList();
    });
  }

  // Reply form
  const replyForm = document.getElementById('form-ticket-reply');
  if (replyForm) {
    replyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentOpenTicketId) return;

      const textarea = document.getElementById('ticket-reply-textarea');
      const text = textarea ? textarea.value.trim() : '';
      if (!text) return;

      const ticket = tickets.find(t => t.id === currentOpenTicketId);
      if (!ticket) return;

      if (!ticket.messages) ticket.messages = [];

      const newMsg = {
        sender: 'Rafael Mota',
        text: text,
        time: formatDateTime(),
        isUser: true
      };

      ticket.messages.push(newMsg);
      saveTickets();

      if (textarea) textarea.value = '';
      renderMessagesThread(ticket);

      showToast('Resposta enviada com sucesso!');
    });
  }

  // Resolve button
  const btnResolve = document.getElementById('btn-ticket-resolve-detail');
  if (btnResolve) {
    btnResolve.addEventListener('click', () => {
      if (!currentOpenTicketId) return;
      const ticket = tickets.find(t => t.id === currentOpenTicketId);
      if (!ticket || ticket.status === 'Resolvido') return;

      ticket.status = 'Resolvido';
      saveTickets();
      updateStats();

      // Refresh detail UI
      openTicketDetail(currentOpenTicketId);
      showToast(`Ticket ${ticket.id} marcado como resolvido!`);
    });
  }
}

/**
 * Handle new ticket form submission
 */
function setupTicketForm() {
  const form = document.getElementById('form-new-ticket');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const typeInput = document.getElementById('ticket-input-type');
    const titleInput = document.getElementById('ticket-input-title');
    const descInput = document.getElementById('ticket-input-desc');

    const tipo = typeInput ? typeInput.value : 'Técnico';
    const titulo = titleInput ? titleInput.value.trim() : '';
    const descricao = descInput ? descInput.value.trim() : '';

    if (!titulo || !descricao) return;

    const protocol = generateProtocol();
    const nowTime = formatDateTime();

    const newTicket = {
      id: protocol,
      tipo,
      titulo,
      descricao,
      status: 'Aberto',
      atendente: 'Aguardando atribuição',
      createdAt: nowTime,
      createdAtTimestamp: Date.now(),
      messages: [
        {
          sender: 'Rafael Mota',
          text: descricao,
          time: nowTime,
          isUser: true
        }
      ]
    };

    tickets.unshift(newTicket);
    saveTickets();

    // Close modal
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));

    // Reset form
    form.reset();

    // Return to list view and render
    backToSuporteList();

    showToast(`Ticket ${newTicket.id} aberto com sucesso! Nossa equipe responderá em breve.`);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
