let allShopItems = [];
let filteredItems = [];
let selectedItem = null; // { item_type, id, name, price, ... }

// Genshin element badge classes
const ELEMENT_COLORS = {
  Pyro: "bg-pyro",
  Hydro: "bg-hydro",
  Electro: "bg-electro",
  Cryo: "bg-cryo",
  Anemo: "bg-anemo",
  Geo: "bg-geo",
  Dendro: "bg-dendro"
};

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Load mora + items
  loadBalance(function () {
    loadShopItems(function () {
      applySearchAndRender();
      setupShopListeners();
    });
  });
});

function setupShopListeners() {
  const search = document.getElementById("searchItems");
  if (search) {
    search.addEventListener(
      "input",
      debounce(function () {
        applySearchAndRender();
      }, 250)
    );
  }

  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      logout();
    });
  }

  // Confirm purchase button
  const confirmBtn = document.getElementById("confirmPurchase");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      if (!selectedItem) return;
      performPurchase(selectedItem);
    });
  }

  // Make refreshBalance callable from HTML button
  window.refreshBalance = function () {
    loadBalance(function () {});
  };
}

// --------------------
// API Calls
// --------------------
function loadBalance(done) {
  fetchMethod(
    "/users/me",
    function (status, user) {
      if (status === 200 && user) {
        const mora = user.points || 0;
        const navbarMora = document.getElementById("navbarMora");
        const userMora = document.getElementById("userMora");
        if (navbarMora) navbarMora.textContent = formatNumber(mora);
        if (userMora) userMora.textContent = formatNumber(mora);
      } else {
        console.error("loadBalance error:", user);
      }
      if (typeof done === "function") done();
    },
    "GET"
  );
}

function loadShopItems(done) {
  fetchMethod(
    "/shop/items/all",
    function (status, data) {
      if (status !== 200 || !Array.isArray(data)) {
        console.error("loadShopItems error:", data);
        allShopItems = [];
        updateCounts();
        renderEmptyAll();
        if (typeof done === "function") done();
        return;
      }

      // Normalize fields expected by UI
      allShopItems = data
        .map(function (x) {
          return {
            item_type: x.item_type, // weapon | artifact | food | character
            id: x.id,
            name: x.name,
            description: x.description,
            price: x.price,
            image_url: x.image_url,
            effect_value: x.effect_value, // number

            // character-only extras (for element badge / class later)
            element: x.element,
            class_type: x.class_type,

            // weapon-only extra (optional)
            weapon_type: x.weapon_type
          };
        })
        // hide starter Amber even if backend forgets
        .filter(function (item) {
          if (item.item_type !== "character") return true;
          const nm = String(item.name || "").toLowerCase().trim();
          // common starter pattern: Amber with price 0
          if (nm === "amber" && Number(item.price) === 0) return false;
          return true;
        });

      updateCounts();
      if (typeof done === "function") done();
    },
    "GET"
  );
}

// --------------------
// Render helpers
// --------------------
function applySearchAndRender() {
  const searchTerm = (document.getElementById("searchItems")?.value || "").toLowerCase();

  filteredItems = allShopItems.filter(function (item) {
    if (!searchTerm) return true;

    // allow searching element/class too
    return (
      String(item.name || "").toLowerCase().includes(searchTerm) ||
      String(item.description || "").toLowerCase().includes(searchTerm) ||
      String(item.element || "").toLowerCase().includes(searchTerm) ||
      String(item.class_type || "").toLowerCase().includes(searchTerm) ||
      String(item.weapon_type || "").toLowerCase().includes(searchTerm)
    );
  });

  renderAllCategories();
}

function updateCounts() {
  const weaponCount = document.getElementById("weaponCount");
  const artifactCount = document.getElementById("artifactCount");
  const consumableCount = document.getElementById("consumableCount");
  const characterCount = document.getElementById("characterCount");

  const w = allShopItems.filter((i) => i.item_type === "weapon").length;
  const a = allShopItems.filter((i) => i.item_type === "artifact").length;
  const f = allShopItems.filter((i) => i.item_type === "food").length;
  const c = allShopItems.filter((i) => i.item_type === "character").length;

  if (weaponCount) weaponCount.textContent = w;
  if (artifactCount) artifactCount.textContent = a;
  if (consumableCount) consumableCount.textContent = f;
  if (characterCount) characterCount.textContent = c;
}

