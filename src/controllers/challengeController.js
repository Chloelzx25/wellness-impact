const challengeModel = require("../models/challengeModel.js");
const userModel = require("../models/userModel.js");

module.exports.readAllChallenges = (req, res, next) =>
{
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllChallenges:", error);
            res.status(500).json(error);
        }
        else res.status(200).json(results);
    }

    challengeModel.selectAll(callback);
}

/* module.exports.getChallengeById = (req, res) => {
  challengeModel.selectById({ challenge_id: req.params.challenge_id }, (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: "Challenge not found" });
    res.status(200).json(results[0]);
  });
}; */

module.exports.createNewChallenge = (req, res, next) =>
{
    if (req.body.description == undefined || req.body.description.trim() === "" || req.body.points == undefined) {
        return res.status(400).json({
            message: "Error: description or points are undefined"
        });
    }

    const data = {
        creator_id: res.locals.userId,
        description: req.body.description,
        points: req.body.points
    }

    const userData = {
        user_id: data.creator_id
    }

    userModel.findUserById(userData, (error, results) => {
        if (error) {
            console.error("Error findUserById:", error);
            return res.status(500).json(error);
        }

        if (results.length == 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        challengeModel.insertSingle(data, (error, results) => {
            if (error) {
                console.error("Error insertSingle:", error);
                return res.status(500).json(error);
            }

            res.status(201).json({
                challenge_id: results.insertId,
                ...data
            });
        });
    });
}

/* module.exports.updateChallengeById = (req, res) => {
  const userId = res.locals.userId;
  const { description, points } = req.body;

  if (!description || points === undefined || points === null) {
    return res.status(400).json({ message: "Error: description or points are undefined" });
  }

  const data = {
    challenge_id: req.params.challenge_id,
    creator_id: userId,
    description,
    points,
  };

  challengeModel.selectById({ challenge_id: data.challenge_id }, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) return res.status(404).json({ message: "Challenge not found" });

    if (rows[0].creator_id != userId) {
      return res.status(403).json({ message: "Forbidden: Not challenge owner" });
    }

    challengeModel.updateById(data, (err2, result) => {
      if (err2) return res.status(500).json(err2);
      if (result.affectedRows === 0) return res.status(404).json({ message: "Challenge not found" });
      res.status(200).json(data);
    });
  });
}; */

module.exports.deleteChallengeById = (req, res) => {
  challengeModel.deleteById({ challenge_id: req.params.challenge_id }, (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Challenge not found" });
    res.status(204).send();
  });
};
