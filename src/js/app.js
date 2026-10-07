import { zapChatData } from './data.js';
import { initTheme } from './theme.js';
import { initNavigation, switchView, closeAllModals, openModal } from './navigation.js';
import { renderConversasAreaChart, renderPlanUsageDonut, renderAgentsBarChart } from './charts.js';
import { initLeadsView } from './leads.js';
import { initChannelsView } from './channels.js';
import { initChatView } from './chat.js';
import { initSettingsView, showToast } from './settings.js';
import { initSuporteView, renderTickets } from './suporte.js';
import { initEditAgentView, openEditAgent, openTestAiModal } from './editar-agente.js';
import { initNotifications } from './notifications.js';

export function renderInstagramIcons(root = document) {
  if (!root || !root.querySelectorAll) return;
  const elements = root.querySelectorAll('i[data-lucide="instagram"], [data-lucide="instagram"]');
  elements.forEach(el => {
    const width = el.style.width || el.getAttribute('width') || '16px';
    const height = el.style.height || el.getAttribute('height') || '16px';
    const color = el.style.color || 'currentColor';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', width.replace('px', ''));
    svg.setAttribute('height', height.replace('px', ''));
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', color);
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    if (el.className) svg.className.baseVal = el.className;
    svg.innerHTML = '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>';
    el.replaceWith(svg);
  });
}

function setupLucideInstagramSupport() {
  if (typeof window !== 'undefined' && window.lucide && !window.lucide._instagramPatched) {
    const origCreateIcons = window.lucide.createIcons.bind(window.lucide);
    window.lucide.createIcons = function(options) {
      renderInstagramIcons(options?.root || document);
      return origCreateIcons(options);
    };
    window.lucide._instagramPatched = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupLucideInstagramSupport();
  initTheme();
  initNavigation();
  initDashboard();
  initAgents();
  initLeadsView();
  initChannelsView();
  initChatView();
  initSettingsView();
  initSuporteView();
  initEditAgentView();
  initNotifications();
  setupForms();

  // Create Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Handle re-renders when views become active
  window.addEventListener('viewChanged', (e) => {
    const view = e.detail.view;
    if (view === 'dashboard') {
      setTimeout(() => {
        renderConversasAreaChart('chart-conversas-area', zapChatData.dashboard.conversasChart);
        renderPlanUsageDonut('plan-usage-donut', zapChatData.dashboard.planUsage.percent);
      }, 50);
    } else if (view === 'agentes') {
      setTimeout(() => {
        renderAgentsBarChart('chart-performance-bars', zapChatData.agentes.performanceHistory);
      }, 50);
    } else if (view === 'suporte') {
      setTimeout(() => {
        renderTickets();
      }, 50);
    }
    if (window.lucide) window.lucide.createIcons();
  });
});

function initDashboard() {
  // Render Area Chart
  renderConversasAreaChart('chart-conversas-area', zapChatData.dashboard.conversasChart);

  // Render Plan Usage Donut
  renderPlanUsageDonut('plan-usage-donut', zapChatData.dashboard.planUsage.percent);

  // Render Seus Agentes
  const seusAgentesEl = document.getElementById('dash-seus-agentes');
  if (seusAgentesEl) {
    seusAgentesEl.innerHTML = zapChatData.dashboard.seusAgentes.map(agent => `
      <div class="dash-agent-item" onclick="switchView('agentes')">
        <div class="dash-agent-avatar" style="background-color: ${agent.bg}; color: ${agent.color};">
          ${agent.initials}
        </div>
        <div class="dash-agent-info">
          <span class="dash-agent-name">${agent.name}</span>
          <span class="dash-agent-status-badge ${agent.statusType}">${agent.status}</span>
        </div>
        <div class="dash-agent-meta">
          <span>Conversas: ${agent.conversas}</span>
          <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
        </div>
      </div>
    `).join('');
  }

  // Render Conversas Recentes
  const conversasRecentesEl = document.getElementById('dash-conversas-recentes');
  if (conversasRecentesEl) {
    conversasRecentesEl.innerHTML = zapChatData.dashboard.conversasRecentes.map(item => `
      <div class="dash-conversa-item" onclick="switchView('conversas')">
        <div class="dash-conversa-avatar" style="background-color: ${item.bg}; color: ${item.color};">
          ${item.initials}
        </div>
        <div class="dash-conversa-content">
          <span class="dash-conversa-name">${item.name}</span>
          <span class="dash-conversa-snippet">${item.preview}</span>
        </div>
        <div class="dash-conversa-meta">
          <span class="dash-conversa-time">${item.time}</span>
          <div class="dash-conversa-channel-icon" title="${item.channel}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg>
          </div>
        </div>
      </div>
    `).join('');
  }

  if (window.lucide) window.lucide.createIcons();
}

