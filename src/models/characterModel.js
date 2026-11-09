const pool = require('../services/db');

// Get all characters for a user (+ auto-heal helper fields)
module.exports.selectByUserId = (userId, callback) => {
  const SQL = `
    SELECT uc.*,
           TIMESTAMPDIFF(HOUR, uc.last_full_health, NOW()) AS hours_since_full_health,
           CASE WHEN TIMESTAMPDIFF(HOUR, uc.last_full_health, NOW()) >= 72 THEN 1 ELSE 0 END AS is_fully_healed
    FROM UserCharacter uc
    WHERE uc.user_id = ?
    ORDER BY uc.is_equipped DESC, uc.user_character_id DESC;
  `;
  pool.query(SQL, [userId], callback);
};

// Get equipped character (+ auto-heal helper fields)
module.exports.getEquippedCharacter = (userId, callback) => {
  const SQL = `
    SELECT uc.*,
           TIMESTAMPDIFF(HOUR, uc.last_full_health, NOW()) AS hours_since_full_health,
           CASE WHEN TIMESTAMPDIFF(HOUR, uc.last_full_health, NOW()) >= 72 THEN 1 ELSE 0 END AS is_fully_healed
    FROM UserCharacter uc
    WHERE uc.user_id = ? AND uc.is_equipped = TRUE
    LIMIT 1;
  `;
  pool.query(SQL, [userId], callback);
};

// Unequip all characters
module.exports.unequipAll = (userId, callback) => {
  const SQL = `
  UPDATE UserCharacter 
  SET is_equipped = FALSE 
  WHERE user_id = ?;
  `;
  pool.query(SQL, [userId], callback);
};

// Equip a specific character
module.exports.equipCharacter = (data, callback) => {
  const SQL = `
    UPDATE UserCharacter
    SET is_equipped = TRUE
    WHERE user_id = ? AND user_character_id = ?;
  `;
  pool.query(SQL, [data.user_id, data.user_character_id], callback);
};

// Verify character belongs to user
module.exports.getCharacterById = (data, callback) => {
  const SQL = `
    SELECT * FROM UserCharacter
    WHERE user_id = ? AND user_character_id = ?;
  `;
  pool.query(SQL, [data.user_id, data.user_character_id], callback);
};

// Update HP (current_hp only)
module.exports.updateCharacterHp = (data, callback) => {
  const SQL = `
  UPDATE UserCharacter 
  SET current_hp = ? 
  WHERE user_character_id = ?;
  `;
  pool.query(SQL, [data.current_hp, data.user_character_id], callback);
};

//  Update BOTH current_hp and max_hp (for artifact equip/unequip)
module.exports.updateCharacterHpBoth = (data, callback) => {
  const SQL = `
    UPDATE UserCharacter 
    SET current_hp = ?, max_hp = ? 
    WHERE user_character_id = ?;
  `;
  pool.query(SQL, [data.current_hp, data.max_hp, data.user_character_id], callback);
};

// Set last_full_health to now
module.exports.updateLastFullHealth = (userCharacterId, callback) => {
  const SQL = `
  UPDATE UserCharacter 
  SET last_full_health = NOW()
  WHERE user_character_id = ?;
  `;
  pool.query(SQL, [userCharacterId], callback);
};

// Add XP
module.exports.addXP = (data, callback) => {
  const SQL = `
  UPDATE UserCharacter 
  SET experience = experience + ? 
  WHERE user_character_id = ?;
  `;
  pool.query(SQL, [data.xp_amount, data.user_character_id], callback);
};

// Level up: level set + max_hp + current_hp add
module.exports.levelUp = (data, callback) => {
  const SQL = `
    UPDATE UserCharacter
    SET level = ?,
        max_hp = max_hp + ?,
        current_hp = current_hp + ?
    WHERE user_character_id = ?;
  `;
  pool.query(SQL, [data.new_level, data.hp_increase, data.hp_increase, data.user_character_id], callback);
};

// Update last challenge completion (cooldown)
module.exports.updateLastChallengeCompletion = (userCharacterId, callback) => {
  const SQL = `
    UPDATE UserCharacter
    SET last_challenge_completion = NOW()
    WHERE user_character_id = ?;
  `;
  pool.query(SQL, [userCharacterId], callback);
};

module.exports.addCharacter = (data, callback) => {
  const SQLSTATEMENT = `
    INSERT INTO UserCharacter (
      user_id, character_id, character_name, element, class_type,
      current_hp, max_hp, level, experience, is_equipped, image_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const VALUES = [
    data.user_id,
    data.character_id,
    data.character_name,
    data.element,
    data.class_type,
    data.current_hp,
    data.max_hp,
    data.level || 1,
    data.experience || 0,
    data.is_equipped || false,
    data.image_url
  ];

  pool.query(SQLSTATEMENT, VALUES, callback);
};