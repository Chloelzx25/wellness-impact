const pool = require('../services/db');

// List inventory items with item_effect + equipped_to_character info
module.exports.getInventoryByUserId = (userId, callback) => {
  const SQL = `
    SELECT ui.*,
           CASE ui.item_type
             WHEN 'weapon' THEN w.xp_boost_percentage
             WHEN 'artifact' THEN a.hp_boost
             WHEN 'food' THEN f.heal_amount
           END AS item_effect,
           CASE ui.item_type
             WHEN 'weapon' THEN w.weapon_type
             ELSE NULL
           END AS weapon_type,
           uc.character_name AS equipped_to_character_name
    FROM UserInventory ui
    LEFT JOIN WeaponShop w
      ON ui.item_type = 'weapon' AND ui.item_id = w.weapon_id
    LEFT JOIN ArtifactShop a
      ON ui.item_type = 'artifact' AND ui.item_id = a.artifact_id
    LEFT JOIN FoodShop f
      ON ui.item_type = 'food' AND ui.item_id = f.food_id
    LEFT JOIN UserCharacter uc
      ON ui.equipped_to_character_id = uc.user_character_id
    WHERE ui.user_id = ?
    ORDER BY ui.item_type, ui.is_equipped DESC, ui.inventory_id DESC;
  `;
  pool.query(SQL, [userId], callback);
};

// Get one inventory row (ownership check)
module.exports.getInventoryItemById = (data, callback) => {
  const SQL = `
    SELECT *
    FROM UserInventory
    WHERE user_id = ? AND inventory_id = ?
    LIMIT 1;
  `;
  pool.query(SQL, [data.user_id, data.inventory_id], callback);
};

module.exports.addItem = (data, callback) => {
  const SQL = `
    INSERT INTO UserInventory (user_id, item_type, item_id, item_name, image_url, quantity, is_equipped, equipped_to_character_id)
    VALUES (?, ?, ?, ?, ?, ?, FALSE, NULL);
  `;

  const VALUES = [
    data.user_id,
    data.item_type,
    data.item_id,
    data.item_name,
    data.image_url,
    data.quantity || 1
  ];

  pool.query(SQL, VALUES, callback);
};

// Unequip all items of a type FROM a specific character
module.exports.unequipAllOfTypeFromCharacter = (data, callback) => {
  const SQL = `
    UPDATE UserInventory
    SET is_equipped = FALSE, equipped_to_character_id = NULL
    WHERE user_id = ? AND equipped_to_character_id = ? AND item_type = ?;
  `;
  pool.query(SQL, [data.user_id, data.character_id, data.item_type], callback);
};

// Equip one inventory item TO a specific character
module.exports.equipToCharacter = (data, callback) => {
  const SQL = `
    UPDATE UserInventory
    SET is_equipped = TRUE, equipped_to_character_id = ?
    WHERE user_id = ? AND inventory_id = ?;
  `;
  pool.query(SQL, [data.character_id, data.user_id, data.inventory_id], callback);
};

// Unequip one inventory item (clear character reference)
module.exports.unequipOne = (data, callback) => {
  const SQL = `
    UPDATE UserInventory
    SET is_equipped = FALSE, equipped_to_character_id = NULL
    WHERE user_id = ? AND inventory_id = ?;
  `;
  pool.query(SQL, [data.user_id, data.inventory_id], callback);
};

// Get weapon detail via inventory_id
module.exports.getWeaponByInventoryId = (data, callback) => {
  const SQL = `
    SELECT ui.inventory_id, ui.user_id, ui.item_id AS weapon_id,
           w.weapon_name, w.weapon_type, w.xp_boost_percentage
    FROM UserInventory ui
    JOIN WeaponShop w ON ui.item_id = w.weapon_id
    WHERE ui.user_id = ? AND ui.inventory_id = ? AND ui.item_type = 'weapon'
    LIMIT 1;
  `;
  pool.query(SQL, [data.user_id, data.inventory_id], callback);
};

