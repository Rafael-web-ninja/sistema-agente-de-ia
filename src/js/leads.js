import { zapChatData } from './data.js';
import { switchView, openModal, closeAllModals } from './navigation.js';
import { showToast } from './settings.js';
import { openChatThread } from './chat.js';

export const availableAgents = [
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
    workload: '3 leads ativos'
  },
  {
    id: 'pedro_ia',
    name: 'Pedro',
    type: 'ai',
    typeLabel: 'IA',
    role: 'Especialista em Vendas & Atendimento Comercial',
    department: 'Vendas',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'IA Ativa (24/7)',
    workload: 'Capacidade ilimitada'
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
    workload: '5 leads ativos'
  },
  {
    id: 'sdr_ia',
    name: 'SDR IA',
    type: 'ai',
    typeLabel: 'IA',
    role: 'Qualificação de Leads & Agendamento',
    department: 'Comercial',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'IA Ativa (24/7)',
    workload: 'Capacidade ilimitada'
  },
  {
    id: 'carla_menezes',
    name: 'Carla Menezes',
    type: 'human',
    typeLabel: 'Humano',
    role: 'Gerente de Contas Enterprise & Key Accounts',
    department: 'Enterprise',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'Disponível',
    workload: '2 leads ativos'
  },
  {
    id: 'suporte_ia',
    name: 'Suporte IA',
    type: 'ai',
    typeLabel: 'IA',
    role: 'Dúvidas Técnicas, FAQ & Resoluções',
    department: 'Suporte Técnico',
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    statusLabel: 'IA Ativa (24/7)',
    workload: 'Capacidade ilimitada'
  },
  {
    id: 'rodrigo_almeida',
    name: 'Rodrigo Almeida',
    type: 'human',
    typeLabel: 'Humano',
    role: 'Negociação & Fechamento Comercial',
    department: 'Comercial',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    status: 'busy',
    statusLabel: 'Ocupado',
    workload: '7 leads ativos'
  }
];

let selectedLead = zapChatData.leads.list[0];
let checkedLeadIds = new Set([zapChatData.leads.list[0]?.id].filter(Boolean));
let currentDisplayedLeads = zapChatData.leads.list;
let currentAssignFilter = 'all';
let currentAssignSearch = '';
let selectedAgentForAssign = null;
let currentLeadForAssign = null;
let currentLeadForView = null;
let leadToDelete = null;

