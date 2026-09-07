// Suporte & Central de Chamados Module

import { showToast } from './settings.js';

let tickets = [];

export function initSuporteView() {
  loadTickets();
  renderTickets();
  setupTicketForm();
  setupOpenTicketButton();
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
 * Load tickets from LocalStorage or initialize
 */
function loadTickets() {
  const saved = localStorage.getItem('zapchat_tickets');
  if (saved) {
    try {
      tickets = JSON.parse(saved);
    } catch (e) {
      tickets = [];
    }
  } else {
    // Start empty to match the initial state from Screenshot 1
    tickets = [];
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
  const openCount = tickets.filter(t => t.status === 'Em aberto').length;
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
 * Render tickets or empty state
 */
export function renderTickets() {
  updateStats();

  const emptyState = document.getElementById('suporte-empty-state');
  const tableWrap = document.getElementById('suporte-tickets-table-wrap');
  const tbody = document.getElementById('suporte-tickets-tbody');

  if (!emptyState || !tableWrap || !tbody) return;

  if (tickets.length === 0) {
    emptyState.style.display = 'flex';
    tableWrap.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    tableWrap.style.display = 'block';

    tbody.innerHTML = tickets.map(t => {
      const statusBadgeClass = t.status === 'Resolvido' 
        ? 'badge' 
        : (t.status === 'Em análise' ? 'badge' : 'badge badge-active');
      const statusBg = t.status === 'Resolvido'
        ? 'background: var(--bg-hover); color: var(--text-muted);'
        : (t.status === 'Em análise' ? 'background: #FEF3C7; color: #D97706;' : '');

      return `
        <tr>
          <td><span class="ticket-protocol">${t.id}</span></td>
          <td>
            <span class="badge" style="background: rgba(0, 168, 104, 0.1); color: var(--primary); font-weight: 600;">
              ${t.tipo}
            </span>
          </td>
          <td>
            <div class="ticket-title-cell">
              <span class="ticket-main-title">${escapeHtml(t.titulo)}</span>
              <span class="ticket-desc-snippet">${escapeHtml(t.descricao)}</span>
            </div>
          </td>
          <td style="color: var(--text-muted); font-size: 13px;">${t.createdAt}</td>
          <td>
            <span class="${statusBadgeClass}" style="${statusBg}">${t.status}</span>
          </td>
          <td style="text-align: right;">
            ${t.status !== 'Resolvido' ? `
              <button type="button" class="btn btn-secondary btn-sm btn-resolve-ticket" data-ticket-id="${t.id}" title="Marcar como resolvido">
                <i data-lucide="check" style="width: 13px; height: 13px;"></i> Concluir
              </button>
            ` : `
              <span style="font-size: 12px; color: var(--text-muted);">Encerrado</span>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Attach resolve handlers
    tbody.querySelectorAll('.btn-resolve-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ticket-id');
        resolveTicket(id);
      });
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
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

    const newTicket = {
      id: `#TK-${Math.floor(1000 + Math.random() * 9000)}`,
      tipo,
      titulo,
      descricao,
      status: 'Em aberto',
      createdAt: new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    tickets.unshift(newTicket);
    saveTickets();
    renderTickets();

    // Close modal
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));

    // Reset form
    form.reset();

    showToast(`Ticket ${newTicket.id} aberto com sucesso! Nossa equipe responderá em breve.`);
  });
}

function resolveTicket(ticketId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (ticket) {
    ticket.status = 'Resolvido';
    saveTickets();
    renderTickets();
    showToast(`Ticket ${ticketId} marcado como resolvido!`);
  }
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
