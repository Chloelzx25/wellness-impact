const pool = require("../services/db");

module.exports.insertAttempt = (data, callback) => {
  const SQL = `
    INSERT INTO MinigameAttempt (user_id, challenge_id, user_character_id, element, success, hp_lost)
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  pool.query(
    SQL,
    [
      data.user_id,
      data.challenge_id,
      data.user_character_id,
      data.element,
      data.success,
      data.hp_lost
    ],
    callback
  );
};

module.exports.getUserAttempts = (userId, callback) => {
  const SQL = `
    SELECT ma.*, wc.description AS challenge_description
    FROM MinigameAttempt ma
    JOIN WellnessChallenge wc ON ma.challenge_id = wc.challenge_id
    WHERE ma.user_id = ?
    ORDER BY ma.attempted_at DESC
    LIMIT 50;
  `;
  pool.query(SQL, [userId], callback);
};

// PER-CHALLENGE cooldown using UserCompletion
module.exports.getCooldownDataForChallenge = (data, callback) => {
  const SQL = `
    SELECT
      MAX(uc.completed_at) AS last_completed_at,
      TIMESTAMPDIFF(MINUTE, MAX(uc.completed_at), NOW()) AS minutes_since_last
    FROM UserCompletion uc
    WHERE uc.user_id = ? AND uc.challenge_id = ?;
  `;
  pool.query(SQL, [data.user_id, data.challenge_id], callback);
};
