// ZapChat - Team Management Module (Equipe e Acessos)
import { showToast } from './settings.js';

// Default initial members matching user inspiration screenshot
const DEFAULT_TEAM_MEMBERS = [
  {
    id: 'rafael_mota',
    name: 'Rafael Mota',
    email: 'rafaelmotamkt@gmail.com',
    role: 'Proprietário & Gestor',
    department: 'Atendimento Geral',
    isOwner: true,
    status: 'online', // 'online' | 'away' | 'offline'
    avatarBg: '#00A868',
    avatarColor: '#FFFFFF',
    initials: 'RM',
    phone: '+55 11 99999-0001',
    permissions: {
      dashboard: true,
      contatos: true,
      campanhas: true,
      transmissao: true,
      automacao: true,
      fluxos: true,
      configuracoes: true,
      inbox: true
    }
  },
  {
    id: 'alaine_felix',
    name: 'Alaine Felix',
    email: 'alainefelix1@gmail.com',
    role: 'Supervisora de Atendimento',
    department: 'Comercial & Vendas',
    isOwner: false,
    status: 'online',
    avatarBg: '#7C3AED',
    avatarColor: '#FFFFFF',
    initials: 'AF',
    phone: '+55 11 98765-4321',
    permissions: {
      dashboard: true,
      contatos: true,
      campanhas: true,
      transmissao: true,
      automacao: true,
      fluxos: true,
      configuracoes: true,
      inbox: true
    }
  },
  {
    id: 'vinicius_silva',
    name: 'VINICIUS DA SILVA',
    email: 'vini_hmd@hotmail.com',
    role: 'Atendente Comercial',
    department: 'Comercial & Vendas',
    isOwner: false,
    status: 'online',
    avatarBg: '#2563EB',
    avatarColor: '#FFFFFF',
    initials: 'VS',
    phone: '+55 21 99887-1122',
    permissions: {
      dashboard: true,
      contatos: false,
      campanhas: true,
      transmissao: false,
      automacao: false,
      fluxos: false,
      configuracoes: false,
      inbox: true
    }
  },
  {
    id: 'carlos_felix',
    name: 'Carlos Felix',
    email: 'educarlos00@gmail.com',
    role: 'Suporte Técnico N2',
    department: 'Suporte Técnico',
    isOwner: false,
    status: 'online',
    avatarBg: '#0D9488',
    avatarColor: '#FFFFFF',
    initials: 'CF',
    phone: '+55 31 98877-6655',
    permissions: {
      dashboard: true,
      contatos: true,
      campanhas: true,
      transmissao: false,
      automacao: false,
      fluxos: true,
      configuracoes: true,
      inbox: true
    }
  }
];

const DEFAULT_DEPARTMENTS = [
  { id: 'suporte', name: 'Suporte Técnico', desc: 'Atendimento a dúvidas técnicas e chamados N1/N2', color: '#2563EB' },
  { id: 'comercial', name: 'Comercial & Vendas', desc: 'Negociações, orçamentos e propostas comerciais', color: '#00A868' },
  { id: 'geral', name: 'Atendimento Geral', desc: 'Fila padrão de recepção e triagem de novos clientes', color: '#7C3AED' },
  { id: 'financeiro', name: 'Financeiro & Cobrança', desc: 'Boletos, faturas, 2ª via e confirmações de pagamento', color: '#F59E0B' }
];

let teamMembers = [];
let departments = [];
let activeSubTab = 'equipe'; // 'equipe' | 'departamentos'
let activeMemberMenuId = null;

/**
 * Initialize Team Management module
 */
export function initTeamSettings() {
  loadData();
  setupSubTabs();
  setupHeaderControls();
  setupTableEventListeners();
  setupModals();
  setupPresets();
  renderTeamTable();
  renderDepartmentsView();
  syncLiveChatDestinations();

  // Expose globally for cross-module needs
  window.getTeamMembers = getTeamMembers;
  window.getDepartments = getDepartments;
  window.refreshTeamTable = renderTeamTable;
}

/**
 * Get current team members list
 */
export function getTeamMembers() {
  if (!teamMembers || teamMembers.length === 0) {
    loadData();
  }
  return teamMembers;
}

/**
 * Get current departments list
 */
export function getDepartments() {
  if (!departments || departments.length === 0) {
    loadData();
  }
  return departments;
}

/**
 * Load persisted data or set initial defaults
 */
function loadData() {
  try {
    const savedMembers = localStorage.getItem('zapchat_team_members');
    if (savedMembers) {
      teamMembers = JSON.parse(savedMembers);
    } else {
      teamMembers = JSON.parse(JSON.stringify(DEFAULT_TEAM_MEMBERS));
      saveTeamMembers();
    }

    const savedDepts = localStorage.getItem('zapchat_departments');
    if (savedDepts) {
      departments = JSON.parse(savedDepts);
    } else {
      departments = JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
      saveDepartments();
    }

    // Normalize legacy department names so members match existing departments
    const legacyDeptMap = {
      'Gestão & Geral': 'Atendimento Geral',
      'Geral': 'Atendimento Geral',
      'Comercial': 'Comercial & Vendas',
      'Vendas': 'Comercial & Vendas'
    };
    let normalized = false;
    teamMembers.forEach(m => {
      if (m.department && legacyDeptMap[m.department] && departments.some(d => d.name === legacyDeptMap[m.department])) {
        m.department = legacyDeptMap[m.department];
        normalized = true;
      }
    });
    if (normalized) {
      saveTeamMembers();
    }
  } catch (err) {
    console.warn('Erro ao carregar dados da equipe do localStorage:', err);
    teamMembers = JSON.parse(JSON.stringify(DEFAULT_TEAM_MEMBERS));
    departments = JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
  }
}

/**
 * Save team members to localStorage and sync live chat attendants
 */
function saveTeamMembers() {
  try {
    localStorage.setItem('zapchat_team_members', JSON.stringify(teamMembers));
    syncLiveChatDestinations();
  } catch (err) {
    console.error('Erro ao salvar membros:', err);
  }
}

