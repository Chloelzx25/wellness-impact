document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Load dashboard data in order (NO recent activity)
  loadUserProfile(function () {
    loadUserCharacters(function () {
      setupEventListeners();
    });
  });
});

// for showing challenge name instead of ID
let challengeNameMap = {};

function loadUserProfile(done) {
  fetchMethod('/users/me', function (status, user) {
    if (status !== 200) {
      console.error('Error loading user profile:', user);
      if (typeof showAlert === 'function') showAlert('Error loading user profile', 'danger');
      if (typeof done === 'function') done();
      return;
    }

    // Update navbar mora
    const moraEl = document.getElementById('navbarMora');
    if (moraEl) moraEl.textContent = formatNumber(user.points || 0);

    // Update user info section
    const fullnameEl = document.getElementById('userFullname');
    if (fullnameEl) fullnameEl.textContent = user.username || 'Adventurer';

    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.textContent = user.username || 'N/A';

    const emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = user.email || 'N/A';

    const userIdEl = document.getElementById('userId');
    if (userIdEl) userIdEl.textContent = user.user_id || 'N/A';

    // Member since date
    const memberEl = document.getElementById('memberSince');
    if (memberEl) {
      if (user.created_at) {
        const memberDate = new Date(user.created_at);
        memberEl.textContent = memberDate.toLocaleDateString();
      } else {
        memberEl.textContent = 'N/A';
      }
    }

    // fetch challenges first, build id->name map (so completions can show names)
    fetchMethod('/challenges', function (chStatus, challenges) {
      challengeNameMap = {};

      if (chStatus === 200 && Array.isArray(challenges)) {
        challenges.forEach(function (c) {
          // Try common fields; fall back to description; last fallback = ID label
          const name =
            c.title ||
            c.name ||
            c.challenge_name ||
            c.description ||
            `Challenge #${c.challenge_id}`;

          challengeNameMap[c.challenge_id] = name;
        });
      } else {
        console.error('Error loading challenges for name map:', challenges);
      }

      // Now load completions
      fetchMethod('/completions/my-completions', function (cStatus, completions) {
        const completedEl = document.getElementById('completedChallenges');
        if (!completedEl) {
          if (typeof done === 'function') done();
          return;
        }

        if (cStatus === 200 && Array.isArray(completions)) {
          completedEl.textContent = completions.length;

          // Completion tracking list (last 5) + show challenge names if available
          renderRecentCompletions(completions);

        } else {
          console.error('Error loading completions:', completions);
          completedEl.textContent = '0';

          // Render empty state if container exists
          renderRecentCompletions([]);
        }

        if (typeof done === 'function') done();
      }, 'GET');
    }, 'GET');
  }, 'GET');
}

function loadUserCharacters(done) {
  fetchMethod('/characters', function (status, characters) {
    if (status !== 200 || !Array.isArray(characters)) {
      console.error('Error loading characters:', characters);
      const grid = document.getElementById('charactersGrid');
      if (grid) {
        grid.innerHTML = `
          <div class="col-12 text-center py-5">
            <p class="text-danger">Error loading characters</p>
          </div>
        `;
      }
      if (typeof done === 'function') done();
      return;
    }

    // Update total adventurers count
    const totalEl = document.getElementById('totalAdventurers');
    if (totalEl) totalEl.textContent = characters.length || 0;

    const grid = document.getElementById('charactersGrid');
    if (!grid) {
      if (typeof done === 'function') done();
      return;
    }

    if (characters.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <p class="text-light">Visit the shop to get your character!</p>
          <a href="shop.html" class="btn btn-primary">Go to Shop</a>
        </div>
      `;
      if (typeof done === 'function') done();
      return;
    }

    // Render characters
    const charactersHTML = characters.map(function (character) {
      // Use effective HP if present (artifact equipped)
      const displayCurrentHp =
        (character.effective_current_hp !== undefined && character.effective_current_hp !== null)
          ? Number(character.effective_current_hp)
          : Number(character.current_hp);

      const displayMaxHp =
        (character.effective_max_hp !== undefined && character.effective_max_hp !== null)
          ? Number(character.effective_max_hp)
          : Number(character.max_hp);

      const safeMaxHp = displayMaxHp > 0 ? displayMaxHp : 1;
      const hpPercentage = Math.round((displayCurrentHp / safeMaxHp) * 100);
      const hpClass = hpPercentage > 70 ? 'bg-success' : hpPercentage > 30 ? 'bg-warning' : 'bg-danger';

      // XP display
      const xpForLevel = Number(character.level) * 500;
      const xpPercentage = Math.min(Math.round((Number(character.experience) / (xpForLevel || 1)) * 100), 100);

      return `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100 ${character.is_equipped ? 'border-primary border-3' : ''}">
            <div class="card-body">
              <div class="text-center mb-3">
                <img src="${character.image_url || ''}"
                     class="img-fluid rounded-circle"
                     style="width: 100px; height: 100px; object-fit: cover;"
                     alt="${character.character_name || 'Character'}">
              </div>

              <h5 class="text-white text-center mb-2">${character.character_name || 'Unknown'}</h5>

              <div class="text-center mb-3">
                <span class="badge ${getElementColorClass(character.element)} me-1">
                  ${character.element || 'Unknown'}
                </span>
                <span class="badge bg-secondary">Lv.${character.level || 1}</span>
                ${character.is_equipped ? '<span class="badge bg-primary ms-1">Equipped</span>' : ''}
              </div>

              <!-- HP Bar -->
              <div class="mb-2">
                <div class="d-flex justify-content-between mb-1">
                  <small class="text-light">HP</small>
                  <small class="text-light">${displayCurrentHp}/${displayMaxHp}</small>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar ${hpClass}" style="width: ${hpPercentage}%"></div>
                </div>
              </div>

              <!-- XP Bar -->
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <small class="text-light">XP</small>
                  <small class="text-light">${character.experience || 0}/${xpForLevel || 0}</small>
                </div>
                <div class="progress" style="height: 6px;">
                  <div class="progress-bar bg-info" style="width: ${xpPercentage}%"></div>
                </div>
              </div>

              <div class="d-grid gap-2">
                ${!character.is_equipped
                  ? `<button class="btn btn-sm btn-primary" onclick="equipCharacter(${character.user_character_id})">Equip</button>`
                  : '<button class="btn btn-sm btn-outline-primary" disabled>Currently Equipped</button>'
                }
                <button class="btn btn-sm btn-outline-success" onclick="viewCharacterDetails(${character.user_character_id})">Details</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = charactersHTML;

    if (typeof done === 'function') done();
  }, 'GET');
}

function equipCharacter(userCharacterId) {
  fetchMethod(`/characters/${userCharacterId}/equip`, function (status, data) {
    if (status !== 200) {
      console.error('Error equipping character:', data);
      if (typeof showAlert === 'function') showAlert(data && data.message ? data.message : 'Error equipping character', 'danger');
      return;
    }

    if (typeof showAlert === 'function') showAlert('Character equipped successfully!', 'success');

    // Reload characters
    loadUserCharacters(function () {});
  }, 'PUT', {});
}

function viewCharacterDetails(userCharacterId) {
  window.location.href = `inventory.html?character=${userCharacterId}`;
}

function healAllCharacters() {
  if (typeof showAlert === 'function') showAlert('Heal all feature coming soon!', 'info');
}

function getElementColorClass(element) {
  const elementClasses = {
    Pyro: 'bg-pyro',
    Hydro: 'bg-hydro',
    Anemo: 'bg-anemo',
    Electro: 'bg-electro',
    Dendro: 'bg-dendro',
    Cryo: 'bg-cryo',
    Geo: 'bg-geo'
  };

  return elementClasses[element] || 'bg-secondary';
}

function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      logout();
    });
  }

  // Heal all button
  const healAllBtn = document.getElementById('healAllBtn');
  if (healAllBtn) {
    healAllBtn.addEventListener('click', healAllCharacters);
  }

  // Search functionality
  const searchInput = document.getElementById('characterSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(filterCharacters, 300));
  }

  // Filter dropdowns
  const elementFilter = document.getElementById('elementFilter');
  if (elementFilter) {
    elementFilter.addEventListener('change', filterCharacters);
  }

  const healthFilter = document.getElementById('healthFilter');
  if (healthFilter) {
    healthFilter.addEventListener('change', filterCharacters);
  }
}

