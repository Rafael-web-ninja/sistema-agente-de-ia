import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Click on "Conversas" nav link
  console.log('Clicking Conversas link...');
  const conversasLink = page.locator('a.nav-link[data-target="conversas"]');
  await conversasLink.click();
  await page.waitForTimeout(1000);

  // Take screenshot of Conversas view in Light Mode
  await page.screenshot({ path: 'prints/attendance-tags-light.png' });
  console.log('Saved prints/attendance-tags-light.png');

  // Click on "Gustavo Nogueira" (which has "Aguardando humano")
  console.log('Looking for Gustavo Nogueira...');
  const gustavoItem = page.locator('.chat-thread-item:has-text("Gustavo Nogueira")');
  await gustavoItem.scrollIntoViewIfNeeded();
  await gustavoItem.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'prints/attendance-waiting-open.png' });
  console.log('Saved prints/attendance-waiting-open.png');

  // Click "Assumir" to see it transition to "Humano atendendo"
  console.log('Clicking Assumir button...');
  const assumeBtn = page.locator('#btn-header-assume');
  await assumeBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'prints/attendance-after-assume.png' });
  console.log('Saved prints/attendance-after-assume.png');

  // Click on Beatriz Lima (which has "Humano atendendo")
  console.log('Looking for Beatriz Lima...');
  const beatrizItem = page.locator('.chat-thread-item:has-text("Beatriz Lima")');
  await beatrizItem.scrollIntoViewIfNeeded();
  await beatrizItem.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'prints/attendance-human-open.png' });
  console.log('Saved prints/attendance-human-open.png');

  // Toggle Dark Mode
  console.log('Switching to Dark Mode...');
  const themeToggle = page.locator('#theme-toggle, .theme-toggle-btn');
  if (await themeToggle.count() > 0) {
    await themeToggle.first().click();
  } else {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'prints/attendance-tags-dark.png' });
  console.log('Saved prints/attendance-tags-dark.png');

  await browser.close();
  console.log('Verification finished successfully!');
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