const LEAD_TAG_COLORS = [
  { color: '#00A868', bg: 'rgba(0, 168, 104, 0.12)' },
  { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
  { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)' },
  { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' },
  { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' },
  { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
];

export function getLeadTagsCatalog() {
  if (!Array.isArray(zapChatData.leads.availableTags)) {
    zapChatData.leads.availableTags = [];
  }
  return zapChatData.leads.availableTags;
}

export function getTagStyleMeta(tagName) {
  const catalog = getLeadTagsCatalog();
  const found = catalog.find(t => t.name.toLowerCase() === (tagName || '').toLowerCase());
  if (found) return found;
  return { name: tagName, color: '#00A868', bg: 'rgba(0, 168, 104, 0.12)' };
}

export function syncEntityTagsAcrossViews(entity) {
  if (!entity) return;
  const tagsCopy = Array.isArray(entity.tags) ? [...entity.tags] : [];
  const entityName = (entity.name || '').toLowerCase();
  const entityPhone = entity.phone || '';

  (zapChatData.leads?.list || []).forEach(l => {
    if (l === entity) return;
    if (
      (l.id && entity.id && l.id === entity.id) ||
      (entityName && (l.name || '').toLowerCase() === entityName) ||
      (entityPhone && l.phone === entityPhone)
    ) {
      l.tags = [...tagsCopy];
    }
  });

  (zapChatData.conversas?.threads || []).forEach(t => {
    if (t === entity) return;
    if (
      (t.id && entity.id && t.id === entity.id) ||
      (entityName && (t.name || '').toLowerCase() === entityName) ||
      (entityPhone && t.phone === entityPhone)
    ) {
      t.tags = [...tagsCopy];
    }
  });
}

export function openLeadTagsModal(lead, options = {}) {
  if (!lead) return;
  if (!Array.isArray(lead.tags)) lead.tags = [];

  let modal = document.getElementById('modal-lead-tags');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-lead-tags';
    document.body.appendChild(modal);
  }
  modal.className = 'modal-backdrop';

  let newTagColorIdx = 0;
  let editingTagId = null;
  let editingTagColor = LEAD_TAG_COLORS[0].color;

  const notifyAllUpdates = () => {
    syncEntityTagsAcrossViews(lead);
    refreshLeadTagsUI(lead);
    if (typeof options.onUpdate === 'function') {
      options.onUpdate(lead);
    }
    if (typeof window.refreshChatTagsUI === 'function') {
      window.refreshChatTagsUI();
    }
  };

  const renderModalContent = () => {
    const catalog = getLeadTagsCatalog();

    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header" style="margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(0, 168, 104, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="tags" style="width: 18px; height: 18px;"></i>
            </div>
            <div>
              <h3 class="modal-title" style="margin: 0; font-size: 16px;">Etiquetas do Lead</h3>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Lead: <strong>${lead.name}</strong> • Clique para marcar, editar ou excluir</p>
            </div>
          </div>
          <button type="button" class="modal-close" id="btn-close-lead-tags" aria-label="Fechar">&times;</button>
        </div>

        <div class="modal-body" style="padding: 4px 0 16px 0; display: flex; flex-direction: column; gap: 14px;">
          <!-- Criar Nova Etiqueta -->
          <form id="form-create-lead-tag" class="lead-tag-create-box">
            <label class="form-label" style="margin-bottom: 6px; font-size: 12px;">Criar nova etiqueta</label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="text" id="input-new-lead-tag" class="form-input" placeholder="Nome da etiqueta (ex: Urgente, VIP...)" style="flex: 1; height: 36px; font-size: 13px;" required>
              <button type="submit" class="btn btn-primary btn-sm" style="height: 36px; padding: 0 14px;">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                <span>Criar</span>
              </button>
            </div>
            <div class="lead-tag-color-picker-row">
              <span style="font-size: 11px; color: var(--text-muted);">Cor:</span>
              ${LEAD_TAG_COLORS.map((c, idx) => `
                <button type="button" class="lead-tag-color-dot ${idx === newTagColorIdx ? 'selected' : ''}" data-color-idx="${idx}" style="background: ${c.color};" title="Escolher cor"></button>
              `).join('')}
            </div>
          </form>

          <!-- Lista de Etiquetas Disponíveis -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span class="form-label" style="margin: 0; font-size: 12px;">Etiquetas disponíveis (${catalog.length})</span>
              <span style="font-size: 11px; color: var(--text-muted);">${lead.tags.length} selecionada(s)</span>
            </div>

            <div class="lead-tags-manager-list">
              ${catalog.map(tag => {
                const isSelected = lead.tags.some(t => t.toLowerCase() === tag.name.toLowerCase());
                const isEditing = editingTagId === tag.id;

                if (isEditing) {
                  return `
                    <div class="lead-tag-manager-item is-editing">
                      <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                        <input type="text" class="form-input" id="input-edit-tag-name-${tag.id}" value="${tag.name}" style="flex: 1; height: 32px; font-size: 12.5px;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                          ${LEAD_TAG_COLORS.map(c => `
                            <button type="button" class="lead-tag-color-dot sm ${c.color === editingTagColor ? 'selected' : ''}" data-edit-color="${c.color}" data-edit-bg="${c.bg}" style="background: ${c.color};"></button>
                          `).join('')}
                        </div>
                        <button type="button" class="btn btn-primary btn-sm btn-save-edit-tag" data-tag-id="${tag.id}" style="height: 30px; padding: 0 10px;">Salvar</button>
                        <button type="button" class="btn btn-secondary btn-sm btn-cancel-edit-tag" style="height: 30px; padding: 0 8px;">✕</button>
                      </div>
                    </div>
                  `;
                }

                return `
                  <div class="lead-tag-manager-item ${isSelected ? 'selected' : ''}">
                    <button type="button" class="lead-tag-toggle-area" data-toggle-tag="${tag.name}">
                      <span class="lead-tag-check-box ${isSelected ? 'checked' : ''}">
                        ${isSelected ? `<i data-lucide="check" style="width: 11px; height: 11px;"></i>` : ''}
                      </span>
                      <span class="lead-tag-pill-preview" style="background: ${tag.bg}; color: ${tag.color};">
                        <span class="lead-tag-dot" style="background: ${tag.color};"></span>
                        <span>${tag.name}</span>
                      </span>
                    </button>
                    <div class="lead-tag-item-actions">
                      <button type="button" class="lead-tag-icon-btn btn-start-edit-tag" data-tag-id="${tag.id}" title="Editar etiqueta">
                        <i data-lucide="pencil" style="width: 13px; height: 13px;"></i>
                      </button>
                      <button type="button" class="lead-tag-icon-btn danger btn-delete-tag" data-tag-id="${tag.id}" title="Excluir etiqueta">
                        <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding: 12px 0 0 0; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
          <button type="button" class="btn btn-primary" id="btn-done-lead-tags">Concluído</button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => modal.classList.remove('active');
    modal.querySelector('#btn-close-lead-tags')?.addEventListener('click', closeModal);
    modal.querySelector('#btn-done-lead-tags')?.addEventListener('click', closeModal);

    // Color picker for new tag
    modal.querySelectorAll('[data-color-idx]').forEach(dot => {
      dot.addEventListener('click', () => {
        newTagColorIdx = Number(dot.getAttribute('data-color-idx')) || 0;
        modal.querySelectorAll('[data-color-idx]').forEach((d, idx) => {
          d.classList.toggle('selected', idx === newTagColorIdx);
        });
      });
    });

    // Create new tag
    modal.querySelector('#form-create-lead-tag')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputEl = modal.querySelector('#input-new-lead-tag');
      const name = (inputEl?.value || '').trim();
      if (!name) return;

      const palette = LEAD_TAG_COLORS[newTagColorIdx] || LEAD_TAG_COLORS[0];
      const existing = catalog.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (!existing) {
        catalog.unshift({
          id: `tag-${Date.now()}`,
          name,
          color: palette.color,
          bg: palette.bg
        });
      }
      if (!lead.tags.some(t => t.toLowerCase() === name.toLowerCase())) {
        lead.tags.push(existing ? existing.name : name);
      }

      notifyAllUpdates();
      renderModalContent();
      showToast(`Etiqueta "${name}" adicionada a ${lead.name}!`);
    });

    // Toggle tag on lead
    modal.querySelectorAll('[data-toggle-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tagName = btn.getAttribute('data-toggle-tag');
        const idx = lead.tags.findIndex(t => t.toLowerCase() === tagName.toLowerCase());
        if (idx !== -1) {
          lead.tags.splice(idx, 1);
        } else {
          lead.tags.push(tagName);
        }
        notifyAllUpdates();
        renderModalContent();
      });
    });

    // Start editing tag
    modal.querySelectorAll('.btn-start-edit-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const tagId = btn.getAttribute('data-tag-id');
        const tagObj = catalog.find(t => t.id === tagId);
        if (!tagObj) return;
        editingTagId = tagId;
        editingTagColor = tagObj.color;
        renderModalContent();
        const editInput = modal.querySelector(`#input-edit-tag-name-${tagId}`);
        if (editInput) {
          editInput.focus();
          editInput.select();
        }
      });
    });

    // Edit tag color selection
    modal.querySelectorAll('[data-edit-color]').forEach(dot => {
      dot.addEventListener('click', () => {
        editingTagColor = dot.getAttribute('data-edit-color');
        modal.querySelectorAll('[data-edit-color]').forEach(d => {
          d.classList.toggle('selected', d.getAttribute('data-edit-color') === editingTagColor);
        });
      });
    });

    // Cancel edit tag
    modal.querySelectorAll('.btn-cancel-edit-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        editingTagId = null;
        renderModalContent();
      });
    });

    // Save edited tag
    modal.querySelectorAll('.btn-save-edit-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const tagId = btn.getAttribute('data-tag-id');
        const tagObj = catalog.find(t => t.id === tagId);
        const inputEl = modal.querySelector(`#input-edit-tag-name-${tagId}`);
        const newName = (inputEl?.value || '').trim();
        if (!tagObj || !newName) return;

        const oldName = tagObj.name;
        const chosenPalette = LEAD_TAG_COLORS.find(c => c.color === editingTagColor) || LEAD_TAG_COLORS[0];
        tagObj.name = newName;
        tagObj.color = chosenPalette.color;
        tagObj.bg = chosenPalette.bg;

        // Update tag name across all leads and threads that had oldName
        (zapChatData.leads.list || []).forEach(l => {
          if (Array.isArray(l.tags)) {
            l.tags = l.tags.map(t => (t.toLowerCase() === oldName.toLowerCase() ? newName : t));
          }
        });
        (zapChatData.conversas?.threads || []).forEach(t => {
          if (Array.isArray(t.tags)) {
            t.tags = t.tags.map(tag => (tag.toLowerCase() === oldName.toLowerCase() ? newName : tag));
          }
        });
        if (Array.isArray(lead.tags)) {
          lead.tags = lead.tags.map(t => (t.toLowerCase() === oldName.toLowerCase() ? newName : t));
        }

        editingTagId = null;
        notifyAllUpdates();
        renderModalContent();
        showToast(`Etiqueta "${newName}" atualizada!`);
      });
    });

    // Delete tag
    modal.querySelectorAll('.btn-delete-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const tagId = btn.getAttribute('data-tag-id');
        const idx = catalog.findIndex(t => t.id === tagId);
        if (idx === -1) return;
        const removedTag = catalog[idx];
        catalog.splice(idx, 1);

        // Remove from all leads and threads
        (zapChatData.leads.list || []).forEach(l => {
          if (Array.isArray(l.tags)) {
            l.tags = l.tags.filter(t => t.toLowerCase() !== removedTag.name.toLowerCase());
          }
        });
        (zapChatData.conversas?.threads || []).forEach(t => {
          if (Array.isArray(t.tags)) {
            t.tags = t.tags.filter(tag => tag.toLowerCase() !== removedTag.name.toLowerCase());
          }
        });
        if (Array.isArray(lead.tags)) {
          lead.tags = lead.tags.filter(t => t.toLowerCase() !== removedTag.name.toLowerCase());
        }

        notifyAllUpdates();
        renderModalContent();
        showToast(`Etiqueta "${removedTag.name}" excluída!`);
      });
    });
  };

  renderModalContent();
  modal.classList.add('active');
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('active');
  };
}