/**
 * Save departments to localStorage
 */
function saveDepartments() {
  try {
    localStorage.setItem('zapchat_departments', JSON.stringify(departments));
  } catch (err) {
    console.error('Erro ao salvar departamentos:', err);
  }
}

/**
 * Synchronize team members with live chat attendant transfer list
 */
function syncLiveChatDestinations() {
  // If transferDestinations exists in chat module or window, update human attendants
  if (window.transferDestinations) {
    teamMembers.forEach(m => {
      if (m.permissions.inbox) {
        const existing = window.transferDestinations.find(d => d.id === m.id);
        if (!existing) {
          window.transferDestinations.push({
            id: m.id,
            name: m.name + (m.isOwner ? ' (Você)' : ''),
            type: 'human',
            typeLabel: 'Humano',
            role: m.role || 'Atendente',
            department: m.department || 'Geral',
            img: null,
            initials: m.initials,
            bg: m.avatarBg,
            status: m.status || 'online',
            statusLabel: m.status === 'online' ? 'Disponível' : 'Ausente',
            workload: 'Fila ativa'
          });
        }
      }
    });
  }
}

/**
 * Setup sub-tabs (Equipe | Departamentos)
 */
function setupSubTabs() {
  const tabs = document.querySelectorAll('.equipe-subtab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabTarget = btn.getAttribute('data-subtab');
      switchSubTab(tabTarget);
    });
  });
}

/**
 * Switch between Equipe and Departamentos views
 */
