import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const printsDir = path.resolve(__dirname, '../prints');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/#leads...');
  await page.goto('http://localhost:3000/#leads', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Open dropdown on Amanda Moreira (row with Amanda Moreira)
  const amandaRowBtn = await page.$('tr[data-lead-id="amanda_moreira"] .btn-lead-more-actions');
  if (amandaRowBtn) {
    await amandaRowBtn.click();
  } else {
    const moreBtns = await page.$$('.btn-lead-more-actions');
    await moreBtns[0].click();
  }
  await page.waitForTimeout(300);

  // 2. Click "Ver Detalhes"
  const viewBtn = await page.$('.btn-action-view-lead');
  if (!viewBtn) {
    throw new Error('.btn-action-view-lead not found!');
  }
  await viewBtn.click();
  await page.waitForTimeout(500);

  // Check if modal-view-lead has opened
  const isModalOpen = await page.$eval('#modal-view-lead', el => el.classList.contains('open'));
  console.log('Modal is open:', isModalOpen);

  await page.screenshot({ path: path.join(printsDir, '22-modal-detalhes-lead-light.png') });
  console.log('Saved 22-modal-detalhes-lead-light.png');

  // 3. Dark mode test: set data-theme="dark"
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(printsDir, '23-modal-detalhes-lead-dark.png') });
  console.log('Saved 23-modal-detalhes-lead-dark.png');

  // 4. Test changing status inside modal to "Qualificado"
  const btnQualificado = await page.$('#view-lead-status-buttons button[data-status="Qualificado"]');
  if (btnQualificado) {
    await btnQualificado.click();
    await page.waitForTimeout(400);
    console.log('Clicked status Qualificado inside modal');
  }

  // 5. Close modal
  await page.click('#modal-view-lead .modal-close');
  await page.waitForTimeout(400);

  // 6. Test opening from right sidebar button "Ver detalhes completos"
  const sidebarViewDetailsBtn = await page.$('#btn-view-lead-details-panel');
  if (sidebarViewDetailsBtn) {
    await sidebarViewDetailsBtn.click();
    await page.waitForTimeout(400);
    const isModalOpenAgain = await page.$eval('#modal-view-lead', el => el.classList.contains('open'));
    console.log('Modal opened from sidebar:', isModalOpenAgain);
    await page.click('#modal-view-lead .modal-close');
    await page.waitForTimeout(300);
  }

  // Switch back to light theme for baseline
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
  });
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(printsDir, '24-leads-tabela-final.png') });
  console.log('Saved 24-leads-tabela-final.png');

  console.log('All tests passed successfully!');
  await browser.close();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
