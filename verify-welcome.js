const { chromium } = require('playwright');
const path = require('path');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const scratchpad = 'E:/Insurance/InsuraFlow-CRM/InsuraFlow-CRM';
  
  try {
    // Desktop welcome
    const page = await browser.newPage();
    page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(scratchpad, 'welcome-desktop-new.png') });
    console.log('✅ Desktop welcome screenshot');
    await page.close();
    
    // Mobile welcome
    const mobile = await browser.newPage();
    mobile.setViewportSize({ width: 375, height: 667 });
    await mobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await mobile.screenshot({ path: path.join(scratchpad, 'welcome-mobile-new.png') });
    console.log('✅ Mobile welcome screenshot');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

verify();