export function switchSubTab(subTabName) {
  activeSubTab = subTabName;
  const tabs = document.querySelectorAll('.equipe-subtab-btn');
  tabs.forEach(b => {
    if (b.getAttribute('data-subtab') === subTabName) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  const viewEquipe = document.getElementById('equipe-view-members');
  const viewDepts = document.getElementById('equipe-view-departments');

  if (subTabName === 'equipe') {
    if (viewEquipe) viewEquipe.style.display = 'block';
    if (viewDepts) viewDepts.style.display = 'none';
    renderTeamTable();
  } else {
    if (viewEquipe) viewEquipe.style.display = 'none';
    if (viewDepts) viewDepts.style.display = 'block';
    renderDepartmentsView();
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Setup header controls: Show names in live chat, search, etc.
 */
function setupHeaderControls() {
  const toggleShowNames = document.getElementById('toggle-show-member-names');
  if (toggleShowNames) {
    const saved = localStorage.getItem('zapchat_show_member_names');
    toggleShowNames.checked = saved !== null ? saved === 'true' : true;

    toggleShowNames.addEventListener('change', () => {
      localStorage.setItem('zapchat_show_member_names', toggleShowNames.checked);
      if (toggleShowNames.checked) {
        showToast('Identificação de atendentes nos chats ao vivo ativada!');
      } else {
        showToast('Identificação de atendentes nos chats ao vivo desativada.');
      }
    });
  }

  // Member search input
  const searchInput = document.getElementById('team-members-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderTeamTable();
    });
  }

  // Member department filter
  const filterDept = document.getElementById('team-members-filter-dept');
  if (filterDept) {
    filterDept.addEventListener('change', () => {
      renderTeamTable();
    });
  }
}

/**
 * Render the team members table matching Botconversa inspiration
 */
export function renderTeamTable() {
  const tbody = document.getElementById('team-table-tbody');
  const countBadge = document.getElementById('team-count-badge');
  const searchInput = document.getElementById('team-members-search');
  const filterDept = document.getElementById('team-members-filter-dept');

  if (!tbody) return;

  const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const selectedDept = filterDept ? filterDept.value : 'all';

  const filtered = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm) ||
                          member.email.toLowerCase().includes(searchTerm) ||
                          (member.role && member.role.toLowerCase().includes(searchTerm));
    const matchesDept = selectedDept === 'all' || member.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  if (countBadge) {
    countBadge.textContent = `${teamMembers.length} ${teamMembers.length === 1 ? 'membro' : 'membros'}`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="team-empty-state">
          <div style="padding: 36px 16px; text-align: center; color: var(--text-muted);">
            <i data-lucide="user-x" style="width: 32px; height: 32px; margin: 0 auto 10px; opacity: 0.5;"></i>
            <p style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: var(--text-main);">Nenhum membro encontrado</p>
            <p style="font-size: 13px;">Tente buscar com outro termo ou limpe os filtros aplicados.</p>
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(member => {
    const isOwner = !!member.isOwner;
    const p = member.permissions || {};
    const statusDotClass = member.status === 'online' ? 'status-dot-online' : (member.status === 'away' ? 'status-dot-away' : 'status-dot-offline');

    return `
      <tr class="team-table-row ${isOwner ? 'is-owner-row' : ''}" data-member-id="${member.id}">
        <!-- Member / E-mail Column -->
        <td class="team-cell-member">
          <div class="team-member-identity">
            <div class="team-avatar-wrap">
              <div class="team-avatar" style="background-color: ${member.avatarBg || '#00A868'}; color: ${member.avatarColor || '#FFFFFF'};">
                ${member.initials || member.name.substring(0, 2).toUpperCase()}
              </div>
              <span class="team-status-indicator ${statusDotClass}" title="Status: ${member.status === 'online' ? 'Disponível' : 'Ausente'}"></span>
            </div>
            <div class="team-member-info">
              <div class="team-member-header">
                <span class="team-member-name">${escapeHtml(member.name)}</span>
                ${isOwner ? '<span class="team-badge-owner">dono</span>' : ''}
                <button type="button" class="team-member-dept-tag btn-assign-member-dept" data-member-id="${member.id}" title="Clique para vincular departamento" style="cursor: pointer; border: 1px solid var(--border); display: inline-flex; align-items: center; gap: 4px;">
                  <span>${escapeHtml(member.department || 'Sem departamento')}</span>
                  <i data-lucide="chevron-down" style="width: 11px; height: 11px; opacity: 0.7;"></i>
                </button>
              </div>
              <span class="team-member-email">${escapeHtml(member.email)}</span>
            </div>
          </div>
        </td>

        <!-- 1. Painel de Controle -->
        <td class="team-cell-checkbox">
          <label class="custom-checkbox-wrap" title="${isOwner ? 'Permissão permanente do proprietário' : 'Painel de Controle'}">
            <input type="checkbox" class="team-perm-check" data-perm="dashboard" ${p.dashboard ? 'checked' : ''} ${isOwner ? 'disabled' : ''}>
            <span class="custom-checkbox-box"></span>
          </label>
        </td>

        <!-- 2. Contatos -->
        <td class="team-cell-checkbox">
          <label class="custom-checkbox-wrap" title="${isOwner ? 'Permissão permanente do proprietário' : 'Contatos / Leads'}">
            <input type="checkbox" class="team-perm-check" data-perm="contatos" ${p.contatos ? 'checked' : ''} ${isOwner ? 'disabled' : ''}>
            <span class="custom-checkbox-box"></span>
          </label>
        </td>

        <!-- 3. Campanhas -->
        <td class="team-cell-checkbox">
          <label class="custom-checkbox-wrap" title="${isOwner ? 'Permissão permanente do proprietário' : 'Campanhas'}">
            <input type="checkbox" class="team-perm-check" data-perm="campanhas" ${p.campanhas ? 'checked' : ''} ${isOwner ? 'disabled' : ''}>
            <span class="custom-checkbox-box"></span>
          </label>
        </td>

        <!-- 4. Transmissão -->
        <td class="team-cell-checkbox">
          <label class="custom-checkbox-wrap" title="${isOwner ? 'Permissão permanente do proprietário' : 'Transmissão'}">
            <input type="checkbox" class="team-perm-check" data-perm="transmissao" ${p.transmissao ? 'checked' : ''} ${isOwner ? 'disabled' : ''}>
            <span class="custom-checkbox-box"></span>
          </label>
        </td>

        <!-- 5. Automação -->
        <td class="team-cell-checkbox">
          <label class="custom-checkbox-wrap" title="${isOwner ? 'Permissão permanente do proprietário' : 'Automação'}">
            <input type="checkbox" class="team-perm-check" data-perm="automacao" ${p.automacao ? 'checked' : ''} ${isOwner ? 'disabled' : ''}>
            <span class="custom-checkbox-box"></span>
          </label>
        </td>

        <!-- 6. Fluxos de conversa -->
        <td class="team-cell-checkbox">
          <label class="custom-checkbox-wrap" title="${isOwner ? 'Permissão permanente do proprietário' : 'Fluxos de conversa'}">
            <input type="checkbox" class="team-perm-check" data-perm="fluxos" ${p.fluxos ? 'checked' : ''} ${isOwner ? 'disabled' : ''}>
            <span class="custom-checkbox-box"></span>
          </label>
        </td>

        <!-- 7. Configurações -->
        <td class="team-cell-checkbox">
          <label class="custom-checkbox-wrap" title="${isOwner ? 'Permissão permanente do proprietário' : 'Configurações'}">
            <input type="checkbox" class="team-perm-check" data-perm="configuracoes" ${p.configuracoes ? 'checked' : ''} ${isOwner ? 'disabled' : ''}>
            <span class="custom-checkbox-box"></span>
          </label>
        </td>

        <!-- 8. Inbox -->
        <td class="team-cell-checkbox">
          <label class="custom-checkbox-wrap" title="${isOwner ? 'Permissão permanente do proprietário' : 'Inbox / Atendimento ao vivo'}">
            <input type="checkbox" class="team-perm-check" data-perm="inbox" ${p.inbox ? 'checked' : ''} ${isOwner ? 'disabled' : ''}>
            <span class="custom-checkbox-box"></span>
          </label>
        </td>

        <!-- Actions Menu Column (⋮) -->
        <td class="team-cell-actions">
          <div class="team-action-menu-wrap">
            <button type="button" class="team-action-btn btn-team-menu-toggle" data-member-id="${member.id}" title="Opções do membro">
              <i data-lucide="more-vertical" style="width: 17px; height: 17px;"></i>
            </button>
            <div class="team-action-dropdown" id="team-dropdown-${member.id}">
              <button type="button" class="team-dropdown-item btn-edit-member" data-member-id="${member.id}">
                <i data-lucide="edit-3" style="width: 14px; height: 14px; color: var(--primary);"></i>
                <span>Editar dados & permissões</span>
              </button>
              <button type="button" class="team-dropdown-item btn-assign-member-dept" data-member-id="${member.id}">
                <i data-lucide="folder-kanban" style="width: 14px; height: 14px; color: #7C3AED;"></i>
                <span>Vincular departamento</span>
              </button>
              <button type="button" class="team-dropdown-item btn-resend-invite" data-member-id="${member.id}">
                <i data-lucide="mail" style="width: 14px; height: 14px; color: var(--status-info);"></i>
                <span>Reenviar convite por e-mail</span>
              </button>
              <button type="button" class="team-dropdown-item btn-toggle-status" data-member-id="${member.id}">
                <i data-lucide="${member.status === 'online' ? 'clock' : 'check-circle'}" style="width: 14px; height: 14px; color: var(--status-warning);"></i>
                <span>${member.status === 'online' ? 'Marcar como ausente' : 'Marcar como disponível'}</span>
              </button>
              ${!isOwner ? `
                <div class="team-dropdown-divider"></div>
                <button type="button" class="team-dropdown-item item-danger btn-delete-member" data-member-id="${member.id}">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--status-danger);"></i>
                  <span>Remover da equipe</span>
                </button>
              ` : ''}
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Render Departments view
 */
export function renderDepartmentsView() {
  const container = document.getElementById('departments-grid-container');
  if (!container) return;

  container.innerHTML = departments.map(dept => {
    // Count members in this department
    const count = teamMembers.filter(m => m.department === dept.name || m.department === dept.id).length;
    const deptMembers = teamMembers.filter(m => m.department === dept.name || m.department === dept.id);

    return `
      <div class="dept-card">
        <div class="dept-card-header">
          <div class="dept-icon-box" style="background-color: ${dept.color}15; color: ${dept.color};">
            <i data-lucide="folder-kanban" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="dept-card-title-wrap">
            <h4 class="dept-title">${escapeHtml(dept.name)}</h4>
            <span class="dept-member-counter"><i data-lucide="users" style="width: 12px; height: 12px;"></i> ${count} ${count === 1 ? 'atendente' : 'atendentes'}</span>
          </div>
          <div class="dept-card-actions">
            <button type="button" class="dept-action-btn btn-edit-department" data-dept-id="${dept.id}" title="Editar departamento">
              <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
            </button>
            <button type="button" class="dept-action-btn danger btn-delete-department" data-dept-id="${dept.id}" title="Excluir departamento">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>
        <p class="dept-desc">${escapeHtml(dept.desc)}</p>

        <div class="dept-card-footer">
          <div class="dept-avatars-row">
            ${deptMembers.slice(0, 4).map(m => `
              <div class="dept-mini-avatar" style="background-color: ${m.avatarBg}; color: ${m.avatarColor};" title="${escapeHtml(m.name)}">
                ${m.initials}
              </div>
            `).join('')}
            ${deptMembers.length > 4 ? `<div class="dept-mini-avatar more">+${deptMembers.length - 4}</div>` : ''}
            ${deptMembers.length === 0 ? '<span class="dept-no-members">Nenhum membro vinculado</span>' : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="btn btn-secondary btn-sm btn-manage-dept-members" data-dept-id="${dept.id}" style="padding: 4px 9px; font-size: 11.5px;">
              <i data-lucide="user-plus" style="width: 12px; height: 12px;"></i>
              <span>Vincular</span>
            </button>
            <button type="button" class="btn btn-ghost btn-sm btn-filter-dept-members" data-dept-name="${dept.name}" style="padding: 4px 8px; font-size: 11.5px;">
              Ver membros <i data-lucide="chevron-right" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update department options in selects
  populateDepartmentSelects();

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Populate department dropdowns in modals & filter
 */
function populateDepartmentSelects() {
  const filterSelect = document.getElementById('team-members-filter-dept');
  const modalAddSelect = document.getElementById('add-member-dept');
  const modalEditSelect = document.getElementById('edit-member-dept');

  const optionsHtml = departments.map(d => `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`).join('');

  if (filterSelect) {
    const curVal = filterSelect.value;
    filterSelect.innerHTML = `<option value="all">Todos os departamentos</option>` + optionsHtml;
    filterSelect.value = curVal || 'all';
  }

  if (modalAddSelect) {
    modalAddSelect.innerHTML = optionsHtml;
  }

  if (modalEditSelect) {
    modalEditSelect.innerHTML = optionsHtml;
  }
}

/**
 * Setup table interactive delegated event listeners
 */
function setupTableEventListeners() {
  document.addEventListener('click', (e) => {
    // 1. Click on menu toggle (three dots ⋮)
    const menuToggle = e.target.closest('.btn-team-menu-toggle');
    if (menuToggle) {
      e.preventDefault();
      e.stopPropagation();
      const memberId = menuToggle.getAttribute('data-member-id');
      toggleActionDropdown(memberId);
      return;
    }

    // 2. Click outside dropdown -> close any open dropdown
    const isInsideDropdown = e.target.closest('.team-action-dropdown');
    if (!isInsideDropdown) {
      closeAllActionDropdowns();
    }

    // 3. Edit member
    const editBtn = e.target.closest('.btn-edit-member');
    if (editBtn) {
      e.preventDefault();
      const memberId = editBtn.getAttribute('data-member-id');
      closeAllActionDropdowns();
      openEditMemberModal(memberId);
      return;
    }

    // 4. Resend invite
    const resendBtn = e.target.closest('.btn-resend-invite');
    if (resendBtn) {
      e.preventDefault();
      const memberId = resendBtn.getAttribute('data-member-id');
      const m = teamMembers.find(item => item.id === memberId);
      closeAllActionDropdowns();
      if (m) {
        showToast(`Convite de acesso reenviado com sucesso para ${m.email}!`);
      }
      return;
    }

    // 5. Toggle status (online/away)
    const statusBtn = e.target.closest('.btn-toggle-status');
    if (statusBtn) {
      e.preventDefault();
      const memberId = statusBtn.getAttribute('data-member-id');
      const m = teamMembers.find(item => item.id === memberId);
      closeAllActionDropdowns();
      if (m) {
        m.status = m.status === 'online' ? 'away' : 'online';
        saveTeamMembers();
        renderTeamTable();
        showToast(`Status de ${m.name} alterado para ${m.status === 'online' ? 'Disponível' : 'Ausente'}.`);
      }
      return;
    }

    // 6. Delete member
    const deleteBtn = e.target.closest('.btn-delete-member');
    if (deleteBtn) {
      e.preventDefault();
      const memberId = deleteBtn.getAttribute('data-member-id');
      closeAllActionDropdowns();
      openDeleteMemberModal(memberId);
      return;
    }

    // 7. Filter department from department card button
    const deptFilterBtn = e.target.closest('.btn-filter-dept-members');
    if (deptFilterBtn) {
      e.preventDefault();
      const deptName = deptFilterBtn.getAttribute('data-dept-name');
      const filterSelect = document.getElementById('team-members-filter-dept');
      if (filterSelect) {
        filterSelect.value = deptName;
      }
      switchSubTab('equipe');
      return;
    }

    // 8. Edit department
    const editDeptBtn = e.target.closest('.btn-edit-department');
    if (editDeptBtn) {
      e.preventDefault();
      const deptId = editDeptBtn.getAttribute('data-dept-id');
      openEditDepartmentModal(deptId);
      return;
    }

    // 9. Delete department
    const deleteDeptBtn = e.target.closest('.btn-delete-department');
    if (deleteDeptBtn) {
      e.preventDefault();
      const deptId = deleteDeptBtn.getAttribute('data-dept-id');
      openDeleteDepartmentModal(deptId);
      return;
    }

    // 10. Assign member department (from member row badge or 3-dots menu)
    const assignMemberDeptBtn = e.target.closest('.btn-assign-member-dept');
    if (assignMemberDeptBtn) {
      e.preventDefault();
      e.stopPropagation();
      const memberId = assignMemberDeptBtn.getAttribute('data-member-id');
      closeAllActionDropdowns();
      openAssignMemberDepartmentModal(memberId);
      return;
    }

    // 11. Manage department members (from department card "Vincular" button)
    const manageDeptMembersBtn = e.target.closest('.btn-manage-dept-members');
    if (manageDeptMembersBtn) {
      e.preventDefault();
      const deptId = manageDeptMembersBtn.getAttribute('data-dept-id');
      openManageDepartmentMembersModal(deptId);
      return;
    }
  });

  // Table checkbox change listener (interactive permissions toggling)
  document.addEventListener('change', (e) => {
    const checkbox = e.target.closest('.team-perm-check');
    if (checkbox) {
      const row = checkbox.closest('.team-table-row');
      if (!row) return;
      const memberId = row.getAttribute('data-member-id');
      const permKey = checkbox.getAttribute('data-perm');
      const member = teamMembers.find(m => m.id === memberId);

      if (member) {
        if (member.isOwner) {
          // Cannot modify owner permissions
          checkbox.checked = true;
          showToast('As permissões do proprietário não podem ser alteradas.');
          return;
        }

        if (!member.permissions) member.permissions = {};
        member.permissions[permKey] = checkbox.checked;
        saveTeamMembers();

        const permLabels = {
          dashboard: 'Painel de Controle',
          contatos: 'Contatos',
          campanhas: 'Campanhas',
          transmissao: 'Transmissão',
          automacao: 'Automação',
          fluxos: 'Fluxos de conversa',
          configuracoes: 'Configurações',
          inbox: 'Inbox / Atendimento'
        };

        const label = permLabels[permKey] || permKey;
        const actionText = checkbox.checked ? 'concedida a' : 'removida de';
        showToast(`Permissão "${label}" ${actionText} ${member.name}.`);
      }
    }
  });
}

function toggleActionDropdown(memberId) {
  const dropdown = document.getElementById(`team-dropdown-${memberId}`);
  if (!dropdown) return;

  const isVisible = dropdown.classList.contains('show');
  closeAllActionDropdowns();

  if (!isVisible) {
    dropdown.classList.add('show');
    activeMemberMenuId = memberId;
  }
}

function closeAllActionDropdowns() {
  document.querySelectorAll('.team-action-dropdown').forEach(d => {
    d.classList.remove('show');
  });
  activeMemberMenuId = null;
}

/**
 * Setup modals: Add Member, Edit Member, Delete Member, New Department
 */
function setupModals() {
  // Form Add Member
  const formAdd = document.getElementById('form-add-team-member');
  if (formAdd) {
    formAdd.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('add-member-name');
      const emailInput = document.getElementById('add-member-email');
      const phoneInput = document.getElementById('add-member-phone');
      const roleInput = document.getElementById('add-member-role');
      const deptInput = document.getElementById('add-member-dept');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const role = roleInput ? roleInput.value.trim() : 'Atendente de Atendimento';
      const department = deptInput ? deptInput.value : 'Comercial & Vendas';

      if (!name || !email) {
        showToast('Preencha o nome e e-mail do colaborador.');
        return;
      }

      // Check if email already exists
      const exists = teamMembers.some(m => m.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        showToast('Já existe um membro cadastrado com este e-mail.');
        return;
      }

      // Read permissions checkboxes
      const permissions = {
        dashboard: !!document.getElementById('perm-add-dashboard')?.checked,
        contatos: !!document.getElementById('perm-add-contatos')?.checked,
        campanhas: !!document.getElementById('perm-add-campanhas')?.checked,
        transmissao: !!document.getElementById('perm-add-transmissao')?.checked,
        automacao: !!document.getElementById('perm-add-automacao')?.checked,
        fluxos: !!document.getElementById('perm-add-fluxos')?.checked,
        configuracoes: !!document.getElementById('perm-add-configuracoes')?.checked,
        inbox: !!document.getElementById('perm-add-inbox')?.checked
      };

      // Generate random avatar color
      const colors = ['#00A868', '#7C3AED', '#2563EB', '#0D9488', '#EA580C', '#E11D48'];
      const avatarBg = colors[Math.floor(Math.random() * colors.length)];
      const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

      const newMember = {
        id: 'member_' + Date.now(),
        name,
        email,
        phone,
        role,
        department,
        isOwner: false,
        status: 'online',
        avatarBg,
        avatarColor: '#FFFFFF',
        initials,
        permissions
      };

      teamMembers.push(newMember);
      saveTeamMembers();
      renderTeamTable();
      renderDepartmentsView();

      // Close modal & reset form
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      formAdd.reset();

      showToast(`Membro "${name}" cadastrado com sucesso! Convite de acesso enviado.`);
    });
  }

  // Form Edit Member
  const formEdit = document.getElementById('form-edit-team-member');
  if (formEdit) {
    formEdit.addEventListener('submit', (e) => {
      e.preventDefault();

      const idInput = document.getElementById('edit-member-id');
      const nameInput = document.getElementById('edit-member-name');
      const emailInput = document.getElementById('edit-member-email');
      const phoneInput = document.getElementById('edit-member-phone');
      const roleInput = document.getElementById('edit-member-role');
      const deptInput = document.getElementById('edit-member-dept');

      const memberId = idInput ? idInput.value : '';
      const member = teamMembers.find(m => m.id === memberId);
      if (!member) return;

      member.name = nameInput ? nameInput.value.trim() : member.name;
      member.email = emailInput ? emailInput.value.trim() : member.email;
      member.phone = phoneInput ? phoneInput.value.trim() : member.phone;
      member.role = roleInput ? roleInput.value.trim() : member.role;
      member.department = deptInput ? deptInput.value : member.department;
      member.initials = member.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

      if (!member.isOwner) {
        member.permissions = {
          dashboard: !!document.getElementById('perm-edit-dashboard')?.checked,
          contatos: !!document.getElementById('perm-edit-contatos')?.checked,
          campanhas: !!document.getElementById('perm-edit-campanhas')?.checked,
          transmissao: !!document.getElementById('perm-edit-transmissao')?.checked,
          automacao: !!document.getElementById('perm-edit-automacao')?.checked,
          fluxos: !!document.getElementById('perm-edit-fluxos')?.checked,
          configuracoes: !!document.getElementById('perm-edit-configuracoes')?.checked,
          inbox: !!document.getElementById('perm-edit-inbox')?.checked
        };
      }

      saveTeamMembers();
      renderTeamTable();
      renderDepartmentsView();

      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      showToast(`Dados de "${member.name}" atualizados com sucesso!`);
    });
  }

  // Confirm Delete Member
  const btnConfirmDelete = document.getElementById('btn-confirm-delete-member');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', () => {
      const idInput = document.getElementById('delete-member-id');
      const memberId = idInput ? idInput.value : '';
      const memberIndex = teamMembers.findIndex(m => m.id === memberId);

      if (memberIndex === -1) return;
      const member = teamMembers[memberIndex];

      if (member.isOwner) {
        showToast('Não é permitido remover o proprietário da conta.');
        return;
      }

      teamMembers.splice(memberIndex, 1);
      saveTeamMembers();
      renderTeamTable();
      renderDepartmentsView();

      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      showToast(`Membro "${member.name}" removido da equipe.`);
    });
  }

  // Form New Department
  const formDept = document.getElementById('form-new-department');
  if (formDept) {
    formDept.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('new-dept-name');
      const descInput = document.getElementById('new-dept-desc');
      const colorInput = document.getElementById('new-dept-color');

      const name = nameInput ? nameInput.value.trim() : '';
      const desc = descInput ? descInput.value.trim() : '';
      const color = colorInput ? colorInput.value : '#00A868';

      if (!name) {
        showToast('Informe o nome do departamento.');
        return;
      }

      const newDept = {
        id: 'dept_' + Date.now(),
        name,
        desc: desc || `Fila de atendimento para ${name}`,
        color
      };

      departments.push(newDept);
      saveDepartments();
      renderDepartmentsView();

      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      formDept.reset();
      showToast(`Departamento "${name}" criado com sucesso!`);
    });
  }

  // Form Edit Department
  const formEditDept = document.getElementById('form-edit-department');
  if (formEditDept) {
    formEditDept.addEventListener('submit', (e) => {
      e.preventDefault();
      const idInput = document.getElementById('edit-dept-id');
      const nameInput = document.getElementById('edit-dept-name');
      const descInput = document.getElementById('edit-dept-desc');
      const colorInput = document.getElementById('edit-dept-color');

      const deptId = idInput ? idInput.value : '';
      const dept = departments.find(d => d.id === deptId);
      if (!dept) return;

      const newName = nameInput ? nameInput.value.trim() : '';
      if (!newName) {
        showToast('Informe o nome do departamento.');
        return;
      }

      const oldName = dept.name;
      dept.name = newName;
      dept.desc = descInput ? descInput.value.trim() : dept.desc;
      dept.color = colorInput ? colorInput.value : dept.color;

      // Update members assigned to this department if name changed
      if (oldName && oldName !== newName) {
        let updatedMembers = false;
        teamMembers.forEach(m => {
          if (m.department === oldName) {
            m.department = newName;
            updatedMembers = true;
          }
        });
        if (updatedMembers) {
          saveTeamMembers();
          renderTeamTable();
        }
      }

      saveDepartments();
      renderDepartmentsView();

      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      showToast(`Departamento "${newName}" atualizado com sucesso!`);
    });
  }

  // Confirm Delete Department
  const btnConfirmDeleteDept = document.getElementById('btn-confirm-delete-department');
  if (btnConfirmDeleteDept) {
    btnConfirmDeleteDept.addEventListener('click', () => {
      const idInput = document.getElementById('delete-dept-id');
      const deptId = idInput ? idInput.value : '';
      const deptIndex = departments.findIndex(d => d.id === deptId);
      if (deptIndex === -1) return;

      const removedDept = departments[deptIndex];
      departments.splice(deptIndex, 1);
      saveDepartments();
      renderDepartmentsView();

      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
      showToast(`Departamento "${removedDept.name}" excluído.`);
    });
  }
}

