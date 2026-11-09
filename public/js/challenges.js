let equippedCharacter = null;
let currentChallenge = null;
let minigameSuccess = false;

// track if equipped character is down (0 HP)
let isCharacterDown = false;

// Per-challenge cooldown tracking (UI only)
const challengeCooldowns = {};      // { [challengeId]: minutesLeft }
const challengeCooldownTimers = {}; // { [challengeId]: intervalId }

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  loadCharacterStatus(function () {
    loadChallenges(function () {
      loadMyChallenges(function () {
        setupEventListeners();
        setupMinigameModalCleanup();
      });
    });
  });
});

// ===============================
// CHARACTER STATUS
// ===============================
function loadCharacterStatus(done) {
  fetchMethod("/characters/equipped", function (status, character) {
    if (status !== 200 || !character || !character.user_character_id) {
      equippedCharacter = null;
      isCharacterDown = false;

      const statusEl = document.getElementById("characterStatus");
      if (statusEl) {
        statusEl.innerHTML = `
          <div class="alert alert-warning">
            <p class="mb-0">No character equipped! Please equip a character from your inventory.</p>
          </div>
        `;
      }

      const cooldownEl = document.getElementById("cooldownStatus");
      if (cooldownEl) cooldownEl.textContent = "No character";

      if (typeof done === "function") done();
      return;
    }

    equippedCharacter = character;

    const displayCurrentHp =
      character.effective_current_hp !== undefined && character.effective_current_hp !== null
        ? Number(character.effective_current_hp)
        : Number(character.current_hp);

    const displayMaxHp =
      character.effective_max_hp !== undefined && character.effective_max_hp !== null
        ? Number(character.effective_max_hp)
        : Number(character.max_hp);

    // consider down if current hp <= 0
    isCharacterDown = !Number.isFinite(displayCurrentHp) || displayCurrentHp <= 0;

    const statusEl = document.getElementById("characterStatus");
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="d-flex align-items-center">
          <div class="me-3">
            <img src="${character.image_url || ""}"
                 class="img-fluid rounded-circle"
                 style="width: 80px; height: 80px; object-fit: cover;">
          </div>
          <div class="flex-grow-1">
            <h5 class="text-white mb-1">${character.character_name || "Unknown"}</h5>
            <div class="mb-2">
              <span class="badge ${getElementColorClass(character.element)} me-1">
                ${character.element || "Unknown"}
              </span>
              <span class="badge bg-secondary">Level ${character.level || 1}</span>
              ${
                isCharacterDown
                  ? `<span class="badge bg-danger ms-1">0 HP</span>`
                  : ``
              }
            </div>
            ${loadCharacterHP(displayCurrentHp, displayMaxHp)}
            ${loadXPBar(Number(character.experience || 0), Number(character.level || 1))}
          </div>
        </div>
      `;
    }

    const hpEl = document.getElementById("characterHP");
    if (hpEl) hpEl.textContent = displayCurrentHp + "/" + displayMaxHp;

    fetchMethod("/users/me", function (uStatus, user) {
      const moraEl = document.getElementById("availableMora");
      if (moraEl && uStatus === 200 && user) {
        moraEl.textContent = formatNumber(user.points || 0);
      }

      // Global cooldown text is no longer used (cooldown is per challenge)
      const cooldownEl = document.getElementById("cooldownStatus");
      if (cooldownEl) cooldownEl.textContent = "Per-challenge cooldown (30 min each)";

      // if character is down, refresh challenge buttons state
      loadChallenges(function () {
        if (typeof done === "function") done();
      });
    }, "GET");
  }, "GET");
}

// ===============================
// LOAD CHALLENGES
// ===============================
function loadChallenges(done) {
  fetchMethod("/challenges", function (status, challenges) {
    const listEl = document.getElementById("challengesList");
    if (!listEl) {
      if (typeof done === "function") done();
      return;
    }

    if (status !== 200 || !Array.isArray(challenges)) {
      console.error("Error loading challenges:", challenges);
      listEl.innerHTML = `
        <div class="alert alert-danger">
          <p class="mb-0">Error loading challenges. Please try again later.</p>
        </div>
      `;
      if (typeof done === "function") done();
      return;
    }

    if (challenges.length === 0) {
      listEl.innerHTML = `
        <div class="alert alert-info">
          <p class="mb-0">No challenges available yet. Be the first to create one!</p>
        </div>
      `;
      if (typeof done === "function") done();
      return;
    }

    const challengesHTML = challenges.map(function (challenge) {
      const id = Number(challenge.challenge_id);
      const minsLeft = Number(challengeCooldowns[id] || 0);

      // disable if character is down
      const disabled = (!equippedCharacter || isCharacterDown || minsLeft > 0) ? "disabled" : "";

      // Optional: show reason text when 0 HP
      const downText = (equippedCharacter && isCharacterDown) ? " (0 HP)" : "";

      return `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h5 class="text-white mb-2">${challenge.description}</h5>
                <div class="d-flex align-items-center flex-wrap gap-2">
                  <span class="badge bg-primary">${challenge.points} Mora</span>
                  <small class="text-light">Created by User ${challenge.creator_id}</small>
                  <small class="text-warning" id="cooldownText-${id}">
                    ${minsLeft > 0 ? `Cooldown: ${minsLeft} min left` : ""}
                  </small>
                  ${equippedCharacter && isCharacterDown ? `<small class="text-danger">Cannot play: 0 HP</small>` : ``}
                </div>
              </div>

              <div class="ms-3 text-end">
                <button class="btn btn-primary"
                        id="startBtn-${id}"
                        onclick="startChallenge(${id}, '${escapeQuotes(challenge.description)}', ${challenge.points})"
                        ${disabled}>
                  ${minsLeft > 0 ? "On Cooldown" : ("Start Challenge" + downText)}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    listEl.innerHTML = challengesHTML;

    if (typeof done === "function") done();
  }, "GET");
}

