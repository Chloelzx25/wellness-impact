const shopModel = require("../models/shopModel.js");
const characterModel = require("../models/characterModel.js");

// ===============================
// GET ALL SHOP ITEMS
// ===============================
module.exports.getAllItems = (req, res, next) =>
{
    // Callback for retrieving all shop items
    const callback = (error, results, fields) => {
        if (error) {
            console.error("Error getAllItems:", error);
            res.status(500).json(error);
        }
        else res.status(200).json(results);
    }

    // Fetch all items from shop
    shopModel.selectAllShopItems(callback);
}


// ===============================
// PURCHASE CHARACTER
// ===============================
module.exports.purchaseCharacter = (req, res, next) =>
{
    // Data required to identify user and character
    const data = {
        user_id: res.locals.userId,
        character_id: req.params.character_id
    }

    // Step 1: Retrieve character details
    shopModel.getCharacterById(data, (error, results) => {
        if (error) {
            console.error("Error getCharacterById:", error);
            return res.status(500).json(error);
        }
        
        // Character does not exist
        if (results.length == 0) {
            return res.status(404).json({
                message: "Character not found"
            });
        }

        const character = results[0];

        // Step 2: Check if user already owns this character
        shopModel.checkUserOwnsCharacter(data, (error, results) => {
            if (error) {
                console.error("Error checkUserOwnsCharacter:", error);
                return res.status(500).json(error);
            }
            
            if (results.length > 0) {
                return res.status(400).json({
                    message: "You already own this character"
                });
            }

            // Step 3: Retrieve user's current Mora balance
            shopModel.getUserPoints(data, (error, results) => {
                if (error) {
                    console.error("Error getUserPoints:", error);
                    return res.status(500).json(error);
                }

                const userPoints = Number(results[0].points);

                // Step 4: Ensure user has enough Mora
                if (userPoints < character.price) {
                    return res.status(403).json({
                        message: "Not enough mora",
                        required: character.price,
                        current: userPoints
                    });
                }

                // Step 5: Deduct Mora from user
                const deductData = {
                    user_id: data.user_id,
                    amount: character.price
                }

                shopModel.deductUserPoints(deductData, (error) => {
                    if (error) {
                        console.error("Error deductUserPoints:", error);
                        return res.status(500).json(error);
                    }

                    // Step 6: Add purchased character to user's collection
                    const characterData = {
                        user_id: data.user_id,
                        character_id: character.character_id,
                        character_name: character.character_name,
                        element: character.element,
                        class_type: character.class_type,
                        current_hp: character.base_hp,
                        max_hp: character.base_hp,
                        level: 1,
                        experience: 0,
                        is_equipped: false,
                        image_url: character.image_url
                    }

                    characterModel.addCharacter(characterData, (error, results) => {
                        if (error) {
                            console.error("Error addCharacter:", error);
                            return res.status(500).json(error);
                        }

                        // Purchase successful
                        res.status(201).json({
                            success: true,
                            message: `Purchased ${character.character_name}`,
                            user_character_id: results.insertId,
                            remaining_points: userPoints - character.price
                        });
                    });
                });
            });
        });
    });
}


// ===============================
// PURCHASE WEAPON
// ===============================
module.exports.purchaseWeapon = (req, res, next) =>
{
    // User and weapon identifiers
    const data = {
        user_id: res.locals.userId,
        weapon_id: req.params.weapon_id
    }

    // Step 1: Retrieve weapon details
    shopModel.getWeaponById(data, (error, results) => {
        if (error) {
            console.error("Error getWeaponById:", error);
            return res.status(500).json(error);
        }
        
        if (results.length == 0) {
            return res.status(404).json({
                message: "Weapon not found"
            });
        }

        const weapon = results[0];

        // Step 2: Retrieve user's Mora balance
        shopModel.getUserPoints(data, (error, results) => {
            if (error) {
                console.error("Error getUserPoints:", error);
                return res.status(500).json(error);
            }

            const userPoints = Number(results[0].points);

            // Step 3: Ensure sufficient Mora
            if (userPoints < weapon.price) {
                return res.status(403).json({
                    message: "Not enough mora",
                    required: weapon.price,
                    current: userPoints
                });
            }

            // Step 4: Deduct Mora
            const deductData = {
                user_id: data.user_id,
                amount: weapon.price
            }

            shopModel.deductUserPoints(deductData, (error) => {
                if (error) {
                    console.error("Error deductUserPoints:", error);
                    return res.status(500).json(error);
                }

                // Step 5: Add weapon to inventory
                const inventoryData = {
                    user_id: data.user_id,
                    item_type: "weapon",
                    item_id: weapon.weapon_id,
                    item_name: weapon.weapon_name,
                    image_url: weapon.image_url,
                    quantity: 1
                }

                shopModel.addItemToInventory(inventoryData, (error, results) => {
                    if (error) {
                        console.error("Error addItemToInventory:", error);
                        return res.status(500).json(error);
                    }

                    res.status(201).json({
                        success: true,
                        message: `Purchased ${weapon.weapon_name}`,
                        remaining_points: userPoints - weapon.price
                    });
                });
            });
        });
    });
}


