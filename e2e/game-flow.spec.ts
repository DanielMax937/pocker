import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE = 'http://localhost:3040';

test.describe('Poker Game Flow', () => {
  test.beforeAll(() => {
    fs.mkdirSync('screenshots', { recursive: true });
  });

  test('navigate, start game, take action, screenshot', async ({ page }) => {
    // Step 1: Navigate to play page
    await page.goto(`${BASE}/play`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/step1_play_initial.png' });

    // Step 2: Find and click "Start New Game" (or similar)
    const startBtn = page.locator('button').filter({ hasText: /Start|开始/i }).first();
    const hasStart = await startBtn.count() > 0;
    if (hasStart) {
      await startBtn.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'screenshots/step2_after_start.png' });
    }

    // Step 3: If Fold button visible, click it
    const foldBtn = page.getByRole('button', { name: /Fold/i });
    if (await foldBtn.isVisible().catch(() => false)) {
      await foldBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/step3_after_fold.png' });
    }

    // Step 4: Final state
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/step4_final.png' });
  });
});
