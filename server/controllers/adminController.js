const pool = require("../config/db");

// ─────────────────────────────────────────────
// 1. Add a food item for a specific date
// POST /api/admin/addItem
exports.addFoodItem = async (req, res) => {
  const { name, price, date_available } = req.body;

  if (!name || !price || !date_available) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Validate price is a number
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: "Price must be a valid positive number" });
    }

    // Validate date format
    const date = new Date(date_available);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    await pool.query(
      `INSERT INTO food_items (name, price, date_available)
       VALUES ($1, $2, $3)`,
      [name, numericPrice, date_available]
    );
    res.status(201).json({ message: "Food item added successfully" });
  } catch (err) {
    console.error("Add Food Item Error:", err);
    
    // Handle duplicate entries or other specific errors
    if (err.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ message: "This food item already exists for this date" });
    }
    
    res.status(500).json({ 
      message: "Failed to add food item", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// ─────────────────────────────────────────────
// 2. Get today's order summary (item → count)
// GET /api/admin/todaySummary
exports.viewTodaySummary = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.name AS food_item, COUNT(*) AS total_orders
       FROM orders o
       JOIN food_items f ON o.food_item_id = f.id
       WHERE DATE(o.booking_for_date) = CURRENT_DATE+1
       GROUP BY f.name
       ORDER BY total_orders DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Today's Summary Error:", err);
    res.status(500).json({ 
      message: "Error fetching today's summary",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// ─────────────────────────────────────────────
// 3. Detailed list of today's orders
// GET /api/admin/todayDetails
exports.viewTodayDetails = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.name AS student_name, f.name AS food_item, o.created_at
       FROM orders o
       JOIN users u ON o.student_id = u.id
       JOIN food_items f ON o.food_item_id = f.id
       WHERE DATE(o.booking_for_date) = CURRENT_DATE
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Detailed Order Error:", err);
    res.status(500).json({ 
      message: "Error fetching detailed orders",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// ─────────────────────────────────────────────
// 4. Monthly sales history summary
// GET /api/admin/salesHistory?month=12 (month number)
exports.viewSalesHistory = async (req, res) => {
  const { month } = req.query;

  if (!month || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: "Valid month (1-12) required" });
  }

  try {
    const currentYear = new Date().getFullYear();
    const monthStr = month.toString().padStart(2, '0');
    const yearMonth = `${currentYear}-${monthStr}`;

    const result = await pool.query(
      `SELECT 
         DATE(o.booking_for_date) as date,
         SUM(f.price) as total
       FROM orders o
       JOIN food_items f ON o.food_item_id = f.id
       WHERE TO_CHAR(o.booking_for_date, 'YYYY-MM') = $1
       GROUP BY DATE(o.booking_for_date)
       ORDER BY date ASC`,
      [yearMonth]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Sales History Error:", err);
    res.status(500).json({ 
      message: "Error fetching sales history",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};