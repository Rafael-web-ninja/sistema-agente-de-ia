// Dark / Light Theme Manager

export function initTheme() {
  const savedTheme = localStorage.getItem('zapchat_theme') || 'light';
  applyTheme(savedTheme);

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem('zapchat_theme', nextTheme);
    });
  }
}

export function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  const iconContainer = document.getElementById('theme-toggle-icon');
  if (iconContainer) {
    iconContainer.innerHTML = theme === 'dark' 
      ? '<i data-lucide="sun" style="width: 18px; height: 18px;"></i>' 
      : '<i data-lucide="moon" style="width: 18px; height: 18px;"></i>';
  }

  if (window.lucide) window.lucide.createIcons();
}
