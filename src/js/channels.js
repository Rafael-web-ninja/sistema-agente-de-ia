import { zapChatData } from './data.js';

export function initChannelsView() {
  renderSimplifiedChannelsTable(zapChatData.canais.list);
  setupChannelsSearch();
  setupNewChannelForm();
}

export function renderSimplifiedChannelsTable(channels) {
  const tableBody = document.getElementById('channels-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = channels.map(channel => {
    const glyphHtml = getChannelIconHtml(channel.channelType);

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
        <td>
          ${agentHtml}
        </td>
        <td>
          <span class="channel-ident-text">${channel.identifier}</span>
        </td>
        <td>
          <span class="channel-dept-text">${channel.department}</span>
        </td>
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

  const countInfo = document.getElementById('channels-pagination-info');
  if (countInfo) {
    countInfo.textContent = `1–${channels.length} de ${channels.length} canais`;
  }

  if (window.lucide) window.lucide.createIcons();
}

function setupChannelsSearch() {
  const searchInput = document.getElementById('channels-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = zapChatData.canais.list.filter(c => {
      return c.name.toLowerCase().includes(q) ||
             c.agentName.toLowerCase().includes(q) ||
             c.identifier.toLowerCase().includes(q) ||
             c.department.toLowerCase().includes(q) ||
             c.status.toLowerCase().includes(q);
    });
    renderSimplifiedChannelsTable(filtered);
  });
}

function setupNewChannelForm() {
  setupChannelWizard();
}

let currentWizardStep = 1;
let selectedChannelType = 'whatsapp';
let qrTimerInterval = null;
let currentChannelData = {
  name: 'WhatsApp Comercial',
  dept: 'Comercial',
  agent: 'Pedro',
  ident: '+55 11 98842-1920',
  type: 'whatsapp'
};

function setupChannelWizard() {
  const modal = document.getElementById('modal-new-channel');
  if (!modal) return;

  // Reset wizard and open modal whenever trigger button is clicked
  document.querySelectorAll('[data-modal-target="modal-new-channel"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      resetChannelWizard();
      modal.classList.add('open');
    });
  });

  // Step 1: Channel Type Cards selection
  const typeCards = modal.querySelectorAll('.channel-type-card');
  typeCards.forEach(card => {
    card.addEventListener('click', () => {
      typeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedChannelType = card.getAttribute('data-channel-type') || 'whatsapp';
      currentChannelData.type = selectedChannelType;

      // Update smart defaults for Step 2
      const nameInput = document.getElementById('wizard-input-name');
      const identInput = document.getElementById('wizard-input-ident');

      if (selectedChannelType === 'whatsapp') {
        if (nameInput) nameInput.value = 'WhatsApp Comercial';
        if (identInput) identInput.value = '+55 11 98842-1920';
      } else if (selectedChannelType === 'widget') {
        if (nameInput) nameInput.value = 'Widget Chat Site Principal';
        if (identInput) identInput.value = 'widget.zapchat.app/site-principal';
      } else if (selectedChannelType === 'instagram') {
        if (nameInput) nameInput.value = 'Instagram Direct Loja';
        if (identInput) identInput.value = '@lojazapchat_oficial';
      }
    });
  });

  // Step 1: Next button
  const btnNext1 = document.getElementById('wizard-btn-next-1');
  btnNext1?.addEventListener('click', () => {
    goToWizardStep(2);
  });

  // Step 2: Back button
  const btnBack2 = document.getElementById('wizard-btn-back-2');
  btnBack2?.addEventListener('click', () => {
    goToWizardStep(1);
  });

  // Step 2: Form submit (Next to Step 3)
  const step2Form = document.getElementById('wizard-step-2-form');
  step2Form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('wizard-input-name');
    const deptInput = document.getElementById('wizard-input-dept');
    const agentInput = document.getElementById('wizard-input-agent');
    const identInput = document.getElementById('wizard-input-ident');

    currentChannelData.name = nameInput?.value.trim() || 'Novo Canal';
    currentChannelData.dept = deptInput?.value || 'Comercial';
    currentChannelData.agent = agentInput?.value || 'Pedro';
    currentChannelData.ident = identInput?.value.trim() || '+55 11 98842-1920';

    goToWizardStep(3);
  });

  // Step 3: QR Code Countdown & Reload
  const btnReloadQr = document.getElementById('btn-reload-qr');
  btnReloadQr?.addEventListener('click', () => {
    restartQrCountdown();
  });

  // Step 3: Simulate QR Code Scan Button
  const btnSimulate = document.getElementById('btn-simulate-qr-scan');
  btnSimulate?.addEventListener('click', () => {
    simulateQrConnection();
  });

  // Step 3: Finish Button on Success Screen
  const btnFinish = document.getElementById('btn-finish-channel-wizard');
  btnFinish?.addEventListener('click', () => {
    // Close modal
    modal.classList.remove('open');
    resetChannelWizard();
  });

  // Close button
  const btnClose = document.getElementById('btn-close-channel-wizard');
  btnClose?.addEventListener('click', () => {
    modal.classList.remove('open');
    resetChannelWizard();
  });
}

