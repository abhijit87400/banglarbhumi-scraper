const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let page; // Puppeteer Page globally রাখা হয়েছে

// ✅ Home Route
app.get('/', (req, res) => {
  res.send('✅ Banglarbhumi Automation Server Running!');
});

// ✅ Get Captcha API
app.get('/getCaptcha', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();

    await page.goto('https://banglarbhumi.gov.in/BanglarBhumi/Home.action', { waitUntil: 'networkidle2' });

    // Popup Auto Close
    await page.evaluate(() => {
      const popup = document.getElementById('close-popup');
      if (popup) popup.click();
    });

    await page.waitForSelector('#knowYourProperty', { timeout: 10000 });
    await page.click('#knowYourProperty');

    await page.waitForSelector('#captchaImage', { timeout: 10000 });

    // Capture Captcha
    const captchaImage = await page.$('#captchaImage');
    const captchaBase64 = await captchaImage.screenshot({ encoding: 'base64' });

    res.json({ success: true, captcha: captchaBase64 });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get captcha" });
  }
});

// ✅ Login API (loginAndSearchPlot)
app.post('/loginAndSearchPlot', async (req, res) => {
  const { username, password, captchaInput } = req.body;

  if (!username || !password || !captchaInput) {
    return res.status(400).json({ success: false, message: "username, password, captchaInput required" });
  }

  try {
    await page.type('#username', username);
    await page.type('#password', password);
    await page.type('#txtInput', captchaInput);

    await Promise.all([
      page.click('#loginsubmit'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // After login, you can continue plotting search or profile fetch
    res.json({ success: true, message: "✅ Login successful!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// ✅ Server Listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