function filterCharacters() {
  const searchTerm = (document.getElementById('characterSearch')?.value || '').toLowerCase();
  const elementFilter = document.getElementById('elementFilter')?.value || '';
  const healthFilter = document.getElementById('healthFilter')?.value || '';

  const characterCards = document.querySelectorAll('#charactersGrid > div');

  characterCards.forEach(function (card) {
    const characterName = (card.textContent || '').toLowerCase();
    const matchesSearch = characterName.includes(searchTerm);
    const matchesElement = !elementFilter || card.innerHTML.includes(elementFilter);

    // Health filter logic
    let matchesHealth = true;
    if (healthFilter) {
      const hpText = card.querySelector('.progress')?.previousElementSibling?.textContent || '';
      const hpMatch = hpText.match(/(\d+)\s*\/\s*(\d+)/);
      if (hpMatch) {
        const current = parseInt(hpMatch[1], 10);
        const max = parseInt(hpMatch[2], 10);
        const percentage = (current / (max || 1)) * 100;

        if (healthFilter === 'healthy') matchesHealth = percentage >= 70;
        if (healthFilter === 'wounded') matchesHealth = percentage >= 30 && percentage < 70;
        if (healthFilter === 'critical') matchesHealth = percentage < 30;
      }
    }

    card.style.display = (matchesSearch && matchesElement && matchesHealth) ? '' : 'none';
  });
}

// ===============================
// COMPLETION TRACKING
// ===============================
function renderRecentCompletions(completions) {
  const section = document.getElementById('recentCompletionsSection');
  const list = document.getElementById('recentCompletionsList');
  if (!section || !list) return; // don't break your page if HTML not added yet

  section.style.display = 'block';

  if (!Array.isArray(completions) || completions.length === 0) {
    list.innerHTML = `
      <li class="list-group-item bg-dark text-muted">
        No completions yet. Complete a challenge to see it here!
      </li>
    `;
    return;
  }

  const sorted = completions.slice().sort(function (a, b) {
    const ta = new Date(a.completed_at || 0).getTime();
    const tb = new Date(b.completed_at || 0).getTime();
    return tb - ta;
  });

  const recent = sorted.slice(0, 5);

  list.innerHTML = recent.map(function (c) {
    const name = challengeNameMap[c.challenge_id] || `Challenge #${c.challenge_id}`;

    return `
      <li class="list-group-item bg-dark text-light">
        <div class="d-flex justify-content-between">
          <strong>${escapeHTML(name)}</strong>
          <small class="text-muted">${escapeHTML(formatDateTime(c.completed_at))}</small>
        </div>
        <div class="small text-light mt-1">
          ${escapeHTML(c.details || '')}
        </div>
      </li>
    `;
  }).join('');
}

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Make functions globally available
window.equipCharacter = equipCharacter;
window.viewCharacterDetails = viewCharacterDetails;
