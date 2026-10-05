import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  await page.goto('http://localhost:3001/#editar-agente');
  await page.waitForTimeout(1000);

  // Take screenshot in Light Mode
  await page.screenshot({ path: 'prints/13-novo-comportamento-light.png', fullPage: false });

  // Click on Dinamico card
  await page.click('.persona-card[data-persona="dinamico"]');
  // Toggle a chip
  await page.click('.behavior-chip[data-chip="foco-agendamento"]');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'prints/14-novo-comportamento-interacao.png', fullPage: false });

  // Open Template menu
  await page.click('#btn-open-templates');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'prints/15-templates-aberto.png', fullPage: false });

  // Switch to Dark Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.click('body'); // close menu
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'prints/16-novo-comportamento-dark.png', fullPage: false });

  await browser.close();
  console.log('Visual test screenshots taken successfully!');
})();