function refreshLeadTagsUI(lead) {
  renderLeadsTable(currentDisplayedLeads);
  if (selectedLead && selectedLead.id === lead.id) {
    renderSelectedLeadPanel(lead);
  }
}

function getCrmStagesForLeads() {
  return zapChatData.crm?.stages || [
    { id: 'prospeccao', name: 'Prospecção', color: '#2563EB' },
    { id: 'qualificacao', name: 'Qualificação', color: '#7C3AED' },
    { id: 'proposta', name: 'Proposta Enviada', color: '#F59E0B' },
    { id: 'negociacao', name: 'Negociação', color: '#EC4899' },
    { id: 'ganho', name: 'Fechado Ganho', color: '#00A868' }
  ];
}

function findCrmDealForLead(lead) {
  if (!lead || !zapChatData.crm?.deals) return null;
  return zapChatData.crm.deals.find(d =>
    d.leadId === lead.id ||
    (d.contactName && lead.name && d.contactName.toLowerCase() === lead.name.toLowerCase()) ||
    (d.phone && lead.phone && d.phone === lead.phone)
  ) || null;
}

export function openLeadSendToCrmModal(lead) {
  if (!lead) return;
  let modal = document.getElementById('modal-lead-send-crm');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-lead-send-crm';
    document.body.appendChild(modal);
  }
  modal.className = 'modal-backdrop';

  const stages = getCrmStagesForLeads();
  const existingDeal = findCrmDealForLead(lead);
  let selectedStageId = existingDeal ? existingDeal.stage : stages[0].id;
  let selectedPriority = existingDeal ? (existingDeal.priority || 'Alta') : 'Alta';
  const initialValue = existingDeal ? (existingDeal.value || '') : '';

  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 480px;">
      <div class="modal-header" style="margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(0, 168, 104, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i data-lucide="kanban" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <h3 class="modal-title" style="margin: 0; font-size: 16px;">${existingDeal ? 'Gerenciar Lead no CRM' : 'Enviar Lead para o CRM'}</h3>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">${lead.name} • ${lead.phone}</p>
          </div>
        </div>
        <button type="button" class="modal-close" id="btn-close-lead-crm-modal" aria-label="Fechar">&times;</button>
      </div>

      <form id="form-lead-send-crm">
        <div class="modal-body" style="padding: 4px 0 18px 0; display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group" style="margin: 0;">
            <label class="form-label">Etapa do Funil no CRM</label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;" id="lead-crm-stage-options">
              ${stages.map(s => `
                <button type="button" class="lead-crm-stage-btn ${s.id === selectedStageId ? 'active' : ''}" data-stage-id="${s.id}" style="display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${s.id === selectedStageId ? 'var(--primary)' : 'var(--border)'}; background: ${s.id === selectedStageId ? 'rgba(0, 168, 104, 0.08)' : 'var(--bg-main)'}; color: var(--text-main); font-size: 12.5px; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.15s ease;">
                  <span style="width: 9px; height: 9px; border-radius: 50%; background: ${s.color}; flex-shrink: 0;"></span>
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" for="lead-crm-value-input">Valor Estimado (R$)</label>
              <input type="number" id="lead-crm-value-input" class="form-input" placeholder="Ex: 1500" min="0" step="50" value="${initialValue}">
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" for="lead-crm-priority-select">Prioridade</label>
              <select id="lead-crm-priority-select" class="form-select">
                <option value="Alta" ${selectedPriority === 'Alta' ? 'selected' : ''}>🔥 Alta</option>
                <option value="Média" ${selectedPriority === 'Média' ? 'selected' : ''}>⚡ Média</option>
                <option value="Baixa" ${selectedPriority === 'Baixa' ? 'selected' : ''}>🌱 Baixa</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="padding: 14px 0 0 0; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          ${existingDeal ? `
            <button type="button" class="btn btn-secondary btn-sm" id="btn-lead-open-crm-board" style="display: inline-flex; align-items: center; gap: 6px;">
              <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
              <span>Ver no CRM</span>
            </button>
          ` : `<div></div>`}
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-lead-crm-modal">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
              <i data-lucide="check" style="width: 15px; height: 15px;"></i>
              <span>${existingDeal ? 'Atualizar no CRM' : 'Enviar ao CRM'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  `;

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();

  modal.querySelectorAll('.lead-crm-stage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedStageId = btn.getAttribute('data-stage-id');
      modal.querySelectorAll('.lead-crm-stage-btn').forEach(b => {
        const isSel = b.getAttribute('data-stage-id') === selectedStageId;
        b.classList.toggle('active', isSel);
        b.style.borderColor = isSel ? 'var(--primary)' : 'var(--border)';
        b.style.background = isSel ? 'rgba(0, 168, 104, 0.08)' : 'var(--bg-main)';
      });
    });
  });

  const closeModal = () => modal.classList.remove('active');
  modal.querySelector('#btn-close-lead-crm-modal')?.addEventListener('click', closeModal);
  modal.querySelector('#btn-cancel-lead-crm-modal')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#btn-lead-open-crm-board')?.addEventListener('click', () => {
    closeModal();
    switchView('crm');
  });

  modal.querySelector('#form-lead-send-crm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = Number(modal.querySelector('#lead-crm-value-input')?.value) || 0;
    const prio = modal.querySelector('#lead-crm-priority-select')?.value || 'Alta';
    const stageObj = stages.find(s => s.id === selectedStageId) || stages[0];
    const priorityMap = {
      'Alta': 'priority-high',
      'Média': 'priority-med',
      'Baixa': 'priority-low'
    };

    if (existingDeal) {
      existingDeal.stage = stageObj.id;
      existingDeal.value = val;
      existingDeal.priority = prio;
      existingDeal.priorityClass = priorityMap[prio] || 'priority-high';
      existingDeal.daysInStage = 'Agora';
    } else {
      const newDeal = {
        id: 'deal_' + Date.now(),
        leadId: lead.id,
        title: `${lead.primaryInterest || 'Oportunidade'} - ${lead.name}`,
        contactName: lead.name,
        company: lead.name,
        phone: lead.phone || '+55 11 99999-9999',
        email: lead.email || '',
        value: val,
        stage: stageObj.id,
        agent: lead.agentName || 'Juliana Santos',
        agentImg: lead.agentImg || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        channel: lead.channel || 'WhatsApp',
        priority: prio,
        priorityClass: priorityMap[prio] || 'priority-high',
        daysInStage: 'Hoje',
        expectedClose: '15 dias',
        notes: lead.notes || `Enviado a partir da tela de Leads.`
      };
      zapChatData.crm.deals.unshift(newDeal);
    }

    if (window.refreshCrmView) window.refreshCrmView();
    closeModal();
    renderLeadsTable(currentDisplayedLeads);
    if (selectedLead && selectedLead.id === lead.id) {
      renderSelectedLeadPanel(lead);
    }
    showToast(`Lead "${lead.name}" enviado para a etapa "${stageObj.name}" no CRM!`);
  });
}