function initAgents() {
  refreshAgentsTable();
  setupAgentActions();

  // Search filter
  const searchInput = document.getElementById('agents-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      refreshAgentsTable();
    });
  }
}

export function updateAgentStats() {
  const activeCount = zapChatData.agentes.list.filter(a => a.status === 'Ativo').length;
  const totalCount = zapChatData.agentes.list.length;

  const kpiActive = document.getElementById('kpi-agents-active-count');
  const kpiTotal = document.getElementById('kpi-agents-total-count');
  const tableCount = document.getElementById('agents-table-count');

  if (kpiActive) kpiActive.textContent = activeCount;
  if (kpiTotal) kpiTotal.textContent = `de ${totalCount} criados`;
  if (tableCount) tableCount.textContent = `(${totalCount})`;
}

export function refreshAgentsTable() {
  updateAgentStats();
  const searchInput = document.getElementById('agents-search-input');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

  if (q) {
    const filtered = zapChatData.agentes.list.filter(agent => {
      return agent.name.toLowerCase().includes(q) ||
             agent.role.toLowerCase().includes(q) ||
             agent.channel.toLowerCase().includes(q) ||
             agent.status.toLowerCase().includes(q);
    });
    renderSimplifiedAgentsTable(filtered);
  } else {
    renderSimplifiedAgentsTable(zapChatData.agentes.list);
  }
}

