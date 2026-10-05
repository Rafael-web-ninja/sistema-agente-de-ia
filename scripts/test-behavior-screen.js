import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });

  await page.goto('http://localhost:3001/#editar-agente');
  await page.waitForTimeout(1000);

  // Set .app-main overflow to visible or resize viewport so full page screenshot captures all cards
  await page.evaluate(() => {
    const main = document.querySelector('.app-main');
    if (main) {
      main.style.maxHeight = 'none';
      main.style.overflow = 'visible';
    }
  });
  await page.waitForTimeout(300);

  // Take full screenshot in Light Mode
  await page.screenshot({ path: 'prints/17-perfil-agente-nova-tela-light.png', fullPage: true });

  // Test interactive elements
  // 1. Click on "Advocacia" chip
  await page.click('.segment-chip[data-segment="Advocacia / Jurídico"]');
  // 2. Click on "Vendas" objective
  await page.click('.btn-objective-item[data-objective="vendas"]');
  // 3. Click on "Apresentar serviços" secondary
  await page.click('.btn-objective-subitem[data-action="servicos"]');
  // 4. Click on "Descontraído" tone
  await page.click('[data-style-group="tom-de-voz"] .btn-style-option[data-value="descontraido"]');
  // 5. Toggle a client data chip: "E-mail"
  await page.click('.btn-data-chip[data-field="email"]');
  // 6. Enter instructions
  await page.fill('#agent-behavior-textarea', 'Confirmar dados de agendamento antes de finalizar atendimento.');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'prints/18-perfil-agente-interacao.png', fullPage: true });

  // Open Ver Regras modal
  await page.click('#btn-view-segment-rules');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'prints/19-modal-regras-segmento.png', fullPage: false });

  // Close modal
  await page.click('#modal-segment-rules .modal-close');
  await page.waitForTimeout(300);

  // Switch to Dark Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'prints/20-perfil-agente-nova-tela-dark.png', fullPage: true });

  await browser.close();
  console.log('Visual test screenshots taken successfully!');
})();
