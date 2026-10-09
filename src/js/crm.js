import { zapChatData } from './data.js';
import { openChatForLead } from './leads.js';

let activeViewMode = 'kanban'; // 'kanban' | 'list'
let searchQuery = '';
let agentFilter = 'all';
let channelFilter = 'all';
let stageFilter = 'all';
let currentDraggedDealId = null;
let currentViewDeal = null;

export function initCrmView() {
  renderCrmKpis();
  renderCrmBoard();
  setupCrmEvents();
  setupNewDealModal();
  setupViewDealModal();
}

/**
 * Format currency to BRL (R$ 12.500)
 */
function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
}

/**
 * Calculate and render top KPI metrics
 */
export function renderCrmKpis() {
  const deals = zapChatData.crm.deals;
  const totalPipeline = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'ganho');
  const wonValue = wonDeals.reduce((acc, d) => acc + (d.value || 0), 0);
  const conversionRate = deals.length > 0 ? ((wonDeals.length / deals.length) * 100).toFixed(1) : '0';
  const avgTicket = deals.length > 0 ? Math.round(totalPipeline / deals.length) : 0;

  const kpiPipelineEl = document.getElementById('crm-kpi-pipeline-val');
  const kpiConversionEl = document.getElementById('crm-kpi-conversion-val');
  const kpiTicketEl = document.getElementById('crm-kpi-ticket-val');
  const kpiWonEl = document.getElementById('crm-kpi-won-val');
  const activeCountEl = document.getElementById('crm-kpi-active-deals-count');
  const wonCountEl = document.getElementById('crm-kpi-won-deals-count');

  if (kpiPipelineEl) kpiPipelineEl.textContent = formatCurrency(totalPipeline);
  if (kpiConversionEl) kpiConversionEl.textContent = `${conversionRate}%`;
  if (kpiTicketEl) kpiTicketEl.textContent = formatCurrency(avgTicket);
  if (kpiWonEl) kpiWonEl.textContent = formatCurrency(wonValue);
  if (activeCountEl) activeCountEl.textContent = `${deals.length} oportunidades ativas`;
  if (wonCountEl) wonCountEl.textContent = `${wonDeals.length} negócios convertidos`;
}

/**
 * Filter deals based on search, agent, channel, and stage
 */
function getFilteredDeals() {
  return zapChatData.crm.deals.filter(deal => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (deal.title || '').toLowerCase().includes(q) ||
                    (deal.contactName || '').toLowerCase().includes(q) ||
                    (deal.company || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    // Agent filter
    if (agentFilter !== 'all' && deal.agent !== agentFilter) {
      return false;
    }
    // Channel filter
    if (channelFilter !== 'all' && deal.channel !== channelFilter) {
      return false;
    }
    // Stage filter
    if (stageFilter !== 'all' && deal.stage !== stageFilter) {
      return false;
    }
    return true;
  });
}

/**
 * Main render function for CRM Board / Table
 */
