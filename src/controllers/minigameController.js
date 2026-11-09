const minigameModel = require("../models/minigameModel.js");
const characterModel = require("../models/characterModel.js");
const challengeModel = require("../models/challengeModel.js");
const inventoryModel = require("../models/inventoryModel.js");

//////////////////////////////////////////////////////
// CHECK CAN ATTEMPT
//////////////////////////////////////////////////////
module.exports.checkCanAttempt = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId,
        challenge_id: req.params.challenge_id
    };

    characterModel.getEquippedCharacter(data.user_id, (error, results) => {
        if (error) {
            console.error("Error getEquippedCharacter:", error);
            return res.status(500).json(error);
        }

        if (results.length == 0) {
            return res.status(404).json({
                message: "No equipped character"
            });
        }

        const character = results[0];

        // Per-challenge cooldown (NOT global)
        const cooldownData = {
            user_id: data.user_id,
            challenge_id: data.challenge_id
        };

        minigameModel.getCooldownDataForChallenge(cooldownData, (error, results) => {
            if (error) {
                console.error("Error getCooldownDataForChallenge:", error);
                return res.status(500).json(error);
            }

            const cooldownMinutes = 30;
            const lastCompletedAt = results && results[0] ? results[0].last_completed_at : null;
            const minutesSince = results && results[0] ? Number(results[0].minutes_since_last) : null;

            if (lastCompletedAt && Number.isFinite(minutesSince) && minutesSince < cooldownMinutes) {
                return res.status(429).json({
                    message: "Cooldown active for this challenge",
                    can_attempt: false,
                    cooldown_remaining_minutes: Math.ceil(cooldownMinutes - minutesSince)
                });
            }

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

                const challenge = results[0];

                // Artifact HP boost for equipped character
                inventoryModel.getEquippedArtifactBoostForCharacter(character.user_character_id, (error, results) => {
                    const artifactBoost = (!error && results && results.length > 0)
                        ? Number(results[0].total_hp_boost || 0)
                        : 0;

                    const effectiveMax = Number(character.max_hp) + artifactBoost;
                    const effectiveCurrent = Math.min(Number(character.current_hp), effectiveMax);

                    // block if character is down (0 HP)
                    if (!Number.isFinite(effectiveCurrent) || effectiveCurrent < 10) {
                        return res.status(403).json({
                            message: "Character has insufficient HP. Heal or equip another character to play minigames.",
                            can_attempt: false,
                            character: {
                                user_character_id: character.user_character_id,
                                character_name: character.character_name,
                                element: character.element,
                                level: character.level,
                                base_max_hp: character.max_hp,
                                artifact_hp_boost: artifactBoost,
                                max_hp: effectiveMax,
                                current_hp: Math.max(0, effectiveCurrent)
                            }
                        });
                    }

                    return res.status(200).json({
                        message: "You can attempt the minigame",
                        can_attempt: true,
                        challenge: {
                            challenge_id: Number(data.challenge_id),
                            description: challenge.description,
                            points: Number(challenge.points)
                        },
                        character: {
                            user_character_id: character.user_character_id,
                            character_name: character.character_name,
                            element: character.element,
                            level: character.level,
                            base_max_hp: character.max_hp,
                            artifact_hp_boost: artifactBoost,
                            max_hp: effectiveMax,
                            current_hp: effectiveCurrent
                        }
                    });
                });
            });
        });
    });
};

//////////////////////////////////////////////////////
// ATTEMPT MINIGAME
//////////////////////////////////////////////////////
module.exports.attemptMinigame = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId,
        challenge_id: req.params.challenge_id
    };

    if (req.body.success === undefined) {
        return res.status(400).json({ message: "Missing success" });
    }

    const successBool = (req.body.success === true || req.body.success === "true");
    const success = successBool ? 1 : 0;
    const hpLost = successBool ? 10 : 15;

    characterModel.getEquippedCharacter(data.user_id, (error, results) => {
        if (error) {
            console.error("Error getEquippedCharacter:", error);
            return res.status(500).json(error);
        }

        if (results.length == 0) {
            return res.status(404).json({ message: "No equipped character" });
        }

        const character = results[0];
        const current = Number(character.current_hp) || 0;
        const newHp = Math.max(current - hpLost, 0);

        const hpData = {
            user_character_id: character.user_character_id,
            current_hp: newHp
        };

        characterModel.updateCharacterHp(hpData, (error) => {
            if (error) {
                console.error("Error updateCharacterHp:", error);
                return res.status(500).json(error);
            }

            const attemptData = {
                user_id: data.user_id,
                challenge_id: data.challenge_id,
                user_character_id: character.user_character_id,
                element: character.element,
                success: success,
                hp_lost: hpLost
            };

            minigameModel.insertAttempt(attemptData, (error, result) => {
                if (error) {
                    console.error("Error insertAttempt:", error);
                    return res.status(500).json(error);
                }

                return res.status(200).json({
                    message: "Minigame attempt recorded",
                    attempt_id: result.insertId,
                    can_complete_challenge: successBool,
                    hp_lost: hpLost,
                    new_hp: newHp
                });
            });
        });
    });
};
