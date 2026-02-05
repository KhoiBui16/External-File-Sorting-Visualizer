const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('External Sort Visualization E2E', () => {
    
    test.beforeEach(async ({ page }) => {
        // Debugging logs from browser
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));
        page.on('dialog', async dialog => {
            console.log(`BROWSER ALERT: ${dialog.message()}`);
            await dialog.dismiss();
        });

        // Assuming app is served at localhost:3001
        // Adjust port if necessary based on user context
        await page.goto('http://localhost:3001');
    });

    test('Full Flow: Sort Random Data', async ({ page }) => {
        // --- PHASE 1: CONFIGURATION ---
        console.log('Step 1: Checking Config Page');
        await expect(page.locator('#view-config')).toBeVisible();
        await expect(page.locator('#view-viz')).toBeHidden();

        // Generate Data (Small 20)
        console.log('Step 2: Generating Data');
        await page.click('#btnGenSmall');
        
        // Check Preview Table
        await expect(page.locator('#previewBody tr')).toHaveCount(10 + 1); // 10 rows + 1 "more" row or just 20
        // Wait for stats calculation
        await expect(page.locator('#estChunks')).not.toBeEmpty();

        // Start Simulation
        console.log('Step 3: Starting Simulation');
        await page.click('#btnStartSimulation');

        // --- PHASE 2: VISUALIZATION ---
        console.log('Step 4: Checking Visualization Page');
        await expect(page.locator('#view-viz')).toBeVisible();
        await expect(page.locator('#view-config')).toBeHidden();

        // Increase Speed to Max to finish fast
        // Slider value logic: 100 (slow) to 2000 (fast) in UI value, but logic was inverted in code?
        // Let's just wait. Simulation for 20 items is fast.
        
        // Wait for "Run Generation" Phase
        await expect(page.locator('#vizPhaseTitle')).toContainText('Giai đoạn 1', { timeout: 5000 });
        
        // Wait for Completion (View Switch to Results)
        console.log('Step 5: Waiting for Completion');
        // This might take a while depending on speed
        await expect(page.locator('#view-result')).toBeVisible({ timeout: 60000 });

        // --- PHASE 3: RESULTS ---
        console.log('Step 6: Checking Results Page');
        await expect(page.locator('text=Sắp xếp hoàn tất!')).toBeVisible();
        
        // Check Metrics
        const steps = await page.locator('#resTotalSteps').innerText();
        const compares = await page.locator('#resTotalCompares').innerText();
        console.log(`Steps: ${steps}, Compares: ${compares}`);
        
        expect(parseInt(steps)).toBeGreaterThan(0);
        expect(parseInt(compares)).toBeGreaterThan(0);

        // Check Result Table
        await expect(page.locator('#resultTableBody tr')).not.toHaveCount(0);
    });

    test('Responsive UI Check', async ({ page }) => {
        // Check if sidebar toggle or layout holds up (basic check)
        await expect(page.locator('aside')).toBeVisible();
        await expect(page.locator('#dropZone')).toBeVisible();
    });
});
