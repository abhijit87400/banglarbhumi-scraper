const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let page; // Puppeteer Page globally

app.get('/', (req, res) => {
  res.send('✅ Banglarbhumi Automation Server is Running!');
});

// Captcha Route
app.get('/getCaptcha', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  page = await browser.newPage();

  await page.goto('https://banglarbhumi.gov.in/BanglarBhumi/Home.action', { waitUntil: 'domcontentloaded' });

  // Close popup if found
  await page.evaluate(() => {
    const closeBtn = document.getElementById('close-popup');
    if (closeBtn) closeBtn.click();
  });

  // Wait and click Know Your Property
  await page.waitForSelector('#knowYourProperty');
  await page.click('#knowYourProperty');

  await page.waitForSelector('#captchaImage');
  const captchaImage = await page.$('#captchaImage');
  const captchaBase64 = await captchaImage.screenshot({ encoding: 'base64' });

  res.json({ success: true, captcha: captchaBase64 });
});

// Login Route
app.post('/loginAndSearchPlot', async (req, res) => {
  const { username, password, captchaInput } = req.body;

  if (!username || !password || !captchaInput) {
    return res.status(400).json({ success: false, message: "username, password, captchaInput required" });
  }

  await page.type('#username', username);
  await page.type('#password', password);
  await page.type('#txtInput', captchaInput);

  await Promise.all([
    page.click('#loginsubmit'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  res.json({ success: true, message: "✅ Login Successful" });
});

// Server listen properly (VERY IMPORTANT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
