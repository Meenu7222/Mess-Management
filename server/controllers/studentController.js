const pool = require("../config/db");

// View menu for a specific date
exports.getMenu = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date parameter is required" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM food_items WHERE date_available = $1 ORDER BY name`,
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get Menu Error:", err);
    res.status(500).json({ 
      message: "Error fetching menu",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// Book a food item
exports.bookItem = async (req, res) => {
  const { date, itemId } = req.body; // Changed to match frontend
  const user_id = req.user.id;

  if (!date || !itemId) {
    return res.status(400).json({ message: "Date and item ID are required" });
  }

  try {
    // Check if food item exists and is available for the date
    const itemCheck = await pool.query(
      `SELECT * FROM food_items WHERE id = $1 AND date_available = $2`,
      [itemId, date]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ message: "Food item not available for this date" });
    }

    // Check if user already has a booking for this date
    const existingBooking = await pool.query(
      `SELECT * FROM orders WHERE student_id = $1 AND booking_for_date = $2`,
      [user_id, date]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(409).json({ message: "You already have a booking for this date" });
    }

    const now = new Date();
    const bookingDate = new Date(date);

    // Allowed booking: previous day 11:00 AM to booking day 10:30 AM
    const openTime = new Date(bookingDate);
    openTime.setDate(openTime.getDate() - 1);
    openTime.setHours(11, 0, 0, 0);

    const closeTime = new Date(bookingDate);
    closeTime.setHours(10, 30, 0, 0);

    if (now < openTime || now > closeTime) {
      return res.status(403).json({
        message: `Booking for ${date} is allowed between ${openTime.toLocaleString()} and ${closeTime.toLocaleString()}`,
      });
    }

    await pool.query(
      `INSERT INTO orders (student_id, food_item_id, booking_for_date)
       VALUES ($1, $2, $3)`,
      [user_id, itemId, date]
    );

    res.status(201).json({ message: "Booking successful" });
  } catch (err) {
    console.error("Book Item Error:", err);
    
    if (err.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ message: "You already have a booking for this date" });
    }
    
    res.status(500).json({ 
      message: "Booking failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// Cancel a booking before 10:30 AM of the booking day
exports.cancelBooking = async (req, res) => {
  const { order_id } = req.params;
  const user_id = req.user.id;

  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND student_id = $2",
      [order_id, user_id]
    );

    const order = result.rows[0];

    if (!order) {
      return res.status(404).json({ message: "Order not found or you don't have permission to cancel it" });
    }

    const now = new Date();
    const bookingDate = order.booking_for_date.toISOString().split("T")[0]; // ensure date string in YYYY-MM-DD
    const cutoffTime = new Date(`${bookingDate}T10:30:00`);

    if (now > cutoffTime) {
      return res.status(403).json({
        message: `Cannot cancel. Deadline was ${cutoffTime.toLocaleString()}`
      });
    }

    await pool.query("DELETE FROM orders WHERE id = $1 AND student_id = $2", [order_id, user_id]);
    res.json({ message: "Booking cancelled successfully" });

  } catch (err) {
    console.error("Cancel Booking Error:", err);
    res.status(500).json({ 
      message: "Cancellation failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// View student's own booking history
exports.getHistory = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
         o.id,
         f.name as food_item, 
         o.booking_for_date, 
         o.created_at
       FROM orders o
       JOIN food_items f ON o.food_item_id = f.id
       WHERE o.student_id = $1
       ORDER BY o.booking_for_date DESC`,
      [student_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get History Error:", err);
    res.status(500).json({ 
      message: "Error fetching history",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};