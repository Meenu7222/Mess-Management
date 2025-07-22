// admin.js

// Initialize calendar
flatpickr("#menuDate", {
  dateFormat: "Y-m-d",
  minDate: "today"
});

// Show section
function showSection(id) {
  document.querySelectorAll(".section").forEach(section => section.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

// Post Menu
document.getElementById("menuForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("menuDate").value;
  const name = document.getElementById("itemName").value;
  const price = document.getElementById("price").value;

  // Validate inputs
  if (!date || !name || !price) {
    document.getElementById("menuMsg").innerText = "All fields are required!";
    return;
  }

  if (isNaN(price) || parseFloat(price) <= 0) {
    document.getElementById("menuMsg").innerText = "Price must be a valid positive number!";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/admin/addItem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ 
        name: name.trim(), 
        price: parseFloat(price), 
        date_available: date 
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      document.getElementById("menuMsg").innerText = data.message || "Menu posted successfully!";
      document.getElementById("menuMsg").style.color = "green";
      e.target.reset();
    } else {
      document.getElementById("menuMsg").innerText = data.message || "Failed to post menu";
      document.getElementById("menuMsg").style.color = "red";
    }
  } catch (err) {
    console.error("Menu post error:", err);
    document.getElementById("menuMsg").innerText = "Network error. Please try again.";
    document.getElementById("menuMsg").style.color = "red";
  }
});

// Fetch Today's Orders (summary)
async function fetchTodayOrders() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/todaySummary", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    const container = document.getElementById("summaryOrders");
    
    if (data.length === 0) {
      container.innerHTML = "<h4>Summary:</h4><p>No orders today.</p>";
      return;
    }

    container.innerHTML = `<h4>Summary:</h4>` + data.map(
      (order) => `<p>${order.food_item}: ${order.total_orders} orders</p>`
    ).join("");
  } catch (err) {
    console.error("Fetch today orders error:", err);
    document.getElementById("summaryOrders").innerText = "Failed to load summary.";
  }
}

// Fetch Detailed Orders
async function fetchDetailedOrders() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/todayDetails", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    const container = document.getElementById("detailedOrders");
    if (data.length === 0) {
      container.innerHTML = "<p>No orders today.</p>";
      return;
    }

    container.innerHTML = `
      <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr><th>Student</th><th>Food Item</th><th>Time</th></tr>
        </thead>
        <tbody>
          ${data.map(o => `
            <tr>
              <td>${o.student_name}</td>
              <td>${o.food_item}</td>
              <td>${new Date(o.created_at).toLocaleTimeString()}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("Fetch detailed orders error:", err);
    document.getElementById("detailedOrders").innerText = "Failed to load detailed orders.";
  }
}

// Populate Month Selector
const monthSelect = document.getElementById("monthSelector");
for (let m = 0; m < 12; m++) {
  const date = new Date();
  date.setMonth(m);
  const month = date.toLocaleString("default", { month: "long" });
  monthSelect.innerHTML += `<option value="${m + 1}">${month}</option>`;
}

// Set current month as default
const currentMonth = new Date().getMonth() + 1;
monthSelect.value = currentMonth;

// Fetch Sales History
monthSelect.addEventListener("change", async () => {
  const month = monthSelect.value;
  
  if (!month) return;
  
  try {
    const res = await fetch(`http://localhost:5000/api/admin/salesHistory?month=${month}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    const container = document.getElementById("salesData");
    if (data.length === 0) {
      container.innerHTML = "<p>No sales data for this month.</p>";
      return;
    }

    container.innerHTML = `
      <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr><th>Date</th><th>Total Sales (₹)</th></tr>
        </thead>
        <tbody>
          ${data.map(sale => `
            <tr>
              <td>${new Date(sale.date).toLocaleDateString()}</td>
              <td>₹${sale.total}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("Fetch sales history error:", err);
    document.getElementById("salesData").innerText = "Failed to load sales history.";
  }
});

// Auto-fetch today's orders summary on section show
document.querySelector('[onclick="showSection(\'todayOrders\')"]').addEventListener("click", fetchTodayOrders);

// Load current month sales data on page load
document.addEventListener("DOMContentLoaded", () => {
  if (monthSelect.value) {
    monthSelect.dispatchEvent(new Event('change'));
  }
});