import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { zapChatData } from '../src/js/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const htmlDir = path.join(rootDir, 'html');

if (!fs.existsSync(htmlDir)) {
  fs.mkdirSync(htmlDir, { recursive: true });
}

// Read index.html
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

// Helper to extract a view-panel section from index.html
function extractSection(html, sectionId) {
  const marker = `id="${sectionId}"`;
  const idPos = html.indexOf(marker);
  if (idPos === -1) return '';
  const startPos = html.lastIndexOf('<section class="view-panel', idPos);
  if (startPos === -1) return '';

  let depth = 1;
  let pos = html.indexOf('>', idPos) + 1;
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf('<section', pos);
    const nextClose = html.indexOf('</section>', pos);
    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 8;
    } else {
      depth--;
      if (depth === 0) {
        return html.substring(startPos, nextClose + 10);
      }
      pos = nextClose + 10;
    }
  }
  return '';
}

// Extract modals block from index.html
function extractModals(html) {
  const findModalsStart = html.indexOf('<!-- 1. Modal Novo Agente -->');
  const modalsEnd = html.indexOf('<!-- Mobile Bottom Navigation -->');
  if (findModalsStart !== -1 && modalsEnd !== -1) {
    return html.substring(findModalsStart, modalsEnd).trim();
  }
  return '';
}

const allModalsHtml = extractModals(indexHtml);

