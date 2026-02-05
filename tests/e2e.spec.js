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

        // Generate Data (use input + button)
        console.log('Step 2: Generating Data');
        await page.fill('#randomCountInput', '20');
        await page.click('#btnGenRandom');
        
        // Check Preview Table (may show 10 rows + 1 "more" row, or all 20)
        await expect(page.locator('#previewBody tr').first()).toBeVisible();
        // Wait for stats calculation
        await expect(page.locator('#estChunks')).not.toBeEmpty();

        // Start Simulation
        console.log('Step 3: Starting Simulation');
        await page.click('#btnStartSimulation');

        // --- PHASE 2: VISUALIZATION ---
        console.log('Step 4: Checking Visualization Page');
        await expect(page.locator('#view-viz')).toBeVisible();
        await expect(page.locator('#view-config')).toBeHidden();

        // Set Speed to Maximum (2000) to finish fast
        await page.fill('#speedSlider', '2000');
        // Trigger input event to update delay
        await page.dispatchEvent('#speedSlider', 'input');
        
        // Wait for "Run Generation" Phase
        await expect(page.locator('#vizPhaseTitle')).toContainText('Giai đoạn 1', { timeout: 5000 });
        
        // Wait for Completion (View Switch to Results)
        console.log('Step 5: Waiting for Completion');
        // This might take a while depending on speed
        await expect(page.locator('#view-result')).toBeVisible({ timeout: 60000 });

        // --- PHASE 3: RESULTS ---
        console.log('Step 6: Checking Results Page');
        // Use specific h1 with emoji to avoid strict mode violation
        await expect(page.getByRole('heading', { name: '🎉 Sắp xếp hoàn tất!' })).toBeVisible();
        
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
        // Use .first() since there are 2 aside elements (config + viz)
        await expect(page.locator('aside').first()).toBeVisible();
        await expect(page.locator('#dropZone')).toBeVisible();
    });
});