export function initLeadsView() {
  renderLeadsTable(zapChatData.leads.list);
  renderSelectedLeadPanel(selectedLead);
  setupLeadFilters();
  setupMasterCheckbox();
  setupExportCsv();
  setupAssignAgentModal();
  setupEditLeadModal();
  setupDeleteLeadModal();
  setupViewLeadModal();

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#lead-active-dropdown') && !e.target.closest('.btn-lead-more-actions')) {
      closeLeadActionDropdown();
    }
  });

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
              <div class="lead-row-tags-wrap" onclick="event.stopPropagation()">
                ${(lead.tags || []).map(tName => {
                  const meta = getTagStyleMeta(tName);
                  return `<span class="lead-mini-tag-pill btn-manage-lead-tags" data-lead-id="${lead.id}" style="background:${meta.bg}; color:${meta.color};" title="Clique para gerenciar etiquetas">${tName}</span>`;
                }).join('')}
                <button type="button" class="lead-add-tag-inline-btn btn-manage-lead-tags" data-lead-id="${lead.id}" title="Adicionar ou editar etiquetas">
                  <i data-lucide="tag" style="width: 10px; height: 10px;"></i>
                  <span>${(lead.tags && lead.tags.length > 0) ? '+' : '+ Etiqueta'}</span>
                </button>
              </div>
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
        <td style="text-align: right; position: relative;">
          <div class="lead-row-actions" onclick="event.stopPropagation()">
            <button class="lead-action-btn btn-open-lead-chat-row" title="Abrir conversa" data-lead-id="${lead.id}">
              <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="lead-action-btn btn-lead-more-actions" title="Mais opções" data-lead-id="${lead.id}">
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

  // 3-dots more actions buttons
  tbody.querySelectorAll('.btn-lead-more-actions').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const leadId = btn.getAttribute('data-lead-id');
      const lead = zapChatData.leads.list.find(l => l.id === leadId);
      if (lead) {
        toggleLeadActionDropdown(lead, btn);
      }
    });
  });

  // Open chat row buttons
  tbody.querySelectorAll('.btn-open-lead-chat-row').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const leadId = btn.getAttribute('data-lead-id');
      const lead = zapChatData.leads.list.find(l => l.id === leadId);
      if (lead) {
        openChatForLead(lead);
      } else {
        switchView('conversas');
      }
    });
  });

  // Manage lead tags inline buttons
  tbody.querySelectorAll('.btn-manage-lead-tags').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const leadId = btn.getAttribute('data-lead-id');
      const lead = zapChatData.leads.list.find(l => l.id === leadId);
      if (lead) openLeadTagsModal(lead);
    });
  });

  // Re-init lucide icons
  if (window.lucide) window.lucide.createIcons();
}

