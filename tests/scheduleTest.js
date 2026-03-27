const { By, until } = require("selenium-webdriver");
const { buildDriver } = require("./setup");

async function scheduleTest() {
    let driver = await buildDriver();

    try {
        await driver.get("http://localhost:3000/login");

        // LOGIN
        let emailField = await driver.wait(
            until.elementLocated(By.xpath("//input[@type='text']")),
            10000
        );

        await emailField.sendKeys("coordinator@test.com");
        await driver.findElement(By.xpath("//input[@type='password']")).sendKeys("123456");

        await driver.findElement(By.xpath("//button[contains(., 'Sign In')]")).click();

        // WAIT FOR DASHBOARD
        await driver.wait(until.urlContains("dashboard"), 10000);

        await driver.get("http://localhost:3000/schedule-defense");

        // WAIT FOR PAGE
        await driver.wait(until.urlContains("schedule-defense"), 10000);

        // CLICK GENERATE BUTTON
        let generateBtn = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Generate Schedule')]")),
            10000
        );

        await generateBtn.click();

        console.log("✅ Schedule Test Passed");
        return true;

    } catch (error) {
        console.log("❌ Schedule Test Failed");
        console.log(error.message);
        return false;

    } finally {
        await driver.quit();
    }
}

module.exports = scheduleTest;