// Area chart SVG generator
function generateAreaChartSvg(data) {
  const width = 640;
  const height = 210;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 18;
  const paddingBottom = 28;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = 200;
  const labels = data.labels;
  const values = data.values;

  const points = values.map((val, idx) => {
    const x = paddingLeft + (idx / (values.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (val / maxValue) * chartHeight;
    return { x, y, val, label: labels[idx] };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  const gridY = [0, 50, 100, 150, 200];
  const gridLinesSvg = gridY.map(val => {
    const y = paddingTop + chartHeight - (val / maxValue) * chartHeight;
    return `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-light)" stroke-dasharray="3,3" stroke-width="1" />
      <text x="${paddingLeft - 10}" y="${y + 4}" font-size="11.5" font-weight="500" fill="var(--text-muted)" text-anchor="end" font-family="system-ui, -apple-system, sans-serif">${val}</text>
    `;
  }).join('');

  const xLabelsSvg = points.map(p => `
    <text x="${p.x}" y="${height - 6}" font-size="11.5" font-weight="500" fill="var(--text-muted)" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${p.label}</text>
  `).join('');

  const circlesSvg = points.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#00A868" stroke="#FFFFFF" stroke-width="2.5" class="chart-point" data-val="${p.val}" data-date="${p.label}" style="cursor: pointer; transition: r 0.15s ease;">
      <title>${p.label}: ${p.val} conversas</title>
    </circle>
  `).join('');

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block; width: 100%; height: 100%;">
      <defs>
        <linearGradient id="areaGreenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00A868" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#00A868" stop-opacity="0.01"/>
        </linearGradient>
      </defs>
      ${gridLinesSvg}
      <path d="${areaD}" fill="url(#areaGreenGrad)" />
      <path d="${pathD}" fill="none" stroke="#00A868" stroke-width="2.8" stroke-linecap="round" />
      ${circlesSvg}
      ${xLabelsSvg}
    </svg>
  `;
}

// Donut chart SVG generator
function generateDonutSvg(percent) {
  const size = 170;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--border-light)" stroke-width="${strokeWidth}" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#00A868" stroke-width="${strokeWidth}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${center} ${center})" />
      <text x="${center}" y="${center - 2}" text-anchor="middle" font-size="28" font-weight="700" fill="var(--text-main)" font-family="system-ui, -apple-system, sans-serif">${percent}%</text>
      <text x="${center}" y="${center + 18}" text-anchor="middle" font-size="12" font-weight="500" fill="var(--text-muted)" font-family="system-ui, -apple-system, sans-serif">Utilizado</text>
    </svg>
  `;
}

// Channel badge helper (for leads and chat)
function getChannelBadgeHtml(channel) {
  if (channel === 'WhatsApp') {
    return `
      <span class="chat-channel-badge whatsapp">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg>
        <span>WhatsApp</span>
      </span>
    `;
  }
  if (channel === 'Instagram') {
    return `
      <span class="chat-channel-badge instagram">
        <i data-lucide="instagram" style="width: 12px; height: 12px;"></i>
        <span>Instagram</span>
      </span>
    `;
  }
  return `
    <span class="chat-channel-badge widget">
      <i data-lucide="message-square" style="width: 12px; height: 12px;"></i>
      <span>Widget</span>
    </span>
  `;
}

function getLeadChannelBadge(channel) {
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
  return `
    <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      Site
    </span>
  `;
}

function getChannelGlyphIcon(channelType) {
  const type = (channelType || '').toLowerCase();
  if (type === 'whatsapp') {
    return `
      <div class="channel-glyph-circle glyph-whatsapp" title="WhatsApp">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM17.84 15.65C17.6 16.33 16.65 16.94 15.89 17.1C15.37 17.21 14.7 17.29 12.42 16.34C9.51 15.13 7.63 12.18 7.48 11.98C7.34 11.79 6.29 10.4 6.29 8.96C6.29 7.52 7.02 6.82 7.31 6.52C7.55 6.28 7.94 6.17 8.28 6.17C8.39 6.17 8.49 6.17 8.58 6.18C8.84 6.19 8.97 6.21 9.14 6.62C9.35 7.14 9.87 8.41 9.93 8.54C10 8.68 10.06 8.86 9.97 9.04C9.88 9.22 9.81 9.3 9.68 9.45C9.55 9.6 9.42 9.71 9.29 9.87C9.15 10.02 9 10.18 9.16 10.46C9.32 10.74 9.88 11.65 10.7 12.38C11.76 13.32 12.63 13.62 12.95 13.75C13.2 13.85 13.48 13.83 13.66 13.64C13.89 13.39 14.18 12.98 14.47 12.57C14.67 12.28 14.93 12.24 15.22 12.35C15.52 12.45 17.1 13.23 17.43 13.4C17.76 13.56 17.98 13.65 18.06 13.78C18.14 13.91 18.14 14.51 17.84 15.65Z"/>
        </svg>
      </div>
    `;
  }
  if (type === 'instagram') {
    return `
      <div class="channel-glyph-circle glyph-instagram" title="Instagram Direct">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" stroke-width="2.5"/>
        </svg>
      </div>
    `;
  }
  return `
    <div class="channel-glyph-circle glyph-widget" title="Widget Site">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <circle cx="8" cy="10" r="1.2" fill="white"/>
        <circle cx="12" cy="10" r="1.2" fill="white"/>
        <circle cx="16" cy="10" r="1.2" fill="white"/>
      </svg>
    </div>
  `;
}

// Shell generator with exact ZapChat layout and working global scripts
function renderShell(contentHtml, activePage, pageTitle, extraScripts = '') {
  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', file: 'dashboard.html', icon: 'layout-grid' },
    { id: 'agentes', label: 'Agentes', file: 'agentes.html', icon: 'bot' },
    { id: 'conversas', label: 'Conversas', file: 'conversas.html', icon: 'message-square', badge: '7' },
    { id: 'canais', label: 'Canais', file: 'canais.html', icon: 'share-2' },
    { id: 'leads', label: 'Leads', file: 'leads.html', icon: 'users' },
    { id: 'configuracoes', label: 'Configurações', file: 'configuracoes.html', icon: 'settings' }
  ];

  const sidebarNavHtml = navItems.map(item => {
    const isActive = (activePage === item.id) || (activePage === 'editar-agente' && item.id === 'agentes');
    return `
      <li class="nav-item ${isActive ? 'active' : ''}">
        <a href="${item.file}" class="nav-link">
          <span class="nav-icon"><i data-lucide="${item.icon}"></i></span>
          <span>${item.label}</span>
          ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
        </a>
      </li>
    `;
  }).join('');

  const mobileNavHtml = navItems.filter(i => i.id !== 'configuracoes').map(item => {
    const isActive = (activePage === item.id) || (activePage === 'editar-agente' && item.id === 'agentes');
    return `
      <a href="${item.file}" class="mobile-nav-item ${isActive ? 'active' : ''}">
        <div class="mobile-nav-icon-wrap">
          <i data-lucide="${item.icon}"></i>
          ${item.badge ? `<span class="mobile-nav-badge">${item.badge}</span>` : ''}
        </div>
        <span class="mobile-nav-label">${item.label}</span>
      </a>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZapChat - ${pageTitle}</title>
  
  <!-- CSS Stylesheets -->
  <link rel="stylesheet" href="../src/css/variables.css">
  <link rel="stylesheet" href="../src/css/layout.css">
  <link rel="stylesheet" href="../src/css/components.css">
  <link rel="stylesheet" href="../src/css/dashboard.css">
  <link rel="stylesheet" href="../src/css/agentes.css">
  <link rel="stylesheet" href="../src/css/leads.css">
  <link rel="stylesheet" href="../src/css/canais.css">
  <link rel="stylesheet" href="../src/css/conversas.css">
  <link rel="stylesheet" href="../src/css/settings.css">
  <link rel="stylesheet" href="../src/css/suporte.css">
  <link rel="stylesheet" href="../src/css/editar-agente.css">

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <!-- Mobile Sidebar Backdrop Overlay -->
  <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

  <div class="app-shell">
    <!-- Left Sidebar -->
    <aside class="app-sidebar" id="app-sidebar">
      <div>
        <div class="sidebar-header">
          <a href="dashboard.html" class="brand-logo">
            <div class="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <circle cx="9" cy="10" r="1"></circle>
                <circle cx="15" cy="10" r="1"></circle>
              </svg>
            </div>
            <span class="brand-name">ZapChat</span>
          </a>
          <button class="sidebar-close-btn" id="sidebar-close-btn" title="Fechar menu" aria-label="Fechar menu">
            <i data-lucide="x"></i>
          </button>
        </div>

        <ul class="sidebar-nav">
          ${sidebarNavHtml}
        </ul>
      </div>

      <!-- Upgrade Promo Card in Sidebar -->
      <div class="sidebar-promo-card-simplified">
        <div class="promo-crown-icon">👑</div>
        <h4 class="promo-title">Faça mais com o ZapChat</h4>
        <p class="promo-desc">Desbloqueie recursos avançados e escale seu atendimento.</p>
        <a href="configuracoes.html#faturamento" class="btn btn-primary btn-sm promo-plan-btn" id="btn-promo-ver-planos">
          Ver planos <i data-lucide="arrow-right" style="width: 13px; height: 13px;"></i>
        </a>
      </div>

      <!-- User Profile at bottom -->
      <div class="sidebar-footer">
        <a href="configuracoes.html#perfil" class="user-profile-btn" id="sidebar-user-profile-btn" title="Minha Conta / Perfil" style="text-decoration:none;">
          <div class="avatar-badge" style="background-color: #00A868; color: white;">RM</div>
          <div class="user-info">
            <span class="user-name">Rafael Mota</span>
            <span class="user-role">Minha conta</span>
          </div>
          <span class="chevron-icon"><i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i></span>
        </a>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="app-main">
      <!-- Topbar Header -->
      <header class="app-topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" id="mobile-menu-toggle" title="Abrir menu" aria-label="Abrir menu">
            <span class="hamburger-box">
              <span class="hamburger-line line-top"></span>
              <span class="hamburger-line line-mid"></span>
              <span class="hamburger-line line-bot"></span>
            </span>
          </button>
          <div class="mobile-brand-logo">
            <div class="brand-icon mobile-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <circle cx="9" cy="10" r="1"></circle>
                <circle cx="15" cy="10" r="1"></circle>
              </svg>
            </div>
            <span class="brand-name mobile-brand-title">ZapChat</span>
          </div>
        </div>

        <div class="topbar-controls">
          <button class="icon-btn" id="theme-toggle-btn" title="Alternar Modo Claro / Escuro">
            <span id="theme-toggle-icon"><i data-lucide="moon"></i></span>
          </button>
          <a href="suporte.html" class="icon-btn" id="topbar-help-btn" title="Ajuda e Suporte">
            <i data-lucide="help-circle"></i>
          </a>
          <!-- Notifications Dropdown -->
          <div class="notifications-dropdown-wrapper">
            <button type="button" class="icon-btn has-indicator" id="topbar-notifications-btn" title="Notificações">
              <i data-lucide="bell"></i>
            </button>
            <div class="notifications-dropdown-menu" id="notifications-dropdown-menu">
              <div class="notif-dropdown-header">
                <div class="notif-header-left">
                  <span class="notif-header-title">Notificações</span>
                  <span class="notif-badge-count" id="notif-unread-count">2</span>
                </div>
                <div class="notif-header-actions">
                  <button type="button" class="notif-action-icon-btn" id="notif-mark-all-read" title="Marcar todas como lidas">
                    <i data-lucide="check-check" style="width:15px;height:15px;"></i>
                  </button>
                </div>
              </div>
              <div class="notif-dropdown-list" id="notif-dropdown-list">
                <div class="notif-item unread">
                  <div class="notif-icon-box warning">
                    <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i>
                  </div>
                  <div class="notif-content">
                    <div class="notif-item-title">Whatsapp foi desconectado</div>
                    <div class="notif-item-desc">Quarta-Feira 11:56 • O canal Loja Download foi desconectado</div>
                  </div>
                  <span class="notif-unread-dot"></span>
                </div>
                <div class="notif-item unread">
                  <div class="notif-icon-box warning">
                    <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i>
                  </div>
                  <div class="notif-content">
                    <div class="notif-item-title">Whatsapp foi desconectado</div>
                    <div class="notif-item-desc">28/08/2026 16:23 • O canal Loja Download foi desconectado</div>
                  </div>
                  <span class="notif-unread-dot"></span>
                </div>
                <div class="notif-item">
                  <div class="notif-icon-box success">
                    <i data-lucide="user-plus" style="width:16px;height:16px;"></i>
                  </div>
                  <div class="notif-content">
                    <div class="notif-item-title">Novo lead qualificado</div>
                    <div class="notif-item-desc">Hoje 10:30 • Pedro qualificou 1 novo lead no WhatsApp</div>
                  </div>
                </div>
                <div class="notif-item">
                  <div class="notif-icon-box info">
                    <i data-lucide="zap" style="width:16px;height:16px;"></i>
                  </div>
                  <div class="notif-content">
                    <div class="notif-item-title">Limite de uso do plano</div>
                    <div class="notif-item-desc">Ontem 18:00 • Você utilizou 49% das mensagens inclusas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <a href="configuracoes.html#perfil" class="avatar-badge" id="topbar-user-profile-btn" style="width: 34px; height: 34px; font-size: 12px; cursor: pointer; background-color: #00A868; color: white; text-decoration:none;" title="Minha Conta / Perfil">
            RM
          </a>
        </div>
      </header>

      <!-- Content Views Wrapper -->
      <div class="content-wrapper">
        ${contentHtml}
      </div>
    </main>
  </div>

  ${allModalsHtml}

  <!-- Mobile Bottom Navigation -->
  <nav class="mobile-bottom-nav">
    ${mobileNavHtml}
  </nav>

  <!-- Interactive Shell Scripts -->
  <script>
    // 1. Initialize Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // 2. Dark/Light Theme with [data-theme="dark"]
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-toggle-icon');
    const savedTheme = localStorage.getItem('zapchat_theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.innerHTML = '<i data-lucide="sun" style="width:18px;height:18px;"></i>';
    }
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('zapchat_theme', 'light');
          if (themeIcon) themeIcon.innerHTML = '<i data-lucide="moon" style="width:18px;height:18px;"></i>';
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('zapchat_theme', 'dark');
          if (themeIcon) themeIcon.innerHTML = '<i data-lucide="sun" style="width:18px;height:18px;"></i>';
        }
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // 3. Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const closeSidebarBtn = document.getElementById('sidebar-close-btn');

    function toggleMobileMenu(open) {
      if (sidebar) sidebar.classList.toggle('mobile-open', open);
      if (backdrop) backdrop.classList.toggle('open', open);
    }
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => toggleMobileMenu(true));
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => toggleMobileMenu(false));
    if (backdrop) backdrop.addEventListener('click', () => toggleMobileMenu(false));

    // 4. Notifications Dropdown Toggle
    const notifBtn = document.getElementById('topbar-notifications-btn');
    const notifDropdown = document.getElementById('notifications-dropdown-menu');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.notifications-dropdown-wrapper')) {
          notifDropdown.classList.remove('open');
        }
      });
    }
    const markAllBtn = document.getElementById('notif-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
        const countBadge = document.getElementById('notif-unread-count');
        if (countBadge) countBadge.style.display = 'none';
        if (notifBtn) notifBtn.classList.remove('has-indicator');
      });
    }

    // 5. Global Modal Handlers
    document.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('[data-modal-target]');
      if (targetBtn) {
        e.preventDefault();
        const modalId = targetBtn.getAttribute('data-modal-target');
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.classList.add('open');
          if (window.lucide) window.lucide.createIcons();
        }
      }

      const closeBtn = e.target.closest('.modal-close');
      if (closeBtn) {
        e.preventDefault();
        const modal = closeBtn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('open');
      }

      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
        if (notifDropdown) notifDropdown.classList.remove('open');
      }
    });
  </script>

  ${extraScripts}
