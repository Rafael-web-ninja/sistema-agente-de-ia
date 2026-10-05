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

  await page.goto('http://localhost:3001/#conversas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Dark Mode Test
  await page.click('#theme-toggle-btn');
  await page.waitForTimeout(400);

  // Open popover in dark mode
  await page.click('#chat-filter-btn');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(printsDir, '5-darkmode-filtro-aberto.png') });
  console.log('Saved 5-darkmode-filtro-aberto.png');

  // Apply filters that yield no results to test empty state
  await page.click('#filter-channel-group button[data-filter-val="Widget"]');
  await page.waitForTimeout(200);
  await page.click('#filter-status-group button[data-filter-val="Em atendimento"]');
  await page.waitForTimeout(200);
  await page.click('#btn-filter-apply');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(printsDir, '6-darkmode-empty-state.png') });
  console.log('Saved 6-darkmode-empty-state.png');

  // Test reset button in empty state
  const resetBtn = await page.$('#btn-empty-clear-filters');
  if (resetBtn) {
    await resetBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(printsDir, '7-darkmode-pos-reset.png') });
    console.log('Saved 7-darkmode-pos-reset.png');
  }

  // Back to light mode
  await page.click('#theme-toggle-btn');
  await page.waitForTimeout(300);

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
