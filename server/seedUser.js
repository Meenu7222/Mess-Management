// server/seedUsers.js
const bcrypt = require("bcrypt");
const pool = require("./config/db"); // your db config

async function seedUser() {
  const users = [
    { name: "Chandrettan", email: "chandrettan112@gmail.com", password: "admin123", role: "admin" },
    { name: "Sohan", email: "Sohan@gmail.com", password: "stud123", role: "student" },
    { name: "Rohan", email: "rohan@gmail.com", password: "pass456", role: "student" }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      [user.name, user.email, hashedPassword, user.role]
    );
    console.log(`${user.email} inserted.`);
  }

  console.log("Seeding complete.");
  process.exit();
}

seedUser();
