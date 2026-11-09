const inventoryModel = require('../models/inventoryModel');
const characterModel = require('../models/characterModel');

const CLASS_WEAPON_MAP = {
    Warrior: "Sword",
    Lancer: "Polearm",
    Archer: "Bow",
    Tank: "Claymore",
    Mage: "Catalyst"
};

//////////////////////////////////////////////////////
// GET INVENTORY
//////////////////////////////////////////////////////
module.exports.getMyInventory = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId
    }

    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error getMyInventory:", error);
            res.status(500).json({
                message: "Database error"
            });
        } else {
            res.status(200).json(results);
        }
    }

    inventoryModel.getInventoryByUserId(data.user_id, callback);
}

//////////////////////////////////////////////////////
// EQUIP WEAPON 
//////////////////////////////////////////////////////
module.exports.equipWeapon = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId,
        inventory_id: Number(req.params.inventory_id),
        character_id: Number(req.params.character_id)
    }

    if (!data.inventory_id) {
        return res.status(400).json({
            message: "Invalid inventory id"
        });
    }

    if (!data.character_id) {
        return res.status(400).json({
            message: "Invalid character id"
        });
    }

    // Verify character belongs to user
    const charData = {
        user_id: data.user_id,
        user_character_id: data.character_id
    }

    characterModel.getCharacterById(charData, (error, results) => {
        if (error) {
            console.error("Error getCharacterById:", error);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (!results || results.length == 0) {
            return res.status(404).json({
                message: "Character not found"
            });
        }

        const targetChar = results[0];
        const requiredWeaponType = CLASS_WEAPON_MAP[targetChar.class_type];

        if (!requiredWeaponType) {
            return res.status(400).json({
                message: "Character class has no weapon rule"
            });
        }

        // Get weapon info
        const weaponData = {
            user_id: data.user_id,
            inventory_id: data.inventory_id
        }

        inventoryModel.getWeaponByInventoryId(weaponData, (error, results) => {
            if (error) {
                console.error("Error getWeaponByInventoryId:", error);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (!results || results.length == 0) {
                return res.status(404).json({
                    message: "Weapon not found in your inventory"
                });
            }

            const weapon = results[0];

            // Enforce class restriction
            if (weapon.weapon_type != requiredWeaponType) {
                return res.status(400).json({
                    message: `${targetChar.class_type} can only equip ${requiredWeaponType} (this is ${weapon.weapon_type})`
                });
            }

            // Unequip all weapons from this character, then equip this one
            const unequipData = {
                user_id: data.user_id,
                character_id: data.character_id,
                item_type: "weapon"
            }

            inventoryModel.unequipAllOfTypeFromCharacter(unequipData, (error) => {
                if (error) {
                    console.error("Error unequipAllOfTypeFromCharacter:", error);
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                const equipData = {
                    user_id: data.user_id,
                    inventory_id: data.inventory_id,
                    character_id: data.character_id
                }

                inventoryModel.equipToCharacter(equipData, (error, results) => {
                    if (error) {
                        console.error("Error equipToCharacter:", error);
                        return res.status(500).json({
                            message: "Database error"
                        });
                    }

                    if (results.affectedRows == 0) {
                        return res.status(404).json({
                            message: "Weapon not found"
                        });
                    }

                    res.status(200).json({
                        message: "Weapon equipped",
                        inventory_id: data.inventory_id,
                        character_id: data.character_id,
                        character_name: targetChar.character_name
                    });
                });
            });
        });
    });
}

//////////////////////////////////////////////////////
// EQUIP ARTIFACT 
//////////////////////////////////////////////////////
module.exports.equipArtifact = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId,
        inventory_id: Number(req.params.inventory_id),
        character_id: Number(req.params.character_id)
    }

    if (!data.inventory_id) {
        return res.status(400).json({
            message: "Invalid inventory id"
        });
    }

    if (!data.character_id) {
        return res.status(400).json({
            message: "Invalid character id"
        });
    }

    // Verify character belongs to user
    const charData = {
        user_id: data.user_id,
        user_character_id: data.character_id
    }

    characterModel.getCharacterById(charData, (error, results) => {
        if (error) {
            console.error("Error getCharacterById:", error);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (!results || results.length == 0) {
            return res.status(404).json({
                message: "Character not found"
            });
        }

        const targetChar = results[0];

        // Check ownership + must be artifact
        const itemData = {
            user_id: data.user_id,
            inventory_id: data.inventory_id
        }

        inventoryModel.getInventoryItemById(itemData, (error, results) => {
            if (error) {
                console.error("Error getInventoryItemById:", error);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (!results || results.length == 0) {
                return res.status(404).json({
                    message: "Item not found"
                });
            }

            if (results[0].item_type != "artifact") {
                return res.status(400).json({
                    message: "Not an artifact"
                });
            }

            // Get artifact HP boost
            inventoryModel.getArtifactBoostByInventoryId(data.inventory_id, (error, results) => {
                if (error) {
                    console.error("Error getArtifactBoostByInventoryId:", error);
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                const hpBoost = Number(results[0]?.hp_boost || 0);

                // Unequip all artifacts from this character first
                const unequipData = {
                    user_id: data.user_id,
                    character_id: data.character_id,
                    item_type: "artifact"
                }

                inventoryModel.unequipAllOfTypeFromCharacter(unequipData, (error) => {
                    if (error) {
                        console.error("Error unequipAllOfTypeFromCharacter:", error);
                        return res.status(500).json({
                            message: "Database error"
                        });
                    }

                    const newCurrentHp = Math.min(
                        Number(targetChar.current_hp) + hpBoost,
                        Number(targetChar.max_hp) + hpBoost
                    );

                    const hpData = {
                        user_character_id: data.character_id,
                        current_hp: newCurrentHp
                    }

                    characterModel.updateCharacterHp(hpData, (error) => {
                        if (error) {
                            console.error("Error updateCharacterHp:", error);
                            return res.status(500).json({
                                message: "Database error"
                            });
                        }

                        // Equip artifact to character
                        const equipData = {
                            user_id: data.user_id,
                            inventory_id: data.inventory_id,
                            character_id: data.character_id
                        }

                        inventoryModel.equipToCharacter(equipData, (error, results) => {
                            if (error) {
                                console.error("Error equipToCharacter:", error);
                                return res.status(500).json({
                                    message: "Database error"
                                });
                            }

                            if (results.affectedRows == 0) {
                                return res.status(404).json({
                                    message: "Artifact not found"
                                });
                            }

                            res.status(200).json({
                                message: "Artifact equipped",
                                inventory_id: data.inventory_id,
                                character_id: data.character_id,
                                character_name: targetChar.character_name,
                                hp_boost: hpBoost,
                                new_current_hp: newCurrentHp,
                                new_max_hp: Number(targetChar.max_hp) + hpBoost
                            });
                        });
                    });
                });
            });
        });
    });
}

//////////////////////////////////////////////////////
// UNEQUIP ITEM 
//////////////////////////////////////////////////////
module.exports.unequipItem = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId,
        inventory_id: Number(req.params.inventory_id)
    }

    if (!data.inventory_id) {
        return res.status(400).json({
            message: "Invalid inventory id"
        });
    }

    const itemData = {
        user_id: data.user_id,
        inventory_id: data.inventory_id
    }

    inventoryModel.getInventoryItemById(itemData, (error, results) => {
        if (error) {
            console.error("Error getInventoryItemById:", error);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (!results || results.length == 0) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        const item = results[0];
        const equippedToCharId = item.equipped_to_character_id;

        if (!equippedToCharId) {
            return res.status(400).json({
                message: "Item is not equipped to any character"
            });
        }

        // If artifact => reduce HP before unequip
        if (item.item_type == "artifact") {
            inventoryModel.getArtifactBoostByInventoryId(data.inventory_id, (error, results) => {
                if (error) {
                    console.error("Error getArtifactBoostByInventoryId:", error);
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                const hpBoost = Number(results[0]?.hp_boost || 0);

                const charData = {
                    user_id: data.user_id,
                    user_character_id: equippedToCharId
                }

                characterModel.getCharacterById(charData, (error, results) => {
                    if (error) {
                        console.error("Error getCharacterById:", error);
                        return res.status(500).json({
                            message: "Database error"
                        });
                    }

                    if (!results || results.length == 0) {
                        // Character missing => just unequip item
                        return unequipItemDirectly(data.user_id, data.inventory_id, res);
                    }

                    const targetChar = results[0];

                    const newCurrentHp = Math.min(
                        Math.max(1, Number(targetChar.current_hp) - hpBoost),
                        Number(targetChar.max_hp)
                    );

                    const hpData = {
                        user_character_id: equippedToCharId,
                        current_hp: newCurrentHp
                    }

                    characterModel.updateCharacterHp(hpData, (error) => {
                        if (error) {
                            console.error("Error updateCharacterHp:", error);
                            return res.status(500).json({
                                message: "Database error"
                            });
                        }

                        inventoryModel.unequipOne(itemData, (error, results) => {
                            if (error) {
                                console.error("Error unequipOne:", error);
                                return res.status(500).json({
                                    message: "Database error"
                                });
                            }

                            res.status(200).json({
                                message: "Artifact unequipped, HP adjusted",
                                inventory_id: data.inventory_id,
                                hp_reduction: hpBoost,
                                new_current_hp: newCurrentHp,
                                new_max_hp: Number(targetChar.max_hp)
                            });
                        });
                    });
                });
            });
        } else {
            // weapon/others => just unequip
            return unequipItemDirectly(data.user_id, data.inventory_id, res);
        }
    });
}

function unequipItemDirectly(userId, inventoryId, res) {
    inventoryModel.unequipOne({ user_id: userId, inventory_id: inventoryId }, (error, results) => {
        if (error) {
            console.error("Error unequipOne:", error);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.affectedRows == 0) {
            return res.status(404).json({
                message: "Item not found or already unequipped"
            });
        }

        res.status(200).json({
            message: "Item unequipped",
            inventory_id: inventoryId
        });
    });
}

//////////////////////////////////////////////////////
// USE FOOD (with character selection)
//////////////////////////////////////////////////////
module.exports.useFood = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId,
        inventory_id: Number(req.params.inventory_id),
        character_id: Number(req.params.character_id)
    }

    if (!data.inventory_id) {
        return res.status(400).json({
            message: "Invalid inventory id"
        });
    }

    if (!data.character_id) {
        return res.status(400).json({
            message: "Invalid character id"
        });
    }

    const charData = {
        user_id: data.user_id,
        user_character_id: data.character_id
    }

    characterModel.getCharacterById(charData, (error, results) => {
        if (error) {
            console.error("Error getCharacterById:", error);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (!results || results.length == 0) {
            return res.status(404).json({
                message: "Character not found"
            });
        }

        const targetChar = results[0];

        inventoryModel.getEquippedArtifactBoostForCharacter(data.character_id, (error, results) => {
            if (error) {
                console.error("Error getEquippedArtifactBoostForCharacter:", error);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            const artifactBoost = Number(results[0]?.total_hp_boost || 0);

            const foodData = {
                user_id: data.user_id,
                inventory_id: data.inventory_id
            }

            inventoryModel.getFoodByInventoryId(foodData, (error, results) => {
                if (error) {
                    console.error("Error getFoodByInventoryId:", error);
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (!results || results.length == 0) {
                    return res.status(404).json({
                        message: "Food not found"
                    });
                }

                const food = results[0];

                if (Number(food.quantity) <= 0) {
                    return res.status(400).json({
                        message: "No food quantity left"
                    });
                }

                const heal = Number(food.heal_amount || 0);

                const effectiveMaxHp = Number(targetChar.max_hp) + artifactBoost;
                const currentHp = Number(targetChar.current_hp);
                const newHp = Math.min(effectiveMaxHp, currentHp + heal);
                const healed = newHp - currentHp;

                const hpData = {
                    current_hp: newHp,
                    user_character_id: targetChar.user_character_id
                }

                characterModel.updateCharacterHp(hpData, (error) => {
                    if (error) {
                        console.error("Error updateCharacterHp:", error);
                        return res.status(500).json({
                            message: "Database error"
                        });
                    }

                    // If fully healed, update last_full_health
                    if (newHp >= effectiveMaxHp) {
                        characterModel.updateLastFullHealth(targetChar.user_character_id, () => { });
                    }

                    inventoryModel.decreaseFoodQuantity(data.inventory_id, (error) => {
                        if (error) {
                            console.error("Error decreaseFoodQuantity:", error);
                            return res.status(500).json({
                                message: "Database error"
                            });
                        }

                        inventoryModel.getFoodByInventoryId(foodData, (error, results) => {
                            if (error || !results || results.length == 0) {
                                return res.status(200).json({
                                    message: "Food used",
                                    character_name: targetChar.character_name,
                                    healed: healed,
                                    current_hp: newHp,
                                    base_max_hp: targetChar.max_hp,
                                    artifact_hp_boost: artifactBoost,
                                    effective_max_hp: effectiveMaxHp
                                });
                            }

                            if (Number(results[0].quantity) <= 0) {
                                inventoryModel.removeInventoryRow(data.inventory_id, () => {
                                    return res.status(200).json({
                                        message: "Food used",
                                        character_name: targetChar.character_name,
                                        healed: healed,
                                        current_hp: newHp,
                                        base_max_hp: targetChar.max_hp,
                                        artifact_hp_boost: artifactBoost,
                                        effective_max_hp: effectiveMaxHp,
                                        food_remaining: 0
                                    });
                                });
                            } else {
                                return res.status(200).json({
                                    message: "Food used",
                                    character_name: targetChar.character_name,
                                    healed: healed,
                                    current_hp: newHp,
                                    base_max_hp: targetChar.max_hp,
                                    artifact_hp_boost: artifactBoost,
                                    effective_max_hp: effectiveMaxHp,
                                    food_remaining: results[0].quantity
                                });
                            }
                        });
                    });
                });
            });
        });
    });
}
