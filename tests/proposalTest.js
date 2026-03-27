const { Builder, By, until, Key } = require("selenium-webdriver");
const path = require("path");
const { buildDriver } = require("./setup");

async function proposalTest() {
    let driver = await buildDriver();

    try {
        await driver.get("http://localhost:3000/login");

        // LOGIN
        let emailField = await driver.wait(
            until.elementLocated(By.xpath("//input[@type='text']")), 10000
        );

        await emailField.sendKeys("student@test.com");
        await driver.findElement(By.xpath("//input[@type='password']")).sendKeys("123456");
        await driver.findElement(By.xpath("//button[contains(., 'Sign In')]")).click();

        await driver.wait(until.urlContains("dashboard"), 10000);

        // CLICK REGISTER BUTTON
        let proposalBtn = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Register FYP Topic')]")),
            10000
        );

        await driver.wait(until.elementIsVisible(proposalBtn), 5000);
        await proposalBtn.click();

        // WAIT PAGE LOAD PROPERLY
        await driver.wait(until.urlContains("submit-proposal"), 10000);

        // 🔥 WAIT UNTIL FORM IS FULLY LOADED (IMPORTANT)
        await driver.sleep(2000);

        // TITLE (use contains for safety)
        let title = await driver.wait(
            until.elementLocated(By.xpath("//input[contains(@name,'title')]")),
            10000
        );
        await driver.wait(until.elementIsVisible(title), 5000);
        await title.sendKeys("AI Project");

        // DESCRIPTION
        let desc = await driver.findElement(By.xpath("//textarea"));
        await desc.sendKeys("FYP system");

        // OPEN DROPDOWN
        let dropdown = await driver.findElement(
            By.xpath("//div[contains(@class,'MuiSelect-select')]")
        );

        await driver.executeScript("arguments[0].scrollIntoView(true);", dropdown);
        await driver.sleep(500);
        await dropdown.click();

        // 🔥 WAIT OPTIONS
        let options = await driver.wait(
            until.elementsLocated(By.xpath("//li[@role='option']")),
            5000
        );

        // 🔥 CLICK FIRST OPTION PROPERLY
        await driver.actions().move({ origin: options[0] }).click().perform();

        // 🔥 FORCE CLOSE DROPDOWN (VERY IMPORTANT)
        await driver.actions().sendKeys(Key.ESCAPE).perform();

        // WAIT BACKDROP TO DISAPPEAR
        await driver.wait(
            until.stalenessOf(options[0]),
            5000
        );

        // 🔥 FILE UPLOAD (hidden input fix)
        let fileInput = await driver.findElement(By.xpath("//input[@type='file']"));

        let filePath = path.resolve(__dirname, "testfile.pdf");
        await fileInput.sendKeys(filePath);

        // SUBMIT BUTTON
        let submitBtn = await driver.findElement(
            By.xpath("//button[contains(., 'Submit Proposal')]")
        );

        await driver.executeScript("arguments[0].scrollIntoView(true);", submitBtn);
        await driver.sleep(500);
        await submitBtn.click();

        console.log("✅ Proposal Test Passed");
        return true;

    } catch (error) {
        console.log("❌ Proposal Test Failed");
        console.log(error.message);
        return false;

    } finally {
        await driver.quit();
    }
}

module.exports = proposalTest;