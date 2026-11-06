// Settings View Module (Tabs & Interactions)
import { initTeamSettings, renderTeamTable, renderDepartmentsView } from './team.js';

export function initSettingsView() {
  setupSettingsTabs();
  setupSaveButtons();
  setupBillingActions();
  setupIntegrationsTab();
  initTeamSettings();

  // Expose globally for cross-module or inline access
  window.switchSettingsTab = switchSettingsTab;
  window.openSettingsTab = openSettingsTab;
}

/**
 * Tab switching logic for settings sub-panes
 */
export function switchSettingsTab(tabId) {
  const tabButtons = document.querySelectorAll('.settings-nav-btn[data-settings-tab]');
  const panels = document.querySelectorAll('.settings-pane');

  // Update button active state
  tabButtons.forEach(b => {
    if (b.getAttribute('data-settings-tab') === tabId) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  // Update pane active state
  panels.forEach(pane => {
    if (pane.id === `settings-pane-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // If switching to equipe, ensure table & icons are fresh
  if (tabId === 'equipe') {
    renderTeamTable();
    renderDepartmentsView();
  }

  // Refresh lucide icons in newly visible panel
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Open Settings view and activate a specific tab (e.g. 'perfil', 'faturamento', 'notificacoes')
 */
export function openSettingsTab(tabId) {
  if (window.switchView) {
    window.switchView('configuracoes');
  }
  switchSettingsTab(tabId);
}

/**
 * Tab switching event bindings
 */
function setupSettingsTabs() {
  const tabButtons = document.querySelectorAll('.settings-nav-btn[data-settings-tab]');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = btn.getAttribute('data-settings-tab');
      switchSettingsTab(tabId);
    });
  });
}

/**
 * Save configuration forms
 */
function setupSaveButtons() {
  const saveBtns = document.querySelectorAll('.btn-save-settings');
  saveBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Salvo com sucesso!';
      showToast('Configurações salvas com sucesso!');
      if (window.lucide) window.lucide.createIcons();

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        if (window.lucide) window.lucide.createIcons();
      }, 2000);
    });
  });
}

/**
 * Global Toast feedback
 */
export function showToast(message) {
  let toast = document.getElementById('settings-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'settings-toast';
    toast.className = 'settings-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i data-lucide="check-circle-2"></i> <span>${message}</span>`;
  if (window.lucide) window.lucide.createIcons();

  toast.classList.add('show');

  if (toast._timeout) clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/**
 * Setup Plan & Billing actions
 */
function setupBillingActions() {
  const formBuy = document.getElementById('form-buy-messages');
  if (formBuy) {
    formBuy.addEventListener('submit', (e) => {
      e.preventDefault();
      const select = document.getElementById('select-extra-package');
      const selectedVal = select ? select.options[select.selectedIndex].text : 'Pacote de mensagens';

      // Close modal
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));

      showToast(`Compra confirmada! ${selectedVal} adicionado.`);
    });
  }

  const btnUpgrade = document.getElementById('btn-upgrade-plan');
  if (btnUpgrade) {
    btnUpgrade.addEventListener('click', () => {
      showToast('Opções de Upgrade: Você já está no Plano Pro Business!');
    });
  }

  const btnManage = document.getElementById('btn-manage-sub');
  if (btnManage) {
    btnManage.addEventListener('click', () => {
      showToast('Portal de cobrança e assinatura aberto.');
    });
  }

  const btnChangeCard = document.getElementById('btn-change-card');
  if (btnChangeCard) {
    btnChangeCard.addEventListener('click', () => {
      showToast('Dados do cartão prontos para atualização.');
    });
  }
}

/**
 * Setup Integrations tab (OpenAI, ElevenLabs, Gemini, Zapier, API, RD Station)
 */
function setupIntegrationsTab() {
  const providers = ['openai', 'elevenlabs', 'gemini', 'rdstation'];
  const providerLabels = {
    openai: 'OpenAI',
    elevenlabs: 'ElevenLabs',
    gemini: 'Google Gemini',
    rdstation: 'RD Station'
  };

  function updateProviderBadge(provider, hasKey) {
    const badge = document.getElementById(`badge-status-${provider}`);
    const saveBtn = document.getElementById(`btn-save-key-${provider}`);
    if (badge) {
      if (hasKey) {
        badge.textContent = 'Conectado';
        badge.classList.add('connected');
      } else {
        badge.textContent = 'Não configurado';
        badge.classList.remove('connected');
      }
    }
    if (saveBtn) {
      saveBtn.textContent = hasKey ? 'Recarregar' : 'Salvar';
    }
  }

  // Load saved keys from localStorage
  providers.forEach(p => {
    const input = document.getElementById(`input-api-key-${p}`);
    if (!input) return;
    const saved = localStorage.getItem(`zapchat_integration_key_${p}`);
    if (saved !== null) {
      input.value = saved;
    }
    updateProviderBadge(p, Boolean(input.value.trim()));
  });

  // Toggle visibility (eye / eye-off)
  document.querySelectorAll('.btn-toggle-key-vis').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" style="width:15px;height:15px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    });
  });

  // Save / Reload key
  document.querySelectorAll('.btn-save-integration-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-provider');
      const input = document.getElementById(`input-api-key-${provider}`);
      if (!input) return;
      const val = input.value.trim();
      if (!val) {
        showToast(`Insira uma chave válida para ${providerLabels[provider] || provider}.`);
        input.focus();
        return;
      }
      localStorage.setItem(`zapchat_integration_key_${provider}`, val);
      updateProviderBadge(provider, true);
      showToast(`Chave da ${providerLabels[provider] || provider} salva e conectada com sucesso!`);
    });
  });

  // Delete key
  document.querySelectorAll('.btn-delete-integration-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-provider');
      const input = document.getElementById(`input-api-key-${provider}`);
      if (input) input.value = '';
      localStorage.setItem(`zapchat_integration_key_${provider}`, '');
      updateProviderBadge(provider, false);
      showToast(`Chave da ${providerLabels[provider] || provider} removida.`);
    });
  });

  // Copy token buttons
  document.querySelectorAll('.btn-copy-integration-token').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const codeEl = document.getElementById(targetId);
      if (!codeEl) return;
      const text = codeEl.textContent.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
      showToast('Chave API copiada para a área de transferência!');
    });
  });

  // Regenerate token buttons
  document.querySelectorAll('.btn-regenerate-token').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-token-target');
      const codeEl = document.getElementById(targetId);
      if (!codeEl) return;
      const randHex = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newToken = `${randHex(8)}-${randHex(4)}-4${randHex(3)}-${randHex(4)}-${randHex(12)}`;
      codeEl.textContent = newToken;
      showToast('Nova chave API gerada com sucesso!');
    });
  });
}

