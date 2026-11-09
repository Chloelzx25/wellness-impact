let equippedCharacter = null;
let allCharacters = [];
let inventoryItems = [];
let currentActionItem = null;

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  refreshInventoryPage(function () {
    setupInventoryEventListeners();
  });
});

function refreshInventoryPage(done) {
  loadEquippedCharacter(function () {
    loadInventory(function () {
      loadCharacters(function () {
        if (typeof done === "function") done();
      });
    });
  });
}

function loadEquippedCharacter(done) {
  fetchMethod(
    "/characters/equipped",
    function (status, data) {
      if (status === 200 && data && data.user_character_id) {
        equippedCharacter = data;
      } else {
        equippedCharacter = null;
      }

      renderEquippedCharacterCard();
      if (typeof done === "function") done();
    },
    "GET"
  );
}

function loadCharacters(done) {
  fetchMethod(
    "/characters",
    function (status, data) {
      if (status === 200 && Array.isArray(data)) {
        allCharacters = data;
      } else {
        allCharacters = [];
      }

      renderCharactersList();
      if (typeof done === "function") done();
    },
    "GET"
  );
}

function loadInventory(done) {
  fetchMethod(
    "/inventory/me",
    function (status, data) {
      if (status === 200 && Array.isArray(data)) {
        inventoryItems = data;
      } else {
        inventoryItems = [];
      }

      renderInventoryTabs();
      renderCharactersList();
      if (typeof done === "function") done();
    },
    "GET"
  );
}

function renderEquippedCharacterCard() {
  const container = document.getElementById("equippedCharacterCard");
  if (!container) return;

  if (!equippedCharacter) {
    container.innerHTML = `
      <div class="alert alert-warning mb-0">
        <strong>No equipped character.</strong> Please equip one in the Characters tab first.
      </div>
    `;
    return;
  }

  const c = equippedCharacter;
  const displayCurrentHp = Number(c.effective_current_hp || c.current_hp || 0);
  const displayMaxHp = Number(c.effective_max_hp || c.max_hp || 1);

  container.innerHTML = `
    <div class="card">
      <div class="card-body d-flex align-items-center">
        <img src="${c.image_url || ""}"
             class="rounded-circle me-3"
             style="width: 72px; height: 72px; object-fit: cover;"
             alt="${escapeHTML(c.character_name || "Character")}">
        <div class="flex-grow-1">
          <h5 class="text-white mb-1">${escapeHTML(c.character_name || "Unknown")}</h5>
          <div class="mb-2">
            <span class="badge ${getElementColorClass(c.element)} me-1">${escapeHTML(c.element || "Unknown")}</span>
            <span class="badge bg-secondary">Lv.${Number(c.level || 1)}</span>
            <span class="badge bg-primary ms-1">Equipped</span>
          </div>
          ${loadCharacterHP(displayCurrentHp, displayMaxHp)}
        </div>
      </div>
    </div>
  `;
}

