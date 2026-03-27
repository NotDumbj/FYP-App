const { By, until } = require("selenium-webdriver");
const { buildDriver } = require("./setup");

async function loginTest() {

    let driver = await buildDriver();

    try {
        await driver.get("http://localhost:3000/login");

        let emailField = await driver.wait(
            until.elementLocated(By.xpath("//input[@type='text']")),
            10000
        );

        let passwordField = await driver.findElement(By.xpath("//input[@type='password']"));

        let loginBtn = await driver.findElement(
            By.xpath("//button[contains(., 'Sign In')]")
        );

        await emailField.sendKeys("Jibran@crystalsystem.com");
        await passwordField.sendKeys("2coco2");

        await loginBtn.click();

        await driver.wait(async () => {
            let url = await driver.getCurrentUrl();
            return (
                url.includes("student-dashboard") ||
                url.includes("coordinator-dashboard") ||
                url.includes("supervisor-dashboard") ||
                url.includes("panelist-dashboard")
                );
        }, 10000);

        console.log("✅ Login Test Passed");
        return true;

    } catch (error) {
        console.log("❌ Login Test Failed");
        console.log(error.message);
        return false;

    } finally {
        await driver.quit();
    }
}

module.exports = loginTest;