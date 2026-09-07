// Settings View Module (Tabs & Interactions)

export function initSettingsView() {
  setupSettingsTabs();
  setupSaveButtons();
  setupBillingActions();

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

