const pool = require('../services/db');

module.exports.selectAllShopItems = (callback) => {
  const SQL = `
    SELECT
      'character' AS item_type,
      character_id AS id,
      character_name AS name,
      element,
      class_type,
      description,
      image_url,
      price,
      base_hp AS effect_value,
      NULL AS weapon_type
    FROM CharacterShop
    WHERE is_starter = FALSE

    UNION ALL

    SELECT
      'weapon' AS item_type,
      weapon_id AS id,
      weapon_name AS name,
      NULL AS element,
      NULL AS class_type,
      description,
      image_url,
      price,
      xp_boost_percentage AS effect_value,
      weapon_type
    FROM WeaponShop

    UNION ALL

    SELECT
      'artifact' AS item_type,
      artifact_id AS id,
      artifact_name AS name,
      NULL AS element,
      NULL AS class_type,
      description,
      image_url,
      price,
      hp_boost AS effect_value,
      NULL AS weapon_type
    FROM ArtifactShop

    UNION ALL

    SELECT
      'food' AS item_type,
      food_id AS id,
      food_name AS name,
      NULL AS element,
      NULL AS class_type,
      description,
      image_url,
      price,
      heal_amount AS effect_value,
      NULL AS weapon_type
    FROM FoodShop
    ORDER BY item_type, price;
  `;

  pool.query(SQL, callback);
};

//////////////////////////////////////////////////////
// CHARACTERS
//////////////////////////////////////////////////////
module.exports.getCharacterById = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT * FROM CharacterShop 
    WHERE character_id = ?;
    `;
    const VALUES = [data.character_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

module.exports.checkUserOwnsCharacter = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT * FROM UserCharacter
    WHERE user_id = ? AND character_id = ?;
    `;
    const VALUES = [data.user_id, data.character_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

//////////////////////////////////////////////////////
// WEAPONS
//////////////////////////////////////////////////////
module.exports.getWeaponById = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT * FROM WeaponShop 
    WHERE weapon_id = ?;
    `;
    const VALUES = [data.weapon_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

//////////////////////////////////////////////////////
// ARTIFACTS
//////////////////////////////////////////////////////
module.exports.getArtifactById = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT * FROM ArtifactShop 
    WHERE artifact_id = ?;
    `;
    const VALUES = [data.artifact_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

//////////////////////////////////////////////////////
// FOOD
//////////////////////////////////////////////////////
module.exports.getFoodById = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT * FROM FoodShop 
    WHERE food_id = ?;
    `;
    const VALUES = [data.food_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

module.exports.getUserPoints = (data, callback) => {
    const SQLSTATEMENT = `
    SELECT points FROM User 
    WHERE user_id = ?;
    `;
    const VALUES = [data.user_id];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

module.exports.deductUserPoints = (data, callback) => {
  const SQL = `
    UPDATE User
    SET points = points - ?
    WHERE user_id = ?;
  `;
  pool.query(SQL, [data.amount, data.user_id], callback);
};

module.exports.addItemToInventory = (data, callback) => {
  // Always create a new row (no stacking)
  const INSERT_SQL = `
    INSERT INTO UserInventory (user_id, item_type, item_id, item_name, image_url, quantity, is_equipped)
    VALUES (?, ?, ?, ?, ?, ?, FALSE);
  `;

  return pool.query(
    INSERT_SQL,
    [
      data.user_id,
      data.item_type,
      data.item_id,
      data.item_name,
      data.image_url,
      data.quantity || 1
    ],
    callback
  );
};

