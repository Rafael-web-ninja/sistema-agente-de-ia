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

  console.log('Navigating to http://localhost:3000/#conversas...');
  await page.goto('http://localhost:3000/#conversas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const toggleBtn = await page.$('#btn-contact-menu-toggle');
  if (toggleBtn) {
    await toggleBtn.click();
    await page.waitForTimeout(300);
  }

  const hasCrmOption = await page.evaluate(() => {
    return !!document.querySelector('#btn-action-view-crm') || 
           Array.from(document.querySelectorAll('.contact-dropdown-item')).some(el => el.textContent.includes('Ver cadastro no CRM'));
  });
  console.log('Has "Ver cadastro no CRM" option:', hasCrmOption);

  await page.screenshot({ path: path.join(printsDir, '25-menu-contato-sem-crm-light.png') });
  console.log('Saved 25-menu-contato-sem-crm-light.png');

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(printsDir, '26-menu-contato-sem-crm-dark.png') });
  console.log('Saved 26-menu-contato-sem-crm-dark.png');

  await browser.close();
  console.log('Test completed successfully!');
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
