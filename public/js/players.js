let isAdminUser = false;
let allPlayers = [];

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  detectRole(function () {
    loadPlayers(function () {
      setupPlayersEventListeners();
      applyRoleUI();
      renderPlayers();
    });
  });
});

function detectRole(done) {
  fetchMethod("/users/me", function (status, me) {
    isAdminUser = (status === 200 && me && me.role === "admin");
    if (typeof done === "function") done();
  }, "GET");
}

function loadPlayers(done) {
  const endpoint = isAdminUser ? "/users" : "/users/public";

  fetchMethod(endpoint, function (status, data) {
    if (status !== 200 || !Array.isArray(data)) {
      console.error("Error loading players:", data);
      allPlayers = [];
      renderErrorRow();
      if (typeof done === "function") done();
      return;
    }

    allPlayers = data;

    const countEl = document.getElementById("playersCount");
    if (countEl) countEl.textContent = String(allPlayers.length);

    if (typeof done === "function") done();
  }, "GET");
}

function setupPlayersEventListeners() {
  const searchInput = document.getElementById("playersSearch");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(function () {
      renderPlayers();
    }, 250));
  }

  const refreshBtn = document.getElementById("refreshPlayersBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      loadPlayers(function () {
        renderPlayers();
      });
    });
  }
}

function applyRoleUI() {
  // Show Action header only for admin
  const adminHeader = document.getElementById("adminActionsHeader");
  if (adminHeader) adminHeader.style.display = isAdminUser ? "" : "none";
}

function renderPlayers() {
  const tbody = document.getElementById("playersTableBody");
  if (!tbody) return;

  const searchTerm = (document.getElementById("playersSearch")?.value || "").toLowerCase();

  const filtered = allPlayers.filter(function (p) {
    const name = String(p.username || "").toLowerCase();
    return !searchTerm ? true : name.includes(searchTerm);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${isAdminUser ? 2 : 1}" class="text-light">No players found.</td>
      </tr>
    `;
    return;
  }

  // USER: username only (1 column)
  if (!isAdminUser) {
    tbody.innerHTML = filtered.map(function (p) {
      return `
        <tr>
          <td class="text-light">${escapeHTML(p.username || "")}</td>
        </tr>
      `;
    }).join("");
    return;
  }

  // ADMIN: username + button (2 columns)
  tbody.innerHTML = filtered.map(function (p) {
    return `
      <tr>
        <td class="text-light">${escapeHTML(p.username || "")}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="viewPlayerDetails(${p.user_id})">
            View Details
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderErrorRow() {
  const tbody = document.getElementById("playersTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="${isAdminUser ? 2 : 1}" class="text-danger">Failed to load players.</td>
    </tr>
  `;
}

function viewPlayerDetails(userId) {
  if (!isAdminUser) return;

  fetchMethod(`/users/${userId}`, function (status, data) {
    if (status !== 200 || !data) {
      console.error("Error loading user details:", data);
      if (typeof showAlert === "function") showAlert("Failed to load user details.", "danger");
      return;
    }

    const body = document.getElementById("playerDetailsBody");
    if (body) {
      body.innerHTML = `
        <div class="mb-2"><strong>User ID:</strong> ${data.user_id}</div>
        <div class="mb-2"><strong>Username:</strong> ${escapeHTML(data.username || "")}</div>
        <div class="mb-2"><strong>Email:</strong> ${escapeHTML(data.email || "")}</div>
        <div class="mb-2"><strong>Points (Mora):</strong> ${formatNumber(data.points || 0)}</div>
        <div class="mb-2"><strong>Role:</strong> ${escapeHTML(data.role || "")}</div>
        <div class="mb-2"><strong>Created:</strong> ${data.created_at ? new Date(data.created_at).toLocaleString() : "N/A"}</div>
      `;
    }

    const modalEl = document.getElementById("playerDetailsModal");
    if (modalEl && window.bootstrap && bootstrap.Modal) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }, "GET");
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.viewPlayerDetails = viewPlayerDetails;