export function renderCrmBoard() {
  const container = document.getElementById('crm-content-area');
  if (!container) return;

  const deals = getFilteredDeals();

  if (activeViewMode === 'list') {
    renderCrmListView(container, deals);
  } else {
    renderCrmKanbanView(container, deals);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Render Kanban Pipeline View
 */
function renderCrmKanbanView(container, deals) {
  const stages = zapChatData.crm.stages;

  const boardHtml = `
    <div class="crm-pipeline-board" id="crm-kanban-board">
      ${stages.map(stage => {
        const stageDeals = deals.filter(d => d.stage === stage.id);
        const stageTotal = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);

        return `
          <div class="crm-column" data-stage-id="${stage.id}">
            <div class="crm-col-header">
              <div class="crm-col-header-left">
                <span class="crm-stage-dot ${stage.id}"></span>
                <span class="crm-col-title">${stage.name}</span>
                <span class="crm-col-badge-count">${stageDeals.length}</span>
              </div>
              <div class="crm-col-header-right">
                <span class="crm-col-total-value">${formatCurrency(stageTotal)}</span>
                <button type="button" class="crm-btn-add-deal-mini" title="Nova oportunidade nesta coluna" data-stage="${stage.id}">
                  <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            </div>

            <div class="crm-deals-list" data-stage-id="${stage.id}">
              ${stageDeals.length === 0 ? `
                <div class="crm-empty-col-message">
                  <i data-lucide="inbox" style="width: 24px; height: 24px; stroke-width: 1.5; color: var(--text-muted);"></i>
                  <span>Nenhum negócio nesta etapa</span>
                </div>
              ` : stageDeals.map(deal => renderDealCard(deal)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = boardHtml;
  setupDragAndDrop();
  setupCardActionEvents();
}

/**
 * Render Deal Card HTML
 */
function renderDealCard(deal) {
  const initials = (deal.contactName || 'LD').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const channelIcon = deal.channel === 'WhatsApp' 
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="#00A868"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg>'
    : (deal.channel === 'Instagram'
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>'
      : '<i data-lucide="globe" style="width: 12px; height: 12px; color: #3B82F6;"></i>');

  return `
    <div class="crm-deal-card" draggable="true" data-deal-id="${deal.id}">
      <div class="crm-card-top">
        <div class="crm-card-contact-lead-wrap" data-deal-id="${deal.id}" title="Lead associado">
          <div class="crm-card-lead-avatar">${initials}</div>
          <span class="crm-priority-pill ${deal.priorityClass || 'priority-medium'}">${deal.priority || 'Média'}</span>
        </div>
        <span class="crm-card-stage-days" title="Tempo nesta etapa">
          <i data-lucide="clock" style="width: 11px; height: 11px;"></i>
          ${deal.daysInStage || '1 dia'}
        </span>
      </div>

      <h4 class="crm-card-title">${deal.title}</h4>

      <div class="crm-card-contact">
        <i data-lucide="building" style="width: 13px; height: 13px; flex-shrink: 0;"></i>
        <div>
          <span class="crm-card-contact-name">${deal.contactName}</span>
          ${deal.company ? `<span class="crm-card-company"> • ${deal.company}</span>` : ''}
        </div>
      </div>

      <div class="crm-card-meta-row">
        <span class="crm-card-value">${formatCurrency(deal.value || 0)}</span>
        <span class="crm-card-channel-badge">
          ${channelIcon}
          <span>${deal.channel || 'WhatsApp'}</span>
        </span>
      </div>

      <div class="crm-card-footer">
        <div class="crm-card-agent" title="Responsável: ${deal.agent}">
          <img src="${deal.agentImg}" alt="${deal.agent}" class="crm-card-agent-img" />
          <span class="crm-card-agent-name">${deal.agent}</span>
        </div>
        <div class="crm-card-actions">
          <button type="button" class="crm-btn-card-action chat btn-action-chat-deal" data-deal-id="${deal.id}" title="Abrir conversa no chat">
            <i data-lucide="message-square" style="width: 13px; height: 13px;"></i>
          </button>
          <button type="button" class="crm-btn-card-action btn-action-view-deal" data-deal-id="${deal.id}" title="Ver detalhes do negócio">
            <i data-lucide="eye" style="width: 13px; height: 13px;"></i>
          </button>
          <button type="button" class="crm-btn-card-action btn-action-advance-deal" data-deal-id="${deal.id}" title="Avançar etapa">
            <i data-lucide="chevron-right" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render List/Table View
 */
function renderCrmListView(container, deals) {
  const tableHtml = `
    <div class="crm-list-view-table-wrapper">
      <table class="crm-deals-table">
        <thead>
          <tr>
            <th>Oportunidade / Empresa</th>
            <th>Contato</th>
            <th>Etapa</th>
            <th>Valor</th>
            <th>Canal</th>
            <th>Responsável</th>
            <th>Previsão</th>
            <th style="text-align: right;">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${deals.length === 0 ? `
            <tr>
              <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                Nenhuma oportunidade encontrada com os filtros selecionados.
              </td>
            </tr>
          ` : deals.map(deal => {
            const stageObj = zapChatData.crm.stages.find(s => s.id === deal.stage);
            return `
              <tr>
                <td>
                  <span class="crm-table-deal-title">${deal.title}</span>
                  <span class="crm-table-deal-company">${deal.company || 'Pessoa Física'}</span>
                </td>
                <td>
                  <span style="font-weight: 500;">${deal.contactName}</span>
                  <span style="font-size: 11px; color: var(--text-muted); display: block;">${deal.phone}</span>
                </td>
                <td>
                  <span class="lead-status-pill ${deal.stage === 'ganho' ? 'qualificado' : 'atendimento'}" style="font-size: 11px;">
                    ${stageObj ? stageObj.name : deal.stage}
                  </span>
                </td>
                <td>
                  <span style="font-weight: 700; color: var(--primary-color);">${formatCurrency(deal.value)}</span>
                </td>
                <td>
                  <span class="crm-card-channel-badge">${deal.channel}</span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <img src="${deal.agentImg}" alt="${deal.agent}" style="width: 20px; height: 20px; border-radius: 50%;" />
                    <span style="font-size: 12px;">${deal.agent}</span>
                  </div>
                </td>
                <td>
                  <span style="font-size: 12px; color: var(--text-muted);">${deal.expectedClose || '-'}</span>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 4px;">
                    <button type="button" class="crm-btn-card-action chat btn-action-chat-deal" data-deal-id="${deal.id}" title="Conversar">
                      <i data-lucide="message-square" style="width: 13px; height: 13px;"></i>
                    </button>
                    <button type="button" class="crm-btn-card-action btn-action-view-deal" data-deal-id="${deal.id}" title="Detalhes">
                      <i data-lucide="eye" style="width: 13px; height: 13px;"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHtml;
  setupCardActionEvents();
}

/**
 * Drag and Drop implementation
 */
function setupDragAndDrop() {
  const cards = document.querySelectorAll('.crm-deal-card');
  const dropzones = document.querySelectorAll('.crm-deals-list');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      currentDraggedDealId = card.getAttribute('data-deal-id');
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', currentDraggedDealId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dropzones.forEach(zone => {
        zone.classList.remove('drag-over');
        zone.closest('.crm-column')?.classList.remove('drag-over');
      });
      currentDraggedDealId = null;
    });
  });

  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
      zone.closest('.crm-column')?.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over');
        zone.closest('.crm-column')?.classList.remove('drag-over');
      }
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      zone.closest('.crm-column')?.classList.remove('drag-over');

      const dealId = e.dataTransfer.getData('text/plain') || currentDraggedDealId;
      const targetStage = zone.getAttribute('data-stage-id');

      if (dealId && targetStage) {
        moveDealToStage(dealId, targetStage);
      }
    });
  });
}

/**
 * Move a deal to a new stage
 */
function moveDealToStage(dealId, newStageId) {
  const deal = zapChatData.crm.deals.find(d => d.id === dealId);
  if (!deal || deal.stage === newStageId) return;

  const oldStage = deal.stage;
  deal.stage = newStageId;
  deal.daysInStage = 'Hoje';

  const stageObj = zapChatData.crm.stages.find(s => s.id === newStageId);
  const stageName = stageObj ? stageObj.name : newStageId;

  renderCrmKpis();
  renderCrmBoard();

  if (window.showToast) {
    window.showToast(`Negócio "${deal.title}" movido para ${stageName}!`);
  }
}

/**
 * Setup toolbar and action events
 */
function setupCrmEvents() {
  // Search input
  const searchInput = document.getElementById('crm-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderCrmBoard();
    });
  }

  // Agent filter
  const agentSelect = document.getElementById('crm-filter-agent');
  if (agentSelect) {
    agentSelect.addEventListener('change', (e) => {
      agentFilter = e.target.value;
      renderCrmBoard();
    });
  }

  // Channel filter
  const channelSelect = document.getElementById('crm-filter-channel');
  if (channelSelect) {
    channelSelect.addEventListener('change', (e) => {
      channelFilter = e.target.value;
      renderCrmBoard();
    });
  }

  // Stage filter
  const stageSelect = document.getElementById('crm-filter-stage');
  if (stageSelect) {
    stageSelect.addEventListener('change', (e) => {
      stageFilter = e.target.value;
      renderCrmBoard();
    });
  }

  // View switchers
  const btnKanban = document.getElementById('crm-btn-view-kanban');
  const btnList = document.getElementById('crm-btn-view-list');

  if (btnKanban && btnList) {
    btnKanban.addEventListener('click', () => {
      activeViewMode = 'kanban';
      btnKanban.classList.add('active');
      btnList.classList.remove('active');
      renderCrmBoard();
    });

    btnList.addEventListener('click', () => {
      activeViewMode = 'list';
      btnList.classList.add('active');
      btnKanban.classList.remove('active');
      renderCrmBoard();
    });
  }

  // Mini plus in column header
  document.addEventListener('click', (e) => {
    const miniPlus = e.target.closest('.crm-btn-add-deal-mini');
    if (miniPlus) {
      const stage = miniPlus.getAttribute('data-stage');
      const stageSelectEl = document.getElementById('new-deal-input-stage');
      if (stageSelectEl) stageSelectEl.value = stage;
      if (window.openModal) window.openModal('modal-new-deal');
    }

    // Cross-system integration: Create opportunity directly from Lead Details modal
    const btnCreateFromLead = e.target.closest('#btn-view-lead-create-deal');
    if (btnCreateFromLead) {
      const leadName = document.getElementById('view-lead-name')?.textContent || '';
      const leadChannel = document.getElementById('view-lead-channel-text')?.textContent || 'WhatsApp';
      const leadAgent = document.getElementById('view-lead-agent-name')?.textContent || 'Juliana Santos';
      const leadInterest = document.getElementById('view-lead-interest')?.textContent || 'Plano Pro';

      if (window.closeAllModals) window.closeAllModals();

      const inputTitle = document.getElementById('new-deal-input-title');
      const inputContact = document.getElementById('new-deal-input-contact');
      const inputCompany = document.getElementById('new-deal-input-company');
      const inputAgent = document.getElementById('new-deal-input-agent');
      const inputChannel = document.getElementById('new-deal-input-channel');

      if (inputTitle) inputTitle.value = `Contrato - ${leadInterest}`;
      if (inputContact) inputContact.value = leadName;
      if (inputCompany) inputCompany.value = `${leadName}`;
      if (inputAgent) inputAgent.value = leadAgent;
      if (inputChannel) inputChannel.value = leadChannel;

      if (window.openModal) window.openModal('modal-new-deal');
    }
  });
}

/**
 * Setup card specific action listeners
 */
function setupCardActionEvents() {
  // Chat action
  document.querySelectorAll('.btn-action-chat-deal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dealId = btn.getAttribute('data-deal-id');
      const deal = zapChatData.crm.deals.find(d => d.id === dealId);
      if (deal) {
        // Find matching or mock lead
        const leadObj = {
          name: deal.contactName,
          phone: deal.phone,
          channel: deal.channel,
          agentName: deal.agent
        };
        if (window.switchView) {
          window.switchView('conversas');
          if (window.showToast) window.showToast(`Abrindo conversa de ${deal.contactName}...`);
        }
      }
    });
  });

  // View deal details
  document.querySelectorAll('.btn-action-view-deal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dealId = btn.getAttribute('data-deal-id');
      openDealDetailsModal(dealId);
    });
  });

  // Advance deal to next stage
  document.querySelectorAll('.btn-action-advance-deal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dealId = btn.getAttribute('data-deal-id');
      const deal = zapChatData.crm.deals.find(d => d.id === dealId);
      if (!deal) return;

      const stages = zapChatData.crm.stages;
      const curIdx = stages.findIndex(s => s.id === deal.stage);
      if (curIdx !== -1 && curIdx < stages.length - 1) {
        const nextStage = stages[curIdx + 1].id;
        moveDealToStage(dealId, nextStage);
      } else {
        if (window.showToast) window.showToast('Esta oportunidade já está na última etapa!');
      }
    });
  });

  // Clicking on card opens details
  document.querySelectorAll('.crm-deal-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.crm-btn-card-action')) return;
      const dealId = card.getAttribute('data-deal-id');
      openDealDetailsModal(dealId);
    });
  });
}

/**
 * Open Deal Details Modal
 */
function openDealDetailsModal(dealId) {
  const deal = zapChatData.crm.deals.find(d => d.id === dealId);
  if (!deal) return;
  currentViewDeal = deal;

  const modal = document.getElementById('modal-view-deal');
  if (!modal) return;

  const stages = zapChatData.crm.stages;
  const currentStageIdx = stages.findIndex(s => s.id === deal.stage);

  // Set modal elements
  document.getElementById('view-deal-title').textContent = deal.title;
  document.getElementById('view-deal-value').textContent = formatCurrency(deal.value);
  document.getElementById('view-deal-contact').textContent = deal.contactName;
  document.getElementById('view-deal-company').textContent = deal.company || 'Não informado';
  document.getElementById('view-deal-phone').textContent = deal.phone || 'Não informado';
  document.getElementById('view-deal-email').textContent = deal.email || 'Não informado';
  document.getElementById('view-deal-agent').textContent = deal.agent;
  document.getElementById('view-deal-channel').textContent = deal.channel;
  document.getElementById('view-deal-priority').textContent = deal.priority;
  document.getElementById('view-deal-expected').textContent = deal.expectedClose || 'Não definida';
  document.getElementById('view-deal-notes').textContent = deal.notes || 'Sem observações adicionais.';

  // Render Stepper
  const stepperEl = document.getElementById('view-deal-stepper');
  if (stepperEl) {
    stepperEl.innerHTML = stages.map((s, idx) => {
      let state = '';
      if (idx < currentStageIdx) state = 'completed';
      else if (idx === currentStageIdx) state = 'active';

      return `
        <div class="crm-stepper-step ${state}" data-stage-id="${s.id}" title="Clique para mudar para ${s.name}">
          <div class="crm-stepper-circle">${idx + 1}</div>
          <span class="crm-stepper-label">${s.name}</span>
        </div>
      `;
    }).join('');

    // Clicking step inside modal changes stage
    stepperEl.querySelectorAll('.crm-stepper-step').forEach(stepBtn => {
      stepBtn.addEventListener('click', () => {
        const targetStage = stepBtn.getAttribute('data-stage-id');
        moveDealToStage(deal.id, targetStage);
        openDealDetailsModal(deal.id);
      });
    });
  }

  if (window.openModal) {
    window.openModal('modal-view-deal');
  }
}

/**
 * Setup New Deal Modal Form
 */
function setupNewDealModal() {
  const form = document.getElementById('form-new-deal');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('new-deal-input-title').value;
    const contact = document.getElementById('new-deal-input-contact').value;
    const company = document.getElementById('new-deal-input-company').value;
    const value = parseFloat(document.getElementById('new-deal-input-value').value) || 0;
    const stage = document.getElementById('new-deal-input-stage').value;
    const agent = document.getElementById('new-deal-input-agent').value;
    const channel = document.getElementById('new-deal-input-channel').value;
    const priority = document.getElementById('new-deal-input-priority').value;
    const notes = document.getElementById('new-deal-input-notes').value;

    const newDeal = {
      id: 'deal_' + Date.now(),
      title,
      contactName: contact,
      company,
      phone: '+55 11 98888-7777',
      email: `${contact.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      value,
      stage,
      agent,
      agentImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      channel,
      priority,
      priorityClass: priority === 'Alta' ? 'priority-high' : (priority === 'Média' ? 'priority-medium' : 'priority-low'),
      daysInStage: 'Hoje',
      expectedClose: '30 dias',
      notes
    };

    zapChatData.crm.deals.unshift(newDeal);
    renderCrmKpis();
    renderCrmBoard();

    if (window.closeAllModals) window.closeAllModals();
    form.reset();

    if (window.showToast) {
      window.showToast(`Oportunidade "${title}" criada com sucesso!`);
    }
  });
}

/**
 * Setup View Deal Modal Actions
 */
function setupViewDealModal() {
  const btnChat = document.getElementById('btn-deal-modal-chat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      if (currentViewDeal && window.switchView) {
        if (window.closeAllModals) window.closeAllModals();
        window.switchView('conversas');
      }
    });
  }

  const btnMarkWon = document.getElementById('btn-deal-modal-mark-won');
  if (btnMarkWon) {
    btnMarkWon.addEventListener('click', () => {
      if (currentViewDeal) {
        moveDealToStage(currentViewDeal.id, 'ganho');
        if (window.closeAllModals) window.closeAllModals();
      }
    });
  }

  const btnDelete = document.getElementById('btn-deal-modal-delete');
  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      if (!currentViewDeal) return;
      const idx = zapChatData.crm.deals.findIndex(d => d.id === currentViewDeal.id);
      if (idx !== -1) {
        const title = currentViewDeal.title;
        zapChatData.crm.deals.splice(idx, 1);
        renderCrmKpis();
        renderCrmBoard();
        if (window.closeAllModals) window.closeAllModals();
        if (window.showToast) window.showToast(`Oportunidade "${title}" excluída.`);
      }
    });
  }
}