export function renderSelectedLeadPanel(lead) {
  const panel = document.getElementById('lead-detail-panel');
  if (!panel || !lead) return;

  panel.style.display = 'flex';

  panel.innerHTML = `
    <div class="lead-panel-top-bar">
      <span class="lead-panel-top-title">Lead selecionado</span>
      <button class="lead-panel-close-btn" id="btn-close-lead-panel" title="Fechar painel">✕</button>
    </div>

    <div class="lead-panel-profile" id="lead-panel-profile-clickable" style="cursor: pointer;" title="Clique para ver ficha completa">
      <div class="lead-panel-avatar-lg">${lead.initials}</div>
      <div class="lead-panel-name-block">
        <div class="lead-panel-name-row">
          <span>${lead.name}</span>
          <span class="lead-status-pill ${lead.statusKey || 'novo'}">${lead.status}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
          <span>${lead.phone}</span>
          <button class="btn-copy-mini" title="Copiar telefone" onclick="event.stopPropagation(); navigator.clipboard && navigator.clipboard.writeText('${lead.phone}')">
            <i data-lucide="copy" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
          <span>${lead.email}</span>
          <button class="btn-copy-mini" title="Copiar e-mail" onclick="event.stopPropagation(); navigator.clipboard && navigator.clipboard.writeText('${lead.email}')">
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

      <div class="lead-panel-info-row" style="align-items: flex-start;">
        <span class="lead-panel-info-label" style="margin-top: 3px;">
          <i data-lucide="tags" style="width: 14px; height: 14px;"></i> Etiquetas
        </span>
        <div class="lead-panel-tags-box">
          ${(lead.tags || []).map(tName => {
            const meta = getTagStyleMeta(tName);
            return `
              <span class="lead-panel-tag-chip" style="background:${meta.bg}; color:${meta.color};">
                <span>${tName}</span>
                <button type="button" class="lead-panel-tag-remove" data-remove-tag="${tName}" title="Remover etiqueta do lead">&times;</button>
              </span>
            `;
          }).join('')}
          <button type="button" class="lead-panel-add-tag-btn" id="btn-panel-manage-tags" title="Adicionar, editar ou excluir etiquetas">
            <i data-lucide="plus" style="width: 11px; height: 11px;"></i>
            <span>Etiquetar</span>
          </button>
        </div>
      </div>

      <div class="lead-panel-info-row">
        <span class="lead-panel-info-label">
          <i data-lucide="user-check" style="width: 14px; height: 14px;"></i> Responsável
        </span>
        <span class="lead-panel-info-val">${lead.agentName}</span>
      </div>

      ${(() => {
        const crmDeal = findCrmDealForLead(lead);
        const stages = getCrmStagesForLeads();
        const stageObj = crmDeal ? (stages.find(s => s.id === crmDeal.stage) || stages[0]) : null;
        return `
          <div class="lead-panel-info-row">
            <span class="lead-panel-info-label">
              <i data-lucide="kanban" style="width: 14px; height: 14px;"></i> Funil CRM
            </span>
            <span class="lead-panel-info-val">
              ${stageObj
                ? `<span style="display:inline-flex; align-items:center; gap:6px; font-weight:600; color:var(--text-main);"><span style="width:8px; height:8px; border-radius:50%; background:${stageObj.color};"></span>${stageObj.name}</span>`
                : `<span style="color:var(--text-muted); font-size:12px;">Fora do funil</span>`}
            </span>
          </div>
        `;
      })()}
    </div>

    <div class="lead-panel-buttons-stack">
      <button class="btn btn-primary" id="btn-open-lead-chat">
        <i data-lucide="message-square" style="width: 15px; height: 15px;"></i>
        Abrir conversa
      </button>
      <button class="btn btn-secondary" id="btn-send-lead-crm-panel">
        <i data-lucide="kanban" style="width: 15px; height: 15px; color: var(--primary);"></i>
        ${findCrmDealForLead(lead) ? 'Gerenciar no CRM' : 'Enviar para o CRM'}
      </button>
      <button class="btn btn-secondary" id="btn-view-lead-details-panel">
        <i data-lucide="eye" style="width: 15px; height: 15px;"></i>
        Ver detalhes completos
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

  // Profile click opens full details
  const profileEl = panel.querySelector('#lead-panel-profile-clickable');
  if (profileEl) {
    profileEl.addEventListener('click', () => {
      openViewLeadModal(lead);
    });
  }

  // View details button
  const viewDetailsBtn = panel.querySelector('#btn-view-lead-details-panel');
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener('click', () => {
      openViewLeadModal(lead);
    });
  }

  // Open chat button
  const openChatBtn = panel.querySelector('#btn-open-lead-chat');
  if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
      openChatForLead(lead);
    });
  }

  // Assign agent button
  const assignBtn = panel.querySelector('#btn-assign-agent');
  if (assignBtn) {
    assignBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAssignAgentModal(lead);
    });
  }

  // Send to CRM button in right panel
  const sendCrmBtn = panel.querySelector('#btn-send-lead-crm-panel');
  if (sendCrmBtn) {
    sendCrmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openLeadSendToCrmModal(lead);
    });
  }

  // Manage tags button in right panel
  panel.querySelector('#btn-panel-manage-tags')?.addEventListener('click', (e) => {
    e.preventDefault();
    openLeadTagsModal(lead);
  });

  // Quick remove tag chip in right panel
  panel.querySelectorAll('[data-remove-tag]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagName = btn.getAttribute('data-remove-tag');
      if (Array.isArray(lead.tags)) {
        lead.tags = lead.tags.filter(t => t.toLowerCase() !== tagName.toLowerCase());
        syncEntityTagsAcrossViews(lead);
        refreshLeadTagsUI(lead);
        if (typeof window.refreshChatTagsUI === 'function') window.refreshChatTagsUI();
        showToast(`Etiqueta "${tagName}" removida de ${lead.name}.`);
      }
    });
  });

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

export function openAssignAgentModal(lead) {
  if (!lead) return;
  currentLeadForAssign = lead;

  // Find matching agent or default to first
  const matchedAgent = availableAgents.find(a => a.name === lead.agentName);
  selectedAgentForAssign = matchedAgent || availableAgents[0];

  // Populate lead banner in modal
  const avatarEl = document.getElementById('assign-lead-avatar');
  const nameEl = document.getElementById('assign-lead-name');
  const metaEl = document.getElementById('assign-lead-meta');
  const currentImgEl = document.getElementById('assign-current-agent-img');
  const currentNameEl = document.getElementById('assign-current-agent-name');
  const targetLeadInput = document.getElementById('assign-target-lead-id');
  const selectedAgentInput = document.getElementById('assign-selected-agent-id');
  const noteInput = document.getElementById('assign-transfer-note');

  if (avatarEl) avatarEl.textContent = lead.initials;
  if (nameEl) nameEl.textContent = lead.name;
  if (metaEl) metaEl.textContent = `${lead.phone} • ${lead.channel}`;
  if (currentImgEl) currentImgEl.src = lead.agentImg;
  if (currentNameEl) currentNameEl.textContent = lead.agentName;
  if (targetLeadInput) targetLeadInput.value = lead.id;
  if (selectedAgentInput) selectedAgentInput.value = selectedAgentForAssign.id;
  if (noteInput) noteInput.value = '';

  // Reset category filters
  currentAssignFilter = 'all';
  currentAssignSearch = '';
  const searchInput = document.getElementById('assign-agent-search-input');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.assign-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-agent-filter') === 'all');
  });

  renderAssignAgentsList();
  openModal('modal-assign-agent');
}

function renderAssignAgentsList() {
  const container = document.getElementById('assign-agents-list');
  if (!container || !currentLeadForAssign) return;

  const filtered = availableAgents.filter(agent => {
    const matchesFilter = currentAssignFilter === 'all' || agent.type === currentAssignFilter;
    const matchesSearch = !currentAssignSearch ||
      agent.name.toLowerCase().includes(currentAssignSearch) ||
      agent.role.toLowerCase().includes(currentAssignSearch) ||
      agent.department.toLowerCase().includes(currentAssignSearch);
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
        Nenhum agente encontrado para o filtro selecionado.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(agent => {
    const isSelected = selectedAgentForAssign && selectedAgentForAssign.id === agent.id;
    const isCurrent = currentLeadForAssign.agentName === agent.name;
    const typeBadgeClass = agent.type === 'ai' ? 'ai' : 'human';
    const typeBadgeText = agent.type === 'ai' ? '🤖 IA' : '👤 Humano';

    return `
      <div class="assign-agent-card ${isSelected ? 'selected' : ''}" data-agent-id="${agent.id}">
        <div class="assign-agent-card-left">
          <div class="assign-radio-indicator"></div>
          <div class="assign-agent-photo-wrap">
            <img src="${agent.img}" alt="${agent.name}" class="assign-agent-photo">
            <span class="assign-agent-online-dot"></span>
          </div>
          <div class="assign-agent-details">
            <div class="assign-agent-name-row">
              <span class="assign-agent-name">${agent.name}</span>
              <span class="assign-type-badge ${typeBadgeClass}">${typeBadgeText}</span>
              ${isCurrent ? '<span class="assign-current-tag">Atual</span>' : ''}
            </div>
            <span class="assign-agent-role">${agent.role}</span>
          </div>
        </div>
        <div class="assign-agent-card-right">
          <span class="assign-workload-text">${agent.workload}</span>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers on agent cards
  container.querySelectorAll('.assign-agent-card').forEach(card => {
    card.addEventListener('click', () => {
      const agentId = card.getAttribute('data-agent-id');
      const agent = availableAgents.find(a => a.id === agentId);
      if (agent) {
        selectedAgentForAssign = agent;
        const hiddenInput = document.getElementById('assign-selected-agent-id');
        if (hiddenInput) hiddenInput.value = agent.id;
        renderAssignAgentsList();
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function setupAssignAgentModal() {
  // Category tabs
  document.querySelectorAll('.assign-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.assign-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAssignFilter = btn.getAttribute('data-agent-filter') || 'all';
      renderAssignAgentsList();
    });
  });

  // Search input
  const searchInput = document.getElementById('assign-agent-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentAssignSearch = e.target.value.toLowerCase().trim();
      renderAssignAgentsList();
    });
  }

  // Form submit
  const form = document.getElementById('form-assign-agent');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentLeadForAssign || !selectedAgentForAssign) return;

      const lead = zapChatData.leads.list.find(l => l.id === currentLeadForAssign.id);
      if (!lead) return;

      lead.agentName = selectedAgentForAssign.name;
      lead.agentImg = selectedAgentForAssign.img;

      const noteText = document.getElementById('assign-transfer-note')?.value.trim();
      if (noteText) {
        lead.notes = lead.notes ? `${lead.notes} | [Transferência]: ${noteText}` : noteText;
      }

      // Re-render table and panel
      selectedLead = lead;
      renderLeadsTable(currentDisplayedLeads);
      renderSelectedLeadPanel(lead);

      closeAllModals();
      showToast(`Agente "${selectedAgentForAssign.name}" atribuído a ${lead.name} com sucesso!`);
    });
  }
}

