const { By, until, Key } = require("selenium-webdriver");
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

        // WAIT DASHBOARD
        await driver.wait(until.urlContains("dashboard"), 10000);
        console.log("After login:", await driver.getCurrentUrl());

        // CLICK SIDEBAR "New Proposal"
        let newProposalBtn = await driver.wait(
            until.elementLocated(By.xpath("//span[text()='New Proposal']")),
            10000
        );

        await driver.wait(until.elementIsVisible(newProposalBtn), 5000);
        await driver.executeScript("arguments[0].click();", newProposalBtn);

        // WAIT PAGE
        await driver.wait(until.urlContains("submit-proposal"), 10000);
        console.log("Reached:", await driver.getCurrentUrl());

        // WAIT FORM LOAD
        await driver.wait(
            until.elementLocated(By.xpath("//h4[contains(., 'Register FYP Topic')]")),
            10000
        );

        // TITLE
        let title = await driver.findElement(By.xpath("//input[@name='title']"));
        await title.sendKeys("AI Project");

        // DESCRIPTION
        let desc = await driver.findElement(By.xpath("//textarea[@name='description']"));
        await desc.sendKeys("FYP system");

        // DROPDOWN (SUPER FIXED 🔥)
        let dropdown = await driver.findElement(By.xpath("//div[@role='combobox']"));

        await driver.executeScript("arguments[0].scrollIntoView(true);", dropdown);
        await driver.sleep(500);

        await driver.executeScript("arguments[0].click();", dropdown);

        // WAIT OPTIONS (more flexible selector)
        let options = await driver.wait(
            until.elementsLocated(By.xpath("//ul//li")),
            10000
        );

        await driver.wait(until.elementIsVisible(options[0]), 5000);

        await driver.executeScript("arguments[0].click();", options[0]);

        // FILE UPLOAD
        let fileInput = await driver.findElement(By.xpath("//input[@type='file']"));
        let filePath = path.resolve(__dirname, "testfile.pdf");
        await fileInput.sendKeys(filePath);

        // SUBMIT
        let submitBtn = await driver.findElement(
            By.xpath("//button[contains(., 'Submit Proposal')]")
        );

        await driver.executeScript("arguments[0].scrollIntoView(true);", submitBtn);
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", submitBtn);

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