const pool = require('../services/db');

module.exports.selectAll = (callback) => {
  const SQL = `
  SELECT * 
  FROM UserCompletion ORDER BY completed_at DESC;`
  pool.query(SQL, callback);
};

module.exports.getByChallengeId = (data, callback) => {
  const SQL = `
    SELECT user_id, details, completed_at
    FROM UserCompletion
    WHERE challenge_id = ?;
  `;
  pool.query(SQL, [data.challenge_id], callback);
};

module.exports.insertSingle = (data, callback) => {
  const SQL = `
    INSERT INTO UserCompletion (challenge_id, user_id, details)
    VALUES (?, ?, ?);
  `;
  pool.query(SQL, [data.challenge_id, data.user_id, data.details], callback);
};

module.exports.getByUserId = (data, callback) => {
  const SQL = `
    SELECT uc.*,
           wc.description AS challenge_description,
           wc.points AS challenge_points
    FROM UserCompletion uc
    LEFT JOIN WellnessChallenge wc ON uc.challenge_id = wc.challenge_id
    WHERE uc.user_id = ?
    ORDER BY uc.completed_at DESC;
  `;
  pool.query(SQL, [data.user_id], callback);
};

module.exports.updateUserPoints = (data, callback) => {
  const SQL = `
    UPDATE User
    SET points = points + ?
    WHERE user_id = ?;
  `;
  pool.query(SQL, [data.points, data.user_id], callback);
};
