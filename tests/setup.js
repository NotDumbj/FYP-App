const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function buildDriver() {
    let options = new chrome.Options();

    options.addArguments("--disable-notifications");
    options.addArguments("--disable-infobars");
    options.addArguments("--disable-save-password-bubble"); // 🔥 IMPORTANT
    options.addArguments("--disable-password-manager-reauthentication");
    options.addArguments("--disable-features=PasswordLeakDetection");
    options.addArguments("--headless");
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    return await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();
}

module.exports = { buildDriver };