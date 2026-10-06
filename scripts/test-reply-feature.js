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

  console.log('Navigating to http://localhost:3000/#conversas...');
  await page.goto('http://localhost:3000/#conversas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 1. Hover on the last message bubble to show chevron
  const lastBubble = page.locator('.message-row:not(.system) .message-bubble').last();
  await lastBubble.hover();
  await page.waitForTimeout(300);

  // 2. Click the chevron button to open the "Responder" dropdown
  const chevronBtn = lastBubble.locator('.message-chevron-btn');
  await chevronBtn.click();
  await page.waitForTimeout(400);

  // Screenshot of the open dropdown matching the user's screenshot
  await page.screenshot({ path: path.join(printsDir, '13-dropdown-responder.png') });
  console.log('Saved 13-dropdown-responder.png');

  // Zoomed in screenshot of just the bubble and dropdown menu
  await lastBubble.screenshot({ path: path.join(printsDir, '13-dropdown-responder-zoom.png') });
  console.log('Saved 13-dropdown-responder-zoom.png');

  // 3. Click "Responder"
  const replyItem = page.locator('.message-dropdown-item.btn-reply-msg');
  await replyItem.click();
  await page.waitForTimeout(400);

  // Screenshot with reply preview bar open above input
  await page.screenshot({ path: path.join(printsDir, '14-barra-responder-ativa.png') });
  console.log('Saved 14-barra-responder-ativa.png');

  // 4. Type a message in the input and send
  const input = page.locator('#chat-input-textarea');
  await input.fill('Temos também 15% de desconto especial para pagamento anual!');
  await page.waitForTimeout(300);

  const sendBtn = page.locator('#btn-send-chat-msg');
  await sendBtn.click();
  await page.waitForTimeout(600);

  // Screenshot showing the message sent with the quote box
  await page.screenshot({ path: path.join(printsDir, '15-mensagem-respondida-com-citacao.png') });
  console.log('Saved 15-mensagem-respondida-com-citacao.png');

  // 5. Test dark mode
  const themeBtn = page.locator('#theme-toggle-btn');
  if (await themeBtn.isVisible()) {
    await themeBtn.click();
    await page.waitForTimeout(400);

    // Hover and open dropdown in dark mode
    const botBubble = page.locator('.message-row.bot .message-bubble').first();
    await botBubble.hover();
    await botBubble.locator('.message-chevron-btn').click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(printsDir, '16-dropdown-responder-dark.png') });
    console.log('Saved 16-dropdown-responder-dark.png');
  }

  await browser.close();
  console.log('All reply feature tests passed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
