const mongoose = require("mongoose");
require("dotenv").config();

// import models
const User = require("./models/User");
const Project = require("./models/Project");
const Submission = require("./models/Submission");
const Settings = require("./models/Settings");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // 🔥 CLEAR DATABASE
    await User.deleteMany({});
    await Project.deleteMany({});
    await Submission.deleteMany({});
    await Settings.deleteMany({});

    // =========================
    // USERS
    // =========================
    await User.create({
        _id: "693896276045e1cee4be29d8",
        buid: "01-131232-062",
        email: "Jibran@crystalsystem.com",
        password: "$2b$10$hSuEgDYqjkZAx2S1cRx09uXiDs10cJ1D6HORInUIA7Qwus7I3lEkS",
        role: "student",
        profile: {
            fullName: "Muhammad Jibran"
        },
        availability: []
    });

    const users = await User.insertMany([
      {
        buid: "01-TEST-001",
        email: "student@test.com",
        password: "$2b$10$WAyYaT/mrRanhTilqGnmzO1TUQY9MncAxQloAxQJTKn1lkLdeRVYK",
        role: "student",
        profile: { fullName: "Test Student" },
        availability: []
      },
      {
        buid: "01-TEST-002",
        email: "coordinator@test.com",
        password: "$2b$10$p4pUN2UqEkyX3RpgjXgq/es/KSfzCmkY5KBHI60W8JbU6goXULBgC",
        role: "coordinator",
        profile: { fullName: "Test Coordinator" },
        availability: []
      },
      {
        buid: "01-TEST-003",
        email: "supervisor@test.com",
        password: "$2b$10$9gcE0N6s6Rc2dIiUM.W7pOPaPDH7uEouscKFgRsIu.eOqWg0Lzxzu",
        role: "supervisor",
        profile: { fullName: "Test Supervisor" },
        availability: [
          {
            day: "Monday",
            slots: ["09:00-10:00", "10:00-11:00"]
          },
          {
            day: "Tuesday",
            slots: ["11:00-12:00"]
          }
        ]
      },
      {
        buid: "01-TEST-004",
        email: "panelist@test.com",
        password: "$2b$10$JYiNQ1CRZ8WoWwFIfVBNVO6saFwCbD0mjWFB5SaEctcnvBtUvolw2",
        role: "panelist",
        profile: { fullName: "Test Panelist" },
        availability: []
      }
    ]);

    const student = users.find(u => u.role === "student");
    const supervisor = users.find(u => u.role === "supervisor");

    // =========================
    // SETTINGS
    // =========================
    await Settings.create({
      key: "global_config",
      allowProposals: true
    });

    // =========================
    // PROJECTS
    // =========================
    const project = await Project.create({
      title: "AI Project",
      description: "FYP system",
      studentId: student._id,
      teamMembers: [student._id],
      supervisorId: supervisor._id,
      status: "registered",
      plagiarismScore: 0,
      hasMidtermPresentation: false,
      hasFinalReport: false,
      marks: {
        supervisorLogs: 0,
        midterm: 0,
        finalViva: 0,
        total: 0
      }
    });

    // =========================
    // SUBMISSIONS
    // =========================
    await Submission.insertMany([
      {
        projectId: project._id,
        studentId: student._id,
        title: "Initial Proposal",
        fileUrl: "http://localhost:5000/uploads/test.pdf",
        type: "proposal",
        status: "submitted"
      },
      {
        projectId: project._id,
        studentId: student._id,
        title: "Final Report",
        fileUrl: "http://localhost:5000/uploads/test2.pdf",
        type: "report",
        status: "submitted"
      }
    ]);


    // =========================
    // RESOURCES
    // =========================

    await Resource.insertMany([
        {
            title: "Project Proposal",
            fileUrl: "http://localhost:5000/uploads/sample.pdf",
            deadline: new Date("2026-04-20"),
            uploadedBy: coordinatorId, // use seeded coordinator _id
            phase: "proposal"
        },
        {
            title: "Upload Proposal",
            fileUrl: "http://localhost:5000/uploads/sample2.docx",
            deadline: new Date("2026-04-25"),
            uploadedBy: coordinatorId,
            phase: "proposal"
        }
    ]);

    console.log("✅ Database Seeded Successfully");
    process.exit();

  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
}

seed();