const { chromium } = require('playwright');
const path = require('path');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const scratchpad = 'E:/Insurance/InsuraFlow-CRM/InsuraFlow-CRM';
  
  try {
    // Desktop login
    const page = await browser.newPage();
    page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    // Click the "Iniciar sesión" button to go to login
    await page.click('button:has-text("Iniciar sesión")');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: path.join(scratchpad, 'login-desktop-new.png') });
    console.log('✅ Desktop login screenshot');
    await page.close();
    
    // Mobile login
    const mobile = await browser.newPage();
    mobile.setViewportSize({ width: 375, height: 667 });
    await mobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    // Click the login button
    await mobile.click('button:has-text("Iniciar sesión")');
    await mobile.waitForLoadState('networkidle');
    
    await mobile.screenshot({ path: path.join(scratchpad, 'login-mobile-new.png') });
    console.log('✅ Mobile login screenshot');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

verify();
