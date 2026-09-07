import { zapChatData } from './data.js';
import { initTheme } from './theme.js';
import { initNavigation, switchView, closeAllModals } from './navigation.js';
import { renderConversasAreaChart, renderPlanUsageDonut, renderAgentsBarChart } from './charts.js';
import { initLeadsView } from './leads.js';
import { initChannelsView } from './channels.js';
import { initChatView } from './chat.js';
import { initSettingsView } from './settings.js';
import { initSuporteView, renderTickets } from './suporte.js';
import { initEditAgentView, openEditAgent, openTestAiModal } from './editar-agente.js';
import { initNotifications } from './notifications.js';

document.addEventListener('DOMContentLoaded', () => {
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
  renderSimplifiedAgentsTable(zapChatData.agentes.list);

  // Search filter
  const searchInput = document.getElementById('agents-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = zapChatData.agentes.list.filter(agent => {
        return agent.name.toLowerCase().includes(q) ||
               agent.role.toLowerCase().includes(q) ||
               agent.channel.toLowerCase().includes(q) ||
               agent.status.toLowerCase().includes(q);
      });
      renderSimplifiedAgentsTable(filtered);
    });
  }
}

function renderSimplifiedAgentsTable(agents) {
  const tableBody = document.getElementById('agents-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = agents.map(agent => {
    const isTesting = agent.statusType === 'testing';
    const statusClass = isTesting ? 'badge-testing' : 'badge-active';
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
            <button class="btn-action-round" style="width: 28px; height: 28px;">
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

      initAgents();
      closeAllModals();
      formAgent.reset();
      alert(`Agente "${name}" criado com sucesso!`);
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
