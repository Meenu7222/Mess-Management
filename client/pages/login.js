document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("errorMsg").innerText = data.message || "Login failed";
    } else {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      window.location.href = data.user.role === "admin" ? "admin.html" : "student.html";
    }
  } catch (err) {
    document.getElementById("errorMsg").innerText = "Server error";
  }
});