export function toggleAgentActionsPopover(button, agentId) {
  const popover = document.getElementById('agent-actions-popover');
  if (!popover) return;

  const currentActiveId = popover.getAttribute('data-active-agent-id');
  const isAlreadyOpen = popover.classList.contains('show');

  if (isAlreadyOpen && currentActiveId === agentId) {
    closeAgentActionsPopover();
    return;
  }

  const agent = zapChatData.agentes.list.find(a => a.id === agentId);
  if (!agent) return;

  // Set active agent ID
  popover.setAttribute('data-active-agent-id', agentId);

  // Mark active button
  document.querySelectorAll('.agent-more-btn').forEach(b => b.classList.remove('is-active'));
  button.classList.add('is-active');

  const isActive = agent.status === 'Ativo';

  popover.innerHTML = `
    <button type="button" class="agent-popover-item" data-action="toggle-status" role="menuitem">
      <i data-lucide="${isActive ? 'pause-circle' : 'play-circle'}"></i>
      <span>${isActive ? 'Pausar agente' : 'Ativar agente'}</span>
    </button>
    <button type="button" class="agent-popover-item" data-action="duplicate" role="menuitem">
      <i data-lucide="copy"></i>
      <span>Duplicar agente</span>
    </button>
    <button type="button" class="agent-popover-item" data-action="chat" role="menuitem">
      <i data-lucide="message-square"></i>
      <span>Ver conversas</span>
    </button>
    <button type="button" class="agent-popover-item" data-action="config" role="menuitem">
      <i data-lucide="sliders"></i>
      <span>Configurações & Prompt</span>
    </button>
    <button type="button" class="agent-popover-item" data-action="copy-id" role="menuitem">
      <i data-lucide="link"></i>
      <span>Copiar ID do agente</span>
    </button>
    <div class="agent-popover-divider"></div>
    <button type="button" class="agent-popover-item danger" data-action="delete" role="menuitem">
      <i data-lucide="trash-2"></i>
      <span>Excluir agente</span>
    </button>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Show popover to calculate dimensions
  popover.style.display = 'flex';
  popover.style.visibility = 'hidden';
  popover.classList.add('show');

  const btnRect = button.getBoundingClientRect();
  const popoverWidth = popover.offsetWidth || 220;
  const popoverHeight = popover.offsetHeight || 230;

  let left = btnRect.right - popoverWidth;
  if (left < 10) left = 10;
  if (left + popoverWidth > window.innerWidth - 10) {
    left = window.innerWidth - popoverWidth - 10;
  }

  let top = btnRect.bottom + 6;
  if (top + popoverHeight > window.innerHeight - 10) {
    top = btnRect.top - popoverHeight - 6;
  }

  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
  popover.style.visibility = 'visible';
}

export function closeAgentActionsPopover() {
  const popover = document.getElementById('agent-actions-popover');
  if (popover) {
    popover.classList.remove('show');
    popover.removeAttribute('data-active-agent-id');
  }
  document.querySelectorAll('.agent-more-btn').forEach(b => b.classList.remove('is-active'));
}

function setupAgentActions() {
  const popover = document.getElementById('agent-actions-popover');

  // Delegated click for .agent-more-btn
  document.addEventListener('click', (e) => {
    const moreBtn = e.target.closest('.agent-more-btn');
    if (moreBtn) {
      e.preventDefault();
      e.stopPropagation();
      const agentId = moreBtn.getAttribute('data-agent-id');
      toggleAgentActionsPopover(moreBtn, agentId);
      return;
    }

    // Click outside closes popover
    if (popover && popover.classList.contains('show') && !popover.contains(e.target)) {
      closeAgentActionsPopover();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popover && popover.classList.contains('show')) {
      closeAgentActionsPopover();
    }
  });

  // Close on window scroll/resize
  window.addEventListener('scroll', () => {
    if (popover && popover.classList.contains('show')) {
      closeAgentActionsPopover();
    }
  }, true);

  window.addEventListener('resize', () => {
    if (popover && popover.classList.contains('show')) {
      closeAgentActionsPopover();
    }
  });

  // Actions inside popover
  if (popover) {
    popover.addEventListener('click', (e) => {
      const item = e.target.closest('.agent-popover-item');
      if (!item) return;

      const action = item.getAttribute('data-action');
      const agentId = popover.getAttribute('data-active-agent-id');
      closeAgentActionsPopover();

      if (!agentId) return;
      const agent = zapChatData.agentes.list.find(a => a.id === agentId);
      if (!agent) return;

      if (action === 'toggle-status') {
        if (agent.status === 'Ativo') {
          agent.status = 'Pausado';
          agent.statusType = 'paused';
          showToast(`Agente "${agent.name}" foi pausado.`);
        } else {
          agent.status = 'Ativo';
          agent.statusType = 'active';
          showToast(`Agente "${agent.name}" ativado com sucesso!`);
        }
        refreshAgentsTable();
      } else if (action === 'duplicate') {
        const newAgent = {
          ...agent,
          id: 'agent_' + Date.now(),
          name: `${agent.name} (Cópia)`,
          conversas: '0',
          conversasTrend: '↑ 0%',
          status: 'Em teste',
          statusType: 'testing'
        };
        const origIndex = zapChatData.agentes.list.findIndex(a => a.id === agent.id);
        zapChatData.agentes.list.splice(origIndex + 1, 0, newAgent);
        refreshAgentsTable();
        showToast(`Agente "${newAgent.name}" duplicado com sucesso!`);
      } else if (action === 'chat') {
        switchView('conversas');
        showToast(`Visualizando conversas do agente "${agent.name}"`);
      } else if (action === 'config') {
        openEditAgent(agent.id);
      } else if (action === 'copy-id') {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(agent.id);
        }
        showToast(`ID copiado: ${agent.id}`);
      } else if (action === 'delete') {
        const nameEl = document.getElementById('delete-agent-target-name');
        const idInput = document.getElementById('delete-agent-id');
        if (nameEl) nameEl.textContent = agent.name;
        if (idInput) idInput.value = agent.id;
        openModal('modal-delete-agent');
      }
    });
  }

  // Delete modal confirm button
  const btnConfirmDelete = document.getElementById('btn-confirm-delete-agent');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', () => {
      const agentId = document.getElementById('delete-agent-id')?.value;
      const idx = zapChatData.agentes.list.findIndex(a => a.id === agentId);
      if (idx !== -1) {
        const name = zapChatData.agentes.list[idx].name;
        zapChatData.agentes.list.splice(idx, 1);
        closeAllModals();
        refreshAgentsTable();
        showToast(`Agente "${name}" excluído com sucesso.`);
      }
    });
  }
}

function renderSimplifiedAgentsTable(agents) {
  const tableBody = document.getElementById('agents-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = agents.map(agent => {
    let statusClass = 'badge-active';
    if (agent.statusType === 'testing' || agent.status === 'Em teste') {
      statusClass = 'badge-testing';
    } else if (agent.statusType === 'paused' || agent.status === 'Pausado') {
      statusClass = 'badge-paused';
    }
    const channelIcon = agent.channel === 'WhatsApp' ? '🟢' : (agent.channel === 'Instagram' ? '📷' : '💬');

    return `
      <tr>
        <td>
          <div class="agent-cell-main">
            <div class="agent-icon-avatar" style="background-color: ${agent.avatarBg}; color: ${agent.avatarColor};">
              <i data-lucide="bot" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <span class="agent-title-text">${agent.name}</span>
              <span class="agent-role-text">${agent.role}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-dot ${statusClass}">${agent.status}</span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 700; color: var(--text-main); font-size: 14px;">${agent.conversas}</span>
            <span style="font-size: 11px; color: var(--status-active); font-weight: 600;">${agent.conversasTrend}</span>
          </div>
        </td>
        <td>
          <div class="agent-channel-badge">
            <span>${channelIcon}</span>
            <span>${agent.channel}</span>
          </div>
        </td>
        <td>
          <div class="agent-actions-group">
            <button class="btn btn-secondary btn-sm" onclick="openEditAgent('${agent.id}')">
              <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
              Editar
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openTestAiModal('${agent.id}')">
              <i data-lucide="play" style="width: 12px; height: 12px;"></i>
              Testar
            </button>
            <button class="btn-action-round agent-more-btn" data-agent-id="${agent.id}" title="Mais opções" style="width: 28px; height: 28px;">
              <i data-lucide="more-horizontal" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function setupForms() {
  // New Agent Form
  const formAgent = document.getElementById('form-new-agent');
  if (formAgent) {
    formAgent.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('agent-input-name').value;
      const role = document.getElementById('agent-input-role').value;
      const channel = document.getElementById('agent-input-channel').value;

      zapChatData.agentes.list.unshift({
        id: 'agent_' + Date.now(),
        name: name,
        role: role,
        channel: channel,
        channels: [channel],
        status: 'Ativo',
        statusType: 'active',
        conversas: '0',
        conversasTrend: '↑ 0%',
        tempoMedio: '1m 10s',
        tempoTrend: '↓ 0s',
        satisfacao: 95,
        avatarBg: '#E9F7F1',
        avatarColor: '#00A868'
      });

      refreshAgentsTable();
      closeAllModals();
      formAgent.reset();
      showToast(`Agente "${name}" criado com sucesso!`);
    });
  }

  // New Lead Form
  const formLead = document.getElementById('form-new-lead');
  if (formLead) {
    formLead.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('lead-input-name').value;
      const phone = document.getElementById('lead-input-phone').value;
      const channel = document.getElementById('lead-input-channel').value;

      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      zapChatData.leads.list.unshift({
        id: 'lead_' + Date.now(),
        name: name,
        initials: initials,
        phone: phone,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        channel: channel,
        status: 'Novo',
        statusClass: 'status-info',
        score: 75,
        scoreLevel: 'Alto',
        agentName: 'Maria Pereira',
        agentImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        lastContact: 'Agora',
        stage: 'Novo lead',
        stageClass: 'blue',
        interests: ['Atendimento WhatsApp', 'Automação'],
        tags: ['Novo Lead', 'Qualificado'],
        nextAction: { text: 'Primeiro contato', time: 'Hoje' },
        notes: 'Lead cadastrado manualmente através da plataforma.'
      });

      initLeadsView();
      closeAllModals();
      formLead.reset();
      alert(`Lead "${name}" cadastrado com sucesso!`);
    });
  }
}