function getStatusKey(status) {
  const map = {
    'Novo': 'novo',
    'Em atendimento': 'atendimento',
    'Qualificado': 'qualificado',
    'Fechado': 'fechado',
    'Perdido': 'perdido'
  };
  return map[status] || 'novo';
}

export function closeLeadActionDropdown() {
  const existingDropdown = document.getElementById('lead-active-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }
  document.querySelectorAll('.btn-lead-more-actions.menu-open').forEach(b => {
    b.classList.remove('menu-open');
  });
}

export function toggleLeadActionDropdown(lead, btn) {
  const existingDropdown = document.getElementById('lead-active-dropdown');
  const wasThisOpen = existingDropdown && existingDropdown.parentElement === btn.parentElement;

  closeLeadActionDropdown();

  if (wasThisOpen) return;

  btn.classList.add('menu-open');

  const menu = document.createElement('div');
  menu.className = 'lead-actions-dropdown-menu';
  menu.id = 'lead-active-dropdown';

  menu.innerHTML = `
    <button type="button" class="lead-dropdown-item btn-action-view-lead">
      <i data-lucide="eye"></i>
      <span>Ver Detalhes</span>
    </button>
    <button type="button" class="lead-dropdown-item btn-action-chat-lead">
      <i data-lucide="message-square"></i>
      <span>Abrir Conversa</span>
    </button>
    <button type="button" class="lead-dropdown-item btn-action-assign-lead">
      <i data-lucide="user-check"></i>
      <span>Atribuir Agente</span>
    </button>
    <button type="button" class="lead-dropdown-item btn-action-send-crm">
      <i data-lucide="kanban"></i>
      <span>${findCrmDealForLead(lead) ? 'Mover no CRM' : 'Enviar para o CRM'}</span>
    </button>
    <button type="button" class="lead-dropdown-item btn-action-tag-lead">
      <i data-lucide="tags"></i>
      <span>Etiquetar Lead</span>
    </button>
    <button type="button" class="lead-dropdown-item btn-action-edit-lead">
      <i data-lucide="edit-3"></i>
      <span>Editar Lead</span>
    </button>
    <div class="lead-dropdown-divider"></div>
    <button type="button" class="lead-dropdown-item btn-action-copy-phone">
      <i data-lucide="phone"></i>
      <span>Copiar Telefone</span>
    </button>
    <button type="button" class="lead-dropdown-item btn-action-copy-email">
      <i data-lucide="mail"></i>
      <span>Copiar E-mail</span>
    </button>
    <div class="lead-dropdown-divider"></div>
    <button type="button" class="lead-dropdown-item item-danger btn-action-delete-lead">
      <i data-lucide="trash-2"></i>
      <span>Excluir Lead</span>
    </button>
  `;

  // Stop row click propagation when interacting with dropdown
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Action handlers
  menu.querySelector('.btn-action-view-lead').addEventListener('click', (e) => {
    e.stopPropagation();
    selectedLead = lead;
    renderLeadsTable(currentDisplayedLeads);
    renderSelectedLeadPanel(lead);
    closeLeadActionDropdown();
    openViewLeadModal(lead);
  });

  menu.querySelector('.btn-action-chat-lead').addEventListener('click', (e) => {
    e.stopPropagation();
    closeLeadActionDropdown();
    openChatForLead(lead);
  });

  menu.querySelector('.btn-action-assign-lead').addEventListener('click', (e) => {
    e.stopPropagation();
    closeLeadActionDropdown();
    openAssignAgentModal(lead);
  });

  menu.querySelector('.btn-action-send-crm').addEventListener('click', (e) => {
    e.stopPropagation();
    closeLeadActionDropdown();
    openLeadSendToCrmModal(lead);
  });

  menu.querySelector('.btn-action-tag-lead').addEventListener('click', (e) => {
    e.stopPropagation();
    closeLeadActionDropdown();
    openLeadTagsModal(lead);
  });

  menu.querySelector('.btn-action-edit-lead').addEventListener('click', (e) => {
    e.stopPropagation();
    closeLeadActionDropdown();
    openEditLeadModal(lead);
  });

  menu.querySelector('.btn-action-copy-phone').addEventListener('click', (e) => {
    e.stopPropagation();
    if (lead.phone) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(lead.phone);
      }
      showToast(`Telefone copiado: ${lead.phone}`);
    }
    closeLeadActionDropdown();
  });

  menu.querySelector('.btn-action-copy-email').addEventListener('click', (e) => {
    e.stopPropagation();
    if (lead.email) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(lead.email);
      }
      showToast(`E-mail copiado: ${lead.email}`);
    }
    closeLeadActionDropdown();
  });

  menu.querySelector('.btn-action-delete-lead').addEventListener('click', (e) => {
    e.stopPropagation();
    closeLeadActionDropdown();
    openDeleteLeadModal(lead);
  });

  // Append dropdown to row action wrapper
  btn.parentElement.appendChild(menu);

  // Position detection: only flip upwards if really near the bottom and plenty of room above
  const rect = btn.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  if (spaceBelow < 250 && spaceAbove > 320) {
    menu.classList.add('open-upwards');
  }

  if (window.lucide) window.lucide.createIcons();
}