// Get artifact HP boost by inventory_id
module.exports.getArtifactBoostByInventoryId = (inventoryId, callback) => {
  const SQL = `
    SELECT a.hp_boost
    FROM UserInventory ui
    JOIN ArtifactShop a ON ui.item_id = a.artifact_id
    WHERE ui.inventory_id = ? AND ui.item_type = 'artifact'
    LIMIT 1;
  `;
  pool.query(SQL, [inventoryId], callback);
};

// Get food detail via inventory_id
module.exports.getFoodByInventoryId = (data, callback) => {
  const SQL = `
    SELECT ui.inventory_id, ui.user_id, ui.quantity,
           f.food_id, f.food_name, f.heal_amount
    FROM UserInventory ui
    JOIN FoodShop f ON ui.item_id = f.food_id
    WHERE ui.user_id = ? AND ui.inventory_id = ? AND ui.item_type = 'food'
    LIMIT 1;
  `;
  pool.query(SQL, [data.user_id, data.inventory_id], callback);
};

// Decrease food quantity
module.exports.decreaseFoodQuantity = (inventoryId, callback) => {
  const SQL = `
    UPDATE UserInventory
    SET quantity = quantity - 1
    WHERE inventory_id = ? AND quantity > 0;
  `;
  pool.query(SQL, [inventoryId], callback);
};

// Remove inventory row
module.exports.removeInventoryRow = (inventoryId, callback) => {
  const SQL = `
  DELETE FROM UserInventory 
  WHERE inventory_id = ?;`;
  pool.query(SQL, [inventoryId], callback);
};

// Get equipped weapon for a specific character (XP boost)
module.exports.getEquippedWeaponForCharacter = (characterId, callback) => {
  const SQL = `
    SELECT ui.*, w.weapon_name, w.weapon_type, w.xp_boost_percentage
    FROM UserInventory ui
    JOIN WeaponShop w ON ui.item_id = w.weapon_id
    WHERE ui.equipped_to_character_id = ? AND ui.item_type = 'weapon' AND ui.is_equipped = TRUE
    LIMIT 1;
  `;
  pool.query(SQL, [characterId], callback);
};

// Total equipped artifact HP boost for a specific character
module.exports.getEquippedArtifactBoostForCharacter = (characterId, callback) => {
  const SQL = `
    SELECT COALESCE(SUM(a.hp_boost), 0) AS total_hp_boost
    FROM UserInventory ui
    JOIN ArtifactShop a ON ui.item_id = a.artifact_id
    WHERE ui.equipped_to_character_id = ?
      AND ui.item_type = 'artifact'
      AND ui.is_equipped = TRUE;
  `;
  pool.query(SQL, [characterId], callback);
};

// Get equipped weapon for user (for backward compatibility - gets from equipped character)
module.exports.getEquippedWeapon = (userId, callback) => {
  const SQL = `
    SELECT ui.*, w.weapon_name, w.weapon_type, w.xp_boost_percentage
    FROM UserInventory ui
    JOIN WeaponShop w ON ui.item_id = w.weapon_id
    JOIN UserCharacter uc ON ui.equipped_to_character_id = uc.user_character_id
    WHERE uc.user_id = ? AND uc.is_equipped = TRUE AND ui.item_type = 'weapon' AND ui.is_equipped = TRUE
    LIMIT 1;
  `;
  pool.query(SQL, [userId], callback);
};

// Total equipped artifact HP boost for user (for backward compatibility - gets from equipped character)
module.exports.getEquippedArtifactBoost = (userId, callback) => {
  const SQL = `
    SELECT COALESCE(SUM(a.hp_boost), 0) AS total_hp_boost
    FROM UserInventory ui
    JOIN ArtifactShop a ON ui.item_id = a.artifact_id
    JOIN UserCharacter uc ON ui.equipped_to_character_id = uc.user_character_id
    WHERE uc.user_id = ?
      AND uc.is_equipped = TRUE
      AND ui.item_type = 'artifact'
      AND ui.is_equipped = TRUE;
  `;
  pool.query(SQL, [userId], callback);
};