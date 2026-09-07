// Notifications Dropdown Module
import { openSettingsTab } from './settings.js';

export function initNotifications() {
  const notifBtn = document.getElementById('topbar-notifications-btn');
  const dropdown = document.getElementById('notifications-dropdown-menu');
  const markReadBtn = document.getElementById('notif-mark-all-read');
  const viewAllBtn = document.getElementById('btn-notif-view-all');
  const unreadCountBadge = document.getElementById('notif-unread-count');

  if (!notifBtn || !dropdown) return;

  // Toggle Dropdown
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('show');
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      closeDropdown();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown.classList.contains('show')) {
      closeDropdown();
    }
  });

  // Mark all as read
  if (markReadBtn) {
    markReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const items = dropdown.querySelectorAll('.notif-item.unread');
      items.forEach(item => {
        item.classList.remove('unread');
        const dot = item.querySelector('.notif-unread-dot');
        if (dot) dot.remove();
      });

      // Remove topbar indicator & count
      notifBtn.classList.remove('has-indicator');
      if (unreadCountBadge) {
        unreadCountBadge.textContent = '0';
        unreadCountBadge.style.display = 'none';
      }
    });
  }

  // Click on single notification item
  const notifItems = dropdown.querySelectorAll('.notif-item');
  notifItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.classList.contains('unread')) {
        item.classList.remove('unread');
        const dot = item.querySelector('.notif-unread-dot');
        if (dot) dot.remove();

        const remaining = dropdown.querySelectorAll('.notif-item.unread').length;
        if (unreadCountBadge) {
          unreadCountBadge.textContent = remaining;
          if (remaining === 0) unreadCountBadge.style.display = 'none';
        }
        if (remaining === 0) {
          notifBtn.classList.remove('has-indicator');
        }
      }
      closeDropdown();
    });
  });

  // View All action (redirect to Settings -> Notificações)
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeDropdown();
      if (typeof openSettingsTab === 'function') {
        openSettingsTab('notificacoes');
      } else if (window.openSettingsTab) {
        window.openSettingsTab('notificacoes');
      }
    });
  }

  function openDropdown() {
    dropdown.classList.add('show');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function closeDropdown() {
    dropdown.classList.remove('show');
  }
}
