import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const printsDir = path.join(rootDir, 'prints');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001/#conversas...');
  await page.goto('http://localhost:3001/#conversas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // 1. Open contact dropdown in light mode
  const menuBtn = await page.$('#btn-contact-menu-toggle');
  if (!menuBtn) {
    throw new Error('#btn-contact-menu-toggle not found!');
  }

  await menuBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(printsDir, '8-menu-contato-aberto-light.png') });
  console.log('Saved 8-menu-contato-aberto-light.png');

  // 2. Open in dark mode
  await page.click('#theme-toggle-btn');
  await page.waitForTimeout(300);
  // toggle again to keep open in dark mode
  const isDropdownOpen = await page.$eval('#contact-actions-dropdown', el => el.classList.contains('show'));
  if (!isDropdownOpen) {
    await page.click('#btn-contact-menu-toggle');
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(printsDir, '9-menu-contato-aberto-dark.png') });
  console.log('Saved 9-menu-contato-aberto-dark.png');

  // 3. Test Edit Contact modal
  await page.click('#btn-action-edit-contact');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(printsDir, '10-modal-editar-contato.png') });
  console.log('Saved 10-modal-editar-contato.png');

  // Close modal
  await page.click('#modal-edit-contact .modal-close');
  await page.waitForTimeout(300);

  // 4. Test Manage Tags modal
  await page.click('#btn-contact-menu-toggle');
  await page.waitForTimeout(300);
  await page.click('#btn-action-manage-tags');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(printsDir, '11-modal-gerenciar-etiquetas.png') });
  console.log('Saved 11-modal-gerenciar-etiquetas.png');

  // Click quick suggestion chip "VIP"
  await page.click('.tag-suggestion-chip[data-tag="VIP"]');
  await page.waitForTimeout(300);
  await page.click('#btn-save-tags-modal');
  await page.waitForTimeout(300);

  // Switch back to light mode
  await page.click('#theme-toggle-btn');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(printsDir, '12-contato-com-nova-tag-vip.png') });
  console.log('Saved 12-contato-com-nova-tag-vip.png');

  await browser.close();
  console.log('Finished testing contact actions successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