function renderCharactersList() {
  const container = document.getElementById("charactersList");
  if (!container) return;

  if (!Array.isArray(allCharacters) || allCharacters.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <p class="text-light mb-0">No characters found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = allCharacters
    .map(function (c) {
      const isEquipped = c.is_equipped === 1 || c.is_equipped === true;
      const currentHp = Number(
        c.effective_current_hp !== undefined && c.effective_current_hp !== null
          ? c.effective_current_hp
          : c.current_hp || 0
      );
      const maxHp = Number(
        c.effective_max_hp !== undefined && c.effective_max_hp !== null
          ? c.effective_max_hp
          : c.max_hp || 1
      );

      const equippedItems = inventoryItems.filter(function (item) {
        return item.equipped_to_character_id === c.user_character_id;
      });

      return `
      <div class="card mb-3 ${isEquipped ? "border-primary border-2" : ""}">
        <div class="card-body">
          <div class="card-body d-flex align-items-center">
          <img src="${c.image_url || ""}"
          class="rounded-circle me-3"
          style="width: 64px; height: 64px; object-fit: cover;"
          alt="${escapeHTML(c.character_name || "Character")}">
          <div class="flex-grow-1">
              <h6 class="text-white mb-1">${escapeHTML(c.character_name || "Unknown")}</h6>
              <div class="mb-2">
                <span class="badge ${getElementColorClass(c.element)} me-1">${escapeHTML(c.element || "Unknown")}</span>
                <span class="badge bg-secondary">Lv.${Number(c.level || 1)}</span>
                ${isEquipped ? '<span class="badge bg-primary ms-1">Equipped</span>' : ""}
              </div>
            </div>
            <div class="text-end">
              ${
                !isEquipped
                  ? `<button class="btn btn-sm btn-primary" onclick="equipUserCharacter(${c.user_character_id})">Equip</button>`
                  : `<button class="btn btn-sm btn-outline-primary" disabled>Equipped</button>`
              }
            </div>
          </div>

          <small class="text-light">HP: ${currentHp}/${maxHp}</small>
          <div class="progress mb-2" style="height: 8px;">
            <div class="progress-bar ${getHPClass(currentHp, maxHp)}"
                 style="width: ${getHPPercent(currentHp, maxHp)}%"></div>
          </div>

          ${
            equippedItems.length > 0
              ? `
            <div class="mt-2">
              <small class="text-muted">Equipped Items:</small>
              <div class="d-flex flex-wrap gap-1 mt-1">
                ${equippedItems
                  .map(function (item) {
                    return `
                  <span class="badge bg-success" title="${item.item_name}">
                    ${item.item_type === "weapon" ? "⚔️" : "🛡️"} ${item.item_name}
                  </span>
                `;
                  })
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
    })
    .join("");
}

function renderInventoryTabs() {
  renderInventoryList("weapon", "weaponsTab");
  renderInventoryList("artifact", "artifactsTab");
  renderInventoryList("food", "foodTab");
}

function renderInventoryList(type, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const items = inventoryItems.filter(function (i) {
    return i.item_type === type;
  });

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <p class="text-light mb-0">No ${type}s in inventory.</p>
      </div>
    `;
    return;
  }

  let html = items
    .map(function (item) {
      const isEquipped = item.is_equipped === 1 || item.is_equipped === true;
      const equippedToCharName = item.equipped_to_character_name;

      const effect = seeNumber(item.item_effect);
      const effectText =
        type === "weapon"
          ? effect !== null
            ? `+${effect}% XP`
            : ""
          : type === "artifact"
          ? effect !== null
            ? `+${effect} HP`
            : ""
          : type === "food"
          ? effect !== null
            ? `Heals ${effect} HP`
            : ""
          : "";

      const qty = Number(item.quantity || 1);
      const qtyText =
        type === "food" || qty > 1
          ? `<span class="badge bg-secondary ms-2">x${qty}</span>`
          : "";

      let actionBtn = "";
      if (type === "food") {
        actionBtn = `
        <button class="btn btn-sm btn-success" onclick="showFoodUseModal(${item.inventory_id})">
          Use on Character
        </button>
      `;
      } else if (!isEquipped) {
        actionBtn = `
        <button class="btn btn-sm btn-primary" onclick="showEquipModal('${type}', ${item.inventory_id})">
          Equip to Character
        </button>
      `;
      } else {
        actionBtn = `
        <button class="btn btn-sm btn-outline-secondary" onclick="unequipItem(${item.inventory_id})">
          Unequip
        </button>
      `;
      }

      return `
      <div class="card mb-3 ${isEquipped ? "border-success border-2" : ""}">
        <div class="card-body d-flex align-items-center">
          <img src="${item.image_url || ""}"
               class="rounded me-3"
               style="width: 56px; height: 56px; object-fit: cover;"
               alt="${escapeHTML(item.item_name || type)}">

          <div class="flex-grow-1">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="text-white mb-1">
                  ${escapeHTML(item.item_name || "Unknown")} ${qtyText}
                </h6>
                <small class="text-light">${escapeHTML(effectText)}</small>
                ${
                  isEquipped && equippedToCharName
                    ? `
                  <div><span class="badge bg-success mt-2">Equipped to ${equippedToCharName}</span></div>
                `
                    : ""
                }
              </div>

              <div class="text-end">
                ${actionBtn}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  container.innerHTML = html;
}

function showEquipModal(type, inventoryId) {
  if (allCharacters.length === 0) {
    if (typeof showAlert === "function") showAlert("No characters available!", "warning");
    return;
  }

  currentActionItem = { type: type, inventoryId: inventoryId };

  const modalHTML = `
    <div class="modal fade" id="characterSelectModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content bg-dark text-light">
          <div class="modal-header">
            <h5 class="modal-title">Select Character to Equip ${type}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted">Choose which character will equip this ${type}:</p>
            <div class="list-group">
              ${allCharacters
                .map(function (c) {
                  const displayCurrent = Number(
                    c.effective_current_hp !== undefined && c.effective_current_hp !== null
                      ? c.effective_current_hp
                      : c.current_hp
                  );
                  const displayMax = Number(
                    c.effective_max_hp !== undefined && c.effective_max_hp !== null
                      ? c.effective_max_hp
                      : c.max_hp
                  );
                  return `
                <button type="button" 
                        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onclick="confirmEquipToCharacter(${c.user_character_id})"
                        data-bs-dismiss="modal">
                  <div>
                    <strong>${escapeHTML(c.character_name)}</strong>
                    <br>
                    <small class="text-muted">
                      ${c.element} | ${c.class_type} | HP: ${displayCurrent}/${displayMax}
                    </small>
                  </div>
                  <i class="bi bi-arrow-right-circle"></i>
                </button>
              `;
                })
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const existingModal = document.getElementById("characterSelectModal");
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const modal = new bootstrap.Modal(document.getElementById("characterSelectModal"));
  modal.show();
}

function showFoodUseModal(inventoryId) {
  if (allCharacters.length === 0) {
    if (typeof showAlert === "function") showAlert("No characters available!", "warning");
    return;
  }

  currentActionItem = { type: "food", inventoryId: inventoryId };

  const modalHTML = `
    <div class="modal fade" id="foodUseModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content bg-dark text-light">
          <div class="modal-header">
            <h5 class="modal-title">Select Character to Heal</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted">Choose which character will use this food:</p>
            <div class="list-group">
              ${allCharacters
                .map(function (c) {
                  const currentHp = Number(
                    c.effective_current_hp !== undefined && c.effective_current_hp !== null
                      ? c.effective_current_hp
                      : c.current_hp
                  );
                  const maxHp = Number(
                    c.effective_max_hp !== undefined && c.effective_max_hp !== null
                      ? c.effective_max_hp
                      : c.max_hp
                  );
                  const hpPercent = getHPPercent(currentHp, maxHp);
                  const needsHealing = currentHp < maxHp;

                  return `
                  <button type="button" 
                          class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${!needsHealing ? "disabled" : ""}"
                          onclick="confirmUseFood(${c.user_character_id})"
                          data-bs-dismiss="modal"
                          ${!needsHealing ? "disabled" : ""}>
                    <div class="flex-grow-1">
                      <strong>${escapeHTML(c.character_name)}</strong>
                      <br>
                      <small class="text-muted">HP: ${currentHp}/${maxHp}</small>
                      <div class="progress mt-1" style="height: 6px;">
                        <div class="progress-bar ${getHPClass(currentHp, maxHp)}"
                             style="width: ${hpPercent}%"></div>
                      </div>
                      ${!needsHealing ? '<small class="text-success">Full HP</small>' : ""}
                    </div>
                    ${needsHealing ? '<i class="bi bi-heart-fill text-danger"></i>' : ""}
                  </button>
                `;
                })
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const existingModal = document.getElementById("foodUseModal");
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const modal = new bootstrap.Modal(document.getElementById("foodUseModal"));
  modal.show();
}

function equipUserCharacter(userCharacterId) {
  fetchMethod(
    `/characters/${userCharacterId}/equip`,
    function (status, data) {
      if (status !== 200) {
        console.error("Equip character error:", data);
        if (typeof showAlert === "function")
          showAlert((data && data.message) || "Failed to equip character", "danger");
        return;
      }

      if (typeof showAlert === "function") showAlert("Character equipped!", "success");

      refreshInventoryPage(function () {});
    },
    "PUT",
    {}
  );
}

function confirmEquipToCharacter(characterId) {
  if (!currentActionItem) return;

  const type = currentActionItem.type;
  const inventoryId = currentActionItem.inventoryId;
  const endpoint = `/inventory/${type}/${inventoryId}/equip/${characterId}`;

  fetchMethod(
    endpoint,
    function (status, data) {
      if (status !== 200) {
        console.error("Equip item error:", data);
        if (typeof showAlert === "function") showAlert((data && data.message) || "Failed to equip item", "danger");
        return;
      }

      if (typeof showAlert === "function") {
        const charName = data.character_name || "character";
        showAlert(`${capitalize(type)} equipped to ${charName}!`, "success");
      }

      refreshInventoryPage(function () {});
    },
    "PUT",
    {}
  );
}

function unequipItem(inventoryId) {
  fetchMethod(
    `/inventory/${inventoryId}/unequip`,
    function (status, data) {
      if (status !== 200) {
        console.error("Unequip error:", data);
        if (typeof showAlert === "function") showAlert((data && data.message) || "Failed to unequip item", "danger");
        return;
      }

      if (typeof showAlert === "function") showAlert("Item unequipped!", "success");

      refreshInventoryPage(function () {});
    },
    "PUT",
    {}
  );
}

function confirmUseFood(characterId) {
  if (!currentActionItem) return;

  const inventoryId = currentActionItem.inventoryId;
  const endpoint = `/inventory/food/${inventoryId}/use/${characterId}`;

  fetchMethod(
    endpoint,
    function (status, data) {
      if (status !== 200) {
        console.error("Use food error:", data);
        if (typeof showAlert === "function") showAlert((data && data.message) || "Failed to use food", "danger");
        return;
      }

      if (typeof showAlert === "function") {
        const charName = data.character_name || "character";
        showAlert(`Food used! ${charName} healed ${data.healed || 0} HP.`, "success");
      }

      refreshInventoryPage(function () {});
    },
    "POST",
    {}
  );
}

function setupInventoryEventListeners() {
  const refreshBtn = document.getElementById("refreshInventoryBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      refreshInventoryPage(function () {});
    });
  }
}

function getElementColorClass(element) {
  const elementClasses = {
    Pyro: "bg-pyro",
    Hydro: "bg-hydro",
    Electro: "bg-electro",
    Cryo: "bg-cryo",
    Anemo: "bg-anemo",
    Geo: "bg-geo",
    Dendro: "bg-dendro"
  };
  return elementClasses[element] || "bg-secondary";
}

function getHPPercent(current, max) {
  const m = Number(max) || 1;
  return Math.max(0, Math.min(100, Math.round((Number(current) / m) * 100)));
}

function getHPClass(current, max) {
  const p = getHPPercent(current, max);
  return p > 70 ? "bg-success" : p > 30 ? "bg-warning" : "bg-danger";
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function seeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function loadCharacterHP(current, max) {
  const p = getHPPercent(current, max);
  return `
    <div class="mb-2">
      <div class="d-flex justify-content-between mb-1">
        <small class="text-light">HP</small>
        <small class="text-light">${current}/${max}</small>
      </div>
      <div class="progress" style="height: 10px;">
        <div class="progress-bar ${getHPClass(current, max)}"
             style="width: ${p}%"></div>
      </div>
    </div>
  `;
}

window.equipUserCharacter = equipUserCharacter;
window.showEquipModal = showEquipModal;
window.showFoodUseModal = showFoodUseModal;
window.confirmEquipToCharacter = confirmEquipToCharacter;
window.confirmUseFood = confirmUseFood;
window.unequipItem = unequipItem;