/**
 * Setup permission presets in Add and Edit modals
 */
function setupPresets() {
  const setupPresetButtons = (prefix) => {
    const presetButtons = document.querySelectorAll(`[data-${prefix}-preset]`);
    presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const preset = btn.getAttribute(`data-${prefix}-preset`);
        applyPresetToModal(prefix, preset);
      });
    });
  };

  setupPresetButtons('add');
  setupPresetButtons('edit');
}

function applyPresetToModal(prefix, preset) {
  const permIds = ['dashboard', 'contatos', 'campanhas', 'transmissao', 'automacao', 'fluxos', 'configuracoes', 'inbox'];

  let checks = {};
  if (preset === 'atendente') {
    // Only live chat, contacts, dashboard
    checks = { dashboard: true, contatos: true, campanhas: false, transmissao: false, automacao: false, fluxos: false, configuracoes: false, inbox: true };
  } else if (preset === 'comercial') {
    // Dashboard, contacts, campaigns, transmission, inbox
    checks = { dashboard: true, contatos: true, campanhas: true, transmissao: true, automacao: false, fluxos: false, configuracoes: false, inbox: true };
  } else if (preset === 'admin') {
    // Everything
    checks = { dashboard: true, contatos: true, campanhas: true, transmissao: true, automacao: true, fluxos: true, configuracoes: true, inbox: true };
  } else if (preset === 'suporte') {
    // Dashboard, contacts, flows, inbox
    checks = { dashboard: true, contatos: true, campanhas: false, transmissao: false, automacao: false, fluxos: true, configuracoes: true, inbox: true };
  }

  permIds.forEach(id => {
    const el = document.getElementById(`perm-${prefix}-${id}`);
    if (el) {
      el.checked = !!checks[id];
    }
  });
}

