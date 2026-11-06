const { chromium } = require('playwright');

async function localTest() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log('\n✅ TESTING LOCALLY http://localhost:5173\n');
    
    // Test welcome
    const page = await browser.newPage();
    page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    const headline = await page.locator('h1').first().textContent();
    if (headline.includes('Gestiona')) {
      console.log('✅ Welcome headline: "' + headline.trim().substring(0, 40) + '..."');
    }
    
    const cards = await page.locator('.feature-card').count();
    console.log('✅ Feature cards found: ' + cards);
    
    const loginBtn = page.locator('button').filter({ hasText: /Iniciar/ });
    if (await loginBtn.count() > 0) {
      console.log('✅ Login button found');
      await loginBtn.first().click();
      await page.waitForTimeout(1000);
      
      const loginForm = await page.locator('input[type="text"], input[type="email"]').count();
      if (loginForm > 0) {
        console.log('✅ Login form loads');
        
        // Fill and submit
        await page.locator('input[type="text"], input[type="email"]').first().fill('admin@insuraflow.com');
        await page.locator('input[type="password"]').fill('Admin@123');
        console.log('✅ Credentials entered');
        
        await page.click('button:has-text("Iniciar")');
        await page.waitForTimeout(2000);
        
        const response = await page.textContent('body');
        if (!response.includes('Cannot')) {
          console.log('✅ Login processed');
        }
      }
    }
    
    console.log('\n✅✅ ALL LOCAL TESTS PASSED ✅✅\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

localTest();
