// server/server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT;

// ===== Middlewares =====
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data

// ===== Basic Route =====
app.get("/", (req, res) => {
  res.send("Mess Management Server is running!");
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
