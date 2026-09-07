import { zapChatData } from './data.js';
import { switchView } from './navigation.js';
import { showToast } from './settings.js';

let selectedLead = zapChatData.leads.list[0];
let checkedLeadIds = new Set([zapChatData.leads.list[0]?.id].filter(Boolean));
let currentDisplayedLeads = zapChatData.leads.list;

export function initLeadsView() {
  renderLeadsTable(zapChatData.leads.list);
  renderSelectedLeadPanel(selectedLead);
  setupLeadFilters();
  setupMasterCheckbox();
  setupExportCsv();
  if (window.lucide) window.lucide.createIcons();
}

export function renderLeadsTable(leads) {
  currentDisplayedLeads = leads;
  const tbody = document.getElementById('leads-table-body');
  if (!tbody) return;

  tbody.innerHTML = leads.map(lead => {
    const isRowActive = selectedLead && selectedLead.id === lead.id;
    const isChecked = checkedLeadIds.has(lead.id);

    return `
      <tr class="${isRowActive ? 'selected' : ''}" data-lead-id="${lead.id}" style="cursor: pointer;">
        <td style="width: 36px;" onclick="event.stopPropagation()">
          <input type="checkbox" ${isChecked ? 'checked' : ''} class="lead-row-checkbox" data-lead-id="${lead.id}" title="Selecionar lead">
        </td>
        <td>
          <div class="lead-cell-name">
            <div class="lead-avatar-initials">${lead.initials}</div>
            <div>
              <div class="lead-name-text-bold">${lead.name}</div>
              <div class="lead-phone-subtext">${lead.phone}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="lead-channel-cell">
            ${getChannelBadge(lead.channel)}
          </div>
        </td>
        <td>
          <span class="lead-status-pill ${lead.statusKey || 'novo'}">${lead.status}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${lead.agentImg}" alt="${lead.agentName}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
            <span style="font-weight: 500; font-size: 13px;">${lead.agentName}</span>
          </div>
        </td>
        <td style="color: var(--text-muted); font-size: 12.5px;">${lead.lastContact}</td>
        <td style="text-align: right;">
          <div class="lead-row-actions" onclick="event.stopPropagation()">
            <button class="lead-action-btn btn-open-lead-chat-row" title="Abrir conversa" data-open-chat="${lead.name}">
              <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="lead-action-btn" title="Mais opções">
              <i data-lucide="more-vertical" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Update pagination text
  const paginationInfo = document.getElementById('leads-pagination-info');
  if (paginationInfo) {
    paginationInfo.textContent = `Mostrando 1 a ${leads.length} de 1.248 leads`;
  }

  // Update master select all and counter badge
  updateSelectAllAndBadge(leads);

  // Checkbox event listeners
  tbody.querySelectorAll('.lead-row-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      const leadId = cb.getAttribute('data-lead-id');
      if (cb.checked) {
        checkedLeadIds.add(leadId);
      } else {
        checkedLeadIds.delete(leadId);
      }
      updateSelectAllAndBadge(leads);
    });
  });

  // Row selection
  tbody.querySelectorAll('tr[data-lead-id]').forEach(row => {
    row.addEventListener('click', () => {
      const leadId = row.getAttribute('data-lead-id');
      const lead = zapChatData.leads.list.find(l => l.id === leadId);
      if (lead) {
        selectedLead = lead;
        renderLeadsTable(leads);
        renderSelectedLeadPanel(lead);
      }
    });
  });

  // Open chat row buttons
  tbody.querySelectorAll('.btn-open-lead-chat-row').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView('conversas');
    });
  });

  // Re-init lucide icons
  if (window.lucide) window.lucide.createIcons();
}

export function renderSelectedLeadPanel(lead) {
  const panel = document.getElementById('lead-detail-panel');
  if (!panel || !lead) return;

  panel.innerHTML = `
    <div class="lead-panel-top-bar">
      <span class="lead-panel-top-title">Lead selecionado</span>
      <button class="lead-panel-close-btn" id="btn-close-lead-panel" title="Fechar painel">✕</button>
    </div>

    <div class="lead-panel-profile">
      <div class="lead-panel-avatar-lg">${lead.initials}</div>
      <div class="lead-panel-name-block">
        <div class="lead-panel-name-row">
          <span>${lead.name}</span>
          <span class="lead-status-pill ${lead.statusKey || 'novo'}">${lead.status}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
          <span>${lead.phone}</span>
          <button class="btn-copy-mini" title="Copiar telefone" onclick="navigator.clipboard && navigator.clipboard.writeText('${lead.phone}')">
            <i data-lucide="copy" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
          <span>${lead.email}</span>
          <button class="btn-copy-mini" title="Copiar e-mail" onclick="navigator.clipboard && navigator.clipboard.writeText('${lead.email}')">
            <i data-lucide="copy" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="lead-panel-info-list">
      <div class="lead-panel-info-row">
        <span class="lead-panel-info-label">
          <i data-lucide="user-plus" style="width: 14px; height: 14px;"></i> Origem
        </span>
        <span class="lead-panel-info-val">
          ${getChannelBadge(lead.channel)}
        </span>
      </div>

      <div class="lead-panel-info-row">
        <span class="lead-panel-info-label">
          <i data-lucide="tag" style="width: 14px; height: 14px;"></i> Interesse
        </span>
        <span class="lead-panel-info-val">${lead.primaryInterest || lead.interests?.[0] || 'Plano Pro'}</span>
      </div>

      <div class="lead-panel-info-row">
        <span class="lead-panel-info-label">
          <i data-lucide="user-check" style="width: 14px; height: 14px;"></i> Responsável
        </span>
        <span class="lead-panel-info-val">${lead.agentName}</span>
      </div>

      <div class="lead-panel-info-row" style="align-items: flex-start;">
        <span class="lead-panel-info-label">
          <i data-lucide="calendar" style="width: 14px; height: 14px;"></i> Próxima ação
        </span>
        <div class="lead-next-action-box">
          <span class="next-action-title">${lead.nextAction?.text || 'Follow-up por WhatsApp'}</span>
          <span class="next-action-time">${lead.nextAction?.time || 'Hoje às 14:00'}</span>
        </div>
      </div>
    </div>

    <div class="lead-panel-buttons-stack">
      <button class="btn btn-primary" id="btn-open-lead-chat">
        <i data-lucide="message-square" style="width: 15px; height: 15px;"></i>
        Abrir conversa
      </button>
      <button class="btn btn-secondary" id="btn-assign-agent">
        <i data-lucide="user-plus" style="width: 15px; height: 15px;"></i>
        Atribuir agente
      </button>
    </div>
  `;

  // Close panel button
  const closeBtn = panel.querySelector('#btn-close-lead-panel');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  // Open chat button
  const openChatBtn = panel.querySelector('#btn-open-lead-chat');
  if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
      switchView('conversas');
    });
  }

  // Assign agent button
  const assignBtn = panel.querySelector('#btn-assign-agent');
  if (assignBtn) {
    assignBtn.addEventListener('click', () => {
      alert(`Atribuir agente para ${lead.name}`);
    });
  }

  if (window.lucide) window.lucide.createIcons();
}

function setupLeadFilters() {
  const searchInput = document.getElementById('lead-search-input');
  const originSelect = document.getElementById('lead-filter-origin');
  const statusSelect = document.getElementById('lead-filter-status');
  const agentSelect = document.getElementById('lead-filter-agent');
  const clearBtn = document.getElementById('btn-clear-lead-filters');

  function applyFilters() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const origin = originSelect?.value || '';
    const status = statusSelect?.value || '';
    const agent = agentSelect?.value || '';

    const filtered = zapChatData.leads.list.filter(lead => {
      const matchesQuery = !query ||
        lead.name.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query);

      const matchesOrigin = !origin || lead.channel === origin;
      const matchesStatus = !status || lead.status === status;
      const matchesAgent = !agent || lead.agentName === agent;

      return matchesQuery && matchesOrigin && matchesStatus && matchesAgent;
    });

    renderLeadsTable(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (originSelect) originSelect.addEventListener('change', applyFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyFilters);
  if (agentSelect) agentSelect.addEventListener('change', applyFilters);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (originSelect) originSelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (agentSelect) agentSelect.value = '';
      renderLeadsTable(zapChatData.leads.list);
    });
  }
}

function getChannelBadge(channel) {
  if (channel === 'WhatsApp') {
    return `
      <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg>
        WhatsApp
      </span>
    `;
  }
  if (channel === 'Instagram') {
    return `
      <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
        Instagram
      </span>
    `;
  }
  if (channel === 'Facebook') {
    return `
      <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        Facebook
      </span>
    `;
  }
  if (channel === 'Site') {
    return `
      <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        Site
      </span>
    `;
  }
  return `<span>${channel}</span>`;
}

/**
 * Updates master checkbox in <thead> and the badge counter
 */
function updateSelectAllAndBadge(leads) {
  const badge = document.getElementById('leads-selected-count-badge');
  if (badge) {
    if (checkedLeadIds.size > 0) {
      badge.textContent = `${checkedLeadIds.size}`;
      badge.title = `${checkedLeadIds.size} lead(s) selecionado(s)`;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  const selectAll = document.getElementById('leads-select-all');
  if (selectAll && leads && leads.length > 0) {
    const allChecked = leads.every(l => checkedLeadIds.has(l.id));
    const someChecked = leads.some(l => checkedLeadIds.has(l.id));
    selectAll.checked = allChecked;
    selectAll.indeterminate = !allChecked && someChecked;
  }
}

/**
 * Setup master select-all checkbox
 */
function setupMasterCheckbox() {
  const selectAll = document.getElementById('leads-select-all');
  if (!selectAll) return;

  selectAll.addEventListener('change', () => {
    if (selectAll.checked) {
      currentDisplayedLeads.forEach(l => checkedLeadIds.add(l.id));
    } else {
      currentDisplayedLeads.forEach(l => checkedLeadIds.delete(l.id));
    }
    renderLeadsTable(currentDisplayedLeads);
  });
}

/**
 * Setup Export CSV Button
 */
function setupExportCsv() {
  const exportBtn = document.getElementById('btn-export-leads-csv');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    let leadsToExport = [];
    if (checkedLeadIds.size > 0) {
      leadsToExport = zapChatData.leads.list.filter(l => checkedLeadIds.has(l.id));
    } else {
      leadsToExport = currentDisplayedLeads;
    }

    if (!leadsToExport || leadsToExport.length === 0) {
      showToast('Nenhum lead selecionado para exportação.');
      return;
    }

    exportLeadsToCsv(leadsToExport);
  });
}

/**
 * Generates and downloads the CSV file
 */
function exportLeadsToCsv(leads) {
  const headers = [
    'Nome',
    'Telefone',
    'E-mail',
    'Canal / Origem',
    'Status',
    'Score',
    'Agente Responsável',
    'Último Contato',
    'Interesse Principal',
    'Tags',
    'Observações'
  ];

  const rows = leads.map(lead => [
    lead.name || '',
    lead.phone || '',
    lead.email || '',
    lead.channel || '',
    lead.status || '',
    lead.score ? `${lead.score}` : '',
    lead.agentName || '',
    lead.lastContact || '',
    lead.primaryInterest || lead.interests?.[0] || '',
    (lead.tags || []).join('; '),
    lead.notes || ''
  ]);

  const escapeCell = (val) => `"${String(val).replace(/"/g, '""')}"`;
  const csvLines = [
    headers.map(escapeCell).join(';'),
    ...rows.map(row => row.map(escapeCell).join(';'))
  ];

  // UTF-8 BOM (\uFEFF) ensures Excel opens Latin characters without encoding issues
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `leads_zapchat_${dateStr}.csv`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);

  showToast(`${leads.length} lead(s) exportado(s) com sucesso em CSV!`);

  // Visual button feedback
  const exportBtn = document.getElementById('btn-export-leads-csv');
  if (exportBtn) {
    const originalHtml = exportBtn.innerHTML;
    exportBtn.innerHTML = `
      <i data-lucide="check" style="width: 15px; height: 15px; color: var(--status-active);"></i>
      <span>Exportado!</span>
    `;
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      exportBtn.innerHTML = originalHtml;
      updateSelectAllAndBadge(currentDisplayedLeads);
      if (window.lucide) window.lucide.createIcons();
    }, 2200);
  }
}

