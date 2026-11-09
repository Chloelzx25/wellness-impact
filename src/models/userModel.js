const pool = require('../services/db');

module.exports.selectAll = (callback) => {
  const SQL = `
    SELECT user_id, username, email, points, role, created_at
    FROM User;
  `;
  pool.query(SQL, callback);
};

module.exports.selectById = (data, callback) => {
  const SQL = `
    SELECT user_id, username, email, points, role, created_at
    FROM User
    WHERE user_id = ?;
  `;
  pool.query(SQL, [data.id], callback);
};

module.exports.insertSingle = (data, callback) => {
  const SQL = `
    INSERT INTO User (username, email, password, points, role)
    VALUES (?, ?, ?, ?, ?);
  `;
  pool.query(SQL, [data.username, data.email, data.password, data.points, data.role], callback);
};

/* module.exports.updateById = (data, callback) => {
  const SQL = `
    UPDATE User
    SET username = ?, points = ?
    WHERE user_id = ?;
  `;
  pool.query(SQL, [data.username, data.points, data.id], callback);
}; */

module.exports.findUserByUsername = (username, callback) => {
  const SQL = `
  SELECT * FROM User 
  WHERE username = ?;
  `;
  pool.query(SQL, [username], callback);
};

module.exports.findUserByEmail = (email, callback) => {
  const SQL = `
  SELECT * FROM User 
  WHERE email = ?;
  `;
  pool.query(SQL, [email], callback);
};

module.exports.findUserById = (user_id, callback) => {
  const SQL = `
  SELECT user_id FROM User 
  WHERE user_id = ?;
  `;
  pool.query(SQL, [user_id], callback);
};

module.exports.giveStarterCharacter = (data, callback) => {
  const SQL = `
    INSERT INTO UserCharacter
      (user_id, character_id, character_name, element, class_type,
       current_hp, max_hp, level, experience, is_equipped, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  pool.query(SQL, [
    data.user_id,
    data.character_id,
    data.character_name,
    data.element,
    data.class_type,
    data.current_hp,
    data.max_hp,
    data.level,
    data.experience,
    data.is_equipped,
    data.image_url
  ], callback);
};

module.exports.getUserWithCharacter = (userId, callback) => {
  const SQL = `
    SELECT u.user_id, u.username, u.email, u.points, u.role,
           uc.user_character_id, uc.character_name, uc.element,
           uc.current_hp, uc.max_hp, uc.level, uc.experience
    FROM User u
    LEFT JOIN UserCharacter uc
      ON u.user_id = uc.user_id AND uc.is_equipped = TRUE
    WHERE u.user_id = ?;
  `;
  pool.query(SQL, [userId], callback);
};

module.exports.selectPublic = (callback) => {
  const SQL = `
    SELECT user_id, username
    FROM User;
  `;
  pool.query(SQL, callback);
};