// ===============================
// LOAD MY CHALLENGES
// ===============================
function loadMyChallenges(done) {
  fetchMethod("/users/me", function (uStatus, user) {
    if (uStatus !== 200 || !user) {
      console.error("Error loading current user:", user);
      if (typeof done === "function") done();
      return;
    }

    fetchMethod("/challenges", function (cStatus, allChallenges) {
      if (cStatus !== 200 || !Array.isArray(allChallenges)) {
        console.error("Error loading challenges for myChallenges:", allChallenges);
        if (typeof done === "function") done();
        return;
      }

      const myChallenges = allChallenges.filter(function (ch) {
        return ch.creator_id === user.user_id;
      });

      const mySection = document.getElementById("myChallengesSection");
      const createSection = document.getElementById("createChallengeSection");

      if (myChallenges.length > 0) {
        if (mySection) mySection.style.display = "block";
        if (createSection) createSection.style.display = "block";

        const myList = document.getElementById("myChallengesList");
        if (myList) {
          myList.innerHTML = myChallenges.map(function (challenge) {
            return `
              <div class="card mb-3">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="text-white mb-1">${challenge.description}</h6>
                      <small class="text-light">${challenge.points} Mora • Created on ${formatDate(challenge.created_at)}</small>
                    </div>
                    <div>
                      <button class="btn btn-sm btn-outline-danger"
                              onclick="deleteChallenge(${challenge.challenge_id})">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join("");
        }
      } else {
        if (createSection) createSection.style.display = "block";
      }

      if (typeof done === "function") done();
    }, "GET");
  }, "GET");
}

// ===============================
// START CHALLENGE => OPEN MINIGAME
// ===============================
function startChallenge(challengeId, description, points) {
  if (!equippedCharacter) {
    showAlert("Please equip a character first!", "warning");
    return;
  }

  // block if character is down
  if (isCharacterDown) {
    showAlert("Your equipped character has 0 HP. Heal or equip another character to play.", "danger");
    return;
  }

  // If UI says cooldown, block immediately (no API call)
  const uiMins = Number(challengeCooldowns[challengeId] || 0);
  if (uiMins > 0) {
    showAlert("This challenge is on cooldown: " + uiMins + " min left", "warning");
    return;
  }

  // Confirm with backend (source of truth)
  fetchMethod("/minigame/challenge/" + challengeId + "/can-attempt", function (status, result) {
    if (status !== 200 || !result) {
      if (status === 429 && result && result.cooldown_remaining_minutes !== undefined) {
        const mins = Number(result.cooldown_remaining_minutes) || 0;
        showAlert("Cooldown active for this challenge: " + mins + " min left", "warning");
        setChallengeCooldown(challengeId, mins);
      } else {
        showAlert(result && result.message ? result.message : "Cannot start challenge", "danger");
      }
      return;
    }

    if (result.can_attempt !== true) {
      showAlert(result.message || "Cannot attempt now", "warning");
      return;
    }

    currentChallenge = { challengeId: challengeId, description: description, points: points };
    minigameSuccess = false;

    // Update HP snapshot from response if provided
    if (result.character) {
      equippedCharacter.current_hp = result.character.current_hp;
      equippedCharacter.max_hp = result.character.max_hp;

      // keep local "down" flag consistent
      isCharacterDown = Number(result.character.current_hp) <= 0;
      if (isCharacterDown) {
        showAlert("Your character has 0 HP. Heal or equip another character to play.", "danger");
        loadChallenges(function () {});
        return;
      }
    }

    const modalEl = document.getElementById("minigameModal");
    const modal = new bootstrap.Modal(modalEl);
    const element = equippedCharacter.element || "Pyro";

    document.getElementById("minigameTitle").textContent = element + " Minigame";
    document.getElementById("minigameContent").innerHTML = createMinigame(element);

    modal.show();

    if (typeof window.initMinigame === "function") {
      window.initMinigame(element);
    } else {
      console.error("initMinigame(element) not found. Did you include minigames.js?");
      showAlert("Minigame file not loaded. Please include minigames.js.", "danger");
    }
  }, "GET");
}

function createMinigame(element) {
  return `
    <div class="text-center">
      <h4 class="text-white mb-2">${element} Minigame</h4>
      <p class="text-light mb-3">Win the minigame to unlock the wellness challenge completion.</p>
      <div id="minigameArea" class="mb-3" style="min-height: 220px;"></div>
      <div class="alert alert-info mb-0">
        <small class="text-light">
          <strong>HP rule:</strong> HP goes down whether you succeed or fail.
          Succeed = less HP loss. Fail = more HP loss.
        </small>
      </div>
    </div>
  `;
}

// ===============================
// CALLED BY minigames.js WHEN GAME ENDS
// ===============================
window.finishMinigame = function (success) {
  if (!currentChallenge) return;

  // Close minigame modal
  const modalEl = document.getElementById("minigameModal");
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  const hpLost = success ? 10 : 15;

  fetchMethod(
    "/minigame/challenge/" + currentChallenge.challengeId + "/attempt",
    function (status, data) {
      if (status !== 200) {
        console.error("Error recording minigame attempt:", data);
        showAlert(data && data.message ? data.message : "Error recording minigame attempt", "danger");
        loadCharacterStatus(function () {});
        return;
      }

      minigameSuccess = !!(data && data.can_complete_challenge);

      loadCharacterStatus(function () {
        if (minigameSuccess) {
          document.getElementById("completionMessage").textContent =
            'You passed the minigame for "' +
            currentChallenge.description +
            '". Now do the wellness challenge and explain how you did it.';
          document.getElementById("completionDetails").value = "";

          const completionModal = new bootstrap.Modal(document.getElementById("completionModal"));
          completionModal.show();
        } else {
          showAlert("Minigame failed! HP deducted. You cannot complete this challenge.", "danger");
        }
      });
    },
    "POST",
    { success: success }
  );
};

// ===============================
// SUBMIT COMPLETION (TEXTBOX)
// ===============================
function submitCompletion() {
  const details = document.getElementById("completionDetails").value.trim();

  if (!details) {
    showAlert("Please provide completion details", "warning");
    return;
  }

  if (!minigameSuccess) {
    showAlert("You must succeed in the minigame first!", "danger");
    return;
  }

  const submitBtn = document.getElementById("submitCompletion");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
  }

  const completedChallengeId = currentChallenge ? currentChallenge.challengeId : null;

  fetchMethod(
    "/completions/challenge/" + completedChallengeId,
    function (status, response) {
      if (status !== 201 && status !== 200) {
        console.error("Error submitting completion:", response);

        // If backend returns per-challenge cooldown minutes
        if (status === 429 && response && response.cooldown_remaining_minutes !== undefined) {
          const mins = Number(response.cooldown_remaining_minutes) || 0;
          showAlert("Cooldown active for this challenge: " + mins + " min left", "warning");
          if (completedChallengeId) setChallengeCooldown(completedChallengeId, mins);
        } else {
          showAlert(response && response.message ? response.message : "Error completing challenge", "danger");
        }
      } else {
        showAlert("Challenge completed! Mora and XP earned!", "success");

        // Close completion modal
        const modalEl = document.getElementById("completionModal");
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

        // Start per-challenge cooldown locally (30 mins)
        if (completedChallengeId) setChallengeCooldown(completedChallengeId, 30);

        // Reset state for next challenge
        currentChallenge = null;
        minigameSuccess = false;

        // Refresh UI
        loadCharacterStatus(function () {
          loadChallenges(function () {
            loadMyChallenges(function () {});
          });
        });
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Completion";
      }
    },
    "POST",
    { details: details }
  );
}

// ===============================
// COOLDOWN UI HELPERS (PER CHALLENGE)
// ===============================
function setChallengeCooldown(challengeId, minutes) {
  const mins = Math.max(0, Math.floor(Number(minutes) || 0));
  challengeCooldowns[challengeId] = mins;

  updateChallengeCooldownUI(challengeId);

  // Clear any old timer
  if (challengeCooldownTimers[challengeId]) {
    clearInterval(challengeCooldownTimers[challengeId]);
    challengeCooldownTimers[challengeId] = null;
  }

  if (mins <= 0) return;

  challengeCooldownTimers[challengeId] = setInterval(function () {
    challengeCooldowns[challengeId] = Math.max(0, Number(challengeCooldowns[challengeId] || 0) - 1);
    updateChallengeCooldownUI(challengeId);

    if (challengeCooldowns[challengeId] <= 0) {
      clearInterval(challengeCooldownTimers[challengeId]);
      challengeCooldownTimers[challengeId] = null;
    }
  }, 60 * 1000);
}

function updateChallengeCooldownUI(challengeId) {
  const minsLeft = Number(challengeCooldowns[challengeId] || 0);

  const btn = document.getElementById("startBtn-" + challengeId);
  const txt = document.getElementById("cooldownText-" + challengeId);

  if (txt) {
    txt.textContent = minsLeft > 0 ? "Cooldown: " + minsLeft + " min left" : "";
  }

  if (btn) {
    // disable if no character OR down
    if (!equippedCharacter) {
      btn.disabled = true;
      btn.textContent = "Start Challenge";
      return;
    }
    if (isCharacterDown) {
      btn.disabled = true;
      btn.textContent = "Start Challenge (0 HP)";
      return;
    }

    if (minsLeft > 0) {
      btn.disabled = true;
      btn.textContent = "On Cooldown";
    } else {
      btn.disabled = false;
      btn.textContent = "Start Challenge";
    }
  }
}

// ===============================
// CREATE + DELETE CHALLENGE
// ===============================
function createNewChallenge() {
  const description = document.getElementById("challengeDescription").value.trim();
  const points = parseInt(document.getElementById("challengePoints").value, 10);

  if (!description || !points) {
    showAlert("Please fill in all fields", "warning");
    return;
  }

  fetchMethod("/challenges", function (status, data) {
    if (status !== 201 && status !== 200) {
      console.error("Error creating challenge:", data);
      showAlert(data && data.message ? data.message : "Error creating challenge", "danger");
      return;
    }

    showAlert("Challenge created successfully!", "success");

    const modalEl = document.getElementById("createChallengeModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    document.getElementById("challengeDescription").value = "";
    document.getElementById("challengePoints").value = "10";

    loadChallenges(function () {
      loadMyChallenges(function () {});
    });
  }, "POST", { description: description, points: points });
}

function deleteChallenge(challengeId) {
  fetchMethod("/challenges/" + challengeId, function (status, data) {
    if (status !== 200 && status !== 204) {
      console.error("Error deleting challenge:", data);
      showAlert(data && data.message ? data.message : "Error deleting challenge", "danger");
      return;
    }

    showAlert("Challenge deleted successfully!", "success");

    // Also clear cooldown UI/timers for this id
    if (challengeCooldownTimers[challengeId]) {
      clearInterval(challengeCooldownTimers[challengeId]);
      challengeCooldownTimers[challengeId] = null;
    }
    delete challengeCooldowns[challengeId];

    loadChallenges(function () {
      loadMyChallenges(function () {});
    });
  }, "DELETE");
}

// ===============================
// EVENT LISTENERS
// ===============================
function setupEventListeners() {
  const createForm = document.getElementById("createChallengeForm");
  if (createForm) {
    createForm.addEventListener("submit", function (e) {
      e.preventDefault();
      createNewChallenge();
    });
  }

  const completionForm = document.getElementById("completionForm");
  if (completionForm) {
    completionForm.addEventListener("submit", function (e) {
      e.preventDefault();
      submitCompletion();
    });
  }
}

// Cleanup minigame timers/listeners when modal closes
function setupMinigameModalCleanup() {
  const modalEl = document.getElementById("minigameModal");
  if (!modalEl) return;

  modalEl.addEventListener("hidden.bs.modal", function () {
    if (typeof window.cleanupMinigame === "function") {
      window.cleanupMinigame();
    }

    const area = document.getElementById("minigameArea");
    if (area) area.innerHTML = "";
  });
}

// ===============================
// UI HELPERS
// ===============================
function getElementColorClass(element) {
  const elementClasses = {
    Pyro: "bg-pyro",
    Hydro: "bg-hydro",
    Anemo: "bg-anemo",
    Electro: "bg-electro",
    Dendro: "bg-dendro",
    Cryo: "bg-cryo",
    Geo: "bg-geo"
  };
  return elementClasses[element] || "bg-secondary";
}

function escapeQuotes(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/'/g, "\\'");
}

// Export functions used in HTML onclick
window.startChallenge = startChallenge;
window.deleteChallenge = deleteChallenge;