// ===============================
// PURCHASE ARTIFACT
// ===============================
module.exports.purchaseArtifact = (req, res, next) =>
{
    const data = {
        user_id: res.locals.userId,
        artifact_id: req.params.artifact_id
    }

    // Step 1: Retrieve artifact details
    shopModel.getArtifactById(data, (error, results) => {
        if (error) {
            console.error("Error getArtifactById:", error);
            return res.status(500).json(error);
        }
        
        if (results.length == 0) {
            return res.status(404).json({
                message: "Artifact not found"
            });
        }

        const artifact = results[0];

        // Step 2: Retrieve user's Mora
        shopModel.getUserPoints(data, (error, results) => {
            if (error) {
                console.error("Error getUserPoints:", error);
                return res.status(500).json(error);
            }

            const userPoints = Number(results[0].points);

            // Step 3: Check Mora balance
            if (userPoints < artifact.price) {
                return res.status(403).json({
                    message: "Not enough mora",
                    required: artifact.price,
                    current: userPoints
                });
            }

            // Step 4: Deduct Mora
            const deductData = {
                user_id: data.user_id,
                amount: artifact.price
            }

            shopModel.deductUserPoints(deductData, (error) => {
                if (error) {
                    console.error("Error deductUserPoints:", error);
                    return res.status(500).json(error);
                }

                // Step 5: Add artifact to inventory
                const inventoryData = {
                    user_id: data.user_id,
                    item_type: "artifact",
                    item_id: artifact.artifact_id,
                    item_name: artifact.artifact_name,
                    image_url: artifact.image_url,
                    quantity: 1
                }

                shopModel.addItemToInventory(inventoryData, (error) => {
                    if (error) {
                        console.error("Error addItemToInventory:", error);
                        return res.status(500).json(error);
                    }

                    res.status(201).json({
                        success: true,
                        message: `Purchased ${artifact.artifact_name}`,
                        remaining_points: userPoints - artifact.price
                    });
                });
            });
        });
    });
}


// ===============================
// PURCHASE FOOD
// ===============================
module.exports.purchaseFood = (req, res, next) =>
{
    // User, food item, and quantity (default = 1)
    const data = {
        user_id: res.locals.userId,
        food_id: req.params.food_id,
        quantity: Number(req.body.quantity || 1)
    }

    // Step 1: Retrieve food details
    shopModel.getFoodById(data, (error, results) => {
        if (error) {
            console.error("Error getFoodById:", error);
            return res.status(500).json(error);
        }
        
        if (results.length == 0) {
            return res.status(404).json({
                message: "Food not found"
            });
        }

        const food = results[0];
        const totalPrice = Number(food.price) * data.quantity;

        // Step 2: Retrieve user's Mora
        shopModel.getUserPoints(data, (error, results) => {
            if (error) {
                console.error("Error getUserPoints:", error);
                return res.status(500).json(error);
            }

            const userPoints = Number(results[0].points);

            // Step 3: Ensure user has enough Mora
            if (userPoints < totalPrice) {
                return res.status(403).json({
                    message: "Not enough mora",
                    required: totalPrice,
                    current: userPoints
                });
            }

            // Step 4: Deduct Mora
            const deductData = {
                user_id: data.user_id,
                amount: totalPrice
            }

            shopModel.deductUserPoints(deductData, (error) => {
                if (error) {
                    console.error("Error deductUserPoints:", error);
                    return res.status(500).json(error);
                }

                // Step 5: Add food to inventory (quantity-based)
                const inventoryData = {
                    user_id: data.user_id,
                    item_type: "food",
                    item_id: food.food_id,
                    item_name: food.food_name,
                    image_url: food.image_url,
                    quantity: data.quantity
                }

                shopModel.addItemToInventory(inventoryData, (error) => {
                    if (error) {
                        console.error("Error addItemToInventory:", error);
                        return res.status(500).json(error);
                    }

                    res.status(201).json({
                        success: true,
                        message: `Purchased ${data.quantity}x ${food.food_name}`,
                        remaining_points: userPoints - totalPrice
                    });
                });
            });
        });
    });
}

