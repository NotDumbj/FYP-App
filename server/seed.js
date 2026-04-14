const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User"); // adjust path if needed

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);

    // clear old test users (optional)
    await User.deleteMany({ email: "student@test.com" });

    // create test user
    await User.create({
        name: "Test Student",
        email: "student@test.com",
        password: "123456", // make sure your model hashes it
        role: "student"
    });

    console.log("✅ Seeded test user");

    process.exit();
}

seed();