function goToWizardStep(stepNumber) {
  currentWizardStep = stepNumber;

  // Update Stepper
  const stepper = document.getElementById('wizard-stepper');
  if (stepper) {
    const items = stepper.querySelectorAll('.step-item');
    items.forEach(item => {
      const step = parseInt(item.getAttribute('data-step') || '1', 10);
      item.classList.remove('active', 'completed');
      if (step === stepNumber) {
        item.classList.add('active');
      } else if (step < stepNumber) {
        item.classList.add('completed');
      }
    });

    const line12 = document.getElementById('line-step-1-2');
    const line23 = document.getElementById('line-step-2-3');
    if (line12) line12.classList.toggle('active', stepNumber >= 2);
    if (line23) line23.classList.toggle('active', stepNumber >= 3);
  }

  // Update Panels
  document.querySelectorAll('.wizard-step-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const targetPanel = document.getElementById(`wizard-step-${stepNumber}`);
  if (targetPanel) targetPanel.classList.add('active');

  // Update Header Titles
  const mainTitle = document.getElementById('wizard-main-title');
  const mainSubtitle = document.getElementById('wizard-main-subtitle');
  if (stepNumber === 1) {
    if (mainTitle) mainTitle.textContent = 'Conectar Novo Canal';
    if (mainSubtitle) mainSubtitle.textContent = 'Escolha o tipo de canal que deseja integrar ao ZapChat';
    stopQrCountdown();
  } else if (stepNumber === 2) {
    if (mainTitle) mainTitle.textContent = 'Configurar Canal & Agente';
    if (mainSubtitle) mainSubtitle.textContent = 'Defina os detalhes da equipe e a inteligência artificial responsável';
    stopQrCountdown();
  } else if (stepNumber === 3) {
    if (mainTitle) mainTitle.textContent = 'Escanear QR Code do WhatsApp';
    if (mainSubtitle) mainSubtitle.textContent = 'Aponte a câmera do WhatsApp para sincronizar este aparelho';
    
    // Ensure Scan View is shown, Success View hidden initially
    const scanView = document.getElementById('qr-scan-view');
    const successView = document.getElementById('channel-success-view');
    if (scanView) scanView.style.display = 'grid';
    if (successView) successView.style.display = 'none';

    restartQrCountdown();
  }

  if (window.lucide) window.lucide.createIcons();
}

function startQrCountdown() {
  stopQrCountdown();
  let remaining = 45;
  const timerEl = document.getElementById('qr-countdown-seconds');

  qrTimerInterval = setInterval(() => {
    remaining--;
    if (timerEl) {
      timerEl.textContent = `${remaining}s`;
    }
    if (remaining <= 0) {
      stopQrCountdown();
      if (timerEl) timerEl.textContent = 'Expirado';
    }
  }, 1000);
}

function stopQrCountdown() {
  if (qrTimerInterval) {
    clearInterval(qrTimerInterval);
    qrTimerInterval = null;
  }
}

function restartQrCountdown() {
  const timerEl = document.getElementById('qr-countdown-seconds');
  if (timerEl) timerEl.textContent = '45s';
  startQrCountdown();
}

function simulateQrConnection() {
  const btn = document.getElementById('btn-simulate-qr-scan');
  if (!btn) return;

  const originalContent = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `
    <span style="display: inline-block; animation: spinSlow 1s linear infinite; margin-right: 6px;">⟳</span>
    Autenticando sessão WhatsApp...
  `;

  setTimeout(() => {
    stopQrCountdown();

    // Add new channel to dataset
    const initials = currentChannelData.agent.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const newChannel = {
      id: 'channel_' + Date.now(),
      name: currentChannelData.name,
      channelType: currentChannelData.type,
      iconType: currentChannelData.type,
      agentName: currentChannelData.agent,
      agentType: currentChannelData.agent === 'Pedro' ? 'photo' : 'initials',
      agentImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      agentInitials: initials,
      agentBg: '#EAF8F1',
      agentColor: '#00A868',
      identifier: currentChannelData.ident,
      department: currentChannelData.dept,
      status: 'Conectado',
      statusType: 'active'
    };

    zapChatData.canais.list.unshift(newChannel);
    renderSimplifiedChannelsTable(zapChatData.canais.list);

    // Switch to success view
    const scanView = document.getElementById('qr-scan-view');
    const successView = document.getElementById('channel-success-view');
    if (scanView) scanView.style.display = 'none';
    if (successView) {
      successView.style.display = 'flex';
      
      const successName = document.getElementById('success-channel-name');
      const successIdent = document.getElementById('success-channel-ident');
      const successAgent = document.getElementById('success-channel-agent');

      if (successName) successName.textContent = currentChannelData.name;
      if (successIdent) successIdent.textContent = currentChannelData.ident;
      if (successAgent) successAgent.textContent = `${currentChannelData.agent} (IA Ativa)`;
    }

    const mainTitle = document.getElementById('wizard-main-title');
    const mainSubtitle = document.getElementById('wizard-main-subtitle');
    if (mainTitle) mainTitle.textContent = 'Canal Conectado!';
    if (mainSubtitle) mainSubtitle.textContent = 'Sua instância do WhatsApp foi pareada com sucesso.';

    btn.disabled = false;
    btn.innerHTML = originalContent;

    if (window.lucide) window.lucide.createIcons();
  }, 1400);
}

function resetChannelWizard() {
  stopQrCountdown();
  goToWizardStep(1);

  // Reset form inputs to defaults
  const nameInput = document.getElementById('wizard-input-name');
  const identInput = document.getElementById('wizard-input-ident');
  const deptInput = document.getElementById('wizard-input-dept');
  const agentInput = document.getElementById('wizard-input-agent');

  if (nameInput) nameInput.value = 'WhatsApp Comercial';
  if (identInput) identInput.value = '+55 11 98842-1920';
  if (deptInput) deptInput.value = 'Comercial';
  if (agentInput) agentInput.value = 'Pedro';

  // Select WhatsApp card by default
  const typeCards = document.querySelectorAll('.channel-type-card');
  typeCards.forEach(c => {
    if (c.getAttribute('data-channel-type') === 'whatsapp') {
      c.classList.add('selected');
    } else {
      c.classList.remove('selected');
    }
  });

  const scanView = document.getElementById('qr-scan-view');
  const successView = document.getElementById('channel-success-view');
  if (scanView) scanView.style.display = 'grid';
  if (successView) successView.style.display = 'none';
}

/**
 * Returns premium SVG brand badge HTML for channels
 */
export function getChannelIconHtml(channelType) {
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

  if (type === 'widget' || type === 'site') {
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

  if (type === 'meta_api' || type === 'meta') {
    return `
      <div class="channel-glyph-circle glyph-meta" title="WhatsApp Cloud API">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
        </svg>
      </div>
    `;
  }

  return `
    <div class="channel-glyph-circle glyph-whatsapp" title="${channelType}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM17.84 15.65C17.6 16.33 16.65 16.94 15.89 17.1C15.37 17.21 14.7 17.29 12.42 16.34C9.51 15.13 7.63 12.18 7.48 11.98C7.34 11.79 6.29 10.4 6.29 8.96C6.29 7.52 7.02 6.82 7.31 6.52C7.55 6.28 7.94 6.17 8.28 6.17C8.39 6.17 8.49 6.17 8.58 6.18C8.84 6.19 8.97 6.21 9.14 6.62C9.35 7.14 9.87 8.41 9.93 8.54C10 8.68 10.06 8.86 9.97 9.04C9.88 9.22 9.81 9.3 9.68 9.45C9.55 9.6 9.42 9.71 9.29 9.87C9.15 10.02 9 10.18 9.16 10.46C9.32 10.74 9.88 11.65 10.7 12.38C11.76 13.32 12.63 13.62 12.95 13.75C13.2 13.85 13.48 13.83 13.66 13.64C13.89 13.39 14.18 12.98 14.47 12.57C14.67 12.28 14.93 12.24 15.22 12.35C15.52 12.45 17.1 13.23 17.43 13.4C17.76 13.56 17.98 13.65 18.06 13.78C18.14 13.91 18.14 14.51 17.84 15.65Z"/>
      </svg>
    </div>
  `;
}