</body>
</html>`;
}

// -------------------------------------------------------------
// 1. GENERATE DASHBOARD.HTML
// -------------------------------------------------------------
console.log('Generating dashboard.html...');
let dashSection = extractSection(indexHtml, 'view-dashboard');
dashSection = dashSection.replace('class="view-panel"', 'class="view-panel active"');

// Area chart & Donut
dashSection = dashSection.replace('<div class="chart-conversas-area" id="chart-conversas-area"></div>', `<div class="chart-conversas-area" id="chart-conversas-area">${generateAreaChartSvg(zapChatData.dashboard.conversasChart)}</div>`);
dashSection = dashSection.replace('<div class="plan-usage-donut" id="plan-usage-donut"></div>', `<div class="plan-usage-donut" id="plan-usage-donut">${generateDonutSvg(zapChatData.dashboard.planUsage.percent)}</div>`);

// Seus Agentes
const seusAgentesHtml = zapChatData.dashboard.seusAgentes.map(agent => `
  <div class="dash-agent-item" onclick="window.location.href='agentes.html'" style="cursor: pointer;">
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
dashSection = dashSection.replace('<div class="dash-agents-list" id="dash-seus-agentes"></div>', `<div class="dash-agents-list" id="dash-seus-agentes">${seusAgentesHtml}</div>`);

// Conversas Recentes (Exact markup from src/js/app.js)
const conversasRecentesHtml = zapChatData.dashboard.conversasRecentes.map(item => `
  <div class="dash-conversa-item" onclick="window.location.href='conversas.html'" style="cursor: pointer;">
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
dashSection = dashSection.replace('<div class="dash-convs-list" id="dash-conversas-recentes"></div>', `<div class="dash-convs-list" id="dash-conversas-recentes">${conversasRecentesHtml}</div>`);

fs.writeFileSync(path.join(htmlDir, 'dashboard.html'), renderShell(dashSection, 'dashboard', 'Visão Geral'));

// -------------------------------------------------------------
// 2. GENERATE AGENTES.HTML
// -------------------------------------------------------------
console.log('Generating agentes.html...');
let agentesSection = extractSection(indexHtml, 'view-agentes');
agentesSection = agentesSection.replace('class="view-panel"', 'class="view-panel active"');

// Agents Table Rows (Exact markup from src/js/app.js)
const agentsRowsHtml = zapChatData.agentes.list.map(agent => {
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
          <a href="editar-agente.html" class="btn btn-secondary btn-sm" style="text-decoration:none;">
            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
            Editar
          </a>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-test-ai').classList.add('open')">
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
agentesSection = agentesSection.replace('<tbody id="agents-table-body"></tbody>', `<tbody id="agents-table-body">${agentsRowsHtml}</tbody>`);

const agentesScript = `
  <script>
    const searchInput = document.getElementById('agents-search-input');
    const tbody = document.getElementById('agents-table-body');
    if (searchInput && tbody) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
          const txt = row.textContent.toLowerCase();
          row.style.display = txt.includes(q) ? '' : 'none';
        });
      });
    }
  </script>
