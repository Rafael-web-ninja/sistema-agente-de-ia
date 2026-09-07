import { openSettingsTab, switchSettingsTab } from './settings.js';

let currentView = 'dashboard';

export function initNavigation() {
  // Global delegated navigation handler (handles dynamically rendered icons, SVG children, and topbar help button)
  document.addEventListener('click', (e) => {
    // Topbar help button or any explicit support trigger
    const helpBtn = e.target.closest('#topbar-help-btn, [data-target="suporte"], a[href="#suporte"]');
    if (helpBtn) {
      e.preventDefault();
      switchView('suporte');
      return;
    }

    // Direct navigation to settings subtabs (Ver planos -> faturamento, Minha conta -> perfil)
    const settingsSubTabTrigger = e.target.closest('[data-settings-tab-target], .promo-plan-btn, .user-profile-btn, #topbar-user-profile-btn');
    if (settingsSubTabTrigger) {
      e.preventDefault();
      let tab = settingsSubTabTrigger.getAttribute('data-settings-tab-target');
      if (!tab) {
        if (settingsSubTabTrigger.classList.contains('promo-plan-btn') || settingsSubTabTrigger.id === 'btn-promo-ver-planos') {
          tab = 'faturamento';
        } else {
          tab = 'perfil';
        }
      }
      openSettingsTab(tab);
      return;
    }

    // General navigation triggers (.nav-link, .mobile-nav-item, .brand-logo, button[data-target])
    const navTrigger = e.target.closest('.nav-link[data-target], .mobile-nav-item[data-target], .brand-logo[data-target], button[data-target], [data-nav-target]');
    if (navTrigger) {
      // Don't intercept modals or sub-tabs
      if (navTrigger.hasAttribute('data-modal-target') || navTrigger.hasAttribute('data-settings-tab')) return;
      const targetView = navTrigger.getAttribute('data-nav-target') || navTrigger.getAttribute('data-target');
      if (targetView && ['dashboard', 'agentes', 'conversas', 'canais', 'leads', 'configuracoes', 'suporte', 'editar-agente'].includes(targetView)) {
        e.preventDefault();
        switchView(targetView);
      }
    }
  });

  // Setup mobile off-canvas drawer
  setupMobileDrawer();

  // Expose switchView globally immediately
  window.switchView = switchView;

  function handleHashRoute(rawHash, updateHistory = false) {
    const hash = rawHash.replace('#', '');
    if (['dashboard', 'agentes', 'conversas', 'canais', 'leads', 'configuracoes', 'suporte', 'editar-agente'].includes(hash)) {
      switchView(hash, updateHistory);
    } else if (hash === 'planos' || hash === 'faturamento') {
      openSettingsTab('faturamento');
    } else if (hash === 'perfil' || hash === 'minha-conta') {
      openSettingsTab('perfil');
    } else {
      switchView('dashboard', updateHistory);
    }
  }

  // Check URL hash or default
  handleHashRoute(window.location.hash);

  // Handle browser back/forward and hash changes
  window.addEventListener('popstate', () => {
    handleHashRoute(window.location.hash, false);
  });

  window.addEventListener('hashchange', () => {
    handleHashRoute(window.location.hash, false);
  });

  // Modal triggers
  setupModals();
}

function setupMobileDrawer() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('sidebar-close-btn');
  const backdrop = document.getElementById('sidebar-backdrop');
  const sidebar = document.getElementById('app-sidebar');

  function openSidebar() {
    sidebar?.classList.add('sidebar-open');
    backdrop?.classList.add('active');
    toggleBtn?.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('sidebar-open');
    backdrop?.classList.remove('active');
    toggleBtn?.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  function toggleSidebar() {
    if (sidebar?.classList.contains('sidebar-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  toggleBtn?.addEventListener('click', toggleSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);
}

export function switchView(viewId, updateHistory = true) {
  currentView = viewId;

  // Update Nav Items
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('.nav-link');
    if (link && link.getAttribute('data-target') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Mobile Bottom Nav Items
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    if (item.getAttribute('data-target') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Close mobile sidebar if open
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar?.classList.remove('sidebar-open');
  backdrop?.classList.remove('active');
  document.body.style.overflow = '';

  // Reset active chat mode on mobile if user explicitly navigates to conversas
  if (viewId === 'conversas') {
    const layout = document.querySelector('.conversas-simplified-layout');
    if (layout && window.innerWidth <= 900) {
      layout.classList.remove('in-active-chat');
    }
  }

  // Update Views
  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel.id === `view-${viewId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update URL hash
  if (updateHistory) {
    window.location.hash = viewId;
  }

  // Scroll to top
  const mainArea = document.querySelector('.app-main');
  if (mainArea) mainArea.scrollTop = 0;

  // Trigger view-specific re-renders if needed
  window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: viewId } }));
}

function setupModals() {
  // Open buttons
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-target]');
    if (trigger) {
      const modalId = trigger.getAttribute('data-modal-target');
      openModal(modalId);
    }

    // Close buttons
    const closeBtn = e.target.closest('.modal-close, [data-modal-close]');
    if (closeBtn) {
      closeAllModals();
    }

    // Click outside backdrop
    if (e.target.classList.contains('modal-backdrop')) {
      closeAllModals();
    }
  });

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
  }
}

export function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.classList.remove('open');
  });
}

window.openModal = openModal;
window.closeAllModals = closeAllModals;