function renderEmptyAll() {
  setGridHTML("weaponsGrid", emptyGrid("weapons"));
  setGridHTML("artifactsGrid", emptyGrid("artifacts"));
  setGridHTML("consumablesGrid", emptyGrid("consumables"));
  setGridHTML("charactersGrid", emptyGrid("characters"));
}

function renderAllCategories() {
  const weapons = filteredItems.filter((i) => i.item_type === "weapon");
  const artifacts = filteredItems.filter((i) => i.item_type === "artifact");
  const foods = filteredItems.filter((i) => i.item_type === "food");
  const characters = filteredItems.filter((i) => i.item_type === "character");

  setGridHTML("weaponsGrid", renderCards(weapons));
  setGridHTML("artifactsGrid", renderCards(artifacts));
  setGridHTML("consumablesGrid", renderCards(foods));
  setGridHTML("charactersGrid", renderCards(characters));
}

function setGridHTML(gridId, html) {
  const grid = document.getElementById(gridId);
  if (grid) grid.innerHTML = html;
}

function emptyGrid(label) {
  return `
    <div class="col-12 text-center py-5">
      <p class="text-light mt-3">No ${label} found.</p>
    </div>
  `;
}

// Create cards 
function renderCards(items) {
  if (!items || items.length === 0) return emptyGrid("items");

  return items
    .map(function (item) {
      const badge = getBadge(item);
      const extraBadge = getExtraBadge(item);
      const effectText = getEffectText(item);

      return `
        <div class="col-lg-4 col-md-6 mb-4">
          <div class="card h-100 shop-item-card">
            <div class="card-body d-flex flex-column">
              <div class="text-center mb-3">
                <img src="${item.image_url || ""}"
                     alt="${escapeHTML(item.name)}"
                     class="img-fluid rounded"
                     style="height: 140px; object-fit: contain;">
              </div>

              <h5 class="text-white mb-2">${escapeHTML(item.name)}</h5>

              <div class="d-flex flex-wrap gap-2 mb-2">
                ${badge}
                ${extraBadge}
                <span class="badge bg-success">${formatNumber(item.price)} Mora</span>
                ${
                  effectText
                    ? `<span class="badge bg-info text-dark">${escapeHTML(effectText)}</span>`
                    : ""
                }
              </div>

              <p class="text-light small flex-grow-1">${escapeHTML(item.description || "")}</p>

              <button class="btn btn-primary mt-2"
                      onclick="openPurchaseModal('${item.item_type}', ${item.id})">
                <i class="bi bi-cart-check"></i> Buy
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

// Badge rules:
function getBadge(item) {
  if (item.item_type === "character") {
    const cls = ELEMENT_COLORS[item.element] || "bg-secondary";
    return `<span class="badge ${cls}">${escapeHTML(item.element || "Unknown")}</span>`;
  }

  if (item.item_type === "weapon")
    return `<span class="badge bg-primary"><i class="bi bi-sword"></i> Weapon</span>`;
  if (item.item_type === "artifact")
    return `<span class="badge bg-warning text-dark"><i class="bi bi-gem"></i> Artifact</span>`;
  if (item.item_type === "food")
    return `<span class="badge bg-danger"><i class="bi bi-cup"></i> Consumable</span>`;

  return `<span class="badge bg-secondary">Item</span>`;
}

// extra badge:
// - character: show class type (e.g., Lancer)
// - weapon: show weapon type (e.g., Sword)
function getExtraBadge(item) {
  if (item.item_type === "character" && item.class_type) {
    return `<span class="badge bg-dark border">${escapeHTML(item.class_type)}</span>`;
  }
  if (item.item_type === "weapon" && item.weapon_type) {
    return `<span class="badge bg-dark border">${escapeHTML(item.weapon_type)}</span>`;
  }
  return "";
}

function getEffectText(item) {
  const v = Number(item.effect_value || 0);
  if (item.item_type === "weapon") return `+${v}% XP`;
  if (item.item_type === "artifact") return `+${v} HP`;
  if (item.item_type === "food") return `Heals ${v} HP`;
  if (item.item_type === "character") return `Base HP ${v}`;
  return "";
}

// --------------------
// Modal + Purchase flow
// --------------------
window.openPurchaseModal = function (type, id) {
  const item = allShopItems.find(function (x) {
    return x.item_type === type && Number(x.id) === Number(id);
  });

  if (!item) return;

  selectedItem = item;

  // Fill modal content
  const title = document.getElementById("modalTitle");
  const imgBox = document.getElementById("modalItemImage");
  const nameEl = document.getElementById("modalItemName");
  const descEl = document.getElementById("modalItemDescription");
  const typeEl = document.getElementById("modalItemType");
  const priceEl = document.getElementById("modalItemPrice");
  const costEl = document.getElementById("modalItemCost");

  if (title) title.innerHTML = `<i class="bi bi-cart-check"></i> Purchase ${capitalize(type)}`;
  if (imgBox)
    imgBox.innerHTML = `<img src="${item.image_url || ""}" class="img-fluid rounded" style="max-height: 120px;">`;
  if (nameEl) nameEl.textContent = item.name || "Item";
  if (descEl) descEl.textContent = item.description || "";

  // modal type text: for characters, show element instead of "character"
  if (typeEl) {
    if (item.item_type === "character" && item.element) {
      typeEl.textContent = item.element;
      const cls = ELEMENT_COLORS[item.element] || "bg-secondary";
      typeEl.className = "badge " + cls;
    } else {
      typeEl.textContent = capitalize(type);
      typeEl.className = "badge bg-secondary";
    }
  }

  if (priceEl) priceEl.textContent = `${formatNumber(item.price)} Mora`;
  if (costEl) costEl.textContent = formatNumber(item.price);

  // User balance
  fetchMethod(
    "/users/me",
    function (status, user) {
      const balEl = document.getElementById("modalUserBalance");
      if (balEl && status === 200 && user) {
        balEl.textContent = formatNumber(user.points || 0);
      }
    },
    "GET"
  );

  // Show modal
  const modalEl = document.getElementById("purchaseModal");
  if (modalEl && window.bootstrap && bootstrap.Modal) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
};

function performPurchase(item) {
  // Disable confirm button during request
  const btn = document.getElementById("confirmPurchase");
  const oldText = btn ? btn.innerHTML : null;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Purchasing...`;
  }

  // Resolve endpoint
  let endpoint = null;
  let payload = {};

  if (item.item_type === "weapon") endpoint = `/shop/weapons/${item.id}/purchase`;
  if (item.item_type === "artifact") endpoint = `/shop/artifacts/${item.id}/purchase`;
  if (item.item_type === "character") endpoint = `/shop/characters/${item.id}/purchase`;
  if (item.item_type === "food") endpoint = `/shop/food/${item.id}/purchase`;

  if (!endpoint) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
    return;
  }

  // Food quantity default 1
  if (item.item_type === "food") payload = { quantity: 1 };

  fetchMethod(
    endpoint,
    function (status, data) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldText;
      }

      if (status !== 200 && status !== 201) {
        console.error("Purchase error:", data);
        if (typeof showAlert === "function") {
          showAlert(data && data.message ? data.message : "Purchase failed.", "danger");
        }
        return;
      }

      if (typeof showAlert === "function") showAlert("Purchased successfully!", "success");

      // Close modal
      const modalEl = document.getElementById("purchaseModal");
      if (modalEl && window.bootstrap && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }

      // Refresh balance + items 
      loadBalance(function () {});
    },
    "POST",
    payload
  );
}

// --------------------
// Utils
// --------------------
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