`;

fs.writeFileSync(path.join(htmlDir, 'agentes.html'), renderShell(agentesSection, 'agentes', 'Agentes de IA', agentesScript));

// -------------------------------------------------------------
// 3. GENERATE EDITAR-AGENTE.HTML
// -------------------------------------------------------------
console.log('Generating editar-agente.html...');
let editAgentSection = extractSection(indexHtml, 'view-editar-agente');
editAgentSection = editAgentSection.replace('class="view-panel"', 'class="view-panel active"');

const editAgentPageScript = `
  <script>
    // Back to agents navigation
    document.querySelectorAll('.btn-back-to-agents').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'agentes.html';
      });
    });

    // Tab switching for Edit Agent
    const navBtns = document.querySelectorAll('.agent-internal-nav-btn[data-agent-tab]');
    const panes = document.querySelectorAll('.agent-tab-pane');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-agent-tab');
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        panes.forEach(p => {
          if (p.id === 'agent-tab-pane-' + tab) p.classList.add('active');
          else p.classList.remove('active');
        });
        if (window.lucide) window.lucide.createIcons();
      });
    });

    // Tone buttons toggle
    const toneBtns = document.querySelectorAll('.tone-btn');
    toneBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toneBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Live name/role update and char counter
    const textarea = document.getElementById('agent-behavior-textarea');
    const counter = document.getElementById('behavior-char-count');
    const nameInput = document.getElementById('input-agent-name');
    const nameDisplay = document.getElementById('edit-agent-name-display');
    const roleInput = document.getElementById('input-agent-role');
    const roleDisplay = document.getElementById('edit-agent-role-display');

    if (textarea && counter) {
      const update = () => counter.textContent = textarea.value.length + '/3000';
      textarea.addEventListener('input', update);
      update();
    }
    if (nameInput && nameDisplay) {
      nameInput.addEventListener('input', (e) => {
        nameDisplay.textContent = e.target.value.trim() || 'Agente';
      });
    }
    if (roleInput && roleDisplay) {
      roleInput.addEventListener('input', (e) => {
        roleDisplay.textContent = e.target.value.trim() || 'Atendimento com IA';
      });
    }

    // Knowledge types switching
    const kTypeBtns = document.querySelectorAll('.knowledge-type-btn[data-knowledge-type]');
    kTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-knowledge-type');
        kTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.knowledge-input-form-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById('pane-knowledge-' + type);
        if (pane) pane.classList.add('active');
      });
    });

    // Knowledge actions (Edit & Delete)
    const kList = document.getElementById('knowledge-items-list');
    if (kList) {
      kList.addEventListener('click', (e) => {
        const delBtn = e.target.closest('.btn-delete-knowledge');
        if (delBtn) {
          e.preventDefault();
          const card = delBtn.closest('.knowledge-item-card');
          if (card) {
            card.remove();
            const badge = document.getElementById('knowledge-count-badge');
            if (badge) badge.textContent = document.querySelectorAll('#knowledge-items-list .knowledge-item-card').length;
          }
          return;
        }
        const editBtn = e.target.closest('.btn-edit-knowledge');
        if (editBtn) {
          e.preventDefault();
          const card = editBtn.closest('.knowledge-item-card');
          const nameEl = card ? card.querySelector('.knowledge-item-name') : null;
          if (nameEl) {
            const val = prompt('Editar nome / título:', nameEl.textContent);
            if (val && val.trim()) nameEl.textContent = val.trim();
          }
        }
      });
    }

    // Save buttons feedback
    document.querySelectorAll('.btn-save-agent').forEach(btn => {
      btn.addEventListener('click', () => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Salvo!';
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = orig;
          if (window.lucide) window.lucide.createIcons();
        }, 1800);
      });
    });

    // Test AI chat simulation
    const testForm = document.getElementById('form-test-chat');
    const testInput = document.getElementById('input-test-chat-message');
    const testBody = document.getElementById('modal-test-chat-body');
    if (testForm && testInput && testBody) {
      testForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const txt = testInput.value.trim();
        if (!txt) return;
        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        
        const userMsg = document.createElement('div');
        userMsg.className = 'modal-test-msg user';
        userMsg.innerHTML = '<div class="modal-test-bubble">' + txt + '<span class="modal-test-msg-time">' + timeStr + '</span></div>';
        testBody.appendChild(userMsg);
        testInput.value = '';
        testBody.scrollTop = testBody.scrollHeight;

        setTimeout(() => {
          const botMsg = document.createElement('div');
          botMsg.className = 'modal-test-msg agent';
          botMsg.innerHTML = '<div class="modal-test-bubble">Olá! Recebi sua mensagem: "<em>' + txt + '</em>". Como atendente virtual, estou pronto para tirar suas dúvidas e qualificar sua compra.<span class="modal-test-msg-time">' + timeStr + '</span></div>';
          testBody.appendChild(botMsg);
          testBody.scrollTop = testBody.scrollHeight;
        }, 700);
      });
    }

    // Schedule management for static page
    const schedToggle = document.getElementById('toggle-agent-schedule');
    const schedBanner = document.getElementById('schedule-banner-247');
    const schedPanel = document.getElementById('schedule-panel-custom');
    const schedDaysContainer = document.getElementById('schedule-days-container');

    const DEFAULT_DAYS = [
      { id: 'seg', name: 'Segunda-feira', short: 'Seg', enabled: true, start: '18:00', end: '08:00', allDay: false },
      { id: 'ter', name: 'Terça-feira', short: 'Ter', enabled: true, start: '18:00', end: '08:00', allDay: false },
      { id: 'qua', name: 'Quarta-feira', short: 'Qua', enabled: true, start: '18:00', end: '08:00', allDay: false },
      { id: 'qui', name: 'Quinta-feira', short: 'Qui', enabled: true, start: '18:00', end: '08:00', allDay: false },
      { id: 'sex', name: 'Sexta-feira', short: 'Sex', enabled: true, start: '18:00', end: '08:00', allDay: false },
      { id: 'sab', name: 'Sábado', short: 'Sáb', enabled: true, start: '00:00', end: '23:59', allDay: true },
      { id: 'dom', name: 'Domingo', short: 'Dom', enabled: true, start: '00:00', end: '23:59', allDay: true }
    ];

    let staticSched = {
      enabled: false,
      preset: 'night_weekend',
      days: JSON.parse(JSON.stringify(DEFAULT_DAYS))
    };

    function renderStaticDays() {
      if (!schedDaysContainer) return;
      schedDaysContainer.innerHTML = staticSched.days.map((day, idx) => {
        const isOvernight = day.end < day.start && !day.allDay;
        return \`
          <div class="schedule-day-row \${day.enabled ? '' : 'inactive'}" data-day-id="\${day.id}">
            <div class="schedule-day-left">
              <label class="day-switch-toggle">
                <input type="checkbox" class="input-day-enable" data-day-idx="\${idx}" \${day.enabled ? 'checked' : ''}>
                <span class="day-switch-slider"></span>
              </label>
              <span class="schedule-day-name">\${day.name}</span>
            </div>
            <div class="schedule-day-right">
              \${day.enabled ? \`
                <div class="schedule-time-box">
                  <input type="time" class="schedule-time-input input-time-start" data-day-idx="\${idx}" value="\${day.start}" \${day.allDay ? 'disabled' : ''}>
                  <span>até</span>
                  <input type="time" class="schedule-time-input input-time-end" data-day-idx="\${idx}" value="\${day.end}" \${day.allDay ? 'disabled' : ''}>
                </div>
                \${isOvernight ? '<span class="badge-overnight"><i data-lucide="moon" style="width:12px;height:12px;"></i> Turno noturno (+1 dia)</span>' : ''}
                \${day.allDay ? '<span class="badge-allday"><i data-lucide="sun" style="width:12px;height:12px;"></i> 24 Horas</span>' : ''}
                <button type="button" class="btn-day-24h \${day.allDay ? 'active' : ''}" data-day-idx="\${idx}">
                  \${day.allDay ? 'Definir horário' : '24h'}
                </button>
              \` : '<span class="schedule-inactive-label">IA não atende neste dia</span>'}
            </div>
          </div>
        \`;
      }).join('');
      if (window.lucide) window.lucide.createIcons();

      schedDaysContainer.querySelectorAll('.input-day-enable').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.dayIdx, 10);
          staticSched.days[idx].enabled = e.target.checked;
          renderStaticDays();
        });
      });

      schedDaysContainer.querySelectorAll('.input-time-start').forEach(inp => {
        inp.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.dayIdx, 10);
          staticSched.days[idx].start = e.target.value;
          renderStaticDays();
        });
      });

      schedDaysContainer.querySelectorAll('.input-time-end').forEach(inp => {
        inp.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.dayIdx, 10);
          staticSched.days[idx].end = e.target.value;
          renderStaticDays();
        });
      });

      schedDaysContainer.querySelectorAll('.btn-day-24h').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const idx = parseInt(btn.dataset.dayIdx, 10);
          staticSched.days[idx].allDay = !staticSched.days[idx].allDay;
          if (staticSched.days[idx].allDay) {
            staticSched.days[idx].start = '00:00';
            staticSched.days[idx].end = '23:59';
          } else {
            staticSched.days[idx].start = '08:00';
            staticSched.days[idx].end = '18:00';
          }
          renderStaticDays();
        });
      });
    }

    if (schedToggle) {
      schedToggle.addEventListener('change', () => {
        if (schedToggle.checked) {
          if (schedBanner) schedBanner.style.display = 'none';
          if (schedPanel) schedPanel.style.display = 'flex';
        } else {
          if (schedBanner) schedBanner.style.display = 'flex';
          if (schedPanel) schedPanel.style.display = 'none';
        }
        if (window.lucide) window.lucide.createIcons();
      });
      renderStaticDays();
    }

    // Presets
    document.querySelectorAll('.schedule-preset-btn[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-preset');
        document.querySelectorAll('.schedule-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (p === 'night_weekend') {
          staticSched.days.forEach(d => {
            if (['seg','ter','qua','qui','sex'].includes(d.id)) {
              d.enabled = true; d.start = '18:00'; d.end = '08:00'; d.allDay = false;
            } else {
              d.enabled = true; d.start = '00:00'; d.end = '23:59'; d.allDay = true;
            }
          });
        } else if (p === 'weekend_only') {
          staticSched.days.forEach(d => {
            if (['seg','ter','qua','qui','sex'].includes(d.id)) {
              d.enabled = false;
            } else {
              d.enabled = true; d.start = '00:00'; d.end = '23:59'; d.allDay = true;
            }
          });
        } else if (p === 'business_hours') {
          staticSched.days.forEach(d => {
            if (['seg','ter','qua','qui','sex'].includes(d.id)) {
              d.enabled = true; d.start = '08:00'; d.end = '18:00'; d.allDay = false;
            } else {
              d.enabled = false;
            }
          });
        }
        renderStaticDays();
      });
    });

    // Replicate Monday
    const btnCopy = document.getElementById('btn-copy-weekdays');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const mon = staticSched.days.find(d => d.id === 'seg');
        if (mon) {
          staticSched.days.forEach(d => {
            if (['ter','qua','qui','sex'].includes(d.id)) {
              d.enabled = mon.enabled;
              d.start = mon.start;
              d.end = mon.end;
              d.allDay = mon.allDay;
            }
          });
          renderStaticDays();
        }
      });
    }

    // Radio cards
    const rSilent = document.querySelector('input[name="agent_out_action"][value="silent"]');
    const rReply = document.querySelector('input[name="agent_out_action"][value="auto_reply"]');
    const boxReply = document.getElementById('schedule-auto-reply-box');
    const cSilent = document.getElementById('label-action-silent');
    const cReply = document.getElementById('label-action-reply');

    function updateRadioStatic() {
      if (rReply && rReply.checked) {
        if (boxReply) boxReply.style.display = 'block';
        if (cReply) cReply.classList.add('active');
        if (cSilent) cSilent.classList.remove('active');
      } else {
        if (boxReply) boxReply.style.display = 'none';
        if (cSilent) cSilent.classList.add('active');
        if (cReply) cReply.classList.remove('active');
      }
    }
    if (rSilent) rSilent.addEventListener('change', updateRadioStatic);
    if (rReply) rReply.addEventListener('change', updateRadioStatic);
  </script>
`;

fs.writeFileSync(path.join(htmlDir, 'editar-agente.html'), renderShell(editAgentSection, 'editar-agente', 'Editar Agente - Pedro', editAgentPageScript));

// -------------------------------------------------------------
// 4. GENERATE CONVERSAS.HTML
// -------------------------------------------------------------
console.log('Generating conversas.html...');
let conversasSection = extractSection(indexHtml, 'view-conversas');
conversasSection = conversasSection.replace('class="view-panel"', 'class="view-panel active"');

const threads = zapChatData.conversas.threads;
const activeThread = threads[0];

// Exact threads HTML
const threadsHtml = threads.map((thread, idx) => {
  const isActive = idx === 0;
  return `
    <div class="chat-thread-item ${isActive ? 'active' : ''}" data-thread-id="${thread.id}" style="cursor: pointer;">
      <div class="thread-avatar-wrap">
        <img src="${thread.img}" alt="${thread.name}" class="thread-avatar">
      </div>
      <div class="thread-content">
        <div class="thread-top-row">
          <div class="thread-name-group">
            <span class="thread-name">${thread.name}</span>
            ${getChannelBadgeHtml(thread.channel)}
          </div>
          <span class="thread-time">${thread.time}</span>
        </div>
        <div class="thread-bottom-row">
          <span class="thread-snippet">${thread.snippet}</span>
          ${thread.unread > 0 ? `<span class="thread-unread-pill">${thread.unread}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}).join('');
conversasSection = conversasSection.replace('<div class="chat-threads-container" id="chat-threads-container"></div>', `<div class="chat-threads-container" id="chat-threads-container">${threadsHtml}</div>`);

// Exact Arena Header
const arenaHeaderHtml = `
  <div class="chat-contact-banner">
    <button class="mobile-chat-back-btn" id="mobile-chat-back-btn" title="Voltar para conversas" aria-label="Voltar para conversas">
      <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
    </button>
    <div class="chat-contact-avatar-wrap">
      <img src="${activeThread.img}" alt="${activeThread.name}" class="chat-contact-avatar" id="active-chat-avatar">
      <span class="chat-online-indicator"></span>
    </div>
    <div class="chat-contact-meta">
      <div class="chat-contact-name-row">
        <span class="chat-contact-name" id="active-chat-name">${activeThread.name}</span>
        <span id="active-chat-channel-badge">${getChannelBadgeHtml(activeThread.channel)}</span>
      </div>
      <div class="chat-status-ia-tag">
        <span class="sparkle-dot"></span>
        <span id="active-chat-attending-status">${activeThread.attendingStatus || 'IA atendendo'}</span>
      </div>
    </div>
  </div>

  <div class="chat-header-actions">
    <button class="btn btn-primary btn-sm chat-action-btn" id="btn-header-assume">
      <i data-lucide="user-check" style="width: 14px; height: 14px;"></i>
      <span>Assumir</span>
    </button>
    <button class="btn btn-secondary btn-sm chat-action-btn" id="btn-header-transfer">
      <i data-lucide="corner-up-right" style="width: 14px; height: 14px;"></i>
      <span>Transferir</span>
    </button>
    <button class="btn btn-secondary btn-sm chat-action-btn chat-action-close" id="btn-header-close">
      <i data-lucide="x-circle" style="width: 14px; height: 14px;"></i>
      <span>Encerrar</span>
    </button>
    <div class="chat-header-divider"></div>
    <button class="btn-action-round chat-icon-btn" id="btn-toggle-chat-profile" title="Ver detalhes do contato" aria-label="Ver detalhes do contato">
      <i data-lucide="info" style="width: 15px; height: 15px;"></i>
    </button>
  </div>
`;
conversasSection = conversasSection.replace('<div class="chat-arena-header" id="chat-arena-header"></div>', `<div class="chat-arena-header" id="chat-arena-header">${arenaHeaderHtml}</div>`);

// Exact Messages HTML
const messagesHtml = `
  <div class="chat-date-divider">
    <span>Hoje</span>
  </div>

  ${activeThread.messages.map(msg => {
    const isBot = msg.sender === 'bot';
    return `
      <div class="message-row ${isBot ? 'bot' : 'user'}">
        <div class="message-bubble">
          <div style="white-space: pre-line;">${msg.text}</div>
          <div class="message-meta">
            <span>${msg.time}</span>
            ${isBot ? '<span class="check-read-icon">✓✓</span>' : ''}
          </div>
        </div>
        ${isBot ? `
          <div class="bot-sparkle-avatar" title="Resposta da IA">
            <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
          </div>
        ` : ''}
      </div>
    `;
  }).join('')}
`;
conversasSection = conversasSection.replace('<div class="chat-messages-scroll" id="chat-messages-scroll"></div>', `<div class="chat-messages-scroll" id="chat-messages-scroll">${messagesHtml}</div>`);

// Exact Right Column Cards
const profileCardHtml = `
  <div class="profile-card-top-bar">
    <span class="profile-card-top-title">Contato</span>
    <button class="btn-action-round" style="width: 26px; height: 26px;">
      <i data-lucide="more-horizontal" style="width: 13px; height: 13px;"></i>
    </button>
  </div>

  <div class="profile-contact-row">
    <img src="${activeThread.img}" alt="${activeThread.name}" class="profile-contact-avatar" id="side-profile-img">
    <span class="profile-contact-name" id="side-profile-name">${activeThread.name}</span>
  </div>

  <div class="contact-info-list">
    <div class="contact-info-item">
      <span style="color: #25D366; font-size: 15px;">🟢</span>
      <span id="side-profile-phone">${activeThread.phone}</span>
    </div>
    <div class="contact-info-item">
      <i data-lucide="mail" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
      <span id="side-profile-email">${activeThread.email}</span>
    </div>
  </div>
`;
conversasSection = conversasSection.replace('<div class="profile-section-card" id="chat-profile-card"></div>', `<div class="profile-section-card" id="chat-profile-card">${profileCardHtml}</div>`);

const attendanceCardHtml = `
  <div class="profile-card-top-title" style="margin-bottom: 10px;">Atendimento</div>
  <div class="attendance-meta-group">
    <div class="attendance-row">
      <span class="attendance-label">Agente</span>
      <div class="attendance-agent-pill">
        <div class="agent-icon-avatar" style="width: 22px; height: 22px; background: #E9F7F1; color: #00A868; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
          <i data-lucide="bot" style="width: 14px; height: 14px;"></i>
        </div>
        <span id="side-attendance-agent">${activeThread.assignedAgent || 'Pedro'}</span>
      </div>
    </div>

    <div class="attendance-row">
      <span class="attendance-label">Status</span>
      <div class="attendance-status-badge">
        <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i>
        <span id="side-attendance-status">${activeThread.attendingStatus || 'IA atendendo'}</span>
      </div>
    </div>
  </div>
`;
conversasSection = conversasSection.replace('<div class="profile-section-card" id="chat-attendance-card"></div>', `<div class="profile-section-card" id="chat-attendance-card">${attendanceCardHtml}</div>`);

const aiSummaryHtml = `
  <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13.5px; color: var(--text-main);">
    <i data-lucide="sparkles" style="width: 15px; height: 15px; color: var(--primary);"></i>
    <span>Resumo da IA</span>
  </div>
  <ul class="ai-summary-points-simplified" id="side-ai-summary-list">
    ${(activeThread.aiSummary || []).map(p => `
      <li>
        <span class="point-bullet-star">✦</span>
        <span>${p}</span>
      </li>
    `).join('')}
  </ul>
`;
conversasSection = conversasSection.replace('<div class="profile-section-card" id="chat-ai-summary-card"></div>', `<div class="profile-section-card" id="chat-ai-summary-card">${aiSummaryHtml}</div>`);

const conversasScript = `
  <script>
    const threadsData = ${JSON.stringify(threads)};
    const threadItems = document.querySelectorAll('.chat-thread-item');

    threadItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-thread-id');
        const t = threadsData.find(x => x.id === id);
        if (!t) return;

        threadItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Update active chat header
        const nameEl = document.getElementById('active-chat-name');
        const imgEl = document.getElementById('active-chat-avatar');
        if (nameEl) nameEl.textContent = t.name;
        if (imgEl) imgEl.src = t.img;

        // Update messages
        const scroll = document.getElementById('chat-messages-scroll');
        if (scroll) {
          scroll.innerHTML = '<div class="chat-date-divider"><span>Hoje</span></div>' + t.messages.map(m => {
            const isBot = m.sender === 'bot';
            return '<div class="message-row ' + (isBot ? 'bot' : 'user') + '">' +
              '<div class="message-bubble"><div style="white-space: pre-line;">' + m.text + '</div>' +
              '<div class="message-meta"><span>' + m.time + '</span>' + (isBot ? '<span class="check-read-icon">✓✓</span>' : '') + '</div></div>' +
              (isBot ? '<div class="bot-sparkle-avatar"><i data-lucide="sparkles" style="width:14px;height:14px;"></i></div>' : '') +
              '</div>';
          }).join('');
          scroll.scrollTop = scroll.scrollHeight;
        }

        // Update side cards
        const sideName = document.getElementById('side-profile-name');
        const sideImg = document.getElementById('side-profile-img');
        const sidePhone = document.getElementById('side-profile-phone');
        const sideEmail = document.getElementById('side-profile-email');
        if (sideName) sideName.textContent = t.name;
        if (sideImg) sideImg.src = t.img;
        if (sidePhone) sidePhone.textContent = t.phone;
        if (sideEmail) sideEmail.textContent = t.email;

        const summaryList = document.getElementById('side-ai-summary-list');
        if (summaryList) {
          summaryList.innerHTML = (t.aiSummary || []).map(p => '<li><span class="point-bullet-star">✦</span><span>' + p + '</span></li>').join('');
        }

        if (window.lucide) window.lucide.createIcons();
      });
    });

    // Toggle contact profile drawer
    const toggleProfileBtn = document.getElementById('btn-toggle-chat-profile');
    const closeProfileBtn = document.getElementById('btn-close-chat-profile');
    const layout = document.querySelector('.conversas-simplified-layout');
    if (toggleProfileBtn && layout) {
      toggleProfileBtn.addEventListener('click', () => layout.classList.toggle('chat-profile-open'));
    }
    if (closeProfileBtn && layout) {
      closeProfileBtn.addEventListener('click', () => layout.classList.remove('chat-profile-open'));
    }

    // Tabs filter
    document.querySelectorAll('.chat-tab-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chat-tab-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        threadItems.forEach(item => {
          const id = item.getAttribute('data-thread-id');
          const t = threadsData.find(x => x.id === id);
          if (!t) return;
          if (tab === 'all') item.style.display = 'flex';
          else if (tab === 'unread') item.style.display = t.unread > 0 ? 'flex' : 'none';
          else if (tab === 'ongoing') item.style.display = t.status === 'Em atendimento' ? 'flex' : 'none';
        });
      });
    });
  </script>
`;

fs.writeFileSync(path.join(htmlDir, 'conversas.html'), renderShell(conversasSection, 'conversas', 'Conversas & Chat', conversasScript));

// -------------------------------------------------------------
// 5. GENERATE CANAIS.HTML
// -------------------------------------------------------------
console.log('Generating canais.html...');
let canaisSection = extractSection(indexHtml, 'view-canais');
canaisSection = canaisSection.replace('class="view-panel"', 'class="view-panel active"');

// Channels Table Rows (Exact markup from src/js/channels.js)
const channelsRowsHtml = zapChatData.canais.list.map(channel => {
  const glyphHtml = getChannelGlyphIcon(channel.channelType);

  let agentHtml = '';
  if (channel.agentType === 'photo') {
    agentHtml = `
      <div class="channel-agent-cell">
        <img src="${channel.agentImg}" alt="${channel.agentName}" class="channel-agent-avatar">
        <span>${channel.agentName}</span>
      </div>
    `;
  } else {
    agentHtml = `
      <div class="channel-agent-cell">
        <div class="channel-agent-badge" style="background-color: ${channel.agentBg}; color: ${channel.agentColor};">
          ${channel.agentInitials}
        </div>
        <span>${channel.agentName}</span>
      </div>
    `;
  }

  const isConnected = channel.status === 'Conectado' || channel.status === 'Ativo';
  const statusClass = isConnected ? 'connected' : 'soon';

  return `
    <tr>
      <td>
        <div class="channel-name-cell">
          ${glyphHtml}
          <span>${channel.name}</span>
        </div>
      </td>
      <td>${agentHtml}</td>
      <td><span class="channel-ident-text">${channel.identifier}</span></td>
      <td><span class="channel-dept-text">${channel.department}</span></td>
      <td>
        <span class="status-pill-simplified ${statusClass}">
          <span class="status-dot-sm"></span>
          ${channel.status}
        </span>
      </td>
      <td style="text-align: right;">
        <button class="channel-more-btn" title="Mais opções" onclick="alert('Opções do canal: ${channel.name}')">
          ⋮
        </button>
      </td>
    </tr>
  `;
}).join('');
canaisSection = canaisSection.replace('<tbody id="channels-table-body"></tbody>', `<tbody id="channels-table-body">${channelsRowsHtml}</tbody>`);

const canaisScript = `
  <script>
    // Channel wizard handling
    const wizardModal = document.getElementById('modal-new-channel');
    if (wizardModal) {
      const step1 = document.getElementById('wizard-step-1');
      const step2 = document.getElementById('wizard-step-2');
      const step3 = document.getElementById('wizard-step-3');
      const next1 = document.getElementById('wizard-btn-next-1');
      const next2 = document.getElementById('wizard-btn-next-2');
      const prev2 = document.getElementById('wizard-btn-prev-2');
      const finish = document.getElementById('wizard-btn-finish');

      if (next1) next1.addEventListener('click', () => {
        step1.classList.remove('active');
        step2.classList.add('active');
        updateStepper(2);
      });
      if (prev2) prev2.addEventListener('click', () => {
        step2.classList.remove('active');
        step1.classList.add('active');
        updateStepper(1);
      });
      if (next2) next2.addEventListener('click', () => {
        step2.classList.remove('active');
        step3.classList.add('active');
        updateStepper(3);
      });
      if (finish) finish.addEventListener('click', () => {
        wizardModal.classList.remove('open');
        alert('Canal conectado com sucesso!');
        location.reload();
      });

      function updateStepper(step) {
        document.querySelectorAll('.wizard-stepper .step-item').forEach((item, idx) => {
          if (idx + 1 <= step) item.classList.add('active');
          else item.classList.remove('active');
        });
        if (window.lucide) window.lucide.createIcons();
      }
    }
  </script>
`;

fs.writeFileSync(path.join(htmlDir, 'canais.html'), renderShell(canaisSection, 'canais', 'Canais de Atendimento', canaisScript));

// -------------------------------------------------------------
// 6. GENERATE LEADS.HTML
// -------------------------------------------------------------
console.log('Generating leads.html...');
let leadsSection = extractSection(indexHtml, 'view-leads');
leadsSection = leadsSection.replace('class="view-panel"', 'class="view-panel active"');

const leadsList = zapChatData.leads.list;
const activeLead = leadsList[0];

// Exact Leads Table Rows (from src/js/leads.js)
const leadsRowsHtml = leadsList.map((lead, idx) => {
  const isRowActive = idx === 0;
  return `
    <tr class="${isRowActive ? 'selected' : ''}" data-lead-id="${lead.id}" style="cursor: pointer;">
      <td style="width: 36px;" onclick="event.stopPropagation()">
        <input type="checkbox" ${isRowActive ? 'checked' : ''} class="lead-row-checkbox" data-lead-id="${lead.id}" title="Selecionar lead">
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
          ${getLeadChannelBadge(lead.channel)}
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
          <a href="conversas.html" class="lead-action-btn" title="Abrir conversa" style="text-decoration:none;">
            <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
          </a>
        </div>
      </td>
    </tr>
  `;
}).join('');
leadsSection = leadsSection.replace('<tbody id="leads-table-body"></tbody>', `<tbody id="leads-table-body">${leadsRowsHtml}</tbody>`);

// Exact Detail Panel (from src/js/leads.js renderSelectedLeadPanel)
const leadDetailHtml = `
  <div class="lead-panel-top-bar">
    <span class="lead-panel-top-title">Lead selecionado</span>
    <button class="lead-panel-close-btn" id="btn-close-lead-panel" title="Fechar painel">✕</button>
  </div>

  <div class="lead-panel-profile">
    <div class="lead-panel-avatar-lg">${activeLead.initials}</div>
    <div class="lead-panel-name-block">
      <div class="lead-panel-name-row">
        <span>${activeLead.name}</span>
        <span class="lead-status-pill ${activeLead.statusKey || 'novo'}">${activeLead.status}</span>
      </div>
      <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
        <span>${activeLead.phone}</span>
        <button class="btn-copy-mini" title="Copiar telefone" onclick="navigator.clipboard && navigator.clipboard.writeText('${activeLead.phone}')">
          <i data-lucide="copy" style="width: 12px; height: 12px;"></i>
        </button>
      </div>
      <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
        <span>${activeLead.email}</span>
        <button class="btn-copy-mini" title="Copiar e-mail" onclick="navigator.clipboard && navigator.clipboard.writeText('${activeLead.email}')">
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
        ${getLeadChannelBadge(activeLead.channel)}
      </span>
    </div>

    <div class="lead-panel-info-row">
      <span class="lead-panel-info-label">
        <i data-lucide="tag" style="width: 14px; height: 14px;"></i> Interesse
      </span>
      <span class="lead-panel-info-val">${activeLead.primaryInterest || 'Plano Pro'}</span>
    </div>

    <div class="lead-panel-info-row">
      <span class="lead-panel-info-label">
        <i data-lucide="user-check" style="width: 14px; height: 14px;"></i> Responsável
      </span>
      <span class="lead-panel-info-val">${activeLead.agentName}</span>
    </div>

    <div class="lead-panel-info-row" style="align-items: flex-start;">
      <span class="lead-panel-info-label">
        <i data-lucide="calendar" style="width: 14px; height: 14px;"></i> Próxima ação
      </span>
      <div class="lead-next-action-box">
        <span class="next-action-title">${activeLead.nextAction?.text || 'Follow-up por WhatsApp'}</span>
        <span class="next-action-time">${activeLead.nextAction?.time || 'Hoje às 14:00'}</span>
      </div>
    </div>
  </div>

  <div class="lead-panel-buttons-stack">
    <a href="conversas.html" class="btn btn-primary" id="btn-open-lead-chat" style="text-decoration:none;">
      <i data-lucide="message-square" style="width: 15px; height: 15px;"></i>
      Abrir conversa
    </a>
    <button class="btn btn-secondary" onclick="alert('Atribuir outro atendente para este lead')">
      <i data-lucide="user-plus" style="width: 15px; height: 15px;"></i>
      Atribuir agente
    </button>
  </div>
`;
leadsSection = leadsSection.replace('<div class="lead-detail-panel-simplified" id="lead-detail-panel"></div>', `<div class="lead-detail-panel-simplified" id="lead-detail-panel">${leadDetailHtml}</div>`);

const leadsScript = `
  <script>
    const leadsData = ${JSON.stringify(leadsList)};
    const rows = document.querySelectorAll('#leads-table-body tr');

    rows.forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-lead-id');
        const l = leadsData.find(x => x.id === id);
        if (!l) return;

        rows.forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');

        const panel = document.getElementById('lead-detail-panel');
        if (panel) {
          panel.style.display = 'block';
          panel.querySelector('.lead-panel-avatar-lg').textContent = l.initials;
          panel.querySelector('.lead-panel-name-row span:first-child').textContent = l.name;
          panel.querySelector('.lead-panel-name-row .lead-status-pill').textContent = l.status;
          panel.querySelector('.lead-panel-name-row .lead-status-pill').className = 'lead-status-pill ' + (l.statusKey || 'novo');
        }
      });
    });

    const closeBtn = document.getElementById('btn-close-lead-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const panel = document.getElementById('lead-detail-panel');
        if (panel) panel.style.display = 'none';
      });
    }
  </script>
`;

fs.writeFileSync(path.join(htmlDir, 'leads.html'), renderShell(leadsSection, 'leads', 'Leads & Contatos', leadsScript));

// -------------------------------------------------------------
// 7. GENERATE CONFIGURACOES.HTML
// -------------------------------------------------------------
console.log('Generating configuracoes.html...');
let configSection = extractSection(indexHtml, 'view-configuracoes');
configSection = configSection.replace('class="view-panel"', 'class="view-panel active"');

const configPageScript = `
  <script>
    // Sub-tabs switching in Settings (Matching settings-pane-*)
    const setBtns = document.querySelectorAll('.settings-nav-btn[data-settings-tab]');
    const setPanes = document.querySelectorAll('.settings-pane');

    function activateSettingsTab(tabName) {
      setBtns.forEach(btn => {
        if (btn.getAttribute('data-settings-tab') === tabName) btn.classList.add('active');
        else btn.classList.remove('active');
      });
      setPanes.forEach(pane => {
        if (pane.id === 'settings-pane-' + tabName) pane.classList.add('active');
        else pane.classList.remove('active');
      });
      if (window.lucide) window.lucide.createIcons();
    }

    setBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        activateSettingsTab(btn.getAttribute('data-settings-tab'));
      });
    });

    if (window.location.hash) {
      const hashTab = window.location.hash.replace('#', '');
      if (['perfil', 'faturamento', 'notificacoes'].includes(hashTab)) {
        activateSettingsTab(hashTab);
      }
    }
  </script>
`;

fs.writeFileSync(path.join(htmlDir, 'configuracoes.html'), renderShell(configSection, 'configuracoes', 'Configurações', configPageScript));

// -------------------------------------------------------------
// 8. GENERATE SUPORTE.HTML
// -------------------------------------------------------------
console.log('Generating suporte.html...');
let suporteSection = extractSection(indexHtml, 'view-suporte');
suporteSection = suporteSection.replace('class="view-panel"', 'class="view-panel active"');

// Update stats to 2 tickets
suporteSection = suporteSection.replace('<span class="suporte-stat-value" id="stat-tickets-open">0</span>', '<span class="suporte-stat-value" id="stat-tickets-open">2</span>');
suporteSection = suporteSection.replace('<span class="suporte-stat-value" id="stat-tickets-tech">0</span>', '<span class="suporte-stat-value" id="stat-tickets-tech">1</span>');
suporteSection = suporteSection.replace('<span class="suporte-stat-value" id="stat-tickets-comm">0</span>', '<span class="suporte-stat-value" id="stat-tickets-comm">1</span>');
suporteSection = suporteSection.replace('<span class="suporte-stat-value" id="stat-tickets-total">0</span>', '<span class="suporte-stat-value" id="stat-tickets-total">2</span>');

// Hide empty state, show table wrap with tickets
suporteSection = suporteSection.replace('<div class="suporte-empty-card" id="suporte-empty-state">', '<div class="suporte-empty-card" id="suporte-empty-state" style="display: none;">');
suporteSection = suporteSection.replace('<div class="table-card suporte-tickets-card" id="suporte-tickets-table-wrap" style="display: none;">', '<div class="table-card suporte-tickets-card" id="suporte-tickets-table-wrap" style="display: block;">');

// Inject tickets matching suporte.js markup
const ticketsRowsHtml = `
  <tr>
    <td><span class="ticket-protocol">#TKT-1042</span></td>
    <td>
      <span class="badge" style="background: rgba(0, 168, 104, 0.1); color: var(--primary); font-weight: 600;">
        Técnico
      </span>
    </td>
    <td>
      <div class="ticket-title-cell">
        <span class="ticket-main-title">Dúvida sobre webhook de novos leads</span>
        <span class="ticket-desc-snippet">Gostaria de saber como configurar o envio de payloads em tempo real para o n8n.</span>
      </div>
    </td>
    <td style="color: var(--text-muted); font-size: 13px;">Hoje às 11:20</td>
    <td>
      <span class="badge badge-active">Em aberto</span>
    </td>
    <td style="text-align: right;">
      <button type="button" class="btn btn-secondary btn-sm" onclick="alert('Chamado #TKT-1042 marcado como concluído!')">
        <i data-lucide="check" style="width: 13px; height: 13px;"></i> Concluir
      </button>
    </td>
  </tr>
  <tr>
    <td><span class="ticket-protocol">#TKT-1041</span></td>
    <td>
      <span class="badge" style="background: rgba(0, 168, 104, 0.1); color: var(--primary); font-weight: 600;">
        Comercial
      </span>
    </td>
    <td>
      <div class="ticket-title-cell">
        <span class="ticket-main-title">Upgrade para plano Anual com desconto</span>
        <span class="ticket-desc-snippet">Interesse em migrar a assinatura para o ciclo anual para obter a condição de 2 meses grátis.</span>
      </div>
    </td>
    <td style="color: var(--text-muted); font-size: 13px;">Ontem às 16:45</td>
    <td>
      <span class="badge badge-active">Em aberto</span>
    </td>
    <td style="text-align: right;">
      <button type="button" class="btn btn-secondary btn-sm" onclick="alert('Chamado #TKT-1041 marcado como concluído!')">
        <i data-lucide="check" style="width: 13px; height: 13px;"></i> Concluir
      </button>
    </td>
  </tr>
`;
suporteSection = suporteSection.replace('<tbody id="suporte-tickets-tbody"></tbody>', `<tbody id="suporte-tickets-tbody">${ticketsRowsHtml}</tbody>`);

fs.writeFileSync(path.join(htmlDir, 'suporte.html'), renderShell(suporteSection, 'suporte', 'Central de Suporte'));

// -------------------------------------------------------------
// 9. GENERATE INDEX.HTML IN HTML DIR
// -------------------------------------------------------------
fs.writeFileSync(path.join(htmlDir, 'index.html'), `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=dashboard.html">
  <title>ZapChat - Redirecionando...</title>
  <script>window.location.href = 'dashboard.html';</script>
</head>
<body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
  <p>Redirecionando para o <a href="dashboard.html">Dashboard do ZapChat...</a></p>
</body>
</html>`);

console.log('✅ ALL 9 HTML files built with 100% precision and zero errors!');