export function changeLeadStatus(lead, newStatus, newKey) {
  if (!lead) return;
  lead.status = newStatus;
  lead.statusKey = newKey || getStatusKey(newStatus);

  if (selectedLead?.id === lead.id) {
    selectedLead = lead;
    renderSelectedLeadPanel(lead);
  }

  renderLeadsTable(currentDisplayedLeads);
  showToast(`Status de "${lead.name}" alterado para ${newStatus}!`);
}

export function openEditLeadModal(lead) {
  if (!lead) return;
  const idInput = document.getElementById('edit-lead-id');
  const nameInput = document.getElementById('edit-lead-name');
  const phoneInput = document.getElementById('edit-lead-phone');
  const emailInput = document.getElementById('edit-lead-email');
  const channelSelect = document.getElementById('edit-lead-channel');
  const statusSelect = document.getElementById('edit-lead-status');
  const interestInput = document.getElementById('edit-lead-interest');
  const notesInput = document.getElementById('edit-lead-notes');

  if (idInput) idInput.value = lead.id;
  if (nameInput) nameInput.value = lead.name || '';
  if (phoneInput) phoneInput.value = lead.phone || '';
  if (emailInput) emailInput.value = lead.email || '';
  if (channelSelect) channelSelect.value = lead.channel || 'WhatsApp';
  if (statusSelect) statusSelect.value = lead.status || 'Novo';
  if (interestInput) interestInput.value = lead.primaryInterest || lead.interests?.[0] || '';
  if (notesInput) notesInput.value = lead.notes || '';

  openModal('modal-edit-lead');
}

function setupEditLeadModal() {
  const form = document.getElementById('form-edit-lead');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const leadId = document.getElementById('edit-lead-id')?.value;
    const lead = zapChatData.leads.list.find(l => l.id === leadId);
    if (!lead) return;

    const newName = document.getElementById('edit-lead-name')?.value.trim() || lead.name;
    const newPhone = document.getElementById('edit-lead-phone')?.value.trim() || lead.phone;
    const newEmail = document.getElementById('edit-lead-email')?.value.trim() || lead.email;
    const newChannel = document.getElementById('edit-lead-channel')?.value || lead.channel;
    const newStatus = document.getElementById('edit-lead-status')?.value || lead.status;
    const newInterest = document.getElementById('edit-lead-interest')?.value.trim() || lead.primaryInterest;
    const newNotes = document.getElementById('edit-lead-notes')?.value.trim() || '';

    lead.name = newName;
    lead.phone = newPhone;
    lead.email = newEmail;
    lead.channel = newChannel;
    lead.status = newStatus;
    lead.statusKey = getStatusKey(newStatus);
    lead.primaryInterest = newInterest;
    if (lead.interests && lead.interests.length > 0) {
      lead.interests[0] = newInterest;
    } else {
      lead.interests = [newInterest];
    }
    lead.notes = newNotes;

    // Recalculate initials
    const words = newName.split(' ').filter(Boolean);
    lead.initials = words.length > 1
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
      : (words[0] ? words[0].slice(0, 2).toUpperCase() : 'LE');

    if (selectedLead?.id === lead.id) {
      selectedLead = lead;
    }

    renderLeadsTable(currentDisplayedLeads);
    if (selectedLead?.id === lead.id) {
      renderSelectedLeadPanel(lead);
    }

    closeAllModals();
    showToast(`Lead "${lead.name}" atualizado com sucesso!`);
  });
}

export function openDeleteLeadModal(lead) {
  if (!lead) return;
  leadToDelete = lead;
  const nameEl = document.getElementById('delete-lead-name');
  if (nameEl) {
    nameEl.textContent = lead.name;
  }
  openModal('modal-delete-lead');
}

function setupDeleteLeadModal() {
  const confirmBtn = document.getElementById('btn-confirm-delete-lead');
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', () => {
    if (!leadToDelete) return;

    const index = zapChatData.leads.list.findIndex(l => l.id === leadToDelete.id);
    if (index !== -1) {
      zapChatData.leads.list.splice(index, 1);
    }
    checkedLeadIds.delete(leadToDelete.id);

    currentDisplayedLeads = currentDisplayedLeads.filter(l => l.id !== leadToDelete.id);

    if (selectedLead?.id === leadToDelete.id) {
      selectedLead = currentDisplayedLeads[0] || null;
    }

    renderLeadsTable(currentDisplayedLeads);
    if (selectedLead) {
      renderSelectedLeadPanel(selectedLead);
    } else {
      const panel = document.getElementById('lead-detail-panel');
      if (panel) panel.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);">Nenhum lead selecionado</div>';
    }

    const deletedName = leadToDelete.name;
    leadToDelete = null;
    closeAllModals();
    showToast(`Lead "${deletedName}" removido com sucesso!`);
  });
}

