flatpickr("#bookDate", {
  minDate: "today",
  dateFormat: "Y-m-d"
});

// Section toggle
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  if (id === "cancelOrder") loadCancelableOrders();
  if (id === "viewOrders") loadOrderHistory();
  if (id === "bookMenu") {
    // Clear previous messages and menu items
    document.getElementById("bookMsg").innerText = "";
    document.getElementById("menuItems").innerHTML = "";
    fetchMenuItems();
  }
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  location.href = "/login.html";
});

// Auto-fetch menu items when date changes
document.getElementById("bookDate").addEventListener("change", fetchMenuItems);

// Fetch Menu Items for selected date
async function fetchMenuItems() {
  const date = document.getElementById("bookDate").value;
  const container = document.getElementById("menuItems");
  
  if (!date) {
    container.innerHTML = "<p>Please select a date first.</p>";
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/student/menu?date=${date}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const menu = await res.json();

    if (!menu.length) {
      container.innerHTML = "<p>No menu items available for this date.</p>";
      return;
    }

    container.innerHTML = menu.map(item => `
      <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" name="foodItem" value="${item.id}" style="margin-right: 10px;" /> 
          <span><strong>${item.name}</strong> - ₹${item.price}</span>
        </label>
      </div>
    `).join("");

  } catch (err) {
    console.error("Fetch menu error:", err);
    container.innerHTML = "<p>Failed to load menu. Please try again.</p>";
  }
}

// Submit Booking
document.getElementById("submitBooking").addEventListener("click", async () => {
  const date = document.getElementById("bookDate").value;
  const itemId = document.querySelector("input[name='foodItem']:checked")?.value;
  const msgElement = document.getElementById("bookMsg");

  if (!date || !itemId) {
    msgElement.innerText = "Please select both date and food item.";
    msgElement.style.color = "red";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/student/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ date, itemId: parseInt(itemId) })
    });

    const data = await res.json();
    
    if (res.ok) {
      msgElement.innerText = data.message || "Booked successfully!";
      msgElement.style.color = "green";
      
      // Clear the form
      document.getElementById("bookDate").value = "";
      document.getElementById("menuItems").innerHTML = "";
      
      // Uncheck all radio buttons
      document.querySelectorAll("input[name='foodItem']").forEach(radio => {
        radio.checked = false;
      });
    } else {
      msgElement.innerText = data.message || "Booking failed";
      msgElement.style.color = "red";
    }
  } catch (err) {
    console.error("Booking error:", err);
    msgElement.innerText = "Network error. Please try again.";
    msgElement.style.color = "red";
  }
});

// Load Orders to Cancel
async function loadCancelableOrders() {
  try {
    const res = await fetch("http://localhost:5000/api/student/myBookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const orders = await res.json();

    const now = new Date();
    const list = orders.filter(order => {
      const deadline = new Date(order.booking_for_date);
      deadline.setHours(10, 30, 0, 0); // Fixed: should be 10:30, not 10:00
      return now < deadline;
    });

    const container = document.getElementById("cancelList");
    if (!list.length) {
      container.innerHTML = "<p>No cancelable orders found.</p>";
      return;
    }

    container.innerHTML = list.map(o => `
      <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
        <span><strong>${o.food_item}</strong> on ${new Date(o.booking_for_date).toDateString()}</span>
        <button onclick="cancelOrder(${o.id})" style="background-color: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Cancel</button>
      </div>
    `).join("");
  } catch (err) {
    console.error("Load cancelable orders error:", err);
    document.getElementById("cancelList").innerHTML = "<p>Failed to load cancelable orders.</p>";
  }
}

async function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) {
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/student/cancel/${orderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const data = await res.json();
    const msgElement = document.getElementById("cancelMsg");
    
    if (res.ok) {
      msgElement.innerText = data.message || "Order cancelled successfully.";
      msgElement.style.color = "green";
      loadCancelableOrders(); // Refresh the list
    } else {
      msgElement.innerText = data.message || "Failed to cancel order";
      msgElement.style.color = "red";
    }
  } catch (err) {
    console.error("Cancel order error:", err);
    document.getElementById("cancelMsg").innerText = "Network error. Please try again.";
    document.getElementById("cancelMsg").style.color = "red";
  }
}

// Load Order History
async function loadOrderHistory() {
  try {
    const res = await fetch("http://localhost:5000/api/student/myBookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const container = document.getElementById("orderHistory");

    if (!data.length) {
      container.innerHTML = "<p>No past orders found.</p>";
      return;
    }

    container.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Item</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Booked At</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(o => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">${o.food_item}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${new Date(o.booking_for_date).toLocaleDateString()}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${new Date(o.created_at).toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("Load order history error:", err);
    document.getElementById("orderHistory").innerHTML = "<p>Failed to load order history.</p>";
  }
}