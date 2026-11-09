const completionModel = require("../models/completionModel.js");
const characterModel = require("../models/characterModel.js");
const minigameModel = require("../models/minigameModel.js");
const challengeModel = require("../models/challengeModel.js");
const inventoryModel = require("../models/inventoryModel.js");

/* 
module.exports.readAllCompletion = (req, res, next) =>
{
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readAllCompletion:", error);
            res.status(500).json(error);
        }
        else res.status(200).json(results);
    }

    completionModel.selectAll(callback);
} 
*/

/* 
module.exports.readCompletionsByChallengeId = (req, res, next) =>
{
    const data = {
        challenge_id: req.params.challenge_id
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error readCompletionsByChallengeId:", error);
            res.status(500).json(error);
        } else {
            if (results.length == 0) {
                res.status(404).json({
                    message: "No completions found"
                });
            }
            else res.status(200).json(results);
        }
    }

    completionModel.getByChallengeId(data, callback);
} 
*/

//////////////////////////////////////////////////////
// GET USER COMPLETIONS
//////////////////////////////////////////////////////
module.exports.getUserCompletions = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error getUserCompletions:", error);
            res.status(500).json(error);
        }
        else res.status(200).json(results);
    }

    completionModel.getByUserId(data, callback);
}

//////////////////////////////////////////////////////
// CREATE COMPLETION BY CHALLENGE ID
//////////////////////////////////////////////////////
module.exports.createCompletionByChallengeId = (req, res, next) =>
{
    if (req.body.details == undefined) {
        return res.status(400).json({
            message: "Error: details is undefined"
        });
    }

    const data = {
        user_id: res.locals.userId,
        challenge_id: req.params.challenge_id,
        details: req.body.details
    }

    characterModel.getEquippedCharacter(data.user_id, (error, results) => {
        if (error) {
            console.error("Error getEquippedCharacter:", error);
            return res.status(500).json(error);
        }

        if (results.length == 0) {
            return res.status(400).json({
                message: "No equipped character"
            });
        }

        const character = results[0];

        minigameModel.getUserAttempts(data.user_id, (error, results) => {
            if (error) {
                console.error("Error getUserAttempts:", error);
                return res.status(500).json(error);
            }

            const latestAttempt = results.find(attempt => attempt.challenge_id == data.challenge_id);
            if (!latestAttempt) {
                return res.status(400).json({
                    message: "No minigame attempt found for this challenge"
                });
            }

            const latestSuccess = (latestAttempt.success == 1 || latestAttempt.success == true || latestAttempt.success == "1");
            if (!latestSuccess) {
                return res.status(400).json({
                    message: "Latest minigame attempt was not successful"
                });
            }

            const userData = {
                user_id: data.user_id
            }

            completionModel.getByUserId(userData, (error, results) => {
                if (error) {
                    console.error("Error getByUserId:", error);
                    return res.status(500).json(error);
                }

                const recent = results
                    .filter(completion => completion.challenge_id == data.challenge_id)
                    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];

                if (recent) {
                    const completedTime = new Date(recent.completed_at);
                    const minutesSince = (Date.now() - completedTime.getTime()) / (1000 * 60);

                    if (minutesSince < 30) {
                        const remaining = Math.ceil(30 - minutesSince);

                        return res.status(429).json({
                            message: `Cooldown active. ${remaining} minutes remaining`,
                            cooldown_remaining_minutes: remaining
                        });
                    }
                }

                // pass challenge_id (value), not object
                challengeModel.getPointsAndDescription(data.challenge_id, (error, results) => {
                    if (error) {
                        console.error("Error getPointsAndDescription:", error);
                        return res.status(500).json(error);
                    }

                    if (results.length == 0) {
                        return res.status(404).json({
                            message: "Challenge not found"
                        });
                    }

                    const points = Number(results[0].points);

                    const completionData = {
                        challenge_id: data.challenge_id,
                        user_id: data.user_id,
                        details: data.details
                    }

                    completionModel.insertSingle(completionData, (error, results) => {
                        if (error) {
                            console.error("Error insertSingle:", error);
                            return res.status(500).json(error);
                        }

                        const pointsData = {
                            user_id: data.user_id,
                            points: points
                        }

                        completionModel.updateUserPoints(pointsData, (error) => {
                            if (error) {
                                console.error("Error updateUserPoints:", error);
                                return res.status(500).json(error);
                            }

                            // XP = points * 5, plus weapon boost
                            const baseXP = points * 5;

                            inventoryModel.getEquippedWeapon(data.user_id, (error, results) => {
                                if (error) {
                                    console.error("Error getEquippedWeapon:", error);
                                    return res.status(500).json(error);
                                }

                                let totalXP = baseXP;
                                let xpBoost = 0;

                                if (results.length > 0) {
                                    const boostPct = Number(results[0].xp_boost_percentage) || 0;
                                    xpBoost = Math.floor(baseXP * (boostPct / 100));
                                    totalXP = baseXP + xpBoost;
                                }

                                const newXP = Number(character.experience) + totalXP;
                                const oldLevel = Number(character.level);
                                const newLevel = Math.floor(newXP / 500) + 1;
                                const levelsGained = newLevel - oldLevel;

                                const xpData = {
                                    user_character_id: character.user_character_id,
                                    xp_amount: totalXP
                                }

                                characterModel.addXP(xpData, (error) => {
                                    if (error) {
                                        console.error("Error addXP:", error);
                                        return res.status(500).json(error);
                                    }

                                    if (levelsGained > 0) {
                                        const hpIncrease = levelsGained * 10;

                                        const levelUpData = {
                                            user_character_id: character.user_character_id,
                                            new_level: newLevel,
                                            hp_increase: hpIncrease
                                        }

                                        characterModel.levelUp(levelUpData, (error) => {
                                            if (error) {
                                                console.error("Error levelUp:", error);
                                                return res.status(500).json(error);
                                            }

                                            res.status(201).json({
                                                completion_id: results.insertId,
                                                challenge_id: data.challenge_id,
                                                points_earned: points,
                                                xp_gained: totalXP,
                                                xp_boost: xpBoost,
                                                level_up: true,
                                                old_level: oldLevel,
                                                new_level: newLevel,
                                                hp_increased: hpIncrease
                                            });
                                        });
                                    } else {
                                        res.status(201).json({
                                            completion_id: results.insertId,
                                            challenge_id: data.challenge_id,
                                            points_earned: points,
                                            xp_gained: totalXP,
                                            xp_boost: xpBoost,
                                            level_up: false,
                                            current_level: oldLevel
                                        });
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}
