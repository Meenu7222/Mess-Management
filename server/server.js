const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middlewares =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/student", require("./routes/studentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ===== Basic Route =====
app.get("/", (req, res) => {
  res.send("Mess Management Server is running!");
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