export function openViewLeadModal(lead) {
  if (!lead) return;
  currentLeadForView = lead;

  const modal = document.getElementById('modal-view-lead');
  if (!modal) return;

  // Avatar & Basic info
  const avatarEl = document.getElementById('view-lead-avatar');
  if (avatarEl) avatarEl.textContent = lead.initials || lead.name?.slice(0, 2).toUpperCase() || 'LD';

  const nameEl = document.getElementById('view-lead-name');
  if (nameEl) nameEl.textContent = lead.name;

  const statusPillEl = document.getElementById('view-lead-status-pill');
  if (statusPillEl) {
    statusPillEl.textContent = lead.status;
    statusPillEl.className = `lead-status-pill ${lead.statusKey || getStatusKey(lead.status)}`;
  }

  const channelBadgeEl = document.getElementById('view-lead-channel-badge');
  if (channelBadgeEl) {
    channelBadgeEl.innerHTML = getChannelBadge(lead.channel);
  }

  const scoreBadgeEl = document.getElementById('view-lead-score-badge');
  if (scoreBadgeEl) {
    scoreBadgeEl.innerHTML = `<i data-lucide="award" style="width: 13px; height: 13px;"></i> Score: ${lead.score || 72} (${lead.scoreLevel || 'Médio'})`;
  }

  // Contact Info
  const phoneEl = document.getElementById('view-lead-phone');
  if (phoneEl) phoneEl.textContent = lead.phone || 'Não informado';

  const emailEl = document.getElementById('view-lead-email');
  if (emailEl) emailEl.textContent = lead.email || 'Não informado';

  const channelTextEl = document.getElementById('view-lead-channel-text');
  if (channelTextEl) channelTextEl.textContent = lead.channel || 'WhatsApp';

  const lastContactEl = document.getElementById('view-lead-last-contact');
  if (lastContactEl) lastContactEl.textContent = lead.lastContact || 'Recente';

  // Agent & Qualification
  const agentImgEl = document.getElementById('view-lead-agent-img');
  if (agentImgEl) {
    agentImgEl.src = lead.agentImg || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80';
    agentImgEl.alt = lead.agentName || 'Agente';
  }

  const agentNameEl = document.getElementById('view-lead-agent-name');
  if (agentNameEl) agentNameEl.textContent = lead.agentName || 'Juliana Santos';

  const interestEl = document.getElementById('view-lead-interest');
  if (interestEl) interestEl.textContent = lead.primaryInterest || lead.interests?.[0] || 'Plano Pro';

  const nextActionTextEl = document.getElementById('view-lead-next-action-text');
  if (nextActionTextEl) nextActionTextEl.textContent = lead.nextAction?.text || 'Follow-up por WhatsApp';

  const nextActionTimeEl = document.getElementById('view-lead-next-action-time');
  if (nextActionTimeEl) nextActionTimeEl.textContent = lead.nextAction?.time || 'Hoje às 14:00';

  // Status buttons inside modal
  const statusButtonsContainer = document.getElementById('view-lead-status-buttons');
  if (statusButtonsContainer) {
    statusButtonsContainer.querySelectorAll('.btn-status-tab').forEach(btn => {
      const status = btn.getAttribute('data-status');
      btn.classList.toggle('active', status === lead.status);
    });
  }

  // Notes
  const notesEl = document.getElementById('view-lead-notes');
  if (notesEl) {
    notesEl.textContent = lead.notes || 'Nenhuma observação cadastrada no momento.';
  }

  if (window.lucide) window.lucide.createIcons();
  openModal('modal-view-lead');
}

function setupViewLeadModal() {
  const modal = document.getElementById('modal-view-lead');
  if (!modal) return;

  // Open Chat from modal
  const openChatBtn = document.getElementById('btn-view-lead-open-chat');
  if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
      if (!currentLeadForView) return;
      const targetLead = currentLeadForView;
      closeAllModals();
      openChatForLead(targetLead);
    });
  }

  // Assign Agent from modal
  const assignAgentBtn = document.getElementById('btn-view-lead-assign-agent');
  if (assignAgentBtn) {
    assignAgentBtn.addEventListener('click', () => {
      if (!currentLeadForView) return;
      const targetLead = currentLeadForView;
      closeAllModals();
      openAssignAgentModal(targetLead);
    });
  }

  // Edit Lead from modal
  const editLeadBtn = document.getElementById('btn-view-lead-edit');
  if (editLeadBtn) {
    editLeadBtn.addEventListener('click', () => {
      if (!currentLeadForView) return;
      const targetLead = currentLeadForView;
      closeAllModals();
      openEditLeadModal(targetLead);
    });
  }

  // Delete Lead from modal
  const deleteLeadBtn = document.getElementById('btn-view-lead-delete');
  if (deleteLeadBtn) {
    deleteLeadBtn.addEventListener('click', () => {
      if (!currentLeadForView) return;
      const targetLead = currentLeadForView;
      closeAllModals();
      openDeleteLeadModal(targetLead);
    });
  }

  // Copy phone
  const copyPhoneBtn = document.getElementById('btn-view-lead-copy-phone');
  if (copyPhoneBtn) {
    copyPhoneBtn.addEventListener('click', () => {
      if (currentLeadForView?.phone && navigator.clipboard) {
        navigator.clipboard.writeText(currentLeadForView.phone);
        showToast(`Telefone copiado: ${currentLeadForView.phone}`);
      }
    });
  }

  // Copy email
  const copyEmailBtn = document.getElementById('btn-view-lead-copy-email');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      if (currentLeadForView?.email && navigator.clipboard) {
        navigator.clipboard.writeText(currentLeadForView.email);
        showToast(`E-mail copiado: ${currentLeadForView.email}`);
      }
    });
  }

  // Status options inside modal
  const statusButtonsContainer = document.getElementById('view-lead-status-buttons');
  if (statusButtonsContainer) {
    statusButtonsContainer.querySelectorAll('.btn-status-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!currentLeadForView) return;
        const newStatus = btn.getAttribute('data-status');
        const newKey = btn.getAttribute('data-key');
        changeLeadStatus(currentLeadForView, newStatus, newKey);

        statusButtonsContainer.querySelectorAll('.btn-status-tab').forEach(b => {
          b.classList.toggle('active', b === btn);
        });

        const statusPillEl = document.getElementById('view-lead-status-pill');
        if (statusPillEl) {
          statusPillEl.textContent = newStatus;
          statusPillEl.className = `lead-status-pill ${newKey}`;
        }
      });
    });
  }
}

export function openChatForLead(lead) {
  if (!lead) return;

  let existingThread = zapChatData.conversas.threads.find(
    t => t.id === lead.id || t.name === lead.name || t.phone === lead.phone
  );

  if (!existingThread) {
    existingThread = {
      id: lead.id,
      name: lead.name,
      channel: lead.channel || 'WhatsApp',
      time: 'Agora',
      unread: 0,
      active: true,
      img: lead.agentImg || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      snippet: `Iniciando atendimento com ${lead.name}...`,
      customerSince: 'Lead recente',
      customerId: `ID: ${lead.id.slice(0, 6)}`,
      phone: lead.phone || '',
      email: lead.email || '',
      origin: lead.channel || 'WhatsApp',
      originTime: 'Agora • Hoje',
      assignedAgent: lead.agentName || 'Pedro',
      attendingStatus: 'IA atendendo',
      isAiAttending: true,
      tags: Array.isArray(lead.tags) ? [...lead.tags] : [],
      status: lead.status || 'Novo',
      aiSummary: [
        `Origem: ${lead.channel || 'WhatsApp'}`,
        `Interesse: ${lead.primaryInterest || 'Geral'}`,
        `Lead cadastrado via lista de leads`
      ],
      messages: [
        {
          sender: 'system',
          text: `Conversa com ${lead.name} aberta a partir da aba de Leads.`,
          time: 'Agora'
        }
      ]
    };
    zapChatData.conversas.threads.unshift(existingThread);
  }

  switchView('conversas');
  openChatThread(existingThread.id);
  showToast(`Conversa de "${lead.name}" aberta!`);
}
