const loginTest = require("./loginTest");
const proposalTest = require("./proposalTest");
const scheduleTest = require("./scheduleTest");

async function runAllTests() {

    console.log("🚀 Running Selenium Test Suite...\n");

    let results = [];

    results.push({ name: "Login Test", result: await loginTest() });
    results.push({ name: "Proposal Test", result: await proposalTest() });
    results.push({ name: "Schedule Test", result: await scheduleTest() });

    console.log("\n📊 Test Summary:");

    let passed = 0;

    results.forEach(test => {
        console.log(`${test.name}: ${test.result ? "PASSED ✅" : "FAILED ❌"}`);
        if (test.result) passed++;
    });

    console.log(`\nTotal: ${passed}/${results.length} tests passed`);
}

runAllTests();