/**
 * Open Edit Member modal and prefill data
 */
function openEditMemberModal(memberId) {
  const member = teamMembers.find(m => m.id === memberId);
  if (!member) return;

  const idInput = document.getElementById('edit-member-id');
  const nameInput = document.getElementById('edit-member-name');
  const emailInput = document.getElementById('edit-member-email');
  const phoneInput = document.getElementById('edit-member-phone');
  const roleInput = document.getElementById('edit-member-role');
  const deptInput = document.getElementById('edit-member-dept');
  const permBox = document.getElementById('edit-member-permissions-section');
  const ownerWarning = document.getElementById('edit-member-owner-notice');

  if (idInput) idInput.value = member.id;
  if (nameInput) nameInput.value = member.name;
  if (emailInput) emailInput.value = member.email;
  if (phoneInput) phoneInput.value = member.phone || '';
  if (roleInput) roleInput.value = member.role || '';
  if (deptInput) deptInput.value = member.department || 'Comercial & Vendas';

  const p = member.permissions || {};
  ['dashboard', 'contatos', 'campanhas', 'transmissao', 'automacao', 'fluxos', 'configuracoes', 'inbox'].forEach(key => {
    const check = document.getElementById(`perm-edit-${key}`);
    if (check) {
      check.checked = !!p[key];
      check.disabled = !!member.isOwner;
    }
  });

  if (ownerWarning) {
    ownerWarning.style.display = member.isOwner ? 'flex' : 'none';
  }

  if (window.openModal) {
    window.openModal('modal-edit-team-member');
  } else {
    document.getElementById('modal-edit-team-member')?.classList.add('open');
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Open Delete Member modal
 */
function openDeleteMemberModal(memberId) {
  const member = teamMembers.find(m => m.id === memberId);
  if (!member) return;

  if (member.isOwner) {
    showToast('Não é possível remover o proprietário da conta.');
    return;
  }

  const idInput = document.getElementById('delete-member-id');
  const nameSpan = document.getElementById('delete-member-target-name');

  if (idInput) idInput.value = member.id;
  if (nameSpan) nameSpan.textContent = member.name;

  if (window.openModal) {
    window.openModal('modal-delete-team-member');
  } else {
    document.getElementById('modal-delete-team-member')?.classList.add('open');
  }
}

/**
 * Open Edit Department modal and prefill data
 */
function openEditDepartmentModal(deptId) {
  const dept = departments.find(d => d.id === deptId);
  if (!dept) return;

  const idInput = document.getElementById('edit-dept-id');
  const nameInput = document.getElementById('edit-dept-name');
  const descInput = document.getElementById('edit-dept-desc');
  const colorInput = document.getElementById('edit-dept-color');

  if (idInput) idInput.value = dept.id;
  if (nameInput) nameInput.value = dept.name || '';
  if (descInput) descInput.value = dept.desc || '';
  if (colorInput) colorInput.value = dept.color || '#00A868';

  if (window.openModal) {
    window.openModal('modal-edit-department');
  } else {
    document.getElementById('modal-edit-department')?.classList.add('open');
  }

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Open Delete Department modal
 */
function openDeleteDepartmentModal(deptId) {
  const dept = departments.find(d => d.id === deptId);
  if (!dept) return;

  const idInput = document.getElementById('delete-dept-id');
  const nameSpan = document.getElementById('delete-dept-target-name');

  if (idInput) idInput.value = dept.id;
  if (nameSpan) nameSpan.textContent = dept.name;

  if (window.openModal) {
    window.openModal('modal-delete-department');
  } else {
    document.getElementById('modal-delete-department')?.classList.add('open');
  }
}

/**
 * Open modal to assign/link a member to a department
 */
function openAssignMemberDepartmentModal(memberId) {
  const member = teamMembers.find(m => m.id === memberId);
  if (!member) return;

  const existing = document.getElementById('modal-assign-member-dept');
  if (existing) existing.remove();

  let selectedDeptName = member.department || (departments[0]?.name || 'Atendimento Geral');

  const overlay = document.createElement('div');
  overlay.id = 'modal-assign-member-dept';
  overlay.className = 'modal-backdrop open';
  overlay.style.zIndex = '9999';

  overlay.innerHTML = `
    <div class="modal-dialog" style="max-width: 440px; padding: 24px; border-radius: 16px;">
      <div class="modal-header" style="margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(124, 58, 237, 0.12); color: #7C3AED; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i data-lucide="folder-kanban" style="width: 19px; height: 19px;"></i>
          </div>
          <div>
            <h3 class="modal-title" style="margin: 0; font-size: 15.5px; font-weight: 700; color: var(--text-main);">Vincular Departamento</h3>
            <p class="modal-header-sub" style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Escolha a fila de atendimento de <strong>${escapeHtml(member.name)}</strong></p>
          </div>
        </div>
        <button type="button" class="modal-close" id="btn-close-assign-dept-x" aria-label="Fechar">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 290px; overflow-y: auto;">
        ${departments.map(dept => {
          const isSelected = selectedDeptName === dept.name;
          return `
            <button
              type="button"
              class="assign-dept-option-btn"
              data-dept-name="${escapeHtml(dept.name)}"
              style="display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 11px 14px; border-radius: 11px; border: 1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}; background: ${isSelected ? 'rgba(0, 168, 104, 0.06)' : 'var(--bg-card)'}; cursor: pointer; text-align: left; transition: all 0.15s ease;"
            >
              <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${dept.color || '#00A868'}; flex-shrink: 0;"></span>
                <div style="min-width: 0;">
                  <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main);">${escapeHtml(dept.name)}</div>
                  <div style="font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(dept.desc || '')}</div>
                </div>
              </div>
              <span class="assign-dept-check-circle" style="width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}; background: ${isSelected ? 'var(--primary)' : 'transparent'}; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 11px;">
                ${isSelected ? '✓' : ''}
              </span>
            </button>
          `;
        }).join('')}
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 12px; border-top: 1px solid var(--border);">
        <button type="button" class="btn btn-secondary" id="btn-cancel-assign-dept">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btn-save-assign-dept">
          <i data-lucide="check" style="width: 14px; height: 14px;"></i>
          <span>Salvar Vínculo</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  if (window.lucide) window.lucide.createIcons();

  const closeModal = () => overlay.remove();

  overlay.querySelectorAll('.assign-dept-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedDeptName = btn.getAttribute('data-dept-name');
      overlay.querySelectorAll('.assign-dept-option-btn').forEach(b => {
        const active = b.getAttribute('data-dept-name') === selectedDeptName;
        b.style.borderColor = active ? 'var(--primary)' : 'var(--border)';
        b.style.background = active ? 'rgba(0, 168, 104, 0.06)' : 'var(--bg-card)';
        const circle = b.querySelector('.assign-dept-check-circle');
        if (circle) {
          circle.style.borderColor = active ? 'var(--primary)' : 'var(--border)';
          circle.style.background = active ? 'var(--primary)' : 'transparent';
          circle.textContent = active ? '✓' : '';
        }
      });
    });
  });

  overlay.querySelector('#btn-close-assign-dept-x')?.addEventListener('click', closeModal);
  overlay.querySelector('#btn-cancel-assign-dept')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  overlay.querySelector('#btn-save-assign-dept')?.addEventListener('click', () => {
    member.department = selectedDeptName;
    saveTeamMembers();
    renderTeamTable();
    renderDepartmentsView();
    closeModal();
    showToast(`${member.name} vinculado ao departamento "${selectedDeptName}"!`);
  });
}

/**
 * Open modal to link/unlink multiple team members to a department
 */
function openManageDepartmentMembersModal(deptId) {
  const dept = departments.find(d => d.id === deptId);
  if (!dept) return;

  const existing = document.getElementById('modal-manage-dept-members');
  if (existing) existing.remove();

  const selectedMemberIds = new Set(
    teamMembers.filter(m => m.department === dept.name || m.department === dept.id).map(m => m.id)
  );

  const overlay = document.createElement('div');
  overlay.id = 'modal-manage-dept-members';
  overlay.className = 'modal-backdrop open';
  overlay.style.zIndex = '9999';

  overlay.innerHTML = `
    <div class="modal-dialog" style="max-width: 460px; padding: 24px; border-radius: 16px;">
      <div class="modal-header" style="margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: ${dept.color || '#00A868'}18; color: ${dept.color || '#00A868'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i data-lucide="users" style="width: 19px; height: 19px;"></i>
          </div>
          <div>
            <h3 class="modal-title" style="margin: 0; font-size: 15.5px; font-weight: 700; color: var(--text-main);">Vincular Membros</h3>
            <p class="modal-header-sub" style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Departamento: <strong>${escapeHtml(dept.name)}</strong></p>
          </div>
        </div>
        <button type="button" class="modal-close" id="btn-close-manage-dept-members-x" aria-label="Fechar">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 310px; overflow-y: auto;">
        ${teamMembers.map(m => {
          const isChecked = selectedMemberIds.has(m.id);
          return `
            <label
              class="dept-member-check-row"
              data-member-id="${m.id}"
              style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 11px; border: 1.5px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}; background: ${isChecked ? 'rgba(0, 168, 104, 0.06)' : 'var(--bg-card)'}; cursor: pointer; transition: all 0.15s ease;"
            >
              <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${m.avatarBg || '#00A868'}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; flex-shrink: 0;">
                  ${escapeHtml(m.initials || m.name.substring(0, 2).toUpperCase())}
                </div>
                <div style="min-width: 0;">
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-main);">${escapeHtml(m.name)}</div>
                  <div style="font-size: 11.5px; color: var(--text-muted);">Atual: ${escapeHtml(m.department || 'Sem departamento')}</div>
                </div>
              </div>
              <input type="checkbox" class="dept-member-checkbox" value="${m.id}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer;">
            </label>
          `;
        }).join('')}
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 12px; border-top: 1px solid var(--border);">
        <button type="button" class="btn btn-secondary" id="btn-cancel-manage-dept-members">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btn-save-manage-dept-members">
          <i data-lucide="check" style="width: 14px; height: 14px;"></i>
          <span>Salvar Membros</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  if (window.lucide) window.lucide.createIcons();

  const closeModal = () => overlay.remove();

  overlay.querySelectorAll('.dept-member-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const row = cb.closest('.dept-member-check-row');
      if (cb.checked) {
        selectedMemberIds.add(cb.value);
        if (row) {
          row.style.borderColor = 'var(--primary)';
          row.style.background = 'rgba(0, 168, 104, 0.06)';
        }
      } else {
        selectedMemberIds.delete(cb.value);
        if (row) {
          row.style.borderColor = 'var(--border)';
          row.style.background = 'var(--bg-card)';
        }
      }
    });
  });

  overlay.querySelector('#btn-close-manage-dept-members-x')?.addEventListener('click', closeModal);
  overlay.querySelector('#btn-cancel-manage-dept-members')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  overlay.querySelector('#btn-save-manage-dept-members')?.addEventListener('click', () => {
    const fallbackDept = departments.find(d => d.id !== dept.id)?.name || 'Atendimento Geral';
    teamMembers.forEach(m => {
      if (selectedMemberIds.has(m.id)) {
        m.department = dept.name;
      } else if (m.department === dept.name || m.department === dept.id) {
        m.department = fallbackDept;
      }
    });

    saveTeamMembers();
    renderTeamTable();
    renderDepartmentsView();
    closeModal();
    showToast(`Membros do departamento "${dept.name}" atualizados!`);
  });
}

/**
 * Helper: Escape HTML strings
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
