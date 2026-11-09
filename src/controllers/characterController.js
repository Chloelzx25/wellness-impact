const characterModel = require("../models/characterModel.js");
const inventoryModel = require("../models/inventoryModel.js");

//////////////////////////////////////////////////////
// AUTO-HEAL FUNCTION
//////////////////////////////////////////////////////
function applyAutoHealIfNeeded(character, done)
{
    const hours = Number(character.hours_since_full_health);
    const needsHeal =
        Number.isFinite(hours) &&
        hours >= 72 &&
        Number(character.current_hp) < Number(character.max_hp);

    if (!needsHeal) return done(null, character);

    const hpData = {
        user_character_id: character.user_character_id,
        current_hp: character.max_hp
    }

    characterModel.updateCharacterHp(hpData, (error) => {
        if (error) return done(error);
        
        characterModel.updateLastFullHealth(character.user_character_id, (error) => {
            if (error) return done(error);
            done(null, { 
                ...character, 
                current_hp: character.max_hp, 
                is_fully_healed: 1 
            });
        });
    });
}

//////////////////////////////////////////////////////
// GET USER CHARACTERS
//////////////////////////////////////////////////////
module.exports.getUserCharacters = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId
    }

    characterModel.selectByUserId(data.user_id, (error, results) => {
        if (error) {
            console.error("Error selectByUserId:", error);
            return res.status(500).json(error);
        }

        // Apply auto-heal sequentially, then attach effective stats for EACH character
        let i = 0;
        const out = [];

        const step = () => {
            if (i >= results.length) {
                return res.status(200).json(out);
            }

            applyAutoHealIfNeeded(results[i], (error, character) => {
                if (error) {
                    console.error("Error applyAutoHealIfNeeded:", error);
                    return res.status(500).json(error);
                }

                // Get artifact boost for THIS specific character (not just the equipped one)
                inventoryModel.getEquippedArtifactBoostForCharacter(character.user_character_id, (error, boostResults) => {
                    if (error) {
                        console.error("Error getEquippedArtifactBoostForCharacter:", error);
                        // If error getting boost, just push character as-is
                        out.push(character);
                        i += 1;
                        return step();
                    }

                    const artifactBoost = Number(boostResults[0]?.total_hp_boost || 0);

                    if (artifactBoost > 0) {
                        // This character has artifacts equipped
                        const effectiveMax = Number(character.max_hp) + artifactBoost;
                        
                        // If backend says it fully healed, display current as full effective max.
                        // Otherwise cap by effective max as usual.
                        const effectiveCurrent =  
                        Number(character.is_fully_healed) === 1
                            ? effectiveMax
                            : Math.min(Number(character.current_hp), effectiveMax);
                           
                        out.push({
                            ...character,
                            artifact_hp_boost: artifactBoost,
                            effective_max_hp: effectiveMax,
                            effective_current_hp: effectiveCurrent
                        });
                    } else {
                        // No artifacts equipped to this character
                        out.push(character);
                    }

                    i += 1;
                    step();
                });
            });
        };

        step();
    });
}

//////////////////////////////////////////////////////
// GET EQUIPPED CHARACTER
//////////////////////////////////////////////////////
module.exports.getEquippedCharacter = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId
    }

    inventoryModel.getEquippedArtifactBoost(data.user_id, (error, results) => {
        if (error) {
            console.error("Error getEquippedArtifactBoost:", error);
            return res.status(500).json(error);
        }

        const artifactBoost = Number(results[0]?.total_hp_boost || 0);

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

            applyAutoHealIfNeeded(results[0], (error, character) => {
                if (error) {
                    console.error("Error applyAutoHealIfNeeded:", error);
                    return res.status(500).json(error);
                }

                const effectiveMax = Number(character.max_hp) + artifactBoost;
                const effectiveCurrent = Math.min(Number(character.current_hp), effectiveMax);

                res.status(200).json({
                    ...character,
                    artifact_hp_boost: artifactBoost,
                    effective_max_hp: effectiveMax,
                    effective_current_hp: effectiveCurrent
                });
            });
        });
    });
}

//////////////////////////////////////////////////////
// EQUIP CHARACTER
//////////////////////////////////////////////////////
module.exports.equipCharacter = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId,
        user_character_id: req.params.user_character_id
    }

    const characterData = {
        user_id: data.user_id,
        user_character_id: data.user_character_id
    }

    characterModel.getCharacterById(characterData, (error, results) => {
        if (error) {
            console.error("Error getCharacterById:", error);
            return res.status(500).json(error);
        }

        if (results.length == 0) {
            return res.status(404).json({
                message: "Character not found"
            });
        }

        characterModel.unequipAll(data.user_id, (error) => {
            if (error) {
                console.error("Error unequipAll:", error);
                return res.status(500).json(error);
            }

            const equipData = {
                user_id: data.user_id,
                user_character_id: data.user_character_id
            }

            characterModel.equipCharacter(equipData, (error, results) => {
                if (error) {
                    console.error("Error equipCharacter:", error);
                    return res.status(500).json(error);
                }

                if (results.affectedRows == 0) {
                    return res.status(404).json({
                        message: "Character not found"
                    });
                }

                res.status(200).json({
                    message: "Character equipped successfully",
                    user_character_id: data.user_character_id
                });
            });
        });
    });
}