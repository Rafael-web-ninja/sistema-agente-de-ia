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

  // 1. Open dropdown on first row (Lucas Gomes) or Amanda Moreira
  const moreBtns = await page.$$('.btn-lead-more-actions');
  console.log('Found more action buttons:', moreBtns.length);
  if (moreBtns.length > 0) {
    await moreBtns[0].click();
    await page.waitForTimeout(300);
  }

  // Verify that "Alterar Status" header and buttons are NOT present in the dropdown
  const statusHeader = await page.$('.lead-status-submenu-header');
  const statusGrid = await page.$('.lead-status-options-grid');
  console.log('Status Header in dropdown exists:', !!statusHeader);
  console.log('Status Grid in dropdown exists:', !!statusGrid);

  // Take screenshot in Light mode
  await page.screenshot({ path: path.join(printsDir, '27-leads-dropdown-sem-status-light.png') });
  console.log('Saved 27-leads-dropdown-sem-status-light.png');

  // Dark mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(printsDir, '28-leads-dropdown-sem-status-dark.png') });
  console.log('Saved 28-leads-dropdown-sem-status-dark.png');

  await browser.close();
  console.log('Test completed successfully!');
}

test().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
