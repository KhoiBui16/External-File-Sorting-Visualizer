const { test, expect } = require('@playwright/test');

test('sanity check', async ({ page }) => {
    console.log('Sanity test running');
    await page.goto('data:text/html,<html><title>Test</title><body><h1>Hello</h1></body></html>');
    await expect(page).toHaveTitle('Test');
    console.log('Sanity test passed');
});
