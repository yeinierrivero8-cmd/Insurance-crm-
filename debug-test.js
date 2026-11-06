const { chromium } = require('playwright');

async function debugTest() {
  const browser = await chromium.launch({ headless: false }); // Show browser
  
  try {
    const page = await browser.newPage();
    page.setViewportSize({ width: 1440, height: 900 });
    
    console.log('Opening https://insurance-crm.onrender.com...');
    await page.goto('https://insurance-crm.onrender.com', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('Page loaded. Waiting 3 seconds...');
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    console.log('\nPage HTML length:', html.length);
    console.log('Contains "Gestiona":', html.includes('Gestiona'));
    console.log('Contains "feature-card":', html.includes('feature-card'));
    console.log('Contains "Insurance CRM":', html.includes('Insurance CRM'));
    
    const allText = await page.locator('body').textContent();
    console.log('\nPage text (first 200 chars):');
    console.log(allText.substring(0, 200));
    
    await page.screenshot({ path: 'E:/Insurance/InsuraFlow-CRM/InsuraFlow-CRM/debug-screenshot.png' });
    console.log('\nScreenshot saved');
    
    // Don't close browser, keep it open for 10 seconds so you can see
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugTest();
