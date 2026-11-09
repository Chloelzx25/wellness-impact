const pool = require('../services/db');

module.exports.selectAll = (callback) => {
  const SQL = `
    SELECT * FROM WellnessChallenge
    ORDER BY created_at DESC;
  `;
  pool.query(SQL, callback);
};

/* module.exports.selectById = (data, callback) => {
  const SQL = `
    SELECT * FROM WellnessChallenge
    WHERE challenge_id = ?;
  `;
  pool.query(SQL, [data.challenge_id], callback);
}; */

module.exports.insertSingle = (data, callback) => {
  const SQL = `
    INSERT INTO WellnessChallenge (creator_id, description, points)
    VALUES (?, ?, ?);
  `;
  pool.query(SQL, [data.creator_id, data.description, data.points], callback);
};

/* module.exports.updateById = (data, callback) => {
  const SQL = `
    UPDATE WellnessChallenge
    SET creator_id = ?, description = ?, points = ?
    WHERE challenge_id = ?;
  `;
  pool.query(SQL, [data.creator_id, data.description, data.points, data.challenge_id], callback);
}; */

module.exports.deleteById = (data, callback) => {
  const SQL = `
    DELETE FROM WellnessChallenge
    WHERE challenge_id = ?;
  `;
  pool.query(SQL, [data.challenge_id], callback);
};

module.exports.getPointsAndDescription = (challengeId, callback) => {
  const SQL = `
    SELECT points, description
    FROM WellnessChallenge
    WHERE challenge_id = ?;
  `;
  pool.query(SQL, [challengeId], callback);
};
